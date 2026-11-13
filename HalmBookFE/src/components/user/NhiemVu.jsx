import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import StreakDiemDanh from './StreakDiemDanh';
import { getCurrentCustomer } from '@/services/customerService';
import { getCustomerBookshelf } from '@/services/orderService';
import { checkinDailyStreak, getMyTierSummary } from '@/services/tierService';
import { isDarkMode, applyTheme } from '@/utils/theme';
import { getTierInfo, formatCustomerId, getTierAvatarFrame, getTierBadgeClass, getTierLevel } from '@/utils/tierUtils';
import AvatarWithFrame from '@/components/common/AvatarWithFrame';
import { getClaimedMissions, claimMissionReward } from '@/services/userFeatureService';
import { clearAuthSession } from '@/services/authToken';

const halmTailwindConfig = {
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

const ASSETS = {
    fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap',
    bold: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css',
    regular: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css',
    fill: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css',
    duotone: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css',
    tailwind: 'https://cdn.tailwindcss.com'
};



export default function NhiemVu() {
    const [customer, setCustomer] = useState(null);
    const [bookshelfCount, setBookshelfCount] = useState(0);
    const [isDark, setIsDark] = useState(() => isDarkMode());
    const [activeTab, setActiveTab] = useState('daily');
    const [toast, setToast] = useState({ title: '', message: '' });
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimer = useRef(null);

    const showToast = (title, message) => {
        setToast({ title, message });
        setToastVisible(true);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastVisible(false), 3500);
    };

    const fetchCustomer = async () => {
        try {
            const data = await getCurrentCustomer();
            if (data) {
                setCustomer(data);
            }
        } catch (e) {
            console.error("Lỗi khi tải thông tin tài khoản:", e);
        }
    };

    const fetchBookshelfCount = async () => {
        try {
            const list = await getCustomerBookshelf();
            if (Array.isArray(list)) {
                setBookshelfCount(list.length);
            }
        } catch (e) {
            // silent fallback
        }
    };

    // Đảm bảo Font, Icon & Tailwind CDN luôn được nạp đầy đủ khi reload trực tiếp màn hình
    useEffect(() => {
        if (!document.querySelector('link[data-halm-fonts]')) {
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = ASSETS.fonts;
            l.dataset.halmFonts = 'true';
            document.head.appendChild(l);
        }
        Object.entries({ bold: ASSETS.bold, regular: ASSETS.regular, fill: ASSETS.fill, duotone: ASSETS.duotone }).forEach(([k, href]) => {
            if (document.querySelector(`link[data-halm-icons="${k}"]`)) return;
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = href;
            l.dataset.halmIcons = k;
            document.head.appendChild(l);
        });
        window.tailwind = window.tailwind || {};
        window.tailwind.config = halmTailwindConfig;
        if (!document.querySelector('script[src*="cdn.tailwindcss.com"]')) {
            const s = document.createElement('script');
            s.src = ASSETS.tailwind;
            s.async = true;
            document.head.appendChild(s);
        }
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "HALM BOOK — Nhiệm Vụ Hằng Ngày & Điểm Danh Độc Giả";
        fetchCustomer();
        fetchBookshelfCount();

        const handlePotatoUpdated = (e) => {
            const newBal = e.detail?.potatoBalance;
            if (newBal !== undefined) {
                setCustomer(prev => prev ? { ...prev, potatoBalance: newBal } : prev);
            }
        };

        const handleGlobalThemeChange = (e) => {
            if (typeof e.detail?.isDark === 'boolean') {
                setIsDark(e.detail.isDark);
            }
        };

        window.addEventListener('halm-potato-updated', handlePotatoUpdated);
        window.addEventListener('halm-theme-change', handleGlobalThemeChange);

        return () => {
            window.removeEventListener('halm-potato-updated', handlePotatoUpdated);
            window.removeEventListener('halm-theme-change', handleGlobalThemeChange);
        };
    }, []);

    const userTierLevel = getTierLevel(customer?.membershipTier);
    const avatarFrame = getTierAvatarFrame(userTierLevel);
    const tierBadgeClass = getTierBadgeClass(userTierLevel);
    const tierInfo = getTierInfo(customer?.membershipTier);
    const potatoBalance = customer?.potatoBalance ?? 0;
    const streakDays = customer?.streakDays ?? 0;
    const customerName = customer?.customerName || customer?.name || 'Bạn đọc HALM';
    const customerInitial = customerName.charAt(0).toUpperCase();
    const avatarSrc = customer?.avatar || customer?.avatarUrl;
    const customerIdDisplay = formatCustomerId(customer?.customerId || customer?.customer_id);

    const navigate = useNavigate();
    const todayKey = new Date().toISOString().slice(0, 10);

    const getInitialDailyTasks = () => {
        try {
            return {
                checkin: localStorage.getItem(`halm_daily_action_checkin_${todayKey}`) === 'true',
                read: localStorage.getItem(`halm_daily_action_read_${todayKey}`) === 'true',
                chat: localStorage.getItem(`halm_daily_action_chat_${todayKey}`) === 'true',
                search: localStorage.getItem(`halm_daily_action_search_${todayKey}`) === 'true',
                offers: localStorage.getItem(`halm_daily_action_offers_${todayKey}`) === 'true',
                bookshelf: localStorage.getItem(`halm_daily_action_bookshelf_${todayKey}`) === 'true'
            };
        } catch {
            return { checkin: false, read: false, chat: false, search: false, offers: false, bookshelf: false };
        }
    };

    const [dailyTasks, setDailyTasks] = useState(getInitialDailyTasks);

    useEffect(() => {
        const handleTaskCompleted = (e) => {
            const task = e.detail?.task;
            if (task) {
                setDailyTasks(prev => ({ ...prev, [task]: true }));
            } else {
                setDailyTasks(getInitialDailyTasks());
            }
        };

        const checkStreakOnMount = async () => {
            try {
                const summary = await getMyTierSummary();
                if (summary?.hasCheckedInToday) {
                    try {
                        localStorage.setItem(`halm_daily_action_checkin_${todayKey}`, 'true');
                    } catch {}
                    setDailyTasks(prev => ({ ...prev, checkin: true }));
                }
            } catch (err) {
                // ignore
            }
        };
        checkStreakOnMount();

        window.addEventListener('halm-daily-task-completed', handleTaskCompleted);
        return () => window.removeEventListener('halm-daily-task-completed', handleTaskCompleted);
    }, [todayKey]);

    const markTaskDone = (key) => {
        try {
            localStorage.setItem(`halm_daily_action_${key}_${todayKey}`, 'true');
        } catch {}
        setDailyTasks(prev => ({ ...prev, [key]: true }));
        window.dispatchEvent(new CustomEvent('halm-daily-task-completed', { detail: { task: key } }));
    };

    const handleExecuteMission = async (m) => {
        if (m.taskKey === 'checkin') {
            try {
                const res = await checkinDailyStreak();
                markTaskDone('checkin');
                if (res && res.success) {
                    setCustomer(prev => prev ? {
                        ...prev,
                        streakDays: res.streakDays || ((prev.streakDays || 0) + 1),
                        potatoBalance: res.potatoBalance || prev.potatoBalance
                    } : prev);
                    showToast("Điểm Danh Thành Công!", res.message || "Bạn đã điểm danh thắp lửa hôm nay! Hãy nhận thưởng nhé 🔥");
                } else {
                    showToast("Điểm Danh Hằng Ngày", res?.message || "Đã ghi nhận điểm danh hôm nay! Nhận thưởng nhé 🔥");
                }
            } catch (err) {
                markTaskDone('checkin');
                showToast("Điểm Danh Hằng Ngày", "Đã ghi nhận điểm danh thành công! Nhận thưởng nhé 🔥");
            }
        } else if (m.taskKey === 'chat') {
            markTaskDone('chat');
            window.dispatchEvent(new CustomEvent('halm-open-chatbot', {
                detail: "Chào Khoai Nhỏ! Giới thiệu sách hay cho tôi nhé 🥔"
            }));
            showToast("Trợ Lý AI Đã Sẵn Sàng", "Đã kết nối cùng AI Khoai Nhỏ! Bạn có thể nhận thưởng ngay.");
        } else if (m.taskKey === 'search') {
            markTaskDone('search');
            showToast("Đã Ghi Nhận Tìm Kiếm!", "Đã ghi nhận nhiệm vụ tìm kiếm. Nhận thưởng ngay!");
            const input = document.getElementById('header-search-input');
            if (input) {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth' });
            } else {
                navigate('/');
            }
        } else if (m.taskKey === 'read') {
            markTaskDone('read');
            showToast("Đã Ghi Nhận Đọc Sách!", "Đã ghi nhận nhiệm vụ đọc sách. Nhận thưởng ngay!");
            navigate('/tusachcn');
        } else if (m.taskKey === 'offers') {
            markTaskDone('offers');
            showToast("Đã Ghi Nhận Khám Phá!", "Đã ghi nhận khám phá ưu đãi. Nhận thưởng ngay!");
            navigate('/uudai');
        } else if (m.taskKey === 'bookshelf') {
            markTaskDone('bookshelf');
            showToast("Đã Ghi Nhận Tủ Sách!", "Đã ghi nhận kiểm tra tủ sách. Nhận thưởng ngay!");
            navigate('/tusachcn');
        }
    };

    const [claimedMissions, setClaimedMissions] = useState(() => {
        try {
            const saved = localStorage.getItem(`halm_claimed_missions_${todayKey}`);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const [claimedMilestones, setClaimedMilestones] = useState(() => {
        try {
            const saved = localStorage.getItem('halm_claimed_milestones');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Đồng bộ các nhiệm vụ đã nhận thưởng từ Database
    useEffect(() => {
        getClaimedMissions().then(data => {
            if (data) {
                if (Array.isArray(data.dailyClaimed)) {
                    const dailyMap = {};
                    data.dailyClaimed.forEach(id => { dailyMap[id] = true; });
                    setClaimedMissions(prev => ({ ...prev, ...dailyMap }));
                }
                if (Array.isArray(data.milestoneClaimed)) {
                    const msMap = {};
                    data.milestoneClaimed.forEach(id => { msMap[id] = true; });
                    setClaimedMilestones(prev => ({ ...prev, ...msMap }));
                }
                if (data.potatoBalance !== undefined) {
                    setCustomer(prev => prev ? { ...prev, potatoBalance: data.potatoBalance } : prev);
                }
            }
        }).catch(() => {});
    }, []);

    const handleClaimMission = async (mission) => {
        if (claimedMissions[mission.id]) return;
        try {
            const res = await claimMissionReward({
                missionId: mission.id,
                isMilestone: false,
                rewardPotato: mission.rewardPotato,
                rewardXp: mission.rewardXp
            });
            const newBalance = res.newBalance ?? (potatoBalance + mission.rewardPotato);
            setCustomer(prev => prev ? { ...prev, potatoBalance: newBalance } : prev);

            const updated = { ...claimedMissions, [mission.id]: true };
            setClaimedMissions(updated);
            try {
                localStorage.setItem(`halm_claimed_missions_${todayKey}`, JSON.stringify(updated));
            } catch {}

            window.dispatchEvent(new CustomEvent('halm-potato-updated', {
                detail: { potatoBalance: newBalance }
            }));

            showToast("Nhận Thưởng Thành Công!", `+${mission.rewardPotato} Khoai Tây đã được cộng vào tài khoản của bạn! 🎉`);
        } catch (err) {
            const msg = err.response?.data?.message || 'Không thể nhận thưởng lúc này!';
            showToast("Thông Báo", msg);
        }
    };

    const handleClaimMilestone = async (ms) => {
        if (claimedMilestones[ms.id]) return;
        try {
            const res = await claimMissionReward({
                missionId: ms.id,
                isMilestone: true,
                rewardPotato: ms.rewardPotato,
                rewardXp: ms.rewardXp
            });
            const newBalance = res.newBalance ?? (potatoBalance + ms.rewardPotato);
            setCustomer(prev => prev ? { ...prev, potatoBalance: newBalance } : prev);

            const updated = { ...claimedMilestones, [ms.id]: true };
            setClaimedMilestones(updated);
            try {
                localStorage.setItem('halm_claimed_milestones', JSON.stringify(updated));
            } catch {}

            window.dispatchEvent(new CustomEvent('halm-potato-updated', {
                detail: { potatoBalance: newBalance }
            }));

            showToast("Mở Khóa Thành Tựu!", `Chúc mừng bạn nhận +${ms.rewardPotato} Khoai Tây! 🏆`);
        } catch (err) {
            const msg = err.response?.data?.message || 'Không thể nhận thưởng lúc này!';
            showToast("Thông Báo", msg);
        }
    };

    const DAILY_MISSIONS = [
        {
            id: 'm1',
            taskKey: 'checkin',
            title: 'Điểm danh đọc sách hằng ngày',
            description: 'Thắp lửa chuỗi đọc sách mỗi ngày để rèn luyện thói quen tri thức bền bỉ.',
            rewardPotato: 5,
            rewardXp: 20,
            icon: 'ph-calendar-check',
            iconColor: 'text-amber-500 bg-amber-500/10',
            currentProgress: dailyTasks.checkin ? 1 : 0,
            maxProgress: 1,
            isCompleted: Boolean(claimedMissions['m1']),
            canClaim: Boolean(dailyTasks.checkin && !claimedMissions['m1']),
            actionLabel: 'Điểm Danh Ngay',
            actionIcon: 'ph-check-circle',
        },
        {
            id: 'm2',
            taskKey: 'read',
            title: 'Đọc sách hoặc khám phá chương mới',
            description: 'Mở đọc ít nhất 1 tác phẩm sách đọc hôm nay trong kho tàng HALM BOOK.',
            rewardPotato: 10,
            rewardXp: 30,
            icon: 'ph-book-open',
            iconColor: 'text-wine bg-wine/10 dark:text-gold dark:bg-gold/15',
            currentProgress: dailyTasks.read ? 1 : 0,
            maxProgress: 1,
            isCompleted: Boolean(claimedMissions['m2']),
            canClaim: Boolean(dailyTasks.read && !claimedMissions['m2']),
            actionLabel: 'Đọc Sách Ngay',
            actionIcon: 'ph-book-bookmark',
        },
        {
            id: 'm3',
            taskKey: 'chat',
            title: 'Đàm đạo cùng Trợ lý AI Khoai Nhỏ',
            description: 'Gửi ít nhất 1 câu hỏi hoặc trò chuyện cùng AI Khoai Nhỏ để gợi ý sách hay.',
            rewardPotato: 5,
            rewardXp: 20,
            icon: 'ph-sparkle',
            iconColor: 'text-blue-500 bg-blue-500/10',
            currentProgress: dailyTasks.chat ? 1 : 0,
            maxProgress: 1,
            isCompleted: Boolean(claimedMissions['m3']),
            canClaim: Boolean(dailyTasks.chat && !claimedMissions['m3']),
            actionLabel: 'Trò Chuyện AI',
            actionIcon: 'ph-chat-circle-dots',
        },
        {
            id: 'm4',
            taskKey: 'search',
            title: 'Tìm kiếm tác phẩm yêu thích',
            description: 'Tìm kiếm ít nhất 1 cuốn sách, chủ đề hoặc tác giả trên thanh tra cứu tác phẩm.',
            rewardPotato: 5,
            rewardXp: 20,
            icon: 'ph-magnifying-glass',
            iconColor: 'text-indigo-500 bg-indigo-500/10',
            currentProgress: dailyTasks.search ? 1 : 0,
            maxProgress: 1,
            isCompleted: Boolean(claimedMissions['m4']),
            canClaim: Boolean(dailyTasks.search && !claimedMissions['m4']),
            actionLabel: 'Tìm Kiếm Ngay',
            actionIcon: 'ph-magnifying-glass',
        },
        {
            id: 'm5',
            taskKey: 'offers',
            title: 'Khám phá kho Ưu Đãi & Gói Khoai',
            description: 'Khám phá các gói combo và chiết khấu đọc sách độc quyền dành cho bạn.',
            rewardPotato: 5,
            rewardXp: 20,
            icon: 'ph-gift',
            iconColor: 'text-emerald-600 bg-emerald-500/10',
            currentProgress: dailyTasks.offers ? 1 : 0,
            maxProgress: 1,
            isCompleted: Boolean(claimedMissions['m5']),
            canClaim: Boolean(dailyTasks.offers && !claimedMissions['m5']),
            actionLabel: 'Xem Ưu Đãi',
            actionIcon: 'ph-tag',
        },
        {
            id: 'm6',
            taskKey: 'bookshelf',
            title: 'Kiểm tra Tủ Sách Cá Nhân',
            description: 'Ghé thăm không gian tủ sách cá nhân để kiểm tra các tác phẩm của bạn.',
            rewardPotato: 5,
            rewardXp: 20,
            icon: 'ph-books',
            iconColor: 'text-purple-500 bg-purple-500/10',
            currentProgress: dailyTasks.bookshelf ? 1 : 0,
            maxProgress: 1,
            isCompleted: Boolean(claimedMissions['m6']),
            canClaim: Boolean(dailyTasks.bookshelf && !claimedMissions['m6']),
            actionLabel: 'Vào Tủ Sách',
            actionIcon: 'ph-caret-right',
        },
    ];

    const READER_MILESTONES = [
        {
            id: 'ms1',
            title: 'Thành tựu: Độc Giả Chăm Chỉ (Chuỗi 7 Ngày)',
            description: 'Hoàn thành chuỗi 7 ngày liên tiếp điểm danh đọc sách.',
            rewardPotato: 50,
            rewardXp: 150,
            currentProgress: Math.min(streakDays, 7),
            maxProgress: 7,
            icon: 'ph-fire',
            badge: 'Cột Mốc',
            isCompleted: Boolean(claimedMilestones['ms1']),
            canClaim: streakDays >= 7 && !claimedMilestones['ms1'],
        },
        {
            id: 'ms2',
            title: 'Thành tựu: Tủ Sách Khởi Đầu (3 Cuốn)',
            description: 'Sở hữu ít nhất 3 tác phẩm trong Tủ Sách Cá Nhân.',
            rewardPotato: 30,
            rewardXp: 100,
            currentProgress: Math.min(bookshelfCount, 3),
            maxProgress: 3,
            icon: 'ph-books',
            badge: 'Tủ Sách',
            isCompleted: Boolean(claimedMilestones['ms2']),
            canClaim: bookshelfCount >= 3 && !claimedMilestones['ms2'],
        },
        {
            id: 'ms3',
            title: 'Thành tựu: Nhà Tích Lũy Tri Thức (100 Khoai)',
            description: 'Tích lũy số dư đạt mốc 100 Khoai Tây trong ví.',
            rewardPotato: 40,
            rewardXp: 120,
            currentProgress: Math.min(potatoBalance, 100),
            maxProgress: 100,
            icon: 'ph-coins',
            badge: 'Tri Thức',
            isCompleted: Boolean(claimedMilestones['ms3']),
            canClaim: potatoBalance >= 100 && !claimedMilestones['ms3'],
        },
        {
            id: 'ms4',
            title: 'Thành tựu: Đại Sứ HALM BOOK (500 Khoai)',
            description: 'Tích lũy tổng cộng 500 Khoai Tây từ nhiệm vụ và nạp.',
            rewardPotato: 100,
            rewardXp: 300,
            currentProgress: Math.min(potatoBalance, 500),
            maxProgress: 500,
            icon: 'ph-crown',
            badge: 'Huy Hiệu Vàng',
            isCompleted: Boolean(claimedMilestones['ms4']),
            canClaim: potatoBalance >= 500 && !claimedMilestones['ms4'],
        },
    ];

    return (
        <>
            <style>{String.raw`
                :root {
                    --font-display: "Inter", sans-serif;
                    --font-ui: "Inter", sans-serif;
                    --font-metadata: "Roboto", sans-serif;
                    --font-editorial: "Open Sans", sans-serif;
                }
                .nhiem-vu-page {
                    font-family: var(--font-ui);
                    background-color: #F7F4EE;
                    color: #1E1F1D;
                    -webkit-font-smoothing: antialiased;
                }
                .dark .nhiem-vu-page {
                    background-color: #111210;
                    color: #EDE9DF;
                }
                .nhiem-vu-page [class~="bg-paper"] { background: #F7F4EE; }
                .nhiem-vu-page [class~="bg-paper-surface"] { background: #FFFEFA; }
                .nhiem-vu-page [class~="bg-paper-50"] { background: #FAF8F5; }
                .nhiem-vu-page [class~="bg-paper-100"] { background: #F5F2EB; }
                .nhiem-vu-page [class~="bg-paper-200"] { background: #EAE5D9; }
                .nhiem-vu-page [class~="bg-wine"] { background: #8E3038; }
                .nhiem-vu-page [class~="bg-gold"] { background: #B8860B; }
                .nhiem-vu-page [class~="bg-night-card"] { background: #20221E; }
                .nhiem-vu-page [class~="bg-night-surface"] { background: #181916; }
                .nhiem-vu-page [class~="text-ink"] { color: #1E1F1D; }
                .nhiem-vu-page [class~="text-ink-muted"] { color: #66645E; }
                .nhiem-vu-page [class~="text-wine"] { color: #8E3038; }
                .nhiem-vu-page [class~="text-gold"] { color: #B8860B; }
                .nhiem-vu-page [class~="border-paper-border"] { border-color: #E3DDD0; }
                .nhiem-vu-page [class~="border-night-border"] { border-color: #2C2E29; }
                .nhiem-vu-page [class~="potato-badge"] { background: rgb(184 134 11/.12); color: #B8860B; border: 1px solid rgb(184 134 11/.25); }

                html.dark .nhiem-vu-page [class~="dark:bg-night-card"] { background: #20221E; }
                html.dark .nhiem-vu-page [class~="dark:bg-night-surface"] { background: #181916; }
                html.dark .nhiem-vu-page [class~="dark:bg-gold"] { background: #B8860B; }
                html.dark .nhiem-vu-page [class~="dark:text-gold"] { color: #B8860B; }
                html.dark .nhiem-vu-page [class~="dark:text-night-text"] { color: #EDE9DF; }
                html.dark .nhiem-vu-page [class~="dark:text-night-muted"] { color: #96938B; }
                html.dark .nhiem-vu-page [class~="potato-badge"] { background: rgb(212 175 55/.15); color: #D4AF37; border-color: rgb(212 175 55/.3); }

                html.dark .nhiem-vu-page [class*="user-sidebar-card"],
                html.dark .nhiem-vu-page [class*="dark:bg-night-surface"],
                html.dark .nhiem-vu-page [class*="dark:bg-[#181916]"] {
                    background-color: #181916 !important;
                    border-color: #2C2E29 !important;
                }
                html.dark .nhiem-vu-page [class*="user-sidebar-box"] {
                    background-color: #181916 !important;
                    border-color: #2C2E29 !important;
                }
                html.dark .nhiem-vu-page [class*="user-sidebar-card"] h2,
                html.dark .nhiem-vu-page [class*="user-sidebar-card"] [class*="font-display"],
                html.dark .nhiem-vu-page [class*="user-sidebar-box"] span.text-2xl,
                html.dark .nhiem-vu-page [class*="user-sidebar-box"] span:first-child {
                    color: #EDE9DF !important;
                }
                html.dark .nhiem-vu-page [class*="user-sidebar-box"] span:last-child,
                html.dark .nhiem-vu-page [class*="user-sidebar-card"] p {
                    color: #9CA3AF !important;
                }
                html.dark .nhiem-vu-page [class*="dark:border-night-border"],
                html.dark .nhiem-vu-page [class*="dark:border-[#2C2E29]"] {
                    border-color: #2C2E29 !important;
                }
                html.dark .nhiem-vu-page [class*="dark:bg-[#242116]"] {
                    background-color: #242116 !important;
                }
                html.dark .nhiem-vu-page [class*="dark:border-[#52441D]"] {
                    border-color: #52441D !important;
                }
                html.dark .nhiem-vu-page [class~="bg-paper-surface"] {
                    background-color: #181916 !important;
                }
                html.dark .nhiem-vu-page [class~="bg-paper"] {
                    background-color: #111210 !important;
                }
                html.dark .nhiem-vu-page [class~="border-paper-border"] {
                    border-color: #2C2E29 !important;
                }
                html.dark .nhiem-vu-page [class~="text-ink"],
                html.dark .nhiem-vu-page .text-ink {
                    color: #EDE9DF !important;
                }
                html.dark .nhiem-vu-page [class~="text-ink-muted"],
                html.dark .nhiem-vu-page .text-ink-muted {
                    color: #9CA3AF !important;
                }
            `}</style>

            <UserLayout className="nhiem-vu-page" onThemeChange={setIsDark}>
                {/* Toast Notification */}
                <div
                    id="toast-notification"
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-wine/30 dark:border-gold/40 shadow-2xl text-ink dark:text-night-text transition-all duration-300 ${
                        toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                >
                    <div className="w-8 h-8 rounded-full bg-wine/10 dark:bg-gold/20 flex items-center justify-center text-wine dark:text-gold shrink-0">
                        <i className="ph-bold ph-check text-lg"></i>
                    </div>
                    <div>
                        <div className="font-display font-bold text-xs">{toast.title}</div>
                        <div className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">{toast.message}</div>
                    </div>
                </div>

                {/* MAIN 2-COLUMN DASHBOARD (ĐỒNG BỘ 100% VỚI TỦ SÁCH, CÁ NHÂN & HỘI VIÊN) */}
                <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-28 sm:pb-16 flex-1">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">

                        {/* ====================================================
                            SIDEBAR TRÁI: HỒ SƠ & ĐIỀU HƯỚNG TÀI KHOẢN (ĐỒNG BỘ 100%)
                            ==================================================== */}
                        <aside className="w-full lg:w-80 shrink-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
                            {/* 1. Profile Avatar Card */}
                            <div className="rounded-3xl user-sidebar-card bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                                {/* Dynamic Avatar Frame with Tier Prestige - Bo theo viền tròn Tu Tiên */}
                                <AvatarWithFrame
                                    avatarSrc={avatarSrc}
                                    name={customerName}
                                    tier={customer?.membershipTier}
                                    potatoBalance={potatoBalance}
                                    booksCount={bookshelfCount}
                                    size="lg"
                                />

                                <h2 className="font-display font-black text-2xl text-stone-900 dark:!text-[#EDE9DF] leading-tight">
                                    {customerName}
                                </h2>
                                <p className="font-metadata-spec text-xs text-stone-500 dark:!text-[#9CA3AF] mt-1">
                                    {customerIdDisplay}
                                </p>

                                {/* Tier Pill */}
                                <Link to="/hang" className={`mt-3.5 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-metadata-spec font-bold hover:scale-105 transition-transform ${getTierBadgeClass(customer?.membershipTier, potatoBalance)}`} title="Xem cấp bậc hội viên">
                                    <i className={`ph-bold ${getTierInfo(customer?.membershipTier, potatoBalance).icon}`}></i>
                                    <span>{getTierInfo(customer?.membershipTier, potatoBalance).name}</span>
                                </Link>

                                {/* Divider */}
                                <div className="w-full h-px bg-paper-border dark:bg-night-border my-5"></div>

                                {/* Stat Boxes */}
                                <div className="grid grid-cols-2 gap-3 w-full text-center">
                                    <Link to="/canhan?tab=wallet" className="py-4 px-3 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors flex flex-col justify-center">
                                        <span className="block font-metadata-spec text-2xl font-black text-stone-900 dark:!text-[#EDE9DF]" style={{ color: isDark ? '#EDE9DF' : undefined }}>{potatoBalance.toLocaleString()}</span>
                                        <span className="font-metadata-spec text-xs text-stone-500 dark:!text-[#9CA3AF] mt-1" style={{ color: isDark ? '#9CA3AF' : undefined }}>Khoai Tích Lũy</span>
                                    </Link>
                                    <Link to="/tusachcn" className="py-4 px-3 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold transition-colors flex flex-col justify-center">
                                        <span className="block font-metadata-spec text-2xl font-black text-stone-900 dark:!text-[#EDE9DF]" style={{ color: isDark ? '#EDE9DF' : undefined }}>{bookshelfCount}</span>
                                        <span className="font-metadata-spec text-xs text-stone-500 dark:!text-[#9CA3AF] mt-1" style={{ color: isDark ? '#9CA3AF' : undefined }}>Sách Trong Tủ</span>
                                    </Link>
                                </div>
                            </div>

                            {/* 2. Navigation Menu Card */}
                            <div className="rounded-3xl user-sidebar-card bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border p-3.5 shadow-sm space-y-1.5">
                                {/* 1. Thông Tin Cá Nhân */}
                                <Link
                                    to="/canhan"
                                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <i className="ph-bold ph-user text-lg text-stone-400"></i>
                                    <span>Thông Tin Cá Nhân</span>
                                </Link>

                                {/* 2. Tủ Sách Cá Nhân */}
                                <Link
                                    to="/tusachcn"
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-book-bookmark text-lg text-stone-400"></i>
                                        <span>Tủ Sách Cá Nhân</span>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-paper-200 dark:bg-[#242116] border border-paper-border dark:border-[#52441D] text-amber-600 dark:text-[#D8B44A] text-xs font-bold font-metadata-spec">{bookshelfCount} cuốn</span>
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

                                {/* 4. Nhiệm Vụ Hằng Ngày (ACTIVE TAB TRÊN TRANG NÀY) */}
                                <div
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-black bg-[#C28807] text-[#111210] shadow-md transition-colors cursor-default"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-target text-lg text-[#111210]"></i>
                                        <span>Nhiệm Vụ Hằng Ngày</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/25 text-black text-xs font-black">Streak 🔥</span>
                                </div>

                                {/* 5. Ví Khoai Tây */}
                                <Link
                                    to="/canhan?tab=wallet"
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-wallet text-lg text-stone-400"></i>
                                        <span>Ví Khoai Tây</span>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-paper-200 dark:bg-[#242116] border border-paper-border dark:border-[#52441D] text-amber-600 dark:text-[#D8B44A] text-xs font-bold font-metadata-spec">{potatoBalance.toLocaleString()} 🥔</span>
                                </Link>

                                {/* 6. Lịch Sử Giao Dịch */}
                                <Link
                                    to="/canhan?tab=history"
                                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <i className="ph-bold ph-clock-counter-clockwise text-lg text-stone-400"></i>
                                    <span>Lịch Sử Giao Dịch</span>
                                </Link>

                                {/* 7. Khiếu Nại & Hỗ Trợ */}
                                <Link
                                    to="/canhan?tab=support"
                                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <i className="ph-bold ph-headset text-lg text-stone-400"></i>
                                    <span>Khiếu Nại & Hỗ Trợ</span>
                                </Link>

                                {/* Divider Line */}
                                <div className="pt-2 border-t border-paper-border dark:border-[#2C2E29] mt-2">
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
                            </div>
                        </aside>

                        {/* ====================================================
                            CỘT PHẢI: NỘI DUNG CHÍNH (THU GỌN, TINH TẾ, KHÔNG RỐI MẮT)
                            ==================================================== */}
                        <div className="flex-1 min-w-0 w-full space-y-6">

                            {/* Page Header (Gọn gàng, loại bỏ các đường kẻ cắt ngang dày đặc) */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                        <Link to="/" className="hover:underline">Trang chủ</Link>
                                        <i className="ph-bold ph-caret-right text-[10px]"></i>
                                        <span>Tài khoản</span>
                                        <i className="ph-bold ph-caret-right text-[10px]"></i>
                                        <span className="text-wine dark:text-gold font-bold">Nhiệm vụ & Điểm danh</span>
                                    </div>
                                    <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight flex items-center gap-2.5">
                                        <span>Nhiệm Vụ & Điểm Danh</span>
                                        <span className="text-2xl">🎯</span>
                                    </h1>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1.5 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border/80 dark:border-night-border/80 flex items-center gap-2 text-xs font-metadata-spec font-bold text-ink dark:text-night-text shadow-sm">
                                        <span>🥔</span>
                                        <span>{potatoBalance.toLocaleString()} Khoai</span>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border/80 dark:border-night-border/80 flex items-center gap-2 text-xs font-metadata-spec font-bold text-amber-600 dark:text-gold shadow-sm">
                                        <span>🔥</span>
                                        <span>{streakDays} Ngày Streak</span>
                                    </div>
                                </div>
                            </div>

                            {/* 1. GIAO DIỆN STREAK ĐIỂM DANH 7 NGÀY (THIẾT KẾ THU GỌN) */}
                            <StreakDiemDanh onShowToast={showToast} onCheckinSuccess={fetchCustomer} />

                            {/* 2. CAPSULE TABS (Không dùng viền kẻ ngang cắt ngang màn hình) */}
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('daily')}
                                    className={`px-4 py-2 rounded-xl font-metadata-spec font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                                        activeTab === 'daily'
                                            ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                            : 'bg-paper-surface dark:bg-night-card text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border border-paper-border/70 dark:border-night-border/70'
                                    }`}
                                >
                                    <i className="ph-bold ph-lightning text-sm"></i>
                                    <span>Nhiệm Vụ Hằng Ngày ({DAILY_MISSIONS.length})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('milestones')}
                                    className={`px-4 py-2 rounded-xl font-metadata-spec font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                                        activeTab === 'milestones'
                                            ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                            : 'bg-paper-surface dark:bg-night-card text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border border-paper-border/70 dark:border-night-border/70'
                                    }`}
                                >
                                    <i className="ph-bold ph-medal text-sm"></i>
                                    <span>Thành Tựu Cột Mốc ({READER_MILESTONES.length})</span>
                                </button>
                            </div>

                            {/* 3. DANH SÁCH NHIỆM VỤ HẰNG NGÀY (Card thoáng, loại bỏ các gạch ngang bên trong gây rối) */}
                            {activeTab === 'daily' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-metadata-spec text-ink-muted dark:text-night-muted px-1">
                                        <span>Làm mới mỗi ngày lúc 00:00</span>
                                        <span className="font-bold text-wine dark:text-gold">Hoàn thành tất cả để nhận tối đa +55 Khoai</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        {DAILY_MISSIONS.map((m) => {
                                            const percent = Math.min(100, Math.round((m.currentProgress / m.maxProgress) * 100));

                                            return (
                                                <div
                                                    key={m.id}
                                                    className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border/80 dark:border-night-border/80 p-4 sm:p-4.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3.5"
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${m.iconColor}`}>
                                                                    <i className={`ph-bold ${m.icon}`}></i>
                                                                </span>
                                                                <div>
                                                                    <h4 className="font-display font-black text-xs sm:text-sm text-ink dark:text-night-text leading-snug">
                                                                        {m.title}
                                                                    </h4>
                                                                    <p className="font-editorial-body text-[11px] text-ink-muted dark:text-night-muted mt-0.5 leading-relaxed">
                                                                        {m.description}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="shrink-0 flex flex-col items-end">
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-display font-black text-xs">
                                                                    +{m.rewardPotato} 🥔
                                                                </span>
                                                                <span className="text-[10px] font-metadata-spec text-ink-muted dark:text-night-muted">
                                                                    +{m.rewardXp} XP
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Thanh tiến độ gọn (không cần gạch ngang phân tách) */}
                                                        <div className="mt-3">
                                                            <div className="flex justify-between text-[10px] font-metadata-spec font-bold text-ink-muted dark:text-night-muted mb-1">
                                                                <span>Tiến độ: {m.currentProgress} / {m.maxProgress}</span>
                                                                <span>{percent}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 rounded-full bg-paper-100 dark:bg-night-surface overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                        percent >= 100 ? 'bg-emerald-500' : 'bg-wine dark:bg-gold'
                                                                    }`}
                                                                    style={{ width: `${percent}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Khu vực nút hành động (sắp xếp liền mạch, không gạch ngang) */}
                                                    <div className="flex items-center justify-end">
                                                        {m.isCompleted ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-metadata-spec font-bold text-xs">
                                                                <i className="ph-bold ph-check text-xs"></i>
                                                                <span>Đã Nhận</span>
                                                            </span>
                                                        ) : m.canClaim ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleClaimMission(m)}
                                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-stone-900 font-metadata-spec font-black text-xs shadow-md animate-pulse cursor-pointer hover:scale-105 transition-all"
                                                            >
                                                                <i className="ph-bold ph-gift text-sm"></i>
                                                                <span>Nhận Thưởng +{m.rewardPotato} 🥔</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleExecuteMission(m)}
                                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-paper-100 hover:bg-wine hover:text-white dark:bg-night-surface dark:hover:bg-gold dark:hover:text-night-bg text-ink dark:text-night-text font-metadata-spec font-bold text-xs transition-all shadow-sm cursor-pointer hover:scale-105"
                                                            >
                                                                <i className={`ph-bold ${m.actionIcon || 'ph-caret-right'} text-xs`}></i>
                                                                <span>{m.actionLabel}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 4. DANH SÁCH THÀNH TỰU CỘT MỐC */}
                            {activeTab === 'milestones' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-metadata-spec text-ink-muted dark:text-night-muted px-1">
                                        <span>Phần thưởng cột mốc dài hạn</span>
                                        <span className="font-bold text-amber-600 dark:text-gold">Tự động nhận thưởng ngay khi hoàn thành</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        {READER_MILESTONES.map((ms) => {
                                            const percent = Math.min(100, Math.round((ms.currentProgress / ms.maxProgress) * 100));

                                            return (
                                                <div
                                                    key={ms.id}
                                                    className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border/80 dark:border-night-border/80 p-4 sm:p-4.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3.5"
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-base shrink-0">
                                                                    <i className={`ph-bold ${ms.icon}`}></i>
                                                                </span>
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <h4 className="font-display font-black text-xs sm:text-sm text-ink dark:text-night-text leading-snug">
                                                                            {ms.title}
                                                                        </h4>
                                                                    </div>
                                                                    <p className="font-editorial-body text-[11px] text-ink-muted dark:text-night-muted mt-0.5 leading-relaxed">
                                                                        {ms.description}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="shrink-0 flex flex-col items-end">
                                                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-display font-black text-xs">
                                                                    +{ms.rewardPotato} 🥔
                                                                </span>
                                                                <span className="text-[10px] font-metadata-spec text-ink-muted dark:text-night-muted">
                                                                    +{ms.rewardXp} XP
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3">
                                                            <div className="flex justify-between text-[10px] font-metadata-spec font-bold text-ink-muted dark:text-night-muted mb-1">
                                                                <span>Tiến trình: {ms.currentProgress} / {ms.maxProgress}</span>
                                                                <span>{percent}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 rounded-full bg-paper-100 dark:bg-night-surface overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                        percent >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                                                                    }`}
                                                                    style={{ width: `${percent}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-[11px] font-metadata-spec text-ink-muted dark:text-night-muted">
                                                            {ms.isCompleted ? 'Đã hoàn thành' : (percent >= 100 ? 'Sẵn sàng nhận thưởng' : `Còn ${ms.maxProgress - ms.currentProgress} bước`)}
                                                        </span>
                                                        {ms.isCompleted ? (
                                                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                                                <i className="ph-bold ph-seal-check text-sm"></i> Đã Nhận
                                                            </span>
                                                        ) : ms.canClaim ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleClaimMilestone(ms)}
                                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md animate-pulse cursor-pointer hover:scale-105 transition-all"
                                                            >
                                                                <i className="ph-bold ph-gift"></i>
                                                                <span>Nhận +{ms.rewardPotato} 🥔</span>
                                                            </button>
                                                        ) : (
                                                            <Link to="/" className="font-bold text-wine dark:text-gold hover:underline flex items-center gap-1">
                                                                <span>Tiếp tục</span>
                                                                <i className="ph-bold ph-arrow-right text-xs"></i>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </main>
            </UserLayout>
        </>
    );
}
