const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/ux-ui/favoriteService.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function setup() {
  let token = 'test-token';
  let cached = '[]';
  let favorite = false;
  let malformed = false;
  const calls = [];
  const axios = {
    post: async (url, body, config) => {
      calls.push({ url, body, config });
      favorite = !favorite;
      return { data: malformed ? {} : { isFavorite: favorite } };
    },
    get: async url => ({ data: url.includes('/check/') ? { isFavorite: favorite } : favorite ? [{ bookId: 'BOOK 1', title: 'A book', imgUrl: '/cover.jpg' }] : [] }),
  };
  const context = {
    exports: {}, console: { warn: () => {} },
    require: name => {
      if (name === 'axios') return { __esModule: true, default: axios };
      if (name.includes('async-storage')) return { __esModule: true, default: { getItem: async () => token } };
      if (name === './apiService') return { API_BASE_URL: 'https://example.test' };
      if (name === './userStorage') return { KEY_FAVORITES_BOOKS: 'favorites', getUserItem: async () => cached, setUserItem: async (_, value) => { cached = value; } };
      throw new Error(name);
    },
  };
  vm.runInNewContext(compiled, context);
  return { api: context.exports, calls, cache: () => JSON.parse(cached), logout: () => { token = null; }, malformed: () => { malformed = true; }, fail: () => { axios.post = async () => { throw new Error('network unavailable'); }; } };
}
const book = { id: 'BOOK 1', title: 'A book', author: 'Author', img_url: '/cover.jpg' };
test('heart saves the selected book with its cover and authorization', async () => {
  const { api, calls, cache } = setup();
  const result = await api.toggleFavoriteBook(book);
  assert.equal(result.success, true);
  assert.equal(result.isFavorite, true);
  assert.equal(calls[0].url, 'https://example.test/api/home/favorites/BOOK%201');
  assert.equal(calls[0].config.headers.Authorization, 'Bearer test-token');
  assert.equal(cache()[0].title, book.title);
  assert.equal(cache()[0].img_url, book.img_url);
  assert.equal(await api.checkBookIsFavorite(book.id), true);
});
test('second heart removes the book and refreshed favorites stays empty', async () => {
  const { api, cache } = setup();
  await api.toggleFavoriteBook(book);
  assert.equal((await api.toggleFavoriteBook(book)).isFavorite, false);
  assert.equal(cache().length, 0);
  assert.equal((await api.fetchFavoriteBooksFromApi()).length, 0);
  assert.equal(await api.checkBookIsFavorite(book.id), false);
});
test('failed sync preserves the saved favorite', async () => {
  const state = setup();
  await state.api.toggleFavoriteBook(book);
  state.fail();
  assert.equal((await state.api.toggleFavoriteBook(book)).success, false);
  assert.equal(state.cache().length, 1);
});
test('guest cannot create account favorites', async () => {
  const state = setup(); state.logout();
  const result = await state.api.toggleFavoriteBook(book);
  assert.equal(result.requireLogin, true);
  assert.equal(state.calls.length, 0);
  assert.equal(state.cache().length, 0);
});
test('malformed server confirmation does not silently clear local state', async () => {
  const state = setup();
  await state.api.toggleFavoriteBook(book);
  state.malformed();
  assert.equal((await state.api.toggleFavoriteBook(book)).success, false);
  assert.equal(state.cache().length, 1);
});
