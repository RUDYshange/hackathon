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
  Accessibility
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
 * Sign in / Sign up screen. Front-end only (no real auth backend yet) — it
 * validates inputs and hands the chosen role + identity back to <App/>, which
 * routes to the matching workspace. On the sign-up side the user chooses to
 * register as a Customer (client portal) or a Business (advisory console).
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
      className="grid min-h-screen bg-[#020617] text-slate-100 antialiased lg:grid-cols-[1.05fr_1fr]"
      style={{ fontFamily: "'IBM Plex Sans', 'Inter', system-ui, sans-serif" }}
    >
      {/* ── Brand / marketing panel ──────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden border-r border-white/5 bg-gradient-to-br from-[#0b0f1e] to-[#020617] p-12 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-16 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        </div>

        <div className="relative">
          <button onClick={onBack} className="flex items-center gap-3 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-semibold tracking-tight text-white">Royal Square Financial</span>
              <span className="text-[11px] text-slate-400">Wealth Advisory · FSP 29370</span>
            </span>
          </button>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
            Your wealth, your language, your way.
          </h2>
          <p className="mt-4 text-slate-400">
            Join thousands of South African families and advisers managing wealth on one secure,
            accessible platform.
          </p>
          <ul className="mt-8 space-y-4">
            <MarketingPoint icon={<Mic className="h-4 w-4" aria-hidden="true" />} text="Voice assistant in all 11 official languages" />
            <MarketingPoint icon={<Globe className="h-4 w-4" aria-hidden="true" />} text="One-tap whole-app translation" />
            <MarketingPoint icon={<Accessibility className="h-4 w-4" aria-hidden="true" />} text="Comfort view built for everyone" />
          </ul>
        </div>

        <div className="relative text-xs text-slate-500">
          256-bit encryption · POPIA &amp; FAIS compliant
        </div>
      </aside>

      {/* ── Form panel ───────────────────────────────────────────────── */}
      <main className="flex items-center justify-center px-4 py-10 md:px-8">
        <div className="w-full max-w-md">
          <button
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
          </button>

          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isSignup
              ? 'Choose your account type and set up secure access in seconds.'
              : 'Sign in to continue to your workspace.'}
          </p>

          {/* Mode tabs */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/5 p-1" role="tablist" aria-label="Authentication mode">
            <TabButton active={!isSignup} onClick={() => switchMode('signin')}>Sign in</TabButton>
            <TabButton active={isSignup} onClick={() => switchMode('signup')}>Sign up</TabButton>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            {/* Account type selector — the choice is made when registering. */}
            {isSignup && (
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300">Register as</legend>
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
                  placeholder={role === 'business' ? 'e.g. Royal Square Advisers' : 'e.g. Kagiso Mokoena'}
                  className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
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
                placeholder="you@example.co.za"
                className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
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
                className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="ml-2 text-slate-500 transition-colors hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
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
                  className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
              </Field>
            )}

            {error && (
              <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}

            {!isSignup && (
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-slate-400">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/20 bg-white/5 accent-amber-400" />
                  Remember me
                </label>
                <button type="button" className="font-medium text-amber-300 transition-colors hover:text-amber-200">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] active:scale-[0.99]"
            >
              {isSignup ? 'Create account' : 'Sign in'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <p className="text-center text-sm text-slate-400">
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
                className="font-semibold text-amber-300 transition-colors hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded"
              >
                {isSignup ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </form>

          {!isSignup && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Demo logins — tap to enter
              </p>
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => useDemo(a)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition-colors hover:border-amber-400/40 hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.role === 'business' ? 'bg-amber-400/15 text-amber-300' : 'bg-indigo-500/15 text-indigo-300'}`}>
                      {a.role === 'business' ? <Building2 className="h-4 w-4" aria-hidden="true" /> : <Users className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white">
                        {a.role === 'business' ? 'Business' : 'Customer'} · {a.name}
                      </span>
                      <span className="block truncate text-xs text-slate-400" data-no-translate>
                        {a.email} · {a.password}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Protected under POPIA &amp; FAIS
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
    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
      active ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const RoleTile: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }> = ({ active, onClick, icon, title, subtitle }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
      active
        ? 'border-amber-400/50 bg-amber-400/10'
        : 'border-white/10 bg-white/[0.03] hover:border-white/25'
    }`}
  >
    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-amber-400/20 text-amber-300' : 'bg-white/5 text-slate-300'}`}>
      {icon}
    </span>
    <span>
      <span className="block text-sm font-semibold text-white">{title}</span>
      <span className="block text-xs text-slate-400">{subtitle}</span>
    </span>
    {active && (
      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    )}
  </button>
);

const Field: React.FC<{ id: string; label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ id, label, icon, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 transition-colors focus-within:border-amber-400/50 focus-within:bg-white/[0.06]">
      <span className="text-slate-500">{icon}</span>
      {children}
    </div>
  </div>
);

const MarketingPoint: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <li className="flex items-center gap-3 text-slate-300">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-amber-300">{icon}</span>
    <span className="text-sm">{text}</span>
  </li>
);

export default AuthView;
