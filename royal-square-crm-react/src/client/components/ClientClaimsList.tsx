import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { secureFetch } from '../../services/api';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Car
} from 'lucide-react';

interface ClientClaimItem {
  id: string;
  reference: string;
  incidentDate: string;
  stage: 'INTAKE' | 'ASSESSOR_REVIEW' | 'AWAITING_SAPS' | 'APPROVED' | 'SETTLED';
  description: string;
  claimAmount?: number;
  sapsDocketNumber?: string;
}

const DEFAULT_CLAIMS: ClientClaimItem[] = [
  {
    id: 'clm-prev-01',
    reference: 'CLM-78210',
    incidentDate: '2026-08-14',
    stage: 'APPROVED',
    description: 'Rear bumper impact by third-party delivery vehicle at Rivonia Road red traffic light.',
    claimAmount: 18500,
    sapsDocketNumber: 'CAS 312/08/2026'
  },
  {
    id: 'clm-prev-02',
    reference: 'CLM-61044',
    incidentDate: '2026-04-03',
    stage: 'SETTLED',
    description: 'Windscreen shatter caused by highway gravel debris on N1 North.',
    claimAmount: 6400,
    sapsDocketNumber: 'N/A (Glass Only)'
  }
];

export const ClientClaimsList: React.FC<{ onNewClaimClick: () => void }> = ({ onNewClaimClick }) => {
  const { client } = useClient();
  const [claims, setClaims] = useState<ClientClaimItem[]>(DEFAULT_CLAIMS);

  useEffect(() => {
    // Attempt to load from API if live
    const loadClaims = async () => {
      try {
        const res = await secureFetch<any[]>('/claims');
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map((c) => ({
            id: c.id || c.reference,
            reference: c.reference || 'CLM-PENDING',
            incidentDate: c.incidentDate || c.createdAt || new Date().toISOString().split('T')[0],
            stage: (c.stage || 'INTAKE') as any,
            description: c.description || 'Motor accident claim',
            claimAmount: c.estimatedAmount || undefined,
            sapsDocketNumber: c.policeCaseNumber
          }));
          setClaims([...mapped, ...DEFAULT_CLAIMS]);
        }
      } catch {
        // use default claims
      }
    };
    loadClaims();
  }, []);

  const getStageBadge = (stage: ClientClaimItem['stage']) => {
    switch (stage) {
      case 'APPROVED':
        return <span className="stage-pill stage-approved"><CheckCircle2 size={12} /> Approved &bull; Panel Beater Authorized</span>;
      case 'SETTLED':
        return <span className="stage-pill stage-settled"><CheckCircle2 size={12} /> Settled & Repaired</span>;
      case 'ASSESSOR_REVIEW':
        return <span className="stage-pill stage-review"><Clock size={12} /> Assessor Inspection</span>;
      case 'AWAITING_SAPS':
        return <span className="stage-pill stage-warning"><AlertCircle size={12} /> Awaiting SAPS Docket</span>;
      default:
        return <span className="stage-pill stage-intake"><Clock size={12} /> Received & In Progress</span>;
    }
  };

  return (
    <div className="client-claims-view">
      <div className="claims-header-row">
        <div>
          <h2 className="claims-headline">Your Claims History</h2>
          <p className="claims-subhead">
            Tracking claims under Santam Policy #{client.insuredVehicle.policyNumber}
          </p>
        </div>
        <button type="button" className="btn btn-primary flex items-center gap-1.5" onClick={onNewClaimClick}>
          <Car size={15} /> Report New Accident
        </button>
      </div>

      <div className="client-claims-stack">
        {claims.map((claim) => (
          <div key={claim.id} className="client-claim-card">
            <div className="claim-card-top">
              <div className="flex items-center gap-2">
                <span className="claim-ref-pill font-mono">{claim.reference}</span>
                <span className="claim-date text-xs text-muted">Incident: {claim.incidentDate}</span>
              </div>
              <div>{getStageBadge(claim.stage)}</div>
            </div>

            <p className="claim-desc">{claim.description}</p>

            <div className="claim-card-footer">
              <div className="footer-meta">
                {claim.claimAmount && (
                  <span className="amount-tag">
                    Authorized: <strong>R {claim.claimAmount.toLocaleString()}</strong>
                  </span>
                )}
                {claim.sapsDocketNumber && (
                  <span className="saps-tag">
                    SAPS Case: <strong>{claim.sapsDocketNumber}</strong>
                  </span>
                )}
              </div>
              <div className="advisor-tag">
                Assigned: {client.advisor.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
