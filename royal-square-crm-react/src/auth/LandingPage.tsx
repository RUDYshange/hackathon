import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Languages,
  Mic,
  Accessibility,
  Lock,
  TrendingUp,
  Building2,
  Users,
  Check,
  ChevronRight,
  Sparkles,
  BadgeCheck,
  Zap,
  Car,
  FileText,
  Activity,
  UserCheck
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { AccountRole } from './session';

export interface LandingPageProps {
  onSignIn: () => void;
  /** Open the sign-up flow, optionally with a pre-selected account type. */
  onGetStarted: (role?: AccountRole) => void;
  /** Direct 1-tap workspace launch into client portal or advisor console */
  onLaunchWorkspace?: (role: AccountRole) => void;
}

/**
 * Dark, premium marketing landing page.
 *
 * Aligned with both workspaces:
 * - Client Portal: Sipho Dlamini (CLI-1024), R 18.45M net worth, accident/loss reporting,
 *   comfort view (font scaling & high contrast), 11-language voice assistant.
 * - Advisory Console: Qiniso Ntuli (FSP 29370), Client 360, Claims pipeline,
 *   Insurer API Gateway (Sanlam, Santam, Discovery, Old Mutual) with live integration log.
 */
export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onGetStarted,
  onLaunchWorkspace,
}) => {
  const { code, languages, setLanguage } = useI18n();
  const [activePreview, setActivePreview] = useState<'client' | 'advisor'>('client');

  const handleLaunch = (role: AccountRole) => {
    if (onLaunchWorkspace) {
      onLaunchWorkspace(role);
    } else {
      onGetStarted(role);
    }
  };

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
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#020617]/85 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 md:px-8" aria-label="Primary">
            <a href="#top" className="flex items-center gap-3">
              <BrandMark />
              <span className="flex flex-col leading-tight">
                <span className="font-semibold tracking-tight text-white">Royal Square Financial</span>
                <span className="text-[11px] text-slate-400">Wealth Advisory · FSP 29370</span>
              </span>
            </a>

            <div className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
              <a href="#paths" className="transition-colors hover:text-white">Who it's for</a>
              <button
                type="button"
                onClick={() => {
                  setActivePreview('client');
                  document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="transition-colors hover:text-amber-300"
              >
                Client Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePreview('advisor');
                  document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="transition-colors hover:text-amber-300"
              >
                Advisor Console
              </button>
              <a href="#features" className="transition-colors hover:text-white">Platform</a>
              <a href="#trust" className="transition-colors hover:text-white">Security &amp; Insurers</a>
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

              {/* Direct 1-tap fast workspace buttons */}
              <button
                onClick={() => handleLaunch('customer')}
                title="Launch Client Portal as Sipho Dlamini"
                className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-400/20"
              >
                <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Client Demo
              </button>

              <button
                onClick={() => handleLaunch('business')}
                title="Launch Advisor Console as Qiniso Ntuli"
                className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20"
              >
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                Advisor Demo
              </button>

              <button
                onClick={onSignIn}
                className="rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Sign in
              </button>

              <button
                onClick={() => onGetStarted()}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-300 hover:shadow-amber-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] active:scale-[0.98]"
              >
                Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        </header>

        <main id="top">
          {/* ── Hero ─────────────────────────────────────────────────── */}
          <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 md:px-8 md:pb-24 md:pt-16 lg:grid-cols-2">
            <div className="rsq-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Authorised FSP 29370 · FAIS &amp; POPIA Compliant · Astute Exchange
              </span>

              <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
                Wealth management,
                <span className="block bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                  for clients &amp; advisors.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
                One unified platform connecting South African families and licensed advisors.
                Explore the <strong>Client Portal</strong> with database client <em>Sipho Dlamini</em> (net worth R 18.45m, digital claims &amp; 11-language voice), or enter the institutional <strong>Advisor Console</strong> with <em>Qiniso Ntuli</em> (FSP 29370) with live Insurer API sync.
              </p>

              {/* Direct 1-tap launch buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleLaunch('customer')}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] active:scale-[0.98]"
                >
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                  Launch Client Portal <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  onClick={() => handleLaunch('business')}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-5 py-3 text-sm font-semibold text-indigo-200 transition-colors hover:border-indigo-400 hover:bg-indigo-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  <Building2 className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                  Launch Advisor Console
                </button>

                <button
                  onClick={onSignIn}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-white/30 hover:bg-white/5"
                >
                  Sign in
                </button>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                {[
                  'Live DB Client: Sipho Dlamini',
                  'FSP 29370 Practice Console',
                  'Sanlam, Santam, Discovery, OM API Gateway',
                  '11 Official SA Languages & Voice',
                ].map((t) => (
                  <li key={t} className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Interactive Live Dual-Tab Preview Card ───────────────── */}
            <div id="preview-section" className="rsq-fade-up rsq-delay-1 relative">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-amber-400/10 blur-2xl" aria-hidden="true" />

              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e1223] to-[#0b0f1e] p-5 shadow-2xl md:p-7">
                {/* Switchable workspace preview tabs */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex rounded-full bg-white/5 p-1">
                    <button
                      onClick={() => setActivePreview('client')}
                      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                        activePreview === 'client'
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      Client Portal
                    </button>
                    <button
                      onClick={() => setActivePreview('advisor')}
                      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                        activePreview === 'advisor'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Advisor Console
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" /> Live Preview
                  </span>
                </div>

                {/* ── Client Portal Tab Content ── */}
                {activePreview === 'client' ? (
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-wider text-amber-300">
                          Client: Sipho Dlamini · CLI-1024
                        </span>
                        <div className="text-3xl font-bold tracking-tight text-white mt-0.5" data-no-translate>
                          R 18,450,000
                        </div>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
                          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> +8.4% YoY benchmark
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase">Assigned Advisor</span>
                        <div className="text-xs font-semibold text-slate-200">Qiniso Ntuli</div>
                        <div className="text-[10px] text-slate-400">FSP 29370</div>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <PreviewBar label="Liquid Assets & RA" value="R 3.25m" pct={40} tone="indigo" />
                      <PreviewBar label="Offshore Wealth Portfolio" value="R 5.80m" pct={65} tone="emerald" />
                      <PreviewBar label="Risk Cover (Life, Disability)" value="R 22.0m" pct={90} tone="amber" />
                    </div>

                    {/* Quick Claims Feature Highlight */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-left">
                        <Car className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
                        <div>
                          <div className="text-xs font-medium text-white">Report Accident</div>
                          <div className="text-[10px] text-slate-400">Guided photo upload</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-left">
                        <FileText className="h-4 w-4 text-indigo-400 shrink-0" aria-hidden="true" />
                        <div>
                          <div className="text-xs font-medium text-white">Report Loss</div>
                          <div className="text-[10px] text-slate-400">Theft &amp; damage claims</div>
                        </div>
                      </div>
                    </div>

                    {/* Voice & Accessibility Highlight */}
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                          <Mic className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-xs font-medium text-white">"Zingaki izimangalo esizivulile?"</p>
                          <p className="text-[10px] text-slate-400">Ask in Zulu, Xhosa, Afrikaans or English</p>
                        </div>
                      </div>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                        Comfort view
                      </span>
                    </div>

                    <button
                      onClick={() => handleLaunch('customer')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-300 active:scale-[0.99]"
                    >
                      Open Live Client Portal as Sipho Dlamini <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  /* ── Advisor Console Tab Content ── */
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-300">
                          Practice Director: Qiniso Ntuli
                        </span>
                        <div className="text-3xl font-bold tracking-tight text-white mt-0.5" data-no-translate>
                          R 142.8M
                        </div>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-slate-300">
                          <Activity className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" /> Assets Under Advisory (FSP 29370)
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
                          <div className="text-sm font-bold text-white">64</div>
                          <div className="text-[9px] text-slate-400 uppercase">Clients</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
                          <div className="text-sm font-bold text-amber-400">8</div>
                          <div className="text-[9px] text-slate-400 uppercase">Claims</div>
                        </div>
                      </div>
                    </div>

                    {/* Insurer Gateway Provider Badges */}
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                          Insurer API Gateway: Real-Time Sync
                        </span>
                        <span className="text-[10px] text-emerald-300 font-mono">Gateway Online</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-medium" data-no-translate>
                        <span className="rounded bg-white/10 px-2 py-0.5 text-slate-200">Sanlam API</span>
                        <span className="rounded bg-white/10 px-2 py-0.5 text-slate-200">Discovery</span>
                        <span className="rounded bg-white/10 px-2 py-0.5 text-slate-200">Santam</span>
                        <span className="rounded bg-white/10 px-2 py-0.5 text-slate-200">Old Mutual</span>
                      </div>
                    </div>

                    {/* Live Integration Log Table */}
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                      <div className="border-b border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Live Provider Integration Log
                      </div>
                      <div className="divide-y divide-white/5 text-[11px] font-mono">
                        <div className="flex items-center justify-between px-3 py-1.5">
                          <span className="text-amber-300">CLM-0012 (S. Dlamini)</span>
                          <span className="text-slate-300">Sanlam</span>
                          <span className="text-emerald-400">✅ Received (SNL-2026-00417)</span>
                        </div>
                        <div className="flex items-center justify-between px-3 py-1.5">
                          <span className="text-amber-300">CLM-0013 (S. Dlamini)</span>
                          <span className="text-slate-300">Old Mutual</span>
                          <span className="text-emerald-400">✅ Received (OM-2026-08821)</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLaunch('business')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500 active:scale-[0.99]"
                    >
                      Open Live Advisor Console as Qiniso Ntuli <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Path selection: I am a… ──────────────────────────────── */}
          <section id="paths" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Choose how you'll explore Royal Square
              </h2>
              <p className="mt-3 text-slate-400">
                Tailored experiences for clients and advisory teams. Launch directly into either workspace to test live features.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <PathCard
                icon={<Users className="h-6 w-6" aria-hidden="true" />}
                eyebrow="For Clients &amp; Families"
                title="Client Wealth &amp; Claims Portal"
                description="Experience wealth management built for everyday South Africans. Features real database client Sipho Dlamini with live portfolio metrics, self-service claims, and accessibility."
                bullets={[
                  'Live portfolio view (R 18.45M net worth & asset allocation)',
                  'Self-service claims: Motor accident & loss/theft with photo uploads',
                  'Comfort view: Text zoom (A- / A+) and High Contrast mode',
                  'Multilingual voice assistant answering in all 11 SA languages'
                ]}
                cta="Launch Client Portal (Sipho Dlamini)"
                secondaryCta="Sign up as a client"
                onPrimaryClick={() => handleLaunch('customer')}
                onSecondaryClick={() => onGetStarted('customer')}
              />

              <PathCard
                icon={<Building2 className="h-6 w-6" aria-hidden="true" />}
                eyebrow="For Practice Directors &amp; Advisors"
                title="Institutional Advisory Console"
                description="The complete advisory CRM for licensed FSPs. Review Client 360 data, triage open claims, and dispatch claims to Sanlam, Santam, Discovery, and Old Mutual with live integration logs."
                bullets={[
                  'Client 360: Full wealth breakdowns, risk policies & KYC data',
                  'Claims pipeline: Direct triage and incident resolution',
                  'Insurer API Gateway: Sanlam, Discovery, Santam & Old Mutual sync',
                  'Live integration log with provider reference generation & FAIS compliance'
                ]}
                cta="Launch Advisor Console (Qiniso Ntuli)"
                secondaryCta="Sign up as an advisor"
                accent
                onPrimaryClick={() => handleLaunch('business')}
                onSecondaryClick={() => onGetStarted('business')}
              />
            </div>
          </section>

          {/* ── Features ─────────────────────────────────────────────── */}
          <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" /> Built for South African Financial Services
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
                Dual Capabilities for Clients &amp; Advisors
              </h2>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Mic className="h-5 w-5" aria-hidden="true" />}
                title="Multilingual voice agent"
                body="Speak to the platform in any SA language. It transcribes, executes CRM commands, and replies naturally."
              />
              <FeatureCard
                icon={<Zap className="h-5 w-5" aria-hidden="true" />}
                title="Insurer API Gateway"
                body="Sync claims directly with Sanlam, Discovery, Santam, and Old Mutual, generating verified provider reference IDs."
              />
              <FeatureCard
                icon={<Accessibility className="h-5 w-5" aria-hidden="true" />}
                title="Accessible Comfort View"
                body="Built with text scaling (A- / A+) and high-contrast modes for effortless viewing by seniors and visually impaired clients."
              />
              <FeatureCard
                icon={<Lock className="h-5 w-5" aria-hidden="true" />}
                title="Bank-grade security"
                body="256-bit encryption, POPIA field masking, and FAIS-compliant audit logs for licensed FSP 29370 practices."
              />
            </div>
          </section>

          {/* ── Trust strip ──────────────────────────────────────────── */}
          <section id="trust" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-8 md:px-8">
            <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:flex-row">
              <div className="max-w-md">
                <h3 className="text-lg font-semibold text-white">Insurer &amp; Exchange Ecosystem</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Integrated with leading South African underwriters and the Astute Financial Exchange.
                </p>
              </div>
              <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-medium text-slate-300" data-no-translate>
                {['Sanlam', 'Santam', 'Discovery', 'Old Mutual', 'Allan Gray', 'Astute'].map((name) => (
                  <li key={name} className="inline-flex items-center gap-2 text-slate-300">
                    <BadgeCheck className="h-4 w-4 text-amber-400" aria-hidden="true" /> {name}
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
                Ready to explore Royal Square?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Experience either side of the platform with 1-click demo access, or create an account with your own credentials.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => handleLaunch('customer')}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 active:scale-[0.98]"
                >
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                  Launch Client Portal (Sipho Dlamini)
                </button>
                <button
                  onClick={() => handleLaunch('business')}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-400/50 bg-indigo-500/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-indigo-300 hover:bg-indigo-500/20"
                >
                  <Building2 className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                  Launch Advisor Console (Qiniso Ntuli)
                </button>
                <button
                  onClick={() => onGetStarted()}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5"
                >
                  Create Custom Account <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /> Licensed Financial Services Provider
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

const PreviewBar: React.FC<{
  label: string;
  value: string;
  pct: number;
  tone: 'indigo' | 'emerald' | 'amber';
}> = ({ label, value, pct, tone }) => {
  const barColor =
    tone === 'indigo' ? 'bg-indigo-400' : tone === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400';

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-slate-200" data-no-translate>{value}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const PathCard: React.FC<{
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  cta: string;
  secondaryCta: string;
  accent?: boolean;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
}> = ({
  icon,
  eyebrow,
  title,
  description,
  bullets,
  cta,
  secondaryCta,
  accent,
  onPrimaryClick,
  onSecondaryClick,
}) => (
  <div
    className={`group relative flex flex-col justify-between rounded-3xl border p-7 text-left transition-all md:p-8 ${
      accent
        ? 'border-indigo-400/30 bg-gradient-to-br from-indigo-500/[0.08] via-transparent to-amber-400/[0.03] hover:border-indigo-400/50'
        : 'border-amber-400/25 bg-gradient-to-br from-amber-400/[0.06] via-transparent to-indigo-500/[0.03] hover:border-amber-400/40'
    }`}
  >
    <div>
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent ? 'bg-indigo-500/15 text-indigo-300' : 'bg-amber-400/15 text-amber-300'}`}>
        {icon}
      </span>
      <span className="mt-5 block text-xs font-semibold uppercase tracking-wider text-slate-400">{eyebrow}</span>
      <h3 className="mt-1 text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
      <ul className="mt-5 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" /> {b}
          </li>
        ))}
      </ul>
    </div>

    <div className="mt-8 flex flex-col gap-2.5">
      <button
        onClick={onPrimaryClick}
        className={`inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all shadow-md active:scale-[0.98] ${
          accent
            ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
            : 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-500/20'
        }`}
      >
        {cta}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        onClick={onSecondaryClick}
        className="text-center text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
      >
        Or {secondaryCta.toLowerCase()} →
      </button>
    </div>
  </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({ icon, title, body }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-amber-300">{icon}</span>
    <h3 className="mt-4 font-semibold text-white">{title}</h3>
    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{body}</p>
  </div>
);

export default LandingPage;
