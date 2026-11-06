import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isThreePointer,
  calculateShotQuality,
  willShotGoIn,
  canTriggerDunk,
  resolveShove,
  resolveCrossover,
  findBestPassTarget,
  COURT_WIDTH,
  LEFT_RIM_X,
  RIGHT_RIM_X,
  RIM_Y
} from './rules';

test('isThreePointer correctly differentiates 3PT and 2PT distances', () => {
  // Beyond 250px from right rim (1115, 325)
  assert.equal(isThreePointer(700, 325, RIGHT_RIM_X, RIM_Y), true);
  // Inside 250px from right rim (e.g. 1000 is 115px away)
  assert.equal(isThreePointer(1000, 325, RIGHT_RIM_X, RIM_Y), false);
  // Left rim check
  assert.equal(isThreePointer(400, 325, LEFT_RIM_X, RIM_Y), true);
  assert.equal(isThreePointer(150, 325, LEFT_RIM_X, RIM_Y), false);
});

test('calculateShotQuality rewards perfect timing and punishes heavy contests', () => {
  const perfectOpen = calculateShotQuality(0.0, 150, 200, 5, false);
  const contestedMistimed = calculateShotQuality(0.25, 400, 30, 2, false);

  assert.ok(perfectOpen > 0.8, `Expected high quality for perfect open shot, got ${perfectOpen}`);
  assert.ok(contestedMistimed < 0.6, `Expected lower quality for contested mistimed shot, got ${contestedMistimed}`);
  assert.ok(perfectOpen > contestedMistimed);
});

test('willShotGoIn converts green releases and checks thresholds', () => {
  // Green release always converts
  assert.equal(willShotGoIn(0.9, 3), true);
  // Terrible quality fails
  assert.equal(willShotGoIn(0.1, 1), false);
});

test('canTriggerDunk requires player to be in range and moving towards rim', () => {
  // Player at x=1000 moving right (vx=5) towards right rim (x=1115): in range and moving towards rim
  assert.equal(canTriggerDunk(1000, RIM_Y, 5, RIGHT_RIM_X, RIM_Y, 4), true);

  // Player moving AWAY from the rim (vx=-5)
  assert.equal(canTriggerDunk(1000, RIM_Y, -5, RIGHT_RIM_X, RIM_Y, 4), false);

  // Player too far from rim (e.g. halfcourt x=600)
  assert.equal(canTriggerDunk(600, RIM_Y, 5, RIGHT_RIM_X, RIM_Y, 4), false);
});

test('resolveShove generates knockback and stun duration', () => {
  const result = resolveShove(5, 2, true);
  // With 5 strength vs 2 strength, success chance is high
  assert.equal(typeof result.success, 'boolean');
  if (result.success) {
    assert.ok(result.knockbackVx > 0);
    assert.ok(result.stunDuration >= 1.0);
    assert.equal(result.causedTurnover, true);
  }
});

test('findBestPassTarget picks open forward teammate over blocked one', () => {
  const carrierPos = { x: 500, y: 325 };
  const targetRimX = RIGHT_RIM_X;
  const teammates = [
    { id: 'carrier', x: 500, y: 325 },
    { id: 'open_forward', x: 800, y: 325 },
    { id: 'back_guard', x: 300, y: 325 }
  ];
  const opponents = [
    // Defender standing right behind carrier, not blocking the forward pass
    { x: 450, y: 325 }
  ];

  const targetId = findBestPassTarget('carrier', carrierPos, targetRimX, null, teammates, opponents);
  assert.equal(targetId, 'open_forward');
});
