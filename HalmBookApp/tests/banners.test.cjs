const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function harness(handler = async () => ({ data: [] })) {
  const source = fs.readFileSync(__dirname + '/../src/ux-ui/bannerService.ts', 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require: () => ({ fetchApiWithFallback: handler, normalizeAssetUrl: value => value.startsWith('/') ? 'https://api.invalid' + value : value }) };
  vm.runInNewContext(code, context);
  return context.exports;
}
const banner = (id, patch = {}) => ({ id, platform: 'APP', layoutType: 'showcase', title: id, isActive: true, order: 1, ...patch });

test('app requests only its public channel and forwards cancellation', async () => {
  const signal = new AbortController().signal;
  const service = harness(async (url, config) => {
    assert.equal(url, '/api/home/banners'); assert.equal(config.params.platform, 'APP'); assert.equal(config.signal, signal);
    return { data: [banner('app')] };
  });
  assert.equal((await service.fetchAppBanners(signal))[0].id, 'app');
});
test('web banners and inactive drafts never enter the app carousel', () => {
  const result = harness().parseAppBanners([banner('web', { platform: 'WEB' }), banner('hidden', { isActive: false }), banner('second', { order: 2 }), banner('first'), banner('first')]);
  assert.equal(result.map(b => b.id).join(','), 'first,second');
});
test('empty server lists stay empty and malformed responses are errors', () => {
  assert.equal(harness().parseAppBanners([]).length, 0);
  assert.throws(() => harness().parseAppBanners({ error: 'unavailable' }));
});
test('app only opens supported screens or explicit book IDs', () => {
  const { bannerDestination } = harness();
  assert.equal(bannerDestination('app:offers').screen, 'offers');
  assert.equal(bannerDestination('book:BOOK-123').bookId, 'BOOK-123');
  for (const link of ['/uudai', 'javascript:alert(1)', 'app:auth', 'book:../admin', 'https://other.invalid', '']) assert.equal(bannerDestination(link), null);
});
test('banner assets are normalized and executable image URLs are excluded', () => {
  const result = harness().parseAppBanners([banner('valid', { imageUrl: '/uploads/banner.png' }), banner('unsafe', { imageUrl: 'javascript:alert(1)' })]);
  assert.equal(result.find(b => b.id === 'valid').imageUrl, 'https://api.invalid/uploads/banner.png');
  assert.equal(result.find(b => b.id === 'unsafe').imageUrl, '');
});
