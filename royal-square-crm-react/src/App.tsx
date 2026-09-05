import { useState } from 'react';
import { ClientDashboardView } from './views/ClientDashboardView';
import { AccidentReportPageView } from './views/AccidentReportPageView';
import { ReportLossPageView } from './views/ReportLossPageView';

export function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'report-accident' | 'report-loss'>('dashboard');

  if (currentPage === 'report-accident') {
    return (
      <AccidentReportPageView
        onBackToDashboard={() => setCurrentPage('dashboard')}
      />
    );
  }

  if (currentPage === 'report-loss') {
    return (
      <ReportLossPageView
        onBackToDashboard={() => setCurrentPage('dashboard')}
      />
    );
  }

  return (
    <ClientDashboardView
      onReportAccident={() => setCurrentPage('report-accident')}
      onReportLoss={() => setCurrentPage('report-loss')}
    />
  );
}

export default App;
