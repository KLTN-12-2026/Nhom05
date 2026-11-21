import { fetchApiWithFallback, normalizeAssetUrl } from './apiService';

export interface AppBanner {
  id: string;
  platform: 'APP';
  layoutType: 'custom_image' | 'showcase';
  title: string;
  titleHighlight?: string;
  eyebrow?: string;
  description?: string;
  actionText?: string;
  actionLink?: string;
  imageUrl?: string;
  imageMode?: string;
  gradient?: string;
  order: number;
}

const screens = ['home', 'offers', 'categories', 'search', 'bookshelf', 'profile', 'payment', 'chatbot', 'leaderboard', 'upload'] as const;
export type BannerDestination = { screen: typeof screens[number] } | { bookId: string };

export function bannerDestination(link?: string): BannerDestination | null {
  if (!link) return null;
  if (link.startsWith('app:')) {
    const screen = screens.find(screen => link === `app:${screen}`);
    return screen ? { screen } : null;
  }
  return /^book:[A-Za-z0-9_-]{1,64}$/.test(link) ? { bookId: link.slice(5) } : null;
}

export function parseAppBanners(data: unknown): AppBanner[] {
  if (!Array.isArray(data)) throw new Error('Dữ liệu banner không hợp lệ.');
  const text = (value: unknown) => typeof value === 'string' ? value : '';
  const ids = new Set<string>();
  return data.filter(item => item && item.platform === 'APP' && item.isActive === true
    && typeof item.id === 'string' && ['custom_image', 'showcase'].includes(item.layoutType))
    .flatMap(item => {
      if (ids.has(item.id)) return [];
      ids.add(item.id);
      const image = text(item.imageUrl);
      const safeImage = /^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,|\/(?!\/))/i.test(image)
        ? normalizeAssetUrl(image) : '';
      if (!text(item.title).trim() && !safeImage) return [];
      return [{
        id: item.id, platform: 'APP' as const, layoutType: item.layoutType,
        title: text(item.title), titleHighlight: text(item.titleHighlight), eyebrow: text(item.eyebrow),
        description: text(item.description), actionText: text(item.actionText), actionLink: text(item.actionLink),
        imageUrl: safeImage, imageMode: text(item.imageMode), gradient: text(item.gradient),
        order: Number.isFinite(item.order) ? item.order : 0,
      }];
    }).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export async function fetchAppBanners(signal: AbortSignal): Promise<AppBanner[]> {
  const response = await fetchApiWithFallback<unknown>('/api/home/banners', { params: { platform: 'APP' }, signal });
  return parseAppBanners(response.data);
}
