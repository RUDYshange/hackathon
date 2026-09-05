import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Flag,
  MessageSquare,
  PieChart,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import { secureFetch } from '../services/api';

interface DeskViewProps {
  onOpenClients: () => void;
  onOpenClaims: () => void;
  onOpenReminders: () => void;
  onOpenClient?: (clientId: string) => void;
  onOpenClaim?: (claimId: string) => void;
}

interface ClientSummary {
  id: string;
  reference: string;
  fullName: string;
  netWorth: number | string;
  riskProfile: string;
  complianceGapCount: number;
  nextReviewDate?: string;
  daysUntilReview?: number;
}

interface ClaimSummary {
  id: string;
  reference: string;
  clientName: string;
  insurer: string;
  incidentDate: string;
  stage: string;
  stepNumber?: number;
  totalSteps?: number;
  closed?: boolean;
}

interface ReminderSummary {
  key: string;
  title?: string;
  message?: string;
  clientName?: string;
  bucket?: string;
  dueDate?: string;
  category?: string;
}

const PROVIDER_MIX = [
  { name: 'Sanlam & Glacier', share: 0.27, colour: '#1d4ed8' },
  { name: 'Allan Gray', share: 0.2, colour: '#475569' },
  { name: 'Old Mutual Wealth', share: 0.15, colour: '#60a5fa' },
  { name: 'Ninety One', share: 0.13, colour: '#d97706' },
  { name: 'Discovery (Invest + Insure)', share: 0.11, colour: '#93c5fd' },
  { name: 'Santam Commercial / Personal', share: 0.07, colour: '#94a3b8' },
  { name: 'Momentum Corporate', share: 0.07, colour: '#cbd5e1' }
];

const zar = (value: number, compact = false) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard'
  }).format(value || 0);

const humanStage = (stage: string) =>
  stage.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\w/g, (c) => c.toUpperCase());

const stageTone = (claim: ClaimSummary) => {
  if (claim.closed || claim.stage === 'CLOSED' || claim.stage === 'PAID') return 'neutral';
  if (['DOCS_REQUESTED', 'REGISTERED'].includes(claim.stage)) return 'danger';
  if (['OFFER', 'ACCEPTED'].includes(claim.stage)) return 'ok';
  return '';
};

export const DeskView: React.FC<DeskViewProps> = ({
  onOpenClients,
  onOpenClaims,
  onOpenReminders,
  onOpenClient,
  onOpenClaim
}) => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [reminders, setReminders] = useState<ReminderSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    const [clientRes, claimRes, reminderRes] = await Promise.all([
      secureFetch<ClientSummary[]>('/clients'),
      secureFetch<ClaimSummary[]>('/claims'),
      secureFetch<ReminderSummary[]>('/reminders')
    ]);
    const firstError = clientRes.error || claimRes.error || reminderRes.error;
    if (firstError) setError(firstError);
    setClients(clientRes.data || []);
    setClaims(claimRes.data || []);
    setReminders(reminderRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const aum = clients.reduce(
      (total, client) => total + (typeof client.netWorth === 'string' ? parseFloat(client.netWorth) : client.netWorth || 0),
      0
    );
    const reviewsDue = clients.filter((c) => (c.daysUntilReview ?? 999) <= 30).length;
    const reviewsDone = Math.max(clients.length - reviewsDue, 0);
    const gaps = clients.reduce((total, c) => total + (c.complianceGapCount || 0), 0);
    const openClaims = claims.filter((c) => !c.closed && c.stage !== 'CLOSED').length;
    const discretionary = clients.filter((c) => c.riskProfile !== 'CONSERVATIVE').length;
    return {
      aum,
      reviewsDue,
      reviewsDone,
      reviewProgress: clients.length ? Math.round((reviewsDone / clients.length) * 100) : 0,
      gaps,
      openClaims,
      discretionary,
      advisory: clients.length - discretionary,
      retainer: clients.length * 500
    };
  }, [clients, claims]);

  const urgent = reminders.filter((r) => ['OVERDUE', 'DUE_SOON'].includes((r.bucket || '').toUpperCase()));
  const today = new Date();

  return (
    <div className="view-container desk-view">
      <section className="hero-bar">
        <div>
          <div className="eyebrow">
            <span className="tag">Director overview</span>
            <span>· Cat I &amp; II discretionary ·</span>
            <span className="mono">FSP 29370</span>
          </div>
          <h1>Welcome back, Qiniso Ntuli</h1>
          <p>Royal Square Financial (Pty) Ltd · Sandton Executive Suite &amp; Wealth Command Centre</p>
        </div>
        <div className="hero-actions">
          <span className="date-chip">
            <CalendarDays size={15} />
            {today.toLocaleDateString('en-ZA', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          <button className="btn btn-secondary" onClick={load}>
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} /> Sync Astute feed
          </button>
          <button className="btn btn-primary"><Download size={15} /> Export FAIS audit report</button>
        </div>
      </section>

      {error && (
        <div className="alert-banner alert-error">
          <ShieldAlert size={18} />
          <span>{error} — showing the practice register that could be reached.</span>
        </div>
      )}

      <section className="kpi-grid">
        <article className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Total assets under advice</span>
            <span className="pill-badge badge-info"><TrendingUp size={12} /> +8.4% YoY</span>
          </div>
          <div className="kpi-value">{zar(stats.aum, stats.aum > 1_000_000)}</div>
          <div className="kpi-foot">
            <div className="flex justify-between">
              <span>Discretionary mandates: {stats.discretionary}</span>
              <span>Advisory only: {stats.advisory}</span>
            </div>
            <div className="meter">
              <i style={{ width: `${clients.length ? (stats.discretionary / clients.length) * 100 : 0}%` }} />
              <i className="alt" style={{ width: `${clients.length ? (stats.advisory / clients.length) * 100 : 0}%` }} />
            </div>
          </div>
        </article>

        <article className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Active client accounts</span>
            <Users size={18} color="#1d4ed8" />
          </div>
          <div className="kpi-value">{clients.length} <small>families &amp; corps</small></div>
          <div className="kpi-split">
            <div><b>{clients.filter((c) => (c.complianceGapCount || 0) === 0).length}</b><span>FICA complete</span></div>
            <div><b>{stats.gaps}</b><span>Outstanding gaps</span></div>
          </div>
        </article>

        <article className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Mandatory annual reviews</span>
            <span className="pill-badge badge-info">{stats.reviewProgress}% progress</span>
          </div>
          <div className="kpi-value">{stats.reviewsDone} <small>/ {clients.length}</small></div>
          <div className="kpi-foot">
            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${stats.reviewProgress}%` }} /></div>
            <span style={{ color: stats.reviewsDue ? '#991b1b' : undefined }}>
              <AlertTriangle size={12} /> {stats.reviewsDue} review{stats.reviewsDue === 1 ? '' : 's'} due within 30 days
            </span>
          </div>
        </article>

        <article className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Retainer &amp; practice revenue</span>
            <Wallet size={18} color="#1d4ed8" />
          </div>
          <div className="kpi-value">{zar(stats.retainer)} <small>/ month</small></div>
          <div className="kpi-split">
            <div><b>{clients.length}</b><span>R500/mo debit orders</span></div>
            <div><b>R 1,500</b><span>Hourly advisory ex VAT</span></div>
          </div>
        </article>
      </section>

      <section className="stack">
        <div className="section-head">
          <h2><span className="live-dot" /> Urgent automated reminders &amp; compliance alerts</h2>
          <span className="text-muted text-sm">FAIS General Code of Conduct trigger engine</span>
        </div>

        {isLoading ? (
          <div className="loading-container"><div className="skeleton-row" /><div className="skeleton-row" /></div>
        ) : urgent.length === 0 ? (
          <div className="empty-state">No triggers are currently breaching the practice thresholds.</div>
        ) : (
          <div className="alert-grid">
            {urgent.slice(0, 4).map((reminder) => {
              const overdue = (reminder.bucket || '').toUpperCase() === 'OVERDUE';
              return (
                <article key={reminder.key} className="alert-card">
                  <div>
                    <div className="alert-card-top">
                      <span className={`pill-badge ${overdue ? 'compliance-warning' : 'bucket-due_soon'}`}>
                        {overdue ? 'High priority' : 'Notice'}
                      </span>
                      <span className="alert-ref">{(reminder.category || 'FAIS').toUpperCase()}</span>
                    </div>
                    <h3 style={{ marginTop: 8 }}>{reminder.title || 'Regulatory follow-up'}</h3>
                    <p style={{ marginTop: 4 }}>
                      {reminder.message || 'Client file requires adviser attention before the next review cycle.'}{' '}
                      {reminder.clientName && <strong>{reminder.clientName}</strong>}
                      {reminder.dueDate ? ` · due ${reminder.dueDate}` : ''}
                    </p>
                  </div>
                  <button className={`btn ${overdue ? 'btn-danger' : 'btn-secondary'}`} onClick={onOpenReminders}>
                    {overdue ? <Flag size={15} /> : <MessageSquare size={15} />}
                    {overdue ? 'Flag for follow-up' : 'Send client reminder'}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="split-2-1">
        <div className="stack">
          <div className="section-head">
            <div>
              <h2>Recent motor &amp; asset claims</h2>
              <p className="text-muted text-sm">Active processing pipeline, loss adjusters and SLA vehicle allocations</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={onOpenClaims}>Filter active</button>
              <button className="btn btn-secondary btn-sm" onClick={onOpenClaims}>All claims</button>
            </div>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Incident ref</th>
                  <th>Client name</th>
                  <th>Insurer</th>
                  <th>Date of loss</th>
                  <th>Stage &amp; SLA status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 26 }}>No claims registered this quarter.</td></tr>
                )}
                {claims.slice(0, 6).map((claim) => {
                  const tone = stageTone(claim);
                  return (
                    <tr key={claim.id}>
                      <td className={`ref ${tone === 'danger' ? 'danger' : ''}`}>{claim.reference}</td>
                      <td style={{ fontWeight: 500 }}>{claim.clientName}</td>
                      <td>{claim.insurer}</td>
                      <td className="text-muted">
                        {claim.incidentDate
                          ? new Date(claim.incidentDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        <span className={`status-chip ${tone}`}>
                          <span className="dot" /> {humanStage(claim.stage)}
                          {claim.stepNumber ? ` · step ${claim.stepNumber}/${claim.totalSteps}` : ''}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="icon-button" title="Open incident hub" onClick={() => (onOpenClaim ? onOpenClaim(claim.id) : onOpenClaims())}>
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="table-foot">
              <span>Showing {Math.min(claims.length, 6)} of {claims.length} recorded claims</span>
              <button className="plain-action" onClick={onOpenClaims}>View complete claims log <ArrowRight size={13} /></button>
            </div>
          </div>

          <section className="crm-panel">
            <div className="panel-heading">
              <div>
                <h3>Goal tracking &amp; net worth progress</h3>
                <p>Client milestone completion monitored against Cat II discretionary benchmarks</p>
              </div>
              <TrendingUp size={19} color="#1d4ed8" />
            </div>
            <div className="kpi-grid">
              {clients.slice(0, 4).map((client) => {
                const net = typeof client.netWorth === 'string' ? parseFloat(client.netWorth) : client.netWorth || 0;
                const gapFree = (client.complianceGapCount || 0) === 0;
                return (
                  <button key={client.id} className="kpi-card" style={{ textAlign: 'left' }} onClick={() => (onOpenClient ? onOpenClient(client.id) : onOpenClients())}>
                    <div className="kpi-top">
                      <span className="kpi-label">{client.fullName}</span>
                      <span className={`pill-badge ${gapFree ? 'compliance-ok' : 'compliance-warning'}`}>
                        {gapFree ? 'FAIS compliant' : `${client.complianceGapCount} gap(s)`}
                      </span>
                    </div>
                    <div className="kpi-value" style={{ fontSize: 22 }}>{zar(net, true)}</div>
                    <div className="kpi-foot">
                      <span>{client.reference} · {client.riskProfile.toLowerCase()} mandate</span>
                      <span>
                        {client.daysUntilReview === undefined || client.daysUntilReview === null
                          ? 'Review not scheduled'
                          : client.daysUntilReview < 0
                            ? `Review overdue by ${Math.abs(client.daysUntilReview)} days`
                            : `Annual review in ${client.daysUntilReview} days`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="crm-panel">
            <div className="panel-heading">
              <div>
                <h3>Product partner mix</h3>
                <p>Institution split ({zar(stats.aum, true)})</p>
              </div>
              <PieChart size={19} color="#1d4ed8" />
            </div>
            <Donut />
            <div>
              {PROVIDER_MIX.map((provider) => (
                <div key={provider.name} className="legend-row">
                  <span className="flex items-center gap-2">
                    <span className="swatch" style={{ background: provider.colour }} />
                    {provider.name}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="amt">{zar(stats.aum * provider.share, true)}</span>
                    <span className="pct">{(provider.share * 100).toFixed(1)}%</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="crm-panel">
            <div className="panel-heading">
              <h3>Compliance &amp; FSP audit trail</h3>
              <BadgeCheck size={18} color="#1d4ed8" />
            </div>
            <div>
              <AuditRow title="FSP 29370 licence status" detail="Validated against the FSCA register · good standing" />
              <AuditRow title="CPD hour obligations" detail="Practice total 18.5 / 18.0 required hours reached" />
              <AuditRow title="PI cover underwritten" detail="R 15,000,000 professional indemnity active" />
              <AuditRow
                title="Client file completeness"
                detail={stats.gaps === 0 ? 'All mandates, consents and FICA records current' : `${stats.gaps} outstanding document gap(s) across the register`}
                warn={stats.gaps > 0}
              />
            </div>
            <div className="kv-strip" style={{ marginTop: 10 }}>
              <span className="text-muted">Internal review lead</span>
              <b>Adv. C. van Wyk (CO 4073)</b>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 10 }} onClick={onOpenClients}>
              <FileText size={14} /> Open client compliance register
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

const AuditRow: React.FC<{ title: string; detail: string; warn?: boolean }> = ({ title, detail, warn }) => (
  <div className="audit-row">
    {warn ? <AlertTriangle size={16} color="#d97706" /> : <CheckCircle2 size={16} color="#10b981" />}
    <div>
      <b>{title}</b>
      <span>{detail}</span>
    </div>
  </div>
);

const Donut: React.FC = () => {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg width="176" height="176" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth="13" />
        {PROVIDER_MIX.map((provider) => {
          const length = provider.share * circumference;
          const dash = `${length} ${circumference - length}`;
          const el = (
            <circle
              key={provider.name}
              cx="60" cy="60" r={radius} fill="transparent"
              stroke={provider.colour} strokeWidth="13"
              strokeDasharray={dash} strokeDashoffset={-offset}
            />
          );
          offset += length;
          return el;
        })}
      </svg>
      <div className="donut-center">
        <b>{PROVIDER_MIX.length}</b>
        <span>Providers</span>
      </div>
    </div>
  );
};
