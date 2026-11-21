import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { beforeEach, test } from 'node:test';
import axios from '../src/services/axiosClient.js';
import { saveAuthSession, saveAdminAuthSession } from '../src/services/authToken.js';
import { claimMission, getMissions, getAdminMissions, saveAdminMission } from '../src/services/missionService.js';
const storage = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) }; };
const token = sub => `h.${Buffer.from(JSON.stringify({ sub, exp: Date.now() / 1000 + 3600 })).toString('base64url')}.s`;
beforeEach(() => { globalThis.localStorage = storage(); globalThis.sessionStorage = storage(); globalThis.window = undefined; });
test('mission endpoints preserve separate user and admin sessions even when both are logged in', async () => {
  const user = token('alice'), admin = token('admin'); saveAuthSession({ token: user, role: 'USER' }); saveAdminAuthSession({ token: admin, role: 'ADMIN' });
  const calls = []; axios.defaults.adapter = async config => { calls.push(config); return { data: {}, status: 200, headers: {}, config }; };
  await getMissions(); await getAdminMissions(); await claimMission('m1');
  assert.equal(calls[0].headers.Authorization, 'Bearer ' + user); assert.equal(calls[1].headers.Authorization, 'Bearer ' + admin); assert.equal(calls[2].headers.Authorization, 'Bearer ' + user);
  assert.deepEqual(JSON.parse(calls[2].data), { missionId: 'm1' });
});
test('failed claims remain errors and retry uses the same mission identity', async () => {
  const calls = []; let fail = true;
  axios.defaults.adapter = async config => { calls.push(JSON.parse(config.data)); if (fail) throw Error('connection lost'); return { data: { alreadyClaimed: true, newBalance: 25 }, status: 200, headers: {}, config }; };
  await assert.rejects(claimMission('m1'), /connection lost/); fail = false;
  assert.equal((await claimMission('m1')).alreadyClaimed, true); assert.deepEqual(calls, [{ missionId: 'm1' }, { missionId: 'm1' }]);
});
test('admin saves existing missions by ID and creates new missions through the admin endpoint', async () => {
  const calls = []; axios.defaults.adapter = async config => { calls.push(config); return { data: {}, status: 200, headers: {}, config }; };
  await saveAdminMission({ id: 'm1', title: 'Updated', active: false }); await saveAdminMission({ title: 'New', condition: 'CHECKIN' });
  assert.equal(calls[0].method, 'put'); assert.equal(calls[0].url, '/api/admin/missions/m1'); assert.equal(JSON.parse(calls[0].data).active, false);
  assert.equal(calls[1].method, 'post'); assert.equal(calls[1].url, '/api/admin/missions');
});
test('web reader pauses while hidden, resets its session after return and cancels on disposal', async () => {
  let cleanup; const handlers = new Map(), timers = new Set(), calls = [];
  const document = { hidden: false, addEventListener: (event, fn) => handlers.set(event, fn), removeEventListener: event => handlers.delete(event) };
  const source = readFileSync(new URL('../src/hooks/useMissionTracking.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replaceAll('export function', 'function');
  const context = { useEffect: fn => { cleanup = fn(); }, isTokenValid: () => true, readingMissionHeartbeat: async (...args) => { calls.push(args); }, recordMissionVisit: async () => {}, document,
    window: { addEventListener() {}, removeEventListener() {} }, AbortController, crypto: { randomUUID }, setInterval: fn => { timers.add(fn); return fn; }, clearInterval: fn => timers.delete(fn), exports: {} };
  vm.runInNewContext(source + '\nexports.useReadingMission = useReadingMission;', context);
  context.exports.useReadingMission('b1', true); await new Promise(setImmediate); assert.equal(calls.length, 1);
  document.hidden = true; handlers.get('visibilitychange')(); assert.equal(calls[0][2].aborted, true); assert.equal(timers.size, 0);
  document.hidden = false; handlers.get('visibilitychange')(); await new Promise(setImmediate); assert.notEqual(calls[1][1], calls[0][1]);
  cleanup(); assert.equal(calls[1][2].aborted, true); assert.equal(timers.size, 0);
});
