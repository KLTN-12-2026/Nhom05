import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

function harness() {
  const notices = []; let localWrites = 0;
  const context = vm.createContext({ console, Set,
    document: { addEventListener() {} },
    window: { halmConfirm: async () => true, DB: {
      notify: (...args) => notices.push(args), revokeRental: () => { localWrites++; },
    } },
  });
  vm.runInContext(readFileSync(new URL('../src/components/admin/js/rentalPage.js', import.meta.url), 'utf8'), context);
  vm.runInContext('loadRentals = async () => {};', context);
  return { window: context.window, notices, localWrites: () => localWrites };
}

test('admin revoke cannot report a local-only success when the API is unavailable', async () => {
  const h = harness(); await h.window.revokeRental('7');
  assert.equal(h.localWrites(), 0); assert.equal(h.notices.at(-1)[1], 'error');
  h.window.AdminRentalAPI = { revoke: async () => ({ success: true }) };
  await h.window.revokeRental('7'); assert.equal(h.notices.at(-1)[1], 'warning');
});

test('repeated revoke clicks share one in-flight action and require server confirmation', async () => {
  const h = harness(); let calls = 0, finish;
  h.window.AdminRentalAPI = { revoke: () => { calls++; return new Promise(resolve => { finish = resolve; }); } };
  const first = h.window.revokeRental('7'); await Promise.resolve();
  await h.window.revokeRental('7'); assert.equal(calls, 1);
  finish({ success: false }); await first; assert.equal(h.notices.at(-1)[1], 'error');
});
