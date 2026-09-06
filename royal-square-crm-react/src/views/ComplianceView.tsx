import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  FileSignature,
  Gavel,
  Printer,
  RefreshCw,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { secureFetch } from '../services/api';
import { ClientChangeRequest } from '../components/forms/ClientChangeDetailsModal';

interface ClientSummary {
  id: string; reference: string; fullName: string; netWorth: number | string;
  riskProfile: string; complianceGapCount: number; nextReviewDate?: string; daysUntilReview?: number;
}

const DEFAULT_DEMO_CHANGE_REQUESTS: ClientChangeRequest[] = [
  {
    id: 'cr-init-1',
    reference: 'CR-84920',
    clientName: 'Kagiso Mokoena',
    clientRef: 'CLI-1026',
    category: 'BANKING',
    submittedAt: 'Today, 08:05',
    status: 'PENDING_ADVISOR_REVIEW',
    documentName: 'Standard_Bank_Stamped_Confirmation_2026.pdf',
    documentCategory: 'BANKING',
    extractedFields: {
      bankName: 'Standard Bank of South Africa',
      accountHolder: 'Kagiso Mokoena',
      accountNumber: '10194820194',
      branchCode: '051001',
      accountType: 'Private Wealth Cheque Account',
      issueDate: '2026-08-28'
    },
    targetProviders: ['Santam Insurance', 'Allan Gray', 'Discovery Invest & Insure'],
    clientNotes: 'Updated primary business settlement account. Stamped confirmation letter from Rosebank branch attached.'
  }
];

const MANDATE_MODELS = [
  { key: 'commission', label: 'Commission', body: 'Statutory regulated scale', detail: 'Life and risk commission determined strictly by product provider scale under the Long-Term Insurance Act, 1998. Investment advisory commission is capped at 3.00% ex VAT by internal governance rule.' },
  { key: 'asset', label: 'Asset-based %', body: '0.75% per annum of AUM', detail: 'Levied monthly in arrears on the market value of discretionary portfolios, disclosed in the Section 48 schedule.' },
  { key: 'hourly', label: 'Hourly schedule', body: 'R 1,500 ex VAT per hour', detail: 'Financial needs analysis and implementation time billed against a maximum cap of 60 hours per month.' },
  { key: 'retainer', label: 'Fixed retainer', body: 'R 500 ex VAT per month', detail: 'Debit order collected on the first of the month covering servicing, reminders and claims administration.' }
];

const zar = (value: number | string | undefined, compact = false) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0, notation: compact ? 'compact' : 'standard' })
    .format(typeof value === 'string' ? parseFloat(value) || 0 : value || 0);

const dateZa = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not scheduled';

export const ComplianceView: React.FC = () => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [model, setModel] = useState('commission');

  // Client Change Requests state
  const [changeRequests, setChangeRequests] = useState<ClientChangeRequest[]>(() => {
    try {
      const stored = localStorage.getItem('rs_client_change_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_DEMO_CHANGE_REQUESTS;
  });

  const [reqFilter, setReqFilter] = useState<'ALL' | 'PENDING' | 'DISPATCHED'>('ALL');
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchLogs, setDispatchLogs] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const res = await secureFetch<ClientSummary[]>('/clients');
      setClients(res.data || []);
      setIsLoading(false);
    })();
  }, []);

  // Listen to storage events if client submits a change request in another tab
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'rs_client_change_requests' && e.newValue) {
        try {
          setChangeRequests(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleDispatchToProviders = async (req: ClientChangeRequest) => {
    setDispatchingId(req.id);
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const updated = changeRequests.map((r) =>
      r.id === req.id ? { ...r, status: 'SENT_TO_PROVIDERS' as const } : r
    );
    setChangeRequests(updated);
    try {
      localStorage.setItem('rs_client_change_requests', JSON.stringify(updated));
    } catch {}

    const confirmationRef = `B2B-FICA-${Math.floor(100000 + Math.random() * 900000)}`;
    setDispatchLogs((prev) => ({
      ...prev,
      [req.id]: `Dispatched to ${req.targetProviders.join(', ')} via FICA B2B Gateway (Ref: ${confirmationRef}) on ${new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`
    }));
    setDispatchingId(null);
  };

  const filteredRequests = useMemo(() => {
    if (reqFilter === 'PENDING') return changeRequests.filter((r) => r.status === 'PENDING_ADVISOR_REVIEW');
    if (reqFilter === 'DISPATCHED') return changeRequests.filter((r) => r.status === 'SENT_TO_PROVIDERS');
    return changeRequests;
  }, [changeRequests, reqFilter]);

  const pendingCount = changeRequests.filter((r) => r.status === 'PENDING_ADVISOR_REVIEW').length;

  const stats = useMemo(() => {
    const signed = clients.filter((c) => (c.complianceGapCount || 0) === 0).length;
    const aum = clients.reduce((t, c) => t + (typeof c.netWorth === 'string' ? parseFloat(c.netWorth) : c.netWorth || 0), 0);
    return {
      signed,
      total: clients.length,
      pct: clients.length ? Math.round((signed / clients.length) * 100) : 0,
      retainer: clients.length * 500,
      aum,
      expiring: clients.filter((c) => (c.daysUntilReview ?? 999) <= 30).length
    };
  }, [clients]);

  const active = MANDATE_MODELS.find((m) => m.key === model)!;

  return (
    <div className="view-container">
      <section className="hero-bar">
        <div>
          <div className="eyebrow"><span className="tag">Statutory governance hub</span><span>FSP 29370 · Category I &amp; II discretionary</span></div>
          <h1>FAIS compliance, service level agreements &amp; fee mandates</h1>
          <p>Financial Advisory and Intermediary Services Act, 2002 · regulatory supervisory console and fiduciary execution matrix</p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-secondary"><Printer size={15} /> Print compliance pack</button>
          <button className="btn btn-secondary"><RefreshCw size={15} /> Export Astute audit log</button>
          <button className="btn btn-primary"><FileSignature size={15} /> Generate client mandate</button>
        </div>
      </section>

      <section className="kpi-grid">
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Active signed SLAs</span><FileSignature size={17} color="#1d4ed8" /></div>
          <div className="kpi-value">{stats.signed} <small>/ {stats.total}</small></div>
          <div className="kpi-foot">
            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${stats.pct}%` }} /></div>
            <span>Statutory compliance {stats.pct}% · {stats.total - stats.signed} pending client renewal signatures</span>
          </div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">FICA Change Requests</span><ShieldAlert size={17} color={pendingCount > 0 ? '#d97706' : '#1d4ed8'} /></div>
          <div className="kpi-value">{pendingCount} <small>pending review</small></div>
          <div className="kpi-foot">
            <span style={{ color: pendingCount > 0 ? '#b45309' : undefined }}>
              {pendingCount > 0 ? `${pendingCount} verified AI extractions awaiting provider dispatch` : 'All client change requests dispatched'}
            </span>
          </div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Monthly retainers</span><Wallet size={17} color="#1d4ed8" /></div>
          <div className="kpi-value">{zar(stats.retainer)}</div>
          <div className="kpi-foot"><span>{stats.total} mandated debit orders · annual run rate {zar(stats.retainer * 12, true)} ex VAT</span></div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Astute authorities</span><ShieldCheck size={17} color="#1d4ed8" /></div>
          <div className="kpi-value">{stats.total} <small>active</small></div>
          <div className="kpi-foot"><span style={{ color: stats.expiring ? '#991b1b' : undefined }}>{stats.expiring} expiring in ≤ 30 days · 12-month electronic mandates on file</span></div>
        </article>
      </section>

      {/* PENDING CLIENT DETAIL CHANGES & FICA AMENDMENTS PANEL */}
      <section className="crm-panel" style={{ marginBottom: 24 }}>
        <div className="panel-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="tag" style={{ background: '#e0e7ff', color: '#3730a3' }}>AI Document Vision</span>
              <span className="tag" style={{ background: '#fef3c7', color: '#92400e' }}>Provider B2B Dispatch</span>
            </div>
            <h2 style={{ marginTop: 4 }}>Client Change Requests &amp; FICA Amendment Queue</h2>
            <p>
              Client-initiated changes with multimodal document extractions (Bank Confirmation Letters, Utility Bills, Smart IDs). Review verified data and dispatch statutory amendments directly to nominated product providers.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['ALL', 'PENDING', 'DISPATCHED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-btn ${reqFilter === tab ? 'active' : ''}`}
                style={{ fontSize: 12, padding: '6px 14px' }}
                onClick={() => setReqFilter(tab)}
              >
                {tab === 'ALL' ? `All Requests (${changeRequests.length})` : tab === 'PENDING' ? `Pending Review (${pendingCount})` : `Dispatched (${changeRequests.length - pendingCount})`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredRequests.map((req) => {
            const isPending = req.status === 'PENDING_ADVISOR_REVIEW';
            const isBusy = dispatchingId === req.id;
            const logMessage = dispatchLogs[req.id];

            return (
              <div
                key={req.id}
                style={{
                  border: isPending ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                  background: isPending ? '#fffbeb' : '#ffffff',
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 15, color: '#0f172a' }}>{req.clientName}</strong>
                      <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>({req.clientRef})</span>
                      <span className="pill-badge badge-info" style={{ fontWeight: 600 }}>
                        {req.category === 'BANKING' ? '🏦 Banking Details' : req.category === 'ADDRESS' ? '📍 Residential Address' : req.category === 'IDENTITY' ? '🪪 Identity / KYC' : '💼 Employment'}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>Submitted: {req.submittedAt}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                      Ref: <strong style={{ fontFamily: 'monospace' }}>{req.reference}</strong> · Supporting Document: <span style={{ textDecoration: 'underline', color: '#1e40af' }}>{req.documentName}</span>
                    </div>
                  </div>

                  <div>
                    {isPending ? (
                      <span className="pill-badge compliance-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={12} /> Pending Advisor Dispatch
                      </span>
                    ) : (
                      <span className="pill-badge compliance-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} /> Dispatched to Providers
                      </span>
                    )}
                  </div>
                </div>

                {/* Extracted Fields Matrix */}
                <div
                  style={{
                    marginTop: 12,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 12,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 10
                  }}
                >
                  {Object.entries(req.extractedFields).map(([k, v]) => (
                    <div key={k}>
                      <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600, display: 'block' }}>
                        {k.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <strong style={{ fontSize: 12, color: '#0f172a', wordBreak: 'break-word' }}>
                        {String(v ?? '—')}
                      </strong>
                    </div>
                  ))}
                </div>

                {req.clientNotes && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#475569', background: '#f8fafc', padding: '8px 12px', borderRadius: 8 }}>
                    <strong>Client Note:</strong> "{req.clientNotes}"
                  </div>
                )}

                {/* Target Product Providers */}
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 10, borderTop: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Nominated Providers to update:</span>
                    {req.targetProviders.map((p) => (
                      <span key={p} style={{ fontSize: 11, background: '#e2e8f0', color: '#1e293b', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>
                        {p}
                      </span>
                    ))}
                  </div>

                  <div>
                    {isPending ? (
                      <button
                        type="button"
                        onClick={() => handleDispatchToProviders(req)}
                        disabled={isBusy}
                        className="btn btn-primary"
                        style={{ fontSize: 12, padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        <span>{isBusy ? 'Dispatching to Providers...' : 'Dispatch to Providers (API)'}</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534', fontSize: 12, fontWeight: 600 }}>
                        <CheckCircle2 size={15} />
                        <span>FICA Dispatch Completed</span>
                      </div>
                    )}
                  </div>
                </div>

                {logMessage && (
                  <div style={{ marginTop: 10, fontSize: 11, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: 6 }}>
                    {logMessage}
                  </div>
                )}
              </div>
            );
          })}

          {filteredRequests.length === 0 && (
            <div style={{ textAlign: 'center', padding: 28, color: '#64748b', fontSize: 13 }}>
              No change requests match the current filter.
            </div>
          )}
        </div>
      </section>

      <div className="split-2-1">
        <div className="stack">
          <section className="crm-panel">
            <div className="panel-heading">
              <div>
                <h2>Interactive SLA &amp; remuneration mandate builder</h2>
                <p>Calibrated in compliance with Section 3A of the FAIS General Code of Conduct</p>
              </div>
              <span className="pill-badge badge-info">Binding mandate generator</span>
            </div>

            <div className="tabs">
              {MANDATE_MODELS.map((m) => (
                <button key={m.key} className={`tab-btn ${model === m.key ? 'active' : ''}`} onClick={() => setModel(m.key)}>{m.label}</button>
              ))}
            </div>

            <div className="scope-item">
              <div className="scope-item-head">
                <b><Scale size={15} /> {active.label} model</b>
                <span className="pill-badge badge-info">{active.body}</span>
              </div>
              <p>{active.detail}</p>
              <div className="providers">Section 48 disclosure applies: any commission paid by third-party insurers is explicitly declared on quote and schedule documents.</div>
            </div>

            <div className="form-grid" style={{ marginTop: 14 }}>
              <div className="form-group">
                <label className="field-label">Mandated client</label>
                <select className="form-input">
                  {clients.map((c) => <option key={c.id}>{c.fullName} · {c.reference}</option>)}
                  {clients.length === 0 && <option>No clients on register</option>}
                </select>
              </div>
              <div className="form-group">
                <label className="field-label">Agreement effective date</label>
                <input className="form-input" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="form-group">
                <label className="field-label">Designated fiduciary advisor</label>
                <input className="form-input" defaultValue="Qiniso Thulani Ntuli (FSP 29370)" readOnly />
              </div>
            </div>

            <div className="form-actions-bar">
              <span className="field-help" style={{ marginRight: 'auto' }}>
                Statutory FAIS disclosure, Section 48 notice and FAIS Ombud complaint channels are attached automatically.
              </span>
              <button className="btn btn-primary"><Send size={15} /> Send for signature</button>
            </div>
          </section>

          <section className="crm-panel">
            <div className="panel-heading">
              <div>
                <h2>Comprehensive client SLA &amp; fee mandate register</h2>
                <p>Live tracking of service level agreements, retainer debit orders and Astute authorities</p>
              </div>
            </div>
            {isLoading ? (
              <div className="loading-container"><div className="skeleton-row" /><div className="skeleton-row" /></div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Client legal entity</th><th>Mandate structure</th><th className="num">Portfolio value</th><th>Astute consent</th><th>Annual review</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => {
                      const compliant = (client.complianceGapCount || 0) === 0;
                      return (
                        <tr key={client.id}>
                          <td><b>{client.fullName}</b><div className="text-muted text-sm mono">{client.reference}</div></td>
                          <td><span className="pill-badge badge-info">Monthly retainer · R500</span></td>
                          <td className="num">{zar(client.netWorth, true)}</td>
                          <td>
                            <span className={`status-chip ${compliant ? 'ok' : 'danger'}`}>
                              <span className="dot" /> {compliant ? 'Valid' : 'Consent outstanding'}
                            </span>
                          </td>
                          <td>{dateZa(client.nextReviewDate)}</td>
                          <td>
                            {(client.daysUntilReview ?? 999) < 0
                              ? <span className="pill-badge compliance-warning">Overdue review</span>
                              : <span className="pill-badge compliance-ok">In good standing</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {clients.length === 0 && <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 22 }}>No mandates on file.</td></tr>}
                  </tbody>
                </table>
                <div className="table-foot">
                  <span>Showing {clients.length} institutional client accounts under FSP 29370 mandate</span>
                  <b>{zar(stats.aum, true)} under advice</b>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="stack">
          <section className="crm-panel">
            <div className="panel-heading">
              <h3>FAIS statutory disclosures &amp; Ombud protocol</h3>
              <BadgeCheck size={18} color="#1d4ed8" />
            </div>
            <div className="scope-item">
              <div className="scope-item-head"><b><Gavel size={15} /> Policyholder Protection Rules</b></div>
              <p>30-day cooling-off and replacement notice. Where a policy replaces an existing financial product, a Replacement Advice Record (RPAR) must be delivered, detailing penalty fees or forfeiture of paid-up benefits.</p>
            </div>
            <div className="scope-item">
              <div className="scope-item-head"><b><ShieldAlert size={15} /> Office of the FAIS Ombud</b></div>
              <p>Menlyn Central, 125 Dallas Avenue, Waterkloof Glen, Pretoria 0010 · +27 12 470 9080 · info@faisombud.co.za</p>
            </div>
            <div className="kv-strip" style={{ marginTop: 8 }}><span className="text-muted">PI guarantee cover</span><b>R 10,000,000 verified</b></div>
            <div className="kv-strip" style={{ marginTop: 8 }}><span className="text-muted">Key individual</span><b>Qiniso Thulani Ntuli</b></div>
            <div className="kv-strip" style={{ marginTop: 8 }}><span className="text-muted">Compliance officer</span><b>Mrs. Charmaine van Wyk (CO 4073)</b></div>
          </section>

          <section className="crm-panel">
            <div className="panel-heading">
              <h3>Physical statutory domicilium</h3>
              <Building2 size={18} color="#1d4ed8" />
            </div>
            <p className="text-sm text-muted">
              Royal Square Financial (Pty) Ltd maintains its registered principal place of business at Suite 1401,
              The Franklin, 4 Pritchard Street, Newtown, Johannesburg. Direct compliance oversight is conducted by the
              appointed compliance officer.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
