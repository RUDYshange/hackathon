import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Building2, Link2, Phone, RefreshCw, ShieldCheck } from 'lucide-react';
import { secureFetch } from '../services/api';

interface ClientSummary { id: string; netWorth: number | string; }
interface PolicyRow { provider: string; productType: string; policyNumber: string; monthlyPremium?: number | string; }
interface ClientDetail { id: string; policies: PolicyRow[]; }

const PROVIDER_DIRECTORY = [
  { name: 'Sanlam & Glacier', share: 0.27, category: 'Life · LISP · Retirement', desk: '0860 726 526', sla: 'Broker Connect · 24h turnaround' },
  { name: 'Allan Gray', share: 0.20, category: 'Unit trusts · Discretionary', desk: '0860 000 654', sla: 'Adviser portal · 48h turnaround' },
  { name: 'Old Mutual Wealth', share: 0.15, category: 'Wealth · Endowments', desk: '0860 234 234', sla: 'Secure adviser desk · 24h' },
  { name: 'Ninety One', share: 0.13, category: 'Global franchise · Offshore', desk: '0860 500 100', sla: 'Institutional desk · 72h' },
  { name: 'Discovery (Invest + Insure)', share: 0.11, category: 'Risk · Health · Motor', desk: '0860 99 88 77', sla: 'Vitality-linked · 24h' },
  { name: 'Santam Commercial / Personal', share: 0.07, category: 'Short-term · Commercial', desk: '0860 444 444', sla: 'Broker Connect live API' },
  { name: 'Momentum Corporate', share: 0.07, category: 'Group risk · Umbrella funds', desk: '0860 65 75 85', sla: 'Corporate desk · 5 days' }
];

const zar = (value: number, compact = true) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0, notation: compact ? 'compact' : 'standard' }).format(value || 0);

export const ProvidersView: React.FC = () => {
  const [aum, setAum] = useState(0);
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingAstute, setIsSyncingAstute] = useState(false);
  const [astuteFeedback, setAstuteFeedback] = useState<string | null>(null);

  const load = async () => {
    const res = await secureFetch<ClientSummary[]>('/clients');
    const clients = res.data || [];
    setAum(clients.reduce((t, c) => t + (typeof c.netWorth === 'string' ? parseFloat(c.netWorth) : c.netWorth || 0), 0));

    const details = await Promise.all(clients.map((c) => secureFetch<ClientDetail>(`/clients/${c.id}`)));
    setPolicies(details.flatMap((d) => d.data?.policies || []));
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSyncAstute = async () => {
    setIsSyncingAstute(true);
    const res = await secureFetch<{ message: string; switchBatchRef: string; matchedClients: number; policiesSynced: number }>('/astute/sync', {
      method: 'POST',
      body: JSON.stringify({})
    });
    setIsSyncingAstute(false);
    if (res.data) {
      setAstuteFeedback(`Astute FSE Synchronized: ${res.data.policiesSynced} active policies updated across ${res.data.matchedClients} clients (Batch: ${res.data.switchBatchRef})`);
      await load();
      setTimeout(() => setAstuteFeedback(null), 7000);
    } else {
      setAstuteFeedback(res.error || 'Astute sync failed');
      setTimeout(() => setAstuteFeedback(null), 5000);
    }
  };

  const byProvider = useMemo(() => {
    const map = new Map<string, { count: number; premium: number }>();
    policies.forEach((p) => {
      const entry = map.get(p.provider) || { count: 0, premium: 0 };
      entry.count += 1;
      entry.premium += typeof p.monthlyPremium === 'string' ? parseFloat(p.monthlyPremium) || 0 : p.monthlyPremium || 0;
      map.set(p.provider, entry);
    });
    return map;
  }, [policies]);

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Product provider panel</h1>
          <p className="view-subtitle">Institution split, broker service level agreements and Astute integration status</p>
        </div>
        <button className="btn btn-secondary" onClick={handleSyncAstute} disabled={isSyncingAstute}>
          <RefreshCw size={15} className={isSyncingAstute ? 'spin-icon' : ''} /> {isSyncingAstute ? 'Syncing Astute...' : 'Refresh Astute feed'}
        </button>
      </div>

      {astuteFeedback && (
        <div className="alert-banner alert-success" style={{ background: '#ecfdf5', borderColor: '#6ee7b7', color: '#065f46', marginBottom: 16 }}>
          <BadgeCheck size={18} color="#059669" />
          <span style={{ fontWeight: 500 }}>{astuteFeedback}</span>
        </div>
      )}

      <section className="kpi-grid">
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Panel institutions</span><Building2 size={17} color="#1d4ed8" /></div>
          <div className="kpi-value">{PROVIDER_DIRECTORY.length}</div>
          <div className="kpi-foot"><span>All underwriters integrated on the Astute Exchange feed</span></div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Assets placed</span><ShieldCheck size={17} color="#1d4ed8" /></div>
          <div className="kpi-value">{zar(aum)}</div>
          <div className="kpi-foot"><span>Allocated across the panel per the mix below</span></div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Policies on the panel</span><Link2 size={17} color="#1d4ed8" /></div>
          <div className="kpi-value">{policies.length}</div>
          <div className="kpi-foot"><span>{byProvider.size} provider(s) currently holding live client contracts</span></div>
        </article>
      </section>

      <section className="crm-panel">
        <div className="panel-heading">
          <div>
            <h2>Provider register &amp; broker desks</h2>
            <p>Contracted panel with allocation share and service level commitments</p>
          </div>
        </div>
        {isLoading ? (
          <div className="loading-container"><div className="skeleton-row" /><div className="skeleton-row" /></div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Institution</th><th>Category</th><th className="num">Allocation</th>
                  <th className="num">Live policies</th><th className="num">Premium (pm)</th><th>Broker desk &amp; SLA</th>
                </tr>
              </thead>
              <tbody>
                {PROVIDER_DIRECTORY.map((provider) => {
                  const live = byProvider.get(provider.name.split(' (')[0].split(' & ')[0]) || byProvider.get(provider.name);
                  return (
                    <tr key={provider.name}>
                      <td><b>{provider.name}</b></td>
                      <td className="text-muted">{provider.category}</td>
                      <td className="num">{zar(aum * provider.share)} · {(provider.share * 100).toFixed(1)}%</td>
                      <td className="num">{live?.count ?? 0}</td>
                      <td className="num">{live ? zar(live.premium, false) : '—'}</td>
                      <td>
                        <div className="flex items-center gap-2"><Phone size={13} /> {provider.desk}</div>
                        <span className="text-muted text-sm">{provider.sla}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="table-foot">
              <span>Allocation shares are governed by the practice investment committee mandate</span>
              <b>{zar(aum)} total under advice</b>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
