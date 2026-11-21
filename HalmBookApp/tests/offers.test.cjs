const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
function load(server = async () => ({ data: [] }), token = 'user-token') {
  const policy = { revision: 7, plans: [{ key: '7', active: true, priceKhoai: 27 }], tiers: [] };
  const mocks = {
    './apiService': { fetchApiWithFallback: server },
    './commercePolicy': { fetchCommercePolicy: async () => policy, rentalPlanPrice: (plan, price) => plan.useBookPrice ? price : plan.priceKhoai },
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async () => token } },
  };
  const code = ts.transpileModule(fs.readFileSync(__dirname + '/../src/ux-ui/offersService.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports: {}, require: key => { assert.ok(key in mocks, key); return mocks[key]; } }; vm.runInNewContext(code, context); return { service: context.exports, policy };
}
const plain = value => JSON.parse(JSON.stringify(value));

test('Offers screen loads public promotions and offers without hitting an admin endpoint', async () => {
  const calls = []; const { service } = load(async (path, config) => { calls.push([path, config]); return { data: [path] }; });
  const signal = new AbortController().signal; const result = await service.fetchOffers(signal);
  assert.deepEqual(calls.map(c => c[0]).sort(), ['/api/home/book-offers', '/api/home/promotions']); assert.ok(calls.every(c => c[1].signal === signal));
  assert.equal(result.policy.revision, 7); assert.equal(result.promotions[0], '/api/home/promotions');
});
test('promotion cards use real book IDs, metadata and configured tariff including free prices', () => {
  const { service, policy } = load(); const p = { promotion_id: 'P001', promotion_name: 'Tên ưu đãi', discount_percent: 20, discount_amount: 0, book_id: 'real-book', book_details: { book_id: 'real-book', bookName: 'Real title', rent_price: 99 } };
  const result = service.promotionRows([p], [{ book_id: 'B001', bookName: 'Wrong book' }], policy);
  assert.equal(result.featured.length, 1); assert.equal(result.featured[0].book_id, 'real-book'); assert.equal(result.featured[0].original_price, 27); assert.equal(result.featured[0].rent_price, 22);
  assert.equal(result.featured[0].couponCode, 'P001'); policy.plans[0].priceKhoai = 0;
  assert.equal(service.promotionRows([p], [], policy).featured[0].rent_price, 0);
  assert.equal(service.promotionRows([p], [], null).featured.length, 0);
});
test('category and general vouchers keep their scope and disabled promotions disappear', () => {
  const { service, policy } = load(); const rows = service.promotionRows([
    { promotion_id: 'CAT', category: { category_id: 1000 }, discount_amount: 5, eligible_books: [{ book_id: 'eligible', category_id: 1000 }, { book_id: 'wrong', category_id: 1001 }] },
    { promotion_id: 'GLOBAL', promotion_name: 'Giảm toàn giỏ', discount_amount: 5 },
    { promotion_id: 'OFF', status: 'INACTIVE', book_id: 'eligible' },
  ], [], policy);
  assert.equal(rows.featured.length, 0); assert.equal(rows.categories.length, 2); assert.equal(rows.categories[0].book_id, 'eligible');
  assert.equal(rows.categories[1].couponOnly, true); assert.equal(rows.categories[1].book_id, undefined); assert.equal(rows.categories[1].couponCode, 'GLOBAL');
});
test('combo card retains the server identity, fixed plan and zero price', () => {
  const { service } = load(); const row = service.offerRow({ id: 'offer-1', kind: 'COMBO', name: 'Combo', books: ['A', 'B'], bookIds: ['a', 'b'], bookDetails: [{ book_id: 'a', img_url: '/cover.png' }], potato: 0, originalPotato: 18, planKey: '30' });
  assert.equal(row.offerId, 'offer-1'); assert.equal(row.book_id, undefined); assert.equal(row.rent_price, 0); assert.equal(row.planKey, '30'); assert.equal(row.img_url, '/cover.png');
});
test('offer, coupon and quote mutations authenticate the user and submit identifiers instead of client prices', async () => {
  const calls = []; const { service } = load(async (path, config) => { calls.push([path, config]); return { data: { success: true } }; });
  await service.addOfferToCart('offer/a'); await service.applyPromotionToCart('REAL', 'book-1', '7'); await service.getCartQuote([1, 2]); await service.clearCartCoupon();
  assert.deepEqual(calls.map(c => c[0]), ['/api/home/cart/offers/offer%2Fa', '/api/home/cart/coupon', '/api/home/checkout/quote', '/api/home/cart/coupon']);
  assert.ok(calls.every(c => c[1].headers.Authorization === 'Bearer user-token')); assert.deepEqual(plain(calls[1][1].data), { couponCode: 'REAL', bookId: 'book-1', planKey: '7' });
  assert.deepEqual(plain(calls[2][1].data), { cartItemIds: [1, 2] }); assert.equal(calls[3][1].method, 'DELETE');
});
test('unavailable offers and rejected coupons remain failures without a fabricated success or duplicate mutation', async () => {
  let calls = 0; const { service } = load(async () => { calls++; throw Error('expired offer'); });
  await assert.rejects(service.addOfferToCart('off'), /expired offer/); assert.equal(calls, 1);
  await assert.rejects(service.applyPromotionToCart('OFF'), /expired offer/); assert.equal(calls, 2);
  const guest = load(async () => { throw Error('should not call'); }, null).service; await assert.rejects(guest.getCartQuote([1]), /đăng nhập/);
});
