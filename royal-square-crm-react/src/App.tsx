import { useState } from 'react';
import { ClientDashboardView } from './views/ClientDashboardView';
import { AccidentReportPageView } from './views/AccidentReportPageView';
import { ReportLossPageView } from './views/ReportLossPageView';
import { VoiceAssistant } from './components/VoiceAssistant';
import { AdvisorConsole } from './advisor/AdvisorConsole';
import { LandingPage } from './auth/LandingPage';
import { AuthView } from './auth/AuthView';
import { loadSession, saveSession, clearSession, type AccountRole } from './auth/session';

type View = 'landing' | 'auth' | 'customer' | 'advisor';
type CustomerPage = 'dashboard' | 'report-accident' | 'report-loss';

const workspaceFor = (role: AccountRole): View => (role === 'customer' ? 'customer' : 'advisor');

export function App() {
  // Front-end session (see auth/session.ts). Restores the last workspace on reload.
  const [session, setSession] = useState(() => loadSession());
  const [view, setView] = useState<View>(() => (session ? workspaceFor(session.role) : 'landing'));

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authRole, setAuthRole] = useState<AccountRole | undefined>(undefined);

  // Client-portal sub-navigation (dashboard ⇄ report flows).
  const [customerPage, setCustomerPage] = useState<CustomerPage>('dashboard');

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

  const handleAuthenticated = (role: AccountRole, name: string, email: string) => {
    setSession(saveSession({ role, name, email }));
    setCustomerPage('dashboard');
    setView(workspaceFor(role));
  };

  const handleSignOut = () => {
    clearSession();
    setSession(null);
    setCustomerPage('dashboard');
    setView('landing');
  };

  if (view === 'landing') {
    return <LandingPage onSignIn={goSignIn} onGetStarted={goSignUp} />;
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
    return <AdvisorConsole onSignOut={handleSignOut} advisorName={session?.name} />;
  }

  // Customer workspace — the accessible client portal, with the voice agent on
  // every page. The I18nProvider (main.tsx) provides whole-app translation.
  return (
    <>
      {customerPage === 'report-accident' && (
        <AccidentReportPageView onBackToDashboard={() => setCustomerPage('dashboard')} />
      )}

      {customerPage === 'report-loss' && (
        <ReportLossPageView onBackToDashboard={() => setCustomerPage('dashboard')} />
      )}

      {customerPage === 'dashboard' && (
        <ClientDashboardView
          onReportAccident={() => setCustomerPage('report-accident')}
          onReportLoss={() => setCustomerPage('report-loss')}
          onSignOut={handleSignOut}
        />
      )}

      <VoiceAssistant />
    </>
  );
}

export default App;
