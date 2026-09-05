import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileSignature,
  FileText,
  HeartPulse,
  Home,
  Landmark,
  PiggyBank,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { secureFetch } from '../services/api';

interface ClientDetailViewProps {
  clientId: string;
  onBack: () => void;
  onOpenClaims: () => void;
}

interface LedgerLine { id: string; label: string; amount: number | string; creditor?: string | null; interestRate?: number | null; }
interface BalanceSheet {
  assets: LedgerLine[]; liabilities: LedgerLine[]; income: LedgerLine[]; expenses: LedgerLine[];
  totalAssets: number | string; totalLiabilities: number | string; netWorth: number | string;
  monthlyIncome: number | string; monthlyExpenses: number | string; monthlySurplus: number | string;
  debtToAssetsPercent: number; monthsOfExpensesCovered: number;
}
interface GoalRow {
  id: string; name: string; kind: string; targetAmount: number | string; currentAmount: number | string;
  monthlyContribution?: number | string; startDate: string; targetDate: string; vehicle?: string; progressPercent: number;
}
interface PolicyRow {
  id: string; provider: string; productType: string; policyNumber: string;
  sumAssured?: number | string; monthlyPremium?: number | string; renewalDate?: string;
}
interface DocRow { id: string; type: string; signedOn: string; storageKey?: string | null; }

interface ClientDetail {
  id: string; reference: string; title: string; fullName: string; maskedIdNumber?: string;
  dateOfBirth?: string; age?: number; occupation?: string; employer?: string;
  annualIncome?: number | string; mobileNumber?: string; emailAddress?: string; primaryAddress?: string;
  licenceExpiry?: string; clientSince?: string; nextReviewDate?: string;
  riskProfile: string; riskScore?: number; netWorth: number | string;
  balanceSheet: BalanceSheet; goals: GoalRow[]; policies: PolicyRow[]; documents: DocRow[];
}

const MANDATORY_DOCS = [
  { type: 'ID', label: 'FICA identity verification', detail: 'Certified ID copy retained under FICA s21' },
  { type: 'PROOF_OF_RESIDENCE', label: 'Proof of residence', detail: 'Utility or municipal account younger than 3 months' },
  { type: 'CONSENT', label: 'Astute 12-month consent', detail: 'Information access mandate for direct portfolio pulls' },
  { type: 'ADVICE_RECORD', label: 'Record of Advice (s8)', detail: 'FAIS General Code of Conduct advice record on file' }
];

const num = (value: number | string | undefined | null) =>
  typeof value === 'string' ? parseFloat(value) || 0 : value || 0;

const zar = (value: number | string | undefined | null, compact = false) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency', currency: 'ZAR', maximumFractionDigits: 0, notation: compact ? 'compact' : 'standard'
  }).format(num(value));

const dateZa = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({ clientId, onBack, onOpenClaims }) => {
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'policies' | 'goals' | 'balance' | 'compliance'>('policies');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      const res = await secureFetch<ClientDetail>(`/clients/${clientId}`);
      if (!mounted) return;
      if (res.error) setError(res.error);
      else setClient(res.data || null);
      setIsLoading(false);
    })();
    return () => { mounted = false; };
  }, [clientId]);

  const held = useMemo(() => new Set((client?.documents || []).map((d) => d.type)), [client]);
  const gaps = MANDATORY_DOCS.filter((d) => !held.has(d.type));

  const initials = (client?.fullName || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const monthlyPremium = (client?.policies || []).reduce((total, p) => total + num(p.monthlyPremium), 0);
  const totalCover = (client?.policies || []).reduce((total, p) => total + num(p.sumAssured), 0);

  if (isLoading) {
    return <div className="loading-container"><div className="skeleton-row" /><div className="skeleton-row" /><div className="skeleton-row" /></div>;
  }

  if (error || !client) {
    return (
      <div className="view-container">
        <button className="plain-action" onClick={onBack}><ArrowLeft size={14} /> Back to register</button>
        <div className="alert-banner alert-error"><ShieldAlert size={18} /><span>{error || 'Client record not found.'}</span></div>
      </div>
    );
  }

  const bs = client.balanceSheet;

  return (
    <div className="view-container">
      <button className="plain-action" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={14} /> Back to client register
      </button>

      <section className="c360-header">
        <div className="c360-avatar">{initials}</div>
        <div className="c360-id">
          <div className="eyebrow"><span className="tag">Client 360</span><span>HNW private wealth mandate</span></div>
          <h1>{client.title} {client.fullName}</h1>
          <div className="c360-meta">
            <span>Ref <b className="mono">{client.reference}</b></span>
            <span>ID <b className="mono">{client.maskedIdNumber || 'Not captured'}</b></span>
            <span>{client.age ? `${client.age} years` : 'DOB not captured'}</span>
            <span>{client.occupation || 'Occupation not captured'}{client.employer ? ` · ${client.employer}` : ''}</span>
            <span>Client since {dateZa(client.clientSince)}</span>
          </div>
          <div className="c360-flags">
            <span className={`pill-badge ${gaps.length === 0 ? 'compliance-ok' : 'compliance-warning'}`}>
              {gaps.length === 0 ? <><ShieldCheck size={12} /> FICA verified · Tier 3</> : <><ShieldAlert size={12} /> {gaps.length} compliance gap(s)</>}
            </span>
            <span className={`pill-badge risk-${client.riskProfile.toLowerCase()}`}>{client.riskProfile} mandate</span>
            <span className="pill-badge badge-info">FSP mandate · Cat I &amp; II</span>
            <span className="tier-chip">R500/mo retainer active</span>
          </div>
        </div>
        <div className="c360-actions">
          <button className="btn btn-primary"><RefreshCw size={15} /> Sync Astute</button>
          <button className="btn btn-secondary"><Send size={15} /> Issue broker letter</button>
          <button className="btn btn-secondary"><FileText size={15} /> Generate IRP5 pack</button>
          <button className="btn btn-gold" onClick={onOpenClaims}><Sparkles size={15} /> New claim</button>
        </div>
      </section>

      <section className="kpi-grid">
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Total family net worth</span><TrendingUp size={17} color="#1d4ed8" /></div>
          <div className="kpi-value">{zar(bs.netWorth, true)}</div>
          <div className="kpi-foot"><span>{zar(bs.totalAssets, true)} assets less {zar(bs.totalLiabilities, true)} liabilities</span></div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Monthly surplus</span><Wallet size={17} color="#1d4ed8" /></div>
          <div className="kpi-value">{zar(bs.monthlySurplus)}</div>
          <div className="kpi-foot"><span>Income {zar(bs.monthlyIncome)} · expenses {zar(bs.monthlyExpenses)}</span></div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Debt to assets</span><Landmark size={17} color="#1d4ed8" /></div>
          <div className="kpi-value">{bs.debtToAssetsPercent}%</div>
          <div className="kpi-foot">
            <div className="meter"><i className={bs.debtToAssetsPercent > 45 ? 'gold' : 'ok'} style={{ width: `${Math.min(bs.debtToAssetsPercent, 100)}%` }} /></div>
            <span>{bs.monthsOfExpensesCovered} months of expenses covered by assets</span>
          </div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Risk &amp; review status</span><CalendarClock size={17} color="#1d4ed8" /></div>
          <div className="kpi-value" style={{ fontSize: 24 }}>{client.riskScore ?? '—'} <small>/ 100</small></div>
          <div className="kpi-foot">
            <span>Next annual review {dateZa(client.nextReviewDate)}</span>
            <span>Licence expiry {dateZa(client.licenceExpiry)}</span>
          </div>
        </article>
      </section>

      <section className="crm-panel">
        <div className="panel-heading">
          <div>
            <h2>Comprehensive financial services scope (SLA mandate)</h2>
            <p>Royal Square Financial institutional scope matrix under FAIS Cat I &amp; II regulation</p>
          </div>
          <span className="pill-badge badge-info">{client.policies.length} product lines enrolled</span>
        </div>

        <div className="scope-grid">
          <div>
            <div className="scope-col-title"><Home size={15} /> Personal (individuals)</div>
            <ScopeItem
              icon={<HeartPulse size={15} />}
              title="Risk cover"
              body="Life, death, dread disease, disability, income protection and funeral"
              providers={client.policies.filter((p) => /life|risk|illness|funeral/i.test(p.productType))}
            />
            <ScopeItem
              icon={<PiggyBank size={15} />}
              title="Retirement planning"
              body="Retirement annuity, preservation and living annuity structures"
              providers={client.policies.filter((p) => /retire|annuit|preserv|endow/i.test(p.productType))}
            />
            <ScopeItem
              icon={<ShieldCheck size={15} />}
              title="Short-term insurance"
              body="Household contents, vehicles, jewellery and specified all-risk items"
              providers={client.policies.filter((p) => /personal lines|comprehensive|short|motor|multi-peril/i.test(p.productType))}
            />
            <ScopeItem
              icon={<Target size={15} />}
              title="Investments &amp; discretionary"
              body="JSE equities, unit trusts and offshore feeder portfolios"
              providers={client.policies.filter((p) => /invest|unit trust|offshore|equity/i.test(p.productType))}
            />
          </div>
          <div>
            <div className="scope-col-title"><Building2 size={15} /> Business &amp; corporate</div>
            <ScopeItem
              icon={<FileSignature size={15} />}
              title="Keyperson &amp; buy/sell assurance"
              body="Keyperson life and disability with s9(1) tax-compliant cross-purchase agreement"
              providers={client.policies.filter((p) => /keyperson|buy|corporate/i.test(p.productType))}
            />
            <ScopeItem
              icon={<Building2 size={15} />}
              title="Commercial asset &amp; cyber protection"
              body="Premises, high-tech electronics, business interruption and cyber extortion shield"
              providers={client.policies.filter((p) => /commercial|cyber|business/i.test(p.productType))}
            />
            <div className="kv-strip"><span className="text-muted">Combined monthly premium</span><b>{zar(monthlyPremium)}</b></div>
            <div className="kv-strip" style={{ marginTop: 8 }}><span className="text-muted">Aggregate sum assured</span><b>{zar(totalCover, true)}</b></div>
            <div className="kv-strip" style={{ marginTop: 8 }}><span className="text-muted">Annual income declared</span><b>{zar(client.annualIncome)}</b></div>
            <div className="kv-strip" style={{ marginTop: 8 }}><span className="text-muted">Contact</span><b>{client.mobileNumber || '—'}</b></div>
          </div>
        </div>
      </section>

      <section className="crm-panel">
        <div className="tabs">
          <button className={`tab-btn ${tab === 'policies' ? 'active' : ''}`} onClick={() => setTab('policies')}>
            <ShieldCheck size={15} /> Policies &amp; assets ({client.policies.length})
          </button>
          <button className={`tab-btn ${tab === 'goals' ? 'active' : ''}`} onClick={() => setTab('goals')}>
            <Target size={15} /> Goal tracking ({client.goals.length})
          </button>
          <button className={`tab-btn ${tab === 'balance' ? 'active' : ''}`} onClick={() => setTab('balance')}>
            <Landmark size={15} /> Balance sheet
          </button>
          <button className={`tab-btn ${tab === 'compliance' ? 'active' : ''}`} onClick={() => setTab('compliance')}>
            <BadgeCheck size={15} /> Compliance &amp; documents ({client.documents.length})
          </button>
        </div>

        {tab === 'policies' && (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy / asset type</th><th>Product provider</th><th>Policy no.</th>
                  <th className="num">Sum assured</th><th className="num">Premium (pm)</th><th>Next review</th>
                </tr>
              </thead>
              <tbody>
                {client.policies.length === 0 && <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 22 }}>No policies captured on the Astute feed.</td></tr>}
                {client.policies.map((policy) => (
                  <tr key={policy.id}>
                    <td style={{ fontWeight: 500 }}>{policy.productType}</td>
                    <td>{policy.provider}</td>
                    <td className="ref">{policy.policyNumber}</td>
                    <td className="num">{zar(policy.sumAssured)}</td>
                    <td className="num">{zar(policy.monthlyPremium)}</td>
                    <td>{dateZa(policy.renewalDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-foot">
              <span>Live synchronisation via Astute Exchange</span>
              <b>Monthly combined premium: {zar(monthlyPremium)}</b>
            </div>
          </div>
        )}

        {tab === 'goals' && (
          <div className="kpi-grid">
            {client.goals.length === 0 && <div className="empty-state">No goals captured for this mandate.</div>}
            {client.goals.map((goal) => (
              <article key={goal.id} className="kpi-card">
                <div className="kpi-top">
                  <span className="kpi-label">{goal.name}</span>
                  <span className="pill-badge badge-info">{goal.progressPercent}%</span>
                </div>
                <div className="kpi-value" style={{ fontSize: 22 }}>{zar(goal.currentAmount, true)}</div>
                <div className="kpi-foot">
                  <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${Math.min(goal.progressPercent, 100)}%` }} /></div>
                  <div className="flex justify-between">
                    <span>Target {zar(goal.targetAmount, true)}</span>
                    <span>by {dateZa(goal.targetDate)}</span>
                  </div>
                  <span>{goal.vehicle || goal.kind} · contributing {zar(goal.monthlyContribution)} pm</span>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === 'balance' && (
          <div className="scope-grid">
            <LedgerTable title="Assets" rows={bs.assets} total={bs.totalAssets} />
            <LedgerTable title="Liabilities" rows={bs.liabilities} total={bs.totalLiabilities} showCreditor />
            <LedgerTable title="Monthly income" rows={bs.income} total={bs.monthlyIncome} />
            <LedgerTable title="Monthly expenses" rows={bs.expenses} total={bs.monthlyExpenses} />
          </div>
        )}

        {tab === 'compliance' && (
          <div className="scope-grid">
            <div>
              <div className="scope-col-title"><BadgeCheck size={15} /> Mandatory FAIS / FICA dossier</div>
              {MANDATORY_DOCS.map((doc) => {
                const record = client.documents.find((d) => d.type === doc.type);
                return (
                  <div key={doc.type} className="scope-item">
                    <div className="scope-item-head">
                      <b>
                        {record ? <CheckCircle2 size={15} color="#10b981" /> : <ShieldAlert size={15} color="#dc2626" />}
                        {doc.label}
                      </b>
                      <span className={`pill-badge ${record ? 'compliance-ok' : 'compliance-warning'}`}>
                        {record ? `Signed ${dateZa(record.signedOn)}` : 'Outstanding'}
                      </span>
                    </div>
                    <p>{doc.detail}</p>
                  </div>
                );
              })}
            </div>
            <div>
              <div className="scope-col-title"><FileSignature size={15} /> Mandate &amp; servicing record</div>
              <div className="kv-strip"><span className="text-muted">Designated fiduciary advisor</span><b>Qiniso Ntuli (FSP 29370)</b></div>
              <div className="kv-strip" style={{ marginTop: 8 }}><span className="text-muted">Compliance officer</span><b>Mrs. C. van Wyk (CO 4073)</b></div>
              <div className="kv-strip" style={{ marginTop: 8 }}><span className="text-muted">Retainer structure</span><b>R 500 / month debit order</b></div>
              <div className="kv-strip" style={{ marginTop: 8 }}><span className="text-muted">Hourly advisory rate</span><b>R 1,500 ex VAT</b></div>
              <div className="kv-strip" style={{ marginTop: 8 }}><span className="text-muted">Primary address</span><b>{client.primaryAddress || '—'}</b></div>
              <div className="kv-strip" style={{ marginTop: 8 }}><span className="text-muted">Email</span><b>{client.emailAddress || '—'}</b></div>
              {gaps.length > 0 && (
                <div className="alert-banner alert-warn" style={{ marginTop: 12 }}>
                  <ShieldAlert size={17} />
                  <span>{gaps.length} mandatory document(s) outstanding — the annual review cannot be signed off until these are lodged.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const ScopeItem: React.FC<{ icon: React.ReactNode; title: string; body: string; providers: PolicyRow[] }> = ({ icon, title, body, providers }) => (
  <div className="scope-item">
    <div className="scope-item-head">
      <b>{icon} {title}</b>
      <span className={`pill-badge ${providers.length ? 'compliance-ok' : ''}`}>
        {providers.length ? 'Active [YES]' : 'Not enrolled'}
      </span>
    </div>
    <p>{body}</p>
    <div className="providers">
      {providers.length
        ? providers.map((p) => `${p.provider} (Pol #${p.policyNumber})`).join(' · ')
        : 'No matching product on the Astute feed'}
    </div>
  </div>
);

const LedgerTable: React.FC<{ title: string; rows: LedgerLine[]; total: number | string; showCreditor?: boolean }> = ({ title, rows, total, showCreditor }) => (
  <div className="data-table-wrap">
    <table className="data-table">
      <thead>
        <tr><th>{title}</th>{showCreditor && <th>Creditor</th>}<th className="num">Amount</th></tr>
      </thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={showCreditor ? 3 : 2} className="text-center text-muted" style={{ padding: 16 }}>No entries</td></tr>}
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.label}</td>
            {showCreditor && <td className="text-muted">{row.creditor || '—'}{row.interestRate ? ` · ${row.interestRate}%` : ''}</td>}
            <td className="num">{zar(row.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="table-foot"><span>{title} total</span><b>{zar(total)}</b></div>
  </div>
);
