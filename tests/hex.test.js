const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./harness');

const g = loadGame();
const O = { q: 0, r: 0 };
// -0 and 0 are the same hex
const at = (h, q, r) => assert.ok(h.q === q && h.r === r, `expected ${q},${r} got ${h.q},${h.r}`);

test('distance counts steps on the hex grid', () => {
  assert.equal(g.hDist(O, O), 0);
  assert.equal(g.hDist(O, { q: 1, r: 0 }), 1);
  assert.equal(g.hDist(O, { q: 2, r: -1 }), 2);
  assert.equal(g.hDist({ q: 3, r: -3 }, O), 3);
  assert.equal(g.hDist({ q: -2, r: 4 }, { q: 1, r: 1 }), 3);
});

test('every hex has six neighbours, all one step away', () => {
  const n = g.hNbrs(2, -1);
  assert.equal(n.length, 6);
  assert.equal(new Set(n.map(h => h.q + ',' + h.r)).size, 6);
  for (const h of n) assert.equal(g.hDist(h, { q: 2, r: -1 }), 1);
});

test('rounding snaps to the nearest hex', () => {
  at(g.hexRound(0.1, -0.2), 0, 0);
  at(g.hexRound(1.4, 0.1), 1, 0);
  at(g.hexRound(-0.6, 1.2), -1, 1);
});

test('pixel to hex undoes hex to pixel across the whole board', () => {
  const R = g.$('GRID_R');
  for (let q = -R; q <= R; q++) {
    for (let r = -R; r <= R; r++) {
      if (!g.inGrid(q, r)) continue;
      const { x, y } = g.h2p(q, r);
      at(g.p2h(x, y), q, r);
    }
  }
});

test('the board is a hexagon of radius GRID_R', () => {
  const R = g.$('GRID_R');
  assert.ok(g.inGrid(R, 0));
  assert.ok(g.inGrid(-R, R));
  assert.ok(!g.inGrid(R + 1, 0));
  assert.ok(!g.inGrid(R, 1));
});

test('rogues reach two steps, everyone else one', () => {
  const warrior = { q: 0, r: 0, hp: 6, classIdx: 0 };
  const rogue = { q: 0, r: 0, hp: 4, classIdx: 2 };
  assert.equal(g.getReachable(warrior).length, 6);
  // two steps out on a clear board: the 6 neighbours, the 12 hexes beyond, and back home
  assert.equal(g.getReachable(rogue).length, 19);
  assert.equal(g.getReachable({ ...warrior, hp: 0 }).length, 0);
});
