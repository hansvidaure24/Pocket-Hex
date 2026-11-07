// Loads the real game scripts into a Node VM, the way the browser runs them:
// classic scripts sharing one global scope. Canvas, DOM and audio are stubbed.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const JS = path.join(__dirname, '..', 'js');
const CORE = ['state.js', 'hex.js', 'data.js', 'vfx.js', 'combat.js', 'ai.js', 'survival.js'];

// Anything you call or read off it is a no-op that returns itself
function stub() {
  const fn = function () { return proxy; };
  const proxy = new Proxy(fn, {
    get: (_, key) => (key === Symbol.toPrimitive ? () => '' : key === 'value' ? 'random' : proxy),
    set: () => true,
  });
  return proxy;
}

function loadGame(files = CORE) {
  const ctx = {
    console, Math, Date, JSON, Set, Map, performance,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: stub(), audio: stub(),
    C: { width: 1600, height: 900 }, ctx: stub(),
    // drawing and UI hooks from files the tests don't load
    triggerLunge() {}, updateHUD() {}, survivalEnemyDmgBonus: () => 0, _esc: (s) => String(s),
  };
  ctx.window = ctx;
  ctx.addEventListener = () => {};
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), ctx, { filename: f });
  // let/const globals live in the script scope, not on ctx: reach them through eval
  ctx.$ = (expr) => vm.runInContext(expr, ctx);
  return ctx;
}

module.exports = { loadGame };
