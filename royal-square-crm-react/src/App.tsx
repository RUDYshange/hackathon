import { useState } from 'react';
import { ClientDashboardView } from './views/ClientDashboardView';
import { AccidentReportModal } from './components/forms/AccidentReportModal';

export function App() {
  const [showAccidentModal, setShowAccidentModal] = useState(false);

  return (
    <div>
      <ClientDashboardView onReportAccident={() => setShowAccidentModal(true)} />
      {showAccidentModal && (
        <AccidentReportModal
          isOpen={showAccidentModal}
          onClose={() => setShowAccidentModal(false)}
          onClaimCreated={() => setShowAccidentModal(false)}
        />
      )}
    </div>
  );
}

export default App;
