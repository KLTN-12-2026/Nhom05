import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import * as customerService from '@/services/customerService';
import { getPotatoPackages, getPotatoTransactions, topupPotato, transferPotato } from '@/services/potatoService';
import { getCustomerBookshelf } from '@/services/orderService';
import StreakDiemDanh from './StreakDiemDanh';
import { isDarkMode, applyTheme } from '@/utils/theme';
import { getTierInfo } from '@/utils/tierUtils';

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

function getBotReply(userInput) {
    const query = userInput.toLowerCase();
    if (query.includes('hạng') || query.includes('thợ cày')) {
        return <>Hạng hiện tại của bạn là <strong>THỢ CÀY 🌱</strong>. Để nâng lên các hạng cao hơn như Học Giả hay Quý Tộc Sách, bạn có thể tham gia các gói hội viên tại <Link to="/hang" className="text-gold underline">Gói Hội Viên</Link>.</>;
    }
    if (query.includes('chỉnh sửa') || query.includes('thay đổi') || query.includes('số điện thoại')) {
        return <>Bạn có thể chỉnh sửa số điện thoại, địa chỉ và thông tin tại trang <Link to="/canhan" className="text-gold underline">Chỉnh Sửa Thông Tin</Link>.</>;
    }
    if (query.includes('khoai')) {
        return <>Số dư ví hiện tại của bạn là <strong>350 Khoai Tây</strong>. Bạn có thể dùng Khoai để đổi quà, thuê sách hoặc tham gia các gói cước tại mục <Link to="/trangchu#trending-section" className="text-gold underline">Ưu Đãi</Link>.</>;
    }
    return 'Tôi có thể hỗ trợ bạn cập nhật thông tin cá nhân, kiểm tra số dư Khoai hoặc hướng dẫn nâng hạng hội viên!';
}

const DEFAULT_PACKAGES = [
    { packageId: 1, packageName: 'Gói Trải Nghiệm', priceVnd: 50000, potatoAmount: 50, bonusPotato: 0, bonusRate: 0, isHot: false, tag: 'Cơ Bản' },
    { packageId: 2, packageName: 'Gói Tiêu Chuẩn', priceVnd: 200000, potatoAmount: 200, bonusPotato: 20, bonusRate: 10, isHot: true, tag: 'Đề Xuất 🔥' },
    { packageId: 3, packageName: 'Gói Thân Thiết', priceVnd: 500000, potatoAmount: 500, bonusPotato: 75, bonusRate: 15, isHot: false, tag: '+15% Thưởng' },
    { packageId: 4, packageName: 'Gói Đặc Quyền VIP', priceVnd: 1000000, potatoAmount: 1000, bonusPotato: 250, bonusRate: 25, isHot: false, tag: '+25% Thưởng VIP' },
];



export default function Profile() {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const urlTab = searchParams.get('tab') || (location.hash === '#tab-history' ? 'history' : null);
    const [activeTab, setActiveTabState] = useState(() => urlTab || 'profile');
    const [isDark, setIsDark] = useState(() => isDarkMode());
    const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [stars, setStars] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [toast, setToast] = useState({ show: false, title: '', message: '' });

    // State phục vụ Ví Khoai Tây & Lịch Sử Giao Dịch
    const [packages, setPackages] = useState(DEFAULT_PACKAGES);
    const [transactions, setTransactions] = useState([]);
    const [rentedCount, setRentedCount] = useState(0);
    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('vietqr');
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferForm, setTransferForm] = useState({ receiver: '', amount: 10, note: '' });
    const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
    const [historyFilter, setHistoryFilter] = useState('all');
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
    const [customer, setCustomer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
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
            if (Array.isArray(txs)) {
                setTransactions(txs);
            }
            if (Array.isArray(books)) {
                const active = books.filter(b => !b.expired && (b.remainingDays > 0 || b.remainingDays > 1000) && b.status === 'ACTIVE');
                setRentedCount(active.length);
            }
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu ví / sách:", err);
        }
    };

    const fetchCustomerData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const data = await customerService.getCurrentCustomer();
            if (data) {
                setCustomer(data);
                setProfileData({
                    customerName: data.customerName || '',
                    phoneNumber: data.phoneNumber || '',
                    birthday: formatDateForInput(data.birthday),
                    gender: data.gender === false ? 'Nữ' : 'Nam',
                    email: data.email || '',
                    address: data.address || '',
                });
            } else if (!silent) {
                console.error("Không tìm thấy dữ liệu khách hàng !");
                navigate('/dangnhap');
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin khách hàng:', error);
            if (!silent) {
                setCustomer(null);
                navigate('/dangnhap');
            }
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchCustomerData();
    }, [navigate]);

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
        if (urlTab && urlTab !== activeTab) {
            setActiveTabState(urlTab);
        }
    }, [urlTab]);

    const handleSelectTab = (tab) => {
        setActiveTabState(tab);
        setSearchParams({ tab });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        applyTheme(isDark);
    }, [isDark]);

    useEffect(() => {
        loadWalletAndBookshelf();
        const handlePotatoUpdated = (e) => {
            const bal = e.detail?.potatoBalance;
            if (bal !== undefined) {
                setCustomer(prev => prev ? { ...prev, potatoBalance: bal } : prev);
            }
            loadWalletAndBookshelf();
        };
        const handleBookshelfUpdated = () => {
            loadWalletAndBookshelf();
        };
        window.addEventListener('halm-potato-updated', handlePotatoUpdated);
        window.addEventListener('halm-bookshelf-updated', handleBookshelfUpdated);
        return () => {
            window.removeEventListener('halm-potato-updated', handlePotatoUpdated);
            window.removeEventListener('halm-bookshelf-updated', handleBookshelfUpdated);
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
            const res = await topupPotato({
                packageId: selectedPkg.packageId,
                amountMoney: selectedPkg.priceVnd,
                note: `Nạp gói ${selectedPkg.packageName || selectedPkg.tag}`
            });
            if (res.wallet && res.wallet.potatoBalance !== undefined) {
                setCustomer(prev => prev ? { ...prev, potatoBalance: res.wallet.potatoBalance } : prev);
            }
            if (res.transaction) {
                setTransactions(prev => [res.transaction, ...prev]);
            }
            setIsRechargeModalOpen(false);
            const totalReceived = (selectedPkg.potatoAmount || 0) + (selectedPkg.bonusPotato || 0);
            showToast("Nạp Khoai Thành Công!", `Đã nạp thành công +${totalReceived.toLocaleString()} Khoai vào ví của bạn.`);
            window.dispatchEvent(new CustomEvent('halm-potato-updated', {
                detail: { potatoBalance: res.wallet?.potatoBalance }
            }));
        } catch (error) {
            console.error("Lỗi nạp khoai:", error);
            showToast("Nạp Khoai Thất Bại", error?.response?.data?.message || error?.message || "Không thể xử lý giao dịch.");
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
        const updateScrollState = () => {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            setIsScrollTopVisible(scrollY > 250);
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

        [class~="bg-paper"] { background-color: #F7F4EE; }
        [class~="bg-paper-surface"] { background-color: #FFFEFA; }
        [class~="bg-paper-200"] { background-color: #EAE5D9; }
        [class~="bg-paper-200/70"] { background-color: rgb(234 229 217 / 0.7); }
        [class~="bg-wine"] { background-color: #8E3038; }
        [class~="bg-wine/10"] { background-color: rgb(142 48 56 / 0.1); }
        [class~="bg-wine/20"] { background-color: rgb(142 48 56 / 0.2); }
        [class~="bg-gold"] { background-color: #B8860B; }
        [class~="bg-gold/15"] { background-color: rgb(184 134 11 / 0.15); }
        [class~="bg-night-card"] { background-color: #20221E; }
        [class~="bg-night-border"] { background-color: #2C2E29; }

        [class~="text-ink"] { color: #1E1F1D; }
        [class~="text-ink/80"] { color: rgb(30 31 29 / 0.8); }
        [class~="text-ink-muted"] { color: #66645E; }
        [class~="text-ink-muted/60"] { color: rgb(102 100 94 / 0.6); }
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
                        <aside className="w-full lg:w-80 shrink-0 space-y-5 lg:sticky lg:top-24 lg:self-start">

                            {/* 1. Profile Avatar Card */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-wine/10 dark:bg-gold/10 rounded-full blur-2xl pointer-events-none"></div>

                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-wine to-wine-light dark:from-gold dark:to-gold-light p-1 shadow-md mb-3.5 relative">
                                    <div className="w-full h-full rounded-full bg-paper-surface dark:bg-night-surface flex items-center justify-center font-display font-black text-2xl text-wine dark:text-gold overflow-hidden">
                                        {customer?.avatar || customer?.avatarUrl ? (
                                            <img src={customer.avatar || customer.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.png'; }} />
                                        ) : (
                                            customer?.customerName ? customer.customerName.trim().charAt(0).toUpperCase() : 'U'
                                        )}
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-night-card flex items-center justify-center text-[10px] text-white" title="Trực tuyến">
                                        <i className="ph-bold ph-check text-[9px]"></i>
                                    </span>
                                </div>

                                <h2 className="font-display font-black text-lg text-ink dark:text-night-text leading-tight">
                                    {customer?.customerName || 'Độc giả'}
                                </h2>
                                <p className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted mt-0.5">
                                    {customer?.customerId ? `id#C${String(customer.customerId).padStart(5, '0')}` : (customer?.customer_id ? `id#C${String(customer.customer_id).padStart(5, '0')}` : (customer?.email || 'id#C00007'))}
                                </p>

                                <Link to="/hang" className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-xs font-metadata-spec font-bold hover:scale-105 transition-transform" title="Xem cấp bậc hội viên">
                                    <i className={`ph-bold ${getTierInfo(customer?.membershipTier).icon} text-emerald-600 dark:text-emerald-400`}></i>
                                    <span>{getTierInfo(customer?.membershipTier).name}</span>
                                </Link>

                                <div className="grid grid-cols-2 gap-2 w-full pt-4 mt-4 border-t border-paper-border dark:border-night-border text-center">
                                    <button type="button" onClick={() => handleSelectTab('wallet')} className="p-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors">
                                        <span className="block font-metadata-spec text-base font-black text-ink dark:text-night-text">{(customer?.potatoBalance ?? 0).toLocaleString()}</span>
                                        <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted">Khoai Tích Lũy</span>
                                    </button>
                                    <Link to="/tusachcn" className="p-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold transition-colors">
                                        <span className="block font-metadata-spec text-base font-black text-ink dark:text-night-text">{rentedCount}</span>
                                        <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted">Sách Trong Tủ</span>
                                    </Link>
                                </div>
                            </div>

                            {/* 2. Navigation Menu Card - STRICT ORDER (1: Profile, 2: Bookshelf, 3: Tiers, 4: Missions, 5: Wallet, 6: History, Divider, 7: Logout) */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-3 shadow-sm space-y-1">
                                {/* 1. Thông Tin Cá Nhân */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectTab('profile')}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold transition-all ${activeTab === 'profile'
                                        ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                        : 'text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text'
                                        }`}
                                >
                                    <i className="ph-bold ph-user text-base"></i>
                                    <span>Thông Tin Cá Nhân</span>
                                </button>

                                {/* 2. Tủ Sách Cá Nhân */}
                                <Link
                                    to="/tusachcn"
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-book-bookmark text-base"></i>
                                        <span>Tủ Sách Cá Nhân</span>
                                    </div>
                                    <span className="potato-badge text-[11px] py-0 px-2">{rentedCount} cuốn</span>
                                </Link>

                                {/* 3. Hạng Thành Viên */}
                                <Link
                                    to="/hang"
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-trophy text-base"></i>
                                        <span>Hạng Thành Viên</span>
                                    </div>
                                    <span className="potato-badge text-[11px] py-0.5 px-2 inline-flex items-center gap-1.5 whitespace-nowrap font-bold">
                                        <i className={`ph-bold ${getTierInfo(customer?.membershipTier).icon} text-[12px] text-amber-600 dark:text-amber-400 shrink-0`}></i>
                                        <span>{getTierInfo(customer?.membershipTier).name}</span>
                                    </span>
                                </Link>

                                {/* 3.5. Nhiệm Vụ Hằng Ngày */}
                                <Link
                                    to="/nhiemvu"
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-target text-base text-amber-500"></i>
                                        <span>Nhiệm Vụ Hằng Ngày</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">Streak 🔥</span>
                                </Link>

                                {/* 4. Ví Khoai Tây */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectTab('wallet')}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold transition-all ${activeTab === 'wallet'
                                        ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                        : 'text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-wallet text-base"></i>
                                        <span>Ví Khoai Tây</span>
                                    </div>
                                    <span className={`potato-badge text-[11px] py-0 px-2 ${activeTab === 'wallet' ? 'bg-white/20 text-white border-white/30' : ''}`}>{(customer?.potatoBalance ?? 0).toLocaleString()} 🥔</span>
                                </button>

                                {/* 5. Lịch Sử Giao Dịch */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectTab('history')}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold transition-all ${activeTab === 'history'
                                        ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                        : 'text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text'
                                        }`}
                                >
                                    <i className="ph-bold ph-clock-counter-clockwise text-base"></i>
                                    <span>Lịch Sử Giao Dịch</span>
                                </button>

                                {/* Divider Line */}
                                <div className="pt-2 border-t border-paper-border dark:border-night-border mt-2">
                                    {/* 6. Đăng Xuất */}
                                    <Link
                                        to="/dangnhap"
                                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                    >
                                        <i className="ph-bold ph-sign-out text-base"></i>
                                        <span>Đăng Xuất</span>
                                    </Link>
                                </div>
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
                                                <Link to="/trangchu" className="hover:underline">Trang chủ</Link>
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
                                                <Link to="/trangchu" className="hover:underline">Trang chủ</Link>
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

                                    {/* 1. Giao diện Streak Điểm Danh 7 Ngày */}
                                    <div className="mb-2">
                                        <StreakDiemDanh onShowToast={showToast} onCheckinSuccess={fetchCustomerData} />
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
                                                <Link to="/trangchu" className="hover:underline">Trang chủ</Link>
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
                                    <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
                                            <div className="flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-lg bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg">
                                                    <i className="ph-bold ph-receipt"></i>
                                                </span>
                                                <div>
                                                    <h3 className="font-display font-bold text-sm text-ink dark:text-night-text">Danh Sách Biến Động Số Dư</h3>
                                                    <p className="text-[11px] text-ink-muted dark:text-night-muted">Tất cả giao dịch nạp, thuê sách, gia hạn và thưởng điểm.</p>
                                                </div>
                                            </div>

                                            {/* Filters */}
                                            <div className="flex items-center gap-1.5 text-xs font-metadata-spec font-bold">
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
                                                            onClick={() => setHistoryFilter(f)}
                                                            className={`px-3 py-1 rounded-xl transition-colors ${historyFilter === f
                                                                ? 'bg-wine text-white dark:bg-gold dark:text-night-bg'
                                                                : 'bg-paper-200 dark:bg-night-surface text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text'
                                                                }`}
                                                        >
                                                            {labels[f]}
                                                        </button>
                                                    );
                                                })}
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
                                                    {(transactions && transactions.length > 0 ? (
                                                        transactions.filter(tx => {
                                                            if (historyFilter === 'all') return true;
                                                            const type = (tx.type || '').toUpperCase();
                                                            if (historyFilter === 'topup') return type.includes('TOPUP') || type.includes('NAP');
                                                            if (historyFilter === 'rent') return type.includes('RENT') || type.includes('THUE');
                                                            if (historyFilter === 'reward') return type.includes('REWARD') || type.includes('THUONG') || type.includes('TRANSFER') || type.includes('TANG');
                                                            return true;
                                                        }).map((tx, idx) => {
                                                            const isMinus = (tx.amount < 0) || (tx.type && (tx.type.includes('RENT') || tx.type.includes('THUE')));
                                                            const displayAmount = Math.abs(tx.amount || 0);
                                                            return (
                                                                <tr key={tx.transactionId || tx.id || idx} className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                                    <td className="py-3.5 px-3 font-mono font-bold text-ink-muted dark:text-night-muted">{tx.code || tx.transactionCode || `GD-${tx.transactionId || tx.id || idx + 100}`}</td>
                                                                    <td className="py-3.5 px-3">
                                                                        <span className="font-bold text-ink dark:text-night-text block">{tx.note || tx.description || tx.title || 'Giao dịch ví'}</span>
                                                                        <span className="text-[10px] text-ink-muted dark:text-night-muted uppercase tracking-wider">{tx.type || 'GIAO DỊCH'}</span>
                                                                    </td>
                                                                    <td className="py-3.5 px-3 text-ink-muted dark:text-night-muted">{tx.createdAt ? tx.createdAt.replace('T', ' ').substring(0, 16) : 'Gần đây'}</td>
                                                                    <td className={`py-3.5 px-3 text-right font-black ${isMinus ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                                        {isMinus ? `-${displayAmount}` : `+${displayAmount}`} Khoai 🥔
                                                                    </td>
                                                                    <td className="py-3.5 px-3 text-center">
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold">
                                                                            <i className="ph-bold ph-check-circle"></i> {tx.status || 'Thành công'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        [
                                                            { code: 'GD984321', note: 'Thuê sách: Atomic Habits (7 ngày)', type: 'THUÊ SÁCH', time: 'Hôm nay 14:32', amount: -9, status: 'Thành công' },
                                                            { code: 'GD984210', note: 'Điểm danh hằng ngày', type: 'THƯỞNG HẰNG NGÀY', time: 'Hôm nay 08:15', amount: 5, status: 'Thành công' },
                                                            { code: 'GD982109', note: 'Nạp khoai: Gói Mọt Sách (+200 thưởng)', type: 'NẠP KHOAI', time: 'Hôm qua 19:40', amount: 1200, status: 'Thành công' },
                                                            { code: 'GD979924', note: 'Thuê sách: Điện Biên Phủ 56 Ngày Đêm', type: 'THUÊ SÁCH', time: '15/10/2026', amount: -9, status: 'Thành công' },
                                                            { code: 'GD910022', note: 'Thưởng thăng hạng: Thợ Cày 🌱', type: 'THƯỞNG VIP', time: '15/01/2026', amount: 50, status: 'Thành công' },
                                                        ].map((tx, idx) => (
                                                            <tr key={idx} className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                                <td className="py-3.5 px-3 font-mono font-bold text-ink-muted dark:text-night-muted">{tx.code}</td>
                                                                <td className="py-3.5 px-3">
                                                                    <span className="font-bold text-ink dark:text-night-text block">{tx.note}</span>
                                                                    <span className="text-[10px] text-ink-muted dark:text-night-muted">{tx.type}</span>
                                                                </td>
                                                                <td className="py-3.5 px-3 text-ink-muted dark:text-night-muted">{tx.time}</td>
                                                                <td className={`py-3.5 px-3 text-right font-black ${tx.amount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Khoai 🥔
                                                                </td>
                                                                <td className="py-3.5 px-3 text-center">
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold">
                                                                        <i className="ph-bold ph-check-circle"></i> {tx.status}
                                                                    </span>
                                                                </td>
                            </tr>
                                                        ))
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
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
                                                <span>Đang Kiểm Tra...</span>
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



                <div id="chatbot-container">

                    <div id="chat-window" className={`chat-window ${isChatOpen ? 'show' : ''}`}>

                        <div className="bg-gradient-to-r from-wine to-wine-light text-white px-5 py-3.5 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-white p-0.5 shrink-0">
                                    <img src="/logo.png" alt="Bot" className="w-full h-full rounded-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-display font-bold text-sm tracking-wide leading-tight">Trợ lý ảo HALM BOOK</div>
                                    <div className="font-metadata-spec text-[10px] text-gold font-medium">Hỗ trợ hồ sơ & tài khoản</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <button id="refresh-chat" onClick={resetChat} className="hover:text-gold transition-colors" title="Làm mới hội thoại" aria-label="Làm mới hội thoại">
                                    <i className="ph-bold ph-arrows-clockwise text-lg"></i>
                                </button>
                                <button id="close-chat" onClick={() => setIsChatOpen(false)} className="hover:text-gold transition-colors" title="Thu nhỏ" aria-label="Thu nhỏ cửa sổ chat">
                                    <i className="ph-bold ph-x text-lg"></i>
                                </button>
                            </div>
                        </div>


                        <div className="flex-grow overflow-y-auto p-4 flex flex-col relative text-night-text bg-[#181916] text-xs space-y-3" id="chat-body">

                            <div id="chat-welcome" className={`text-center py-5 space-y-3 ${messages.length ? 'hidden' : ''}`}>
                                <div className="w-12 h-12 mx-auto rounded-full bg-wine/20 border border-wine/40 p-1 flex items-center justify-center">
                                    <img src="/logo.png" alt="Bot" className="w-full h-full rounded-full object-cover" />
                                </div>
                                <h4 className="font-display font-black text-sm text-white">Xin chào Alex Nguyễn!</h4>
                                <p className="font-editorial-body text-xs text-night-muted leading-relaxed">
                                    Tôi là trợ lý AI của HALM BOOK. Bạn có thắc mắc gì về hồ sơ hoặc điểm thưởng Khoai không?
                                </p>


                                <div className="space-y-2 pt-1 text-left font-metadata-spec">
                                    <button onClick={() => sendMessage("Cách nâng hạng hội viên từ Thợ Cày 🌱?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                        <span>Cách nâng hạng hội viên từ Thợ Cày 🌱?</span>
                                        <i className="ph-bold ph-arrow-right text-gold"></i>
                                    </button>
                                    <button onClick={() => sendMessage("Làm sao để đổi thông tin số điện thoại?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                        <span>Làm sao để đổi thông tin số điện thoại?</span>
                                        <i className="ph-bold ph-arrow-right text-gold"></i>
                                    </button>
                                    <button onClick={() => sendMessage("Kiểm tra lịch sử chi tiêu Khoai?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                        <span>Kiểm tra lịch sử chi tiêu Khoai?</span>
                                        <i className="ph-bold ph-arrow-right text-gold"></i>
                                    </button>
                                </div>
                            </div>


                            <div id="chat-messages" ref={messagesEndRef} className={`flex-col gap-3 ${messages.length ? '' : 'hidden'}`}>
                                {messages.map((message) => (
                                    <div key={message.id} className={message.sender === 'user' ? 'self-end bg-wine text-white max-w-[80%] rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs font-metadata-spec' : 'self-start bg-night-card border border-night-border text-night-text max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs font-editorial-body'}>
                                        {message.content}
                                    </div>
                                ))}
                            </div>
                        </div>


                        <div className="p-3 bg-[#141512] border-t border-night-border shrink-0">
                            <div className="relative flex items-center">
                                <input type="text" id="chat-input" placeholder="Nhập câu hỏi của bạn..." value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') sendMessage(); }}
                                    className="w-full bg-night-card text-white placeholder-night-muted text-xs rounded-xl pl-3.5 pr-10 py-3 border border-night-border focus:outline-none focus:border-wine transition-colors font-metadata-spec" />
                                <button id="send-btn" onClick={() => sendMessage()} className="absolute right-2 text-gold hover:text-white p-1.5 transition-colors" aria-label="Gửi tin">
                                    <i className="ph-bold ph-paper-plane-tilt text-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>


                    <button id="chat-toggle-btn" onClick={() => setIsChatOpen((current) => !current)} className="w-14 h-14 rounded-full bg-wine hover:bg-wine-dark text-white p-1 shadow-2xl flex items-center justify-center transition-transform hover:scale-105" aria-label="Mở trợ lý ảo AI">
                        <img src="/logo.png" alt="Chatbot" className="w-full h-full rounded-full object-cover" />
                    </button>
                </div>
            </UserLayout>
        </>
    );
}
