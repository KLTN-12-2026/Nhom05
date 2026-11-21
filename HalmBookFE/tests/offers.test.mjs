import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import axios from '../src/services/axiosClient.js';
import { saveAuthSession, saveAdminAuthSession } from '../src/services/authToken.js';
import { getCombos, getSingleDeals, addCombo, updateCombo, deleteCombo, addSingleDeal, updateSingleDeal, deleteSingleDeal, addOfferToCart, applyCartCoupon, clearCartCoupon, getCartQuote } from '../src/services/offerService.js';
const storage = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) }; };
const jwt = sub => `h.${Buffer.from(JSON.stringify({ sub, exp: Date.now() / 1000 + 3600 })).toString('base64url')}.s`;
beforeEach(() => { globalThis.localStorage = storage(); globalThis.sessionStorage = storage(); globalThis.window = undefined; });
test('offer reads and writes use real APIs with separate admin and reader sessions', async () => {
  const user = jwt('reader'), admin = jwt('admin'); saveAuthSession({ token: user, role: 'USER' }); saveAdminAuthSession({ token: admin, role: 'ADMIN' });
  const calls = []; axios.defaults.adapter = async config => { calls.push(config); return { data: [], config, status: 200, headers: {} }; };
  await getCombos(); await getSingleDeals(true); await addCombo({ name: 'Combo', bookIds: ['b1', 'b2'], potato: 11 });
  await updateCombo('c1', { version: 2, potato: 0 }); await deleteCombo('c1'); await addSingleDeal({ bookIds: ['b1'] }); await updateSingleDeal('d1', { potato: 5 }); await deleteSingleDeal('d1');
  assert.equal(calls[0].url, '/api/home/book-offers'); assert.equal(calls[0].params.kind, 'COMBO'); assert.equal(calls[0].headers.Authorization, 'Bearer ' + user);
  assert.ok(calls.slice(1).every(c => c.headers.Authorization === 'Bearer ' + admin)); assert.equal(calls[1].params.kind, 'SINGLE');
  assert.deepEqual(JSON.parse(calls[2].data), { name: 'Combo', bookIds: ['b1', 'b2'], potato: 11, kind: 'COMBO' }); assert.equal(JSON.parse(calls[3].data).potato, 0);
  assert.equal(JSON.parse(calls[5].data).kind, 'SINGLE'); assert.equal(calls[7].method, 'delete');
});
test('cart actions request authenticated server quotes and persist scoped vouchers without local wallet edits', async () => {
  const user = jwt('reader'); saveAuthSession({ token: user, role: 'USER' }); const calls = [];
  axios.defaults.adapter = async config => { calls.push(config); return { data: { quoteFingerprint: 'server', totalKhoaiPaid: 11 }, config, status: 200, headers: {} }; };
  await addOfferToCart('offer/1'); await applyCartCoupon('REAL', 'b1', '7'); const result = await getCartQuote([1, 2]); await clearCartCoupon();
  assert.ok(calls.every(c => c.headers.Authorization === 'Bearer ' + user)); assert.equal(calls[0].url, '/api/home/cart/offers/offer%2F1');
  assert.deepEqual(JSON.parse(calls[1].data), { couponCode: 'REAL', bookId: 'b1', planKey: '7' }); assert.deepEqual(JSON.parse(calls[2].data), { cartItemIds: [1, 2] }); assert.equal(result.quoteFingerprint, 'server'); assert.equal(calls[3].method, 'delete');
});
test('failed admin saves never broadcast a successful offer update and errors propagate to forms', async () => {
  const events = []; globalThis.window = { dispatchEvent: e => events.push(e.type) };
  axios.defaults.adapter = async () => { throw { response: { status: 409, data: { message: 'reload' } } }; };
  await assert.rejects(updateCombo('c1', { version: 1 }), e => e.response.status === 409); assert.deepEqual(events, []);
  axios.defaults.adapter = async config => ({ data: { id: 'c1' }, status: 200, config, headers: {} }); await updateCombo('c1', { version: 2 }); assert.deepEqual(events, ['halm-offers-updated']);
});
