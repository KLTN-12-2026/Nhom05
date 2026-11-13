import { useState, useEffect } from 'react';
import { checkinDailyStreak, getMyTierSummary } from '@/services/tierService';

const STREAK_DAYS = [
    { day: 1, potato: 5, xp: 20, isSpecial: false },
    { day: 2, potato: 5, xp: 20, isSpecial: false },
    { day: 3, potato: 10, xp: 30, isSpecial: false },
    { day: 4, potato: 10, xp: 30, isSpecial: false },
    { day: 5, potato: 15, xp: 40, isSpecial: false },
    { day: 6, potato: 15, xp: 40, isSpecial: false },
    { day: 7, potato: 25, xp: 100, isSpecial: true },
];

export default function StreakDiemDanh({ onCheckinSuccess, onShowToast, compact = false }) {
    const [streakDays, setStreakDays] = useState(0);
    const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const loadStreakStatus = async () => {
        try {
            const summary = await getMyTierSummary();
            if (summary) {
                setStreakDays(summary.streakDays || 0);
                setHasCheckedInToday(Boolean(summary.hasCheckedInToday));
            }
        } catch (error) {
            console.warn("Không thể tải trạng thái streak:", error);
        }
    };

    useEffect(() => {
        loadStreakStatus();

        const handleCheckinEvent = () => {
            loadStreakStatus();
        };
        window.addEventListener('halm-potato-updated', handleCheckinEvent);
        return () => window.removeEventListener('halm-potato-updated', handleCheckinEvent);
    }, []);

    const handleCheckin = async () => {
        if (hasCheckedInToday || isLoading) return;

        try {
            setIsLoading(true);
            const res = await checkinDailyStreak();
            if (res && res.success) {
                setStreakDays(res.streakDays || (streakDays + 1));
                setHasCheckedInToday(true);

                // Ghi nhận hoàn thành nhiệm vụ hằng ngày: Điểm danh
                const todayKey = new Date().toISOString().slice(0, 10);
                try {
                    localStorage.setItem(`halm_daily_action_checkin_${todayKey}`, 'true');
                } catch {}
                window.dispatchEvent(new CustomEvent('halm-daily-task-completed', { detail: { task: 'checkin' } }));

                if (onShowToast) {
                    onShowToast("Điểm Danh Thành Công!", res.message || "Bạn nhận được Khoai Tây & XP hôm nay! 🔥");
                }

                window.dispatchEvent(new CustomEvent('halm-potato-updated', {
                    detail: { potatoBalance: res.potatoBalance }
                }));

                if (onCheckinSuccess) {
                    onCheckinSuccess(res);
                }
            } else {
                setHasCheckedInToday(true);
                if (onShowToast) {
                    onShowToast("Điểm Danh Hằng Ngày", res?.message || "Hôm nay bạn đã điểm danh rồi!");
                }
            }
        } catch (error) {
            console.error("Lỗi khi điểm danh:", error);
            const msg = error.response?.data?.message || "Không thể thực hiện điểm danh. Vui lòng thử lại!";
            if (onShowToast) {
                onShowToast("Điểm Danh Thất Bại", msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const currentCycleDay = streakDays === 0 ? 1 : ((streakDays - 1) % 7) + 1;
    const targetCheckinDay = hasCheckedInToday ? currentCycleDay : (streakDays % 7) + 1;

    return (
        <div className="streak-root rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden transition-all">
            <style>{`
                .streak-root {
                    background-color: #FFFEFA;
                    border: 1px solid #E3DDD0;
                }
                html.dark .streak-root, .dark .streak-root {
                    background-color: #1A1C18 !important;
                    border-color: #2C2E29 !important;
                }
                .streak-badge {
                    background-color: #F5F2EB;
                }
                html.dark .streak-badge, .dark .streak-badge {
                    background-color: #22241F !important;
                    border: 1px solid #2F322A;
                }
                .streak-fire-box {
                    background-color: rgba(245, 158, 11, 0.1);
                }
                html.dark .streak-fire-box, .dark .streak-fire-box {
                    background-color: rgba(212, 175, 55, 0.12) !important;
                }
                .streak-day-card {
                    transition: all 0.2s ease;
                }
                .streak-day-card.checked {
                    background-color: rgba(16, 185, 129, 0.08);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }
                html.dark .streak-day-card.checked, .dark .streak-day-card.checked {
                    background-color: rgba(16, 185, 129, 0.12) !important;
                    border-color: rgba(16, 185, 129, 0.35) !important;
                }
                .streak-day-card.today {
                    background-color: rgba(142, 48, 56, 0.08);
                    border: 2px solid #8E3038;
                }
                html.dark .streak-day-card.today, .dark .streak-day-card.today {
                    background-color: rgba(212, 175, 55, 0.12) !important;
                    border-color: #D4AF37 !important;
                    box-shadow: 0 0 10px rgba(212, 175, 55, 0.12) !important;
                }
                .streak-day-card.locked {
                    background-color: #FAF8F5;
                    border: 1px solid #EAE5D9;
                }
                html.dark .streak-day-card.locked, .dark .streak-day-card.locked {
                    background-color: #141512 !important;
                    border-color: #232520 !important;
                }
            `}</style>

            {/* Header: Title & Current Streak Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <span className="streak-fire-box w-10 h-10 rounded-xl text-amber-600 dark:text-gold flex items-center justify-center text-xl shrink-0">
                        🔥
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-display font-black text-base sm:text-lg text-ink dark:text-night-text">
                                Chuỗi Điểm Danh Đọc Sách
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-metadata-spec font-bold text-[10px]">
                                7 Ngày
                            </span>
                        </div>
                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">
                            Điểm danh mỗi ngày để tích lũy Khoai Tây 🥔 và Điểm cày (XP) thăng hạng.
                        </p>
                    </div>
                </div>

                <div className="streak-badge self-start sm:self-auto px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <span className="text-base animate-bounce">🔥</span>
                    <span className="font-display font-black text-xs sm:text-sm text-amber-600 dark:text-gold">
                        {streakDays} Ngày Liên Tiếp
                    </span>
                </div>
            </div>

            {/* 7 Days Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {STREAK_DAYS.map((item) => {
                    const isChecked = hasCheckedInToday 
                        ? item.day <= currentCycleDay 
                        : item.day < targetCheckinDay;
                    const isToday = !hasCheckedInToday && item.day === targetCheckinDay;

                    return (
                        <div
                            key={item.day}
                            className={`streak-day-card relative rounded-xl p-2.5 flex flex-col items-center justify-between text-center ${
                                isChecked
                                    ? 'checked'
                                    : isToday
                                        ? 'today scale-[1.02]'
                                        : 'locked'
                            }`}
                        >
                            {item.isSpecial && (
                                <span className="absolute -top-2 px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-metadata-spec font-black text-[8px] uppercase tracking-wider">
                                    Quà 🎁
                                </span>
                            )}

                            <span className={`font-metadata-spec text-[10px] font-bold ${
                                isChecked
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : isToday
                                        ? 'text-wine dark:text-gold font-black'
                                        : 'text-ink-muted dark:text-night-muted'
                            }`}>
                                Ngày {item.day}
                            </span>

                            <div className="my-1.5 flex flex-col items-center">
                                <span className="text-xl sm:text-2xl transition-transform hover:scale-110">
                                    {isChecked ? '✅' : item.isSpecial ? '🎁' : '🥔'}
                                </span>
                                <span className={`font-display font-black text-xs mt-0.5 ${
                                    isChecked
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : isToday
                                            ? 'text-wine dark:text-gold'
                                            : 'text-ink dark:text-night-text'
                                }`}>
                                    +{item.potato} Khoai
                                </span>
                            </div>

                            <div className="w-full">
                                {isChecked ? (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        Đã nhận
                                    </span>
                                ) : isToday ? (
                                    <span className="text-[10px] font-black text-wine dark:text-gold uppercase animate-pulse">
                                        Hôm nay
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-ink-muted/70 dark:text-night-muted/70">
                                        Khóa
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Call to Action */}
            <div className="mt-4 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-editorial-body text-ink-muted dark:text-night-muted flex items-center gap-1.5">
                    <i className="ph-bold ph-info text-amber-500"></i>
                    {hasCheckedInToday 
                        ? "Đã điểm danh hôm nay! Hãy quay lại vào ngày mai để tiếp tục duy trì streak."
                        : "Điểm danh ngay để nhận Khoai Tây và thắp sáng ngọn lửa đọc sách!"}
                </span>

                <div className="shrink-0">
                    {hasCheckedInToday ? (
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-metadata-spec font-bold text-xs">
                            <i className="ph-bold ph-check text-sm"></i>
                            <span>Hôm Nay Đã Nhận</span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleCheckin}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata-spec font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <i className="ph-bold ph-spinner animate-spin"></i>
                                    <span>Đang nhận...</span>
                                </>
                            ) : (
                                <>
                                    <i className="ph-bold ph-calendar-check"></i>
                                    <span>Điểm Danh Ngay (+5 🥔)</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
