const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/ux-ui/notificationService.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function setup(server = async () => { throw Error("offline"); }) {
  const values = new Map([['currentUsername', 'alice']]);
  let failWrite = false;
  const storage = {
    getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => {
      await new Promise(resolve => setTimeout(resolve, 2));
      if (failWrite) throw new Error('storage unavailable');
      values.set(key, value);
    },
  };
  const context = { exports: {}, require: name => name === './apiService' ? { fetchApiWithFallback: server } : name === './userStorage'
    ? { getCurrentUsername: async () => (values.get('currentUsername') || 'guest').toLowerCase() }
    : { __esModule: true, default: storage } };
  vm.runInNewContext(compiled, context);
  return { api: context.exports, values, fail: value => { failWrite = value; } };
}
const message = title => ({ type: 'system', title, message: 'Test notification' });

test('new account has an empty inbox, with no synthetic transactions', async () => {
  const { api } = setup();
  assert.equal((await api.getNotifications()).length, 0);
});
test('simultaneous additions preserve every notification', async () => {
  const { api } = setup();
  await Promise.all(Array.from({ length: 12 }, (_, i) => api.addNotification(message(`Event ${i}`))));
  const list = await api.getNotifications();
  assert.equal(list.length, 12);
  assert.equal(new Set(list.map(item => item.id)).size, 12);
  assert.equal(await api.getUnreadNotificationCount(), 12);
});
test('read and delete operations preserve unrelated concurrent additions', async () => {
  const { api } = setup();
  const first = await api.addNotification(message('First'));
  await Promise.all([api.markNotificationAsRead(first.id), api.addNotification(message('Second'))]);
  assert.equal((await api.getNotifications()).find(item => item.id === first.id).isRead, true);
  assert.equal(await api.getUnreadNotificationCount(), 1);
  await Promise.all([api.deleteNotification(first.id), api.addNotification(message('Third'))]);
  assert.equal((await api.getNotifications()).length, 2);
});
test('accounts have independent inboxes', async () => {
  const { api, values } = setup();
  await api.addNotification(message('Alice'));
  await api.addNotification(message('Bob'), 'bob');
  values.set('currentUsername', 'bob');
  assert.equal((await api.getNotifications())[0].title, 'Bob');
  await api.clearAllNotifications();
  assert.equal((await api.getNotifications('alice')).length, 1);
  assert.equal((await api.getNotifications('bob')).length, 0);
});
test('read all and clear persist across subsequent reads', async () => {
  const { api } = setup();
  await api.addNotification(message('One'));
  await api.markAllNotificationsAsRead();
  assert.equal(await api.getUnreadNotificationCount(), 0);
  await api.clearAllNotifications();
  assert.equal((await api.getNotifications()).length, 0);
});
test('subscribers update only after successful writes and can unsubscribe', async () => {
  const { api, fail } = setup();
  let updates = 0;
  const unsubscribe = api.subscribeNotifications(() => updates++);
  await api.addNotification(message('First'));
  assert.equal(updates, 1);
  fail(true);
  await assert.rejects(api.addNotification(message('Failed')));
  assert.equal(updates, 1);
  fail(false);
  unsubscribe();
  await api.addNotification(message('Recovered'));
  assert.equal(updates, 1);
  assert.equal((await api.getNotifications()).length, 2);
});
test('corrupted storage surfaces an error instead of silently losing history', async () => {
  const { api, values } = setup();
  values.set('user_notifications_v1_alice', '{broken');
  await assert.rejects(api.getNotifications());
  await assert.rejects(api.addNotification(message('Should not overwrite')));
  assert.equal(values.get('user_notifications_v1_alice'), '{broken');
});

test('an older server response cannot overwrite concurrent additions or resurrect a deleted notification', async () => {
  let resolveRequest;
  const { api, values } = setup(() => new Promise(resolve => { resolveRequest = resolve; }));
  values.set('userToken', 'token');
  const remote = { id: 'be_7', backendId: 7, type: 'system', title: 'Old', message: 'Old', timestamp: 1, time: '', isRead: false };
  values.set('user_notifications_v2_alice', JSON.stringify([remote]));
  const loading = api.getNotifications();
  await new Promise(resolve => setImmediate(resolve));
  await api.deleteNotification('be_7');
  await api.addNotification(message('Concurrent'));
  resolveRequest({ data: { notifications: [{ notificationId: 7, title: 'Old', createdAt: 1 }] } });
  const list = await loading;
  assert.equal(list.length, 1); assert.equal(list[0].title, 'Concurrent');
});
test('corrupted v2 storage is preserved and reported', async () => {
  const { api, values } = setup();
  values.set('user_notifications_v2_alice', '{broken');
  await assert.rejects(api.getNotifications()); await assert.rejects(api.addNotification(message('Never overwrite')));
  assert.equal(values.get('user_notifications_v2_alice'), '{broken');
});

test('inbox and badge share a broadcast fetch and retain the server unread state and destination', async () => {
  let requests = 0, finish;
  const { api, values } = setup(() => { requests++; return new Promise(resolve => { finish = resolve; }); });
  values.set('userToken', 'token');
  const inbox = api.getNotifications(), badge = api.getUnreadNotificationCount();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests, 1);
  finish({ data: { unreadCount: 1, notifications: [{ notificationId: 42, type: 'SYSTEM', title: 'Broadcast', message: 'Full message', link: '/uudai', isRead: false, createdAt: '2026-11-20T12:00:00' }] } });
  const [list, count] = await Promise.all([inbox, badge]);
  assert.equal(count, 1); assert.equal(list.length, 1); assert.equal(list[0].type, 'system');
  assert.equal(list[0].backendId, 42); assert.equal(list[0].link, '/uudai'); assert.equal(list[0].message, 'Full message');
});

test('broadcast links resolve to the matching App screen and reject unknown/external destinations', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/ux-ui/notificationDestination.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports: {} }; vm.runInNewContext(compiled, context);
  const destination = context.exports.notificationDestination;
  for (const [link, screen] of [['/', 'home'], ['/uudai', 'offers'], ['/danhmuc', 'categories'], ['/tusachcn', 'bookshelf'], ['/canhan', 'profile'], ['/canhan?tab=wallet', 'transactions']]) assert.equal(destination(link), screen);
  for (const link of ['', 'javascript:alert(1)', '//foreign.invalid', 'https://foreign.invalid/uudai', '/admin', '__proto__']) assert.equal(destination(link), null);
});

test('badge polling runs while the App is active and cleans up listeners and timers', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/ux-ui/useUnreadNotificationCount.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  let effect, tick, onState, interval, requests = 0, cleaned = 0;
  const states = [], appState = { currentState: 'active', addEventListener: (_event, fn) => { onState = fn; return { remove: () => cleaned++ }; } };
  const context = { exports: {}, setInterval: (fn, ms) => { tick = fn; interval = ms; return 1; }, clearInterval: () => cleaned++,
    require: name => name === 'react' ? { useState: () => [0, value => states.push(value)], useEffect: fn => { effect = fn; } }
      : name === 'react-native' ? { AppState: appState }
      : { getUnreadNotificationCount: async () => { requests++; return 2; }, subscribeNotifications: () => () => cleaned++ },
  };
  vm.runInNewContext(code, context); context.exports.useUnreadNotificationCount(true); const stop = effect();
  await new Promise(resolve => setImmediate(resolve)); assert.equal(interval, 15000); assert.equal(requests, 1);
  tick(); await new Promise(resolve => setImmediate(resolve)); assert.equal(requests, 2);
  appState.currentState = 'background'; tick(); assert.equal(requests, 2);
  appState.currentState = 'active'; onState('active'); await new Promise(resolve => setImmediate(resolve)); assert.equal(requests, 3);
  stop(); assert.equal(cleaned, 3); assert.equal(states.at(-1), 2);
});
