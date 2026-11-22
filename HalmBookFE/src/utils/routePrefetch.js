let isPrefetching = false;

/**
 * Prefetch các chunk mã nguồn của các trang người dùng (Thông Tin Cá Nhân, Tủ Sách, Hạng, Nhiệm Vụ)
 * vào memory/cache trình duyệt khi nhàn rỗi (idle) hoặc khi hover chuột vào link điều hướng.
 * Giúp chuyển màn TỨC THÌ (0ms), loại bỏ hoàn toàn hiện tượng nhấp nháy spinner PageLoader.
 */
export const prefetchUserRoutes = () => {
  if (isPrefetching) return;
  isPrefetching = true;

  const doPrefetch = () => {
    try {
      import('@/components/user/CaNhan');
      import('@/components/user/TuSachCn');
      import('@/components/user/HangTv');
      import('@/components/user/NhiemVu');
      import('@/components/user/UuDai');
    } catch {
      // Bỏ qua lỗi prefetch nếu có
    }
  };

  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(doPrefetch, { timeout: 1200 });
    } else {
      setTimeout(doPrefetch, 250);
    }
  }
};
