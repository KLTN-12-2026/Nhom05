const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise the actual service without loading the Expo/native runtime.
const source = fs.readFileSync(path.join(__dirname, '../src/ux-ui/leaderboardService.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const context = { exports: {}, process: { env: {} }, require: () => ({}) };
vm.runInNewContext(compiled, context);
const { rankingWindow, rewardForRank, parseLeaderboard, hasLeaderboardSource } = context.exports;
const reader = (rank, points) => ({ customerId: `test-${rank}`, name: `Test ${rank}`, avatarUrl: null, rank, points });
const snapshot = () => ({
  period: 'week',
  ...rankingWindow('week', Date.parse('2026-11-13T10:00:00Z')),
  top: [reader(1, 300), reader(2, 250)],
  me: reader(15, 100),
  above: reader(14, 219),
});

test('week rolls over at Monday midnight UTC+7, independent of device timezone', () => {
  assert.equal(rankingWindow('week', Date.parse('2026-11-15T16:59:59Z')).startsAt, '2026-11-08T17:00:00.000Z');
  assert.equal(rankingWindow('week', Date.parse('2026-11-15T17:00:00Z')).startsAt, '2026-11-15T17:00:00.000Z');
});
test('month boundaries include year and leap-year rollover', () => {
  assert.equal(rankingWindow('month', Date.parse('2026-12-20T00:00:00Z')).endsAt, '2026-12-31T17:00:00.000Z');
  assert.equal(rankingWindow('month', Date.parse('2024-02-28T20:00:00Z')).endsAt, '2024-02-29T17:00:00.000Z');
});
test('all ten rewards and ranks outside Top 10', () => {
  assert.deepEqual(Array.from({ length: 10 }, (_, i) => rewardForRank(i + 1)), [50, 40, 30, 25, 20, 15, 12, 10, 7, 5]);
  assert.equal(rewardForRank(11), 0);
  assert.equal(rewardForRank(0), 0);
});
test('real snapshot supports personal ranks outside Top 10 and empty periods', () => {
  const data = parseLeaderboard(snapshot(), 'week');
  assert.equal(data.above.points - data.me.points + 1, 120);
  const empty = { ...snapshot(), top: [], me: null, above: null };
  assert.equal(parseLeaderboard(empty, 'week').top.length, 0);
});
test('rejects incorrect period, unordered scores, duplicate readers and negative scores', () => {
  assert.throws(() => parseLeaderboard(snapshot(), 'month'));
  for (const top of [[reader(1, 2), reader(2, 3)], [reader(1, -1)], [reader(2, 5)], [reader(1, 5), { ...reader(2, 4), customerId: 'test-1' }]]) {
    assert.throws(() => parseLeaderboard({ ...snapshot(), top }, 'week'));
  }
});
test('rejects missing or inconsistent personal progress', () => {
  assert.throws(() => parseLeaderboard({ ...snapshot(), above: null }, 'week'));
  assert.throws(() => parseLeaderboard({ ...snapshot(), above: reader(13, 250) }, 'week'));
  assert.throws(() => parseLeaderboard({ ...snapshot(), me: reader(2, 100), above: reader(1, 300) }, 'week'));
  assert.equal(parseLeaderboard({ ...snapshot(), me: reader(1, 300), above: null }, 'week').me.rank, 1);
});
test('no configured API means no invented production source', () => {
  assert.equal(hasLeaderboardSource, false);
});
