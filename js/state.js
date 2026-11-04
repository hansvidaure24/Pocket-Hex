// Pocket Quest — Game state

// timing
let tickMs = 1500;
let tickTimer = 0;
let lastTime = 0;
let originalTickMs = 1500;
let tempoTicks = 0;

// game flags
let running = false;
let gameOver = false;
let paused = false;
let gamePhase = 'lobby'; // 'lobby' | 'game' | 'results'

// ui
let uiS = 1;
let showHelp = false;
let skillPreview = false;
let keyHintAlpha = 1;
let keyHintShown = false;

// entities
let entities = [];
let players = [];
let enemies = [];
let terrain = [];

// input
let pendingInput = null;
let pendingInputs = {};
let controllerSlots = {};
let tickCount = 0;
let totalTicks = 0;

// HUD messages
let msg = '';
let msgTimer = 0;
let waveLabel = '';
let waveLabelTimer = 0;
let waveAnnounce = { text: '', sub: '', life: 0, maxLife: 0 };
let ratingFlash = { grade: '', color: '', life: 0, maxLife: 0 };

// VFX arrays
let damageNumbers = [];
let flashEffects = [];
let projectiles = [];
let deathEffects = [];
let aoeEffects = [];
let trailEffects = [];
let statusParticles = [];
let ambientParticles = [];

// screen effects
let screenShake = { x: 0, y: 0, life: 0, intensity: 0 };
let screenFlash = { color: null, life: 0, maxLife: 0 };
let slowMoTimer = 0;
let slowMoFactor = 1;
let countdownTimer = 0;
let countdownText = '';
let hitStopTimer = 0;

// camera
let camOffX = 0;
let camOffY = 0;

// stats & tracking
let stats = {};
let mouseHex = null;
let hoverEntity = null;
let difficulty = 1;
let combatLogLines = [];
let killStreak = 0;
let lastKillTick = 0;
let killFeed = [];

// progression
let partyXP = 0;
let partyLevel = 1;
let xpToNext = 5;
let tickPulse = 0;
let dpsTicks = [];
let dpsDisplay = 0;
let encDmgTaken = 0;
let perfectClears = 0;
let waveRatings = [];

// lobby
let lobbyPlayers = [];

// campaign
let campaignNode = 0;
let campaignTotal = 4;
let campaignActive = false;
let CAMPAIGN_NODES = [];
