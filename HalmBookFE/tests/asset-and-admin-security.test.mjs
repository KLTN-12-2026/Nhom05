import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import { API_BASE_URL, normalizeAssetLinks, normalizeAssetUrl } from '../src/config/api.js';

test('relative and legacy local asset URLs use the configured backend', () => {
  assert.equal(normalizeAssetUrl('/uploads/images/cover.jpg'), API_BASE_URL + '/uploads/images/cover.jpg');
  assert.equal(normalizeAssetUrl('http://127.0.0.1:8082/uploads/file.pdf'), API_BASE_URL + '/uploads/file.pdf');
  const data = { books: [{ img_url: '/uploads/images/cover.jpg' }], message: '/uploads/keep-this-message' };
  normalizeAssetLinks(data);
  assert.equal(data.books[0].img_url, API_BASE_URL + '/uploads/images/cover.jpg');
  assert.equal(data.message, '/uploads/keep-this-message');
  assert.equal(normalizeAssetUrl('https://cloud.invalid/signed.pdf'), 'https://cloud.invalid/signed.pdf');
});

test('admin reply header treats ticket names as text and rejects executable avatar URLs', () => {
  const elements = new Map();
  const element = () => ({ children: [], value: '', classList: { remove() {} }, replaceChildren(...children) { this.children = children; } });
  const context = vm.createContext({ console, URL, setTimeout() {},
    document: { addEventListener() {}, createElement: element, getElementById: id => {
      if (!elements.has(id)) elements.set(id, element()); return elements.get(id);
    } }, window: { addEventListener() {}, location: { origin: 'https://admin.invalid' } },
    fixture: { id: 1, userName: '<img src=x onerror=alert(1)>', userAvatar: 'javascript:alert(1)' },
  });
  vm.runInContext(readFileSync(new URL('../src/components/admin/js/thongBaoHoTroPage.js', import.meta.url), 'utf8'), context);
  vm.runInContext('allTickets = [fixture]; renderChatHistoryThread = () => {}; openReplyModal(1);', context);
  const avatar = elements.get('replyTicketAvatar');
  assert.equal(avatar.innerHTML, undefined);
  assert.equal(avatar.children[0].textContent, '<');
  assert.equal(avatar.children[0].src, undefined);
  assert.equal(elements.get('replyTicketUser').innerText, context.fixture.userName);
  context.fixture.userAvatar = 'https://cdn.invalid/avatar.png';
  vm.runInContext('openReplyModal(1)', context);
  assert.equal(avatar.children[0].src, context.fixture.userAvatar);
  assert.equal(avatar.children[0].alt, context.fixture.userName);
});
