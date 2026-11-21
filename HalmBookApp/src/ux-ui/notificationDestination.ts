import type { AppScreen } from './navigation';

/** Backend links use web routes; resolve only known in-app destinations. */
export function notificationDestination(link?: string): AppScreen | null {
  const destinations: Record<string, AppScreen> = {
    '/': 'home', '/trangchu': 'home', '/trang-chu': 'home',
    '/uudai': 'offers', '/uu-dai': 'offers', '/danhmuc': 'categories', '/danh-muc': 'categories',
    '/tusachcn': 'bookshelf', '/bookshelf': 'bookshelf', '/canhan': 'profile',
    '/canhan?tab=wallet': 'transactions', '/canhan?tab=history': 'transactions', '/vi-khoai': 'transactions',
    '/thong-bao': 'notifications',
  };
  return link && Object.hasOwn(destinations, link) ? destinations[link] : null;
}
