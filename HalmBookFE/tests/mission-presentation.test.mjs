import assert from 'node:assert/strict';
import { test } from 'node:test';
import { missionCards } from '../src/components/user/missionPresentation.js';

test('original daily cards show admin configuration and server progress without marking navigation as completion', () => {
  const input = [{ id: 'configured', period: 'DAILY', condition: 'READING_SECONDS', title: 'Đọc 5 phút', progress: 47, targetValue: 300, rewardPotato: 17, rewardXp: 21, completed: false, claimed: false }];
  const [card] = missionCards(input, 'DAILY');
  assert.equal(card.title, 'Đọc 5 phút'); assert.equal(card.rewardPotato, 17); assert.equal(card.rewardXp, 21);
  assert.equal(card.taskKey, 'read'); assert.equal(card.icon, 'ph-book-open'); assert.equal(card.currentProgress, 47); assert.equal(card.maxProgress, 300);
  assert.equal(card.canClaim, false); assert.equal(card.isCompleted, false); assert.equal(input[0].progress, 47);
});
test('claim buttons follow confirmed completion and claimed status and keep daily and milestone tabs separate', () => {
  const missions = [
    { id: 'm1', period: 'DAILY', condition: 'CHECKIN', progress: 1, targetValue: 1, completed: true, claimed: false },
    { id: 'ms4', period: 'MILESTONE', condition: 'TOTAL_XP', progress: 500, targetValue: 500, completed: true, claimed: true },
  ];
  const daily = missionCards(missions, 'DAILY'), milestone = missionCards(missions, 'MILESTONE');
  assert.equal(daily.length, 1); assert.equal(daily[0].canClaim, true); assert.equal(daily[0].isCompleted, false);
  assert.equal(milestone.length, 1); assert.equal(milestone[0].isCompleted, true); assert.equal(milestone[0].canClaim, false); assert.equal(milestone[0].icon, 'ph-crown');
  assert.deepEqual(missionCards([], 'DAILY'), []); assert.deepEqual(missionCards(null, 'MILESTONE'), []);
});
