import { Navigate, Outlet } from 'react-router-dom';
import { clearAuthSession, getAuthRole, getAuthToken } from '@/services/authToken';
import { ROUTES } from '@/constants/routes';

const ProtectedRoute = ({ allowedRoles }) => {
    const hasStoredToken = sessionStorage.getItem("token") || localStorage.getItem("token");
    const token = getAuthToken();
    const userRole = getAuthRole();
    const normalizedRole = userRole?.replace(/^ROLE_/, "");

    if (!token) {
        if (hasStoredToken) {
            clearAuthSession();
        }
        return <Navigate to={ROUTES.ROOT} replace />;
    }

    if (allowedRoles && !allowedRoles.some((role) => role.replace(/^ROLE_/, "") === normalizedRole)) {
        return <Navigate to={ROUTES.HOME} replace />; 
    }

    return <Outlet />;
};

export default ProtectedRoute;
