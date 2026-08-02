// Nokia-authenticity changes: logical 84x48 canvas, pixel rendering, tick-based movement
// Preserves existing UI wiring and localStorage keys

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
const closeModal = document.getElementById('closeModal');
const lbEl = document.getElementById('leaderboard');
const canvasWrap = document.getElementById('canvasWrap');

const BRAND = 'BRS Enterprises';
// Logical Nokia resolution
const LOGICAL_W = 84;
const LOGICAL_H = 48;
let SCALE = 6; // default CSS scale, will be adjusted responsively

let CELL_W = 1, CELL_H = 1; // logical cell sizes in canvas pixels (we draw at logical resolution)
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

const rand = n => Math.floor(Math.random()*n);
const key = (x,y)=> `${x},${y}`;
const clamp = (v,min,max)=> v<min?min: v>max?max: v;
function save(k,v){ localStorage.setItem('snake_ultra_'+k, JSON.stringify(v)); }
function load(k,d){ try{return JSON.parse(localStorage.getItem('snake_ultra_'+k)) ?? d;}catch{return d;} }

// Resize: set canvas logical resolution to LOGICAL_W x LOGICAL_H and pick a CSS scale to fit container
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
  ctx.imageSmoothingEnabled = false;

  // update overlay grid to match logical cells
  gridOverlay.style.backgroundSize = `calc(100%/${LOGICAL_W}) calc(100%/${LOGICAL_H}), calc(100%/${LOGICAL_W}) calc(100%/${LOGICAL_H})`;

  draw();
}

window.addEventListener('resize', resize, { passive: true });
window.addEventListener('orientationchange', () => setTimeout(resize, 100), { passive: true });

document.addEventListener('visibilitychange', () => {
  if(document.hidden && running && !paused) pause();
}, { passive: true });

// WebAudio beep helper (keeps existing behavior)
let ac=null;
function beep(freq=880, duration=0.06, type='square', gainVal=0.08){
  if(muted) return;
  try{
    ac = ac || new (window.AudioContext||window.webkitAudioContext)();
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
function soundTick(){ beep(700, 0.03, 'square', 0.04); }

// leaderboard (local)
function getLB(){ return load('lb', []); }
function setLB(arr){ save('lb', arr.slice(0,10)); renderLB(); }
function pushLB(item){ const arr = getLB(); arr.push(item); arr.sort((a,b)=> b.score - a.score); setLB(arr); }
function renderLB(){
  const arr = getLB(); lbEl.innerHTML = '';
  if(!arr.length){ lbEl.innerHTML = '<span class="muted">No scores yet</span>'; return; }
  arr.forEach((r,i)=>{
    const name = r.name || 'Player';
    const left = document.createElement('div'); left.textContent = `${i+1}. ${name}`; left.className='muted';
    const right = document.createElement('div'); right.textContent = r.score; right.style.fontWeight='800';
    lbEl.append(left,right);
  });
}

// Game core
function reset(){
  MODE = modeEl.value;
  score = 0; scoreEl.textContent = '0';
  dir = {x:1,y:0}; nextDir = {x:1,y:0};
  // start near left center
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
const BASE_TICKS_PER_SEC = 6; // base speed (cells per second at SPEED=1)
function updateTickInterval(){
  const ticks = BASE_TICKS_PER_SEC * SPEED;
  tickInterval = 1000 / ticks;
}

function gameTick(){
  // apply queued direction, disallow immediate reverse
  if(!(nextDir.x === -dir.x && nextDir.y === -dir.y)) dir = nextDir;

  const head = { x: snake[snake.length-1].x + dir.x, y: snake[snake.length-1].y + dir.y };

  if(MODE === 'classic'){
    head.x = (head.x + LOGICAL_W) % LOGICAL_W;
    head.y = (head.y + LOGICAL_H) % LOGICAL_H;
  }

  if(MODE === 'arena' && (head.x < 0 || head.y < 0 || head.x >= LOGICAL_W || head.y >= LOGICAL_H)){
    return gameOver('Crashed into wall');
  }

  if(snake.some(s => s.x === head.x && s.y === head.y)){
    return gameOver('Bit your tail');
  }

  snake.push(head);

  if(food && head.x === food.x && head.y === food.y){
    score += 10; scoreEl.textContent = String(score);
    soundEat(); if(navigator.vibrate) navigator.vibrate(30);
    spawnFood();
    // small speed bump every 5 apples
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
  // We're drawing at logical resolution (84x48); each cell is 1x1 logical pixel
  ctx.clearRect(0,0,LOGICAL_W,LOGICAL_H);

  // Retro palette
  const bg = '#001100';
  const screenGreen = '#7bf67b';
  const dimGreen = '#2b7f2b';
  const foodCol = '#a6ff4d';

  // background
  ctx.fillStyle = bg; ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);

  // optional subtle scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for(let y=0;y<LOGICAL_H;y+=2){ ctx.fillRect(0,y,LOGICAL_W,1); }

  // draw food
  if(food){ ctx.fillStyle = foodCol; ctx.fillRect(food.x, food.y, 1, 1); }

  // draw snake
  for(let i=0;i<snake.length;i++){
    const p = snake[i];
    ctx.fillStyle = (i===snake.length-1) ? screenGreen : dimGreen;
    ctx.fillRect(p.x, p.y, 1, 1);
  }

  // paused overlay
  if(paused){
    // draw a blinking block in center as PAUSED indicator (keeps retro feel)
    ctx.fillStyle = '#00000088'; ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);
    ctx.fillStyle = '#c8ffc8';
    const text = 'PAUSED';
    // simple pixel text fallback: draw small rectangles for each char center
    const cx = Math.floor(LOGICAL_W/2)-10, cy = Math.floor(LOGICAL_H/2)-1;
    for(let i=0;i<6;i++){ ctx.fillRect(cx + i*3, cy, 2, 2); }
  }
}

function gameOver(reason){
  soundCrash(); if(navigator.vibrate) navigator.vibrate([70,50,70]);
  running = false; paused = false; acc = 0; last = 0;
  const duration = Math.round((performance.now()-startTime)/1000);
  finalScore.textContent = String(score);
  finalLen.textContent = String(snake.length);
  finalTime.textContent = `${duration}s`;
  resultTitle.textContent = 'Game Over';
  resultSubtitle.textContent = reason;
  resultModal.classList.add('active'); resultModal.setAttribute('aria-hidden','false');

  high = Math.max(score, load('high',0));
  save('high', high); highEl.textContent = String(high);
  pushLB({ name: BRAND, score, mode: MODE, grid: `${LOGICAL_W}x${LOGICAL_H}`, time: duration, date: new Date().toISOString() });
}

// Inputs
const dirs = {
  ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
  Numpad8:{x:0,y:-1}, Numpad2:{x:0,y:1}, Numpad4:{x:-1,y:0}, Numpad6:{x:1,y:0},
  KeyW:{x:0,y:-1}, KeyS:{x:0,y:1}, KeyA:{x:-1,y:0}, KeyD:{x:1,y:0}
};

document.addEventListener('keydown', (e)=>{
  if(e.code === 'Space'){ e.preventDefault(); pause(); return; }
  const nd = dirs[e.code]; if(!nd) return;
  // queue direction (no immediate reverse)
  if(snake.length>1 && (nd.x === -dir.x && nd.y === -dir.y)) return;
  nextDir = nd;
}, {passive:false});

// prevent page scroll from arrows/space
document.addEventListener('keydown', (e)=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
}, {passive:false});

// d-pad
dpad.addEventListener('click', (e)=>{
  if(e.target.tagName !== 'BUTTON') return;
  const m = {up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0}};
  const nd = m[e.target.getAttribute('data-dir')];
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
function start(){ if(running) return; paused=false; running=true; last=0; acc=0; startTime=performance.now(); requestAnimationFrame(tick); }
function pause(){ paused = !paused; beep(paused?220:520, .05); }
function restart(){ reset(); resize(); running=false; paused=false; acc=0; draw(); }

startBtn.onclick = ()=> start();
pauseBtn.onclick = ()=> pause();
restartBtn.onclick = ()=> restart();
playAgain.onclick = ()=>{ resultModal.classList.remove('active'); resultModal.setAttribute('aria-hidden','true'); restart(); start(); };
closeModal.onclick = ()=>{ resultModal.classList.remove('active'); resultModal.setAttribute('aria-hidden','true'); };

themeEl.onchange = ()=>{ const t = themeEl.value; document.body.classList.toggle('light', t==='light'); save('theme', t); };
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
  reset(); resize(); draw();
})();
