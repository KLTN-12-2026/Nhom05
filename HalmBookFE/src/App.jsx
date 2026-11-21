import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from '@/routes/AppRoutes';
import AccountLockedCountdownModal from '@/components/common/AccountLockedCountdownModal';
import CustomConfirmModal from '@/components/common/CustomConfirmModal';
import CustomExportModal from '@/components/common/CustomExportModal';
import GlobalToastNotification from '@/components/common/GlobalToastNotification';
import PageErrorBoundary from '@/components/common/PageErrorBoundary';

function RouteThemeManager() {
  const location = useLocation();

  useEffect(() => {
    const isAdmin = location.pathname.startsWith('/admin');
    if (isAdmin) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <RouteThemeManager />
      <PageErrorBoundary>
        <AppRoutes />
      </PageErrorBoundary>

      <AccountLockedCountdownModal />
      <CustomConfirmModal />
      <CustomExportModal />
      <GlobalToastNotification />
    </BrowserRouter>
  );
}

export default App;