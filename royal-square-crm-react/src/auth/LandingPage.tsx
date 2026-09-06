import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Languages,
  Mic,
  Globe,
  Accessibility,
  Lock,
  TrendingUp,
  Building2,
  Users,
  Check,
  ChevronRight,
  Sparkles,
  BadgeCheck
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { AccountRole } from './session';

interface LandingPageProps {
  onSignIn: () => void;
  /** Open the sign-up flow, optionally with a pre-selected account type. */
  onGetStarted: (role?: AccountRole) => void;
}

/**
 * Dark, premium marketing landing page.
 *
 * Design direction from the ui-ux-pro-max skill: "Enterprise Gateway" pattern
 * (path selection — "I am a…" — with prominent trust signals), "Dark Mode (OLED)"
 * style (deep navy #020617 / #0F172A), IBM Plex Sans typography, brand gold
 * accent, and standard entrance motion (respecting prefers-reduced-motion).
 */
export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onGetStarted }) => {
  const { code, languages, setLanguage } = useI18n();

  return (
    <div
      className="rsq-landing min-h-screen bg-[#020617] text-slate-100 antialiased selection:bg-amber-400/30"
      style={{ fontFamily: "'IBM Plex Sans', 'Inter', system-ui, sans-serif" }}
    >
      {/* Ambient background glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[34rem] w-[34rem] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative">
        {/* ── Top navigation ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#020617]/80 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8" aria-label="Primary">
            <a href="#top" className="flex items-center gap-3">
              <BrandMark />
              <span className="flex flex-col leading-tight">
                <span className="font-semibold tracking-tight text-white">Royal Square Financial</span>
                <span className="text-[11px] text-slate-400">Wealth Advisory · FSP 29370</span>
              </span>
            </a>

            <div className="hidden items-center gap-7 text-sm text-slate-300 lg:flex">
              <a href="#paths" className="transition-colors hover:text-white">Who it's for</a>
              <a href="#features" className="transition-colors hover:text-white">Platform</a>
              <a href="#trust" className="transition-colors hover:text-white">Security</a>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div
                className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 pl-2.5 pr-1 py-1 sm:inline-flex"
                data-no-translate
              >
                <Languages className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <label htmlFor="landing-language" className="sr-only">Choose language</label>
                <select
                  id="landing-language"
                  value={code}
                  onChange={(e) => setLanguage(e.target.value)}
                  title="Choose your language"
                  className="cursor-pointer rounded-full bg-transparent py-0.5 pr-1 text-xs font-medium text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 [&>option]:text-slate-900"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.native}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={onSignIn}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Sign in
              </button>
              <button
                onClick={() => onGetStarted()}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-300 hover:shadow-amber-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] active:scale-[0.98]"
              >
                Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        </header>

        <main id="top">
          {/* ── Hero ─────────────────────────────────────────────────── */}
          <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-2">
            <div className="rsq-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Authorised FSP 29370 · POPIA &amp; FAIS compliant
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
                Wealth management,
                <span className="block bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                  in every language you speak.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
                One secure platform for South African families and the advisers who serve them.
                Track your portfolio, report a claim, and get answers by voice — in any of the
                11 official languages.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onGetStarted()}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] active:scale-[0.98]"
                >
                  Create your account <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={onSignIn}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-white/30 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Sign in
                </button>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                {['256-bit encryption', '11 official languages', 'Voice-first assistant'].map((t) => (
                  <li key={t} className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Portfolio preview card */}
            <div className="rsq-fade-up rsq-delay-1 relative">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-amber-400/10 blur-2xl" aria-hidden="true" />
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e1223] to-[#0b0f1e] p-6 shadow-2xl md:p-8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Total family net worth</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" /> Live
                  </span>
                </div>
                <div className="mt-2 text-4xl font-bold tracking-tight text-white" data-no-translate>R 18,450,000</div>
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> +8.4% YoY benchmark
                </p>

                <div className="mt-6 space-y-4">
                  <PreviewBar label="Investments & RA" value="R 11.2m" pct={61} tone="indigo" />
                  <PreviewBar label="Fixed assets & property" value="R 8.5m" pct={45} tone="emerald" />
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                    <Mic className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium text-white">"Zingaki izimangalo esizivulile?"</p>
                    <p className="text-xs text-slate-400">Ask by voice — reply in your language.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Path selection: I am a… ──────────────────────────────── */}
          <section id="paths" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Choose how you'll sign in</h2>
              <p className="mt-3 text-slate-400">
                One platform, two tailored experiences. Pick the one that fits you — you can create an account in seconds.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <PathCard
                icon={<Users className="h-6 w-6" aria-hidden="true" />}
                eyebrow="For clients & families"
                title="Client portal"
                description="See your whole portfolio at a glance, report a motor accident or loss, and get help by voice — built to be clear and accessible for everyone."
                bullets={['Plain-language wealth dashboard', 'Guided claim journeys', 'Comfort view: bigger text & high contrast']}
                cta="Continue as a client"
                onClick={() => onGetStarted('customer')}
              />
              <PathCard
                icon={<Building2 className="h-6 w-6" aria-hidden="true" />}
                eyebrow="For businesses & advisers"
                title="Advisory console"
                description="The institutional CRM: manage clients and portfolios, run the claims pipeline, track compliance & reminders, and onboard with server-driven forms."
                bullets={['Client 360 & claim incident hub', 'Compliance, SLAs & product providers', 'Voice agent with CRM tool-calling']}
                cta="Continue as a business"
                accent
                onClick={() => onGetStarted('business')}
              />
            </div>
          </section>

          {/* ── Features ─────────────────────────────────────────────── */}
          <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" /> Built for South Africa
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">Everything, made approachable</h2>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Mic className="h-5 w-5" aria-hidden="true" />}
                title="Multilingual voice agent"
                body="Speak to the platform in any SA language. It transcribes, acts, and replies in the same language."
              />
              <FeatureCard
                icon={<Globe className="h-5 w-5" aria-hidden="true" />}
                title="Whole-app translation"
                body="One tap translates the entire interface into any of the 11 official languages."
              />
              <FeatureCard
                icon={<Accessibility className="h-5 w-5" aria-hidden="true" />}
                title="Accessible by design"
                body="Text scaling, high-contrast comfort view, and screen-reader-friendly navigation."
              />
              <FeatureCard
                icon={<Lock className="h-5 w-5" aria-hidden="true" />}
                title="Bank-grade security"
                body="256-bit encryption, POPIA field masking, and FAIS-compliant record keeping."
              />
            </div>
          </section>

          {/* ── Trust strip ──────────────────────────────────────────── */}
          <section id="trust" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-8 md:px-8">
            <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:flex-row">
              <div className="max-w-md">
                <h3 className="text-lg font-semibold text-white">Trusted infrastructure</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Synced with the Astute Exchange and leading South African providers.
                </p>
              </div>
              <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-medium text-slate-300" data-no-translate>
                {['Astute', 'Santam', 'Allan Gray', 'Ninety One', 'Discovery'].map((name) => (
                  <li key={name} className="inline-flex items-center gap-2 text-slate-400">
                    <BadgeCheck className="h-4 w-4 text-slate-500" aria-hidden="true" /> {name}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── Final CTA ────────────────────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
            <div className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#0e1223] via-[#0b0f1e] to-[#0e1223] p-10 text-center md:p-16">
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-amber-400/5 to-indigo-500/5" />
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
                Ready when you are
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Create your account and choose whether you're joining as a client or a business.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => onGetStarted('customer')}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f1e] active:scale-[0.98]"
                >
                  I'm a client <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => onGetStarted('business')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  I'm a business <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer className="border-t border-white/5">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-slate-500 md:flex-row md:px-8">
            <span>Royal Square Financial (Pty) Ltd · FSP 29370 · 256-bit encryption · POPIA compliant</span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Licensed Financial Services Provider
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const BrandMark: React.FC = () => (
  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
  </span>
);

const PreviewBar: React.FC<{ label: string; value: string; pct: number; tone: 'indigo' | 'emerald' }> = ({ label, value, pct, tone }) => (
  <div>
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-200" data-no-translate>{value}</span>
    </div>
    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${tone === 'indigo' ? 'bg-indigo-400' : 'bg-emerald-400'}`}
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
  accent?: boolean;
  onClick: () => void;
}> = ({ icon, eyebrow, title, description, bullets, cta, accent, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col rounded-3xl border p-7 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] md:p-8 ${
      accent
        ? 'border-amber-400/30 bg-gradient-to-br from-amber-400/[0.07] to-transparent hover:border-amber-400/50 focus-visible:ring-amber-300'
        : 'border-white/10 bg-white/[0.03] hover:border-white/25 focus-visible:ring-white/40'
    } hover:-translate-y-1`}
  >
    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent ? 'bg-amber-400/15 text-amber-300' : 'bg-indigo-500/15 text-indigo-300'}`}>
      {icon}
    </span>
    <span className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">{eyebrow}</span>
    <h3 className="mt-1 text-xl font-bold text-white">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
    <ul className="mt-5 space-y-2">
      {bullets.map((b) => (
        <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" /> {b}
        </li>
      ))}
    </ul>
    <span className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${accent ? 'text-amber-300' : 'text-indigo-300'}`}>
      {cta}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </span>
  </button>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({ icon, title, body }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-amber-300">{icon}</span>
    <h3 className="mt-4 font-semibold text-white">{title}</h3>
    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{body}</p>
  </div>
);

export default LandingPage;
