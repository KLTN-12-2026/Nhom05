import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchApiWithFallback } from './apiService';
import { CommercePolicy, fetchCommercePolicy, rentalPlanPrice } from './commercePolicy';
export interface BookOffer {
  id: string; version: number; kind: 'COMBO' | 'SINGLE'; name: string; desc: string; img: string; potato: number; originalPotato: number;
  discount: string; planKey: string; status: string; bookIds: string[]; books: string[]; bookDetails: Record<string, any>[]; author: string; category: string;
}
export interface Promotion {
  promotion_id: string; promotion_name: string; description?: string; discount_percent: number; discount_amount: number;
  book_id?: string | null; category_id?: number | null; category?: { category_id: number } | null;
  book_details?: Record<string, any> | null; eligible_books?: Record<string, any>[]; status?: string;
}
export async function fetchOffers(signal?: AbortSignal) {
  const [promotions, offers, policy] = await Promise.all([
    fetchApiWithFallback<Promotion[]>('/api/home/promotions', { signal }),
    fetchApiWithFallback<BookOffer[]>('/api/home/book-offers', { signal }), fetchCommercePolicy(signal),
  ]);
  return { promotions: promotions.data, offers: offers.data, policy };
}
async function mutate(path: string, data?: unknown, method = 'POST') {
  const token = await AsyncStorage.getItem('userToken'); if (!token) throw new Error('Vui lòng đăng nhập.');
  return (await fetchApiWithFallback<any>(path, { method, data, headers: { Authorization: 'Bearer ' + token } })).data;
}
export const addOfferToCart = (offerId: string) => mutate('/api/home/cart/offers/' + encodeURIComponent(offerId));
export const applyPromotionToCart = (couponCode: string, bookId?: string, planKey?: string) => mutate('/api/home/cart/coupon', { couponCode, bookId, planKey });
export const clearCartCoupon = () => mutate('/api/home/cart/coupon', undefined, 'DELETE');
export interface CartQuote {
  policyRevision: number; quoteFingerprint: string; subtotal: number; offerDiscountAmount: number; tierDiscountAmount: number; couponDiscountAmount: number;
  totalKhoaiPaid: number; potatoBalance: number; couponCode: string;
  items: { cartItemId: number; bookId: string; offerId?: string; planKey: string; priceKhoai: number; netPrice: number }[];
}
export const getCartQuote = (cartItemIds: number[]) => mutate('/api/home/checkout/quote', { cartItemIds }) as Promise<CartQuote>;

/** Uses real book IDs and the current tariff; member discounts are finalized in the cart quote. */
export function promotionRows(promotions: Promotion[], books: Record<string, any>[], policy: CommercePolicy | null) {
  const featured: Record<string, any>[] = [], categories: Record<string, any>[] = [];
  if (!policy) return { featured, categories };
  const plan = policy.plans.find(p => p.active && p.key === '7') || policy.plans.find(p => p.active);
  if (!plan) return { featured, categories };
  for (const promotion of promotions) {
    if (promotion.status && promotion.status.toUpperCase() !== 'ACTIVE') continue;
    const category = promotion.category_id ?? promotion.category?.category_id;
    if (!promotion.book_id && !category) {
      categories.push({ bookName: promotion.promotion_name, author: 'Mã ' + promotion.promotion_id, couponCode: promotion.promotion_id, couponOnly: true,
        priceLabel: promotion.discount_percent > 0 ? '-' + promotion.discount_percent + '%' : '-' + promotion.discount_amount + ' Khoai', rent_price: 0, original_price: 0,
        description: promotion.description, discount_percent: promotion.discount_percent }); continue;
    }
    const available = new Map<string, Record<string, any>>();
    for (const b of [...books, ...(promotion.eligible_books || []), ...(promotion.book_details ? [promotion.book_details] : [])]) if (b.book_id) available.set(b.book_id, b);
    for (const book of available.values()) {
      if (promotion.book_id && promotion.book_id !== book.book_id || category && Number(category) !== Number(book.category_id)) continue;
      const original = rentalPlanPrice(plan, book.rent_price);
      const saving = promotion.discount_percent > 0 ? original * promotion.discount_percent / 100 : Math.min(original, promotion.discount_amount);
      const row = { ...book, couponCode: promotion.promotion_id, planKey: plan.key, original_price: original, rent_price: Math.max(0, Math.round(original - saving)),
        discount_percent: original > 0 ? Math.round(saving / original * 100) : 0, promo_name: promotion.promotion_name, description: promotion.description || book.description };
      (promotion.book_id ? featured : categories).push(row);
    }
  }
  return { featured, categories };
}
export function offerRow(offer: BookOffer) {
  return { ...(offer.bookDetails[0] || {}), bookName: offer.name, author: offer.kind === 'COMBO' ? offer.books.length + ' cuốn · ' + offer.books.join(', ') : offer.author,
    img_url: offer.img || offer.bookDetails[0]?.img_url, offerId: offer.id, book_id: offer.kind === 'SINGLE' ? offer.bookIds[0] : undefined,
    original_price: offer.originalPotato, rent_price: offer.potato, discount_percent: offer.originalPotato > 0 ? Math.max(0, Math.round((1 - offer.potato / offer.originalPotato) * 100)) : 0,
    description: offer.desc, planKey: offer.planKey,
    kind: offer.kind, books: offer.books, bookIds: offer.bookIds, bookDetails: offer.bookDetails, rawOffer: offer };
}
