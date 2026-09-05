import React, { useEffect, useState } from 'react';
import { ClientListView } from './views/ClientListView';
import { SecureClientFormView } from './views/SecureClientFormView';
import { ServerDrivenFormView } from './views/ServerDrivenFormView';
import { ClaimsPipelineView } from './views/ClaimsPipelineView';
import { RemindersView } from './views/RemindersView';
import { DeskView } from './views/DeskView';
import {
  Users,
  Layers,
  FileCheck2,
  Bell,
  LayoutDashboard,
  Search,
  UserPlus,
  ClipboardPlus
} from 'lucide-react';

type ActiveTab = 'desk' | 'clients' | 'new-client' | 'sdui' | 'claims' | 'reminders';

const tabPaths: Record<ActiveTab, string> = {
  desk: '/',
  clients: '/clients',
  'new-client': '/new-client',
  sdui: '/form-engine',
  claims: '/claims',
  reminders: '/reminders'
};

const pathTabs: Record<string, ActiveTab> = Object.fromEntries(
  Object.entries(tabPaths).map(([tab, path]) => [path, tab as ActiveTab])
) as Record<string, ActiveTab>;

function tabForPath(path: string): ActiveTab {
  return pathTabs[path] ?? 'desk';
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => tabForPath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => setActiveTab(tabForPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tab: ActiveTab) => {
    window.history.pushState({}, '', tabPaths[tab]);
    setActiveTab(tab);
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
          <NavItem active={activeTab === 'desk'} onClick={() => navigateTo('desk')} icon={<LayoutDashboard size={15} />} label="The desk" />
          <NavItem active={activeTab === 'clients'} onClick={() => navigateTo('clients')} icon={<Users size={15} />} label="Clients" badge="6" />
          <NavItem active={activeTab === 'reminders'} onClick={() => navigateTo('reminders')} icon={<Bell size={15} />} label="Reminders" badge="12" />
          <span className="nav-section">Servicing</span>
          <NavItem active={activeTab === 'claims'} onClick={() => navigateTo('claims')} icon={<FileCheck2 size={15} />} label="Claims" badge="2" />
          <NavItem active={activeTab === 'new-client'} onClick={() => navigateTo('new-client')} icon={<UserPlus size={15} />} label="Onboard client" />
          <NavItem active={activeTab === 'sdui'} onClick={() => navigateTo('sdui')} icon={<Layers size={15} />} label="Form engine" />
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
          <button className="btn btn-secondary" onClick={() => navigateTo('claims')}><ClipboardPlus size={15} /> Log a claim</button>
          <button className="btn btn-primary" onClick={() => navigateTo('new-client')}><UserPlus size={15} /> Add client</button>
        </header>

      <main className="crm-content">
        {activeTab === 'desk' && (
          <DeskView
            onOpenClients={() => navigateTo('clients')}
            onOpenClaims={() => navigateTo('claims')}
            onOpenReminders={() => navigateTo('reminders')}
          />
        )}
        {activeTab === 'clients' && (
          <ClientListView
            onNewClientClick={() => navigateTo('new-client')}
          />
        )}

        {activeTab === 'new-client' && (
          <SecureClientFormView
            onBack={() => navigateTo('clients')}
            onSuccess={() => navigateTo('clients')}
          />
        )}

        {activeTab === 'sdui' && <ServerDrivenFormView />}

        {activeTab === 'claims' && <ClaimsPipelineView />}

        {activeTab === 'reminders' && <RemindersView />}
      </main>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: string }> = ({ active, onClick, icon, label, badge }) => (
  <button className="crm-nav-item" aria-current={active ? 'page' : undefined} onClick={onClick}>
    <span className="nav-icon">{icon}</span><span>{label}</span>{badge && <span className="nav-badge">{badge}</span>}
  </button>
);

export default App;
