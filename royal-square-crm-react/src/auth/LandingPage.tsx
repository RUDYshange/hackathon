import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Languages,
  Mic,
  Globe,
  Accessibility,
  Lock,
  Building2,
  Users,
  Check,
  ChevronRight,
  Sparkles,
  BadgeCheck,
  ArrowUpRight
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { AccountRole } from './session';

interface LandingPageProps {
  onSignIn: () => void;
  /** Open the sign-up flow, optionally with a pre-selected account type. */
  onGetStarted: (role?: AccountRole) => void;
}

/**
 * Sovereign Wealth Modern marketing landing page.
 *
 * Cohesive with both the Client Dashboard and Advisor Console:
 * - Institutional canvas: #f4f7fd
 * - Clean white cards with subtle borders: #ffffff / border-slate-200
 * - Royal Square primary blue: #1d4ed8 / #2563eb
 * - Deep navy wealth card: from-slate-900 via-slate-800 to-indigo-950
 * - Official FSP 29370 & Astute Exchange compliance indicators
 * - Authentic 4-tile Royal Square brand mark
 */
export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onGetStarted }) => {
  const { code, languages, setLanguage } = useI18n();

  return (
    <div
      className="rsq-landing min-h-screen bg-[#f4f7fd] text-slate-900 antialiased selection:bg-blue-600/10 selection:text-blue-900"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* Subtle ambient institutional background glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-blue-500/[0.04] blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[34rem] w-[34rem] rounded-full bg-indigo-500/[0.04] blur-3xl" />
      </div>

      <div className="relative">
        {/* ── Top navigation ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 md:px-8" aria-label="Primary">
            <a href="#top" className="flex items-center gap-3">
              <BrandMark />
              <span className="flex flex-col leading-tight">
                <span className="font-bold tracking-tight text-slate-900 text-sm md:text-base">Royal Square Financial</span>
                <span className="text-[11px] font-medium text-slate-500">Wealth Advisory · FSP 29370</span>
              </span>
            </a>

            <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
              <a href="#paths" className="transition-colors hover:text-blue-600">Who it's for</a>
              <a href="#features" className="transition-colors hover:text-blue-600">Platform</a>
              <a href="#trust" className="transition-colors hover:text-blue-600">Security &amp; Insurers</a>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Astute Exchange Live Badge matching Advisor & Client views */}
              <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                Live · FSP 29370
              </span>

              {/* Language Selector */}
              <div
                className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 pl-2.5 pr-1 py-1 sm:inline-flex"
                data-no-translate
              >
                <Languages className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <label htmlFor="landing-language" className="sr-only">Choose language</label>
                <select
                  id="landing-language"
                  value={code}
                  onChange={(e) => setLanguage(e.target.value)}
                  title="Choose your language"
                  className="cursor-pointer rounded-full bg-transparent py-0.5 pr-1 text-xs font-semibold text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&>option]:text-slate-900"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.native}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={onSignIn}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Sign in
              </button>
              <button
                onClick={() => onGetStarted()}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        </header>

        <main id="top">
          {/* ── Hero ─────────────────────────────────────────────────── */}
          <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 md:px-8 md:pb-24 md:pt-16 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
                Authorised FSP 29370 · POPIA &amp; FAIS Compliant
              </span>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Wealth management,
                <span className="block bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 bg-clip-text text-transparent">
                  in every language you speak.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                One secure platform for South African families and the advisers who serve them.
                Track your portfolio, report a claim, and get answers by voice — in any of the
                11 official languages.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onGetStarted()}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 active:scale-[0.98]"
                >
                  Create your account <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={onSignIn}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  Sign in
                </button>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                {['256-bit encryption', '11 official languages', 'Voice-first assistant', 'Astute Exchange synced'].map((t) => (
                  <li key={t} className="inline-flex items-center gap-2 font-medium">
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Showcase Portfolio card — styled exactly like the Client Dashboard's Net Worth Card */}
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-blue-600/10 blur-2xl" aria-hidden="true" />
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-2">
                    Total Family Net Worth
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-bold tracking-wide text-white">
                      VERIFIED
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-400/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" /> Live · Astute
                  </span>
                </div>

                <div className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-white" data-no-translate>
                  R 18,450,000
                </div>

                <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> +8.4% FAIS Tier YoY High-Wealth Benchmark
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Includes primary residence, offshore &amp; RA. Liabilities deducted. Updated via Astute Exchange.
                </p>

                <div className="mt-6 space-y-3.5 border-t border-slate-700/60 pt-5">
                  <PreviewBar label="Investments & RA (Allan Gray, Ninety One)" value="R 11.2m" pct={61} tone="blue" />
                  <PreviewBar label="Fixed assets & property" value="R 8.5m" pct={45} tone="emerald" />
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                    <Mic className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium text-white">"Zingaki izimangalo esizivulile?"</p>
                    <p className="text-xs text-slate-400">Ask by voice in Zulu, Sotho, Afrikaans or English.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Path selection: I am a… ──────────────────────────────── */}
          <section id="paths" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Choose how you'll sign in</h2>
              <p className="mt-3 text-slate-600">
                One platform, two tailored experiences. Pick the one that fits you — you can create an account in seconds.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <PathCard
                icon={<Users className="h-6 w-6" aria-hidden="true" />}
                eyebrow="For clients &amp; families"
                title="Client portal"
                description="See your whole portfolio at a glance, report a motor accident or loss, and get help by voice — built to be clear and accessible for everyone."
                bullets={[
                  'Plain-language wealth dashboard & verified valuations',
                  'Guided claim journeys with instant incident reference',
                  'Comfort view: text scaling (A / A+ / A++) & high contrast',
                  'Multilingual voice assistant with full-app translation'
                ]}
                cta="Continue as a client"
                tone="blue"
                onClick={() => onGetStarted('customer')}
              />

              <PathCard
                icon={<Building2 className="h-6 w-6" aria-hidden="true" />}
                eyebrow="For businesses &amp; advisers"
                title="Advisory console"
                description="The institutional CRM: manage clients and portfolios, run the claims pipeline, track compliance &amp; reminders, and onboard with server-driven forms."
                bullets={[
                  'Client 360 & claim incident hub with provider dispatch',
                  'Compliance, SLAs, product providers & Astute sync',
                  'Reminders, reviews & POPIA data protection audits',
                  'Voice agent with CRM tool-calling & workflow automation'
                ]}
                cta="Continue as a business"
                tone="indigo"
                onClick={() => onGetStarted('business')}
              />
            </div>
          </section>

          {/* ── Features ─────────────────────────────────────────────── */}
          <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" /> Built for South Africa
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Everything, made approachable</h2>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Mic className="h-5 w-5" aria-hidden="true" />}
                iconColor="text-blue-600 bg-blue-50"
                title="Multilingual voice agent"
                body="Speak to the platform in any SA language. It transcribes, acts, and replies in the same language."
              />
              <FeatureCard
                icon={<Globe className="h-5 w-5" aria-hidden="true" />}
                iconColor="text-emerald-600 bg-emerald-50"
                title="Whole-app translation"
                body="One tap translates the entire interface into any of the 11 official languages."
              />
              <FeatureCard
                icon={<Accessibility className="h-5 w-5" aria-hidden="true" />}
                iconColor="text-indigo-600 bg-indigo-50"
                title="Accessible by design"
                body="Text scaling, high-contrast comfort view, and screen-reader-friendly navigation."
              />
              <FeatureCard
                icon={<Lock className="h-5 w-5" aria-hidden="true" />}
                iconColor="text-amber-600 bg-amber-50"
                title="Bank-grade security"
                body="256-bit encryption, POPIA field masking, and FAIS-compliant record keeping."
              />
            </div>
          </section>

          {/* ── Trust strip ──────────────────────────────────────────── */}
          <section id="trust" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-8 md:px-8">
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm md:flex-row">
              <div className="max-w-md">
                <h3 className="text-lg font-bold text-slate-900">Trusted institutional infrastructure</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Synced with the Astute Financial Exchange and leading South African product providers.
                </p>
              </div>
              <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-medium text-slate-700" data-no-translate>
                {['Astute Exchange', 'Sanlam', 'Santam', 'Allan Gray', 'Ninety One', 'Discovery'].map((name) => (
                  <li key={name} className="inline-flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-blue-600" aria-hidden="true" /> {name}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── Final CTA ────────────────────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-10 text-center md:p-16 text-white shadow-xl border border-slate-800">
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600/10 to-indigo-500/10" />
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
                Ready when you are
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Create your account and choose whether you're joining as a client or a business.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => onGetStarted('customer')}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  I'm a client <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => onGetStarted('business')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  I'm a business <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-slate-500 md:flex-row md:px-8">
            <span>Royal Square Financial (Pty) Ltd · FSP 29370 · 256-bit encryption · POPIA compliant</span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" /> Licensed Financial Services Provider
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

/**
 * 4-tile Royal Square brand mark matching the Advisor Console rail.
 */
const BrandMark: React.FC = () => (
  <div className="brand-mark" aria-hidden="true">
    <i />
    <i />
    <i />
    <i />
  </div>
);

const PreviewBar: React.FC<{ label: string; value: string; pct: number; tone: 'blue' | 'emerald' }> = ({ label, value, pct, tone }) => (
  <div>
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-300 font-medium">{label}</span>
      <span className="font-semibold text-white" data-no-translate>{value}</span>
    </div>
    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${tone === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  </div>
);

const PathCard: React.FC<{
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  cta: string;
  tone: 'blue' | 'indigo';
  onClick: () => void;
}> = ({ icon, eyebrow, title, description, bullets, cta, tone, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col justify-between rounded-2xl border p-7 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:p-8 bg-white ${
      tone === 'indigo'
        ? 'border-slate-200/90 hover:border-indigo-300 hover:shadow-md focus-visible:ring-indigo-500'
        : 'border-slate-200/90 hover:border-blue-300 hover:shadow-md focus-visible:ring-blue-500'
    }`}
  >
    <div>
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          tone === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
        }`}
      >
        {icon}
      </span>
      <span className="mt-5 block text-xs font-bold uppercase tracking-wider text-slate-500">{eyebrow}</span>
      <h3 className="mt-1 text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      <ul className="mt-5 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /> {b}
          </li>
        ))}
      </ul>
    </div>

    <span
      className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${
        tone === 'indigo' ? 'text-indigo-600 group-hover:text-indigo-700' : 'text-blue-600 group-hover:text-blue-700'
      }`}
    >
      {cta}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </span>
  </button>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; iconColor: string; title: string; body: string }> = ({
  icon,
  iconColor,
  title,
  body,
}) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-slate-300">
    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColor}`}>{icon}</span>
    <h3 className="mt-4 font-bold text-slate-900 text-base">{title}</h3>
    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
  </div>
);

export default LandingPage;
