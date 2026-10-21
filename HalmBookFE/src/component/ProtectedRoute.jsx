import { Navigate, Outlet } from 'react-router-dom';
import { clearAuthSession, getAuthRole, getAuthToken } from '../service/AuthToken';

const ProtectedRoute = ({ allowedRoles }) => {
    const hasStoredToken = sessionStorage.getItem("token") || localStorage.getItem("token");
    const token = getAuthToken();
    const userRole = getAuthRole();
    const normalizedRole = userRole?.replace(/^ROLE_/, "");

    if (!token) {
        if (hasStoredToken) {
            clearAuthSession();
        }
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.some((role) => role.replace(/^ROLE_/, "") === normalizedRole)) {
        return <Navigate to="/trangchu" replace />; 
    }

    return <Outlet />;
};

export default ProtectedRoute;