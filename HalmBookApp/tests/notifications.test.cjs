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
function setup() {
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
  const context = { exports: {}, require: name => name === './userStorage'
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
