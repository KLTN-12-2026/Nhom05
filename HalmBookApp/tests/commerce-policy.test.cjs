const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
function load(name, mocks) {
  const code = ts.transpileModule(fs.readFileSync(__dirname + '/../src/ux-ui/' + name + '.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports: {}, URL, require: key => { if (!(key in mocks)) throw Error(key); return mocks[key]; } }; vm.runInNewContext(code, context); return context.exports;
}
const fixture = () => ({ revision: 7, tiers: [], plans: [
  { key: '7', durationDays: 7, label: 'Configured week', priceKhoai: 27, useBookPrice: false, active: true, orderIndex: 1 },
  { key: 'forever', durationDays: 36500, label: 'Buy', priceKhoai: 55, useBookPrice: true, active: true, orderIndex: 2 },
] });
test('app uses configured prices, including zero, and the book-specific buy policy', async () => {
  const data = fixture(); const policy = load('commercePolicy', { './apiService': { fetchApiWithFallback: async () => ({ data }) } });
  assert.equal(policy.getCachedCommercePolicy(), null); await policy.fetchCommercePolicy();
  assert.equal(policy.rentalPlanPrice(data.plans[0], 999), 27); assert.equal(policy.rentalPlanPrice(data.plans[1], 63), 63);
  assert.equal(policy.rentalPlanPrice(data.plans[1], null), 55); data.plans[0].priceKhoai = 0; assert.equal(policy.rentalPlanPrice(data.plans[0]), 0);
});
test('unavailable or malformed policy remains an error instead of inventing prices', async () => {
  const offline = load('commercePolicy', { './apiService': { fetchApiWithFallback: async () => { throw Error('offline'); } } });
  await assert.rejects(offline.fetchCommercePolicy(), /offline/); assert.equal(offline.getCachedCommercePolicy(), null);
  const malformed = load('commercePolicy', { './apiService': { fetchApiWithFallback: async () => ({ data: { revision: 1, plans: [], tiers: [] } }) } });
  await assert.rejects(malformed.fetchCommercePolicy());
});
test('adding to the cart refreshes policy and submits the configured plan instead of a fixed amount', async () => {
  const data = fixture(), calls = [];
  const server = async (path, config) => { calls.push([path, config]); return { data: path === '/api/home/commerce-policy' ? data : { message: 'OK' } }; };
  const policy = load('commercePolicy', { './apiService': { fetchApiWithFallback: server } });
  const rental = load('rentalService', {
    './commercePolicy': policy, './apiService': { API_BASE_URL: 'https://fixture.invalid', fetchApiWithFallback: server },
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async () => 'token' } }, './userStorage': {},
  });
  assert.equal((await rental.addToCartApi('b1', 7, 500)).success, true); assert.equal(calls[1][0], '/api/cart/add'); assert.equal(calls[1][1].data.price, 27);
  data.revision++; data.plans[0].priceKhoai = 31; await rental.addToCartApi('b1', 7); assert.equal(calls[3][1].data.price, 31);
  assert.equal(rental.calculateDynamicKhoai(500, 7), 31);
  data.plans[0].active = false; const before = calls.length; assert.equal((await rental.addToCartApi('b1', 7)).success, false); assert.equal(calls.length, before + 1);
  assert.throws(() => rental.calculateDynamicKhoai(500, 7));
  assert.equal((await rental.addToCartApi('b1', undefined, 61)).success, true);
  assert.equal(calls.at(-1)[1].data.planKey, 'forever'); assert.equal(calls.at(-1)[1].data.price, 61);
});
test('an uncertain cart mutation is not retried through a second endpoint', async () => {
  const calls = [], data = fixture();
  const server = async path => { calls.push(path); if (path === '/api/home/commerce-policy') return { data }; throw Error('response lost'); };
  const policy = load('commercePolicy', { './apiService': { fetchApiWithFallback: server } });
  const rental = load('rentalService', { './commercePolicy': policy, './apiService': { fetchApiWithFallback: server },
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async () => 'token' } }, './userStorage': {} });
  assert.equal((await rental.addToCartApi('b1', 7)).success, false);
  assert.deepEqual(calls, ['/api/home/commerce-policy', '/api/cart/add']);
});
