import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  FileCheck2,
  ShieldAlert,
  Users
} from 'lucide-react';
import { secureFetch } from '../services/api';

interface DeskViewProps {
  onOpenClients: () => void;
  onOpenClaims: () => void;
  onOpenReminders: () => void;
}

interface ClientSummary {
  id: string;
  reference: string;
  fullName: string;
  complianceGapCount: number;
  daysUntilReview?: number;
}

interface ClaimSummary {
  id: string;
  reference: string;
  clientName: string;
  stage: string;
}

interface ReminderSummary {
  key: string;
  title?: string;
  message?: string;
  clientName?: string;
  bucket?: string;
  dueDate?: string;
}

export const DeskView: React.FC<DeskViewProps> = ({
  onOpenClients,
  onOpenClaims,
  onOpenReminders
}) => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [reminders, setReminders] = useState<ReminderSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDesk = async () => {
      setIsLoading(true);
      setError(null);

      const [clientRes, claimRes, reminderRes] = await Promise.all([
        secureFetch<ClientSummary[]>('/clients'),
        secureFetch<ClaimSummary[]>('/claims'),
        secureFetch<ReminderSummary[]>('/reminders')
      ]);

      if (!mounted) return;

      const firstError = clientRes.error || claimRes.error || reminderRes.error;
      if (firstError) {
        setError(firstError);
      }

      setClients(clientRes.data || []);
      setClaims(claimRes.data || []);
      setReminders(reminderRes.data || []);
      setIsLoading(false);
    };

    loadDesk();

    return () => {
      mounted = false;
    };
  }, []);

  const reviewCount = clients.filter((client) => (client.daysUntilReview ?? 999) <= 30).length;
  const complianceGapCount = clients.reduce((total, client) => total + (client.complianceGapCount || 0), 0);
  const urgentReminders = reminders.filter((reminder) =>
    ['OVERDUE', 'DUE_SOON'].includes((reminder.bucket || '').toUpperCase())
  );

  return (
    <div className="view-container desk-view">
      <div className="view-header">
        <div>
          <h1 className="view-title">Adviser Desk</h1>
          <p className="view-subtitle">Daily operating view for client reviews, claims, and compliance follow-up</p>
        </div>
      </div>

      <section className="date-strip" aria-label="Desk summary">
        <div className="date-strip-day">
          {new Date().toLocaleDateString('en-ZA', { weekday: 'long' })}
          <span>{new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="date-strip-divider" />
        <DeskStat label="Clients" value={clients.length} />
        <DeskStat label="Reviews due" value={reviewCount} hot={reviewCount > 0} />
        <DeskStat label="Open claims" value={claims.length} hot={claims.length > 0} />
        <DeskStat label="Compliance gaps" value={complianceGapCount} hot={complianceGapCount > 0} />
      </section>

      {error && (
        <div className="alert-banner alert-error">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="loading-container">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      ) : (
        <div className="desk-grid">
          <section className="crm-panel">
            <div className="panel-heading">
              <div>
                <h2>Priority Queue</h2>
                <p>Work that needs adviser attention</p>
              </div>
              <button className="plain-action" onClick={onOpenReminders}>View all</button>
            </div>

            <div className="queue-group">
              <div className="queue-label overdue">
                <span>Urgent reminders</span>
                <span>{urgentReminders.length}</span>
              </div>
              {urgentReminders.length === 0 ? (
                <EmptyQueue icon={<CheckCircle2 size={17} />} text="No urgent reminders" />
              ) : (
                urgentReminders.slice(0, 4).map((reminder) => (
                  <button key={reminder.key} className="queue-item" onClick={onOpenReminders}>
                    <Bell size={17} />
                    <span>
                      <strong>{reminder.title || reminder.message || 'Reminder due'}</strong>
                      <p>{reminder.clientName || 'Client follow-up'}{reminder.dueDate ? ` - ${reminder.dueDate}` : ''}</p>
                    </span>
                    <ArrowRight size={15} />
                  </button>
                ))
              )}
            </div>

            <div className="queue-group">
              <div className="queue-label">
                <span>Reviews due in 30 days</span>
                <span>{reviewCount}</span>
              </div>
              {clients.filter((client) => (client.daysUntilReview ?? 999) <= 30).slice(0, 4).map((client) => (
                <button key={client.id} className="queue-item" onClick={onOpenClients}>
                  <Users size={17} />
                  <span>
                    <strong>{client.fullName}</strong>
                    <p>{client.reference} - review {client.daysUntilReview && client.daysUntilReview < 0 ? 'overdue' : 'due soon'}</p>
                  </span>
                  <ArrowRight size={15} />
                </button>
              ))}
              {reviewCount === 0 && <EmptyQueue icon={<CheckCircle2 size={17} />} text="No reviews due soon" />}
            </div>
          </section>

          <div className="desk-side-stack">
            <section className="crm-panel">
              <div className="panel-heading">
                <div>
                  <h3>Claims Snapshot</h3>
                  <p>Active insurance work</p>
                </div>
                <button className="plain-action" onClick={onOpenClaims}>Open</button>
              </div>
              {claims.length === 0 ? (
                <EmptyQueue icon={<FileCheck2 size={17} />} text="No active claims" />
              ) : (
                claims.slice(0, 3).map((claim) => (
                  <button key={claim.id} className="claim-summary" onClick={onOpenClaims}>
                    <FileCheck2 size={17} />
                    <span>
                      <strong>{claim.reference}</strong>
                      <p>{claim.clientName} - {claim.stage.replace(/_/g, ' ')}</p>
                    </span>
                  </button>
                ))
              )}
            </section>

            <section className="crm-panel">
              <div className="panel-heading">
                <div>
                  <h3>Compliance</h3>
                  <p>Client file completeness</p>
                </div>
              </div>
              <button className="gap-summary" onClick={onOpenClients}>
                {complianceGapCount > 0 ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
                <span>{complianceGapCount} outstanding compliance gap{complianceGapCount === 1 ? '' : 's'}</span>
              </button>
              <div className="desk-note">
                <ShieldAlert size={17} />
                <span>Keep mandates, consent, and FICA documents current before annual review meetings.</span>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

const DeskStat: React.FC<{ label: string; value: number; hot?: boolean }> = ({ label, value, hot }) => (
  <div className={`desk-stat ${hot ? 'hot' : ''}`}>
    <b>{value}</b>
    <span>{label}</span>
  </div>
);

const EmptyQueue: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="queue-item">
    {icon}
    <span>
      <strong>{text}</strong>
      <p>Nothing requires action here.</p>
    </span>
  </div>
);
