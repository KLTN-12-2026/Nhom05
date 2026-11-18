const { Buffer } = require('node:buffer');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function moduleUnderTest(name, mocks, extra = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src/ux-ui/', name + '.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports: {}, URL, Blob, AbortController, TextDecoder, Uint8Array, DataView, console, process: { env: {} },
    require: name => { if (!(name in mocks)) throw Error('Unexpected dependency: ' + name); return mocks[name]; }, ...extra };
  vm.runInNewContext(code, context);
  return context.exports;
}
function rentalHarness(handler) {
  const values = new Map([['userToken', 'token'], ['currentUsername', 'alice']]);
  const storage = { getItem: async key => values.get(key) ?? null, setItem: async (key, value) => values.set(key, value), removeItem: async key => values.delete(key) };
  const api = moduleUnderTest('rentalService', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: storage },
    './apiService': { API_BASE_URL: 'https://app.invalid', fetchApiWithFallback: handler },
    './userStorage': { KEY_POTATO_BALANCE: 'balance', setUserItem: storage.setItem, getUserItem: storage.getItem },
  });
  return { api, values };
}
const items = [{ bookId: 'catalog-1', durationDays: 7, price: 999 }];

test('uncertain checkout retry reuses its operation key instead of charging again', async () => {
  const keys = []; const paid = new Set(); let loseResponse = true;
  const { api } = rentalHarness(async (endpoint, config) => {
    assert.equal(endpoint, '/api/home/checkout');
    keys.push(config.data.idempotencyKey); paid.add(config.data.idempotencyKey);
    if (loseResponse) { loseResponse = false; throw Error('response lost after commit'); }
    return { data: { totalKhoaiPaid: 9, remainingPotatoBalance: 91 } };
  });
  assert.equal((await api.checkoutBooksApi(items)).success, false);
  assert.equal((await api.checkoutBooksApi(items)).success, true);
  assert.equal(keys.length, 2); assert.equal(keys[0], keys[1]); assert.equal(paid.size, 1);
});

test('simultaneous checkout taps share one request', async () => {
  let calls = 0;
  const { api } = rentalHarness(async () => { calls++; await new Promise(resolve => setTimeout(resolve, 10)); return { data: { remainingPotatoBalance: 91 } }; });
  const results = await Promise.all([api.checkoutBooksApi(items), api.checkoutBooksApi(items)]);
  assert.equal(calls, 1); assert.ok(results.every(result => result.success));
});

test('catalog PDF URLs cannot turn a catalog book into a personal document', () => {
  const { api } = rentalHarness(async () => {});
  assert.equal(api.isPersonalOrLocalBook({ id: 'catalog-1', pdf_url: 'https://example.invalid/book.pdf' }), false);
  assert.equal(api.isPersonalOrLocalBook({ id: 'catalog-1', isPersonal: true }), false);
  assert.equal(api.isPersonalOrLocalBook({ id: 'uploaded_123', isPersonal: true, fileUri: 'file:///book.pdf' }), true);
  assert.equal(api.calculateDynamicKhoai(200, 7), 9);
});

test('a timed-out mutation is sent once to the configured server', async () => {
  let calls = 0;
  const axios = async config => { calls++; assert.equal(config.url, 'http://192.168.1.20:8082/api/pay'); throw Error('timeout'); };
  const api = moduleUnderTest('apiService', {
    'expo-constants': { __esModule: true, default: { expoConfig: { hostUri: '192.168.1.20:8081' } } },
    'react-native': { Platform: { OS: 'android' } }, axios: { __esModule: true, default: axios },
  });
  await assert.rejects(api.fetchApiWithFallback('/api/pay', { method: 'POST' }));
  assert.equal(calls, 1);
  assert.equal(api.normalizeAssetUrl('http://localhost:8082/uploads/cover.jpg'), 'http://192.168.1.20:8082/uploads/cover.jpg');
});

function contentHarness({ token = 'token', url = '/uploads/pdfs/book.pdf', denied = false } = {}) {
  let requests = 0; const headers = [];
  const api = moduleUnderTest('catalogContentService', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async () => token } },
    'react-native': { Platform: { OS: 'web' } },
    './apiService': { API_BASE_URL: 'https://api.invalid', normalizeAssetUrl: value => new URL(value, 'https://api.invalid').href,
      fetchApiWithFallback: async () => { if (denied) throw Error('403'); return { data: { readUrl: url, fileFormat: 'PDF' } }; } },
    './pdfExtractor': { extractPdfBytesChapters: () => [] }, pako: { __esModule: true, default: {} },
  }, { fetch: async (_url, config) => { requests++; headers.push(config.headers); return { ok: true, arrayBuffer: async () => new Uint8Array([37, 80, 68, 70]).buffer }; } });
  return { api, headers, count: () => requests };
}
test('reader never downloads a document before entitlement succeeds', async () => {
  for (const options of [{ token: null }, { denied: true }]) {
    const harness = contentHarness(options);
    await assert.rejects(harness.api.loadCatalogContent('book', 'Title', 'Author', new AbortController().signal));
    assert.equal(harness.count(), 0);
  }
});
test('reader authenticates local files without disclosing JWT to a signed cloud URL', async () => {
  const local = contentHarness();
  const document = await local.api.loadCatalogContent('book', 'Title', 'Author', new AbortController().signal);
  assert.equal(local.headers[0].Authorization, 'Bearer token'); document.dispose();
  const cloud = contentHarness({ url: 'https://cloud.invalid/signed-book.pdf' });
  const cloudDocument = await cloud.api.loadCatalogContent('book', 'Title', 'Author', new AbortController().signal);
  assert.equal(cloud.headers[0], undefined); cloudDocument.dispose();
});

// A minimal uncompressed ZIP fixture, with the directory deliberately in a different order from the EPUB spine.
function epubFixture(files) {
  const locals = [], central = []; let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const filename = Buffer.from(name), body = Buffer.from(text), header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50); header.writeUInt32LE(body.length, 18); header.writeUInt32LE(body.length, 22); header.writeUInt16LE(filename.length, 26);
    locals.push(header, filename, body);
    const directory = Buffer.alloc(46); directory.writeUInt32LE(0x02014b50); directory.writeUInt32LE(body.length, 20); directory.writeUInt32LE(body.length, 24);
    directory.writeUInt16LE(filename.length, 28); directory.writeUInt32LE(offset, 42); central.push(directory, filename);
    offset += header.length + filename.length + body.length;
  }
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(central.length / 2, 10); end.writeUInt32LE(Buffer.concat(central).length, 12); end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...locals, ...central, end]));
}
test('EPUB reader follows spine order and renders text without executing HTML', () => {
  const { api } = contentHarness();
  const bytes = epubFixture({
    'META-INF/container.xml': '<container><rootfile full-path="OEBPS/content.opf"/></container>',
    'OEBPS/content.opf': '<package><manifest><item id="one" href="one.xhtml"/><item id="two" href="two.xhtml"/></manifest><spine><itemref idref="two"/><itemref idref="one"/></spine></package>',
    'OEBPS/one.xhtml': '<body><h1>Một</h1><p>First</p></body>',
    'OEBPS/two.xhtml': '<body><h1>Hai</h1><script>alert(1)</script><p>Second &amp; safe</p></body>',
  });
  const chapters = api.extractEpubChapters(bytes);
  assert.equal(chapters[0].title, 'Hai'); assert.equal(chapters[1].title, 'Một');
  assert.ok(chapters[0].content.includes('Second & safe')); assert.ok(!chapters[0].content.join('').includes('alert'));
  assert.throws(() => api.extractEpubChapters(new Uint8Array(0)));
});
