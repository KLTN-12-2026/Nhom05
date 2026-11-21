import axios from './axiosClient.js';
export const getCommercePolicy = signal => axios.get('/api/home/commerce-policy', { signal }).then(r => r.data);
export const getAdminCommercePolicy = () => axios.get('/api/admin/commerce-policy').then(r => r.data);
export const saveCommercePolicy = policy => axios.put('/api/admin/commerce-policy', { revision: policy.revision, plans: policy.plans, tiers: policy.tiers }).then(r => r.data);
export const rentalPlanPrice = (plan, bookPrice) => Math.round(plan.useBookPrice && Number(bookPrice) > 0 ? Number(bookPrice) : plan.priceKhoai);
export const discountedRentalTotal = (subtotal, discountPercent = 0, coupon = 0) => Math.max(0, Math.round(subtotal - Math.min(subtotal, subtotal * discountPercent / 100 + coupon)));
