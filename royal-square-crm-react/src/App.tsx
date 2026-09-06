import { useState, useEffect } from 'react';
import { ClientDashboardView } from './views/ClientDashboardView';
import { AccidentReportPageView } from './views/AccidentReportPageView';
import { ReportLossPageView } from './views/ReportLossPageView';
import { ClientClaimsHistoryView } from './views/ClientClaimsHistoryView';
import { VoiceAssistant } from './components/VoiceAssistant';
import { AdvisorConsole } from './advisor/AdvisorConsole';
import { LandingPage } from './auth/LandingPage';
import { AuthView } from './auth/AuthView';
import { loadSession, saveSession, clearSession, type AccountRole, type AuthSession } from './auth/session';
import { logout as apiLogout } from './auth/authService';

type View = 'landing' | 'auth' | 'customer' | 'advisor';
type CustomerPage = 'dashboard' | 'report-accident' | 'report-loss' | 'claims-history';

const workspaceFor = (role: AccountRole): View => (role === 'customer' ? 'customer' : 'advisor');

export function App() {
  // Front-end session (see auth/session.ts). Restores the last workspace on reload.
  const [session, setSession] = useState(() => loadSession());
  const [view, setView] = useState<View>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'advisor' || window.location.hash === '#advisor') return 'advisor';
    if (params.get('view') === 'customer' || window.location.hash === '#customer' || window.location.hash === '#claim' || window.location.hash === '#register-claim') return 'customer';
    return session ? workspaceFor(session.role) : 'landing';
  });

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authRole, setAuthRole] = useState<AccountRole | undefined>(undefined);

  // Client-portal sub-navigation (dashboard ⇄ report flows ⇄ claims history).
  const [customerPage, setCustomerPage] = useState<CustomerPage>(() => {
    if (window.location.hash === '#claim' || window.location.hash === '#register-claim') return 'report-accident';
    if (window.location.hash === '#claims-history') return 'claims-history';
    return 'dashboard';
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#advisor') {
        setView('advisor');
      } else if (hash === '#customer') {
        setView('customer');
        setCustomerPage('dashboard');
      } else if (hash === '#claim' || hash === '#register-claim') {
        setView('customer');
        setCustomerPage('report-accident');
      } else if (hash === '#claims-history') {
        setView('customer');
        setCustomerPage('claims-history');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const goSignIn = () => {
    setAuthMode('signin');
    setAuthRole(undefined);
    setView('auth');
  };

  const goSignUp = (role?: AccountRole) => {
    setAuthMode('signup');
    setAuthRole(role);
    setView('auth');
  };

  const handleAuthenticated = (authSession: AuthSession) => {
    setSession(saveSession(authSession));
    setCustomerPage('dashboard');
    setView(workspaceFor(authSession.role));
  };

  const handleSignOut = () => {
    apiLogout(); // best-effort token invalidation on the server
    clearSession();
    setSession(null);
    setCustomerPage('dashboard');
    setView('landing');
  };

  if (view === 'landing') {
    return (
      <LandingPage
        onSignIn={goSignIn}
        onGetStarted={goSignUp}
        onOpenCustomerPortal={() => {
          setView('customer');
          setCustomerPage('dashboard');
        }}
        onRegisterClaim={() => {
          setView('customer');
          setCustomerPage('report-accident');
        }}
      />
    );
  }

  if (view === 'auth') {
    return (
      <AuthView
        initialMode={authMode}
        initialRole={authRole}
        onBack={() => setView('landing')}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  if (view === 'advisor') {
    return (
      <AdvisorConsole
        onSignOut={handleSignOut}
        advisorName={session?.name}
      />
    );
  }

  // Customer workspace — the accessible client portal, with the voice agent on
  // every page. The I18nProvider (main.tsx) provides whole-app translation.
  return (
    <>
      {customerPage === 'report-accident' && (
        <AccidentReportPageView
          onBackToDashboard={() => setCustomerPage('dashboard')}
          onViewClaimsHistory={() => setCustomerPage('claims-history')}
        />
      )}

      {customerPage === 'report-loss' && (
        <ReportLossPageView
          onBackToDashboard={() => setCustomerPage('dashboard')}
          onViewClaimsHistory={() => setCustomerPage('claims-history')}
        />
      )}

      {customerPage === 'claims-history' && (
        <ClientClaimsHistoryView
          onBackToDashboard={() => setCustomerPage('dashboard')}
          onReportAccident={() => setCustomerPage('report-accident')}
          onReportLoss={() => setCustomerPage('report-loss')}
        />
      )}

      {customerPage === 'dashboard' && (
        <ClientDashboardView
          onReportAccident={() => setCustomerPage('report-accident')}
          onReportLoss={() => setCustomerPage('report-loss')}
          onViewClaimsHistory={() => setCustomerPage('claims-history')}
          onSignOut={handleSignOut}
          onSwitchToAdvisor={() => setView('advisor')}
        />
      )}

      <VoiceAssistant />
    </>
  );
}

export default App;
