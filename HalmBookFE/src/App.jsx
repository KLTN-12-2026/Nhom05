import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes/AppRoutes';
import AccountLockedCountdownModal from '@/components/common/AccountLockedCountdownModal';
import CustomConfirmModal from '@/components/common/CustomConfirmModal';
import CustomExportModal from '@/components/common/CustomExportModal';
import PageErrorBoundary from '@/components/common/PageErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <PageErrorBoundary>
        <AppRoutes />
      </PageErrorBoundary>
      <AccountLockedCountdownModal />
      <CustomConfirmModal />
      <CustomExportModal />
    </BrowserRouter>
  );
}

export default App;
