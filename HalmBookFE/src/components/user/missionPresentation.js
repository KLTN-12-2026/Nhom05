// Adapt server progress to the original mission cards without changing their markup.
const appearances = {
  CHECKIN: ['checkin', 'ph-calendar-check', 'text-amber-500 bg-amber-500/10', 'Điểm Danh Ngay', 'ph-check-circle'],
  READING_SECONDS: ['read', 'ph-book-open', 'text-wine bg-wine/10 dark:text-gold dark:bg-gold/15', 'Đọc Sách Ngay', 'ph-book-bookmark'],
  CHAT: ['chat', 'ph-sparkle', 'text-blue-500 bg-blue-500/10', 'Trò Chuyện AI', 'ph-chat-circle-dots'],
  SEARCH: ['search', 'ph-magnifying-glass', 'text-indigo-500 bg-indigo-500/10', 'Tìm Kiếm Ngay', 'ph-magnifying-glass'],
  OFFERS: ['offers', 'ph-gift', 'text-emerald-600 bg-emerald-500/10', 'Xem Ưu Đãi', 'ph-tag'],
  BOOKSHELF: ['bookshelf', 'ph-books', 'text-purple-500 bg-purple-500/10', 'Vào Tủ Sách', 'ph-caret-right'],
  STREAK_DAYS: ['', 'ph-fire'], BOOKS_OWNED: ['', 'ph-books'], TOTAL_XP: ['', 'ph-coins'],
};

export function missionCards(missions, period) {
  return (missions || []).filter(m => m.period === period).map(m => {
    const [taskKey, icon, iconColor, actionLabel, actionIcon] = appearances[m.condition] || [];
    return { ...m, taskKey, icon: m.id === 'ms4' ? 'ph-crown' : icon || 'ph-trophy', iconColor: iconColor || 'text-amber-500 bg-amber-500/10',
      actionLabel: actionLabel || 'Tiếp tục', actionIcon: actionIcon || 'ph-caret-right', badge: 'Cột Mốc',
      currentProgress: m.progress, maxProgress: m.targetValue, isCompleted: m.claimed, canClaim: m.completed && !m.claimed };
  });
}
