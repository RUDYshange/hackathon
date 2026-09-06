import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Users,
  Building2,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Check,
  Globe,
  Mic,
  Accessibility,
  Sparkles
} from 'lucide-react';
import type { AccountRole } from './session';
import { DEMO_ACCOUNTS, verifyCredentials, emailExists, registerAccount, findAccount } from './accounts';

type Mode = 'signin' | 'signup';

interface AuthViewProps {
  initialMode: Mode;
  initialRole?: AccountRole;
  onBack: () => void;
  onAuthenticated: (role: AccountRole, name: string, email: string) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sovereign Wealth Modern Sign-in & Sign-up screen.
 *
 * Cohesive with Landing Page, Client Dashboard, and Advisor Console:
 * - Canvas: #f4f7fd institutional background
 * - Left marketing panel: Deep navy gradient matching the Client Dashboard Net Worth card
 * - Right form panel: Clean white card with slate-200 borders and royal blue primary accents
 * - Authentic 4-tile Royal Square brand mark
 */
export const AuthView: React.FC<AuthViewProps> = ({ initialMode, initialRole, onBack, onAuthenticated }) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [role, setRole] = useState<AccountRole>(initialRole ?? 'customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (isSignup) {
      if (!name.trim()) {
        setError(role === 'business' ? 'Please enter your business or adviser name.' : 'Please enter your full name.');
        return;
      }
      if (password.length < 8) {
        setError('Your password must be at least 8 characters.');
        return;
      }
      if (password !== confirm) {
        setError("Those passwords don't match.");
        return;
      }
      if (emailExists(email)) {
        setError('An account with that email already exists — try signing in.');
        return;
      }
      const displayName = name.trim();
      registerAccount({ role, name: displayName, email: email.trim(), password });
      onAuthenticated(role, displayName, email.trim());
      return;
    }

    // Sign in — verify against demo + locally registered accounts.
    const acc = verifyCredentials(email, password);
    if (acc) {
      onAuthenticated(acc.role, acc.name, acc.email);
      return;
    }
    setError(
      findAccount(email)
        ? 'Incorrect password. Please try again.'
        : 'No account found for that email. Use a demo account below, or sign up.'
    );
  };

  const useDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setError(null);
    setEmail(acc.email);
    setPassword(acc.password);
    setRole(acc.role);
    onAuthenticated(acc.role, acc.name, acc.email);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  return (
    <div
      className="grid min-h-screen bg-[#f4f7fd] text-slate-900 antialiased lg:grid-cols-[1fr_1.1fr]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* ── Left brand / marketing panel (matches Client & Advisor navy aesthetic) ──────────────── */}
      <aside className="relative hidden overflow-hidden border-r border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-12 lg:flex lg:flex-col lg:justify-between text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-16 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative">
          <button onClick={onBack} className="flex items-center gap-3 text-left transition hover:opacity-90">
            <div className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            <span className="flex flex-col leading-tight">
              <span className="font-bold tracking-tight text-white text-base">Royal Square Financial</span>
              <span className="text-[11px] font-medium text-slate-400">Wealth Advisory · FSP 29370</span>
            </span>
          </button>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3.5 py-1 text-xs font-semibold text-indigo-300">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
            Authorised FSP 29370 · Astute Exchange
          </span>

          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white">
            Your wealth, your language, your way.
          </h2>

          <p className="mt-4 text-slate-300 leading-relaxed text-sm">
            Join South African families and accredited advisers managing private wealth, claims, and compliance on one unified platform.
          </p>

          <ul className="mt-8 space-y-3.5">
            <MarketingPoint
              icon={<Mic className="h-4 w-4" aria-hidden="true" />}
              text="Voice assistant in all 11 official languages"
            />
            <MarketingPoint
              icon={<Globe className="h-4 w-4" aria-hidden="true" />}
              text="Whole-app instantaneous translation"
            />
            <MarketingPoint
              icon={<Accessibility className="h-4 w-4" aria-hidden="true" />}
              text="Comfort view with text scaling & high contrast"
            />
            <MarketingPoint
              icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
              text="Astute Exchange & Insurer API Gateway synced"
            />
          </ul>
        </div>

        <div className="relative text-xs text-slate-400">
          256-bit encryption · POPIA &amp; FAIS compliant · FSP Licence 29370
        </div>
      </aside>

      {/* ── Right Form panel ───────────────────────────────────────────────── */}
      <main className="flex items-center justify-center px-4 py-10 md:px-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 p-7 md:p-8 shadow-sm">
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 rounded"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
          </button>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            {isSignup
              ? 'Choose your account type and set up secure access in seconds.'
              : 'Sign in to continue to your Royal Square workspace.'}
          </p>

          {/* Mode tabs */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-slate-200 bg-slate-100 p-1" role="tablist" aria-label="Authentication mode">
            <TabButton active={!isSignup} onClick={() => switchMode('signin')}>Sign in</TabButton>
            <TabButton active={isSignup} onClick={() => switchMode('signup')}>Sign up</TabButton>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {/* Account type selector — when registering */}
            {isSignup && (
              <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Register as</legend>
                <div className="grid grid-cols-2 gap-3">
                  <RoleTile
                    active={role === 'customer'}
                    onClick={() => setRole('customer')}
                    icon={<Users className="h-5 w-5" aria-hidden="true" />}
                    title="Customer"
                    subtitle="Client portal"
                  />
                  <RoleTile
                    active={role === 'business'}
                    onClick={() => setRole('business')}
                    icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
                    title="Business"
                    subtitle="Advisory console"
                  />
                </div>
              </fieldset>
            )}

            {isSignup && (
              <Field
                id="auth-name"
                label={role === 'business' ? 'Business / adviser name' : 'Full name'}
                icon={<UserIcon className="h-4 w-4" aria-hidden="true" />}
              >
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder={role === 'business' ? 'e.g. Royal Square Advisers' : 'e.g. Sipho Dlamini'}
                  className="w-full bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </Field>
            )}

            <Field id="auth-email" label="Email address" icon={<Mail className="h-4 w-4" aria-hidden="true" />}>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@royalsquare.co.za"
                className="w-full bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </Field>

            <Field id="auth-password" label="Password" icon={<Lock className="h-4 w-4" aria-hidden="true" />}>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder="At least 8 characters"
                className="w-full bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="ml-2 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none rounded"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </Field>

            {isSignup && (
              <Field id="auth-confirm" label="Confirm password" icon={<Lock className="h-4 w-4" aria-hidden="true" />}>
                <input
                  id="auth-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className="w-full bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </Field>
            )}

            {error && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
                {error}
              </p>
            )}

            {!isSignup && (
              <div className="flex items-center justify-between text-sm pt-1">
                <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  Remember me
                </label>
                <button type="button" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.99]"
            >
              {isSignup ? 'Create account' : 'Sign in'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <p className="text-center text-sm text-slate-600 pt-1">
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
                className="font-semibold text-blue-600 transition-colors hover:text-blue-700 focus:outline-none rounded"
              >
                {isSignup ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </form>

          {!isSignup && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Demo logins — tap to sign in
              </p>
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => useDemo(a)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.role === 'business' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                      {a.role === 'business' ? <Building2 className="h-4 w-4" aria-hidden="true" /> : <Users className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {a.role === 'business' ? 'Business' : 'Customer'} · {a.name}
                      </span>
                      <span className="block truncate text-xs font-mono text-slate-500" data-no-translate>
                        {a.email} · {a.password}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" /> Protected under POPIA &amp; FAIS (FSP 29370)
          </p>
        </div>
      </main>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all focus:outline-none ${
      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
    }`}
  >
    {children}
  </button>
);

const RoleTile: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}> = ({ active, onClick, icon, title, subtitle }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`relative flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all focus:outline-none ${
      active
        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
        : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
    }`}
  >
    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
      {icon}
    </span>
    <span>
      <span className="block text-sm font-bold text-slate-900">{title}</span>
      <span className="block text-xs text-slate-500">{subtitle}</span>
    </span>
    {active && (
      <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
        <Check className="h-3 w-3" aria-hidden="true" />
      </span>
    )}
  </button>
);

const Field: React.FC<{ id: string; label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ id, label, icon, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
      {label}
    </label>
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
      <span className="text-slate-400">{icon}</span>
      {children}
    </div>
  </div>
);

const MarketingPoint: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <li className="flex items-center gap-3 text-slate-200">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-300">{icon}</span>
    <span className="text-sm font-medium">{text}</span>
  </li>
);

export default AuthView;
