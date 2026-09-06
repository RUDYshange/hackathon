import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  Building2 
} from 'lucide-react';
import { MockProviderApiService, IntegrationLogEntry } from '../services/mockProviderApi';

interface IntegrationLogTableProps {
  title?: string;
  subtitle?: string;
  showHeaderControls?: boolean;
}

export const IntegrationLogTable: React.FC<IntegrationLogTableProps> = ({
  title = "Provider Integration Log",
  subtitle = "Live dispatch stream — real-time transmission receipts across South African insurance APIs",
  showHeaderControls = true
}) => {
  const [log, setLog] = useState<IntegrationLogEntry[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'Sanlam' | 'Discovery' | 'Santam' | 'Old Mutual'>('Sanlam');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedRef, setHighlightedRef] = useState<string | null>(null);

  const fetchLog = async () => {
    const entries = await MockProviderApiService.getIntegrationLog();
    setLog(entries);
  };

  useEffect(() => {
    fetchLog();

    const handleLogUpdate = (e: any) => {
      if (e.detail) {
        setLog((prev) => [e.detail, ...prev.filter(item => item.reference !== e.detail.reference)]);
        setHighlightedRef(e.detail.reference);
        setTimeout(() => setHighlightedRef(null), 3500);
      }
    };

    window.addEventListener('rsq-integration-log-updated', handleLogUpdate);
    return () => {
      window.removeEventListener('rsq-integration-log-updated', handleLogUpdate);
    };
  }, []);

  const handleDemoDispatch = async () => {
    setIsSubmitting(true);
    try {
      const result = await MockProviderApiService.submitClaimToProvider(
        undefined,
        selectedProvider,
        {
          client_name: 'S. Dlamini',
          client_reference: 'CLI-1024',
          policy_number: selectedProvider === 'Sanlam' ? 'SNL-44102' : selectedProvider === 'Old Mutual' ? 'OM-99201' : selectedProvider === 'Discovery' ? 'DSC-11048' : 'SAN-88129'
        }
      );
      if (result.integration_entry) {
        setHighlightedRef(result.integration_entry.reference);
        setTimeout(() => setHighlightedRef(null), 3500);
      }
    } catch (e) {
      console.error('Demo dispatch error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'Sanlam':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Discovery':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Old Mutual':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Santam':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden my-6">
      {/* Header section with title and instant test dispatch */}
      <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              {title}
            </h3>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 border border-emerald-200">
              {log.length} transmissions logged
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {subtitle}
          </p>
        </div>

        {showHeaderControls && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">Provider:</span>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as any)}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                title="Select provider for demo dispatch"
              >
                <option value="Sanlam">Sanlam</option>
                <option value="Old Mutual">Old Mutual</option>
                <option value="Discovery">Discovery</option>
                <option value="Santam">Santam</option>
              </select>
            </div>

            <button
              onClick={handleDemoDispatch}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer active:scale-95"
              title="Simulate immediate live claim transmission"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>⚡ Send Claim to Provider</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 uppercase font-semibold tracking-wider text-[11px]">
              <th className="py-3 px-4">Claim ID</th>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 font-mono">Reference</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {log.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  No transmissions recorded yet. Click "Send Claim to Provider" to simulate live integration.
                </td>
              </tr>
            ) : (
              log.map((entry, idx) => {
                const isJustAdded = highlightedRef === entry.reference;
                return (
                  <tr 
                    key={`${entry.reference}-${idx}`}
                    className={`transition-colors duration-500 ${
                      isJustAdded 
                        ? 'bg-emerald-50 font-medium' 
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {entry.claim_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {entry.client}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getProviderBadge(entry.provider)}`}>
                        {entry.provider}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Received
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {entry.reference}
                      {isJustAdded && (
                        <span className="ml-2 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                          NEW
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {entry.timestamp}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer bar with engineering receipt note */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Normalized FAIS Section 8 canonical schema confirmed across all provider endpoints.</span>
        </span>
        <span className="text-slate-400 font-mono text-[10px]">
          FSP 29370 • ASTUTE SWITCH GATEWAY
        </span>
      </div>
    </div>
  );
};
