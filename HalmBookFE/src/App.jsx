import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes/AppRoutes';
import AccountLockedCountdownModal from '@/components/common/AccountLockedCountdownModal';
import CustomConfirmModal from '@/components/common/CustomConfirmModal';
import CustomExportModal from '@/components/common/CustomExportModal';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <AccountLockedCountdownModal />
      <CustomConfirmModal />
      <CustomExportModal />
    </BrowserRouter>
  );
}

export default App;
