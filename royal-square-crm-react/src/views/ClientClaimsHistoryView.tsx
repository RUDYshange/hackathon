import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Car,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Printer,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  Home,
  Watch,
  Loader2,
  ClipboardPlus
} from 'lucide-react';
import { secureFetch } from '../services/api';
import { CURRENT_CLIENT_MOCK } from '../client/mockClientData';

export interface ClientClaimRecord {
  id: string;
  reference: string;
  incidentDate: string;
  category: 'MOTOR_ACCIDENT' | 'PROPERTY_LOSS' | 'JEWELRY_VALUABLES' | 'GLASS_WINDSCREEN';
  stage: 'INTAKE' | 'ASSESSOR_REVIEW' | 'AWAITING_SAPS' | 'APPROVED' | 'SETTLED';
  description: string;
  claimAmount?: number;
  policyNumber: string;
  insurer: string;
  sapsDocketNumber?: string;
  policeStation?: string;
  assignedAdvisor: string;
  lastUpdated: string;
  estimatedSettlementDate?: string;
}

const INITIAL_CLIENT_CLAIMS: ClientClaimRecord[] = [
  {
    id: 'clm-01',
    reference: 'CLM-78210',
    incidentDate: '2026-08-14',
    category: 'MOTOR_ACCIDENT',
    stage: 'APPROVED',
    description: 'Rear bumper impact by third-party delivery vehicle while stationary at Rivonia Road red traffic light. Front bumper also scraped against pavement.',
    claimAmount: 18500,
    policyNumber: 'ST-39201984',
    insurer: 'Santam Insurance',
    sapsDocketNumber: 'CAS 312/08/2026',
    policeStation: 'Sandton SAPS',
    assignedAdvisor: 'Qiniso Ntuli (Key Individual)',
    lastUpdated: 'Yesterday at 14:20 SAST',
    estimatedSettlementDate: '2026-09-12'
  },
  {
    id: 'clm-02',
    reference: 'CLM-61044',
    incidentDate: '2026-04-03',
    category: 'GLASS_WINDSCREEN',
    stage: 'SETTLED',
    description: 'Windscreen shatter caused by highway gravel debris on N1 North near Buccleuch interchange. Replaced with OEM acoustic glass at PG Glass Woodmead.',
    claimAmount: 6400,
    policyNumber: 'ST-39201984',
    insurer: 'Santam Insurance',
    sapsDocketNumber: 'N/A (Comprehensive Glass Waiver)',
    assignedAdvisor: 'Qiniso Ntuli (Key Individual)',
    lastUpdated: '12 Apr 2026',
    estimatedSettlementDate: '10 Apr 2026'
  },
  {
    id: 'clm-03',
    reference: 'CLM-41902',
    incidentDate: '2026-02-18',
    category: 'PROPERTY_LOSS',
    stage: 'SETTLED',
    description: 'Water damage to executive master bedroom ceiling & Persian rug caused by burst high-pressure solar geyser pipe.',
    claimAmount: 42000,
    policyNumber: 'ST-39201984',
    insurer: 'Santam Insurance',
    assignedAdvisor: 'Mrs. C. van Wyk (Compliance)',
    lastUpdated: '04 Mar 2026',
    estimatedSettlementDate: '28 Feb 2026'
  }
];

interface ClientClaimsHistoryViewProps {
  onBackToDashboard: () => void;
  onReportAccident: () => void;
  onReportLoss: () => void;
}

export const ClientClaimsHistoryView: React.FC<ClientClaimsHistoryViewProps> = ({
  onBackToDashboard,
  onReportAccident,
  onReportLoss
}) => {
  const client = CURRENT_CLIENT_MOCK;
  const [claims, setClaims] = useState<ClientClaimRecord[]>(INITIAL_CLIENT_CLAIMS);
  const [filterStage, setFilterStage] = useState<'ALL' | 'ACTIVE' | 'APPROVED' | 'SETTLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const fetchLiveClaims = async () => {
      setIsLoading(true);
      try {
        const res = await secureFetch<any[]>('/claims');
        if (active && res.data && res.data.length > 0) {
          const mapped: ClientClaimRecord[] = res.data.map((item) => ({
            id: item.id || `live-${item.reference}`,
            reference: item.reference || 'CLM-LIVE',
            incidentDate: item.incidentDate || item.createdAt || new Date().toISOString().split('T')[0],
            category: item.claimType?.toLowerCase().includes('accident') ? 'MOTOR_ACCIDENT' : 'PROPERTY_LOSS',
            stage: (item.stage || 'INTAKE') as any,
            description: item.description || 'Insurance claim record',
            claimAmount: item.estimatedAmount || item.authorizedAmount || undefined,
            policyNumber: item.policyNumber || 'ST-39201984',
            insurer: item.insurer || 'Santam Insurance',
            sapsDocketNumber: item.policeCaseNumber,
            policeStation: item.policeStation || 'Sandton SAPS',
            assignedAdvisor: client.advisor.name,
            lastUpdated: 'Live sync via API'
          }));

          // Merge live claims with initial claims, avoiding duplicates by reference
          const seenRefs = new Set<string>();
          const combined: ClientClaimRecord[] = [];
          for (const c of [...mapped, ...INITIAL_CLIENT_CLAIMS]) {
            if (!seenRefs.has(c.reference)) {
              seenRefs.add(c.reference);
              combined.push(c);
            }
          }
          setClaims(combined);
        }
      } catch {
        // keep fallback mock records
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchLiveClaims();
    return () => {
      active = false;
    };
  }, [client.advisor.name]);

  // Filtering
  const filteredClaims = claims.filter((claim) => {
    // Stage filter
    if (filterStage === 'ACTIVE' && (claim.stage === 'SETTLED' || claim.stage === 'APPROVED')) {
      return false;
    }
    if (filterStage === 'APPROVED' && claim.stage !== 'APPROVED') {
      return false;
    }
    if (filterStage === 'SETTLED' && claim.stage !== 'SETTLED') {
      return false;
    }

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        claim.reference.toLowerCase().includes(q) ||
        claim.description.toLowerCase().includes(q) ||
        (claim.sapsDocketNumber && claim.sapsDocketNumber.toLowerCase().includes(q)) ||
        claim.insurer.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const getStageBadge = (stage: ClientClaimRecord['stage']) => {
    switch (stage) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-700" />
            Approved &bull; Panel Beater Authorized
          </span>
        );
      case 'SETTLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
            <CheckCircle2 size={13} className="text-blue-700" />
            Settled & Repaired
          </span>
        );
      case 'ASSESSOR_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
            <Clock size={13} className="text-amber-700" />
            Assessor Inspection Scheduled
          </span>
        );
      case 'AWAITING_SAPS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-200">
            <AlertCircle size={13} className="text-rose-700" />
            Awaiting SAPS Case Docket
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-bold border border-slate-300">
            <Clock size={13} className="text-slate-600" />
            Intake &bull; Registered & In Review
          </span>
        );
    }
  };

  const getCategoryIcon = (category: ClientClaimRecord['category']) => {
    switch (category) {
      case 'MOTOR_ACCIDENT':
        return <Car size={16} className="text-rose-600" />;
      case 'PROPERTY_LOSS':
        return <Home size={16} className="text-indigo-600" />;
      case 'JEWELRY_VALUABLES':
        return <Watch size={16} className="text-amber-600" />;
      case 'GLASS_WINDSCREEN':
        return <Car size={16} className="text-blue-600" />;
      default:
        return <ShieldAlert size={16} className="text-slate-600" />;
    }
  };

  const getCategoryLabel = (category: ClientClaimRecord['category']) => {
    switch (category) {
      case 'MOTOR_ACCIDENT':
        return 'Motor Vehicle Incident';
      case 'PROPERTY_LOSS':
        return 'Property & Home Contents';
      case 'JEWELRY_VALUABLES':
        return 'Jewelry & Valuables';
      case 'GLASS_WINDSCREEN':
        return 'Windscreen & Glass Waiver';
      default:
        return 'General Asset Claim';
    }
  };

  // Metrics
  const totalClaimsCount = claims.length;
  const activeCount = claims.filter((c) => c.stage !== 'SETTLED').length;
  const settledCount = claims.filter((c) => c.stage === 'SETTLED').length;
  const totalAuthorized = claims.reduce((sum, c) => sum + (c.claimAmount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 p-4 md:p-8 font-sans antialiased">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Top Header & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              title="Return to your portfolio dashboard"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-full border border-indigo-100">
                  <ShieldCheck size={12} />
                  Client Claims Archive &bull; FSP 29370
                </div>
                {isLoading && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Loader2 size={12} className="animate-spin text-indigo-600" />
                    Syncing live claims...
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight mt-1">
                Your Claims & Incident History
              </h1>
              <p className="text-xs text-slate-500">
                Real-time tracking of claims logged across Santam Motor & Domestic Policies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onReportAccident}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
            >
              <ClipboardPlus size={14} />
              <span>Register Claim</span>
            </button>
            <button
              type="button"
              onClick={onReportLoss}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
            >
              <ShieldAlert size={14} className="text-amber-400" />
              <span>Report Loss or Theft</span>
            </button>
          </div>
        </div>

        {/* Claims KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Filed</span>
            <div className="text-2xl font-extrabold text-slate-900">{totalClaimsCount}</div>
            <p className="text-[11px] text-slate-400">All historical incidents</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Active Claims</span>
            <div className="text-2xl font-extrabold text-amber-600">{activeCount}</div>
            <p className="text-[11px] text-amber-600/80">Under assessor or repairs</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Settled & Completed</span>
            <div className="text-2xl font-extrabold text-emerald-600">{settledCount}</div>
            <p className="text-[11px] text-emerald-600/80">Closed & indemnified</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Authorized</span>
            <div className="text-2xl font-extrabold text-slate-900">
              R {totalAuthorized.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400">Claims value processed</p>
          </div>
        </div>

        {/* Search and Stage Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setFilterStage('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterStage === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Claims ({claims.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStage('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterStage === 'ACTIVE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active / Review ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStage('APPROVED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterStage === 'APPROVED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved ({claims.filter((c) => c.stage === 'APPROVED').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStage('SETTLED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterStage === 'SETTLED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Settled ({settledCount})
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, docket, or detail..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 text-slate-900"
            />
          </div>
        </div>

        {/* Claims List */}
        <div className="space-y-4">
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-sm p-5 md:p-6 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    {getCategoryIcon(claim.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-extrabold text-slate-900">
                        {claim.reference}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-md">
                        {getCategoryLabel(claim.category)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Incident Date: <strong>{claim.incidentDate}</strong> &bull; Policy #{claim.policyNumber} ({claim.insurer})
                    </span>
                  </div>
                </div>

                <div className="shrink-0">{getStageBadge(claim.stage)}</div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                {claim.description}
              </p>

              {/* Progress Steps Indicator */}
              <div className="py-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                  <span className="text-slate-900">1. Claim Logged</span>
                  <span className={claim.stage !== 'INTAKE' ? 'text-slate-900' : 'text-slate-400'}>2. Assessor Inspection</span>
                  <span className={claim.stage === 'APPROVED' || claim.stage === 'SETTLED' ? 'text-slate-900' : 'text-slate-400'}>3. Panel Beater / Payout Authorized</span>
                  <span className={claim.stage === 'SETTLED' ? 'text-emerald-700' : 'text-slate-400'}>4. Settled & Completed</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-slate-900 h-full w-1/4"></div>
                  <div className={`h-full w-1/4 ${claim.stage !== 'INTAKE' ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                  <div className={`h-full w-1/4 ${claim.stage === 'APPROVED' || claim.stage === 'SETTLED' ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                  <div className={`h-full w-1/4 ${claim.stage === 'SETTLED' ? 'bg-emerald-600' : 'bg-transparent'}`}></div>
                </div>
              </div>

              {/* Metadata Grid & Action Foot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
                {claim.claimAmount && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Authorized Amount</span>
                    <strong className="text-sm text-slate-900 font-mono">
                      R {claim.claimAmount.toLocaleString()}
                    </strong>
                  </div>
                )}

                {claim.sapsDocketNumber && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10.5px] uppercase font-bold text-slate-400 block">SAPS Police Docket</span>
                    <strong className="text-xs text-slate-800 font-mono">
                      {claim.sapsDocketNumber}
                    </strong>
                    {claim.policeStation && (
                      <span className="text-[10px] text-slate-500 block">{claim.policeStation}</span>
                    )}
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Assigned Advisor</span>
                  <strong className="text-xs text-slate-800 block truncate">
                    {claim.assignedAdvisor}
                  </strong>
                  <span className="text-[10px] text-slate-500">Royal Square Practice</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Last Status Update</span>
                  <strong className="text-xs text-slate-700">
                    {claim.lastUpdated}
                  </strong>
                </div>
              </div>

              {/* Action Buttons footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1 text-[11px]">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  Claim dossier archived in compliance with FAIS Record-Keeping standards
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print Dossier</span>
                </button>
              </div>
            </div>
          ))}

          {filteredClaims.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <ShieldAlert size={36} className="text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No matching claims found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No claims match your current filter or search criteria. Change the filter or search query above.
              </p>
            </div>
          )}
        </div>

        {/* 24/7 Santam Roadside & Home Assist Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <PhoneCall size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">24/7 Santam Emergency Assist</h4>
              <p className="text-xs text-slate-600">
                For immediate roadside towing, emergency glazing, or locksmith dispatch across South Africa.
              </p>
            </div>
          </div>
          <a
            href="tel:0800111222"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shrink-0"
          >
            <span>Call 0800 111 222</span>
            <ChevronRight size={14} />
          </a>
        </div>

      </div>
    </div>
  );
};
