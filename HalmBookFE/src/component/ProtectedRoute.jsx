import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute: Chặn các route yêu cầu xác thực.
 * - Kiểm tra trạng thái đang tải (isLoading) khi F5 refresh trang.
 * - Chưa đăng nhập -> Chuyển về /dangnhap kèm state redirect.
 * - Đã đăng nhập nhưng không đủ quyền role -> Chuyển về /trangchu.
 */
const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, role, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #8B4A3C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/dangnhap" state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const normalizedRole = (role || '').replace(/^ROLE_/, '');
        const hasPermission = allowedRoles.some((r) => r.replace(/^ROLE_/, '') === normalizedRole);
        if (!hasPermission) {
            return <Navigate to="/trangchu" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
