const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadGame } = require('./harness');

const g = loadGame();

test('four classes, each with two loadouts', () => {
  const classes = g.$('CLASSES');
  assert.equal(classes.length, 4);
  for (const c of classes) {
    assert.equal(c.loadouts.length, 2, c.name);
    assert.ok(c.hp > 0 && c.cd > 0 && c.ability, c.name);
  }
});

test('the README counts match the game data', () => {
  const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  const [, enemies, bosses] = readme.match(/(\d+) enemy types, (\d+) bosses/);
  // Survival adds the Swarmling on top of the campaign roster
  assert.equal(Number(enemies), g.$('ENEMIES.length') + 1);
  assert.equal(Number(bosses), g.$('BOSSES.length'));
  assert.equal(g.$('SWARMLING.name'), 'Swarmling');
});

test('every enemy and boss has a unique name and an AI', () => {
  const all = [...g.$('ENEMIES'), ...g.$('BOSSES'), g.$('SWARMLING')];
  assert.equal(new Set(all.map(e => e.name)).size, all.length);
  for (const e of all) assert.ok(e.ai && e.hp > 0, e.name);
  for (const b of g.$('BOSSES')) assert.match(b.ai, /^boss_/, b.name);
});

for (const [length, events] of [[4, 1], [6, 2]]) {
  test(`a ${length}-stop campaign has ${events} event(s) and ends on the boss`, () => {
    g.buildCampaign(length);
    const nodes = g.$('CAMPAIGN_NODES');
    assert.equal(nodes.length, length);
    assert.equal(g.$('campaignTotal'), length);
    assert.equal(nodes.at(-1).type, 'boss');
    assert.equal(nodes.filter(n => n.type === 'event').length, events);
    assert.equal(nodes.filter(n => n.type === 'boss').length, 1);
  });
}
