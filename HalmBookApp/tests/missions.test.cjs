const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');

function load(file, mocks, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(__dirname + '/../src/ux-ui/' + file + '.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = { exports: {}, AbortController, ...globals, require: key => { if (!(key in mocks)) throw Error(key); return mocks[key]; } };
  vm.runInNewContext(code, context); return context.exports;
}
test('mission claims send only the ID, authenticate and propagate a lost response for safe retry', async () => {
  const calls = []; let fail = false; let token = 'reader-token';
  const service = load('missionService', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async () => token } },
    './apiService': { fetchApiWithFallback: async (path, config) => { calls.push({ path, config }); if (fail) throw Error('response lost'); return { data: { newBalance: 25, missions: [] } }; } },
  });
  await service.claimMission('m1');
  assert.equal(calls[0].path, '/api/home/missions/claim'); assert.equal(calls[0].config.headers.Authorization, 'Bearer reader-token');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].config.data)), { missionId: 'm1' });
  fail = true; await assert.rejects(service.claimMission('m1'), /response lost/);
  token = null; const before = calls.length; await assert.rejects(service.getMissions(), /đăng nhập/); assert.equal(calls.length, before);
});
function trackingHarness(server = async () => {}) {
  let cleanup, listener; const timers = new Set(); const calls = [];
  const app = { currentState: 'active', addEventListener: (_event, callback) => { listener = callback; return { remove: () => { listener = null; } }; } };
  const api = load('useMissionTracking', {
    react: { useEffect: fn => { cleanup = fn(); } }, 'react-native': { AppState: app },
    './missionService': {
      readingMissionHeartbeat: async (...args) => { calls.push(args); await server(...args); },
      recordMissionVisit: async (...args) => { calls.push(args); await server(...args); },
    },
  }, { setInterval: fn => { timers.add(fn); return fn; }, clearInterval: fn => timers.delete(fn), Date, Math });
  return { api, calls, timers, cleanup: () => cleanup?.(), tick: async () => { for (const fn of [...timers]) fn(); await new Promise(setImmediate); }, change: state => { app.currentState = state; listener?.(state); } };
}
test('reader heartbeat stops in background, starts a new session on return and aborts on unmount', async () => {
  const h = trackingHarness(); h.api.useReadingMission('b1', true); await new Promise(setImmediate);
  assert.equal(h.calls.length, 1); const first = h.calls[0];
  await h.tick(); assert.equal(h.calls.length, 2); assert.equal(h.calls[1][1], first[1]);
  h.change('background'); assert.equal(first[2].aborted, true); await h.tick(); assert.equal(h.calls.length, 2);
  h.change('active'); await new Promise(setImmediate); assert.equal(h.calls.length, 3); assert.notEqual(h.calls[2][1], first[1]);
  h.cleanup(); assert.equal(h.calls[2][2].aborted, true); assert.equal(h.timers.size, 0);
});
test('reader does not count unloaded content and stops after access is revoked', async () => {
  const idle = trackingHarness(); idle.api.useReadingMission('b1', false); await idle.tick(); assert.equal(idle.calls.length, 0);
  const revoked = trackingHarness(async () => { throw { response: { status: 403 } }; });
  revoked.api.useReadingMission('b1', true); await new Promise(setImmediate); await revoked.tick(); assert.equal(revoked.calls.length, 1); assert.equal(revoked.timers.size, 0);
});
test('heartbeat requests never overlap when the network is slow', async () => {
  let release; const h = trackingHarness(() => new Promise(resolve => { release = resolve; }));
  h.api.useReadingMission('b1', true); await h.tick(); await h.tick(); assert.equal(h.calls.length, 1);
  release(); await new Promise(setImmediate); await h.tick(); assert.equal(h.calls.length, 2); h.cleanup(); release();
});
test('visit progress is recorded only while the signed-in screen is active', async () => {
  const h = trackingHarness(); h.api.useMissionVisit('OFFERS', false); assert.equal(h.calls.length, 0);
  h.api.useMissionVisit('BOOKSHELF', true); await new Promise(setImmediate); assert.equal(h.calls[0][0], 'BOOKSHELF');
  h.change('background'); assert.equal(h.calls.length, 1); h.change('active'); await new Promise(setImmediate); assert.equal(h.calls.length, 2); h.cleanup();
});
