import { fetchApiWithFallback } from './apiService';
import type { TierDto } from './MembershipModal';
export interface RentalPlan { key: string; durationDays: number; label: string; priceKhoai: number; useBookPrice: boolean; active: boolean; orderIndex: number }
export interface CommercePolicy { revision: number; updatedAt: string; plans: RentalPlan[]; tiers: TierDto[] }
let cachedPolicy: CommercePolicy | null = null;
export const getCachedCommercePolicy = () => cachedPolicy;
export async function fetchCommercePolicy(signal?: AbortSignal): Promise<CommercePolicy> {
  const { data } = await fetchApiWithFallback<CommercePolicy>('/api/home/commerce-policy', { signal });
  if (!Number.isSafeInteger(data.revision) || !Array.isArray(data.plans) || !data.plans.length || !Array.isArray(data.tiers)) throw new Error('Chưa tải được chính sách giá. Vui lòng thử lại.');
  cachedPolicy = data;
  return data;
}
export function rentalPlanPrice(plan: RentalPlan, bookPrice?: number | null): number {
  return Math.round(plan.useBookPrice && typeof bookPrice === 'number' && bookPrice > 0 ? bookPrice : plan.priceKhoai);
}
