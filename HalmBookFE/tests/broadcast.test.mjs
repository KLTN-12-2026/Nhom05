import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { beforeEach, test } from 'node:test';
import axiosClient from '../src/services/axiosClient.js';
import { saveAdminAuthSession } from '../src/services/authToken.js';
import { broadcastNotification } from '../src/services/adminSupportService.js';

const storage = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) }; };
const login = sub => saveAdminAuthSession({ token: `header.${Buffer.from(JSON.stringify({ sub, exp: Date.now() / 1000 + 3600 })).toString('base64url')}.signature`, role: 'ADMIN' });
const payload = { title: 'Fixture notice', message: 'First line\nSecond line', target: 'all', destination: 'inbox' };
beforeEach(() => { globalThis.localStorage = storage(); globalThis.sessionStorage = storage(); globalThis.window = undefined; login(randomUUID()); });

test('a lost broadcast response reuses the same ID instead of delivering twice', async () => {
  const ids = []; const delivered = new Set(); let lose = true;
  axiosClient.defaults.adapter = async config => {
    const body = JSON.parse(config.data); ids.push(body.requestId); delivered.add(body.requestId);
    assert.equal(config.url, '/api/admin/support-tickets/broadcast'); assert.ok(config.headers.Authorization);
    if (lose) { lose = false; throw Error('response lost'); }
    return { config, data: { success: true, sentCount: 3, broadcastId: body.requestId, replayed: true }, status: 200, headers: {} };
  };
  await assert.rejects(broadcastNotification(payload));
  assert.equal((await broadcastNotification(payload)).sentCount, 3);
  assert.equal(ids[0], ids[1]); assert.equal(delivered.size, 1);
});

test('a new intentional broadcast after confirmation receives a new operation ID', async () => {
  const ids = [];
  axiosClient.defaults.adapter = async config => {
    const body = JSON.parse(config.data); ids.push(body.requestId);
    return { config, data: { success: true, sentCount: 0, broadcastId: body.requestId }, status: 200, headers: {} };
  };
  await broadcastNotification(payload); await broadcastNotification(payload); assert.notEqual(ids[0], ids[1]);
});

test('an uncertain request ID survives a service reload in the same admin tab', async () => {
  const ids = [];
  axiosClient.defaults.adapter = async config => { ids.push(JSON.parse(config.data).requestId); throw Error('offline'); };
  await assert.rejects(broadcastNotification(payload));
  const reloaded = await import('../src/services/adminSupportService.js?broadcast-reload-test');
  await assert.rejects(reloaded.broadcastNotification(payload)); assert.equal(ids[0], ids[1]);
});

test('invalid confirmations preserve the operation for retry and cannot show success', async () => {
  const ids = [];
  axiosClient.defaults.adapter = async config => {
    ids.push(JSON.parse(config.data).requestId);
    return { config, data: { success: true, sentCount: -1, broadcastId: 'wrong' }, status: 200, headers: {} };
  };
  await assert.rejects(broadcastNotification(payload)); await assert.rejects(broadcastNotification(payload)); assert.equal(ids[0], ids[1]);
});

function pageHarness(api) {
  const controls = [ {}, {}, {} ], notices = [], elements = new Map();
  const element = (value = '') => ({ value, textContent: '', classList: { add() {}, remove() {} }, querySelectorAll: () => controls });
  for (const [id, value] of Object.entries({ broadcastTitle: 'Title', broadcastContent: 'Body', broadcastTarget: 'all', broadcastDestination: 'inbox', broadcastStatus: '', broadcastSubmit: '', broadcastModal: '' })) elements.set(id, element(value));
  const context = vm.createContext({ console, Number, document: { addEventListener() {}, getElementById: id => elements.get(id) },
    window: { AdminSupportAPI: api, dispatchEvent() {}, addEventListener() {} }, CustomEvent: class {},
    localStorage: { setItem: () => { throw Error('must never write a local-only broadcast'); } },
  });
  vm.runInContext(readFileSync(new URL('../src/components/admin/js/thongBaoHoTroPage.js', import.meta.url), 'utf8'), context);
  context.captureToast = (...args) => notices.push(args);
  vm.runInContext('showAdminToast = captureToast;', context);
  return { page: context.window, controls, notices, elements };
}

test('admin form disables repeat sends and shows only the confirmed recipient count', async () => {
  let calls = 0, finish;
  const h = pageHarness({ broadcast: () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
  const sending = h.page.submitBroadcast(); await h.page.submitBroadcast();
  assert.equal(calls, 1); assert.ok(h.controls.every(control => control.disabled));
  finish({ success: true, sentCount: 5 }); await sending;
  assert.equal(h.elements.get('broadcastTitle').value, ''); assert.match(h.elements.get('broadcastStatus').textContent, /5/);
  assert.equal(h.notices.at(-1)[2], 'success'); assert.ok(h.controls.every(control => !control.disabled));
});

test('missing API keeps the draft and never reports a local broadcast as delivered', async () => {
  const h = pageHarness({}); await h.page.submitBroadcast();
  assert.equal(h.elements.get('broadcastTitle').value, 'Title'); assert.equal(h.notices.at(-1)[2], 'error');
  assert.ok(h.controls.every(control => !control.disabled));
});
