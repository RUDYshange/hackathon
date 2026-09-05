import React, { useState } from 'react';
import { ClientListView } from './views/ClientListView';
import { SecureClientFormView } from './views/SecureClientFormView';
import { ServerDrivenFormView } from './views/ServerDrivenFormView';
import { ClaimsPipelineView } from './views/ClaimsPipelineView';
import { RemindersView } from './views/RemindersView';
import { DeskView } from './views/DeskView';
import { VoiceAssistant } from './components/VoiceAssistant';
import {
  Users,
  Layers,
  FileCheck2,
  Bell,
  LayoutDashboard,
  Search,
  UserPlus,
  ClipboardPlus,
  Car
} from 'lucide-react';

type ActiveTab = 'desk' | 'clients' | 'new-client' | 'sdui' | 'claims' | 'reminders';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('desk');
  const [openLogClaimDirectly, setOpenLogClaimDirectly] = useState<boolean>(false);
  const [openAccidentReportDirectly, setOpenAccidentReportDirectly] = useState<boolean>(false);

  const handleOpenClaims = (openModal = false, openAccident = false) => {
    setActiveTab('claims');
    setOpenLogClaimDirectly(openModal);
    setOpenAccidentReportDirectly(openAccident);
  };

  return (
    <div className="crm-app">
      <aside className="crm-rail">
        <div className="crm-brand">
          <div className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></div>
          <h1>Royal Square Financial</h1>
          <p>FSP 29370</p>
        </div>

        <nav className="crm-nav" aria-label="Main navigation">
          <span className="nav-section">Practice</span>
          <NavItem active={activeTab === 'desk'} onClick={() => { setActiveTab('desk'); setOpenLogClaimDirectly(false); setOpenAccidentReportDirectly(false); }} icon={<LayoutDashboard size={15} />} label="The desk" />
          <NavItem active={activeTab === 'clients'} onClick={() => { setActiveTab('clients'); setOpenLogClaimDirectly(false); setOpenAccidentReportDirectly(false); }} icon={<Users size={15} />} label="Clients" badge="3" />
          <NavItem active={activeTab === 'reminders'} onClick={() => { setActiveTab('reminders'); setOpenLogClaimDirectly(false); setOpenAccidentReportDirectly(false); }} icon={<Bell size={15} />} label="Reminders" badge="12" />
          <span className="nav-section">Servicing</span>
          <NavItem active={activeTab === 'claims'} onClick={() => handleOpenClaims(false, false)} icon={<FileCheck2 size={15} />} label="Claims" badge="2" />
          <NavItem active={activeTab === 'new-client'} onClick={() => { setActiveTab('new-client'); setOpenLogClaimDirectly(false); setOpenAccidentReportDirectly(false); }} icon={<UserPlus size={15} />} label="Onboard client" />
          <NavItem active={activeTab === 'sdui'} onClick={() => { setActiveTab('sdui'); setOpenLogClaimDirectly(false); setOpenAccidentReportDirectly(false); }} icon={<Layers size={15} />} label="Form engine" />
        </nav>

        <div className="adviser-card">
          <div className="adviser-avatar">QN</div>
          <div><b>Qiniso Ntuli</b><span>Key individual</span></div>
        </div>
      </aside>

      <div className="crm-main">
        <header className="crm-topbar">
          <label className="global-search">
            <Search size={15} />
            <span className="sr-only">Search</span>
            <input placeholder="Search clients, policies, claim numbers" />
          </label>
          <div className="topbar-spacer" />
          <button
            className="btn btn-primary flex items-center gap-1.5"
            onClick={() => handleOpenClaims(false, true)}
            title="Report Short-Term Motor Accident with Google Maps & Smart Transcribe"
          >
            <Car size={15} /> Report accident
          </button>
          <button
            className="btn btn-secondary flex items-center gap-1.5"
            onClick={() => handleOpenClaims(true, false)}
          >
            <ClipboardPlus size={15} /> Log standard claim
          </button>
          <button
            className="btn btn-secondary flex items-center gap-1.5"
            onClick={() => { setActiveTab('new-client'); setOpenLogClaimDirectly(false); setOpenAccidentReportDirectly(false); }}
          >
            <UserPlus size={15} /> Add client
          </button>
        </header>

        <main className="crm-content">
          {activeTab === 'desk' && (
            <DeskView
              onOpenClients={() => { setActiveTab('clients'); setOpenLogClaimDirectly(false); setOpenAccidentReportDirectly(false); }}
              onOpenClaims={() => handleOpenClaims(false, false)}
              onOpenReminders={() => { setActiveTab('reminders'); setOpenLogClaimDirectly(false); setOpenAccidentReportDirectly(false); }}
            />
          )}
          {activeTab === 'clients' && (
            <ClientListView
              onNewClientClick={() => { setActiveTab('new-client'); setOpenLogClaimDirectly(false); setOpenAccidentReportDirectly(false); }}
            />
          )}

          {activeTab === 'new-client' && (
            <SecureClientFormView
              onBack={() => { setActiveTab('clients'); setOpenLogClaimDirectly(false); setOpenAccidentReportDirectly(false); }}
              onSuccess={() => { setActiveTab('clients'); setOpenLogClaimDirectly(false); setOpenAccidentReportDirectly(false); }}
            />
          )}

          {activeTab === 'sdui' && <ServerDrivenFormView />}

          {activeTab === 'claims' && (
            <ClaimsPipelineView
              initialOpenLogClaim={openLogClaimDirectly}
              initialOpenAccidentReport={openAccidentReportDirectly}
            />
          )}

          {activeTab === 'reminders' && <RemindersView />}
        </main>
      </div>

      <VoiceAssistant />
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: string }> = ({ active, onClick, icon, label, badge }) => (
  <button className="crm-nav-item" aria-current={active ? 'page' : undefined} onClick={onClick}>
    <span className="nav-icon">{icon}</span><span>{label}</span>{badge && <span className="nav-badge">{badge}</span>}
  </button>
);

export default App;
