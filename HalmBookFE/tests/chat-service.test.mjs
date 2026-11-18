import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axiosClient from '../src/services/axiosClient.js';
import { saveAuthSession } from '../src/services/authToken.js';
import { sendChatMessage, getChatHistory, clearChatHistory, getGuestConversationId, formatChatTime } from '../src/services/chatService.js';
import { sendTicketMessage } from '../src/services/userSupportService.js';
import { replyAdminTicket } from '../src/services/adminSupportService.js';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const storage = () => {
    const values = new Map();
    return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) };
};
const ok = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} });
const login = () => saveAuthSession({ token: `header.${Buffer.from(JSON.stringify({ sub: 'reader', exp: Date.now() / 1000 + 3600 })).toString('base64url')}.signature`, role: 'USER' });

beforeEach(() => {
    globalThis.localStorage = storage();
    globalThis.sessionStorage = storage();
    globalThis.window = undefined;
});

test('transport failures propagate instead of appearing as successful bot replies', async () => {
    axiosClient.defaults.adapter = async () => { throw new Error('offline'); };
    await assert.rejects(sendChatMessage('hello'), /offline/);
    assert.deepEqual(await getChatHistory(), []);
    login();
    await assert.rejects(getChatHistory(), /offline/);
    await assert.rejects(clearChatHistory(), /offline/);
});

test('guest sends persist both messages locally and use an isolated conversation identifier', async () => {
    let request;
    axiosClient.defaults.adapter = async config => { request = config; return ok(config, { reply: 'Hello reader' }); };
    await sendChatMessage('hello');
    const history = await getChatHistory();
    assert.deepEqual(history.map(m => m.sender), ['user', 'bot']);
    assert.equal(history[1].content, 'Hello reader');
    assert.equal(JSON.parse(request.data).conversationId, getGuestConversationId());
    assert.equal(request.timeout, 120000);
    assert.notEqual(history[0].id, history[1].id);
    await clearChatHistory();
    assert.deepEqual(await getChatHistory(), []);
    assert.equal(request.method, 'delete');
});

test('authenticated history comes from server and invalid responses are rejected', async () => {
    login();
    axiosClient.defaults.adapter = async config => ok(config, [{ id: 1, sender: 'user', content: 'server history' }]);
    assert.equal((await getChatHistory())[0].content, 'server history');
    axiosClient.defaults.adapter = async config => ok(config, {});
    await assert.rejects(getChatHistory(), /không hợp lệ/);
    await assert.rejects(sendChatMessage('hello'), /chưa trả về/);
});

test('support retry keeps its request identity while a new send can repeat the content', async () => {
    const payloads = [];
    axiosClient.defaults.adapter = async config => { payloads.push(JSON.parse(config.data)); return ok(config, { success: true }); };
    await sendTicketMessage(1, 'hello', 'Reader', 'retry-one', 'TK-1');
    await sendTicketMessage(1, 'hello', 'Reader', 'retry-one', 'TK-1');
    await sendTicketMessage(1, 'hello', 'Reader', 'new-send', 'TK-1');
    await replyAdminTicket(1, 'reply', 'resolved', 'admin-retry');
    assert.deepEqual(payloads.map(p => p.requestId), ['retry-one', 'retry-one', 'new-send', 'admin-retry']);
    assert.equal(payloads[0].code, 'TK-1');
});

test('timestamps accept both local messages and persisted ISO timestamps', () => {
    assert.equal(formatChatTime('12:34'), '12:34');
    assert.match(formatChatTime('2026-11-18T12:34:00'), /12:34/);
    assert.equal(formatChatTime('invalid'), '');
});

test('an older admin polling response cannot overwrite a newer transcript', async () => {
    const requests = [];
    const context = vm.createContext({ console, crypto,
        document: { addEventListener() {} },
        window: { addEventListener() {}, AdminSupportAPI: {
            getTickets: () => new Promise(resolve => requests.push(resolve)),
        } },
    });
    vm.runInContext(readFileSync(new URL('../src/components/admin/js/thongBaoHoTroPage.js', import.meta.url), 'utf8'), context);
    vm.runInContext('filterTickets = () => {}; renderTicketStats = () => {};', context);
    const older = context.loadTickets(true);
    const newer = context.loadTickets(true);
    requests[1]({ tickets: [{ id: 1, chatHistory: ['question', 'reply'] }] });
    await newer;
    requests[0]({ tickets: [{ id: 1, chatHistory: ['question'] }] });
    await older;
    assert.equal(vm.runInContext('allTickets[0].chatHistory.length', context), 2);
    context.window.DB = { getTickets: () => [{ id: 1, chatHistory: ['stale local data'] }] };
    context.window.AdminSupportAPI.getTickets = async () => { throw new Error('offline'); };
    await context.loadTickets(true);
    assert.equal(vm.runInContext('allTickets[0].chatHistory.length', context), 2);
});
