import React, { useState } from 'react';
import { ClientListView } from './views/ClientListView';
import { SecureClientFormView } from './views/SecureClientFormView';
import { ServerDrivenFormView } from './views/ServerDrivenFormView';
import { ClaimsPipelineView } from './views/ClaimsPipelineView';
import { RemindersView } from './views/RemindersView';
import {
  Users,
  ShieldCheck,
  Layers,
  FileCheck2,
  Bell,
  Lock,
  Database
} from 'lucide-react';

type ActiveTab = 'clients' | 'new-client' | 'sdui' | 'claims' | 'reminders';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('clients');

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <header className="app-navbar">
        <div className="nav-brand">
          <div className="brand-logo">
            <ShieldCheck size={22} className="text-gold" />
          </div>
          <div>
            <span className="brand-title">Royal Square</span>
            <span className="brand-subtitle">Wealth Management & Advisory CRM</span>
          </div>
        </div>

        {/* Security / System Badges */}
        <div className="system-status-badges">
          <div className="badge-status online" title="FastAPI + SQLite (Layered Architecture)">
            <Database size={13} />
            <span>Python + SQLite</span>
          </div>
          <div className="badge-status secure" title="POPIA Luhn Verification & Field-Level Masking Active">
            <Lock size={13} />
            <span>POPIA & CSRF Hardened</span>
          </div>
        </div>
      </header>

      {/* Main Navigation Bar */}
      <nav className="tab-nav">
        <button
          className={`tab-link ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          <Users size={16} />
          <span>Client Portfolio</span>
        </button>

        <button
          className={`tab-link ${activeTab === 'new-client' ? 'active' : ''}`}
          onClick={() => setActiveTab('new-client')}
        >
          <Lock size={16} />
          <span>Secure Onboarding Form</span>
        </button>

        <button
          className={`tab-link ${activeTab === 'sdui' ? 'active' : ''}`}
          onClick={() => setActiveTab('sdui')}
        >
          <Layers size={16} />
          <span>Server-Driven UI Engine</span>
        </button>

        <button
          className={`tab-link ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          <FileCheck2 size={16} />
          <span>Claims Pipeline</span>
        </button>

        <button
          className={`tab-link ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          <Bell size={16} />
          <span>Compliance Reminders</span>
        </button>
      </nav>

      {/* Content Area */}
      <main className="app-content">
        {activeTab === 'clients' && (
          <ClientListView
            onNewClientClick={() => setActiveTab('new-client')}
          />
        )}

        {activeTab === 'new-client' && (
          <SecureClientFormView
            onBack={() => setActiveTab('clients')}
            onSuccess={() => setActiveTab('clients')}
          />
        )}

        {activeTab === 'sdui' && <ServerDrivenFormView />}

        {activeTab === 'claims' && <ClaimsPipelineView />}

        {activeTab === 'reminders' && <RemindersView />}
      </main>

      {/* Footer Info */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>Royal Square CRM — Decoupled Layered Architecture (Python 3.12 + SQLite + React 18)</span>
          <span className="footer-audit">POPIA Act 4 of 2013 & FAIS Compliant</span>
        </div>
      </footer>
    </div>
  );
};
export default App;
