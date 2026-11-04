// Smoke tests for hex math (node test_hex.js)

function hDist(a, b) {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

function hexRound(fq, fr) {
  const fs = -fq - fr;
  let rq = Math.round(fq); let rr = Math.round(fr); let rs = Math.round(fs);
  const dq = Math.abs(rq - fq), dr = Math.abs(rr - fr), ds = Math.abs(rs - fs);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq, r: rr };
}

function hNbrs(q, r) {
  return [
    { q: q + 1, r }, { q: q - 1, r },
    { q, r: r + 1 }, { q, r: r - 1 },
    { q: q + 1, r: r - 1 }, { q: q - 1, r: r + 1 }
  ];
}

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); }
}

// hDist
assert(hDist({ q: 0, r: 0 }, { q: 0, r: 0 }) === 0, 'same hex = 0');
assert(hDist({ q: 0, r: 0 }, { q: 1, r: 0 }) === 1, 'adjacent = 1');
assert(hDist({ q: 0, r: 0 }, { q: 2, r: -1 }) === 2, 'two steps diagonal');
assert(hDist({ q: 3, r: -3 }, { q: 0, r: 0 }) === 3, 'symmetric distance');
assert(hDist({ q: 1, r: 2 }, { q: 1, r: 2 }) === 0, 'identity non-origin');

// hexRound
let r = hexRound(0.1, -0.2);
assert(r.q === 0 && r.r === 0, 'round near origin');
r = hexRound(1.4, 0.1);
assert(r.q === 1 && r.r === 0, 'round near (1,0)');
r = hexRound(0.5, 0.5);
assert(r.q + r.r + (-r.q - r.r) === 0, 'cube constraint holds');

// hNbrs
const nbrs = hNbrs(0, 0);
assert(nbrs.length === 6, 'origin has 6 neighbours');
assert(nbrs.every(n => hDist(n, { q: 0, r: 0 }) === 1), 'all neighbours at distance 1');

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
