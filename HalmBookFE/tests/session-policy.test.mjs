import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthScope } from '../src/services/requestPolicy.js';
import { apiUrl, apiPath } from '../src/config/api.js';
import { readStoredJson, readStorage, writeStorage } from '../src/utils/browserStorage.js';
import { saveAuthSession, saveAdminAuthSession, clearAuthSession, clearAdminAuthSession, getAuthToken, getAdminAuthToken, isTokenValid } from '../src/services/authToken.js';
import axiosClient from '../src/services/axiosClient.js';
import { ROUTE_ALIASES } from '../src/constants/routes.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key) };
}
const jwt = role => `header.${Buffer.from(JSON.stringify({ role, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.signature`;
beforeEach(() => { globalThis.localStorage = memoryStorage(); globalThis.sessionStorage = memoryStorage(); });

test('admin page requests cannot change ownership of user endpoints', () => {
  globalThis.window = { location: { pathname: '/admin' } };
  assert.equal(resolveAuthScope({ url: '/api/home/customer/info' }), 'user');
  assert.equal(resolveAuthScope({ url: '/api/admin/books' }), 'admin');
  assert.equal(resolveAuthScope({ url: '/api/promotions' }), 'admin');
  assert.equal(resolveAuthScope({ url: '/api/auth/login' }), 'none');
  assert.equal(resolveAuthScope({ url: '/api/home/potato/packages/all' }), 'admin');
  assert.equal(resolveAuthScope({ url: '/api/home/potato/packages/1', method: 'put' }), 'admin');
  assert.equal(resolveAuthScope({ url: '/api/home/potato/packages', method: 'post' }), 'admin');
  assert.equal(resolveAuthScope({ url: '/api/home/potato/packages' }), 'user');
});

test('third-party PDF requests never receive an application session', () => {
  assert.equal(resolveAuthScope({ url: 'https://files.example.test/book.pdf', authScope: 'admin' }), 'none');
  assert.equal(apiPath('https://files.example.test/book.pdf'), null);
  assert.ok(apiUrl('/api/auth/logout').endsWith('/api/auth/logout'));
});

test('logout from either role preserves the other role', () => {
  const user = jwt('USER'), admin = jwt('ADMIN');
  saveAuthSession({ token: user, role: 'USER' });
  saveAdminAuthSession({ token: admin, role: 'ADMIN' });
  clearAdminAuthSession();
  assert.equal(getAuthToken(), user);
  assert.equal(getAdminAuthToken(), null);
  saveAdminAuthSession({ token: admin, role: 'ADMIN' });
  clearAuthSession();
  assert.equal(getAuthToken(), null);
  assert.equal(getAdminAuthToken(), admin);
});

test('remember=false removes a previous persistent user session', () => {
  saveAuthSession({ token: jwt('USER'), role: 'USER' });
  const session = jwt('USER');
  saveAuthSession({ token: session, role: 'USER' }, { remember: false });
  assert.equal(localStorage.getItem('token'), null);
  assert.equal(sessionStorage.getItem('token'), session);
  assert.equal(getAuthToken(), session);
});

test('malformed cache and unavailable browser storage do not crash', () => {
  localStorage.setItem('cache', '{broken');
  assert.deepEqual(readStoredJson('cache', []), []);
  globalThis.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
  assert.doesNotThrow(() => writeStorage('token', 'value'));
  assert.equal(readStorage('token'), null);
  assert.equal(getAuthToken(), null);
});

test('expired tokens cannot open protected pages', () => {
  const expired = `header.${Buffer.from(JSON.stringify({ exp: 1 })).toString('base64url')}.signature`;
  assert.equal(isTokenValid(expired), false);
  assert.equal(isTokenValid(jwt('USER')), true);
});

test('actual axios interceptor selects the owner and strips external authorization', async () => {
  const user = jwt('USER'), admin = jwt('ADMIN');
  saveAuthSession({ token: user, role: 'USER' });
  saveAdminAuthSession({ token: admin, role: 'ADMIN' });
  const adapter = async config => ({ status: 200, data: config.headers.Authorization ?? null, headers: {}, config });
  assert.equal((await axiosClient.get('/api/home/potato/wallet', { adapter })).data, 'Bearer ' + user);
  assert.equal((await axiosClient.get('/api/admin/books', { adapter })).data, 'Bearer ' + admin);
  assert.equal((await axiosClient.get('/api/home/potato/packages/all', { adapter })).data, 'Bearer ' + admin);
  assert.equal((await axiosClient.get('https://files.example.test/book.pdf', { adapter })).data, null);
});

test('a failed login never expires either existing session', async () => {
  const user = jwt('USER'), admin = jwt('ADMIN');
  saveAuthSession({ token: user, role: 'USER' });
  saveAdminAuthSession({ token: admin, role: 'ADMIN' });
  const adapter = async config => { throw Object.assign(new Error('invalid credentials'), { config, response: { status: 401, data: {} } }); };
  await assert.rejects(axiosClient.post('/api/auth/login', {}, { adapter }));
  assert.equal(getAuthToken(), user);
  assert.equal(getAdminAuthToken(), admin);
});

test('admin remember=false keeps only a session token', () => {
  const admin = jwt('ADMIN');
  saveAuthSession({ token: admin, role: 'ADMIN' }, { remember: false });
  assert.equal(localStorage.getItem('admin_token'), null);
  assert.equal(sessionStorage.getItem('admin_token'), admin);
});

test('route aliases do not shadow each other inside a guard group', () => {
  for (const aliases of Object.values(ROUTE_ALIASES)) {
    const paths = aliases.map(alias => alias.path);
    assert.equal(new Set(paths).size, paths.length);
  }
  assert.ok(ROUTE_ALIASES.user.some(alias => alias.to === '/canhan?tab=wallet'));
  assert.ok(ROUTE_ALIASES.admin.every(alias => alias.to.startsWith('/admin')));
});
