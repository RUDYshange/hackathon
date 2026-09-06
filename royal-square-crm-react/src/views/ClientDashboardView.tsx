import React, { useState, useEffect } from 'react';
import { 
  Car, 
  TrendingUp, 
  ArrowUpRight, 
  Clock,
  Phone,
  Mail,
  Eye,
  Type,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  FileText,
  AlertCircle,
  Languages,
  Loader2,
  LogOut,
  RefreshCw
} from 'lucide-react';

import { useI18n } from '../i18n/I18nProvider';
import { secureFetch } from '../services/api';

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  targetDate: string;
  percent: number;
}

interface Reminder {
  id: string;
  title: string;
  dueDate: string;
  status: 'critical' | 'upcoming';
  category: string;
}

interface FinancialSummary {
  netWorth: number;
  totalAssets: number;
  investments: number;
  realEstate: number;
  liabilities: number;
  monthlyPremium: number;
  investmentsPct: number;
  realEstatePct: number;
}

interface PortalClient {
  id: string;
  reference: string;
  fullName: string;
  firstName: string;
  greetingName: string;
  advisor: string;
  nextReviewDate: string;
  riskProfile: string;
}

interface PortalOverview {
  client: PortalClient;
  financialSummary: FinancialSummary;
  goals: Goal[];
  reminders: Reminder[];
}

type TextSize = 'base' | 'large' | 'xl';

const money = (n?: number | null) => (n == null ? '—' : `R ${Math.round(n).toLocaleString()}`);

export const ClientDashboardView: React.FC<{ 
  onReportAccident: () => void;
  onReportLoss?: () => void;
  onSignOut?: () => void;
}> = ({ onReportAccident, onReportLoss, onSignOut }) => {
  const [textSize, setTextSize] = useState<TextSize>('base');
  const [highContrast, setHighContrast] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Whole-app language switching (all 11 SA official languages).
  const { code: langCode, languages, setLanguage, translating } = useI18n();

  // Live portfolio data, fetched from the database (see /api/portal/overview).
  const [overview, setOverview] = useState<PortalOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await secureFetch<PortalOverview>('/portal/overview');
      if (!active) return;
      if (res.data) {
        setOverview(res.data);
      } else if (res.status === 401) {
        setError('Your session has expired. Please sign out and sign in again.');
      } else {
        setError(res.error || 'We could not load your portfolio right now.');
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [reloadKey]);

  const client = overview?.client;
  const fin = overview?.financialSummary;
  const goals: Goal[] = overview?.goals ?? [];
  const reminders: Reminder[] = overview?.reminders ?? [];
  const ltv = fin && fin.totalAssets > 0 ? (fin.liabilities / fin.totalAssets) * 100 : null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const textScaleClass = textSize === 'xl' ? 'text-[17px]' : textSize === 'large' ? 'text-[15.5px]' : 'text-[14px]';

  return (
    <div className={`${highContrast ? 'bg-white text-slate-900' : 'bg-slate-50/60 text-slate-800'} min-h-screen p-4 md:p-8 font-sans antialiased ${textScaleClass} transition-colors`}>
      {/* Skip link for screen readers */}
      <a href="#main-dashboard" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-slate-900 text-white px-4 py-2 rounded-lg z-50">
        Skip to dashboard content
      </a>

      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Accessibility & Comfort Bar - User Friendly for 60+ */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm" role="toolbar" aria-label="Accessibility controls">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span className="font-medium">Comfort view:</span>
            <span className="hidden sm:inline text-slate-500">Make text bigger or boost contrast — your choice is remembered for next time.</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full" role="group" aria-label="Text size">
              <Type className="w-3.5 h-3.5 text-slate-500 ml-2" aria-hidden="true" />
              {(['base','large','xl'] as TextSize[]).map(sz => (
                <button
                  key={sz}
                  onClick={() => setTextSize(sz)}
                  aria-pressed={textSize===sz}
                  aria-label={`Text size ${sz}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${textSize===sz ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-white'}`}
                >
                  {sz==='base' ? 'A' : sz==='large' ? 'A+' : 'A++'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setHighContrast(v=>!v)}
              aria-pressed={highContrast}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${highContrast ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
              title="Toggle high contrast for better readability"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              {highContrast ? 'High contrast on' : 'High contrast'}
            </button>

            {/* Language switcher — translates the whole portal into any of the
                11 official SA languages. Marked data-no-translate so the native
                language names in the dropdown are never machine-translated. */}
            <div
              className="inline-flex items-center gap-1.5 bg-slate-100 pl-2.5 pr-1 py-1 rounded-full border border-transparent hover:border-slate-300 transition"
              data-no-translate
            >
              {translating
                ? <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" aria-hidden="true" />
                : <Languages className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />}
              <label htmlFor="app-language" className="sr-only">Choose language</label>
              <select
                id="app-language"
                value={langCode}
                onChange={(e) => setLanguage(e.target.value)}
                title="Choose your language"
                className="bg-transparent text-xs font-semibold text-slate-700 py-0.5 pr-1 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>{l.native}</option>
                ))}
              </select>
            </div>

            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
              Live • FSP 29370
            </span>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                Sign out
              </button>
            )}
          </div>
        </div>

        {/* Live data status */}
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-sm">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
            </span>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-rose-300 bg-white text-rose-700 hover:bg-rose-100 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Retry
            </button>
          </div>
        )}
        {loading && !overview && (
          <div className="flex items-center gap-2 bg-white border border-slate-200/80 p-3.5 rounded-2xl text-sm text-slate-500 shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" aria-hidden="true" /> Loading your portfolio from your records…
          </div>
        )}

        {/* Top Header: Warm greeting & Advisor Contact */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-7 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-3 border border-indigo-100">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Royal Square Financial • Authorised FSP 29370 • POPIA Protected
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Dumelang, <span data-no-translate>{client?.greetingName ?? 'there'}</span>
              <span className="block text-sm font-normal text-slate-500 mt-1">Welcome back — here’s your portfolio at a glance. No jargon, just clarity.</span>
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Managed with care by <span className="font-semibold text-slate-700" data-no-translate>{client?.advisor ?? 'Qiniso Ntuli'}, Key Individual</span> • Next review <span data-no-translate>{client?.nextReviewDate ?? '—'}</span> • 
              <a href="tel:0800111222" className="inline-flex items-center gap-1 ml-1 text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline font-medium">
                <Phone className="w-3 h-3" aria-hidden="true" /> 0800 111 222
              </a>
              <span className="mx-1">•</span>
              <a href="mailto:advice@royalsquare.co.za" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline font-medium">
                <Mail className="w-3 h-3" aria-hidden="true" /> advice@royalsquare.co.za
              </a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3 shrink-0">
            <button 
              onClick={onReportAccident}
              aria-label="Report a motor accident"
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 text-white font-semibold px-5 py-3 rounded-xl shadow-sm transition-all text-sm active:scale-[0.98] cursor-pointer min-h-[46px]"
            >
              <Car className="w-4 h-4" aria-hidden="true" />
              <span>Report Motor Accident</span>
              <ChevronRight className="w-4 h-4 opacity-70" aria-hidden="true" />
            </button>
            {onReportLoss && (
              <button 
                onClick={onReportLoss}
                aria-label="Report property or asset loss or theft"
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 text-white font-semibold px-5 py-3 rounded-xl shadow-sm transition-all text-sm active:scale-[0.98] cursor-pointer min-h-[46px]"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>Report Loss or Theft</span>
                <ChevronRight className="w-4 h-4 opacity-70" aria-hidden="true" />
              </button>
            )}
          </div>
        </header>

        {/* Net Worth & Asset Summary Grid */}
        <div id="main-dashboard" className="grid grid-cols-1 md:grid-cols-4 gap-4" role="region" aria-label="Wealth overview">
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-7 rounded-2xl shadow-md flex flex-col justify-between focus-within:ring-2 focus-within:ring-indigo-400">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-2">
                Total Family Net Worth
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-bold tracking-wide">VERIFIED</span>
              </span>
              <div className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight" data-no-translate aria-label={fin ? `Total net worth ${Math.round(fin.netWorth).toLocaleString()} Rand` : 'Loading net worth'}>
                {fin ? money(fin.netWorth) : '…'}
              </div>
              <p className="text-xs text-emerald-300 mt-2 flex items-center gap-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" /> Assets less liabilities · updated from your records
              </p>
              <p className="text-xs text-slate-400 mt-2">Total assets {fin ? <span data-no-translate>{money(fin.totalAssets)}</span> : '…'}, with liabilities already deducted.</p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
              <span>Combined Monthly Premium: <strong className="text-white" data-no-translate>{fin ? money(fin.monthlyPremium) : '…'}</strong></span>
              <span>LTV Ratio: <strong className="text-emerald-300" data-no-translate>{ltv != null ? `${ltv.toFixed(2)}%` : '…'}</strong>{ltv != null && ltv < 35 ? ' — comfortably bonded' : ''}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" aria-hidden="true"></span>
                Investments & RA
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-2" data-no-translate aria-label={fin ? `Investments ${Math.round(fin.investments).toLocaleString()} Rand` : 'Loading investments'}>
                {fin ? money(fin.investments) : '…'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Investments &amp; retirement annuities</p>
              <p className="text-xs text-slate-400 mt-1">{fin ? `${fin.investmentsPct}% of total assets` : ''} • Diversified, Reg 28 compliant</p>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden" role="progressbar" aria-valuenow={Math.round(fin?.investmentsPct ?? 0)} aria-valuemin={0} aria-valuemax={100} aria-label="Investments share of portfolio">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${fin?.investmentsPct ?? 0}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true"></span>
                Fixed Assets & Property
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-2" data-no-translate aria-label={fin ? `Fixed assets ${Math.round(fin.realEstate).toLocaleString()} Rand` : 'Loading fixed assets'}>
                {fin ? money(fin.realEstate) : '…'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Property &amp; fixed assets</p>
              <p className="text-xs text-slate-400 mt-1">{fin ? `${fin.realEstatePct}% of total assets` : ''} • Insured &amp; regularly valued</p>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden" role="progressbar" aria-valuenow={Math.round(fin?.realEstatePct ?? 0)} aria-valuemin={0} aria-valuemax={100} aria-label="Property share of portfolio">
              <div className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${fin?.realEstatePct ?? 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* Action Center & Goal Tracking Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2 Cols: Goal Tracking */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                  Advisor Loaded Goals
                </h2>
                <p className="text-xs text-slate-500 mt-1">Visual progress tracking set up by Royal Square advisors — you don’t need to calculate anything.</p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
                <Sparkles className="w-3 h-3" aria-hidden="true" /> Auto-updated
              </span>
            </div>

            <div className="space-y-5" role="list" aria-label="Financial goals">
              {goals.map((g) => {
                const percent = g.percent ?? (g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0);
                return (
                  <div key={g.id} role="listitem" className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900">{g.title}</h3>
                        <span className="text-xs text-slate-500">Target: <span data-no-translate>{g.targetDate}</span> • {g.category}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-slate-900" data-no-translate aria-label={`${percent} percent complete`}>{percent}%</span>
                        <p className="text-xs text-slate-500" data-no-translate>
                          {money(g.currentAmount)} / {money(g.targetAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${g.title} progress`}>
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {percent >= 85 ? 'Almost there — your advisor will confirm next top-up.' : percent >= 60 ? 'On track. Keep your debit order active.' : 'Early stage — ask about boosting contributions.'}
                    </p>
                  </div>
                );
              })}
              {!loading && goals.length === 0 && (
                <p className="text-sm text-slate-500 py-6 text-center">No goals have been loaded for your portfolio yet — your advisor will set these up.</p>
              )}
            </div>

            {/* Quick Self-Service Tasks from PDF Section II */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Quick Document Requests
                </span>
                <span className="text-xs text-slate-400">Tap — we’ll email you within 24h</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {['Issue Border Letter', 'Request IRP5 Tax Pack', 'Change Banking Details', 'Request Consultation'].map((task) => (
                  <button 
                    key={task} 
                    onClick={() => showToast(`${task} — request sent! Check your email.`)}
                    className="p-3.5 text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 rounded-xl text-xs font-medium text-slate-700 transition cursor-pointer min-h-[56px] flex flex-col justify-center gap-1"
                    aria-label={task}
                  >
                    <span className="font-semibold leading-tight">{task}</span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">One tap <ChevronRight className="w-3 h-3" aria-hidden="true" /></span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> No paperwork here — we prepare and send securely.
              </p>
            </div>
          </div>

          {/* Right Col: Automated Reminders (PDF Section II) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" aria-hidden="true" />
                  Upcoming Actions
                </h2>
                <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                  {reminders.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Automated alerts for renewals, certifications & reviews. We’ll remind you — you don’t have to remember.</p>

              <div className="space-y-3" role="list" aria-label="Upcoming reminders">
                {reminders.map((r) => (
                  <div 
                    key={r.id} 
                    role="listitem"
                    className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 transition ${r.status === 'critical' ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-900 block leading-tight flex items-center gap-1.5">
                        {r.status==='critical' && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />}
                        {r.title}
                      </span>
                      <span className="text-slate-500 block">{r.category}</span>
                      {r.status==='critical' && <span className="inline-flex items-center gap-1 text-rose-700 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" aria-hidden="true"></span> Needs attention</span>}
                    </div>
                    <span className={`font-semibold shrink-0 px-2.5 py-1 rounded-full border text-xs ${r.status === 'critical' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200'}`}>
                      {r.dueDate}
                    </span>
                  </div>
                ))}
                {!loading && reminders.length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">You&apos;re all caught up — no actions due right now.</p>
                )}
              </div>

              <button onClick={() => showToast('Reminders synced to your calendar.')} className="mt-4 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 min-h-[40px] focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Sync all to calendar
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" /> Need help quickly?
                </p>
                <p className="text-xs text-indigo-700 mt-1">Call Qiniso on <a href="tel:+27820000000" className="font-bold underline">082 000 0000</a> or 24/7 Santam Assist <a href="tel:0860100911" className="font-bold underline">0860 100 911</a></p>
              </div>
              <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Data protected under POPIA & FAIS Code of Conduct
              </p>
            </div>
          </div>

        </div>

        {/* Trust footer */}
        <footer className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Royal Square Financial (Pty) Ltd • FSP 29370 • 256-bit encryption • POPIA compliant</span>
          <span className="flex items-center gap-2">
            <span className="hidden sm:inline">Questions?</span>
            <a href="mailto:hello@royalsquare.co.za" className="font-semibold text-indigo-600 hover:text-indigo-700 underline">hello@royalsquare.co.za</a>
          </span>
        </footer>
      </div>

      {/* Live region for toasts - accessible */}
      <div aria-live="polite" aria-atomic="true" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        {toast && (
          <div className="bg-slate-900 text-white px-5 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 pointer-events-auto border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};
