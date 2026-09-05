import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  Circle,
  Download,
  FileText,
  Gavel,
  MapPin,
  Phone,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { secureFetch } from '../services/api';

interface ClaimIncidentViewProps {
  claimId: string;
  onBack: () => void;
}

interface SceneItem { item: string; label: string; done: boolean; }
interface LogItem { text: string; recordedAt: string; }

interface ClaimDetail {
  id: string; reference: string; clientId: string; clientName: string;
  insurer: string; policyNumber?: string; insurerClaimNumber?: string; claimsHandler?: string;
  claimType: string; incidentDate: string; lodgedDate: string; description?: string;
  stage: string; stepNumber: number; totalSteps: number; closed: boolean;
  sceneChecklist: SceneItem[]; log: LogItem[];
}

const SOP = [
  { stage: 'REGISTERED', title: 'First notification of loss captured', detail: 'Telephonic FNOL cross-referenced with the broker portal.' },
  { stage: 'DOCS_REQUESTED', title: 'Statutory documents requested', detail: 'SAPS case number, licence discs and driver ID requested from the client.' },
  { stage: 'DOCS_RECEIVED', title: 'Evidence pack received', detail: 'Scene photographs, police docket and witness details verified.' },
  { stage: 'ASSESSOR_APPOINTED', title: 'Assessor appointed', detail: 'Insurer allocates a loss adjuster and inspection slot.' },
  { stage: 'ASSESSMENT', title: 'Vehicle taken for assessment', detail: 'Digital chassis scan and structural integrity report compiled.' },
  { stage: 'DECISION', title: 'Insurer authorises repairs', detail: 'Authorisation letter issued and excess waiver validated.' },
  { stage: 'OFFER', title: 'Settlement offer issued', detail: 'Quantum, excess and salvage position presented to the client.' },
  { stage: 'ACCEPTED', title: 'Client accepts offer', detail: 'Acceptance recorded with the mandated fiduciary advisor.' },
  { stage: 'PAID', title: 'Settlement paid', detail: 'Funds released to the repairer or the client bank account.' },
  { stage: 'CLOSED', title: 'File archived', detail: 'Post-repair quality audit, recovery handover and dossier closure.' }
];

const EVIDENCE_ICONS: Record<string, React.ReactNode> = {
  PHOTOS: <Camera size={24} />,
  POLICE_REPORT: <Gavel size={24} />,
  WITNESS_DETAILS: <UserCheck size={24} />,
  DAMAGE_ESTIMATE: <FileText size={24} />,
  INVOICES: <FileText size={24} />
};

const dateZa = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const ClaimIncidentView: React.FC<ClaimIncidentViewProps> = ({ claimId, onBack }) => {
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const res = await secureFetch<ClaimDetail>(`/claims/${claimId}`);
    if (res.error) setError(res.error);
    else { setClaim(res.data || null); setError(null); }
    setIsLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [claimId]);

  const toggle = async (item: string) => {
    const res = await secureFetch<ClaimDetail>(`/claims/${claimId}/checklist/${item}/toggle`, { method: 'POST' });
    if (res.data) setClaim(res.data);
  };

  const advance = async () => {
    const res = await secureFetch<ClaimDetail>(`/claims/${claimId}/advance`, { method: 'POST' });
    if (res.data) setClaim(res.data);
  };

  if (isLoading) return <div className="loading-container"><div className="skeleton-row" /><div className="skeleton-row" /></div>;

  if (error || !claim) {
    return (
      <div className="view-container">
        <button className="plain-action" onClick={onBack}><ArrowLeft size={14} /> Back to claims</button>
        <div className="alert-banner alert-error"><ShieldAlert size={18} /><span>{error || 'Claim not found.'}</span></div>
      </div>
    );
  }

  const policeLodged = claim.sceneChecklist.find((i) => i.item === 'POLICE_REPORT')?.done;
  const progress = Math.round((claim.stepNumber / claim.totalSteps) * 100);

  return (
    <div className="view-container">
      <button className="plain-action" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={14} /> Back to claims pipeline
      </button>

      {!policeLodged && (
        <div className="statutory-notice">
          <AlertOctagon size={20} color="#dc2626" />
          <div>
            <h4>Mandatory statutory notice · National Road Traffic Act &amp; FAIS</h4>
            <p>
              South African law and short-term policy covenants require this incident to be formally declared to the
              South African Police Service (SAPS) within 48 hours to secure an unchallengeable accident report (AR)
              case number for insurer indemnification. No SAPS record is attached to this file.
            </p>
          </div>
        </div>
      )}

      <section className="claim-detail-header" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 18 }}>
        <div>
          <div className="eyebrow"><span className="tag">Short-term claims portal</span><span className="mono">Broker FSP 29370-ST</span></div>
          <h1 className="detail-title" style={{ marginTop: 6 }}>Register &amp; track motor vehicle claim</h1>
          <p className="detail-subtitle">
            <span className="mono">{claim.reference}</span> · {claim.clientName} · {claim.insurer}
            {claim.policyNumber ? ` · policy ${claim.policyNumber}` : ''}
          </p>
        </div>
        <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
          <div className="kv-strip" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <span className="text-muted">Claim stage</span>
            <b>{claim.stage.replace(/_/g, ' ')} · step {claim.stepNumber} of {claim.totalSteps}</b>
          </div>
          <button className="btn btn-secondary"><Download size={15} /> Export claim dossier</button>
          {!claim.closed && <button className="btn btn-primary" onClick={advance}>Advance stage <ChevronRight size={15} /></button>}
        </div>
      </section>

      <div className="split-2-1">
        <div className="stack">
          <section className="crm-panel">
            <div className="panel-heading">
              <div>
                <h2>Part A · Incident &amp; third-party record</h2>
                <p>Accident scene telemetry, involved parties and police verification</p>
              </div>
              <span className="pill-badge badge-info">Verified submission</span>
            </div>

            <div className="field-pairs" style={{ marginBottom: 14 }}>
              <div className="field-pair"><span>Date of loss</span><b>{dateZa(claim.incidentDate)}</b></div>
              <div className="field-pair"><span>Lodged with insurer</span><b>{dateZa(claim.lodgedDate)}</b></div>
              <div className="field-pair"><span>Claim type</span><b>{claim.claimType.replace(/_/g, ' ')}</b></div>
              <div className="field-pair"><span>Insurer claim no.</span><b className="mono">{claim.insurerClaimNumber || 'Awaiting allocation'}</b></div>
            </div>

            <div className="vs-grid">
              <div className="vs-card">
                <span className="pill-badge badge-info">Insured client vehicle</span>
                <h4>{claim.clientName}</h4>
                <div className="field-pairs">
                  <div className="field-pair"><span>Policy</span><b className="mono">{claim.policyNumber || '—'}</b></div>
                  <div className="field-pair"><span>Insurer</span><b>{claim.insurer}</b></div>
                  <div className="field-pair"><span>Claims handler</span><b>{claim.claimsHandler || 'Unallocated'}</b></div>
                  <div className="field-pair"><span>Driveability</span><b>Reported at scene</b></div>
                </div>
              </div>
              <div className="vs-card third">
                <span className="pill-badge compliance-warning">Third-party recovery target</span>
                <h4>Third-party particulars</h4>
                <div className="field-pairs">
                  <div className="field-pair"><span>Details captured</span><b>{claim.sceneChecklist.find((i) => i.item === 'WITNESS_DETAILS')?.done ? 'On file' : 'Outstanding'}</b></div>
                  <div className="field-pair"><span>Subrogation</span><b>Rights reserved (100%)</b></div>
                  <div className="field-pair"><span>SAPS docket</span><b>{policeLodged ? 'Lodged' : 'Not lodged'}</b></div>
                  <div className="field-pair"><span>Damage estimate</span><b>{claim.sceneChecklist.find((i) => i.item === 'DAMAGE_ESTIMATE')?.done ? 'Received' : 'Pending'}</b></div>
                </div>
              </div>
            </div>

            {claim.description && (
              <div className="desk-note" style={{ marginTop: 14 }}>
                <MapPin size={16} />
                <span>{claim.description}</span>
              </div>
            )}
          </section>

          <section className="crm-panel">
            <div className="panel-heading">
              <div>
                <h2>Part B · Scene evidence &amp; cloud uploads</h2>
                <p>Strict forensic chain of custody and photographic telemetry</p>
              </div>
              <span className="pill-badge badge-info">
                {claim.sceneChecklist.filter((i) => i.done).length} of {claim.sceneChecklist.length} mandatory artefacts
              </span>
            </div>
            <div className="evidence-grid">
              {claim.sceneChecklist.map((item, index) => (
                <article key={item.item} className="evidence-card">
                  <div className="evidence-thumb">
                    {EVIDENCE_ICONS[item.item] || <FileText size={24} />}
                    <span className="count">Item {String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="evidence-body">
                    <b>{item.label}</b>
                    <span>{item.done ? 'Verified and synced to the claim vault' : 'Not yet gathered from the client'}</span>
                  </div>
                  <div className="evidence-foot">
                    <span style={{ color: item.done ? '#065f46' : '#991b1b' }}>
                      {item.done ? <CheckCircle2 size={13} /> : <Circle size={13} />} {item.done ? 'Verified' : 'Outstanding'}
                    </span>
                    <button className="btn btn-xs btn-secondary" onClick={() => toggle(item.item)}>
                      {item.done ? 'Unmark' : 'Mark gathered'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="crm-panel">
            <div className="panel-heading">
              <div>
                <h3>Post-submission sequence</h3>
                <p>Step {claim.stepNumber} of {claim.totalSteps} · rigorous 10-step fiduciary protocol</p>
              </div>
            </div>
            <div className="stage-tracker">
              <div className="stage-tracker-header"><span>Pipeline progress</span><span>{progress}%</span></div>
              <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div>
            </div>
            <div className="sop-list">
              {SOP.map((step, index) => {
                const state = index + 1 < claim.stepNumber ? 'done' : index + 1 === claim.stepNumber ? 'current' : '';
                return (
                  <div key={step.stage} className={`sop-step ${state}`}>
                    <span className="sop-num">{state === 'done' ? <CheckCircle2 size={13} /> : index + 1}</span>
                    <div>
                      <b>{step.title}</b>
                      <p>{step.detail}</p>
                      <span className="when">{state === 'done' ? 'Completed' : state === 'current' ? 'In progress' : 'Pending'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="kv-strip" style={{ marginTop: 12 }}>
              <span className="text-muted"><Phone size={13} /> Broker claims desk</span>
              <b>claims@royalsquare.co.za</b>
            </div>
          </section>

          <section className="audit-log-card">
            <div className="section-title">Claim audit trail</div>
            <div className="audit-timeline">
              {claim.log.length === 0 && <p className="text-muted text-sm">No entries recorded yet.</p>}
              {claim.log.map((entry, index) => (
                <div key={index} className="timeline-entry">
                  <span className="timeline-dot" />
                  <div className="timeline-content">
                    <span className="timeline-time">
                      {new Date(entry.recordedAt).toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="timeline-text">{entry.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
