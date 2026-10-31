import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthToken, getAuthRole, saveAuthSession, clearAuthSession } from '../service/AuthToken';
import axiosInstance from '../service/AxiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Khởi tạo trực tiếp từ sessionStorage/localStorage:
    // Nếu trong phiên làm việc đã có token thì coi như đã xác thực ngay lập tức, không gây chớp màn hình khi F5.
    const [token, setToken] = useState(() => getAuthToken());
    const [role, setRole] = useState(() => getAuthRole());
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Đồng bộ thông tin người dùng từ Backend qua endpoint /api/auth/me
    const fetchUserProfile = useCallback(async () => {
        const currentToken = getAuthToken();
        if (!currentToken) {
            setUser(null);
            return null;
        }

        try {
            const response = await axiosInstance.get('/api/auth/me');
            const userData = response.data;
            setUser(userData);
            if (userData?.role) {
                setRole(userData.role);
            }
            return userData;
        } catch (error) {
            // Chỉ xóa phiên đăng nhập khi máy chủ trả về 401 Unauthorized (token hết hạn thật sự)
            if (error?.response?.status === 401) {
                console.warn('Phiên đăng nhập đã hết hạn (401), điều hướng về đăng nhập.');
                clearAuthSession();
                setToken(null);
                setRole(null);
                setUser(null);
            } else {
                console.warn('Không thể kết nối /api/auth/me nhưng vẫn giữ phiên token hiện tại:', error?.message);
            }
            return null;
        }
    }, []);

    // Khởi tạo: Khi reload (F5) trang, chạy ngầm cập nhật profile mà không văng app
    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            const currentToken = getAuthToken();
            if (currentToken) {
                try {
                    const response = await axiosInstance.get('/api/auth/me');
                    if (isMounted) {
                        setUser(response.data);
                        if (response.data?.role) {
                            setRole(response.data.role);
                        }
                    }
                } catch (error) {
                    // Nếu lỗi 401 thì mới xóa token
                    if (error?.response?.status === 401 && isMounted) {
                        clearAuthSession();
                        setToken(null);
                        setRole(null);
                        setUser(null);
                    }
                }
            }
        };

        initAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    // Hàm login: Nhận phản hồi auth từ BE, lưu vào sessionStorage (hoặc localStorage nếu ghi nhớ), cập nhật state
    const login = useCallback(async (authResponse, { remember = false } = {}) => {
        const savedToken = saveAuthSession(authResponse, { remember });
        const assignedRole = authResponse?.role || getAuthRole() || 'USER';

        setToken(savedToken);
        setRole(assignedRole);

        try {
            const response = await axiosInstance.get('/api/auth/me');
            const userData = response.data;
            setUser(userData);
            if (userData?.role) {
                setRole(userData.role);
            }
            return userData;
        } catch (error) {
            console.warn('Đăng nhập thành công nhưng chưa lấy được profile phụ:', error?.message);
            const fallbackUser = {
                username: authResponse.username || '',
                role: assignedRole,
                account_id: authResponse.account_id || null
            };
            setUser(fallbackUser);
            return fallbackUser;
        }
    }, []);

    // Hàm logout: Xóa toàn bộ token khỏi storage và reset state
    const logout = useCallback(() => {
        clearAuthSession();
        setToken(null);
        setRole(null);
        setUser(null);
    }, []);

    const isAuthenticated = Boolean(token);

    const value = {
        token,
        role,
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshProfile: fetchUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được sử dụng bên trong <AuthProvider>');
    }
    return context;
};

export default AuthContext;
