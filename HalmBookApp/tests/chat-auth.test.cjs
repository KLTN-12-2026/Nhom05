const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Extract the actual handler so the test exercises the app's auth gate without an Expo runtime.
const source = fs.readFileSync(path.join(__dirname, '../App.tsx'), 'utf8');
const tree = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(tree) === 'sendChatMessage') handler = node.initializer.getText(tree);
  ts.forEachChild(node, visit);
}
visit(tree);
assert.ok(handler);
const compiled = ts.transpileModule(`globalThis.send = ${handler};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
function setup({ loggedIn = true, token = 'token' } = {}) {
  const messages = [];
  const alerts = [];
  const requests = [];
  const context = {
    AbortController, Date, console: { warn() {} },
    isLoggedIn: loggedIn,
    isSessionActive: () => loggedIn,
    lang: 'vi',
    isChatLoading: false,
    chatRequest: { current: null },
    AsyncStorage: { getItem: async () => token },
    API_BASE_URL: 'https://example.test',
    showLoginAlert: value => alerts.push(value),
    setChatMessages: fn => { const next = fn(messages); messages.splice(0, messages.length, ...next); },
    setIsChatLoading: value => { context.isChatLoading = value; },
    axios: { post: async (...args) => { requests.push(args); return { data: { reply: 'Reply' } }; } },
  };
  vm.createContext(context);
  vm.runInContext(compiled, context);
  return { context, messages, alerts, requests };
}
test('guest cannot append messages or send a chat request', async () => {
  const { context, messages, alerts, requests } = setup({ loggedIn: false });
  await context.send('Hello');
  assert.equal(requests.length, 0);
  assert.equal(messages.length, 0);
  assert.equal(alerts.length, 1);
});
test('missing token requires login, without creating a guest request', async () => {
  const { context, messages, alerts, requests } = setup({ token: null });
  await context.send('Hello');
  assert.equal(requests.length, 0);
  assert.equal(messages.length, 0);
  assert.equal(alerts.length, 1);
  assert.equal(context.chatRequest.current, null);
});
test('authenticated requests always include bearer token and finish loading', async () => {
  const { context, messages, requests } = setup();
  await context.send('Hello');
  assert.equal(requests[0][2].headers.Authorization, 'Bearer token');
  assert.equal(messages.length, 2);
  assert.equal(messages[1].text, 'Reply');
  assert.equal(context.isChatLoading, false);
});
test('cancelled request cannot append a reply after logout', async () => {
  const { context, messages } = setup();
  let complete;
  context.axios.post = () => new Promise(resolve => { complete = resolve; });
  const pending = context.send('Hello');
  await new Promise(resolve => setImmediate(resolve));
  context.chatRequest.current.abort();
  context.chatRequest.current = null;
  messages.splice(0);
  complete({ data: { reply: 'Old account reply' } });
  await pending;
  assert.equal(messages.length, 0);
});
test('expired login requests reauthentication', async () => {
  const { context, alerts } = setup();
  context.axios.post = async () => { throw { response: { status: 401 } }; };
  await context.send('Hello');
  assert.equal(alerts.length, 1);
  assert.equal(context.chatRequest.current, null);
});

function clearHarness(fail = false) {
  let expression;
  function find(node) { if (ts.isVariableDeclaration(node) && node.name.getText(tree) === 'clearChatMessages') expression = node.initializer.getText(tree); ts.forEachChild(node, find); }
  find(tree);
  const messages = [{ id: 'welcome' }, { id: 'saved-question' }], requests = [], alerts = [];
  const context = { AbortController, chatRequest: { current: null }, API_BASE_URL: 'https://api.invalid',
    AsyncStorage: { getItem: async () => 'token' }, setIsChatLoading() {}, showLoginAlert() {}, Alert: { alert: (...args) => alerts.push(args) },
    axios: { delete: async (...args) => { requests.push(args); if (fail) throw Error('offline'); } },
    setChatMessages: fn => { const next = fn(messages); messages.splice(0, messages.length, ...next); },
  };
  vm.createContext(context);
  vm.runInContext(ts.transpileModule('globalThis.clear = ' + expression, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return { context, messages, requests, alerts };
}
test('clear chat deletes authenticated server history before resetting the screen', async () => {
  const { context, messages, requests } = clearHarness();
  await context.clear();
  assert.equal(requests[0][0], 'https://api.invalid/api/chat/history');
  assert.equal(requests[0][1].headers.Authorization, 'Bearer token');
  assert.equal(messages.length, 1); assert.equal(messages[0].id, 'welcome');
});
test('failed history deletion preserves messages so UI does not pretend server history was cleared', async () => {
  const { context, messages, alerts } = clearHarness(true);
  await context.clear(); assert.equal(messages.length, 2); assert.equal(alerts.length, 1);
});

test('provider overload displays the server explanation without asking the reader to log in again', async () => {
  const { context, messages, alerts } = setup();
  context.axios.post = async () => { throw { response: { status: 503, data: { reply: 'Gemini đang quá tải.' } } }; };
  await context.send('Hello');
  assert.equal(messages.at(-1).text, 'Gemini đang quá tải.'); assert.equal(alerts.length, 0);
});
