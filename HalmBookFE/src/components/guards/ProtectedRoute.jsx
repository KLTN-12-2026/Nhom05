import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAuthRole, getAdminAuthRole, isTokenValid, getAdminAuthToken } from '@/services/authToken';
import { ROUTES } from '@/constants/routes';

const ProtectedRoute = ({ allowedRoles }) => {
    const location = useLocation();

    // 1. Phân luồng kiểm tra cho khu vực Quản trị viên (Admin Portal)
    const isAdminRoute = (allowedRoles && allowedRoles.some((role) => role.includes('ADMIN'))) || location.pathname.startsWith('/admin');
    if (isAdminRoute) {
        const adminToken = getAdminAuthToken();
        const isAdminValid = isTokenValid(adminToken);
        const adminRole = (
            getAdminAuthRole() ||
            localStorage.getItem('admin_role') ||
            localStorage.getItem('role') ||
            sessionStorage.getItem('admin_role') ||
            sessionStorage.getItem('role')
        )?.replace(/^ROLE_/, "")?.toUpperCase();

        // Chống tự động đá văng ra login: Cho phép truy cập nếu token còn hạn HOẶC có role ADMIN
        const hasAdminAccess = (adminToken && isAdminValid) || adminRole === 'ADMIN';

        if (!hasAdminAccess) {
            return (
                <Navigate
                    to="/login"
                    state={{ from: location.pathname + location.search, portal: 'admin', loginMessage: 'Vui lòng đăng nhập với tài khoản Quản trị viên để truy cập!' }}
                    replace
                />
            );
        }
        return <Outlet />;
    }

    // 2. Phân luồng kiểm tra cho khu vực Độc giả (User Storefront)
    const isValid = isTokenValid();
    const userRole = (getAuthRole() || localStorage.getItem('role') || sessionStorage.getItem('role'))?.replace(/^ROLE_/, "")?.toUpperCase();

    if (!isValid && !userRole) {
        // Đối với người dùng thông thường: Chuyển về Trang Chủ kèm yêu cầu mở popup đăng nhập tại chỗ
        return (
            <Navigate
                to={ROUTES.ROOT}
                state={{ openLoginModal: true, from: location.pathname + location.search, loginMessage: 'Vui lòng đăng nhập để truy cập tính năng này!' }}
                replace
            />
        );
    }

    if (allowedRoles && !allowedRoles.some((role) => role.replace(/^ROLE_/, "").toUpperCase() === userRole)) {
        return <Navigate to={ROUTES.ROOT} replace />; 
    }

    return <Outlet />;
};

export default ProtectedRoute;
