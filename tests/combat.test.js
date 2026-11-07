const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./harness');

const g = loadGame();
const hero = (o = {}) => ({ name: 'Kai', q: 0, r: 0, hp: 6, maxHp: 6, isEnemy: false, classIdx: 1, ...o });
const foe = (o = {}) => ({ name: 'Tank', q: 1, r: 0, hp: 6, maxHp: 6, isEnemy: true, ai: 'tank', ...o });

// Pins Math.random for one call so chance-based rules are testable
function withRandom(value, fn) {
  const real = g.Math;
  g.Math = Object.create(Math, { random: { value: () => value } });
  try { fn(); } finally { g.Math = real; }
}

test.beforeEach(() => {
  g.$('terrain = []; enemies = []; gameMode = "campaign"');
  g._terrainMapRebuild();
});

test('damage comes off HP', () => {
  const p = hero();
  g.dealDamage(p, 2, null);
  assert.equal(p.hp, 4);
});

test('defending halves a hit, never below 1, and is used up', () => {
  const p = hero({ defending: true });
  g.dealDamage(p, 3, null);
  assert.equal(p.hp, 5);
  assert.equal(p.defending, false);
  const q = hero({ defending: true });
  g.dealDamage(q, 1, null);
  assert.equal(q.hp, 5);
});

test('a dodge charge blocks one hit, then it is gone', () => {
  const p = hero({ dodgeNext: true });
  g.dealDamage(p, 3, null);
  assert.equal(p.hp, 6);
  g.dealDamage(p, 3, null);
  assert.equal(p.hp, 3);
});

test('dodge chance is capped at 35%', () => {
  const p = hero({ dodgeChance: 0.9 });
  withRandom(0.3, () => g.dealDamage(p, 2, null));
  assert.equal(p.hp, 6, 'a roll under 35% dodges');
  withRandom(0.5, () => g.dealDamage(p, 2, null));
  assert.equal(p.hp, 4, 'a 90% dodge chance still only counts as 35%');
});

test('cover takes 1 off a hit, but a hit always does at least 1', () => {
  g.$('terrain = [{ q: 0, r: 0, type: T_COVER }]');
  g._terrainMapRebuild();
  const p = hero();
  g.dealDamage(p, 3, null);
  assert.equal(p.hp, 4);
  g.dealDamage(p, 1, null);
  assert.equal(p.hp, 3);
});

test('warriors hit back at melee attackers', () => {
  const w = hero({ classIdx: 0 });
  const t = foe();
  g.dealDamage(w, 1, t);
  assert.equal(w.hp, 5);
  assert.equal(t.hp, 5);
});

test('healing stops at max HP', () => {
  const p = hero({ hp: 2 });
  g.healEntity(p, 3);
  assert.equal(p.hp, 5);
  g.healEntity(p, 10);
  assert.equal(p.hp, 6);
});

test('poison ticks 1 damage a turn and wears off', () => {
  const t = foe();
  g.applyStatus(t, 'poison', 2);
  g.tickStatuses(t);
  assert.equal(t.hp, 5);
  g.tickStatuses(t);
  assert.equal(t.hp, 4);
  assert.equal(t.statuses.length, 0);
  g.tickStatuses(t);
  assert.equal(t.hp, 4);
});

test('reapplying a status keeps the longer duration', () => {
  const t = foe();
  g.applyStatus(t, 'stun', 3);
  g.applyStatus(t, 'stun', 1);
  assert.equal(t.statuses.length, 1);
  assert.equal(t.statuses[0].ticks, 3);
  assert.ok(g.isStunned(t));
});

test('the Golem shrugs off status effects', () => {
  const golem = foe({ name: 'Golem', ai: 'boss_golem', isBoss: true, hp: 18, maxHp: 18 });
  g.applyStatus(golem, 'stun', 2);
  assert.ok(!g.isStunned(golem));
});
