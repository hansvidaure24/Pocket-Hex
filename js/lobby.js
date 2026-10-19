// === Lobby ===
function setPhase(phase) {
  gamePhase = phase;
  document.getElementById('lobby-screen').style.display = phase === 'lobby' ? 'flex' : 'none';
  document.getElementById('game-screen').style.display = phase === 'game' ? 'block' : 'none';
  document.getElementById('menu-bg').style.display = phase === 'lobby' ? 'block' : 'none';
}

let hostCustomColor = null;
let hostPlaying = true;
const HOST_COLORS = [
  '#c45a3c', '#6b8cae', '#7ea879', '#c9973e',
  '#d47a3c', '#5a9aa8', '#b87a8a', '#a38530'
];

function buildHostColors() {
  const el = document.getElementById('host-colors');
  el.innerHTML = HOST_COLORS.map((c, i) =>
    `<span data-ci="${i}" style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${c};border:2px solid ${hostCustomColor === c ? '#fff' : 'transparent'};cursor:pointer;opacity:${hostCustomColor === c ? 1 : 0.5};transition:all 0.15s;box-shadow:${hostCustomColor === c ? '0 0 8px ' + c : 'none'}" onmouseenter="this.style.transform='scale(1.3)';this.style.opacity='1'" onmouseleave="this.style.transform='';this.style.opacity='${hostCustomColor === c ? 1 : 0.5}'"></span>`
  ).join('');
  el.querySelectorAll('span').forEach(s => {
    s.onclick = () => {
      const c = HOST_COLORS[parseInt(s.dataset.ci)];
      hostCustomColor = hostCustomColor === c ? null : c;
      buildHostColors();
      updateHostLobby();
    };
  });
}

function updateHostLobby() {
  const nm = document.getElementById('host-name').value.trim().toUpperCase();
  if (lobbyPlayers[0]) {
    lobbyPlayers[0].name = nm || 'P1 (Host)';
    lobbyPlayers[0].customColor = hostCustomColor;
  }
  updateLobbyDisplay();
}

function toggleHostPlay() {
  hostPlaying = document.getElementById('host-play').checked;
  document.getElementById('host-config').style.display = hostPlaying ? 'contents' : 'none';
  if (hostPlaying) {
    if (!lobbyPlayers[0] || lobbyPlayers[0].id !== 'host') {
      lobbyPlayers.unshift({
        id: 'host',
        name: document.getElementById('host-name').value.trim().toUpperCase() || 'P1 (Host)',
        classIdx: parseInt(document.getElementById('class-sel').value),
        loadout: parseInt(document.getElementById('loadout-sel').value),
        ready: true, isLocal: true, customColor: hostCustomColor
      });
    }
  } else {
    if (lobbyPlayers[0] && lobbyPlayers[0].id === 'host') lobbyPlayers.shift();
  }
  updateLobbyDisplay();
}

function goToLobby() {
  setPhase('lobby');
  hostPlaying = true;
  document.getElementById('host-play').checked = true;
  document.getElementById('host-config').style.display = 'contents';
  lobbyPlayers = [{ id: 'host', name: 'P1 (Host)', classIdx: 0, loadout: 0, ready: true, isLocal: true, customColor: null }];
  buildHostColors();
  updateLobbyDisplay();
}

function updateLobbyDisplay() {
  const el = document.getElementById('lobby-players');
  const numP = parseInt(document.getElementById('player-sel').value);
  let html = '';
  for (let i = 0; i < numP; i++) {
    const lp = lobbyPlayers[i];
    if (lp) {
      const kick = lp.isLocal ? '' : `<button class="kick-btn" title="Kick ${_esc(lp.name)}" data-kick="${_esc(lp.id)}">✕</button>`;
      const cls = CLASSES[lp.classIdx];
      const pCol = lp.customColor || cls.color;
      const rdyCol = lp.ready ? '#7ea879' : '#c49040';
      const rdyTxt = lp.ready ? 'READY' : 'waiting...';
      const lo = cls.loadouts[lp.loadout];
      const classIcons = ['🛡️', '🔮', '🗡️', '✨'];
      html += `<div style="--pc:${pCol}33;position:relative;background:linear-gradient(180deg,${pCol}12 0%,#1e1a15 30%,#12100c);border:1px solid ${pCol}44;border-top:2px solid ${pCol}88;border-radius:8px;padding:1.125rem 1.375rem;min-width:10.625rem;max-width:12.5rem;text-align:center;box-shadow:0 0 24px ${pCol}15;animation:slotJoin 0.5s ease-out">${kick}
        <div style="font-size:2.25rem;margin-bottom:0.25rem;filter:drop-shadow(0 2px 6px ${pCol}44)">${classIcons[lp.classIdx] || '⚔'}</div>
        <div style="color:${pCol};font-weight:700;font-size:1.125rem;letter-spacing:0.0625rem">${_esc(lp.name)}</div>
        <div style="font-size:0.875rem;margin-top:0.125rem;color:#ccc;font-weight:600">${cls.name}</div>
        <div style="font-size:0.625rem;color:#888;margin-top:0.1875rem;line-height:1.4">${cls.desc}</div>
        <div style="width:40px;height:1px;background:rgba(140,120,80,0.2);margin:0.375rem auto"></div>
        <div style="font-size:0.6875rem;color:#b8943e">${lo.name}</div>
        <div style="font-size:0.5625rem;color:#888;margin-top:0.0625rem">${lo.desc}</div>
        <div style="font-size:0.5625rem;color:#666;margin-top:0.25rem">♥${cls.hp}  ·  ${cls.ability}  ·  ${cls.cd} tick cd</div>
        <div style="color:${rdyCol};font-size:0.8125rem;font-weight:700;margin-top:0.375rem;letter-spacing:0.125rem;text-transform:uppercase${lp.ready ? ';animation:readyPulse 2s ease-in-out infinite' : ''}">${rdyTxt}</div>
      </div>`;
    } else {
      html += `<div style="background:linear-gradient(180deg,rgba(20,18,28,0.6),rgba(12,10,18,0.6));border:1px dashed rgba(140,120,80,0.15);border-radius:8px;padding:1.125rem 1.375rem;min-width:10.625rem;max-width:12.5rem;text-align:center">
        <div style="font-size:2.25rem;margin-bottom:0.25rem;opacity:0.2">👤</div>
        <div style="font-size:0.9375rem;font-weight:700;color:#555;letter-spacing:0.0625rem">P${i + 1}</div>
        <div style="font-size:0.6875rem;margin-top:0.375rem;color:#7a7468;letter-spacing:0.031rem">Waiting for player...</div>
      </div>`;
    }
  }
  el.innerHTML = html;
  el.querySelectorAll('[data-kick]').forEach(b => b.onclick = () => kickPlayer(b.dataset.kick));
  _updateStartBtn();
}

function _esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _lobbyReady() {
  const numP = parseInt(document.getElementById('player-sel').value);
  const seated = lobbyPlayers.slice(0, numP);
  const waiting = seated.filter(p => !p.isLocal && !p.ready);
  return { seated, numP, waiting, ok: waiting.length === 0 };
}

function _updateStartBtn() {
  const b = document.getElementById('start-btn');
  if (!b) return;
  const r = _lobbyReady();
  b.disabled = !r.ok;
  b.style.pointerEvents = '';
  b.style.fontSize = '';
  b.textContent = r.ok
    ? 'START ' + (selectedMode() === 'survival' ? 'SURVIVAL' : 'CAMPAIGN')
    : 'WAITING FOR ' + (r.waiting.length === 1 ? _esc(r.waiting[0].name).toUpperCase() : r.waiting.length + ' PLAYERS') + ' TO READY';
  b.title = r.ok ? '' : 'Every player who joined from a phone has to tap READY. Kick (✕) anyone who is AFK.';
}

const _kicked = new Set();
function kickPlayer(id) {
  if (!id || id === 'host') return;
  _kicked.add(id);
  lobbyPlayers = lobbyPlayers.filter(p => p.id !== id);
  _net.send(id, { type: 'kicked' });
  updateLobbyDisplay();
}

let isTutorial = false;
let tutStep = 0;
let tutFlags = { moved: false, attacked: false, skilled: false, defended: false };
const TUT_HINTS = [
  'WASD to MOVE toward the enemy (hold two for diagonals)',
  'Get ADJACENT, then SPACE to ATTACK',
  'Press F to use your SKILL',
  'Press G to DEFEND',
  'Nice! Starting real campaign...',
];

function encLabel() {
  return gameMode === 'survival'
    ? 'Wave ' + survivalWave()
    : 'Enc ' + (campaignNode + 1) + '/' + campaignTotal;
}

function selectedMode() {
  const m = document.getElementById('mode-sel');
  return m && m.value === 'survival' ? 'survival' : 'campaign';
}

function onModeChange() {
  const surv = selectedMode() === 'survival';
  document.getElementById('length-wrap').style.display = surv ? 'none' : '';
  const sp = document.getElementById('speed-sel');
  if (surv && sp.value === '1500') sp.value = '1000';
  if (!surv && sp.value === '1000') sp.value = '1500';
  document.getElementById('start-btn').dataset.mode = selectedMode();
  updateBestScoreLabel();
  if (gamePhase === 'lobby') updateLobbyDisplay();
}

function startFromLobby() {
  const btn = document.getElementById('start-btn');
  btn.disabled = true;
  btn.style.pointerEvents = 'none';
  let count = 3;
  btn.textContent = count;
  btn.style.fontSize = '32px';
  const iv = setInterval(() => {
    count--;
    if (count > 0) {
      btn.textContent = count;
    } else {
      clearInterval(iv);
      btn.textContent = 'GO!';
      setTimeout(() => {
        btn.style.fontSize = '';
        irisWipe({
          speed: 0.004, color: '#000', hold: 120,
          onMid: () => {
            setPhase('game');
            if (!hostPlaying) document.getElementById('touch-btns').style.display = 'none';
            if (selectedMode() === 'survival') startSurvival();
            else startCampaign();
          }
        });
      }, 400);
    }
  }, 700);
}

function restartRun() {
  irisWipe({
    speed: 0.005, color: '#000', hold: 80,
    onMid: () => {
      document.getElementById('pause-overlay').classList.remove('show');
      paused = false;
      if (gameMode === 'survival') startSurvival();
      else startCampaign();
    }
  });
}

function quitToLobby() {
  irisWipe({
    speed: 0.005, color: '#000', hold: 80,
    onMid: () => {
      ['pause-overlay', 'stats-overlay', 'transition-overlay'].forEach(id =>
        document.getElementById(id).classList.remove('show')
      );
      paused = false;
      running = false;
      gameOver = true;
      window._upgradeState = null;
      audio.stopDrone();
      goToLobby();
    }
  });
}

function playAgain() {
  irisWipe({
    speed: 0.005, color: '#000', hold: 80,
    onMid: () => {
      document.getElementById('stats-overlay').classList.remove('show');
      setPhase('game');
      if (gameMode === 'survival') startSurvival();
      else startCampaign();
    }
  });
}

function dedupeNames(list) {
  const seen = {};
  list.forEach(p => {
    const base = p.name;
    let n = base, k = 2;
    while (seen[n.toUpperCase()]) { n = base + k; k++; }
    seen[n.toUpperCase()] = 1;
    p.name = n;
  });
}

function startPractice() {
  irisWipe({
    speed: 0.004, color: '#000', hold: 120,
    onMid: () => {
      setPhase('game');
      if (!hostPlaying) document.getElementById('touch-btns').style.display = 'none';
      isTutorial = hostPlaying;
      tutStep = 0;
      tutFlags = { moved: false, attacked: false, skilled: false, defended: false };
      gameMode = 'campaign';
      BOARD = null;

      entities = []; players = []; enemies = [];
      pendingInput = null; tickCount = 0; totalTicks = 0;
      gameOver = false; paused = false;
      damageNumbers = []; flashEffects = []; projectiles = [];
      deathEffects = []; aoeEffects = []; trailEffects = []; statusParticles = [];
      msg = ''; msgTimer = 0;
      campaignNode = 0; campaignActive = false; campaignTotal = 1;
      CAMPAIGN_NODES = [{ type: 'combat', label: 'Practice' }];
      difficulty = 0;
      combatLogLines = [];
      document.getElementById('combat-log').innerHTML = '';

      const numP = parseInt(document.getElementById('player-sel').value);
      const hc = parseInt(document.getElementById('class-sel').value);
      const hl = parseInt(document.getElementById('loadout-sel').value);
      const roster = [];
      if (hostPlaying) {
        roster.push({
          classIdx: hc, loadout: hl, isBot: false, controllerId: null,
          name: document.getElementById('host-name').value.trim().toUpperCase() || null,
          customColor: hostCustomColor
        });
      }
      const startIdx = hostPlaying ? 1 : 0;
      for (let i = startIdx; i < numP; i++) {
        if (roster.length >= numP) break;
        const lp = lobbyPlayers.find(p => !p.isLocal && !roster.some(r => r.controllerId === p.id));
        if (lp) {
          roster.push({
            classIdx: lp.classIdx || 0, loadout: lp.loadout || 0,
            isBot: false, controllerId: lp.id, name: lp.name,
            customColor: lp.customColor || null
          });
        } else {
          const usedCi = roster.map(r => r.classIdx);
          let ci = 0;
          for (let j = 0; j < 4; j++) if (!usedCi.includes(j)) { ci = j; break; }
          roster.push({
            classIdx: ci, loadout: Math.floor(Math.random() * 2),
            isBot: true, controllerId: null, name: null, customColor: null
          });
        }
      }

      controllerSlots = {};
      const spawns = [{ q: -1, r: 2 }, { q: 0, r: 2 }, { q: 1, r: 2 }, { q: -1, r: 1 }];
      for (let i = 0; i < roster.length; i++) {
        const r = roster[i], cls = CLASSES[r.classIdx], sp = spawns[i];
        const p = {
          name: r.name || cls.name, hp: cls.hp, maxHp: cls.hp,
          color: r.customColor || cls.color, q: sp.q, r: sp.r,
          prevQ: sp.q, prevR: sp.r, isEnemy: false, classIdx: r.classIdx,
          ability: cls.ability, cd: cls.cd, cdTimer: 0,
          ghost: false, isBot: r.isBot, dmgBonus: 0, cdBonus: 0, upgrades: []
        };
        cls.loadouts[r.loadout].apply(p);
        p.loadout = cls.loadouts[r.loadout].name;
        if (r.controllerId) controllerSlots[r.controllerId] = i;
        players.push(p);
      }

      const dummySpawns = [{ q: 0, r: -2 }, { q: -1, r: -2 }, { q: 1, r: -2 }];
      for (let i = 0; i < Math.min(numP, 3); i++) {
        const sp = dummySpawns[i];
        enemies.push({
          name: 'Training Dummy', hp: 8, maxHp: 8, color: '#6a8a6a',
          q: sp.q, r: sp.r, prevQ: sp.q, prevR: sp.r,
          isEnemy: true, ai: 'tank', charging: false,
          shootTimer: 0, telegraph: false, telegraphTarget: null, spawnTick: 0
        });
      }

      entities = [...players, ...enemies];
      _occRebuild();
      generateTerrain('combat');
      tickMs = 2000; tickTimer = 0; running = true; paused = false;
      dedupeNames(players);
      initStats();

      camOffX = -HEX * (SQRT3 * p.q + SQRT3 / 2 * p.r);
      camOffY = -HEX * 1.5 * p.r;
      audio.startDrone();
      countdownTimer = 1800;
      countdownText = '3';
      audio.tick(false);
      setTimeout(() => { countdownText = '2'; audio.tick(false); }, 600);
      setTimeout(() => { countdownText = '1'; audio.tick(true); }, 1200);
      setTimeout(() => { countdownText = 'GO!'; screenFlash = { color: '#7ea879', life: 200, maxLife: 200 }; }, 1800);
      setTimeout(() => { countdownText = ''; }, 2400);
    }
  });
}
