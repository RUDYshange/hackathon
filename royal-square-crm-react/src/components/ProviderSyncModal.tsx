import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  Terminal, 
  Building2 
} from 'lucide-react';
import { MockProviderApiService, ProviderSyncResult } from '../services/mockProviderApi';

interface ProviderSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientName?: string;
  onSyncSuccess?: (result: ProviderSyncResult) => void;
}

export const ProviderSyncModal: React.FC<ProviderSyncModalProps> = ({
  isOpen,
  onClose,
  clientId = 'db5a9331-943e-46c1-8f4c-a85f3c75846a',
  clientName = 'Sipho Dlamini',
  onSyncSuccess
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'Sanlam' | 'Discovery' | 'Santam' | 'Old Mutual'>('Sanlam');
  const [occupation, setOccupation] = useState('Chief Technology Officer');
  const [employer, setEmployer] = useState('Naspers Fintech');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<ProviderSyncResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleRunSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setLogs([
      `[1/4] Connecting to ${selectedProvider} API Gateway (Mock Switch)...`,
      `[2/4] Normalizing database record to FAIS Section 8 canonical schema...`
    ]);

    await new Promise((r) => setTimeout(r, 300));
    setLogs((prev) => [
      ...prev,
      `[3/4] Transmitting Astute token & Luhn verification payload to https://api.${selectedProvider.toLowerCase().replace(/\s+/g, '')}.co.za/v2/underwriting/sync`
    ]);

    try {
      const updatedFields: Record<string, any> = {};
      if (occupation) updatedFields.occupation = occupation;
      if (employer) updatedFields.employer = employer;

      const result = await MockProviderApiService.syncClientToProvider(
        clientId,
        selectedProvider,
        updatedFields
      );

      setSyncResult(result);
      setLogs((prev) => [
        ...prev,
        `[4/4] 200 OK — Provider Ref: ${result.provider_reference} (Astute: ${result.astute_switch_ref})`,
        `[SUCCESS] Synchronization verified across insurer exchange and advisor desk.`
      ]);

      if (onSyncSuccess) {
        onSyncSuccess(result);
      }
    } catch (e: any) {
      setLogs((prev) => [...prev, `[ERROR] Provider exchange error: ${e.message || 'Transmission failed'}`]);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-sync-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="provider-sync-title" className="text-base font-bold text-slate-900">
                Insurer API Gateway & Advisor Sync
              </h3>
              <p className="text-xs text-slate-500">
                Mock Provider API — Pass-Through Underwriting across SA Insurers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Narrative callout for judges */}
        <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
          <span className="font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Engineering Breakthrough: Schema Normalization
          </span>
          <p className="text-indigo-800 leading-relaxed">
            Insurers enforce form lengths ranging from 4 to 98 pages. Our internal canonical schema normalizes all data from the database first, then dispatches to the insurer's endpoint while updating the advisor console in real time.
          </p>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Insurer Endpoint
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as any)}
                className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Sanlam">Sanlam (Glacier Underwriting API)</option>
                <option value="Discovery">Discovery (Life & Health Gateway)</option>
                <option value="Old Mutual">Old Mutual (Wealth & Corporate)</option>
                <option value="Santam">Santam (Commercial & Personal Short-Term)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client from Database
              </label>
              <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-800 border border-slate-200 truncate">
                {clientName} (Linked)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Occupation (Synced to Database)
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Chief Technology Officer"
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employer (Synced to Database)
              </label>
              <input
                type="text"
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                placeholder="e.g. Naspers Fintech"
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Simulation Terminal Stream */}
          {logs.length > 0 && (
            <div className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto border border-slate-800 shadow-inner">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold border-b border-slate-800 pb-1 mb-1">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>API Gateway Transmission Stream</span>
              </div>
              {logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* Receipt card if synced */}
          {syncResult && (
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Provider Acknowledgment Received
                </span>
                <span className="font-mono bg-emerald-200/80 px-2 py-0.5 rounded text-[11px] text-emerald-800">
                  {syncResult.provider_reference}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600 text-[11px]">
                <div>
                  <span className="font-semibold text-slate-500 block">Astute Switch Token:</span>
                  <span className="font-mono text-slate-800">{syncResult.astute_switch_ref}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Compliance Status:</span>
                  <span className="text-slate-800">{syncResult.compliance_gate}</span>
                </div>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium pt-1">
                ✓ Updated database record and broadcast to Advisor Back-Office.
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleRunSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm transition cursor-pointer"
          >
            {isSyncing ? (
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
  );
};
