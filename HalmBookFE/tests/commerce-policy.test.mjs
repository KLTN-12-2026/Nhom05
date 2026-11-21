import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import axios from '../src/services/axiosClient.js';
import { saveAuthSession, saveAdminAuthSession } from '../src/services/authToken.js';
import { getCommercePolicy, getAdminCommercePolicy, saveCommercePolicy, rentalPlanPrice, discountedRentalTotal } from '../src/services/commercePolicyService.js';
import { getTierInfo, getTierLevel } from '../src/utils/tierUtils.js';
const storage = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) }; };
const jwt = sub => `h.${Buffer.from(JSON.stringify({ sub, exp: Date.now() / 1000 + 3600 })).toString('base64url')}.s`;
beforeEach(() => { globalThis.localStorage = storage(); globalThis.sessionStorage = storage(); globalThis.window = undefined; });
test('large wallet balances cannot override the server rank, name or configured discount', () => {
  const tier = { tierId: 31, rankOrder: 2, tierName: 'Renamed reader', discountPercent: 17, badgeIcon: '*' };
  assert.equal(getTierLevel(tier, 999999, 1000), 2); assert.equal(getTierInfo(tier, 999999).discount, 17); assert.equal(getTierInfo(tier).cleanName, 'Renamed reader');
  assert.equal(getTierInfo({ ...tier, discountPercent: 0 }).discount, 0); assert.equal(getTierInfo(null, 999999).discount, 0);
});
test('pricing uses the configured tariff and rounds the final payment like the server', () => {
  const plan = { priceKhoai: 27, useBookPrice: false }; assert.equal(rentalPlanPrice(plan, 500), 27);
  assert.equal(rentalPlanPrice({ ...plan, priceKhoai: 0 }, 500), 0);
  assert.equal(rentalPlanPrice({ ...plan, useBookPrice: true }, 61), 61);
  assert.equal(discountedRentalTotal(9, 50), 5); assert.equal(discountedRentalTotal(27, 25), 20); assert.equal(discountedRentalTotal(27, 25, 100), 0);
});
test('policy updates carry the revision and use the isolated admin session', async () => {
  const user = jwt('reader'), admin = jwt('admin'); saveAuthSession({ token: user, role: 'USER' }); saveAdminAuthSession({ token: admin, role: 'ADMIN' });
  const calls = []; axios.defaults.adapter = async config => { calls.push(config); return { data: { revision: 8, plans: [], tiers: [] }, config, status: 200, headers: {} }; };
  await getCommercePolicy(); await getAdminCommercePolicy(); await saveCommercePolicy({ revision: 7, plans: [], tiers: [], updatedAt: 'ignored' });
  assert.equal(calls[0].headers.Authorization, 'Bearer ' + user); assert.equal(calls[1].headers.Authorization, 'Bearer ' + admin); assert.equal(calls[2].headers.Authorization, 'Bearer ' + admin);
  assert.deepEqual(JSON.parse(calls[2].data), { revision: 7, plans: [], tiers: [] });
});
test('conflicting admin saves and unavailable policies propagate their errors', async () => {
  axios.defaults.adapter = async () => { throw { response: { status: 409, data: { message: 'reload required' } } }; };
  await assert.rejects(saveCommercePolicy({ revision: 1, plans: [], tiers: [] }), error => error.response.status === 409);
  await assert.rejects(getCommercePolicy());
});
