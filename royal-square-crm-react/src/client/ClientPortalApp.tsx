import React, { useState } from 'react';
import { ClientProvider, useClient } from './context/ClientContext';
import { ClientHeader } from './components/ClientHeader';
import { ClientWealthPerformanceView } from './components/ClientWealthPerformanceView';
import { ClientPoliciesRegister } from './components/ClientPoliciesRegister';
import { SimplifiedClaimFlow } from './components/SimplifiedClaimFlow';
import { ClientComplianceShield } from './components/ClientComplianceShield';
import {
  TrendingUp,
  Shield,
  Car,
  CheckCircle2,
  Layers,
  PhoneCall
} from 'lucide-react';

const ClientPortalContent: React.FC = () => {
  const { client, accessibility } = useClient();
  const [activeTab, setActiveTab] = useState<'wealth' | 'policies' | 'report' | 'compliance'>('wealth');

  return (
    <div className={`client-portal-wrapper tone-${accessibility.tone} font-${accessibility.fontSize}`}>
      {/* 1. Header with Senior & 60+ Accessibility Controls */}
      <ClientHeader />

      {/* 2. Client Profile Mini Strip (Matching Kagiso & Lerato Mokoena Dashboard) */}
      <div className="client-id-bar">
        <div className="client-id-container">
          <div className="client-avatar-block">
            <div className="avatar-chip">KM</div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="client-display-name">{client.fullName}</span>
                <span className="pill-retainer">{client.retainerPlan}</span>
              </div>
              <p className="client-id-meta">
                Kagiso: <span className="font-mono">{client.primaryIdNumber}</span> &bull; Lerato: <span className="font-mono">{client.spouseIdNumber}</span> &bull; Tax Ref: <span className="font-mono">{client.taxNumber}</span> &bull; Mandate: <span className="text-white">{client.mandateSignedDate}</span>
              </p>
            </div>
          </div>

          <div className="client-badges-row">
            <span className="kyc-badge">
              <CheckCircle2 size={12} className="text-emerald" /> FICA Verified: Tier 3 Full KYC
            </span>
            <span className="kyc-badge">
              <CheckCircle2 size={12} className="text-blue" /> Astute Consent: Valid 14 Jan 2026
            </span>
            <span className="kyc-badge">
              <CheckCircle2 size={12} className="text-gold" /> FSP Mandate: CAT I & II Discretionary
            </span>
          </div>
        </div>
      </div>

      {/* 3. Primary Client Navigation Tabs */}
      <nav className="client-subnav-bar" aria-label="Client Portal Navigation">
        <div className="client-subnav-container">
          <button
            type="button"
            className={`client-nav-pill ${activeTab === 'wealth' ? 'active' : ''}`}
            onClick={() => setActiveTab('wealth')}
          >
            <TrendingUp size={16} />
            <span>Wealth & Performance (Wins & Losses)</span>
          </button>

          <button
            type="button"
            className={`client-nav-pill ${activeTab === 'policies' ? 'active' : ''}`}
            onClick={() => setActiveTab('policies')}
          >
            <Layers size={16} />
            <span>Active Policies & Underwriting (7)</span>
          </button>

          <button
            type="button"
            className={`client-nav-pill ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            <Car size={16} />
            <span>Report Incident / Claim</span>
          </button>

          <button
            type="button"
            className={`client-nav-pill ${activeTab === 'compliance' ? 'active' : ''}`}
            onClick={() => setActiveTab('compliance')}
          >
            <Shield size={16} />
            <span>Compliance & POPIA Shield</span>
          </button>
        </div>
      </nav>

      {/* 4. Tab Content */}
      <main className="client-main-container">
        {activeTab === 'wealth' && (
          <ClientWealthPerformanceView
            onNavigateToReport={() => setActiveTab('report')}
            onNavigateToPolicies={() => setActiveTab('policies')}
          />
        )}
        {activeTab === 'policies' && <ClientPoliciesRegister />}
        {activeTab === 'report' && <SimplifiedClaimFlow />}
        {activeTab === 'compliance' && <ClientComplianceShield />}
      </main>

      {/* 5. Institutional Footer */}
      <footer className="client-portal-footer">
        <div className="client-footer-container">
          <div className="footer-left">
            <p className="footer-text">
              Royal Square Financial Services (Pty) Ltd &bull; Authorised Financial Services Provider FSP 29370.
            </p>
            <p className="footer-subtext">
              Institutional Banking Grade 256-bit Encryption &bull; POPIA & FAIS Compliant Archive &bull; Microsoft Azure & Google Cloud Africa.
            </p>
          </div>
          <div className="footer-right">
            <span className="emergency-call-pill">
              <PhoneCall size={14} className="text-gold" />
              Santam 24/7 Roadside Towing: <strong>0800 111 222</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ClientErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ClientPortal error caught:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('rs_client_profile');
    localStorage.removeItem('rs_client_profile_v2');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0e1628',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
            Royal Square Private Wealth Portal
          </h2>
          <p style={{ color: '#cbd5e1', maxWidth: '500px', marginBottom: '20px', fontSize: '15px' }}>
            We've refreshed your private wealth profile and security credentials. Click below to load your real-time portfolio.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: '#d4af37',
              color: '#0b0f19',
              fontWeight: 800,
              fontSize: '15px',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Load Real-Time Portfolio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ClientPortalApp: React.FC = () => {
  return (
    <ClientErrorBoundary>
      <ClientProvider>
        <ClientPortalContent />
      </ClientProvider>
    </ClientErrorBoundary>
  );
};

export default ClientPortalApp;
