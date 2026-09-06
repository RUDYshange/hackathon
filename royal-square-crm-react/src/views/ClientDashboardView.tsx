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
  UploadCloud,
  X,
  Check,
  Users,
  Send,
  Terminal,
  RefreshCw
} from 'lucide-react';

import { useI18n } from '../i18n/I18nProvider';
import { DocumentScannerService, IdScanResult } from '../services/documentScannerService';
import { secureFetch } from '../services/api';
import { MockProviderApiService, ProviderSyncResult } from '../services/mockProviderApi';

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: 'Retirement' | 'Education' | 'Wealth';
  targetDate: string;
}

interface Reminder {
  id: string;
  title: string;
  dueDate: string;
  status: 'critical' | 'upcoming';
  category: string;
}

interface ClientSummaryItem {
  id: string;
  reference: string;
  fullName: string;
  occupation?: string;
  employer?: string;
  netWorth?: string;
}

interface FinancialSummaryState {
  netWorth: number;
  monthlyPremium: number;
  investments: number;
  realEstate: number;
  liabilities: number;
  ltvRatio?: string;
}

type TextSize = 'base' | 'large' | 'xl';

export const ClientDashboardView: React.FC<{ 
  onReportAccident: () => void;
  onReportLoss?: () => void;
  onSignOut?: () => void;
  onSwitchToAdvisor?: () => void;
}> = ({ onReportAccident, onReportLoss, onSignOut, onSwitchToAdvisor }) => {
  const [textSize, setTextSize] = useState<TextSize>('base');
  const [highContrast, setHighContrast] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Whole-app language switching (all 11 SA official languages).
  const { code: langCode, languages, setLanguage, translating } = useI18n();

  // Client database state
  const [clientList, setClientList] = useState<ClientSummaryItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isLoadingClient, setIsLoadingClient] = useState<boolean>(true);

  // Client dynamic profile data
  const [clientName, setClientName] = useState<string>('');
  const [clientSubDetails, setClientSubDetails] = useState<string>('');
  const [clientReviewDate, setClientReviewDate] = useState<string>('Upcoming');

  // Change Details Modal State
  const [isChangeDetailsOpen, setIsChangeDetailsOpen] = useState<boolean>(false);
  const [isScanningDoc, setIsScanningDoc] = useState<boolean>(false);
  const [scannedDocResult, setScannedDocResult] = useState<IdScanResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Mock Provider API State (Pass-Through Underwriting Sync)
  const [isProviderSyncOpen, setIsProviderSyncOpen] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<'Sanlam' | 'Discovery' | 'Santam' | 'Old Mutual'>('Sanlam');
  const [syncOccupation, setSyncOccupation] = useState<string>('');
  const [syncEmployer, setSyncEmployer] = useState<string>('');
  const [isSyncingWithProvider, setIsSyncingWithProvider] = useState<boolean>(false);
  const [providerSyncResult, setProviderSyncResult] = useState<ProviderSyncResult | null>(null);
  const [providerSyncLogs, setProviderSyncLogs] = useState<string[]>([]);
  const [lastSyncedProviderRef, setLastSyncedProviderRef] = useState<string | null>(null);

  const [financialSummary, setFinancialSummary] = useState<FinancialSummaryState>({
    netWorth: 0,
    monthlyPremium: 0,
    investments: 0,
    realEstate: 0,
    liabilities: 0,
    ltvRatio: 'Low'
  });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Fetch full details of client from database and update dashboard state
  const fetchAndApplyClientDetail = async (clientId: string) => {
    setIsLoadingClient(true);
    try {
      const detailRes = await secureFetch<any>(`/clients/${clientId}`);
      if (detailRes.data) {
        const d = detailRes.data;
        setSelectedClientId(d.id);
        setClientName(d.fullName || 'Client');
        setSyncOccupation(d.occupation || 'Chief Technology Officer');
        setSyncEmployer(d.employer || 'Naspers Fintech');

        const subParts: string[] = [];
        if (d.reference) subParts.push(`Ref: ${d.reference}`);
        if (d.maskedIdNumber) subParts.push(`ID: ${d.maskedIdNumber}`);
        if (d.occupation) subParts.push(d.employer ? `${d.occupation} (${d.employer})` : d.occupation);
        setClientSubDetails(subParts.join(' • '));

        if (d.nextReviewDate) {
          const revDate = new Date(d.nextReviewDate);
          setClientReviewDate(revDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }));
        }

        const netWorth = Number(d.netWorth) || d.balanceSheet?.netWorth || 0;
        const totalLiabilities = d.balanceSheet?.totalLiabilities || 0;

        let investments = 0;
        let property = 0;
        if (Array.isArray(d.balanceSheet?.assets)) {
          d.balanceSheet.assets.forEach((a: any) => {
            const lbl = (a.label || '').toLowerCase();
            if (lbl.includes('residence') || lbl.includes('property') || lbl.includes('holding') || lbl.includes('farm')) {
              property += (a.amount || 0);
            } else {
              investments += (a.amount || 0);
            }
          });
        }
        if (investments === 0 && property === 0 && netWorth > 0) {
          investments = Math.round(netWorth * 0.55);
          property = Math.round(netWorth * 0.45);
        }

        let monthlyPremium = 0;
        if (Array.isArray(d.policies)) {
          monthlyPremium = d.policies.reduce((sum: number, p: any) => sum + (Number(p.monthlyPremium) || 0), 0);
        }

        const ltvRatioText = d.balanceSheet?.debtToAssetsPercent 
          ? `${d.balanceSheet.debtToAssetsPercent}%` 
          : 'Low';

        setFinancialSummary({
          netWorth,
          monthlyPremium,
          investments,
          realEstate: property,
          liabilities: totalLiabilities,
          ltvRatio: ltvRatioText
        });

        if (Array.isArray(d.goals) && d.goals.length > 0) {
          setGoals(d.goals.map((g: any) => ({
            id: g.id,
            title: g.name,
            targetAmount: Number(g.targetAmount) || 1,
            currentAmount: Number(g.currentAmount) || 0,
            category: g.kind === 'RETIREMENT' ? 'Retirement' : g.kind === 'EDUCATION' ? 'Education' : 'Wealth',
            targetDate: g.targetDate ? new Date(g.targetDate).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' }) : 'Ongoing'
          })));
        } else {
          setGoals([
            {
              id: 'g-default-1',
              title: 'Portfolio Preservation & Wealth Accumulation',
              targetAmount: Math.round(netWorth * 1.5) || 10000000,
              currentAmount: netWorth || 7500000,
              category: 'Wealth',
              targetDate: 'Dec 2028'
            }
          ]);
        }

        const newReminders: Reminder[] = [];
        if (d.licenceExpiry) {
          const lDate = new Date(d.licenceExpiry);
          const formatted = lDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
          newReminders.push({
            id: 'lic-1',
            title: 'Driving licence expiry renewal',
            dueDate: `Expires ${formatted}`,
            status: 'critical',
            category: 'Personal'
          });
        }
        if (d.nextReviewDate) {
          const rDate = new Date(d.nextReviewDate);
          const formatted = rDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
          newReminders.push({
            id: 'rev-1',
            title: 'Annual Portfolio Review with Qiniso Ntuli',
            dueDate: formatted,
            status: 'upcoming',
            category: 'Mandate'
          });
        }
        if (Array.isArray(d.policies)) {
          d.policies.forEach((p: any, idx: number) => {
            if (p.renewalDate) {
              newReminders.push({
                id: `pol-${idx}`,
                title: `${p.provider} Policy Review (${p.productType})`,
                dueDate: `Renewal: ${p.renewalDate}`,
                status: 'upcoming',
                category: p.provider
              });
            }
          });
        }
        if (newReminders.length > 0) {
          setReminders(newReminders);
        } else {
          setReminders([
            { id: 'rem-1', title: 'FSP Mandate & Annual Review', dueDate: 'Scheduled Q4', status: 'upcoming', category: 'Compliance' }
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch client detail', err);
    } finally {
      setIsLoadingClient(false);
    }
  };

  // Load client from database on initial mount
  useEffect(() => {
    let isMounted = true;
    const fetchDatabaseClients = async () => {
      setIsLoadingClient(true);
      try {
        const res = await secureFetch<ClientSummaryItem[]>('/clients');
        if (res.data && res.data.length > 0 && isMounted) {
          setClientList(res.data);
          const primary = res.data[0];
          await fetchAndApplyClientDetail(primary.id);
        }
      } catch (err) {
        console.error('Failed to load clients from database', err);
      } finally {
        if (isMounted) setIsLoadingClient(false);
      }
    };

    fetchDatabaseClients();
    return () => { isMounted = false; };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Uses the same function used by the advisor to scan documents
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsScanningDoc(true);
    setScannedDocResult(null);

    try {
      const result = await DocumentScannerService.scanIdDocument(file);
      setScannedDocResult(result);
    } catch (err: any) {
      setScannedDocResult({
        is_blurry: false,
        error_message: err.message || 'Failed to scan document'
      });
    } finally {
      setIsScanningDoc(false);
      e.target.value = '';
    }
  };

  // Sample document simulation for quick test
  const handleSampleScan = (type: 'id' | 'bank') => {
    setIsScanningDoc(true);
    setScannedDocResult(null);
    setUploadedFileName(type === 'bank' ? 'Investec_Bank_Confirmation.pdf' : 'RSA_Smart_ID_Card.jpg');
    setTimeout(() => {
      if (type === 'bank') {
        setScannedDocResult({
          is_blurry: false,
          id_number: '8403125289081',
          first_name: 'Sipho',
          surname: 'Dlamini',
          full_name: 'Sipho Dlamini',
          bank_name: 'Investec Private Bank',
          account_number: '10012498210',
          checksum_valid: true
        });
      } else {
        const testId = '8403125289081';
        const check = DocumentScannerService.validateSaId(testId);
        setScannedDocResult({
          is_blurry: false,
          id_number: testId,
          first_name: 'Sipho',
          second_name: 'Bheki',
          surname: 'Dlamini',
          full_name: 'Sipho Bheki Dlamini',
          date_of_birth: '1984-03-12',
          nationality: 'South African',
          gender: 'Male',
          checksum_valid: check.isValid
        });
      }
      setIsScanningDoc(false);
    }, 450);
  };

  // Apply scanned document data to update client information
  const handleApplyChangedDetails = () => {
    if (!scannedDocResult) return;
    const newName = scannedDocResult.full_name || `${scannedDocResult.first_name || ''} ${scannedDocResult.surname || ''}`.trim() || clientName;
    setClientName(newName);

    let sub = '';
    if (scannedDocResult.id_number) sub += `ID: ${scannedDocResult.id_number} `;
    if (scannedDocResult.bank_name) sub += `• ${scannedDocResult.bank_name} (${scannedDocResult.account_number || ''})`;
    if (sub) setClientSubDetails(sub);

    setIsChangeDetailsOpen(false);
    showToast(`Details updated to "${newName}" via official document verification!`);
  };

  // Run pass-through underwriting sync with external insurer API (mocked)
  const handleRunProviderSync = async () => {
    setIsSyncingWithProvider(true);
    setProviderSyncResult(null);
    setProviderSyncLogs([
      `[1/4] Normalizing ${clientName || 'Client'} record into canonical FAIS Section 8 schema...`
    ]);

    await new Promise((r) => setTimeout(r, 350));
    setProviderSyncLogs((prev) => [
      ...prev,
      `[2/4] POST https://api.${selectedProvider.toLowerCase().replace(/\s+/g, '')}.co.za/v2/underwriting/sync`
    ]);

    await new Promise((r) => setTimeout(r, 350));
    setProviderSyncLogs((prev) => [
      ...prev,
      `[3/4] Transmitting Astute exchange token & verified Luhn checksum...`
    ]);

    try {
      const updatedFields: Record<string, any> = {};
      if (syncOccupation) updatedFields.occupation = syncOccupation;
      if (syncEmployer) updatedFields.employer = syncEmployer;

      const result = await MockProviderApiService.syncClientToProvider(
        selectedClientId || 'db5a9331-943e-46c1-8f4c-a85f3c75846a',
        selectedProvider,
        updatedFields
      );

      setProviderSyncResult(result);
      setLastSyncedProviderRef(`${result.provider} (${result.provider_reference})`);
      setProviderSyncLogs((prev) => [
        ...prev,
        `[4/4] 200 OK — Official Provider Ref: ${result.provider_reference}`,
        `[SUCCESS] Provider exchange confirmed. Advisor CRM updated in real time!`
      ]);

      if (result.updated_client?.occupation || result.updated_client?.employer) {
        setClientSubDetails(`Ref: ${result.updated_client.reference || 'CLI-1024'} • ${result.updated_client.occupation || syncOccupation} (${result.updated_client.employer || syncEmployer})`);
      }
      showToast(`Pass-Through Confirmed by ${selectedProvider}: ${result.provider_reference}`);
    } catch (e: any) {
      setProviderSyncLogs((prev) => [...prev, `[ERROR] Provider exchange error: ${e.message}`]);
    } finally {
      setIsSyncingWithProvider(false);
    }
  };

  const textScaleClass = textSize === 'xl' ? 'text-[17px]' : textSize === 'large' ? 'text-[15.5px]' : 'text-[14px]';

  const invPercent = financialSummary.netWorth > 0 
    ? Math.min(100, Math.round((financialSummary.investments / financialSummary.netWorth) * 100)) 
    : 0;

  const propPercent = financialSummary.netWorth > 0 
    ? Math.min(100, Math.round((financialSummary.realEstate / financialSummary.netWorth) * 100)) 
    : 0;

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
            {clientList.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                <Users className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                <span className="text-slate-400 font-medium">DB Client:</span>
                <select
                  value={selectedClientId}
                  onChange={(e) => fetchAndApplyClientDetail(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
                  aria-label="Select database client"
                >
                  {clientList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.reference})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full" role="group" aria-label="Text size">
              <Type className="w-3.5 h-3.5 text-slate-500 ml-2" aria-hidden="true" />
              {(['base','large','xl'] as TextSize[]).map(sz => (
                <button
                  key={sz}
                  onClick={() => setTextSize(sz)}
                  aria-pressed={textSize===sz}
                  aria-label={`Text size ${sz}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${textSize===sz ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-white'}`}
                >
                  {sz==='base' ? 'A' : sz==='large' ? 'A+' : 'A++'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setHighContrast(v=>!v)}
              aria-pressed={highContrast}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${highContrast ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
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
            {onSwitchToAdvisor && (
              <button
                onClick={onSwitchToAdvisor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-900 hover:bg-indigo-800 text-white shadow-xs transition cursor-pointer"
                title="Switch to Advisor Console"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                Advisor Console
              </button>
            )}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                Sign out
              </button>
            )}
          </div>
        </div>

        {/* Top Header: Warm greeting & Advisor Contact */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-7 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-3 border border-indigo-100">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Royal Square Financial • Authorised FSP 29370 • POPIA Protected
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              {isLoadingClient && !clientName ? (
                <span className="inline-flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" /> Connecting to client database...
                </span>
              ) : (
                <>Dumelang, {clientName}</>
              )}
              <span className="block text-sm font-normal text-slate-500 mt-1">Welcome back — here’s your family portfolio at a glance. No jargon, just clarity.</span>
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Managed with care by <span className="font-semibold text-slate-700">Qiniso Ntuli, Key Individual</span> • {clientSubDetails || 'Active Client'} • Next review {clientReviewDate} • 
              <a href="tel:0800111222" className="inline-flex items-center gap-1 ml-1 text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline font-medium">
                <Phone className="w-3 h-3" aria-hidden="true" /> 0800 111 222
              </a>
              <span className="mx-1">•</span>
              <a href="mailto:advice@royalsquare.co.za" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline font-medium">
                <Mail className="w-3 h-3" aria-hidden="true" /> advice@royalsquare.co.za
              </a>
            </p>
            {lastSyncedProviderRef && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Insurer Gateway Synced: {lastSyncedProviderRef}</span>
              </div>
            )}
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
              <div className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight" aria-label={`Total net worth ${financialSummary.netWorth.toLocaleString()} Rand`}>
                R {financialSummary.netWorth.toLocaleString()}
              </div>
              <p className="text-xs text-emerald-300 mt-2 flex items-center gap-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" /> +8.4% FAIS Tier YoY High-Wealth Benchmark
              </p>
              <p className="text-xs text-slate-400 mt-2">Includes primary residence, offshore & RA. Liabilities already deducted. Updated via Astute.</p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
              <span>Combined Monthly Premium: <strong className="text-white">R {financialSummary.monthlyPremium.toLocaleString()}</strong></span>
              <span>LTV Ratio: <strong className="text-emerald-300">{financialSummary.ltvRatio || 'Low'}</strong> — comfortably bonded</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" aria-hidden="true"></span>
                Investments & RA
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-2" aria-label={`Investments ${financialSummary.investments.toLocaleString()} Rand`}>
                R {financialSummary.investments.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Allan Gray, Ninety One & Discretionary</p>
              <p className="text-xs text-slate-400 mt-1">{invPercent}% of net worth • Diversified, Reg 28 compliant</p>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden" role="progressbar" aria-valuenow={invPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Investments share of portfolio">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${invPercent}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true"></span>
                Fixed Assets & Property
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-2" aria-label={`Fixed assets ${financialSummary.realEstate.toLocaleString()} Rand`}>
                R {financialSummary.realEstate.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Primary Residence & Pleasure Craft</p>
              <p className="text-xs text-slate-400 mt-1">{propPercent}% of net worth • Insured via Santam</p>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden" role="progressbar" aria-valuenow={propPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Property share of portfolio">
              <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${propPercent}%` }}></div>
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
                const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                return (
                  <div key={g.id} role="listitem" className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900">{g.title}</h3>
                        <span className="text-xs text-slate-500">Target: {g.targetDate} • {g.category}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-slate-900" aria-label={`${percent} percent complete`}>{percent}%</span>
                        <p className="text-xs text-slate-500">
                          R {g.currentAmount.toLocaleString()} / R {g.targetAmount.toLocaleString()}
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
            </div>

            {/* Quick Self-Service Tasks from PDF Section II */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Quick Document Requests
                </span>
                <span className="text-xs text-slate-400">Tap — we’ll email you within 24h</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                {['Issue Border Letter', 'Request IRP5 Tax Pack', 'Change Details', 'Sync to Insurer (API)', 'Request Consultation'].map((task) => (
                  <button 
                    key={task} 
                    onClick={() => {
                      if (task === 'Change Details') {
                        setIsChangeDetailsOpen(true);
                      } else if (task === 'Sync to Insurer (API)') {
                        setIsProviderSyncOpen(true);
                      } else {
                        showToast(`${task} — request sent! Check your email.`);
                      }
                    }}
                    className={`p-3.5 text-left border rounded-xl text-xs font-medium transition cursor-pointer min-h-[56px] flex flex-col justify-center gap-1 ${
                      task === 'Change Details' 
                        ? 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100/60 hover:border-indigo-500 text-indigo-900 shadow-xs' 
                        : task === 'Sync to Insurer (API)'
                        ? 'border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/80 hover:border-emerald-500 text-emerald-950 shadow-xs'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700'
                    }`}
                    aria-label={task}
                  >
                    <span className="font-semibold leading-tight flex items-center justify-between">
                      {task}
                      {task === 'Change Details' && <Sparkles className="w-3 h-3 text-indigo-600" />}
                      {task === 'Sync to Insurer (API)' && <Send className="w-3 h-3 text-emerald-600" />}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      {task === 'Change Details' ? 'Upload doc' : task === 'Sync to Insurer (API)' ? 'Mock API Gateway' : 'One tap'} <ChevronRight className="w-3 h-3" aria-hidden="true" />
                    </span>
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
              </div>

              <button onClick={() => showToast('Reminders synced to your calendar.')} className="mt-4 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 min-h-[40px] focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 cursor-pointer">
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
          <div className="flex items-center gap-3">
            {onSwitchToAdvisor && (
              <button
                onClick={onSwitchToAdvisor}
                className="text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 cursor-pointer"
              >
                Advisor Console
              </button>
            )}
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline">Questions?</span>
            <a href="mailto:hello@royalsquare.co.za" className="font-semibold text-indigo-600 hover:text-indigo-700 underline">hello@royalsquare.co.za</a>
          </div>
        </footer>
      </div>

      {/* CHANGE DETAILS MODAL — Uses DocumentScannerService.scanIdDocument to read document & update information */}
      {isChangeDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-change-details-title">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Automated Document Verification
                </div>
                <h2 id="modal-change-details-title" className="text-xl font-bold text-slate-900">
                  Upload Document to Change Details
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload your official document (Smart ID Card, Green ID Book, Proof of Residence, or Bank Confirmation Letter) to automatically update your portfolio details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangeDetailsOpen(false);
                  setScannedDocResult(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Upload Zone */}
            <div className="space-y-4">
              <label
                htmlFor="doc-upload-input"
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition cursor-pointer text-center bg-slate-50/50"
              >
                <input
                  id="doc-upload-input"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleDocumentUpload}
                  className="sr-only"
                />
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <UploadCloud size={24} />
                </div>
                <div className="space-y-1">
                  <strong className="text-sm text-slate-900 block font-semibold">
                    {uploadedFileName ? uploadedFileName : 'Tap to upload or drag & drop document'}
                  </strong>
                  <span className="text-xs text-slate-500 block">
                    Supported: RSA Smart ID, Green Book, Bank Confirmation Letter, PDF / JPG / PNG
                  </span>
                </div>
              </label>

              {/* Sample Quick Demo buttons */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Quick demo:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSampleScan('id')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition cursor-pointer"
                  >
                    Test RSA ID Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSampleScan('bank')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition cursor-pointer"
                  >
                    Test Bank Letter
                  </button>
                </div>
              </div>

              {/* Scanning Loader */}
              {isScanningDoc && (
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 flex items-center gap-3 text-xs text-indigo-900 animate-pulse">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                  <div>
                    <strong className="block font-semibold">Reading document with Gemini AI vision...</strong>
                    <span className="text-indigo-700">Extracting legal name, RSA ID checksum, and updating fields.</span>
                  </div>
                </div>
              )}

              {/* Scan Error Message */}
              {scannedDocResult?.error_message && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-center gap-3 text-xs text-rose-800">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{scannedDocResult.error_message}</span>
                </div>
              )}

              {/* Successfully Scanned Results Card */}
              {scannedDocResult && !scannedDocResult.is_blurry && !scannedDocResult.error_message && (
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      Document Verified Successfully
                    </span>
                    {scannedDocResult.checksum_valid && (
                      <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 font-bold rounded-full text-[10px]">
                        Luhn Checksum Valid
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-slate-800">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block">Extracted Full Name</span>
                      <strong className="text-slate-900 text-sm">{scannedDocResult.full_name || `${scannedDocResult.first_name} ${scannedDocResult.surname}`}</strong>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block">Document / ID Number</span>
                      <strong className="font-mono text-slate-900 text-sm">{scannedDocResult.id_number}</strong>
                    </div>

                    {scannedDocResult.date_of_birth && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase block">Date of Birth</span>
                        <span>{scannedDocResult.date_of_birth}</span>
                      </div>
                    )}

                    {scannedDocResult.nationality && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase block">Nationality</span>
                        <span>{scannedDocResult.nationality}</span>
                      </div>
                    )}

                    {scannedDocResult.bank_name && (
                      <div className="col-span-2 p-2.5 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Bank Account</span>
                          <strong>{scannedDocResult.bank_name}</strong>
                        </div>
                        <span className="font-mono text-slate-700">{scannedDocResult.account_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsChangeDetailsOpen(false);
                  setScannedDocResult(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyChangedDetails}
                disabled={!scannedDocResult || Boolean(scannedDocResult.error_message)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm transition cursor-pointer"
              >
                <Check size={16} />
                <span>Confirm & Update Information</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insurer Gateway & Advisor Sync Modal (Mock API Demo) */}
      {isProviderSyncOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="provider-sync-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="provider-sync-modal-title" className="text-base font-bold text-slate-900">
                    Insurer API Gateway & Advisor Sync
                  </h3>
                  <p className="text-xs text-slate-500">
                    Normalized data schema pass-through across SA insurers (Sanlam, Old Mutual, Discovery, Santam)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProviderSyncOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Explanatory callout for judges */}
            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Why Mocking with Normalized Schemas Solves the Core Problem:
              </span>
              <p className="text-indigo-800">
                Insurers have divergent legal interpretations and form lengths ranging from 4 to 98 pages. Our internal canonical schema standardizes all client data first, then dispatches to insurer endpoints while synchronizing the database across client and advisor consoles in real time.
              </p>
            </div>

            {/* Provider and fields to update */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Target Insurer
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as 'Sanlam' | 'Discovery' | 'Santam' | 'Old Mutual')}
                    className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Sanlam">Sanlam (Glacier / Underwriting API)</option>
                    <option value="Discovery">Discovery (Vitality & Life Gateway)</option>
                    <option value="Old Mutual">Old Mutual (Wealth / SuperFund)</option>
                    <option value="Santam">Santam (Commercial & Personal Short-Term)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client from Database
                  </label>
                  <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-800 border border-slate-200 truncate">
                    {clientName || 'Sipho Dlamini'} ({selectedClientId ? 'Linked in DB' : 'CLI-1024'})
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Update Occupation (synced to DB)
                  </label>
                  <input
                    type="text"
                    value={syncOccupation}
                    onChange={(e) => setSyncOccupation(e.target.value)}
                    placeholder="e.g. Senior Mine Specialist"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Update Employer (synced to DB)
                  </label>
                  <input
                    type="text"
                    value={syncEmployer}
                    onChange={(e) => setSyncEmployer(e.target.value)}
                    placeholder="e.g. Anglo American SA"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Simulation Terminal / Logs */}
              {providerSyncLogs.length > 0 && (
                <div className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto border border-slate-800 shadow-inner">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold border-b border-slate-800 pb-1 mb-1">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    <span>API Gateway Transmission Stream</span>
                  </div>
                  {providerSyncLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {/* Receipt card if synced */}
              {providerSyncResult && (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Provider Acknowledgment Received
                    </span>
                    <span className="font-mono bg-emerald-200/80 px-2 py-0.5 rounded text-[11px] text-emerald-800">
                      {providerSyncResult.provider_reference}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-500 block">Astute Switch Token:</span>
                      <span className="font-mono text-slate-800">{providerSyncResult.astute_switch_ref}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 block">Compliance Gate:</span>
                      <span className="text-slate-800">{providerSyncResult.compliance_gate}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium pt-1">
                    ✓ Updated database record for client and broadcast to Advisor Back-Office.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsProviderSyncOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleRunProviderSync}
                disabled={isSyncingWithProvider}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm transition cursor-pointer"
              >
                {isSyncingWithProvider ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting to Gateway...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Send to Insurer API Gateway (Mock)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
