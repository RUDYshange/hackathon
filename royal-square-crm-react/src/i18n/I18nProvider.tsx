import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE, AppLanguage, findLanguage } from './languages';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const LANG_KEY = 'app_language';
const cacheKey = (code: string) => `app_i18n_cache_${code}`;

// How many times we retry a string before giving up (and leaving it in English).
const MAX_ATTEMPTS = 3;
// Periodic safety re-scan so nothing rendered late is ever missed.
const RESCAN_MS = 1500;

interface I18nContextValue {
  code: string;
  language: AppLanguage;
  languages: AppLanguage[];
  setLanguage: (code: string) => void;
  translating: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
};

// Elements whose text must never be machine-translated.
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'SVG', 'PATH']);

function loadCache(code: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(code)) || '{}') || {};
  } catch {
    return {};
  }
}
function saveCache(code: string, cache: Record<string, string>) {
  try {
    localStorage.setItem(cacheKey(code), JSON.stringify(cache));
  } catch {
    /* storage full / unavailable — cache stays in memory */
  }
}

// Skip whitespace-only, single chars, and strings without letters (numbers,
// currency and codes render fine untranslated and shouldn't be sent).
function isTranslatable(text: string): boolean {
  const t = text.trim();
  if (t.length < 2) return false;
  return /[A-Za-z]/.test(t);
}

function withAffixes(original: string, translatedCore: string): string {
  const leading = original.match(/^\s*/)?.[0] ?? '';
  const trailing = original.match(/\s*$/)?.[0] ?? '';
  return leading + translatedCore + trailing;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [code, setCode] = useState<string>(() => localStorage.getItem(LANG_KEY) || DEFAULT_LANGUAGE);
  const [translating, setTranslating] = useState(false);

  const codeRef = useRef(code);
  const cacheRef = useRef<Record<string, string>>(loadCache(code));

  // Per-node bookkeeping. lastSet lets us detect when React re-renders a node
  // with fresh English text (current !== what we last wrote) so we re-capture
  // the source instead of translating a stale value.
  const origText = useRef(new WeakMap<Text, string>());
  const lastSetText = useRef(new WeakMap<Text, string>());
  const origAttr = useRef(new WeakMap<Element, Record<string, string | undefined>>());
  const lastSetAttr = useRef(new WeakMap<Element, Record<string, string | undefined>>());

  const pending = useRef(new Set<string>());
  const attempts = useRef(new Map<string, number>());
  const observer = useRef<MutationObserver | null>(null);
  const inflight = useRef(false);
  const applyTimer = useRef<number | null>(null);
  const fetchTimer = useRef<number | null>(null);

  // Engine functions live in a ref so they are created once yet can call each
  // other without React dependency cycles.
  const engine = useRef({
    apply: () => {},
    scheduleFetch: () => {},
    fetchPending: async () => {},
  });

  useEffect(() => {
    // Returns a cached translation for `key`, or queues it and returns null.
    const desiredCore = (key: string): string | null => {
      const cache = cacheRef.current;
      if (cache[key] !== undefined) return cache[key];
      pending.current.add(key);
      return null;
    };

    const apply = () => {
      if (!document.body) return;
      const toEnglish = codeRef.current === DEFAULT_LANGUAGE;
      // Pause observation while we mutate so our own writes don't feed back.
      observer.current?.disconnect();

      // --- text nodes ---
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (node: Node) => {
          const parent = (node as Text).parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
          if (parent.closest('[data-no-translate]')) return NodeFilter.FILTER_REJECT;
          if (!isTranslatable(node.nodeValue || '')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      } as any);

      const textNodes: Text[] = [];
      let cur = walker.nextNode();
      while (cur) {
        textNodes.push(cur as Text);
        cur = walker.nextNode();
      }

      for (const node of textNodes) {
        const current = node.nodeValue || '';
        // If React wrote something new (not our last translation), re-capture source.
        if (lastSetText.current.get(node) !== current) {
          origText.current.set(node, current);
        }
        const orig = origText.current.get(node) ?? current;
        const key = orig.trim();
        let desired = orig;
        if (!toEnglish) {
          const coreTr = desiredCore(key);
          if (coreTr) desired = withAffixes(orig, coreTr);
        }
        if (node.nodeValue !== desired) node.nodeValue = desired;
        lastSetText.current.set(node, desired);
      }

      // --- translatable attributes (placeholder / title) ---
      const attrEls = Array.from(document.body.querySelectorAll('[placeholder], [title]'));
      for (const el of attrEls) {
        if (SKIP_TAGS.has(el.tagName)) continue;
        if (el.closest('[data-no-translate]')) continue;
        (['placeholder', 'title'] as const).forEach((attr) => {
          const currentAttr = el.getAttribute(attr);
          if (currentAttr == null) return;
          const lastMap = lastSetAttr.current.get(el) || {};
          const origMap = origAttr.current.get(el) || {};
          if (lastMap[attr] !== currentAttr) {
            origMap[attr] = currentAttr;
            origAttr.current.set(el, origMap);
          }
          const orig = origMap[attr] ?? currentAttr;
          if (!isTranslatable(orig)) return;
          const key = orig.trim();
          let desired = orig;
          if (!toEnglish) {
            const coreTr = desiredCore(key);
            if (coreTr) desired = withAffixes(orig, coreTr);
          }
          if (el.getAttribute(attr) !== desired) el.setAttribute(attr, desired);
          lastMap[attr] = desired;
          lastSetAttr.current.set(el, lastMap);
        });
      }

      observer.current?.observe(document.body, { childList: true, characterData: true, subtree: true });

      if (!toEnglish && pending.current.size > 0) engine.current.scheduleFetch();
    };

    const scheduleFetch = () => {
      if (fetchTimer.current) window.clearTimeout(fetchTimer.current);
      fetchTimer.current = window.setTimeout(() => {
        engine.current.fetchPending();
      }, 200);
    };

    const fetchPending = async () => {
      const currentCode = codeRef.current;
      if (currentCode === DEFAULT_LANGUAGE) {
        pending.current.clear();
        return;
      }
      if (inflight.current) {
        scheduleFetch();
        return;
      }

      // Build a batch, skipping strings that have failed too many times.
      const batch: string[] = [];
      for (const s of pending.current) {
        if ((attempts.current.get(s) || 0) >= MAX_ATTEMPTS) {
          cacheRef.current[s] = s; // give up: treat as identity so it stops queueing
        } else {
          batch.push(s);
        }
      }
      pending.current.clear();
      if (batch.length === 0) return;

      inflight.current = true;
      setTranslating(true);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 60000);
      try {
        const lang = findLanguage(currentCode);
        const res = await fetch(`${BASE_URL}/i18n/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: lang.name, texts: batch }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          const translations: Record<string, string> = data.translations || {};
          const cache = cacheRef.current;
          for (const s of batch) {
            if (typeof translations[s] === 'string') {
              cache[s] = translations[s];
            } else {
              // Not returned — count an attempt and re-queue for retry.
              attempts.current.set(s, (attempts.current.get(s) || 0) + 1);
              pending.current.add(s);
            }
          }
          saveCache(currentCode, cache);
          engine.current.apply();
        } else {
          // Server error — re-queue the whole batch (bounded by attempts).
          for (const s of batch) {
            attempts.current.set(s, (attempts.current.get(s) || 0) + 1);
            pending.current.add(s);
          }
        }
      } catch (err) {
        // Network/timeout — re-queue so it retries; never lose strings.
        for (const s of batch) {
          attempts.current.set(s, (attempts.current.get(s) || 0) + 1);
          pending.current.add(s);
        }
        // eslint-disable-next-line no-console
        console.warn('UI translation request failed, will retry:', err);
      } finally {
        window.clearTimeout(timeoutId);
        inflight.current = false;
        setTranslating(false);
        if (pending.current.size > 0) scheduleFetch();
      }
    };

    engine.current = { apply, scheduleFetch, fetchPending };

    // Re-translate on any DOM change (view switches, async data loads, etc.).
    // We disconnect during our own writes, and every write is idempotent
    // (lastSet + cache), so re-runs settle immediately without looping.
    const obs = new MutationObserver(() => {
      if (applyTimer.current) window.clearTimeout(applyTimer.current);
      applyTimer.current = window.setTimeout(() => engine.current.apply(), 100);
    });
    observer.current = obs;
    obs.observe(document.body, { childList: true, characterData: true, subtree: true });

    // First pass (restores a previously chosen language on reload).
    engine.current.apply();

    return () => {
      obs.disconnect();
      if (applyTimer.current) window.clearTimeout(applyTimer.current);
      if (fetchTimer.current) window.clearTimeout(fetchTimer.current);
    };
  }, []);

  // React to language changes.
  useEffect(() => {
    codeRef.current = code;
    cacheRef.current = loadCache(code);
    pending.current.clear();
    attempts.current.clear();
    try {
      localStorage.setItem(LANG_KEY, code);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = code;
    engine.current.apply();
  }, [code]);

  // Safety net: periodically re-scan while a non-English language is active, so
  // anything rendered late (or missed by the observer) still gets translated.
  useEffect(() => {
    if (code === DEFAULT_LANGUAGE) return;
    const id = window.setInterval(() => engine.current.apply(), RESCAN_MS);
    return () => window.clearInterval(id);
  }, [code]);

  const setLanguage = useCallback((c: string) => setCode(c), []);

  const value: I18nContextValue = {
    code,
    language: findLanguage(code),
    languages: LANGUAGES,
    setLanguage,
    translating,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
