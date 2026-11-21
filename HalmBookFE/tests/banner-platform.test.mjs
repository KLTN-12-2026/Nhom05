import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

function harness(handler) {
  const storage = new Map(), events = [], calls = [];
  const client = Object.fromEntries(['get', 'post', 'put', 'patch', 'delete'].map(method => [method, async (...args) => {
    calls.push({ method, args }); return handler(method, ...args);
  }]));
  const context = vm.createContext({ axiosClient: client, console,
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    window: { dispatchEvent: event => events.push(event) },
  });
  const source = readFileSync(new URL('../src/services/bannerService.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/m, '').replaceAll('export ', '');
  vm.runInContext(source + '\nglobalThis.api = {getBanners, fetchBanners, saveBanners, addBanner, updateBanner, toggleBannerStatus, deleteBanner, resetDefaultBanners};', context);
  return { api: context.api, storage, events, calls, browserStorage: context.localStorage };
}
const banner = (id, platform, isActive = true) => ({ id, platform, isActive, order: 1 });

test('platform and admin/public caches cannot contaminate one another', async () => {
  const { api, events } = harness(async (_method, url, config) => ({ data: [banner(url.includes('/admin/') ? 'draft' : 'public', config.params.platform, !url.includes('/admin/'))] }));
  await api.fetchBanners(false, 'WEB'); await api.fetchBanners(true, 'APP'); await api.fetchBanners(true, 'WEB');
  assert.equal(api.getBanners('WEB')[0].id, 'public');
  assert.equal(api.getBanners('APP').length, 0);
  assert.equal(api.getBanners('APP', true)[0].platform, 'APP');
  assert.equal(events[1].detail.platform, 'APP'); assert.equal(events[1].detail.isAdmin, true);
});
test('an empty response clears cached banners instead of restoring defaults', async () => {
  let data = [banner('web', 'WEB')];
  const { api } = harness(async () => ({ data }));
  await api.fetchBanners(); data = []; await api.fetchBanners();
  assert.equal(api.getBanners().length, 0);
});
test('mutations pass the selected channel through every endpoint', async () => {
  const { api, calls } = harness(async (method, url, body, config) => {
    if (method === 'get') return { data: [] };
    assert.equal((method === 'delete' ? body : config).params.platform, 'APP');
    return { data: url.endsWith('/reset') || url.endsWith('/reorder') ? [] : banner('app', 'APP') };
  });
  await api.saveBanners([], 'APP'); await api.updateBanner('app', {}, 'APP');
  await api.toggleBannerStatus('app', 'APP'); await api.deleteBanner('app', 'APP'); await api.resetDefaultBanners('APP');
  assert.equal(calls.filter(c => c.method === 'post').length, 1);
});
test('failed writes preserve the last confirmed list and report failure', async () => {
  const { api } = harness(async method => { if (method !== 'get') throw Error('offline'); return { data: [banner('app', 'APP')] }; });
  await api.fetchBanners(true, 'APP');
  await assert.rejects(api.deleteBanner('app', 'APP'));
  await assert.rejects(api.resetDefaultBanners('APP'));
  assert.equal(api.getBanners('APP', true)[0].id, 'app');
});
test('a response from another channel is rejected instead of cached', async () => {
  const { api } = harness(async () => ({ data: [banner('web', 'WEB')] }));
  await assert.rejects(api.fetchBanners(true, 'APP'));
  assert.equal(api.getBanners('APP', true).length, 0);
});

test('creation assigns the selected channel and never inherits the other tab', async () => {
  const { api } = harness(async (method, _url, body) => {
    assert.equal(method, 'post'); assert.equal(body.platform, 'APP');
    return { data: banner('new-app', body.platform) };
  });
  await api.addBanner({ title: 'App banner', platform: 'WEB' }, 'APP');
  assert.equal(api.getBanners('APP', true)[0].id, 'new-app');
  assert.equal(api.getBanners('WEB', true).length, 0);
});

test('browser storage quota does not turn a confirmed response into a failed save', async () => {
  const { api, browserStorage } = harness(async () => ({ data: [banner('app', 'APP')] }));
  browserStorage.setItem = () => { throw Error('quota exceeded'); };
  await api.fetchBanners(true, 'APP');
  assert.equal(api.getBanners('APP', true)[0].id, 'app');
});
