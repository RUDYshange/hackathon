import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  Clock,
  FileSignature,
  Gavel,
  Printer,
  RefreshCw,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { secureFetch } from '../services/api';

interface ClientSummary {
  id: string; reference: string; fullName: string; netWorth: number | string;
  riskProfile: string; complianceGapCount: number; nextReviewDate?: string; daysUntilReview?: number;
}

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

  useEffect(() => {
    (async () => {
      const res = await secureFetch<ClientSummary[]>('/clients');
      setClients(res.data || []);
      setIsLoading(false);
    })();
  }, []);

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
          <div className="kpi-top"><span className="kpi-label">Monthly retainers</span><Wallet size={17} color="#1d4ed8" /></div>
          <div className="kpi-value">{zar(stats.retainer)}</div>
          <div className="kpi-foot"><span>{stats.total} mandated debit orders · annual run rate {zar(stats.retainer * 12, true)} ex VAT</span></div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Hourly advisory time</span><Clock size={17} color="#1d4ed8" /></div>
          <div className="kpi-value">42 <small>hrs this month</small></div>
          <div className="kpi-foot"><span>Billed at R 1,500 ex VAT = R 63,000 booked · max cap 60 hrs/mo</span></div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Astute authorities</span><ShieldCheck size={17} color="#1d4ed8" /></div>
          <div className="kpi-value">{stats.total} <small>active</small></div>
          <div className="kpi-foot"><span style={{ color: stats.expiring ? '#991b1b' : undefined }}>{stats.expiring} expiring in ≤ 30 days · 12-month electronic mandates on file</span></div>
        </article>
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
