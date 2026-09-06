import { useState } from 'react';
import { ClientDashboardView } from './views/ClientDashboardView';
import { AccidentReportPageView } from './views/AccidentReportPageView';
import { ReportLossPageView } from './views/ReportLossPageView';
import { VoiceAssistant } from './components/VoiceAssistant';

type Page = 'dashboard' | 'report-accident' | 'report-loss';

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  return (
    <>
      {currentPage === 'report-accident' && (
        <AccidentReportPageView onBackToDashboard={() => setCurrentPage('dashboard')} />
      )}

      {currentPage === 'report-loss' && (
        <ReportLossPageView onBackToDashboard={() => setCurrentPage('dashboard')} />
      )}

      {currentPage === 'dashboard' && (
        <ClientDashboardView
          onReportAccident={() => setCurrentPage('report-accident')}
          onReportLoss={() => setCurrentPage('report-loss')}
        />
      )}

      {/*
        Multilingual voice agent — a floating widget available on every page of
        the client portal. Whole-app translation is provided by the I18nProvider
        that wraps <App /> in main.tsx.
      */}
      <VoiceAssistant />
    </>
  );
}

export default App;
