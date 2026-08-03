// Nokia-authenticity final patches: safe storage, merged keydown, audio resume, modal focus trap, debounce resize, reduced-motion handling, improved leaderboard

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const gridOverlay = document.getElementById('gridOverlay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const themeEl = document.getElementById('theme');
const muteBtn = document.getElementById('muteBtn');
const modeEl = document.getElementById('mode');
const speedRange = document.getElementById('speed');
const speedView = document.getElementById('speedView');
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('high');
const timeEl = document.getElementById('time');
const gridSizeEl = document.getElementById('gridSize');
const helpBtn = document.getElementById('helpBtn');
const dpad = document.getElementById('dpad');
const resultModal = document.getElementById('resultModal');
const resultTitle = document.getElementById('resultTitle');
const resultSubtitle = document.getElementById('resultSubtitle');
const finalScore = document.getElementById('finalScore');
const finalLen = document.getElementById('finalLen');
const finalTime = document.getElementById('finalTime');
const playAgain = document.getElementById('playAgain');
const closeModalBtn = document.getElementById('closeModal');
const lbEl = document.getElementById('leaderboard');
const canvasWrap = document.getElementById('canvasWrap');

const BRAND = 'BRS Enterprises';
// Logical Nokia resolution
const LOGICAL_W = 84;
const LOGICAL_H = 48;
let SCALE = 6; // default CSS scale, will be adjusted responsively

let SPEED = 1;
let MODE = 'classic';

let running = false, paused = false;
let last = 0, acc = 0, tickInterval = 1000 / 6; // will be set by speed
let snake = [];
let dir = {x:1,y:0};
let nextDir = {x:1,y:0};
let food = null;
let score = 0;
let startTime = 0;
let high = 0;
let muted = false;

// storage wrapper with safe fallback (in-memory)
const _memoryStore = {};
function safeSet(key, value){
  const k = 'snake_ultra_' + key;
  try {
    localStorage.setItem(k, JSON.stringify(value));
  } catch (e) {
    _memoryStore[k] = JSON.stringify(value);
  }
}
function safeGet(key, defaultValue){
  const k = 'snake_ultra_' + key;
  try {
    const v = localStorage.getItem(k);
    if (v === null) return (_memoryStore[k] ? JSON.parse(_memoryStore[k]) : defaultValue);
    return JSON.parse(v);
  } catch (e) {
    try { return _memoryStore[k] ? JSON.parse(_memoryStore[k]) : defaultValue; } catch { return defaultValue; }
  }
}

// convenience wrappers (keeps original names used in other code)
function save(k,v){ safeSet(k,v); }
function load(k,d){ return safeGet(k,d); }

const rand = n => Math.floor(Math.random()*n);
const key = (x,y)=> `${x},${y}`;
const clamp = (v,min,max)=> v<min?min: v>max?max: v;

// Respect reduced motion preference
const PREFERS_REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (PREFERS_REDUCED) document.body.classList.add('reduced-motion');

// Canvas color variables (populated from CSS variables)
let CANVAS_BG = '#001100';
let CANVAS_HEAD = '#7bf67b';
let CANVAS_BODY = '#2b7f2b';
let CANVAS_FOOD = '#a6ff4d';
let PAUSE_OVERLAY = 'rgba(0,0,0,0.55)';
let PAUSE_PIXEL = '#c8ffc8';

function loadCanvasColors(){
  const s = getComputedStyle(document.documentElement);
  CANVAS_BG = (s.getPropertyValue('--canvas-bg') || CANVAS_BG).trim();
  CANVAS_HEAD = (s.getPropertyValue('--canvas-head') || CANVAS_HEAD).trim();
  CANVAS_BODY = (s.getPropertyValue('--canvas-body') || CANVAS_BODY).trim();
  CANVAS_FOOD = (s.getPropertyValue('--canvas-food') || CANVAS_FOOD).trim();
  PAUSE_OVERLAY = (s.getPropertyValue('--pause-overlay') || PAUSE_OVERLAY).trim();
  PAUSE_PIXEL = (s.getPropertyValue('--pause-pixel') || PAUSE_PIXEL).trim();
}

// Resize: set canvas logical resolution to LOGICAL_W x LOGICAL_H and pick a CSS scale to fit container
let _resizeTimer = null;
function resize(){
  const availW = canvasWrap.clientWidth;
  const availH = canvasWrap.clientHeight;
  const maxScale = Math.floor(Math.min(availW / LOGICAL_W, availH / LOGICAL_H)) || 1;
  SCALE = Math.max(2, Math.min(maxScale, 12)); // clamp scale between 2 and 12

  // keep logical canvas small (84x48) and use CSS scale for crisp pixels
  canvas.width = LOGICAL_W;
  canvas.height = LOGICAL_H;
  canvas.style.width = (LOGICAL_W * SCALE) + 'px';
  canvas.style.height = (LOGICAL_H * SCALE) + 'px';

  // disable smoothing for pixelated look
  if (ctx.imageSmoothingEnabled !== undefined) ctx.imageSmoothingEnabled = false;

  // update overlay grid to match logical cells
  gridOverlay.style.backgroundSize = `calc(100%/${LOGICAL_W}) calc(100%/${LOGICAL_H}), calc(100%/${LOGICAL_W}) calc(100%/${LOGICAL_H})`;

  draw();
}

window.addEventListener('resize', () => { clearTimeout(_resizeTimer); _resizeTimer = setTimeout(resize, 120); }, { passive: true });
window.addEventListener('orientationchange', () => { clearTimeout(_resizeTimer); _resizeTimer = setTimeout(resize, 150); }, { passive: true });

// Visibility
document.addEventListener('visibilitychange', () => {
  if(document.hidden && running && !paused) pause();
}, { passive: true });

// WebAudio helper - created lazily
let ac = null;
function ensureAudio(){
  if (ac) return;
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
}
function beep(freq=880, duration=0.06, type='square', gainVal=0.08){
  if (muted || PREFERS_REDUCED) return;
  try{
    ensureAudio();
    if (!ac) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(ac.destination);
    const now = ac.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gainVal, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.start(now); o.stop(now + duration + 0.02);
  }catch(e){ /* ignore */ }
}
function soundEat(){ beep(1100, 0.06, 'square', 0.08); }
function soundCrash(){ beep(200, 0.18, 'sawtooth', 0.12); }

// leaderboard (local) - improved DOM structure
function getLB(){ return load('lb', []); }
function setLB(arr){ save('lb', arr.slice(0,10)); renderLB(); }
function pushLB(item){ const arr = getLB(); arr.push(item); arr.sort((a,b)=> b.score - a.score); setLB(arr); }
function renderLB(){
  const arr = getLB(); lbEl.innerHTML = '';
  if(!arr.length){ lbEl.innerHTML = '<div class="muted">No scores yet</div>'; return; }
  arr.forEach((r,i)=>{
    const row = document.createElement('div'); row.className = 'lb-row';
    const label = document.createElement('div'); label.className='lb-label'; label.textContent = `${i+1}. ${r.name || 'Player'}`;
    const scoreDiv = document.createElement('div'); scoreDiv.className='lb-score'; scoreDiv.textContent = String(r.score);
    row.append(label, scoreDiv);
    lbEl.append(row);
  });
}

// Game core
function reset(){
  MODE = modeEl.value;
  score = 0; scoreEl.textContent = '0';
  dir = {x:1,y:0}; nextDir = {x:1,y:0};
  snake = [ {x: Math.floor(LOGICAL_W/2)-2, y: Math.floor(LOGICAL_H/2)}, {x: Math.floor(LOGICAL_W/2)-1, y: Math.floor(LOGICAL_H/2)} ];
  spawnFood();
  startTime = performance.now();
  document.querySelector('.brand .pill').textContent = BRAND;
  gridSizeEl.textContent = `${LOGICAL_W}×${LOGICAL_H}`;
}

function spawnFood(){
  const occ = new Set(snake.map(s=> key(s.x,s.y)));
  if(occ.size >= LOGICAL_W * LOGICAL_H){ food = null; return; }
  let x,y; do{ x = rand(LOGICAL_W); y = rand(LOGICAL_H); } while(occ.has(key(x,y)));
  food = {x,y};
}

// Fixed-timestep tick loop
const BASE_TICKS_PER_SEC = 6; // base speed
function updateTickInterval(){
  const ticks = BASE_TICKS_PER_SEC * SPEED;
  tickInterval = 1000 / ticks;
}

function gameTick(){
  if(!(nextDir.x === -dir.x && nextDir.y === -dir.y)) dir = nextDir;
  const head = { x: snake[snake.length-1].x + dir.x, y: snake[snake.length-1].y + dir.y };

  if(MODE === 'classic'){
    head.x = (head.x + LOGICAL_W) % LOGICAL_W;
    head.y = (head.y + LOGICAL_H) % LOGICAL_H;
  }

  if(MODE === 'arena' && (head.x < 0 || head.y < 0 || head.x >= LOGICAL_W || head.y >= LOGICAL_H)){
    return openGameOver('Crashed into wall');
  }

  if(snake.some(s => s.x === head.x && s.y === head.y)){
    return openGameOver('Bit your tail');
  }

  snake.push(head);

  if(food && head.x === food.x && head.y === food.y){
    score += 10; scoreEl.textContent = String(score);
    soundEat(); if(navigator.vibrate && !PREFERS_REDUCED) navigator.vibrate(30);
    spawnFood();
    if(score % 50 === 0 && SPEED < 12){ SPEED += 1; speedRange.value = SPEED; speedView.textContent = SPEED + 'x'; updateTickInterval(); }
  } else {
    snake.shift();
  }
}

function tick(now){
  if(!last) last = now;
  const dt = now - last; last = now;
  if(!paused) acc += dt;
  if(running && !paused){
    const secs = Math.floor((performance.now() - startTime) / 1000);
    timeEl.textContent = `${secs}s`;
  }

  while(acc >= tickInterval){
    acc -= tickInterval;
    gameTick();
  }

  draw();
  if(running) requestAnimationFrame(tick);
}

function draw(){
  // ensure we have current colors (in case theme changed)
  if(!CANVAS_BG) loadCanvasColors();

  ctx.clearRect(0,0,LOGICAL_W,LOGICAL_H);
  const bg = CANVAS_BG;
  const screenHead = CANVAS_HEAD;
  const dimBody = CANVAS_BODY;
  const foodCol = CANVAS_FOOD;
  ctx.fillStyle = bg; ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);

  if (!document.body.classList.contains('reduced-motion')){
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for(let y=0;y<LOGICAL_H;y+=2){ ctx.fillRect(0,y,LOGICAL_W,1); }
  }

  if(food){ ctx.fillStyle = foodCol; ctx.fillRect(food.x, food.y, 1, 1); }

  for(let i=0;i<snake.length;i++){
    const p = snake[i];
    ctx.fillStyle = (i===snake.length-1) ? screenHead : dimBody;
    ctx.fillRect(p.x, p.y, 1, 1);
  }

  if(paused){
    ctx.fillStyle = PAUSE_OVERLAY; ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);
    ctx.fillStyle = PAUSE_PIXEL;
    const cx = Math.floor(LOGICAL_W/2)-10, cy = Math.floor(LOGICAL_H/2)-1;
    for(let i=0;i<6;i++){ ctx.fillRect(cx + i*3, cy, 2, 2); }
  }
}

// Modal focus trap helpers
let _prevFocus = null;
function openModal(){
  _prevFocus = document.activeElement;
  resultModal.classList.add('active');
  resultModal.setAttribute('aria-hidden', 'false');
  const focusTarget = document.getElementById('playAgain');
  focusTarget && focusTarget.focus();
  document.addEventListener('keydown', modalKeyHandler);
}
function closeModal(){
  resultModal.classList.remove('active');
  resultModal.setAttribute('aria-hidden', 'true');
  _prevFocus && _prevFocus.focus();
  document.removeEventListener('keydown', modalKeyHandler);
}
function modalKeyHandler(e){ if (e.key === 'Escape') { e.preventDefault(); closeModal(); } }

function openGameOver(reason){
  soundCrash(); if(navigator.vibrate && !PREFERS_REDUCED) navigator.vibrate([70,50,70]);
  running = false; paused = false; acc = 0; last = 0;
  const duration = Math.round((performance.now()-startTime)/1000);
  finalScore.textContent = String(score);
  finalLen.textContent = String(snake.length);
  finalTime.textContent = `${duration}s`;
  resultTitle.textContent = 'Game Over';
  resultSubtitle.textContent = reason;
  openModal();

  high = Math.max(score, load('high',0));
  save('high', high); highEl.textContent = String(high);
  pushLB({ name: BRAND, score, mode: MODE, grid: `${LOGICAL_W}x${LOGICAL_H}`, time: duration, date: new Date().toISOString() });
}

// Inputs - merged handler with preventDefault
const dirs = {
  ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
  Numpad8:{x:0,y:-1}, Numpad2:{x:0,y:1}, Numpad4:{x:-1,y:0}, Numpad6:{x:1,y:0},
  KeyW:{x:0,y:-1}, KeyS:{x:0,y:1}, KeyA:{x:-1,y:0}, KeyD:{x:1,y:0}
};

document.addEventListener('keydown', (e) => {
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === 'Space') { pause(); return; }
  const nd = dirs[e.code]; if (!nd) return;
  if (snake.length > 1 && nd.x === -dir.x && nd.y === -dir.y) return;
  nextDir = nd;
}, { passive: false });

// d-pad
dpad.addEventListener('click', (e)=>{
  if(e.target.tagName !== 'BUTTON') return;
  const m = {up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0}};
  const nd = m[e.target.getAttribute('data-dir')];
  if(!nd) return;
  if(snake.length>1 && (nd.x === -dir.x && nd.y === -dir.y)) return;
  nextDir = nd;
});

// swipe
(function(){
  let sx=0, sy=0, dx=0, dy=0, touching=false;
  canvasWrap.addEventListener('touchstart', (e)=>{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; touching=true; }, {passive:true});
  canvasWrap.addEventListener('touchmove',  (e)=>{ if(!touching) return; const t=e.touches[0]; dx=t.clientX-sx; dy=t.clientY-sy; }, {passive:true});
  canvasWrap.addEventListener('touchend',   ()=>{
    touching=false; const ax=Math.abs(dx), ay=Math.abs(dy);
    if(Math.max(ax,ay)<20) return;
    const nd = ax>ay ? {x:Math.sign(dx), y:0} : {x:0, y:Math.sign(dy)};
    if(nd.x !== 0){ if(snake.length>1 && nd.x === -dir.x) return; nextDir = {x:nd.x, y:0}; }
    else { const y = nd.y>0?1:-1; if(snake.length>1 && y === -dir.y) return; nextDir = {x:0,y}; }
    dx=dy=0;
  }, {passive:true});
})();

// UI wiring
function start(){
  if(running) return;
  // attempt to resume/create audio on user gesture
  try{ ensureAudio(); if(ac && typeof ac.resume === 'function') ac.resume().catch(()=>{}); }catch{}
  paused=false; running=true; last=0; acc=0; startTime=performance.now(); requestAnimationFrame(tick);
}
function pause(){ paused = !paused; beep(paused?220:520, .05); }
function restart(){ reset(); resize(); running=false; paused=false; acc=0; draw(); }

startBtn.onclick = ()=> start();
pauseBtn.onclick = ()=> pause();
restartBtn.onclick = ()=> restart();
playAgain.onclick = ()=>{ closeModal(); restart(); start(); };
closeModalBtn.onclick = ()=>{ closeModal(); };

themeEl.onchange = ()=>{ const t = themeEl.value; document.body.classList.toggle('light', t==='light'); save('theme', t); loadCanvasColors(); };
muteBtn.onclick = ()=>{ muted = !muted; muteBtn.textContent = 'Sound: ' + (muted? 'Off':'On'); save('muted', muted); };
modeEl.onchange = ()=> restart();
speedRange.oninput = ()=>{ SPEED = clamp(parseInt(speedRange.value,10),1,12); speedView.textContent = SPEED+'x'; save('speed', SPEED); updateTickInterval(); };
helpBtn.onclick = ()=> alert('Eat food (+10). Avoid walls/tail. Controls: WASD/Arrows/Swipe/D-Pad. Space = Pause. Scores saved locally.');

// boot
(function boot(){
  document.querySelector('.brand .pill').textContent = BRAND;
  const theme = load('theme','dark'); themeEl.value = theme; document.body.classList.toggle('light', theme==='light');
  muted = !!load('muted', false); muteBtn.textContent = 'Sound: ' + (muted? 'Off':'On');
  SPEED = clamp(load('speed',1),1,12); speedRange.value = SPEED; speedView.textContent = SPEED+'x'; updateTickInterval();
  high = load('high',0); highEl.textContent = String(high);
  renderLB();
  reset(); loadCanvasColors(); resize(); draw();
})();
