import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import * as customerService from '@/services/customerService';
import { getPotatoPackages, getPotatoTransactions, topupPotato, transferPotato } from '@/services/potatoService';
import DB from '@/components/admin/js/db.js';
import { getCustomerBookshelf } from '@/services/orderService';
import StreakDiemDanh from './StreakDiemDanh';
import { isDarkMode, applyTheme } from '@/utils/theme';
import { getTierInfo, formatCustomerId, getTierAvatarFrame, getTierBadgeClass, getTierLevel } from '@/utils/tierUtils';
import AvatarWithFrame from '@/components/common/AvatarWithFrame';
import { uploadAvatar } from '@/services/userFeatureService';
import { clearAuthSession, isTokenValid } from '@/services/authToken';
import SupportTicketSection from './SupportTicketSection';

const profileTailwindConfig = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-ui)', 'sans-serif'],
                display: ['var(--font-display)', 'sans-serif'],
                metadata: ['var(--font-metadata)', 'sans-serif'],
                editorial: ['var(--font-editorial)', 'sans-serif'],
            },
            colors: {
                paper: {
                    50: '#FAF8F5',
                    100: '#F5F2EB',
                    200: '#EAE5D9',
                    DEFAULT: '#F7F4EE',
                    surface: '#FFFEFA',
                    border: '#E3DDD0',
                },
                ink: {
                    50: '#F5F5F4',
                    300: '#A8A6A1',
                    muted: '#66645E',
                    DEFAULT: '#1E1F1D',
                    pure: '#111210',
                },
                wine: {
                    DEFAULT: '#8E3038',
                    light: '#A83B46',
                    dark: '#6F252C',
                },
                gold: {
                    DEFAULT: '#B8860B',
                    light: '#D4AF37',
                },
                night: {
                    bg: '#111210',
                    surface: '#181916',
                    card: '#20221E',
                    border: '#2C2E29',
                    text: '#EDE9DF',
                    muted: '#96938B',
                }
            }
        }
    }
};

const PROFILE_ASSETS = {
    fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap',
    phosphor: 'https://unpkg.com/@phosphor-icons/web',
    tailwind: 'https://cdn.tailwindcss.com',
};

const DEFAULT_PACKAGES = [
    { packageId: 1, packageName: 'Gói Trải Nghiệm', priceVnd: 50000, potatoAmount: 50, bonusPotato: 0, bonusRate: 0, isHot: false, tag: 'Cơ Bản' },
    { packageId: 2, packageName: 'Gói Tiêu Chuẩn', priceVnd: 200000, potatoAmount: 200, bonusPotato: 20, bonusRate: 10, isHot: true, tag: 'Đề Xuất 🔥' },
    { packageId: 3, packageName: 'Gói Thân Thiết', priceVnd: 500000, potatoAmount: 500, bonusPotato: 75, bonusRate: 15, isHot: false, tag: '+15% Thưởng' },
    { packageId: 4, packageName: 'Gói Đặc Quyền VIP', priceVnd: 1000000, potatoAmount: 1000, bonusPotato: 250, bonusRate: 25, isHot: false, tag: '+25% Thưởng VIP' },
];

const DEFAULT_HISTORY_LIST = [
    { code: 'GD984321', note: 'Thuê sách: Atomic Habits (7 ngày)', type: 'THUÊ SÁCH', time: 'Hôm nay 14:32', amount: -9, status: 'Thành công' },
    { code: 'GD984210', note: 'Điểm danh hằng ngày', type: 'THƯỞNG HẰNG NGÀY', time: 'Hôm nay 08:15', amount: 5, status: 'Thành công' },
    { code: 'GD982109', note: 'Nạp khoai: Gói Mọt Sách (+200 thưởng)', type: 'NẠP KHOAI', time: 'Hôm qua 19:40', amount: 1200, status: 'Thành công' },
    { code: 'GD979924', note: 'Thuê sách: Điện Biên Phủ 56 Ngày Đêm', type: 'THUÊ SÁCH', time: '15/10/2026', amount: -9, status: 'Thành công' },
    { code: 'GD910022', note: 'Thưởng thăng hạng: Thợ Cày 🌱', type: 'THƯỞNG VIP', time: '15/01/2026', amount: 50, status: 'Thành công' },
    { code: 'GD889211', note: 'Thuê sách: Cây Cam Ngọt Của Tôi (14 ngày)', type: 'THUÊ SÁCH', time: '02/01/2026', amount: -15, status: 'Thành công' },
    { code: 'GD875412', note: 'Nạp khoai: Gói Khởi Đầu (+10 thưởng)', type: 'NẠP KHOAI', time: '28/12/2025', amount: 110, status: 'Thành công' }
];

const normalizeSearch = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export default function Profile() {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const currentTab = searchParams.get('tab') || (location.hash === '#tab-history' ? 'history' : 'profile');
    const [activeTab, setActiveTabState] = useState(() => currentTab);
    const [isDark, setIsDark] = useState(() => isDarkMode());
    const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [stars, setStars] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [toast, setToast] = useState({ show: false, title: '', message: '' });
    const avatarInputRef = useRef(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const handleAvatarFileSelected = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Lỗi Tải Ảnh', 'Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP)!');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('Lỗi Tải Ảnh', 'Dung lượng ảnh tối đa cho phép là 5MB!');
            return;
        }

        try {
            setIsUploadingAvatar(true);
            showToast('Đang Tải Ảnh', 'Đang tải ảnh đại diện lên máy chủ Cloudinary...');
            const res = await uploadAvatar(file);
            if (res.avatarUrl) {
                setCustomer(prev => ({
                    ...prev,
                    avatar: res.avatarUrl,
                    avatarUrl: res.avatarUrl
                }));
                window.dispatchEvent(new CustomEvent('halm-auth-success'));
                window.dispatchEvent(new CustomEvent('halm-avatar-updated', { detail: { avatarUrl: res.avatarUrl } }));
                showToast('Thành Công', 'Đã cập nhật ảnh đại diện mới thành công! 🎉');
            }
        } catch (err) {
            console.error('Lỗi khi tải ảnh đại diện:', err);
            const msg = err.response?.data?.message || 'Không thể tải ảnh lên. Vui lòng thử lại!';
            showToast('Lỗi Tải Ảnh', msg);
        } finally {
            setIsUploadingAvatar(false);
            if (e.target) e.target.value = '';
        }
    };

    // Đồng bộ tức thì tab khi URL thay đổi (từ sidebar, header hay back/forward)
    useEffect(() => {
        const targetTab = searchParams.get('tab') || (location.hash === '#tab-history' ? 'history' : 'profile');
        setActiveTabState(targetTab);
    }, [searchParams, location.hash]);

    const handleSelectTab = (tab) => {
        setActiveTabState(tab);
        if (tab === 'profile') {
            setSearchParams({});
        } else {
            setSearchParams({ tab });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // State phục vụ Ví Khoai Tây & Lịch Sử Giao Dịch
    const [packages, setPackages] = useState(DEFAULT_PACKAGES);
    const [transactions, setTransactions] = useState([]);
    const [bookshelf, setBookshelf] = useState([]);
    const [rentedCount, setRentedCount] = useState(0);
    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('vietqr');
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferForm, setTransferForm] = useState({ receiver: '', amount: 10, note: '' });
    const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
    const [historyFilter, setHistoryFilter] = useState('all');
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
    const HISTORY_PER_PAGE = 5;
    const [dailyCheckinDone, setDailyCheckinDone] = useState(false);

    // State phục vụ Đổi Mật Khẩu (Popup 2 bước + Mắt hiển thị mật khẩu)
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordStep, setPasswordStep] = useState(1);
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    const openPasswordModal = () => {
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordStep(1);
        setPasswordError('');
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setIsPasswordModalOpen(true);
    };

    const closePasswordModal = () => {
        setIsPasswordModalOpen(false);
        setPasswordError('');
    };

    const handleNextPasswordStep = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!passwordForm.oldPassword.trim()) {
            setPasswordError('Vui lòng nhập mật khẩu hiện tại của bạn!');
            return;
        }
        setPasswordError('');
        setPasswordStep(2);
    };

    const handleSubmitChangePassword = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setPasswordError('');

        if (!passwordForm.newPassword) {
            setPasswordError('Vui lòng nhập mật khẩu mới!');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setPasswordError('Mật khẩu mới phải có độ dài từ 6 ký tự trở lên!');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Mật khẩu xác nhận không khớp với mật khẩu mới!');
            return;
        }
        if (passwordForm.newPassword === passwordForm.oldPassword) {
            setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
            return;
        }

        setIsSubmittingPassword(true);
        try {
            await customerService.changePassword({
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword
            });
            closePasswordModal();
            showToast('Đổi Mật Khẩu Thành Công!', 'Mật khẩu tài khoản của bạn đã được cập nhật thành công.');
        } catch (err) {
            console.error('Lỗi khi đổi mật khẩu:', err);
            const msg = err.response?.data?.message || err.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ!';
            setPasswordError(msg);
            showToast('Đổi Mật Khẩu Thất Bại', msg);
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    const showToast = (title, message) => {
        setToast({ show: true, title, message });
        window.setTimeout(() => setToast({ show: false, title: '', message: '' }), 3500);
    };

    const copyToClipboard = (text, label) => {
        try {
            navigator.clipboard.writeText(text);
            showToast("Đã Sao Chép", `Đã sao chép ${label} vào bộ nhớ tạm!`);
        } catch {
            showToast("Thông Báo", `Vui lòng sao chép thủ công: ${text}`);
        }
    };

    const formatDateForInput = (dateVal) => {
        if (!dateVal) return '';
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    const [profileData, setProfileData] = useState({
        customerName: '',
        phoneNumber: '',
        birthday: '',
        gender: 'Nam',
        email: '',
        address: ''
    });
    const [customer, setCustomer] = useState(() => {
        try {
            const cached = localStorage.getItem("halm_customer_cache");
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(() => {
        return !localStorage.getItem("halm_customer_cache");
    });
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    const loadWalletAndBookshelf = async () => {
        try {
            const [pkgs, txs, books] = await Promise.all([
                getPotatoPackages().catch(() => []),
                getPotatoTransactions().catch(() => []),
                getCustomerBookshelf().catch(() => [])
            ]);
            if (Array.isArray(pkgs) && pkgs.length > 0) {
                setPackages(pkgs);
            }

            let combinedTxs = Array.isArray(txs) ? [...txs] : [];
            const localTxs = (window.DB && typeof window.DB.getTransactions === 'function')
                ? window.DB.getTransactions()
                : (DB && typeof DB.getTransactions === 'function' ? DB.getTransactions() : []);

            if (Array.isArray(localTxs) && localTxs.length > 0) {
                const currentId = String(customer?.customerId || customer?.id || '');
                const currentName = customer?.customerName || customer?.name || '';
                const userLocal = localTxs.filter(t => 
                    (currentId && String(t.userId) === currentId) || 
                    (currentName && t.userName === currentName) ||
                    (t.code && String(t.code).startsWith('#TX-'))
                ).map(t => ({
                    id: t.id,
                    code: t.code,
                    transactionCode: t.code,
                    transactionId: t.id,
                    type: t.type || 'NẠP KHOAI',
                    note: t.type || `Nạp ${t.potatoes} Khoai`,
                    amount: t.potatoes || 0,
                    priceVnd: t.amount,
                    status: t.status, // 'pending', 'approved', 'rejected'
                    rejectReason: t.rejectReason,
                    time: t.createdAt || 'Gần đây',
                    createdAt: t.createdAt
                }));

                userLocal.forEach(lt => {
                    const idx = combinedTxs.findIndex(ct => ct.code === lt.code || ct.id === lt.id || ct.transactionCode === lt.code);
                    if (idx === -1) {
                        combinedTxs.unshift(lt);
                    } else {
                        combinedTxs[idx] = { ...combinedTxs[idx], status: lt.status, rejectReason: lt.rejectReason };
                    }
                });
            }

            if (combinedTxs.length > 0) {
                setTransactions(combinedTxs);
            }
            if (Array.isArray(books)) {
                setBookshelf(books);
                const active = books.filter(b => !b.expired && (b.remainingDays > 0 || b.remainingDays > 1000) && b.status === 'ACTIVE');
                setRentedCount(active.length);
            }
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu ví / sách:", err);
        }
    };

    const fetchCustomerData = async (silent = false) => {
        if (!silent && !customer) setIsLoading(true);
        try {
            const data = await customerService.getCurrentCustomer();
            if (data) {
                setCustomer(data);
                try {
                    localStorage.setItem("halm_customer_cache", JSON.stringify(data));
                } catch {
                    // ignore
                }
                setProfileData({
                    customerName: data.customerName || '',
                    phoneNumber: data.phoneNumber || '',
                    birthday: formatDateForInput(data.birthday),
                    gender: data.gender === false ? 'Nữ' : 'Nam',
                    email: data.email || '',
                    address: data.address || '',
                });
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin khách hàng:', error);
            if (error?.response?.status === 401) {
                if (!silent && !isTokenValid()) {
                    clearAuthSession();
                    setCustomer(null);
                    navigate('/', { replace: true, state: { openLoginModal: true, loginMessage: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!' } });
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        fetchCustomerData().finally(() => {
            if (isMounted) setIsLoading(false);
        });
        const timer = setTimeout(() => {
            if (isMounted) setIsLoading(false);
        }, 1200);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (customer) {
            setProfileData({
                customerName: customer.customerName || '',
                phoneNumber: customer.phoneNumber || '',
                birthday: formatDateForInput(customer.birthday),
                gender: customer.gender === false ? 'Nữ' : 'Nam',
                email: customer.email || '',
                address: customer.address || '',
            });
        }
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            const payload = {
                customerName: profileData.customerName,
                phoneNumber: profileData.phoneNumber,
                birthday: profileData.birthday ? new Date(profileData.birthday) : null,
                gender: profileData.gender === 'Nam',
                email: profileData.email,
                address: profileData.address,
            };
            const updated = await customerService.updateCustomer(payload);
            const finalData = updated || { ...customer, ...payload };
            setCustomer((prev) => ({ ...prev, ...finalData }));
            setProfileData({
                customerName: finalData.customerName || '',
                phoneNumber: finalData.phoneNumber || '',
                birthday: formatDateForInput(finalData.birthday),
                gender: finalData.gender === false ? 'Nữ' : 'Nam',
                email: finalData.email || '',
                address: finalData.address || '',
            });
            setIsEditing(false);
            showToast('Cập Nhật Thành Công', 'Thông tin cá nhân của bạn đã được lưu an toàn.');
            // Đồng bộ ngầm với backend mà không gây giật màn hình
            fetchCustomerData(true);
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
            showToast('Lỗi Cập Nhật', error.message || 'Không thể lưu thông tin. Vui lòng thử lại.');
        } finally {
            setIsSaving(false);
        }
    };

    const messagesEndRef = useRef(null);
    const nextMessageId = useRef(0);
    const pendingTimers = useRef(new Set());
    const starsInitialized = useRef(false);



    useEffect(() => {
        applyTheme(isDark);
    }, [isDark]);

    useEffect(() => {
        loadWalletAndBookshelf();
        const handlePotatoUpdated = (e) => {
            const bal = e.detail?.potatoBalance;
            if (bal !== undefined) {
                setCustomer(prev => prev ? { ...prev, potatoBalance: bal } : prev);
            } else if (e.detail?.addedPotato && e.detail?.status === 'approved') {
                setCustomer(prev => prev ? { ...prev, potatoBalance: (prev.potatoBalance || 0) + e.detail.addedPotato } : prev);
            }

            if (e.detail?.status === 'approved' && e.detail?.addedPotato) {
                showToast(
                    "🎉 Nạp Khoai Thành Công!",
                    `Giao dịch ${e.detail.txCode || ''} đã được Quản trị viên phê duyệt! Đã cộng +${Number(e.detail.addedPotato).toLocaleString('vi-VN')} Khoai vào ví của bạn.`
                );
            } else if (e.detail?.status === 'rejected') {
                showToast(
                    "Giao Dịch Bị Từ Chối",
                    `Giao dịch ${e.detail.txCode || ''} bị từ chối: ${e.detail.reason || 'Thông tin chuyển khoản chưa trùng khớp'}. Vui lòng kiểm tra lại.`
                );
            }

            loadWalletAndBookshelf();
        };

        const handleDbUpdated = () => {
            loadWalletAndBookshelf();
            try {
                const cached = localStorage.getItem('halm_customer_cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setCustomer(prev => ({ ...prev, ...parsed }));
                }
            } catch (err) {
                // ignore
            }
        };

        const handleBookshelfUpdated = () => {
            loadWalletAndBookshelf();
        };

        window.addEventListener('halm-potato-updated', handlePotatoUpdated);
        window.addEventListener('halm-bookshelf-updated', handleBookshelfUpdated);
        window.addEventListener('halm_db_updated', handleDbUpdated);
        window.addEventListener('storage', handleDbUpdated);

        return () => {
            window.removeEventListener('halm-potato-updated', handlePotatoUpdated);
            window.removeEventListener('halm-bookshelf-updated', handleBookshelfUpdated);
            window.removeEventListener('halm_db_updated', handleDbUpdated);
            window.removeEventListener('storage', handleDbUpdated);
        };
    }, []);

    const openRechargeModal = (pkg) => {
        setSelectedPkg(pkg || packages[0] || DEFAULT_PACKAGES[0]);
        setPaymentMethod('vietqr');
        setIsRechargeModalOpen(true);
    };

    const handleConfirmTopup = async () => {
        if (!selectedPkg) return;
        setIsSubmittingTopup(true);
        try {
            const totalReceived = (selectedPkg.potatoAmount || 0) + (selectedPkg.bonusPotato || 0);
            const price = Number(selectedPkg.priceVnd || selectedPkg.price || 0);
            const pkgName = selectedPkg.packageName || selectedPkg.tag || 'Gói nạp';
            const codeNum = Math.floor(10000 + Math.random() * 90000);
            const txCode = `#TX-${codeNum}`;

            const now = new Date();
            const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            const txPayload = {
                id: `TX-${codeNum}`,
                code: txCode,
                userId: customer?.customerId || customer?.id || 'U1001',
                userName: customer?.customerName || customer?.name || 'Độc giả HALM',
                userEmail: customer?.email || '',
                type: `Nạp Khoai - ${pkgName}`,
                amount: price,
                potatoes: totalReceived,
                status: 'pending',
                method: 'Chuyển khoản QR MB Bank',
                createdAt: formattedDate
            };

            // 1. Gửi thông tin giao dịch chờ duyệt sang Admin (Quản Lý Tài Chính)
            if (window.DB && typeof window.DB.createUserTransaction === 'function') {
                window.DB.createUserTransaction(txPayload);
            } else if (DB && typeof DB.createUserTransaction === 'function') {
                DB.createUserTransaction(txPayload);
            } else {
                const existing = JSON.parse(localStorage.getItem('halm_db_transactions') || '[]');
                existing.unshift(txPayload);
                localStorage.setItem('halm_db_transactions', JSON.stringify(existing));
                window.dispatchEvent(new Event('halm_db_updated'));
            }

            // 2. Ghi nhận giao dịch vào lịch sử của User với trạng thái "Chờ duyệt" (TUYỆT ĐỐI KHÔNG CỘNG KHOAI NGAY)
            const userTx = {
                id: txPayload.id,
                code: txCode,
                transactionCode: txCode,
                transactionId: txPayload.id,
                type: 'NẠP KHOAI',
                note: `Nạp gói ${pkgName} (+${totalReceived.toLocaleString()} Khoai)`,
                amount: totalReceived,
                priceVnd: price,
                status: 'pending',
                time: 'Vừa xong',
                createdAt: formattedDate
            };
            setTransactions(prev => [userTx, ...(prev && prev.length > 0 ? prev : rawHistoryList)]);

            // 3. Đóng modal nạp
            setIsRechargeModalOpen(false);

            // 4. Thông báo rõ ràng cho người dùng là đang chờ Admin xét duyệt
            showToast(
                "Yêu Cầu Nạp Khoai Đã Gửi Đi!",
                `Giao dịch ${txCode} (${price.toLocaleString('vi-VN')} đ) đã được gửi tới Ban Quản Trị. Khoai sẽ được cộng vào ví của bạn ngay sau khi Admin duyệt giao dịch!`
            );

        } catch (error) {
            console.error("Lỗi gửi yêu cầu nạp khoai:", error);
            showToast("Lỗi Gửi Yêu Cầu", "Không thể gửi yêu cầu nạp đến hệ thống. Vui lòng thử lại!");
        } finally {
            setIsSubmittingTopup(false);
        }
    };

    const handleTransferSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const amount = parseInt(transferForm.amount, 10);
        if (!amount || amount <= 0) {
            showToast("Thông Báo", "Vui lòng nhập số Khoai hợp lệ!");
            return;
        }
        if (amount > (customer?.potatoBalance ?? 0)) {
            showToast("Số Dư Không Đủ", "Bạn không có đủ số Khoai trong ví để thực hiện tặng!");
            return;
        }
        if (!transferForm.receiver.trim()) {
            showToast("Thông Báo", "Vui lòng nhập ID hoặc Email người nhận!");
            return;
        }
        setIsSubmittingTransfer(true);
        try {
            const res = await transferPotato({
                receiver: transferForm.receiver.trim(),
                amount: amount,
                note: transferForm.note || "Tặng bạn đọc khoai đọc sách"
            });
            if (res.wallet && res.wallet.potatoBalance !== undefined) {
                setCustomer(prev => prev ? { ...prev, potatoBalance: res.wallet.potatoBalance } : prev);
            }
            if (res.transaction) {
                setTransactions(prev => [res.transaction, ...prev]);
            }
            setIsTransferModalOpen(false);
            setTransferForm({ receiver: '', amount: 10, note: '' });
            showToast("Tặng Khoai Thành Công!", `Đã chuyển ${amount.toLocaleString()} Khoai tới ${transferForm.receiver}.`);
            window.dispatchEvent(new CustomEvent('halm-potato-updated', {
                detail: { potatoBalance: res.wallet?.potatoBalance }
            }));
        } catch (error) {
            console.error("Lỗi tặng khoai:", error);
            showToast("Tặng Khoai Thất Bại", error?.response?.data?.message || error?.message || "Không tìm thấy người nhận hoặc lỗi hệ thống.");
        } finally {
            setIsSubmittingTransfer(false);
        }
    };

    const handleDailyCheckin = () => {
        if (dailyCheckinDone) {
            showToast("Điểm Danh Hằng Ngày", "Hôm nay bạn đã điểm danh và nhận thưởng rồi!");
            return;
        }
        setDailyCheckinDone(true);
        const newBal = (customer?.potatoBalance ?? 0) + 5;
        setCustomer(prev => prev ? { ...prev, potatoBalance: newBal } : prev);
        showToast("Điểm Danh Thành Công!", "Chúc mừng bạn nhận được +5 Khoai Tây thưởng đọc sách mỗi ngày! 🥔");
        window.dispatchEvent(new CustomEvent('halm-potato-updated', {
            detail: { potatoBalance: newBal }
        }));
    };

    useEffect(() => {
        const handleGlobalThemeChange = (e) => {
            if (typeof e.detail?.isDark === 'boolean') {
                setIsDark(e.detail.isDark);
            }
        };
        window.addEventListener('halm-theme-change', handleGlobalThemeChange);
        return () => window.removeEventListener('halm-theme-change', handleGlobalThemeChange);
    }, []);

    useEffect(() => {
        if (!isDark || starsInitialized.current) return;

        starsInitialized.current = true;
        setStars(Array.from({ length: 80 }, (_, id) => ({
            id,
            size: Math.random() * 2.5 + 0.5,
            top: Math.random() * 100,
            left: Math.random() * 100,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 3,
        })));
    }, [isDark]);

    useEffect(() => {
        document.title = 'HALM BOOK — Thông Tin Cá Nhân';
        let description = document.querySelector('meta[name="description"]');
        if (!description) {
            description = document.createElement('meta');
            description.name = 'description';
            document.head.appendChild(description);
        }
        description.content = 'Quản lý thông tin cá nhân, tài khoản độc giả và điểm tích lũy Khoai trên HALM BOOK.';
    }, []);

    useEffect(() => {
        let ticking = false;
        const updateScrollState = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                    setIsScrollTopVisible(scrollY > 250);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', updateScrollState, { passive: true });
        updateScrollState();
        return () => window.removeEventListener('scroll', updateScrollState);
    }, []);

    useEffect(() => {
        if (messages.length) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    useEffect(() => () => {
        pendingTimers.current.forEach((timerId) => window.clearTimeout(timerId));
        pendingTimers.current.clear();
    }, []);

    useEffect(() => {
        if (!document.querySelector('link[data-profile-fonts]')) {
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = PROFILE_ASSETS.fonts;
            fontLink.dataset.profileFonts = 'true';
            document.head.appendChild(fontLink);
        }
        if (!document.querySelector('script[data-profile-phosphor]')) {
            const iconScript = document.createElement('script');
            iconScript.src = PROFILE_ASSETS.phosphor;
            iconScript.async = true;
            iconScript.dataset.profilePhosphor = 'true';
            document.head.appendChild(iconScript);
        }
        window.tailwind = window.tailwind || {};
        window.tailwind.config = profileTailwindConfig;
        if (!document.querySelector('script[src*="cdn.tailwindcss.com"]')) {
            const tailwindScript = document.createElement('script');
            tailwindScript.src = PROFILE_ASSETS.tailwind;
            tailwindScript.async = true;
            tailwindScript.dataset.profileTailwind = 'true';
            document.head.appendChild(tailwindScript);
        }
    }, []);

    const addMessage = (sender, content) => {
        setMessages((current) => [...current, { id: nextMessageId.current++, sender, content }]);
    };

    const scheduleBotReply = (text) => {
        const timerId = window.setTimeout(() => {
            addMessage('bot', getBotReply(text));
            pendingTimers.current.delete(timerId);
        }, 600);
        pendingTimers.current.add(timerId);
    };

    const openChatbot = (initialMessage) => {
        setIsChatOpen(true);
        if (initialMessage) {
            addMessage('user', initialMessage);
            scheduleBotReply(initialMessage);
        }
    };

    const sendMessage = (text = chatInput) => {
        const message = text.trim();
        if (!message) return;
        addMessage('user', message);
        setChatInput('');
        scheduleBotReply(message);
    };

    const resetChat = () => {
        pendingTimers.current.forEach((timerId) => window.clearTimeout(timerId));
        pendingTimers.current.clear();
        setMessages([]);
    };

    const rawHistoryList = useMemo(() => {
        return (transactions && transactions.length > 0) ? transactions : DEFAULT_HISTORY_LIST;
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        return rawHistoryList.filter(tx => {
            if (historyFilter !== 'all') {
                const type = (tx.type || '').toUpperCase();
                if (historyFilter === 'topup' && !(type.includes('TOPUP') || type.includes('NAP'))) return false;
                if (historyFilter === 'rent' && !(type.includes('RENT') || type.includes('THUE'))) return false;
                if (historyFilter === 'reward' && !(type.includes('REWARD') || type.includes('THUONG') || type.includes('TRANSFER') || type.includes('TANG'))) return false;
            }
            if (historySearchQuery) {
                const q = normalizeSearch(historySearchQuery);
                const code = normalizeSearch(tx.code || tx.transactionCode || tx.transactionId || tx.id);
                const note = normalizeSearch(tx.note || tx.description || tx.title);
                const type = normalizeSearch(tx.type);
                const status = normalizeSearch(tx.status);
                const amount = String(tx.amount || '');
                if (!code.includes(q) && !note.includes(q) && !type.includes(q) && !status.includes(q) && !amount.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [rawHistoryList, historyFilter, historySearchQuery]);

    const totalHistoryPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredTransactions.length / HISTORY_PER_PAGE));
    }, [filteredTransactions.length]);

    const paginatedTransactions = useMemo(() => {
        return filteredTransactions.slice((historyCurrentPage - 1) * HISTORY_PER_PAGE, historyCurrentPage * HISTORY_PER_PAGE);
    }, [filteredTransactions, historyCurrentPage]);

    const userTierLevel = useMemo(() => {
        return getTierLevel(customer?.membershipTier, customer?.potatoBalance ?? 0, rentedCount);
    }, [customer?.membershipTier, customer?.potatoBalance, rentedCount]);

    const avatarFrame = useMemo(() => {
        return getTierAvatarFrame(userTierLevel, customer?.potatoBalance ?? 0, rentedCount);
    }, [userTierLevel, customer?.potatoBalance, rentedCount]);

    const tierBadgeClass = useMemo(() => {
        return getTierBadgeClass(userTierLevel, customer?.potatoBalance ?? 0, rentedCount);
    }, [userTierLevel, customer?.potatoBalance, rentedCount]);

    if (isLoading) {
        return (
            <UserLayout className="profile-page" onOpenChatbot={openChatbot} onThemeChange={setIsDark}>
                <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-wine border-t-transparent dark:border-gold dark:border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-metadata-spec font-bold text-ink-muted dark:text-night-muted">Đang tải thông tin cá nhân...</p>
                </div>
            </UserLayout>
        );
    }

    return (
        <>
            <style>{String.raw`
        /* ========================================================
           TYPOGRAPHY & CSS VARIABLES (ĐỒNG BỘ TRANG CHỦ)
           ======================================================== */
        :root {
            --font-display: "Inter", sans-serif;
            --font-ui: "Inter", sans-serif;
            --font-metadata: "Roboto", sans-serif;
            --font-editorial: "Open Sans", sans-serif;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: var(--font-ui);
            background-color: #F7F4EE;
            color: #1E1F1D;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            transition: background-color 0.4s ease, color 0.4s ease;
        }

        .dark body {
            background-color: #111210;
            color: #EDE9DF;
        }

        .font-display-hero {
            font-family: var(--font-display);
            font-weight: 900;
            letter-spacing: -0.03em;
        }

        .font-editorial-body {
            font-family: var(--font-editorial);
            line-height: 1.65;
        }

        .font-metadata-spec {
            font-family: var(--font-metadata);
        }

        /* Paper grain texture */
        .paper-grain {
            background-image: radial-gradient(rgba(30, 31, 29, 0.04) 1px, transparent 1px);
            background-size: 28px 28px;
        }
        .dark .paper-grain {
            background-image: radial-gradient(rgba(237, 233, 223, 0.04) 1px, transparent 1px);
            background-size: 28px 28px;
        }

        .profile-page {
            background-color: #F7F4EE;
            color: #1E1F1D;
        }
        .dark .profile-page {
            background-color: #111210;
            color: #EDE9DF;
        }

        html:not(.dark) [class~="bg-paper"] { background-color: #F7F4EE; }
        html:not(.dark) [class~="bg-paper-surface"] { background-color: #FFFEFA; }
        html:not(.dark) [class~="bg-paper-200"] { background-color: #EAE5D9; }
        html:not(.dark) [class~="bg-paper-200/70"] { background-color: rgb(234 229 217 / 0.7); }
        html:not(.dark) [class~="bg-wine"] { background-color: #8E3038; }
        html:not(.dark) [class~="bg-wine/10"] { background-color: rgb(142 48 56 / 0.1); }
        html:not(.dark) [class~="bg-wine/20"] { background-color: rgb(142 48 56 / 0.2); }
        html:not(.dark) [class~="bg-gold"] { background-color: #B8860B; }
        html:not(.dark) [class~="bg-gold/15"] { background-color: rgb(184 134 11 / 0.15); }

        html:not(.dark) [class~="text-ink"] { color: #1E1F1D; }
        html:not(.dark) [class~="text-ink/80"] { color: rgb(30 31 29 / 0.8); }
        html:not(.dark) [class~="text-ink-muted"] { color: #66645E; }
        html:not(.dark) [class~="text-ink-muted/60"] { color: rgb(102 100 94 / 0.6); }
        html:not(.dark) [class~="border-paper-border"] { border-color: #E3DDD0; }
        [class~="text-wine"] { color: #8E3038; }
        [class~="text-gold"] { color: #B8860B; }
        [class~="text-night-text"] { color: #EDE9DF; }
        [class~="text-night-muted"] { color: #96938B; }

        [class~="border-paper-border"] { border-color: #E3DDD0; }
        [class~="border-night-border"] { border-color: #2C2E29; }
        [class~="border-wine/25"] { border-color: rgb(142 48 56 / 0.25); }
        [class~="border-wine/30"] { border-color: rgb(142 48 56 / 0.3); }
        [class~="border-wine/40"] { border-color: rgb(142 48 56 / 0.4); }

        [class~="from-wine"][class~="to-wine-light"] {
            background-image: linear-gradient(to top right, #8E3038, #A83B46);
        }

        [class~="hover:bg-paper-200"]:hover { background-color: #EAE5D9; }
        [class~="hover:bg-night-border"]:hover { background-color: #2C2E29; }
        [class~="hover:bg-wine-dark"]:hover { background-color: #6F252C; }
        [class~="hover:text-ink"]:hover { color: #1E1F1D; }
        [class~="hover:text-wine"]:hover { color: #8E3038; }
        [class~="hover:text-gold"]:hover { color: #B8860B; }
        [class~="group-hover:text-wine"]:hover,
        .group:hover [class~="group-hover:text-wine"] { color: #8E3038; }
        [class~="focus:border-wine"]:focus { border-color: #8E3038; }
        [class~="placeholder-ink-muted/80"]::placeholder { color: rgb(102 100 94 / 0.8); }
        [class~="placeholder-night-muted"]::placeholder { color: #96938B; }

        html.dark [class~="dark:bg-gold"] { background-color: #B8860B; }
        html.dark [class~="dark:bg-gold/10"] { background-color: rgb(184 134 11 / 0.1); }
        html.dark [class~="dark:bg-gold/15"] { background-color: rgb(184 134 11 / 0.15); }
        html.dark [class~="dark:bg-night-bg"] { background-color: #111210; }
        html.dark [class~="dark:bg-night-card"] { background-color: #20221E; }
        html.dark [class~="dark:bg-night-surface"] { background-color: #181916; }
        html.dark [class*="user-sidebar-card"],
        html.dark [class*="dark:bg-night-surface"],
        html.dark [class*="dark:bg-[#181916]"] {
            background-color: #181916 !important;
            border-color: #2C2E29 !important;
        }
        html.dark [class*="user-sidebar-box"] {
            background-color: #181916 !important;
            border-color: #2C2E29 !important;
        }
        html.dark [class*="user-sidebar-card"] h2,
        html.dark [class*="user-sidebar-card"] [class*="font-display"],
        html.dark [class*="user-sidebar-box"] span.text-2xl,
        html.dark [class*="user-sidebar-box"] span:first-child {
            color: #EDE9DF !important;
        }
        html.dark [class*="user-sidebar-box"] span:last-child,
        html.dark [class*="user-sidebar-card"] p {
            color: #9CA3AF !important;
        }
        html.dark [class*="dark:border-night-border"],
        html.dark [class*="dark:border-[#2C2E29]"] {
            border-color: #2C2E29 !important;
        }
        html.dark [class*="dark:bg-[#242116]"] {
            background-color: #242116 !important;
        }
        html.dark [class*="dark:border-[#52441D]"] {
            border-color: #52441D !important;
        }
        html.dark [class~="bg-paper-surface"] {
            background-color: #181916 !important;
        }
        html.dark [class~="bg-paper"] {
            background-color: #111210 !important;
        }
        html.dark [class~="border-paper-border"] {
            border-color: #2C2E29 !important;
        }
        html.dark [class~="text-ink"],
        html.dark .text-ink {
            color: #EDE9DF !important;
        }
        html.dark [class~="text-ink-muted"],
        html.dark .text-ink-muted {
            color: #9CA3AF !important;
        }
        html.dark [class~="dark:text-gold"] { color: #B8860B; }
        html.dark [class~="dark:text-night-bg"] { color: #111210; }
        html.dark [class~="dark:text-night-muted"] { color: #96938B; }
        html.dark [class~="dark:text-night-muted/60"] { color: rgb(150 147 139 / 0.6); }
        html.dark [class~="dark:text-night-text"] { color: #EDE9DF; }
        html.dark [class~="dark:border-night-border"] { border-color: #2C2E29; }
        html.dark [class~="dark:border-night-card"] { border-color: #20221E; }
        html.dark [class~="dark:border-gold/30"] { border-color: rgb(184 134 11 / 0.3); }
        html.dark [class~="dark:border-gold/40"] { border-color: rgb(184 134 11 / 0.4); }
        html.dark [class~="dark:from-gold"][class~="dark:to-gold-light"] {
            background-image: linear-gradient(to top right, #B8860B, #D4AF37);
        }

        html.dark [class~="dark:hover:bg-night-card"]:hover { background-color: #20221E; }
        html.dark [class~="dark:hover:bg-night-surface"]:hover { background-color: #181916; }
        html.dark [class~="dark:hover:text-gold"]:hover { color: #B8860B; }
        html.dark [class~="dark:hover:text-night-text"]:hover { color: #EDE9DF; }
        html.dark [class~="dark:focus:border-gold"]:focus { border-color: #D4AF37; }
        html.dark [class~="dark:group-hover:text-gold"]:hover,
        html.dark .group:hover [class~="dark:group-hover:text-gold"] { color: #D4AF37; }

        /* ========================================================
           DARK MODE FIX FOR FOOTER
           ======================================================== */
        html.dark footer {
            background-color: #111210 !important;
            color: #EDE9DF !important;
            border-color: #2C2E29 !important;
        }
        html.dark footer h2 {
            color: #D4AF37 !important;
            border-color: #2C2E29 !important;
        }
        html.dark footer a {
            color: rgba(237, 233, 223, 0.85);
        }
        html.dark footer a:hover {
            color: #D4AF37 !important;
        }
        html.dark footer button {
            color: rgba(237, 233, 223, 0.85);
        }
        html.dark footer button:hover {
            color: #D4AF37 !important;
        }
        html.dark footer .text-\[\#5A564F\],
        html.dark footer .text-\[\#85817A\] {
            color: #96938B !important;
        }
        html.dark footer .border-\[\#E6E1D8\] {
            border-color: #2C2E29 !important;
        }
        html.dark footer .bg-white {
            background-color: #181916 !important;
            border-color: rgba(229, 169, 60, 0.3) !important;
        }

        /* Starry sky overlay for dark mode */
        #starry-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            opacity: 0;
            transition: opacity 0.6s ease;
        }
        .dark #starry-background {
            opacity: 1;
        }

        .star {
            position: absolute;
            background-color: #fff;
            border-radius: 50%;
            pointer-events: none;
        }

        @keyframes starTwinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 0.9; transform: scale(1.3); }
        }

        /* Scrolled Header */
        #navbar {
            transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease;
            will-change: transform;
        }
        #navbar.scrolled {
            background-color: rgba(247, 244, 238, 0.94);
            backdrop-filter: blur(16px);
            border-color: rgba(227, 221, 208, 0.8);
            box-shadow: 0 4px 20px -4px rgba(0,0,0,0.06);
        }
        .dark #navbar.scrolled {
            background-color: rgba(17, 18, 16, 0.94);
            border-color: rgba(44, 46, 41, 0.8);
            box-shadow: 0 4px 25px -4px rgba(0,0,0,0.5);
        }

        /* Potato Badge */
        .potato-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: rgba(184, 134, 11, 0.12);
            color: #B8860B;
            border: 1px solid rgba(184, 134, 11, 0.25);
            border-radius: 9999px;
            padding: 0.25rem 0.65rem;
            font-size: 0.8rem;
            font-weight: 700;
            font-family: var(--font-metadata);
        }
        .dark .potato-badge {
            background: rgba(212, 175, 55, 0.15);
            color: #D4AF37;
            border-color: rgba(212, 175, 55, 0.3);
        }

        /* Chatbot Modal Styling */
        #chatbot-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 50;
        }
        #chat-window {
            position: absolute;
            bottom: 70px;
            right: 0;
            width: 360px;
            height: 480px;
            max-width: calc(100vw - 32px);
            background: #181916;
            border: 1px solid #2C2E29;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.9) translateY(20px);
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            transform-origin: bottom right;
        }
        #chat-window.show {
            transform: scale(1) translateY(0);
            opacity: 1;
            pointer-events: auto;
        }

        /* Floating Scroll to Top */
        #btnScrollToTop {
            position: fixed;
            bottom: 24px;
            left: 24px;
            z-index: 40;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #FFFEFA;
            color: #1E1F1D;
            border: 1px solid #E3DDD0;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.08);
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        .dark #btnScrollToTop {
            background: #20221E;
            color: #EDE9DF;
            border-color: #2C2E29;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
        }
        #btnScrollToTop.show {
            opacity: 1;
            visibility: visible;
        }
        #btnScrollToTop:hover {
            transform: translateY(-3px);
            background: #8E3038;
            color: #fff;
            border-color: #8E3038;
        }
        .dark #btnScrollToTop:hover {
            background: #B8860B;
            color: #111210;
            border-color: #B8860B;
        }
    `}</style>
            <UserLayout className="profile-page" onOpenChatbot={openChatbot} onThemeChange={setIsDark}>



                <div id="starry-background" aria-hidden="true">
                    {stars.map((star) => (
                        <div
                            key={star.id}
                            className="star"
                            style={{
                                width: `${star.size}px`,
                                height: `${star.size}px`,
                                top: `${star.top}%`,
                                left: `${star.left}%`,
                                animation: `starTwinkle ${star.duration}s infinite ease-in-out ${star.delay}s`,
                            }}
                        />
                    ))}
                </div>


                <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-28 sm:pb-16 flex-1">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">


                        {/* LEFT SIDEBAR - FIXED/STICKY CONTAINER */}
                        <aside className="w-full lg:w-80 shrink-0 space-y-4 lg:sticky lg:top-24 lg:self-start">

                            {/* 1. Profile Avatar Card */}
                            <div className="rounded-3xl user-sidebar-card bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                                {/* Dynamic Avatar Frame with Tier Prestige - Bo theo viền cung tròn Tu Tiên */}
                                <div className="relative group/avatar">
                                    <AvatarWithFrame
                                        avatarSrc={customer?.avatar || customer?.avatarUrl}
                                        name={customer?.customerName || 'Độc giả'}
                                        tier={customer?.membershipTier}
                                        potatoBalance={customer?.potatoBalance ?? 0}
                                        booksCount={rentedCount || bookshelf?.length || 0}
                                        size="lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={isUploadingAvatar}
                                        className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer border-2 border-white dark:border-night-surface z-20"
                                        title="Tải ảnh đại diện mới từ máy tính (Cloudinary)"
                                        aria-label="Tải ảnh đại diện mới"
                                    >
                                        {isUploadingAvatar ? (
                                            <div className="w-4 h-4 border-2 border-white dark:border-night-bg border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <i className="ph-bold ph-camera text-sm"></i>
                                        )}
                                    </button>
                                    <input
                                        type="file"
                                        ref={avatarInputRef}
                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                        className="hidden"
                                        onChange={handleAvatarFileSelected}
                                    />
                                </div>

                                <h2 className="font-display font-black text-2xl text-stone-900 dark:!text-[#EDE9DF] leading-tight">
                                    {customer?.customerName || 'Độc giả'}
                                </h2>
                                <p className="font-metadata-spec text-xs text-stone-500 dark:!text-[#9CA3AF] mt-1">
                                    {formatCustomerId(customer?.customerId || customer?.customer_id)}
                                </p>

                                <Link to="/hang" className={`mt-3.5 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-metadata-spec font-bold hover:scale-105 transition-transform ${getTierBadgeClass(customer?.membershipTier, customer?.potatoBalance ?? 0, rentedCount || bookshelf?.length || 0)}`} title="Xem cấp bậc hội viên">
                                    <i className={`ph-bold ${getTierInfo(customer?.membershipTier, customer?.potatoBalance ?? 0, rentedCount || bookshelf?.length || 0).icon}`}></i>
                                    <span>{getTierInfo(customer?.membershipTier, customer?.potatoBalance ?? 0, rentedCount || bookshelf?.length || 0).name}</span>
                                </Link>

                                {/* Divider */}
                                <div className="w-full h-px bg-paper-border dark:bg-night-border my-5"></div>

                                <div className="grid grid-cols-2 gap-3 w-full text-center">
                                    <button type="button" onClick={() => handleSelectTab('wallet')} className="py-4 px-3 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors flex flex-col justify-center">
                                        <span className="block font-metadata-spec text-2xl font-black text-stone-900 dark:!text-[#EDE9DF]" style={{ color: isDark ? '#EDE9DF' : undefined }}>{(customer?.potatoBalance ?? 0).toLocaleString()}</span>
                                        <span className="font-metadata-spec text-xs text-stone-500 dark:!text-[#9CA3AF] mt-1" style={{ color: isDark ? '#9CA3AF' : undefined }}>Khoai Tích Lũy</span>
                                    </button>
                                    <Link to="/tusachcn" className="py-4 px-3 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold transition-colors flex flex-col justify-center">
                                        <span className="block font-metadata-spec text-2xl font-black text-stone-900 dark:!text-[#EDE9DF]" style={{ color: isDark ? '#EDE9DF' : undefined }}>{rentedCount}</span>
                                        <span className="font-metadata-spec text-xs text-stone-500 dark:!text-[#9CA3AF] mt-1" style={{ color: isDark ? '#9CA3AF' : undefined }}>Sách Trong Tủ</span>
                                    </Link>
                                </div>
                            </div>

                            {/* 2. Navigation Menu Card - STRICT ORDER (1: Profile, 2: Bookshelf, 3: Tiers, 4: Missions, 5: Wallet, 6: History, Divider, 7: Logout) */}
                            <div className="rounded-3xl user-sidebar-card bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border p-3.5 shadow-sm space-y-1.5">
                                {/* 1. Thông Tin Cá Nhân */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectTab('profile')}
                                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec transition-all ${activeTab === 'profile'
                                        ? 'bg-[#C28807] text-[#111210] font-black shadow-md'
                                        : 'font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white'
                                        }`}
                                >
                                    <i className={`ph-bold ph-user text-lg ${activeTab === 'profile' ? 'text-[#111210]' : 'text-stone-400'}`}></i>
                                    <span>Thông Tin Cá Nhân</span>
                                </button>

                                {/* 2. Tủ Sách Cá Nhân */}
                                <Link
                                    to="/tusachcn"
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-book-bookmark text-lg text-stone-400"></i>
                                        <span>Tủ Sách Cá Nhân</span>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-paper-200 dark:bg-[#242116] border border-paper-border dark:border-[#52441D] text-amber-600 dark:text-[#D8B44A] text-xs font-bold font-metadata-spec">{rentedCount} cuốn</span>
                                </Link>

                                {/* 3. Hạng Thành Viên */}
                                <Link
                                    to="/hang"
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-trophy text-lg text-stone-400"></i>
                                        <span>Hạng Thành Viên</span>
                                    </div>
                                    <i className="ph-bold ph-caret-right text-xs text-stone-400"></i>
                                </Link>

                                {/* 3.5. Nhiệm Vụ Hằng Ngày */}
                                <Link
                                    to="/nhiemvu"
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-target text-lg text-stone-400"></i>
                                        <span>Nhiệm Vụ Hằng Ngày</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-paper-200 dark:bg-[#242116] border border-paper-border dark:border-[#52441D] text-amber-600 dark:text-[#D8B44A] text-xs font-bold">Streak 🔥</span>
                                </Link>

                                {/* 4. Ví Khoai Tây */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectTab('wallet')}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec transition-all ${activeTab === 'wallet'
                                        ? 'bg-[#C28807] text-[#111210] font-black shadow-md'
                                        : 'font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className={`ph-bold ph-wallet text-lg ${activeTab === 'wallet' ? 'text-[#111210]' : 'text-stone-400'}`}></i>
                                        <span>Ví Khoai Tây</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold font-metadata-spec ${activeTab === 'wallet' ? 'bg-black/25 text-black font-black' : 'bg-paper-200 dark:bg-[#242116] border border-paper-border dark:border-[#52441D] text-amber-600 dark:text-[#D8B44A]'}`}>{(customer?.potatoBalance ?? 0).toLocaleString()} 🥔</span>
                                </button>

                                {/* 5. Lịch Sử Giao Dịch */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectTab('history')}
                                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec transition-all ${activeTab === 'history'
                                        ? 'bg-[#C28807] text-[#111210] font-black shadow-md'
                                        : 'font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white'
                                        }`}
                                >
                                    <i className={`ph-bold ph-clock-counter-clockwise text-lg ${activeTab === 'history' ? 'text-[#111210]' : 'text-stone-400'}`}></i>
                                    <span>Lịch Sử Giao Dịch</span>
                                </button>

                                {/* 6. Khiếu Nại & Hỗ Trợ (RabbitMQ) */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectTab('support')}
                                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec transition-all ${activeTab === 'support'
                                        ? 'bg-[#C28807] text-[#111210] font-black'
                                        : 'font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white'
                                        }`}
                                >
                                    <i className={`ph-bold ph-headset text-lg ${activeTab === 'support' ? 'text-[#111210]' : 'text-stone-400'}`}></i>
                                    <span>Khiếu Nại & Hỗ Trợ</span>
                                </button>

                                {/* Divider Line */}
                                <div className="my-2 border-t border-paper-border dark:border-[#2C2E29]"></div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        clearAuthSession();
                                        window.location.assign('/');
                                    }}
                                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                >
                                    <i className="ph-bold ph-sign-out text-lg text-rose-500"></i>
                                    <span>Đăng Xuất</span>
                                </button>
                            </div>
                        </aside>

                        {/* RIGHT CONTENT AREA - CHANGES SMOOTHLY BY TAB */}
                        <div className="flex-1 min-w-0 w-full space-y-5">

                            {/* Toast Notification */}
                            {toast.show && (
                                <div className="fixed top-24 right-6 z-50 rounded-2xl bg-paper-surface dark:bg-night-card border border-wine/30 dark:border-gold/40 shadow-2xl p-4 flex items-center gap-3 text-ink dark:text-night-text animate-bounce">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                        <i className="ph-bold ph-check text-lg"></i>
                                    </div>
                                    <div>
                                        <div className="font-display font-bold text-xs">{toast.title}</div>
                                        <div className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">{toast.message}</div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
                            {activeTab === 'profile' && (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                                <Link to="/" className="hover:underline">Trang chủ</Link>
                                                <i className="ph-bold ph-caret-right text-[10px]"></i>
                                                <span>Tài khoản</span>
                                                <i className="ph-bold ph-caret-right text-[10px]"></i>
                                                <span className="text-wine dark:text-gold font-bold">Hồ sơ cá nhân</span>
                                            </div>
                                            <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight">
                                                Thông Tin Cá Nhân
                                            </h1>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm space-y-6">
                                        <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg">
                                                    <i className="ph-bold ph-identification-card"></i>
                                                </div>
                                                <div>
                                                    <h3 className="font-display font-bold text-sm text-ink dark:text-night-text">Dữ Liệu Nhận Diện</h3>
                                                    <p className="font-editorial-body text-[11px] text-ink-muted dark:text-night-muted">Thông tin tài khoản đã được xác thực bảo mật.</p>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-metadata-spec font-bold">
                                                <i className="ph-bold ph-shield-check"></i> Đã Xác Thực
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                            <div className="space-y-1.5">
                                                <label className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-user text-wine dark:text-gold text-xs"></i> Tên Người Dùng
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={profileData.customerName || ''}
                                                        onChange={(e) => setProfileData({ ...profileData, customerName: e.target.value })}
                                                        readOnly={!isEditing}
                                                        className={`w-full px-3.5 py-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text shadow-inner transition-colors ${isEditing ? 'focus:border-wine dark:focus:border-gold' : 'cursor-default'
                                                            }`}
                                                    />
                                                    <i className={`ph-bold ${isEditing ? 'ph-pencil' : 'ph-lock-simple'} absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted/60 dark:text-night-muted/60 text-xs`}></i>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-phone text-wine dark:text-gold text-xs"></i> Số Điện Thoại
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={profileData.phoneNumber || ''}
                                                        onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                                                        readOnly={!isEditing}
                                                        className={`w-full px-3.5 py-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text shadow-inner transition-colors ${isEditing ? 'focus:border-wine dark:focus:border-gold' : 'cursor-default'
                                                            }`}
                                                    />
                                                    <i className={`ph-bold ${isEditing ? 'ph-pencil' : 'ph-lock-simple'} absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted/60 dark:text-night-muted/60 text-xs`}></i>
                                                </div>
                                            </div>
                                            <div className=" space-y-1.5">
                                                <label className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-cake text-wine dark:text-gold text-xs"></i> Ngày sinh
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={profileData.birthday || ''}
                                                        onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                                                        readOnly={!isEditing}
                                                        className={`w-full px-3.5 py-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text shadow-inner resize-none transition-colors ${isEditing ? 'focus:border-wine dark:focus:border-gold' : 'cursor-default'
                                                            }`}
                                                    />
                                                    <i className={`ph-bold ${isEditing ? 'ph-pencil' : 'ph-lock-simple'} absolute right-3 top-3 text-ink-muted/60 dark:text-night-muted/60 text-xs`}></i>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label htmlFor="select-gender" className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-gender-intersex text-wine dark:text-gold text-xs"></i> Giới Tính
                                                </label>
                                                <select id="select-gender"
                                                    className="w-full px-3.5 py-2.5 rounded-xl bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-semibold text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold transition-colors shadow-inner"
                                                    value={profileData.gender || 'Nam'}
                                                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                                                    disabled={!isEditing}
                                                >
                                                    <option value="Nam">Nam</option>
                                                    <option value="Nữ">Nữ</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-envelope-simple text-wine dark:text-gold text-xs"></i> Địa Chỉ Email
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="email"
                                                        value={profileData.email || ''}
                                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                        readOnly={!isEditing}
                                                        className={`w-full px-3.5 py-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text shadow-inner transition-colors ${isEditing ? 'focus:border-wine dark:focus:border-gold' : 'cursor-default'
                                                            }`}
                                                    />
                                                    <i className={`ph-bold ${isEditing ? 'ph-pencil' : 'ph-lock-simple'} absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted/60 dark:text-night-muted/60 text-xs`}></i>
                                                </div>
                                            </div>

                                            <div className=" space-y-1.5">
                                                <label className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-map-pin text-wine dark:text-gold text-xs"></i> Địa Chỉ Thường Trú
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={profileData.address || ''}
                                                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                                        readOnly={!isEditing}
                                                        className={`w-full px-3.5 py-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text shadow-inner resize-none transition-colors ${isEditing ? 'focus:border-wine dark:focus:border-gold' : 'cursor-default'
                                                            }`}
                                                    />
                                                    <i className={`ph-bold ${isEditing ? 'ph-pencil' : 'ph-lock-simple'} absolute right-3 top-3 text-ink-muted/60 dark:text-night-muted/60 text-xs`}></i>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-paper-border dark:border-night-border flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-2 text-xs font-editorial-body text-ink-muted dark:text-night-muted">
                                                <i className="ph-bold ph-info text-wine dark:text-gold text-sm shrink-0"></i>
                                                <span>Thông tin cá nhân được bảo vệ theo chính sách bảo mật độc giả HALM BOOK.</span>
                                            </div>

                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={handleCancelEdit}
                                                            disabled={isSaving}
                                                            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full border border-paper-border dark:border-night-border text-xs font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface transition-colors disabled:opacity-50"
                                                        >
                                                            Hủy Bỏ
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleSaveEdit}
                                                            disabled={isSaving}
                                                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-metadata-spec text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                                                        >
                                                            <i className={`ph-bold ${isSaving ? 'ph-spinner animate-spin' : 'ph-check'} text-sm`}></i>
                                                            <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
                                                        <button
                                                            type="button"
                                                            onClick={openPasswordModal}
                                                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-paper-200 dark:bg-night-surface hover:bg-paper-border dark:hover:bg-night-border border border-paper-border dark:border-night-border text-ink dark:text-night-text font-metadata-spec text-xs font-bold transition-all shadow-sm cursor-pointer"
                                                        >
                                                            <i className="ph-bold ph-lock-key text-sm text-wine dark:text-gold"></i>
                                                            <span>Đổi Mật Khẩu</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsEditing(true)}
                                                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-colors shadow-sm cursor-pointer"
                                                        >
                                                            <i className="ph-bold ph-pencil-simple text-sm"></i>
                                                            <span>Chỉnh Sửa Thông Tin</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3 Metric Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg shrink-0">
                                                <i className="ph-bold ph-shield-check"></i>
                                            </div>
                                            <div>
                                                <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted block">Bảo Mật 2 Lớp</span>
                                                <span className="font-display font-bold text-xs text-ink dark:text-night-text">Đã Kích Hoạt</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-lg shrink-0">
                                                <i className="ph-bold ph-coins"></i>
                                            </div>
                                            <div>
                                                <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted block">Số Dư Khoai</span>
                                                <span className="font-display font-bold text-xs text-ink dark:text-night-text">{(customer?.potatoBalance ?? 0).toLocaleString()} Khoai Tây</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-paper-200 dark:bg-night-surface text-ink-muted dark:text-night-muted flex items-center justify-center text-lg shrink-0">
                                                <i className="ph-bold ph-calendar-check"></i>
                                            </div>
                                            <div>
                                                <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted block">Ngày Gia Nhập</span>
                                                <span className="font-display font-bold text-xs text-ink dark:text-night-text">15/01/2026</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* TAB 2: VÍ KHOAI TÂY */}
                            {activeTab === 'wallet' && (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                                <Link to="/" className="hover:underline">Trang chủ</Link>
                                                <i className="ph-bold ph-caret-right text-[10px]"></i>
                                                <span>Tài khoản</span>
                                                <i className="ph-bold ph-caret-right text-[10px]"></i>
                                                <span className="text-wine dark:text-gold font-bold">Ví khoai tây</span>
                                            </div>
                                            <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight flex items-center gap-2.5">
                                                <span>Ví Khoai Tây & Điểm Thưởng</span>
                                                <span className="text-2xl">🥔</span>
                                            </h1>
                                        </div>
                                    </div>

                                    {/* Potato Balance Hero Card */}
                                    <div className="rounded-3xl bg-gradient-to-br from-[#201F1B] via-[#2A261D] to-[#171815] text-[#F4F2EC] border border-[#D4AF37]/40 p-6 sm:p-8 shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>
                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-xs font-bold text-[#F0D77C]">
                                                    <i className="ph-bold ph-wallet"></i> Số Dư Khả Dụng
                                                </span>
                                                <div className="flex items-baseline gap-3 mt-3">
                                                    <span className="font-display font-black text-4xl sm:text-5xl text-[#F4F2EC] tracking-tight">{(customer?.potatoBalance ?? 0).toLocaleString()}</span>
                                                    <span className="font-display font-bold text-2xl text-[#D4AF37]">Khoai 🥔</span>
                                                </div>
                                                <p className="text-xs text-[#E9E4D6]/70 mt-2 max-w-md">
                                                    Tương đương <strong>~{((customer?.potatoBalance ?? 0) * 1000).toLocaleString()} VNĐ</strong> giá trị thuê mượn sách bản quyền và mở khóa chương VIP trên HALM BOOK.
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap sm:flex-nowrap gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => openRechargeModal(packages[0])}
                                                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#C59F2E] hover:to-[#D4AF37] text-[#1A1A17] font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                                                >
                                                    <i className="ph-bold ph-lightning text-base"></i>
                                                    <span>Nạp Khoai Siêu Tốc</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTransferModalOpen(true)}
                                                    className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#F4F2EC] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                                >
                                                    <i className="ph-bold ph-paper-plane-tilt text-base text-gold"></i>
                                                    <span>Tặng Khoai</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectTab('history')}
                                                    className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-[#F4F2EC] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                                >
                                                    <i className="ph-bold ph-clock-counter-clockwise text-base"></i>
                                                    <span>Lịch Sử</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recharge Packages Grid */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-display font-black text-lg text-ink dark:text-night-text flex items-center gap-2">
                                                <i className="ph-bold ph-lightning text-wine dark:text-gold"></i>
                                                Gói Nạp Khoai Ưu Đãi
                                            </h3>
                                            <span className="text-xs font-bold text-wine dark:text-gold">Tặng thêm tới 40%</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {packages.map((pkg, i) => (
                                                <div key={pkg.packageId || i} className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${pkg.isHot || pkg.hot
                                                    ? 'bg-paper-surface dark:bg-night-card border-wine/50 dark:border-gold/60 ring-2 ring-wine/20 dark:ring-gold/30'
                                                    : 'bg-paper-surface dark:bg-night-card border-paper-border dark:border-night-border'
                                                    }`}>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink-muted dark:text-night-muted">{pkg.tag || pkg.packageName}</span>
                                                            {(pkg.isHot || pkg.hot) && <span className="potato-badge text-[9px] py-0 px-1.5 bg-wine text-white dark:bg-gold dark:text-night-bg">HOT</span>}
                                                        </div>
                                                        <div className="font-display font-black text-2xl text-ink dark:text-night-text">{(pkg.potatoAmount || 0).toLocaleString()} 🥔</div>
                                                        {(pkg.bonusPotato > 0) && (
                                                            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                                +{pkg.bonusPotato.toLocaleString()} Khoai ({pkg.bonusRate || Math.round((pkg.bonusPotato / pkg.potatoAmount) * 100)}%)
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-5 pt-3 border-t border-paper-border dark:border-night-border flex items-center justify-between">
                                                        <span className="font-display font-black text-sm text-wine dark:text-gold">{(pkg.priceVnd || 0).toLocaleString()}đ</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => openRechargeModal(pkg)}
                                                            className="px-3.5 py-1.5 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
                                                        >
                                                            <span>Nạp Ngay</span>
                                                            <i className="ph-bold ph-caret-right text-xs"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. Trung Tâm Nhiệm Vụ Hằng Ngày - Điều Hướng Tập Trung */}
                                    <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-gold flex items-center justify-center text-xl shrink-0">
                                                    🎯
                                                </span>
                                                <div>
                                                    <h3 className="font-display font-black text-base text-ink dark:text-night-text">
                                                        Trung Tâm Nhiệm Vụ & Điểm Thưởng
                                                    </h3>
                                                    <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">
                                                        Làm nhiệm vụ đọc sách, đánh giá và duy trì streak để tích lũy Khoai đổi quà mỗi ngày.
                                                    </p>
                                                </div>
                                            </div>

                                            <Link
                                                to="/nhiemvu"
                                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata-spec font-bold text-xs shadow-sm transition-all self-start sm:self-auto shrink-0"
                                            >
                                                <span>Mở Trang Nhiệm Vụ Hằng Ngày</span>
                                                <i className="ph-bold ph-arrow-right text-xs"></i>
                                            </Link>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                            <div className="p-3.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-base">📖</span>
                                                    <span className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text">Đọc Sách Hằng Ngày</span>
                                                </div>
                                                <p className="text-[11px] text-ink-muted dark:text-night-muted">Tích lũy giờ đọc sách nhận tới +15 Khoai mỗi ngày.</p>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-base">💬</span>
                                                    <span className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text">Bình Luận & Đánh Giá</span>
                                                </div>
                                                <p className="text-[11px] text-ink-muted dark:text-night-muted">Góp ý, để lại cảm nhận nhận +10 Khoai.</p>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-base">👑</span>
                                                    <span className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text">Thăng Hạng Thành Viên</span>
                                                </div>
                                                <p className="text-[11px] text-ink-muted dark:text-night-muted">Đạt mốc điểm cày nhận thưởng hàng trăm Khoai.</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* TAB 3: LỊCH SỬ GIAO DỊCH */}
                            {activeTab === 'history' && (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                                <Link to="/" className="hover:underline">Trang chủ</Link>
                                                <i className="ph-bold ph-caret-right text-[10px]"></i>
                                                <span>Tài khoản</span>
                                                <i className="ph-bold ph-caret-right text-[10px]"></i>
                                                <span className="text-wine dark:text-gold font-bold">Lịch sử giao dịch</span>
                                            </div>
                                            <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight flex items-center gap-2">
                                                <span>Lịch Sử Giao Dịch Khoai Tây</span>
                                                <i className="ph-bold ph-clock-counter-clockwise text-wine dark:text-gold text-2xl"></i>
                                            </h1>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => openRechargeModal(packages[0])}
                                            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata-spec font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                        >
                                            <i className="ph-bold ph-plus-circle text-sm"></i>
                                            <span>Nạp Thêm Khoai</span>
                                        </button>
                                    </div>

                                    {/* Transactions List Card */}
                                    <div className="rounded-3xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm space-y-4">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-9 h-9 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg">
                                                    <i className="ph-bold ph-receipt"></i>
                                                </span>
                                                <div>
                                                    <h3 className="font-display font-bold text-sm text-ink dark:text-night-text">Danh Sách Biến Động Số Dư</h3>
                                                    <p className="text-[11px] text-ink-muted dark:text-night-muted">Tất cả giao dịch nạp, thuê sách, gia hạn và thưởng điểm.</p>
                                                </div>
                                            </div>

                                            {/* Filters & Search */}
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                                {/* Search Input */}
                                                <div className="relative w-full sm:w-60">
                                                    <i className="ph-bold ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8E3038] dark:text-[#D4AF37]"></i>
                                                    <input
                                                        type="text"
                                                        value={historySearchQuery}
                                                        onChange={(e) => {
                                                            setHistorySearchQuery(e.target.value);
                                                            setHistoryCurrentPage(1);
                                                        }}
                                                        placeholder="Tìm mã GD, nội dung..."
                                                        className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border focus:outline-none focus:border-wine dark:focus:border-gold text-ink dark:text-night-text placeholder-ink-muted/70 transition-colors font-metadata-spec"
                                                        autoComplete="off"
                                                    />
                                                    {historySearchQuery && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setHistorySearchQuery('');
                                                                setHistoryCurrentPage(1);
                                                            }}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink dark:hover:text-white text-xs cursor-pointer"
                                                            title="Xóa tìm kiếm"
                                                        >
                                                            <i className="ph-bold ph-x"></i>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Filter Category Pills */}
                                                <div className="flex items-center gap-1.5 text-xs font-metadata-spec font-bold overflow-x-auto pb-1 sm:pb-0">
                                                    {['all', 'topup', 'rent', 'reward'].map((f) => {
                                                        const labels = {
                                                            all: 'Tất Cả',
                                                            topup: 'Nạp Khoai',
                                                            rent: 'Thuê Sách',
                                                            reward: 'Thưởng & Tặng'
                                                        };
                                                        return (
                                                            <button
                                                                key={f}
                                                                type="button"
                                                                onClick={() => {
                                                                    setHistoryFilter(f);
                                                                    setHistoryCurrentPage(1);
                                                                }}
                                                                className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${historyFilter === f
                                                                    ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                                                    : 'bg-paper-200 dark:bg-night-surface text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text'
                                                                    }`}
                                                            >
                                                                {labels[f]}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto -mx-2">
                                            <table className="w-full text-left text-xs font-metadata-spec border-collapse min-w-[640px]">
                                                <thead>
                                                    <tr className="border-b border-paper-border dark:border-night-border text-ink-muted dark:text-night-muted font-bold">
                                                        <th className="py-3 px-3">Mã GD</th>
                                                        <th className="py-3 px-3">Loại Giao Dịch & Nội Dung</th>
                                                        <th className="py-3 px-3">Thời Gian</th>
                                                        <th className="py-3 px-3 text-right">Biến Động</th>
                                                        <th className="py-3 px-3 text-center">Trạng Thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-paper-border dark:divide-night-border">
                                                    {paginatedTransactions.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="5" className="py-8 text-center text-xs text-ink-muted dark:text-night-muted">
                                                                Không tìm thấy giao dịch nào phù hợp với bộ lọc.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        paginatedTransactions.map((tx, idx) => {
                                                            const isMinus = (tx.amount < 0) || (tx.type && (tx.type.includes('RENT') || tx.type.includes('THUE')));
                                                            const displayAmount = Math.abs(tx.amount || 0);
                                                            const code = tx.code || tx.transactionCode || `GD-${tx.transactionId || tx.id || idx + 100}`;
                                                            const note = tx.note || tx.description || tx.title || 'Giao dịch ví';
                                                            const type = tx.type || 'GIAO DỊCH';
                                                            const time = tx.time || (tx.createdAt ? tx.createdAt.replace('T', ' ').substring(0, 16) : 'Gần đây');
                                                            const status = tx.status || 'Thành công';

                                                            return (
                                                                <tr key={tx.transactionId || tx.id || idx} className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                                    <td className="py-3.5 px-3 font-mono font-bold text-ink-muted dark:text-night-muted">{code}</td>
                                                                    <td className="py-3.5 px-3">
                                                                        <span className="font-bold text-ink dark:text-night-text block">{note}</span>
                                                                        <span className="text-[10px] text-ink-muted dark:text-night-muted uppercase tracking-wider">{type}</span>
                                                                    </td>
                                                                    <td className="py-3.5 px-3 text-ink-muted dark:text-night-muted">{time}</td>
                                                                    {(() => {
                                                                        const s = String(status || '').toLowerCase();
                                                                        const isPending = s === 'pending' || s.includes('chờ');
                                                                        const isRejected = s === 'rejected' || s.includes('từ chối') || s.includes('hủy');

                                                                        return (
                                                                            <>
                                                                                <td className={`py-3.5 px-3 text-right font-black ${
                                                                                    isPending 
                                                                                        ? 'text-amber-600 dark:text-amber-400' 
                                                                                        : isRejected 
                                                                                            ? 'text-slate-400 dark:text-slate-500 line-through' 
                                                                                            : isMinus 
                                                                                                ? 'text-rose-600 dark:text-rose-400' 
                                                                                                : 'text-emerald-600 dark:text-emerald-400'
                                                                                }`}>
                                                                                    {isMinus ? `-${displayAmount}` : `+${displayAmount}`} Khoai 🥔
                                                                                    {isPending && <span className="block text-[10px] font-normal text-amber-600 dark:text-amber-400">(Chờ duyệt)</span>}
                                                                                </td>
                                                                                <td className="py-3.5 px-3 text-center">
                                                                                    {isPending ? (
                                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 text-[10px] font-bold shadow-xs">
                                                                                            <i className="ph-bold ph-hourglass-medium animate-pulse text-amber-600 dark:text-amber-400"></i> Chờ duyệt
                                                                                        </span>
                                                                                    ) : isRejected ? (
                                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-700/60 text-[10px] font-bold shadow-xs" title={tx.rejectReason || 'Giao dịch bị từ chối'}>
                                                                                            <i className="ph-bold ph-x-circle text-rose-600 dark:text-rose-400"></i> Bị từ chối
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/60 text-[10px] font-bold shadow-xs">
                                                                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400"></i> Thành công
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalHistoryPages > 1 && (
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-paper-border dark:border-night-border font-metadata-spec">
                                                <div className="text-xs text-ink-muted dark:text-night-muted">
                                                    Hiển thị <span className="font-bold text-ink dark:text-night-text">{(historyCurrentPage - 1) * HISTORY_PER_PAGE + 1} - {Math.min(historyCurrentPage * HISTORY_PER_PAGE, filteredTransactions.length)}</span> trên <span className="font-bold text-ink dark:text-night-text">{filteredTransactions.length}</span> giao dịch
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        disabled={historyCurrentPage <= 1}
                                                        onClick={() => setHistoryCurrentPage(prev => Math.max(1, prev - 1))}
                                                        className="px-3 py-1.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-200 dark:hover:bg-night-surface transition-colors flex items-center gap-1"
                                                    >
                                                        <i className="ph-bold ph-caret-left text-xs"></i>
                                                        <span>Trước</span>
                                                    </button>
                                                    {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map(num => (
                                                        <button
                                                            key={num}
                                                            type="button"
                                                            onClick={() => setHistoryCurrentPage(num)}
                                                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                                                                historyCurrentPage === num
                                                                    ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                                                    : 'border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-surface'
                                                            }`}
                                                        >
                                                            {num}
                                                        </button>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        disabled={historyCurrentPage >= totalHistoryPages}
                                                        onClick={() => setHistoryCurrentPage(prev => Math.min(totalHistoryPages, prev + 1))}
                                                        className="px-3 py-1.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-200 dark:hover:bg-night-surface transition-colors flex items-center gap-1"
                                                    >
                                                        <span>Sau</span>
                                                        <i className="ph-bold ph-caret-right text-xs"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* TAB 4: KHIẾU NẠI & HỖ TRỢ (RABBITMQ ASYNC PIPELINE) */}
                            {activeTab === 'support' && (
                                <SupportTicketSection customer={customer} showToast={showToast} />
                            )}

                        </div>

                    </div>
                </main>

                {/* MODAL NẠP KHOAI VIETQR */}
                {isRechargeModalOpen && selectedPkg && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
                        <div className="relative w-full max-w-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl shadow-2xl overflow-hidden my-6">
                            {/* Modal Header */}
                            <div className="px-6 py-4 bg-paper dark:bg-night-surface border-b border-paper-border dark:border-night-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-wine to-wine-light text-white flex items-center justify-center text-xl shadow-md">
                                        <i className="ph-bold ph-qr-code"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text">Nạp Khoai Siêu Tốc (VietQR 24/7)</h3>
                                        <p className="text-xs text-ink-muted dark:text-night-muted">Quét mã bằng app ngân hàng bất kỳ để nhận khoai tự động trong 30s</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsRechargeModalOpen(false)}
                                    className="w-8 h-8 rounded-full bg-paper-border/50 dark:bg-night-border text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text flex items-center justify-center transition-colors"
                                >
                                    <i className="ph-bold ph-x text-base"></i>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6">
                                {/* Gói đã chọn & Chọn gói khác */}
                                <div>
                                    <div className="text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted uppercase tracking-wider mb-2">
                                        1. Chọn Gói Nạp Khoai
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        {packages.map((pkg) => {
                                            const isSelected = selectedPkg?.packageId === pkg.packageId || selectedPkg?.id === pkg.id;
                                            return (
                                                <button
                                                    key={pkg.packageId || pkg.id}
                                                    type="button"
                                                    onClick={() => setSelectedPkg(pkg)}
                                                    className={`p-2.5 rounded-2xl border text-left transition-all ${isSelected
                                                        ? 'bg-wine/10 dark:bg-gold/15 border-wine dark:border-gold shadow-sm ring-1 ring-wine dark:ring-gold'
                                                        : 'bg-paper dark:bg-night-surface border-paper-border dark:border-night-border hover:border-wine/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between text-xs font-black text-ink dark:text-night-text">
                                                        <span>{pkg.potatoAmount?.toLocaleString()} 🥔</span>
                                                        {pkg.bonusPotato > 0 && (
                                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">+{pkg.bonusPotato}</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] font-bold text-wine dark:text-gold mt-1">
                                                        {pkg.priceVnd?.toLocaleString('vi-VN')} đ
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Chi Tiết Thanh Toán */}
                                <div>
                                    <div className="text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted uppercase tracking-wider mb-2">
                                        2. Quét Mã QR Hoặc Chuyển Khoản
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                                        {/* Cột QR */}
                                        <div className="md:col-span-5 flex flex-col items-center">
                                            <div className="p-3 bg-white rounded-2xl shadow-md border border-paper-border inline-block">
                                                <img
                                                    src={`https://api.vietqr.io/image/970422-0345678999-compact2.png?amount=${selectedPkg?.priceVnd || 200000}&addInfo=${encodeURIComponent(`HALM C${String(customer?.customerId || customer?.customer_id || 7).replace(/^C/i, '').padStart(5, '0')} NAP`)}&accountName=${encodeURIComponent('HALM BOOK CO LTD')}`}
                                                    alt="VietQR HalmBook"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`HALM-NAP-C${String(customer?.customerId || customer?.customer_id || 7).replace(/^C/i, '').padStart(5, '0')}-${selectedPkg?.priceVnd || 200000}`)}`;
                                                    }}
                                                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                                                />
                                            </div>
                                            <div className="mt-2 text-center text-[11px] text-ink-muted dark:text-night-muted font-metadata-spec flex items-center gap-1">
                                                <i className="ph-fill ph-lightning text-amber-500"></i>
                                                <span>Xử lý & cộng khoai tức thì</span>
                                            </div>
                                        </div>

                                        {/* Cột Thông Tin Chuyển Khoản */}
                                        <div className="md:col-span-7 space-y-2.5 font-metadata-spec text-xs">
                                            <div className="p-3 rounded-2xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] text-ink-muted dark:text-night-muted block">Ngân Hàng Thụ Hưởng</span>
                                                    <span className="font-bold text-ink dark:text-night-text">MB Bank (Ngân Hàng Quân Đội)</span>
                                                </div>
                                                <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-lg">MB</span>
                                            </div>

                                            <div className="p-3 rounded-2xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] text-ink-muted dark:text-night-muted block">Số Tài Khoản</span>
                                                    <span className="font-mono font-black text-sm text-ink dark:text-night-text">0345678999</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard('0345678999', 'Số tài khoản')}
                                                    className="px-2.5 py-1 rounded-lg bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold hover:opacity-80 transition-opacity font-bold flex items-center gap-1"
                                                >
                                                    <i className="ph-bold ph-copy"></i>
                                                    <span>Chép</span>
                                                </button>
                                            </div>

                                            <div className="p-3 rounded-2xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] text-ink-muted dark:text-night-muted block">Chủ Tài Khoản</span>
                                                    <span className="font-bold text-ink dark:text-night-text uppercase">HALM BOOK CO LTD</span>
                                                </div>
                                                <i className="ph-bold ph-shield-check text-emerald-500 text-lg"></i>
                                            </div>

                                            <div className="p-3 rounded-2xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] text-ink-muted dark:text-night-muted block">Số Tiền Nạp</span>
                                                    <span className="font-bold text-base text-wine dark:text-gold">
                                                        {(selectedPkg?.priceVnd || 0).toLocaleString('vi-VN')} đ
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(String(selectedPkg?.priceVnd || 0), 'Số tiền')}
                                                    className="px-2.5 py-1 rounded-lg bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold hover:opacity-80 transition-opacity font-bold flex items-center gap-1"
                                                >
                                                    <i className="ph-bold ph-copy"></i>
                                                    <span>Chép</span>
                                                </button>
                                            </div>

                                            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">Nội Dung Chuyển Khoản (Bắt buộc đúng)</span>
                                                    <span className="font-mono font-black text-sm text-ink dark:text-night-text">
                                                        {`HALM C${String(customer?.customerId || customer?.customer_id || 7).replace(/^C/i, '').padStart(5, '0')} NAP`}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(`HALM C${String(customer?.customerId || customer?.customer_id || 7).replace(/^C/i, '').padStart(5, '0')} NAP`, 'Nội dung chuyển khoản')}
                                                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors font-bold flex items-center gap-1"
                                                >
                                                    <i className="ph-bold ph-copy"></i>
                                                    <span>Chép</span>
                                                </button>
                                            </div>

                                            <div className="p-3 rounded-2xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border flex items-start gap-2.5">
                                                <i className="ph-bold ph-shield-check text-wine dark:text-gold text-base mt-0.5 flex-shrink-0"></i>
                                                <div className="text-[11px] leading-relaxed text-ink-muted dark:text-night-muted">
                                                    <span className="font-bold text-ink dark:text-night-text block mb-0.5">Xác nhận 2 bước an toàn:</span>
                                                    Sau khi bạn nhấn <b className="text-wine dark:text-gold font-bold">"Tôi Đã Chuyển Khoản"</b>, yêu cầu sẽ được chuyển đến Admin tại màn hình Quản lý tài chính để đối soát sao kê ngân hàng và cộng Khoai vào ví.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-paper dark:bg-night-surface border-t border-paper-border dark:border-night-border flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="text-xs text-ink-muted dark:text-night-muted flex items-center gap-1.5">
                                    <i className="ph-bold ph-info text-wine dark:text-gold"></i>
                                    <span>Khoai nhận được: <b className="text-ink dark:text-night-text font-black">{((selectedPkg?.potatoAmount || 0) + (selectedPkg?.bonusPotato || 0)).toLocaleString()} 🥔</b></span>
                                </div>
                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => setIsRechargeModalOpen(false)}
                                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-border text-ink dark:text-night-text font-metadata-spec font-bold text-xs transition-colors"
                                    >
                                        Đóng
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmittingTopup}
                                        onClick={handleConfirmTopup}
                                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-wine to-wine-light hover:opacity-95 text-white font-metadata-spec font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isSubmittingTopup ? (
                                            <>
                                                <i className="ph-bold ph-spinner animate-spin text-base"></i>
                                                <span>Đang Gửi Yêu Cầu...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ph-bold ph-check-circle text-base"></i>
                                                <span>Tôi Đã Chuyển Khoản</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL TẶNG KHOAI CHO BẠN BÈ */}
                {isTransferModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
                        <div className="relative w-full max-w-md bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl shadow-2xl overflow-hidden my-6">
                            {/* Modal Header */}
                            <div className="px-6 py-4 bg-paper dark:bg-night-surface border-b border-paper-border dark:border-night-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-xl shadow-md">
                                        <i className="ph-bold ph-paper-plane-tilt"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text">Tặng Khoai Bạn Đọc</h3>
                                        <p className="text-xs text-ink-muted dark:text-night-muted">Gửi tặng khoai đọc sách tới bạn bè trong cộng đồng HALM</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsTransferModalOpen(false)}
                                    className="w-8 h-8 rounded-full bg-paper-border/50 dark:bg-night-border text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text flex items-center justify-center transition-colors"
                                >
                                    <i className="ph-bold ph-x text-base"></i>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
                                {/* Số Dư Khả Dụng */}
                                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🥔</span>
                                        <span className="text-xs font-metadata-spec text-amber-900 dark:text-amber-300 font-bold">Số Dư Hiện Tại Của Bạn:</span>
                                    </div>
                                    <span className="text-sm font-black text-amber-700 dark:text-amber-400">
                                        {(customer?.potatoBalance ?? 0).toLocaleString()} Khoai
                                    </span>
                                </div>

                                {/* Người Nhận */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-metadata-spec font-bold text-ink dark:text-night-text block">
                                        Mã Bạn Đọc hoặc Email Người Nhận <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: C00008 hoặc ban@email.com"
                                        value={transferForm.receiver}
                                        onChange={(e) => setTransferForm({ ...transferForm, receiver: e.target.value })}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-night-border bg-paper dark:bg-night-surface text-ink dark:text-night-text text-xs font-metadata-spec focus:outline-none focus:border-wine dark:focus:border-gold transition-colors"
                                    />
                                </div>

                                {/* Số Khoai Muốn Tặng */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-metadata-spec font-bold text-ink dark:text-night-text block">
                                        Số Khoai Muốn Tặng <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max={customer?.potatoBalance ?? 0}
                                            value={transferForm.amount}
                                            onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                                            required
                                            className="w-full px-3.5 py-2.5 pr-14 rounded-xl border border-paper-border dark:border-night-border bg-paper dark:bg-night-surface text-ink dark:text-night-text text-xs font-metadata-spec focus:outline-none focus:border-wine dark:focus:border-gold transition-colors font-bold"
                                        />
                                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted dark:text-night-muted">
                                            Khoai 🥔
                                        </span>
                                    </div>

                                    {/* Quick chips */}
                                    <div className="flex items-center gap-1.5 pt-1">
                                        {[10, 20, 50, 100].map((amt) => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setTransferForm({ ...transferForm, amount: amt })}
                                                className="px-2.5 py-1 rounded-lg bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-[11px] font-bold text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text hover:border-wine transition-colors"
                                            >
                                                +{amt}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setTransferForm({ ...transferForm, amount: customer?.potatoBalance ?? 0 })}
                                            className="px-2.5 py-1 rounded-lg bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold text-[11px] font-bold hover:opacity-80 transition-opacity"
                                        >
                                            Tối Đa
                                        </button>
                                    </div>
                                </div>

                                {/* Lời Nhắn */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-metadata-spec font-bold text-ink dark:text-night-text block">
                                        Lời Nhắn Gửi Tặng
                                    </label>
                                    <textarea
                                        rows="2"
                                        placeholder="Chúc bạn đọc sách vui vẻ!"
                                        value={transferForm.note}
                                        onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-night-border bg-paper dark:bg-night-surface text-ink dark:text-night-text text-xs font-metadata-spec focus:outline-none focus:border-wine dark:focus:border-gold transition-colors resize-none"
                                    ></textarea>
                                </div>

                                {/* Modal Actions */}
                                <div className="pt-2 flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsTransferModalOpen(false)}
                                        className="px-4 py-2.5 rounded-xl border border-paper-border dark:border-night-border hover:bg-paper dark:hover:bg-night-surface text-ink dark:text-night-text font-metadata-spec font-bold text-xs transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingTransfer || !transferForm.receiver || Number(transferForm.amount) <= 0 || Number(transferForm.amount) > (customer?.potatoBalance ?? 0)}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-wine to-wine-light hover:opacity-95 text-white font-metadata-spec font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isSubmittingTransfer ? (
                                            <>
                                                <i className="ph-bold ph-spinner animate-spin text-base"></i>
                                                <span>Đang Xử Lý...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ph-bold ph-paper-plane-tilt text-base"></i>
                                                <span>Xác Nhận Tặng</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL ĐỔI MẬT KHẨU (2 BƯỚC + MẮT HIỂN THỊ MẬT KHẨU) */}
                {isPasswordModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
                        <div className="relative w-full max-w-md bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl shadow-2xl overflow-hidden my-6">
                            {/* Modal Header */}
                            <div className="px-6 py-5 bg-gradient-to-r from-paper to-paper-100 dark:from-night-surface dark:to-night-card border-b border-paper-border dark:border-night-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-xl shrink-0">
                                        <i className="ph-bold ph-lock-key"></i>
                                    </span>
                                    <div>
                                        <h3 className="font-display font-black text-base text-ink dark:text-night-text">
                                            Đổi Mật Khẩu
                                        </h3>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold text-[10px] font-bold font-metadata-spec">
                                            {passwordStep === 1 ? 'Bước 1/2: Nhập Mật Khẩu Hiện Tại' : 'Bước 2/2: Thiết Lập Mật Khẩu Mới'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={closePasswordModal}
                                    className="w-8 h-8 rounded-full bg-paper-border/50 dark:bg-night-border text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text flex items-center justify-center transition-colors cursor-pointer"
                                    aria-label="Đóng popup"
                                >
                                    <i className="ph-bold ph-x text-base"></i>
                                </button>
                            </div>

                            {/* Step Progress Line */}
                            <div className="w-full bg-paper-border/30 dark:bg-night-border h-1 flex">
                                <div className={`h-full transition-all duration-300 ${passwordStep === 1 ? 'w-1/2 bg-wine dark:bg-gold' : 'w-full bg-emerald-500'}`}></div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                {passwordError && (
                                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-metadata-spec font-bold flex items-center gap-2">
                                        <i className="ph-bold ph-warning-circle text-base shrink-0"></i>
                                        <span>{passwordError}</span>
                                    </div>
                                )}

                                {passwordStep === 1 ? (
                                    /* BƯỚC 1: NHẬP MẬT KHẨU CŨ */
                                    <form onSubmit={handleNextPasswordStep} className="space-y-4">
                                        <p className="text-xs font-editorial-body text-ink-muted dark:text-night-muted leading-relaxed">
                                            Để bảo vệ an toàn cho tài khoản của bạn, vui lòng xác nhận mật khẩu hiện tại trước khi tạo mật khẩu mới.
                                        </p>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-metadata-spec font-bold text-ink dark:text-night-text block">
                                                Mật Khẩu Hiện Tại <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showOldPassword ? "text" : "password"}
                                                    placeholder="Nhập mật khẩu hiện tại của bạn"
                                                    value={passwordForm.oldPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                                    required
                                                    autoFocus
                                                    className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-paper-border dark:border-night-border bg-paper dark:bg-night-surface text-ink dark:text-night-text text-xs font-metadata-spec focus:outline-none focus:border-wine dark:focus:border-gold transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink dark:text-night-muted dark:hover:text-night-text p-1 text-base transition-colors cursor-pointer"
                                                    title={showOldPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                                    aria-label={showOldPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                                >
                                                    <i className={`ph-bold ${showOldPassword ? 'ph-eye-slash text-wine dark:text-gold' : 'ph-eye'}`}></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-paper-border dark:border-night-border">
                                            <button
                                                type="button"
                                                onClick={closePasswordModal}
                                                className="px-4 py-2.5 rounded-xl border border-paper-border dark:border-night-border hover:bg-paper dark:hover:bg-night-surface text-ink dark:text-night-text font-metadata-spec font-bold text-xs transition-colors cursor-pointer"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!passwordForm.oldPassword.trim()}
                                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-wine to-wine-light hover:opacity-95 text-white font-metadata-spec font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                                            >
                                                <span>Tiếp Tục</span>
                                                <i className="ph-bold ph-arrow-right text-xs"></i>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* BƯỚC 2: NHẬP MẬT KHẨU MỚI & XÁC NHẬN */
                                    <form onSubmit={handleSubmitChangePassword} className="space-y-4">
                                        <p className="text-xs font-editorial-body text-ink-muted dark:text-night-muted leading-relaxed">
                                            Vui lòng tạo mật khẩu mới an toàn (tối thiểu 6 ký tự) và nhập lại để xác nhận.
                                        </p>

                                        {/* Mật khẩu mới */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-metadata-spec font-bold text-ink dark:text-night-text block">
                                                Mật Khẩu Mới <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    placeholder="Tối thiểu 6 ký tự"
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                    required
                                                    autoFocus
                                                    className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-paper-border dark:border-night-border bg-paper dark:bg-night-surface text-ink dark:text-night-text text-xs font-metadata-spec focus:outline-none focus:border-wine dark:focus:border-gold transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink dark:text-night-muted dark:hover:text-night-text p-1 text-base transition-colors cursor-pointer"
                                                    title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                                    aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                                >
                                                    <i className={`ph-bold ${showNewPassword ? 'ph-eye-slash text-wine dark:text-gold' : 'ph-eye'}`}></i>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Xác nhận mật khẩu mới */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-metadata-spec font-bold text-ink dark:text-night-text block">
                                                Xác Nhận Mật Khẩu Mới <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Nhập lại mật khẩu mới"
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                    required
                                                    className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-paper-border dark:border-night-border bg-paper dark:bg-night-surface text-ink dark:text-night-text text-xs font-metadata-spec focus:outline-none focus:border-wine dark:focus:border-gold transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink dark:text-night-muted dark:hover:text-night-text p-1 text-base transition-colors cursor-pointer"
                                                    title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                                >
                                                    <i className={`ph-bold ${showConfirmPassword ? 'ph-eye-slash text-wine dark:text-gold' : 'ph-eye'}`}></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-3 flex items-center justify-between gap-2.5 border-t border-paper-border dark:border-night-border">
                                            <button
                                                type="button"
                                                onClick={() => { setPasswordStep(1); setPasswordError(''); }}
                                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-paper-border dark:border-night-border hover:bg-paper dark:hover:bg-night-surface text-ink dark:text-night-text font-metadata-spec font-bold text-xs transition-colors cursor-pointer"
                                            >
                                                <i className="ph-bold ph-arrow-left text-xs"></i>
                                                <span>Quay Lại</span>
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmittingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-wine to-wine-light hover:opacity-95 text-white font-metadata-spec font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                                            >
                                                {isSubmittingPassword ? (
                                                    <>
                                                        <i className="ph-bold ph-spinner animate-spin text-base"></i>
                                                        <span>Đang Đổi...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ph-bold ph-check-circle text-base"></i>
                                                        <span>Xác Nhận Đổi Mật Khẩu</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}







                <button id="btnScrollToTop" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={isScrollTopVisible ? 'show' : ''} title="Lên đầu trang" aria-label="Cuộn lên đầu trang">
                    <i className="ph-bold ph-arrow-up text-lg"></i>
                </button>



            </UserLayout>
        </>
    );
}
