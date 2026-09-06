import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Send, X, Bot, Loader2, Sparkles, Info } from 'lucide-react';
import { getCsrfToken, generateToken } from '../security/csrf';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface AssistantAction {
  tool: string;
  ok: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  language?: string | null;
  actions?: AssistantAction[];
  pending?: boolean;
}

interface AssistantResponse {
  transcript?: string;
  language?: string | null;
  reply?: string;
  actions?: AssistantAction[];
  error?: string;
  detail?: string;
}

// Pick a mime type the browser can actually record.
function pickMimeType(): { mimeType: string; filename: string } {
  const candidates: Array<{ mimeType: string; filename: string }> = [
    { mimeType: 'audio/webm;codecs=opus', filename: 'audio.webm' },
    { mimeType: 'audio/webm', filename: 'audio.webm' },
    { mimeType: 'audio/ogg;codecs=opus', filename: 'audio.ogg' },
    { mimeType: 'audio/mp4', filename: 'audio.mp4' },
  ];
  if (typeof MediaRecorder !== 'undefined') {
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported(c.mimeType)) return c;
    }
  }
  return { mimeType: '', filename: 'audio.webm' };
}

export const VoiceAssistant: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Release the microphone if the component unmounts mid-recording.
  useEffect(() => {
    return () => stopStream();
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function buildHistory(): Array<{ role: string; content: string }> {
    return messages
      .filter((m) => !m.pending && m.content)
      .map((m) => ({ role: m.role, content: m.content }));
  }

  async function postTurn(body: FormData | string, isJson: boolean) {
    setLoading(true);
    setError(null);
    const headers: Record<string, string> = {
      'X-CSRF-Token': getCsrfToken(),
      'X-Idempotency-Key': generateToken(),
    };
    if (isJson) headers['Content-Type'] = 'application/json';

    // Bound the wait so a slow/stuck request gives a clear message rather than
    // hanging forever or surfacing a raw browser network error.
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch(`${BASE_URL}/assistant/voice`, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
      const data: AssistantResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || `Assistant unavailable (${res.status}).`);
        return;
      }
      if (data.error) {
        setError(data.error);
        // Still surface a transcript if one came back.
        if (data.transcript) {
          setMessages((prev) => [...prev, { role: 'user', content: data.transcript as string, language: data.language }]);
        }
        return;
      }

      setMessages((prev) => {
        const next = [...prev];
        if (data.transcript) {
          next.push({ role: 'user', content: data.transcript, language: data.language });
        }
        next.push({
          role: 'assistant',
          content: data.reply || '…',
          language: data.language,
          actions: data.actions,
        });
        return next;
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('The assistant took too long to respond. Please try a shorter request.');
      } else {
        // Surface the real cause in the console for debugging; keep the UI message actionable.
        console.error('Voice assistant request failed:', err);
        setError('Could not reach the assistant. Check that the backend is running on port 8000, then try again.');
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const { mimeType, filename } = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size === 0) {
          setError('No audio captured. Please try again.');
          return;
        }
        const form = new FormData();
        form.append('audio', blob, filename);
        form.append('history', JSON.stringify(buildHistory()));
        postTurn(form, false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err: any) {
      setError(
        err?.name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow it in your browser to speak.'
          : 'Could not access the microphone.'
      );
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  function toggleRecording() {
    if (loading) return;
    recording ? stopRecording() : startRecording();
  }

  function sendText(e?: React.FormEvent) {
    e?.preventDefault();
    const text = textInput.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setTextInput('');
    postTurn(JSON.stringify({ text, history: buildHistory() }), true);
  }

  return (
    <>
      <button
        className={`va-fab ${open ? 'va-fab-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close assistant' : 'Open voice assistant'}
        title="Voice assistant"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      {open && (
        <section className="va-panel" role="dialog" aria-label="Royal Square voice assistant">
          <header className="va-header">
            <div className="va-header-title">
              <span className="va-header-icon"><Sparkles size={15} /></span>
              <div>
                <b>Royal Assistant</b>
                <span>Speak any SA language</span>
              </div>
            </div>
            <button className="va-icon-btn" onClick={() => setOpen(false)} aria-label="Close">
              <X size={16} />
            </button>
          </header>

          <div className="va-messages" ref={scrollRef}>
            {messages.length === 0 && !loading && (
              <div className="va-empty">
                <Bot size={26} />
                <p>Hold the mic and ask in your language.</p>
                <span>
                  “How many open claims do we have?” · “Wys my Sipho se profiel” · “Yenza isikhumbuzi”
                </span>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`va-msg va-msg-${m.role}`} data-no-translate>
                <div className="va-bubble">{m.content}</div>
                {m.actions && m.actions.length > 0 && (
                  <div className="va-actions">
                    {m.actions.map((a, j) => (
                      <span key={j} className={`va-chip ${a.ok ? 'ok' : 'fail'}`}>
                        {a.ok ? '✓' : '✕'} {a.tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="va-msg va-msg-assistant">
                <div className="va-bubble va-thinking">
                  <Loader2 size={15} className="va-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="va-error"><Info size={13} /> {error}</div>
          )}

          <form className="va-input" onSubmit={sendText}>
            <button
              type="button"
              className={`va-mic ${recording ? 'recording' : ''}`}
              onClick={toggleRecording}
              disabled={loading}
              aria-label={recording ? 'Stop recording' : 'Start recording'}
              title={recording ? 'Stop and send' : 'Hold to speak'}
            >
              {recording ? <Square size={16} /> : <Mic size={16} />}
            </button>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={recording ? 'Listening…' : 'Type or tap the mic'}
              disabled={recording || loading}
              aria-label="Message"
            />
            <button type="submit" className="va-send" disabled={!textInput.trim() || loading} aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </section>
      )}
    </>
  );
};

export default VoiceAssistant;
