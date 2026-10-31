import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PublicRoute: Dành cho các trang như Đăng Nhập, Quên Mật Khẩu.
 * Nếu người dùng ĐÃ đăng nhập, tự động chuyển hướng vào bên trong hệ thống:
 * - Admin -> /admin
 * - User -> /trangchu
 */
const PublicRoute = () => {
    const { isAuthenticated, role, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #8B4A3C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (isAuthenticated) {
        const normalizedRole = role?.replace(/^ROLE_/, "");
        if (normalizedRole === 'ADMIN') {
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/trangchu" replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
