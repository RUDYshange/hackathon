import React, { useState } from 'react';
import { ClientListView } from '../views/ClientListView';
import { ClientDetailView } from '../views/ClientDetailView';
import { SecureClientFormView } from '../views/SecureClientFormView';
import { ServerDrivenFormView } from '../views/ServerDrivenFormView';
import { ClaimsPipelineView } from '../views/ClaimsPipelineView';
import { ClaimIncidentView } from '../views/ClaimIncidentView';
import { ComplianceView } from '../views/ComplianceView';
import { ProvidersView } from '../views/ProvidersView';
import { RemindersView } from '../views/RemindersView';
import { DeskView } from '../views/DeskView';
import { SettingsView } from '../views/SettingsView';
import { VoiceAssistant } from '../components/VoiceAssistant';
import {
  Users,
  Layers,
  FileCheck2,
  Bell,
  LayoutDashboard,
  Search,
  UserPlus,
  ClipboardPlus,
  ShieldCheck,
  Building2,
  BadgeCheck,
  ChevronDown,
  Settings,
  LogOut,
  ArrowLeft,
  Send
} from 'lucide-react';
import { ProviderSyncModal } from '../components/ProviderSyncModal';

type ActiveTab =
  | 'desk'
  | 'clients'
  | 'client-detail'
  | 'new-client'
  | 'sdui'
  | 'claims'
  | 'claim-detail'
  | 'compliance'
  | 'providers'
  | 'reminders'
  | 'settings';

interface AdvisorConsoleProps {
  /** Called when the adviser signs out — returns to the landing page. */
  onSignOut?: () => void;
  /** Display name of the signed-in adviser (from the auth session). */
  advisorName?: string;
  /** Switch to client portal */
  onSwitchToClient?: () => void;
}

/**
 * The institutional, staff-facing CRM console (formerly the app root). It is now
 * one of two workspaces reachable from the landing page: businesses/advisers land
 * here, while clients land on the client portal (ClientDashboardView).
 */
export const AdvisorConsole: React.FC<AdvisorConsoleProps> = ({ onSignOut, advisorName, onSwitchToClient }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('desk');
  const [openLogClaimDirectly, setOpenLogClaimDirectly] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isProviderSyncOpen, setIsProviderSyncOpen] = useState<boolean>(false);

  const go = (tab: ActiveTab) => {
    setActiveTab(tab);
    setOpenLogClaimDirectly(false);
  };

  const handleOpenClaims = (openModal = false) => {
    setActiveTab('claims');
    setOpenLogClaimDirectly(openModal);
  };

  const openClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('client-detail');
  };

  const openClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
    setActiveTab('claim-detail');
  };

  const railKey: ActiveTab = activeTab === 'client-detail' ? 'clients' : activeTab === 'claim-detail' ? 'claims' : activeTab;

  const displayName = advisorName?.trim() || 'Qiniso Ntuli';
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'QN';

  return (
    <div className="crm-app">
      <aside className="crm-rail">
        <div className="crm-brand">
          <div className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></div>
          <div>
            <h1>Royal Square Financial</h1>
            <p>Wealth Advisory</p>
          </div>
        </div>

        <div className="rail-licence">
          <span>FSP Licence 29370</span>
          <b>CAT I &amp; II</b>
        </div>

        <nav className="crm-nav" aria-label="Main navigation">
          <span className="nav-section">Institutional modules</span>
          <NavItem active={railKey === 'desk'} onClick={() => go('desk')} icon={<LayoutDashboard size={16} />} label="Dashboard" />
          <NavItem active={railKey === 'clients'} onClick={() => go('clients')} icon={<Users size={16} />} label="Clients & Portfolios" />
          <NavItem active={railKey === 'claims'} onClick={() => handleOpenClaims(false)} icon={<FileCheck2 size={16} />} label="Claims Management" badge="2" />
          <NavItem active={railKey === 'compliance'} onClick={() => go('compliance')} icon={<ShieldCheck size={16} />} label="Compliance & SLAs" />
          <NavItem active={railKey === 'reminders'} onClick={() => go('reminders')} icon={<Bell size={16} />} label="Reminders & Reviews" badge="12" />
          <NavItem active={railKey === 'providers'} onClick={() => go('providers')} icon={<Building2 size={16} />} label="Product Providers" />

          <span className="nav-section">Servicing</span>
          <NavItem active={railKey === 'new-client'} onClick={() => go('new-client')} icon={<UserPlus size={16} />} label="Onboard client" />
          <NavItem active={railKey === 'sdui'} onClick={() => go('sdui')} icon={<Layers size={16} />} label="Form engine" />
          <NavItem active={railKey === 'settings'} onClick={() => go('settings')} icon={<Settings size={16} />} label="Settings" />
        </nav>

        <div className="rail-foot">
          <div className="astute-strip">
            <span className="label"><span className="dot pulse" /> Astute Exchange</span>
            <b>Synced</b>
          </div>
          <div className="adviser-card">
            <div className="adviser-avatar">CW</div>
            <div>
              <b>Mrs. C. van Wyk</b>
              <span>Compliance Officer · CO 4073</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="crm-main">
        <header className="crm-topbar">
          <label className="global-search">
            <Search size={15} />
            <span className="sr-only">Search</span>
            <input placeholder="Search clients (ID / name), policies, claims, Astute records" />
          </label>
          <span className="fsp-chip"><BadgeCheck size={13} /> FSP 29370 · FAIS COMPLIANT</span>
          <div className="topbar-spacer" />
          {onSwitchToClient && (
            <button
              className="btn btn-secondary"
              style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8' }}
              onClick={onSwitchToClient}
              title="Switch to Client-Facing Portal"
            >
              <ArrowLeft size={15} /> Client Portal
            </button>
          )}
          <button 
            className="btn btn-secondary"
            style={{ borderColor: '#10b981', color: '#047857', background: '#ecfdf5', fontWeight: 600 }}
            onClick={() => setIsProviderSyncOpen(true)}
            title="Open Insurer API Gateway & Pass-Through Underwriting (Mock)"
          >
            <Send size={15} /> Sync to Insurer (API)
          </button>
          <button className="btn btn-secondary" onClick={() => handleOpenClaims(true)}><ClipboardPlus size={15} /> Register claim</button>
          <button className="btn btn-primary" onClick={() => go('new-client')}><UserPlus size={15} /> New client</button>
          <div className="adviser-card" style={{ border: 'none', padding: '0 0 0 8px' }}>
            <div className="adviser-avatar">{initials}</div>
            <div>
              <b>{displayName}</b>
              <span>Practice Director</span>
            </div>
            <ChevronDown size={15} color="#94a3b8" />
          </div>
          {onSignOut && (
            <button className="btn crm-signout" onClick={onSignOut} title="Sign out" aria-label="Sign out">
              <LogOut size={15} /> Sign out
            </button>
          )}
        </header>

        <main className="crm-content">
          {activeTab === 'desk' && (
            <DeskView
              advisorName={displayName}
              onOpenClients={() => go('clients')}
              onOpenClaims={() => handleOpenClaims(false)}
              onOpenReminders={() => go('reminders')}
              onOpenClient={openClient}
              onOpenClaim={openClaim}
            />
          )}

          {activeTab === 'clients' && (
            <ClientListView
              onNewClientClick={() => go('new-client')}
              onSelectClient={openClient}
            />
          )}

          {activeTab === 'client-detail' && selectedClientId && (
            <ClientDetailView
              clientId={selectedClientId}
              onBack={() => go('clients')}
              onOpenClaims={() => handleOpenClaims(false)}
            />
          )}

          {activeTab === 'new-client' && (
            <SecureClientFormView
              onBack={() => go('clients')}
              onSuccess={() => go('clients')}
            />
          )}

          {activeTab === 'sdui' && <ServerDrivenFormView />}

          {activeTab === 'claims' && (
            <ClaimsPipelineView initialOpenLogClaim={openLogClaimDirectly} onOpenIncidentHub={openClaim} />
          )}

          {activeTab === 'claim-detail' && selectedClaimId && (
            <ClaimIncidentView claimId={selectedClaimId} onBack={() => handleOpenClaims(false)} />
          )}

          {activeTab === 'compliance' && <ComplianceView />}

          {activeTab === 'providers' && <ProvidersView />}

          {activeTab === 'reminders' && <RemindersView />}

          {activeTab === 'settings' && <SettingsView />}

          <div className="compliance-footer">
            <ShieldCheck size={13} /> Institutional banking grade 256-bit encryption · POPIA &amp; FAIS compliant archive ·
            Royal Square Financial (Pty) Ltd · Licensed Financial Services Provider FSP 29370
          </div>
        </main>
      </div>

      <VoiceAssistant />

      <ProviderSyncModal
        isOpen={isProviderSyncOpen}
        onClose={() => setIsProviderSyncOpen(false)}
      />
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: string }> = ({ active, onClick, icon, label, badge }) => (
  <button className="crm-nav-item" aria-current={active ? 'page' : undefined} onClick={onClick}>
    <span className="nav-icon">{icon}</span><span>{label}</span>{badge && <span className="nav-badge">{badge}</span>}
  </button>
);

export default AdvisorConsole;
