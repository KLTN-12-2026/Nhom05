const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const realAxios = require('axios');

function load(name, mocks, extra = {}) {
  const source = fs.readFileSync(__dirname + '/../src/ux-ui/' + name + '.ts', 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports: {}, URL, AbortController, setInterval, clearInterval, setTimeout, clearTimeout, console,
    require: name => { if (name === './commercePolicy') return load('commercePolicy', mocks); if (!(name in mocks)) throw Error('Unexpected import ' + name); return mocks[name]; }, ...extra };
  vm.runInNewContext(code, context);
  return context.exports;
}
function sessionHarness() {
  let token = 'current', responder;
  const failures = [];
  const client = realAxios.create({ adapter: async config => responder(config) });
  client.CanceledError = realAxios.CanceledError;
  const security = load('sessionSecurity', {
    axios: { __esModule: true, default: client, CanceledError: realAxios.CanceledError },
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async () => token } },
  });
  const cleanup = security.installSessionSecurity('https://api.invalid', async failure => { failures.push(failure); token = null; });
  return { client, failures, cleanup, setToken: value => { token = value; }, respond: fn => { responder = fn; },
    request: (path = '/api/auth/me', bearer = 'current') => client.get('https://api.invalid' + path, { headers: bearer ? { Authorization: 'Bearer ' + bearer } : {} }) };
}
const rejectStatus = status => config => Promise.reject({ config, response: { status, data: {} } });

test('concurrent account locks clear the session once and cannot replay an old successful response', async () => {
  const h = sessionHarness(); h.respond(rejectStatus(423));
  await Promise.allSettled([h.request(), h.request(), h.request()]);
  assert.equal(h.failures.length, 1); assert.equal(h.failures[0].reason, 'locked');
  h.respond(config => ({ config, data: { private: true }, status: 200, headers: {} }));
  await assert.rejects(h.request(), error => realAxios.isCancel(error));
  h.setToken('new');
  assert.equal((await h.request('/api/auth/me', 'new')).status, 200);
  h.cleanup();
});

test('expired authenticated requests invalidate only the current account', async () => {
  const h = sessionHarness(); h.respond(rejectStatus(401));
  h.setToken('new'); await assert.rejects(h.request()); assert.equal(h.failures.length, 0);
  await assert.rejects(h.request('/api/auth/me', 'new'));
  assert.equal(h.failures.length, 1); assert.equal(h.failures[0].reason, 'expired'); h.cleanup();
});

test('failed login, foreign requests, denied book and network errors never log out a valid session', async () => {
  const h = sessionHarness(); h.respond(rejectStatus(401));
  await assert.rejects(h.request('/api/auth/login'));
  await assert.rejects(h.request('/api/home/books', null));
  await assert.rejects(h.client.get('https://foreign.invalid/api/private', { headers: { Authorization: 'Bearer current' } }));
  h.respond(rejectStatus(403)); await assert.rejects(h.request('/api/home/books/book/read-url'));
  h.respond(config => Promise.reject({ config, message: 'offline' })); await assert.rejects(h.request());
  assert.equal(h.failures.length, 0); h.cleanup();
});

const allowed = { hasAccess: true, status: 'ACTIVE', checkedFromServer: true, currentPage: 1, remainingDays: 7, readingPercentage: 0, isForever: false };
test('pause and disposal prevent late grants; foreground always starts a fresh check', async () => {
  const pending = [], changes = [], timers = new Set();
  const monitorApi = load('readingAccessMonitor', {}, { setInterval: fn => { timers.add(fn); return fn; }, clearInterval: fn => timers.delete(fn) });
  const monitor = monitorApi.createReadingAccessMonitor(signal => new Promise(resolve => pending.push({ signal, resolve })), detail => changes.push(detail));
  const first = monitor.resume(); assert.equal(changes.at(-1).status, 'CHECKING');
  monitor.pause(); assert.equal(changes.at(-1).hasAccess, false); assert.equal(pending[0].signal.aborted, true);
  const second = monitor.resume(); pending[0].resolve(allowed); await first;
  assert.equal(changes.at(-1).status, 'CHECKING');
  pending[1].resolve(allowed); await second; assert.equal(changes.at(-1).hasAccess, true);
  const next = monitor.refresh(); monitor.stop(); pending[2].resolve(allowed); await next;
  assert.equal(timers.size, 0); assert.equal(changes.filter(d => d.hasAccess).length, 1);
});

test('periodic verification removes a revoked grant and overlapping refreshes share a request', async () => {
  let tick, resolveCheck, calls = 0; const changes = [];
  const api = load('readingAccessMonitor', {}, { setInterval: fn => { tick = fn; return 1; }, clearInterval() {} });
  const monitor = api.createReadingAccessMonitor(() => { calls++; return new Promise(resolve => { resolveCheck = resolve; }); }, detail => changes.push(detail));
  const initial = monitor.resume(); resolveCheck(allowed); await initial;
  tick(); const a = monitor.refresh(), b = monitor.refresh(); assert.equal(a, b); assert.equal(calls, 2);
  resolveCheck({ ...allowed, hasAccess: false, status: 'REVOKED' }); await a;
  assert.equal(changes.at(-1).status, 'REVOKED'); assert.equal(changes.at(-1).hasAccess, false); monitor.stop();
});

test('a stalled renewal expires the previous grant and cannot restore it through a late response', async () => {
  const pending = [], changes = [], deadlines = new Set(); let tick;
  const api = load('readingAccessMonitor', {}, {
    setInterval: fn => { tick = fn; return 1; }, clearInterval() {},
    setTimeout: fn => { deadlines.add(fn); return fn; }, clearTimeout: fn => deadlines.delete(fn),
  });
  const monitor = api.createReadingAccessMonitor(() => new Promise(resolve => pending.push(resolve)), detail => changes.push(detail));
  const initial = monitor.resume(); pending[0](allowed); await initial;
  tick(); const stalled = monitor.refresh();
  [...deadlines][0](); assert.equal(changes.at(-1).hasAccess, false);
  pending[1](allowed); await stalled; assert.equal(changes.at(-1).hasAccess, false);
  pending[2]({ ...allowed, hasAccess: false, status: 'REVOKED' }); await monitor.refresh(); monitor.stop();
});

function rentalHarness(handler, cached = []) {
  const cacheReads = [], writes = new Map();
  const api = load('rentalService', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async () => 'token' } },
    './apiService': { API_BASE_URL: 'https://api.invalid', fetchApiWithFallback: handler, normalizeAssetUrl: value => value },
    './userStorage': { KEY_POTATO_BALANCE: 'balance', getUserItem: async key => { cacheReads.push(key); return JSON.stringify(cached); }, setUserItem: async (key, value) => writes.set(key, value) },
  });
  return { api, cacheReads, writes };
}

test('cached grants cannot authorize offline, forbidden, locked or expired sessions', async () => {
  for (const status of [undefined, 401, 403, 423, 404]) {
    let requests = 0;
    const { api, cacheReads } = rentalHarness(async () => { requests++; throw { response: status ? { status } : undefined }; }, [{ bookId: 'book', expired: false }]);
    const result = await api.checkBookAccessDetailApi('book');
    assert.equal(result.hasAccess, false); assert.equal(cacheReads.length, 0); assert.equal(requests, 1);
  }
});

test('a revoked status cannot grant access even with a contradictory response', async () => {
  const { api } = rentalHarness(async () => ({ data: { ...allowed, status: 'REVOKED' } }));
  assert.equal((await api.checkBookAccessDetailApi('book')).hasAccess, false);
});

test('future-dated and forever revoked books remain historical rather than active', async () => {
  const { api } = rentalHarness(async () => ({ baseUrl: 'https://api.invalid', data: [
    { bookId: 'active', status: 'ACTIVE', remainingDays: 7 },
    { bookId: 'revoked', status: 'REVOKED', remainingDays: 10000, isForever: true },
    { bookId: 'rejected', status: 'REJECTED', remainingDays: 10 },
  ] }));
  const result = await api.fetchBookshelfFromApi();
  assert.equal(result.books.map(b => b.id).join(','), 'active');
  assert.equal(result.expiredBooks.find(b => b.id === 'revoked').status, 'REVOKED');
  assert.equal(result.expiredBooks.find(b => b.id === 'rejected').status, 'REJECTED');
});

test('locked bookshelf requests never fall back to cached active rentals', async () => {
  const { api, cacheReads } = rentalHarness(async () => { throw { response: { status: 423 } }; }, [{ bookId: 'cached' }]);
  const result = await api.fetchBookshelfFromApi();
  assert.equal(result.books.length, 0); assert.equal(result.requireLogin, true); assert.equal(cacheReads.length, 0);
});

test('local session invalidation closes the reader and cancels pending actions before storage completes', async () => {
  const source = fs.readFileSync(__dirname + '/../App.tsx', 'utf8');
  const tree = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let initializer;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(tree) === 'clearLocalSession') initializer = node.initializer.getText(tree);
    ts.forEachChild(node, visit);
  }
  visit(tree); assert.ok(initializer);
  let completeStorage, removed, routes, authenticated = true, aborted = false;
  const pendingAction = { current: () => {} }, epoch = { current: 0 };
  const context = { useCallback: fn => fn, sessionEpoch: epoch, pendingAuthAction: pendingAction,
    chatRequest: { current: { abort: () => { aborted = true; } } },
    setIsChatLoading() {}, setChatMessages() {}, setSessionActive: value => { authenticated = value; },
    setIsLoggedIn() {}, setAuthModal() {}, setUserAvatarUrl() {}, setUserInitial() {}, setRoutes: value => { routes = value; },
    AsyncStorage: { multiRemove: keys => { removed = keys; return new Promise(resolve => { completeStorage = resolve; }); } },
    clearLegacyBookshelfKeys: async () => {},
  };
  vm.runInNewContext(ts.transpileModule('globalThis.clear = ' + initializer, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  const operation = context.clear();
  assert.equal(authenticated, false); assert.equal(aborted, true); assert.equal(routes[0].name, 'home');
  assert.equal(pendingAction.current, null); assert.equal(epoch.current, 1);
  assert.ok(removed.includes('userToken')); assert.ok(removed.includes('savedRoutes')); assert.ok(removed.includes('currentUsername'));
  completeStorage(); await operation;
});
