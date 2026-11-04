// === Effects ===

function spawnDmg(q, r, text, color) {
  const { x, y } = h2p(q, r);
  const nearby = damageNumbers.filter(d => Math.abs(d.x - x) < 20 && Math.abs(d.y - (y - 24)) < 14).length;
  const num = parseInt(text);
  const big = !isNaN(num) && Math.abs(num) >= 3;
  damageNumbers.push({
    x: x + (Math.random() - 0.5) * 10,
    y: y - 24 - nearby * 14,
    text, color: color || '#c45050',
    life: big ? 1500 : 1200,
    maxLife: big ? 1500 : 1200,
    big
  });
}

function spawnFlash(target) {
  flashEffects.push({ target, life: 100 });
}

function spawnProjectile(from, to, color, big) {
  const a = h2p(from.q, from.r);
  const b = h2p(to.q, to.r);
  projectiles.push({
    x: a.x, y: a.y, tx: b.x, ty: b.y,
    color, life: 250, maxLife: 250, big: big || false
  });
}

function spawnDeath(q, r, color, big) {
  const { x, y } = h2p(q, r);
  const n = big ? 14 : 8;
  for (let i = 0; i < n; i++) {
    deathEffects.push({
      x, y,
      vx: (Math.random() - 0.5) * (big ? 5 : 3),
      vy: (Math.random() - 0.5) * (big ? 5 : 3) - 1.5,
      color, life: 700, maxLife: 700, size: big ? 5 : 3
    });
  }
}

function spawnAoe(q, r, color, radius) {
  const { x, y } = h2p(q, r);
  aoeEffects.push({ x, y, color, life: 450, maxLife: 450, radius: radius || HEX * 1.2 });
}

function spawnTrail(q, r, color) {
  const { x, y } = h2p(q, r);
  trailEffects.push({ x, y, color, life: 300, maxLife: 300 });
}

function doShake(n) {
  if (gameMode === 'survival') {
    if (n < 12) return;
    n *= 0.6;
  }
  const mult = parseFloat(document.getElementById('shake-sel').value) || 1;
  screenShake = { x: 0, y: 0, life: 220, intensity: n * mult };
}

// === Stats ===

function initStats() {
  stats = {};
  players.forEach(p => {
    if (!stats[p.name]) {
      stats[p.name] = {
        dmgDealt: 0, dmgTaken: 0, heals: 0, kills: 0,
        moved: 0, defends: 0, ghostTicks: 0, diedAt: 0, overkill: 0
      };
    }
  });
}

function stat(name, key, val) {
  if (stats[name]) stats[name][key] += val;
}
