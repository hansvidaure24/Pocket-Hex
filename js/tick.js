// Pocket Quest — Game tick
const _inputIndicator = document.getElementById('input-indicator');

function tick() {
  _occRebuild();

  if (tempoTicks > 0) {
    tempoTicks--;
    if (tempoTicks === 0) {
      tickMs = originalTickMs;
      showWaveAnnounce('TEMPO NORMAL', '', '800');
    }
  }

  tickCount++;
  tickPulse = 1;
  const p0u = players[0];
  const urgent = p0u && p0u.hp > 0 &&
    hNbrs(p0u.q, p0u.r).some(n => _enemyAt(n.q, n.r));
  audio.tick(urgent);

  // squash-on-land for any unit that moved last tick
  entities.forEach(e => {
    if (e.prevQ != null && (e.prevQ !== e.q || e.prevR !== e.r))
      triggerSquash(e);
  });
  entities.forEach(e => { e.prevQ = e.q; e.prevR = e.r; });

  players.forEach(p => {
    if (p.ghost) {
      stat(p.name, 'ghostTicks', 1);
      if (p.q !== p.prevQ || p.r !== p.prevR) {
        const { x: gx, y: gy } = h2p(p.prevQ, p.prevR);
        for (let i = 0; i < 3; i++) {
          statusParticles.push({
            x: gx + (Math.random() - 0.5) * 10, y: gy,
            vx: (Math.random() - 0.5) * 0.3, vy: -0.5,
            color: p.color, life: 500, maxLife: 500, size: 1.5
          });
        }
      }
    }
  });

  // last stand: only 1 player alive = +1 dmg bonus
  const aliveCount = players.filter(p => p.hp > 0).length;
  const hadLastStand = players.some(p => p.lastStand);
  players.forEach(p => { p.lastStand = aliveCount === 1 && p.hp > 0; });
  if (!hadLastStand && players.some(p => p.lastStand)) {
    const hero = players.find(p => p.lastStand);
    showWaveAnnounce('LAST STAND', hero.name + ' stands alone', 2000);
    combatLog(`${hero.name} enters last stand — +1 dmg`, '#b8943e');
    spawnAoe(hero.q, hero.r, '#b8943e', HEX * 2);
    screenFlash = { color: '#b8943e', life: 300, maxLife: 300 };
    doShake(10);
    slowMoTimer = 800;
    slowMoFactor = 2;
  }

  function applyPlayerInput(p, inp) {
    if (p.cdTimer > 0) p.cdTimer--;
    if (!inp) {
      if (p.hp > 0 && !p.ghost) {
        const ne = nearestEnemy(p);
        if (ne) {
          p.faceDQ = Math.sign(ne.q - p.q) || 0;
          p.faceDR = Math.sign(ne.r - p.r) || 0;
        }
      }
      return;
    }
    if (inp === 'attack' && p.hp > 0 && !p.ghost) doAttack(p);
    else if (inp === 'skill' && p.hp > 0 && !p.ghost) doSkill(p);
    else if (inp === 'defend' && p.hp > 0 && !p.ghost) doDefend(p);
    else if (inp === 'item' && p.hp > 0 && !p.ghost) useItem(p);
    else if (inp && typeof inp === 'object') {
      if (p.ghost) {
        const nq = p.q + inp.dq, nr = p.r + inp.dr;
        if (isPassable(nq, nr, p)) { p.q = nq; p.r = nr; }
      } else {
        doMove(p, inp.dq, inp.dr);
      }
    }
    if (isTutorial && p === players[0]) {
      if (typeof inp === 'object') tutFlags.moved = true;
      if (inp === 'attack') tutFlags.attacked = true;
      if (inp === 'skill') tutFlags.skilled = true;
      if (inp === 'defend') tutFlags.defended = true;
      tutStep = tutFlags.defended ? 4
        : tutFlags.skilled ? 3
        : tutFlags.attacked ? 2
        : tutFlags.moved ? 1 : 0;
    }
  }

  // sync bonus: all living human players submitted input = +1 dmg this tick
  const livingHumans = players.filter(p => p.hp > 0 && !p.ghost && !p.isBot);
  const allSynced = livingHumans.length > 1 && livingHumans.every(p => {
    const i = players.indexOf(p);
    return i === 0 ? !!pendingInput : !!pendingInputs[i];
  });
  if (allSynced) {
    livingHumans.forEach(p => {
      p.syncBonus = 1;
      spawnDmg(p.q, p.r, 'SYNC!', '#b87acc');
    });
    audio.combo();
  }

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (!(p.hp > 0 || p.ghost)) continue;
    const inp = i === 0 ? pendingInput : pendingInputs[i] || null;
    if (p.isBot && !inp) {
      if (p.cdTimer > 0) p.cdTimer--;
      if (!isStunned(p)) botDecide(p);
      else spawnDmg(p.q, p.r, 'STUNNED', '#c9a030');
    } else {
      applyPlayerInput(p, inp);
    }
  }

  players.forEach(p => { p.syncBonus = 0; });
  pendingInput = null;
  pendingInputs = {};
  _inputIndicator.textContent = '';

  if (tickCount > 2) enemies.forEach(e => enemyAI(e));

  // danger close: play warning when enemy newly adjacent to P1
  if (players[0] && players[0].hp > 0) {
    const p0adj = hNbrs(players[0].q, players[0].r);
    const newAdj = enemies.some(e =>
      e.hp > 0 &&
      p0adj.some(n => n.q === e.q && n.r === e.r) &&
      (e.prevQ !== e.q || e.prevR !== e.r) &&
      !p0adj.some(n =>
        n.q === e.prevQ && n.r === e.prevR)
    );
    if (newAdj) audio.dangerClose();
  }

  // enrage bonus: last enemy gets an extra move toward nearest player
  enemies.forEach(e => {
    if ((e.enraged || e._swift) && e.hp > 0 && !isSlowed(e) && !isStunned(e)) {
      const t = nearestAlive(e);
      if (t && hDist(e, t) > 1) moveToward(e, t);
    }
  });

  resolveCombo();

  // DPS tracking (rolling 5-tick window)
  const tickDmg = Object.values(stats).reduce((s, st) => s + st.dmgDealt, 0);
  const tickDelta = dpsTicks.length > 0
    ? tickDmg - dpsTicks[dpsTicks.length - 1] : 0;
  dpsTicks.push(tickDmg);
  if (dpsTicks.length > 5) dpsTicks.shift();
  dpsDisplay = dpsTicks.length >= 2
    ? (dpsTicks[dpsTicks.length - 1] - dpsTicks[0]) / (dpsTicks.length - 1) : 0;
  if (tickDelta > 0 && !window._tickToast) window._tickToast = { val: 0, life: 0 };
  if (tickDelta > 0) window._tickToast = { val: tickDelta, life: 1200 };

  // tick status effects + spawn particles
  entities.forEach(e => {
    if (e.hp > 0 || e.ghost) tickStatuses(e);
    if (e.hp > 0 && e.statuses) {
      const { x, y } = h2p(e.q, e.r);
      e.statuses.forEach(s => {
        if (s.type === 'poison') {
          statusParticles.push({
            x: x + (Math.random() - 0.5) * 14, y: y - 8, vy: 0.6,
            color: '#5a9a60', life: 500, maxLife: 500, size: 2
          });
        }
        if (s.type === 'stun') {
          statusParticles.push({
            x: x + (Math.random() - 0.5) * 18, y: y - 14 - Math.random() * 6,
            vx: (Math.random() - 0.5) * 0.5, vy: -0.2,
            color: '#c9a030', life: 400, maxLife: 400, size: 1.5, star: true
          });
        }
        if (s.type === 'slow') {
          statusParticles.push({
            x: x + (Math.random() - 0.5) * 16, y: y + Math.random() * 8,
            vx: (Math.random() - 0.5) * 0.3, vy: -0.4,
            color: '#88ccff', life: 450, maxLife: 450, size: 2.5
          });
        }
      });
    }
  });

  // cover regen: heal 1 HP every 4 ticks on cover tiles
  if (tickCount % 4 === 0) {
    players.forEach(p => {
      if (p.hp > 0 && p.hp < p.maxHp) {
        const ct = terrainAt(p.q, p.r);
        if (ct && ct.type === T_COVER) {
          healEntity(p, 1, null);
          spawnAoe(p.q, p.r, '#2a6a4a', HEX * 0.6);
        }
      }
    });
    enemies.forEach(e => {
      if (e.hp > 0 && e.hp < e.maxHp) {
        const ct = terrainAt(e.q, e.r);
        if (ct && ct.type === T_COVER) {
          e.hp = Math.min(e.maxHp, e.hp + 1);
          spawnDmg(e.q, e.r, '+1', '#2a6a4a');
          spawnAoe(e.q, e.r, '#2a6a4a', HEX * 0.6);
        }
      }
    });
  }

  // dynamic drone intensity — louder as party HP drops
  if (audio._drone && !gameOver) {
    const totalHp = players.reduce((s, p) => s + p.hp, 0);
    const totalMax = players.reduce((s, p) => s + p.maxHp, 0);
    const partyHpPct = totalMax > 0 ? totalHp / totalMax : 1;
    const hasBoss = enemies.some(e => e.isBoss && e.hp > 0);
    const droneTarget = hasBoss
      ? 0.035 + 0.025 * (1 - partyHpPct)
      : 0.02 + 0.02 * (1 - partyHpPct);
    audio.setBossDrone(droneTarget > 0.035);
  }

  // defend expires each tick — must be re-applied by auto-defend/barrier
  players.forEach(p => { p.defending = false; });

  // Warrior auto-defend (Shield Wall loadout) — per-player timer
  players.forEach(p => {
    if (p.autoDefend && p.hp > 0) {
      p._adT = (p._adT || 0) + 1;
      if (p._adT >= p.autoDefend) {
        p._adT = 0;
        p.defending = true;
        spawnDmg(p.q, p.r, 'AUTO 🛡', '#607a90');
      }
    }
  });

  // Mage auto-barrier (Barrier Tome loadout)
  players.forEach(p => {
    if (p.autoBarrier && p.hp > 0) {
      p._abT = (p._abT || 0) + 1;
      if (p._abT >= p.autoBarrier) {
        p._abT = 0;
        p.defending = true;
        spawnDmg(p.q, p.r, 'BARRIER', '#6b8cae');
      }
    }
  });

  // Cleric passive aura: heal adjacent allies every N ticks
  players.forEach(p => {
    if (p.hp > 0 && p.classIdx === 3) {
      const interval = p.auraSpeed || 5;
      if (tickCount % interval === 0) {
        hNbrs(p.q, p.r).forEach(n => {
          const ally = players.find(a =>
            a !== p && a.q === n.q && a.r === n.r && a.hp > 0 && a.hp < a.maxHp);
          if (ally) {
            healEntity(ally, 1, p);
            combatLog(`${p.name}'s aura heals ${ally.name}`, '#c9973e');
          }
        });
      }
    }
  });

  if (gameMode === 'survival') { survivalAfterTick(); return; }

  // === End-of-tick outcome (mutually exclusive) ===
  const allEDead = enemies.every(e => e.hp <= 0);
  const allPDead = players.every(p => (p.hp <= 0 && !p.ghost) || p.ghost);

  if (isTutorial && allEDead) {
    gameOver = true;
    tutStep = 4;
    audio.stopDrone();
    audio.victory();
    screenFlash = { color: '#7ea879', life: 600, maxLife: 600 };
    doShake(10);
    showWaveAnnounce('READY!', 'starting campaign...', 2000);
    setTimeout(() => {
      isTutorial = false;
      irisWipe({ speed: 0.004, color: '#000', hold: 120, onMid: startCampaign });
    }, 2000);
    return;
  }

  if (allEDead) {
    const perfect = encDmgTaken === 0;
    if (perfect) perfectClears++;
    const rating = perfect ? 'S' : encDmgTaken <= 2 ? 'A' : encDmgTaken <= 5 ? 'B' : 'C';
    showMsg(perfect ? 'PERFECT CLEAR' : 'VICTORY', 9999);
    gameOver = true;
    showWaveAnnounce(perfect ? 'PERFECT CLEAR' : 'VICTORY', rating + ' rank', 2000);

    const totalKills = Object.values(stats).reduce((s, st) => s + st.kills, 0);
    const totalDmgDealt = Object.values(stats).reduce((s, st) => s + st.dmgDealt, 0);
    waveRatings.push(rating);
    const ratingCol = { S: '#b8943e', A: '#7ea879', B: '#c49040', C: '#888' }[rating];
    ratingFlash = { grade: rating, color: ratingCol, life: 2000, maxLife: 2000 };

    const speedBonus = tickCount <= 8;
    combatLog(`── Wave ${campaignNode + 1} cleared in ${tickCount} ticks ──`, '#7ea879');
    combatLog(
      `${totalKills} kills · ${totalDmgDealt} total dmg · ${encDmgTaken} dmg taken · Rating: ${rating}` +
      `${perfect ? ' · PERFECT' : ''}${speedBonus ? ' · FAST!' : ''}`,
      ratingCol
    );
    players.forEach(p => {
      const s = stats[p.name];
      if (s) combatLog(`  ${p.name}: ${s.kills} kills, ${s.dmgDealt} dmg, ${s.dmgTaken} taken`, p.color);
    });

    if (speedBonus) {
      partyXP += 2;
      combatLog('SPEED BONUS! +2 XP!', '#6b8cae');
      players.forEach(p => {
        if (p.hp > 0) spawnDmg(p.q, p.r, 'FAST! +2 XP', '#6b8cae');
      });
    }
    if (perfect) {
      partyXP += 3;
      combatLog('PERFECT CLEAR! +3 bonus XP!', '#b8943e');
      players.forEach(p => {
        if (p.hp > 0) {
          healEntity(p, 2, null);
          spawnDmg(p.q, p.r, 'PERFECT!', '#b8943e');
        }
      });
      audio.combo();
    }

    // revive ghosts for next encounter
    players.forEach(p => {
      if (p.ghost) {
        p.ghost = false;
        p.hp = Math.max(1, Math.floor(p.maxHp * 0.2));
        spawnDmg(p.q, p.r, 'REVIVED', '#c9973e');
      }
    });

    waveLabel = rating + ' RANK';
    waveLabelTimer = 4000;
    if (rating === 'S') audio.combo();

    if (campaignActive && campaignNode < campaignTotal - 1) {
      audio.levelup();
      setTimeout(() => irisWipe({ speed: 0.005, color: '#000', hold: 60, onMid: showTransition }), 600);
    } else {
      audio.stopDrone();
      audio.victory();
      const confCols = ['#b8943e', '#7ea879', '#6b8cae', '#c45a3c', '#b87a8a', '#ffffff', '#c49040', '#88ccff'];
      players.forEach(p => {
        if (p.hp > 0) {
          const pp = h2p(p.q, p.r);
          for (let i = 0; i < 24; i++) {
            statusParticles.push({
              x: pp.x, y: pp.y,
              vx: (Math.random() - 0.5) * 5, vy: -3 - Math.random() * 3,
              color: confCols[i % confCols.length],
              life: 2500, maxLife: 2500,
              size: 2 + Math.random() * 3, star: Math.random() > 0.3
            });
          }
        }
      });
      for (let i = 0; i < 40; i++) {
        statusParticles.push({
          x: C.width * 0.1 + Math.random() * C.width * 0.8, y: -5 - Math.random() * 20,
          vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 2,
          color: confCols[i % confCols.length],
          life: 3000, maxLife: 3000,
          size: 2 + Math.random() * 3, star: Math.random() > 0.4
        });
      }
      screenFlash = { color: '#b8943e', life: 800, maxLife: 800 };
      doShake(20);
      slowMoTimer = 1200;
      slowMoFactor = 2;
      setTimeout(() => {
        for (let i = 0; i < 25; i++) {
          statusParticles.push({
            x: Math.random() * C.width, y: -10,
            vx: (Math.random() - 0.5) * 1.5, vy: 1 + Math.random() * 1.5,
            color: confCols[i % confCols.length],
            life: 2500, maxLife: 2500,
            size: 1.5 + Math.random() * 2.5, star: true
          });
        }
      }, 600);
      setTimeout(() => {
        const vn = NARR.victory[Math.floor(Math.random() * NARR.victory.length)];
        showNarrative(vn, 3000, () =>
          irisWipe({ speed: 0.003, color: '#000', hold: 150, onMid: showStats }));
      }, 1200);
    }
  } else if (allPDead) {
    showMsg('DEFEAT', 9999);
    gameOver = true;
    audio.stopDrone();
    audio.defeat();
    screenFlash = { color: '#c45a3c', life: 1000, maxLife: 1000 };
    doShake(25);
    showWaveAnnounce('DEFEAT', 'all heroes fallen', 2500);
    slowMoTimer = 1500;
    slowMoFactor = 3;
    players.forEach(p => {
      const pp = h2p(p.q, p.r);
      for (let i = 0; i < 8; i++) {
        statusParticles.push({
          x: pp.x + (Math.random() - 0.5) * 16, y: pp.y,
          vx: (Math.random() - 0.5) * 0.5, vy: -1.5 - Math.random(),
          color: p.color, life: 3000, maxLife: 3000,
          size: 2 + Math.random() * 2, star: true
        });
      }
    });
    setTimeout(() => {
      const dn = NARR.defeat[Math.floor(Math.random() * NARR.defeat.length)];
      showNarrative(dn, 3000, () =>
        irisWipe({ speed: 0.003, color: '#000', hold: 150, onMid: showStats }));
    }, 1500);
  }
}
