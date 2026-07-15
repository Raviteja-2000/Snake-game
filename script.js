// Snake — Business Ultra (vanilla JS) - Responsive Edition
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
const VALID_MODES = ['classic', 'arena'];
const VALID_SPEEDS = [1, 2, 3, 4, 5, 6];
const MAX_SNAKE_LENGTH = 1000;

let GRID = 20;
let CELL = 0;
let SPEED = 1;
let MODE = 'classic';

let running = false, paused = false;
let last = 0, acc = 0, step = 110;
let snake = [];
let dir = {x:1,y:0};
let nextDir = {x:1,y:0};
let food = null;
let score = 0;
let startTime = 0;
let high = 0;
let muted = false;

// Cache CSS variables to avoid getComputedStyle in render loop
let cssVars = {
  panel: '#0f162e',
  grid: '#1b2342',
  text: '#e8efff',
  muted: '#93a4bd',
  accent: '#34d399',
  accentSecondary: '#60a5fa'
};

const rand = n => Math.floor(Math.random()*n);
const key = (x,y)=> `${x},${y}`;
const clamp = (v,min,max)=> v<min?min: v>max?max: v;
function gridToPx(n){ return Math.floor(n * CELL); }
function save(k,v){ localStorage.setItem('snake_ultra_'+k, JSON.stringify(v)); }
function load(k,d){ try{return JSON.parse(localStorage.getItem('snake_ultra_'+k)) ?? d;}catch{return d;} }

// Update CSS var cache
function updateCssVarCache() {
  const styles = getComputedStyle(document.body);
  cssVars = {
    panel: styles.getPropertyValue('--panel').trim() || '#0f162e',
    grid: styles.getPropertyValue('--grid').trim() || '#1b2342',
    text: styles.getPropertyValue('--text').trim() || '#e8efff',
    muted: styles.getPropertyValue('--muted').trim() || '#93a4bd',
    accent: styles.getPropertyValue('--accent').trim() || '#34d399',
    accentSecondary: styles.getPropertyValue('--accent-2').trim() || '#60a5fa'
  };
}

// Enhanced resize with better responsive handling
function resize(){
  const s = Math.min(canvasWrap.clientWidth, canvasWrap.clientHeight);
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = canvas.height = Math.floor(s * dpr);
  canvas.style.width = canvas.style.height = s + 'px';
  
  CELL = Math.floor(canvas.width / GRID);
  gridOverlay.style.backgroundSize = `calc(100%/${GRID}) calc(100%/${GRID}), calc(100%/${GRID}) calc(100%/${GRID})`;
  
  draw();
}

// Handle window resize and orientation change
window.addEventListener('resize', resize, { passive: true });
window.addEventListener('orientationchange', () => {
  setTimeout(resize, 100);
}, { passive: true });

// Handle visibility change to pause game
document.addEventListener('visibilitychange', () => {
  if(document.hidden && running && !paused) {
    pause();
  }
}, { passive: true });

// tiny beep
let ac=null;
function tone(freq=520, time=0.06){
  if(muted) return;
  try{
    ac = ac || new (window.AudioContext||window.webkitAudioContext)();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.value = freq; o.type='square';
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + time);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + time + 0.02);
  }catch(e){
    console.error('Audio error:', e);
  }
}

// leaderboard (local) - OPTIMIZED with DocumentFragment
function getLB(){ return load('lb', []); }
function setLB(arr){ save('lb', arr.slice(0,10)); renderLB(); }
function pushLB(item){ const arr = getLB(); arr.push(item); arr.sort((a,b)=> b.score - a.score); setLB(arr); }
function renderLB(){
  const arr = getLB();
  
  if(!arr.length){ 
    lbEl.innerHTML = '<span class="muted">No scores yet</span>'; 
    return; 
  }
  
  const frag = document.createDocumentFragment();
  
  arr.forEach((r,i)=>{
    const left = document.createElement('div'); 
    left.textContent = `${i+1}. ${r.name || 'Player}`; 
    left.className='muted';
    
    const right = document.createElement('div'); 
    right.textContent = r.score; 
    right.style.fontWeight='800';
    
    frag.appendChild(left);
    frag.appendChild(right);
  });
  
  lbEl.innerHTML = ''; // Clear once
  lbEl.appendChild(frag); // Add all at once
}

// Validate input values
function validateMode(mode) {
  return VALID_MODES.includes(mode) ? mode : 'classic';
}

function validateSpeed(speed) {
  return VALID_SPEEDS.includes(speed) ? speed : 1;
}

// core
function reset(){
  MODE = validateMode(modeEl.value);
  score = 0; scoreEl.textContent = '0';
  dir = {x:1,y:0}; nextDir = {x:1,y:0};
  snake = [ {x:Math.floor(GRID/2)-1, y:Math.floor(GRID/2)}, {x:Math.floor(GRID/2), y:Math.floor(GRID/2)} ];
  spawnFood();
  startTime = performance.now();
  document.querySelector('.brand .pill').textContent = BRAND;
  gridSizeEl.textContent = `${GRID}×${GRID}`;
}

function spawnFood(){
  const occ = new Set(snake.map(s=> key(s.x,s.y)));
  let x=0,y=0;
  do{ x = rand(GRID); y = rand(GRID); } while(occ.has(key(x,y)));
  food = {x,y};
}

function tick(){
  const base = 120;
  step = base / SPEED;

  const now = performance.now();
  const dt = now - last; last = now;
  if(!paused) acc += dt;
  if(running && !paused){
    const secs = Math.floor((now - startTime)/1000);
    timeEl.textContent = `${secs}s`;
  }

  while(acc >= step){
    acc -= step;

    dir = nextDir;
    const head = {x: snake[snake.length-1].x + dir.x, y: snake[snake.length-1].y + dir.y};

    if(MODE==='classic'){
      head.x = (head.x + GRID) % GRID;
      head.y = (head.y + GRID) % GRID;
    }
    if(MODE==='arena' && (head.x<0 || head.y<0 || head.x>=GRID || head.y>=GRID)){
      return gameOver('Crashed into wall');
    }

    if(snake.some(s=> s.x===head.x && s.y===head.y)){
      return gameOver('Bit your tail');
    }

    snake.push(head);

    if(food && head.x===food.x && head.y===food.y){
      score += 10 * SPEED;
      scoreEl.textContent = String(score);
      tone(760, .05);
      if(navigator.vibrate) navigator.vibrate(30);
      spawnFood();
    } else {
      snake.shift();
    }
    
    // CRITICAL: Prevent memory leak from unbounded snake growth
    if(snake.length > MAX_SNAKE_LENGTH) {
      return gameOver('Snake too long!');
    }
  }

  draw();
  if(running) requestAnimationFrame(tick);
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  
  // Use cached CSS vars instead of getComputedStyle (PERFORMANCE FIX)
  const snakeCol = '#7dd3fc';
  const headCol = '#22d3ee';
  const foodCol = '#fb7185';
  const pad = Math.floor(CELL*0.12);

  ctx.fillStyle = cssVars.panel;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  if(MODE==='arena'){
    ctx.fillStyle = cssVars.grid;
    const b = Math.max(2,Math.floor(CELL/6));
    ctx.fillRect(0,0,canvas.width,b);
    ctx.fillRect(0,canvas.height-b,canvas.width,b);
    ctx.fillRect(0,0,b,canvas.height);
    ctx.fillRect(canvas.width-b,0,b,canvas.height);
  }

  const fx = gridToPx(food.x)+pad, fy = gridToPx(food.y)+pad, fs = CELL-2*pad;
  ctx.fillStyle = foodCol; roundRect(ctx, fx, fy, fs, fs, 6); ctx.fill();

  snake.forEach((p, i)=>{
    const x = gridToPx(p.x)+pad, y = gridToPx(p.y)+pad, s = CELL-2*pad;
    ctx.fillStyle = (i===snake.length-1)? headCol : snakeCol;
    roundRect(ctx, x, y, s, s, 8); ctx.fill();
  });

  if(paused){
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff'; ctx.textAlign='center'; ctx.font = `${Math.floor(CELL*1.2)}px ui-sans-serif`;
    ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
  }
}

function gameOver(reason){
  tone(180,.2); if(navigator.vibrate) navigator.vibrate([70,50,70]);
  running = false; paused = false; acc = 0;
  const duration = Math.round((performance.now()-startTime)/1000);
  finalScore.textContent = String(score);
  finalLen.textContent = String(snake.length);
  finalTime.textContent = `${duration}s`;
  resultTitle.textContent = 'Game Over';
  resultSubtitle.textContent = reason;
  resultModal.classList.add('active');
  resultModal.setAttribute('aria-hidden', 'false');

  high = Math.max(score, load('high',0));
  save('high', high);
  highEl.textContent = String(high);

  pushLB({ name: BRAND, score, mode: MODE, grid: GRID, time: duration, date: new Date().toISOString() });
}

function roundRect(ctx, x,y,w,h,r){
  if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); return; }
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
}

// inputs
const dirs = {
  ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
  KeyW:{x:0,y:-1}, KeyS:{x:0,y:1}, KeyA:{x:-1,y:0}, KeyD:{x:1,y:0}
};
document.addEventListener('keydown', (e)=>{
  if(e.code==='Space'){ e.preventDefault(); pause(); return; }
  const nd = dirs[e.code]; if(!nd) return;
  if(snake.length>1 && (nd.x===-dir.x && nd.y===-dir.y)) return;
  nextDir = nd;
},{passive:false});

// Prevent scrolling on arrow key and space
document.addEventListener('keydown', (e)=>{
  if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)){
    e.preventDefault();
  }
}, {passive:false});

dpad.addEventListener('click', (e)=>{
  if(e.target.tagName!=='BUTTON') return;
  const m = {up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0}};
  const nd = m[e.target.getAttribute('data-dir')];
  if(snake.length>1 && (nd.x===-dir.x && nd.y===-dir.y)) return;
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
    if(nd.x!==0){ if(snake.length>1 && nd.x===-dir.x) return; nextDir = {x:nd.x, y:0}; }
    else { const y = nd.y>0?1:-1; if(snake.length>1 && y===-dir.y) return; nextDir = {x:0,y}; }
    dx=dy=0;
  }, {passive:true});
})();

// UI wiring
function start(){ if(running) return; paused = false; running = true; last = performance.now(); acc = 0; startTime = performance.now(); requestAnimationFrame(tick); }
function pause(){ paused = !paused; tone(paused?220:520,.05); }
function restart(){ reset(); resize(); running = false; paused = false; acc=0; draw(); }

startBtn.onclick = ()=> start();
pauseBtn.onclick = ()=> pause();
restartBtn.onclick = ()=> restart();
playAgain.onclick = ()=>{ resultModal.classList.remove('active'); resultModal.setAttribute('aria-hidden', 'true'); restart(); start(); };
closeModal.onclick = ()=>{ resultModal.classList.remove('active'); resultModal.setAttribute('aria-hidden', 'true'); };

themeEl.onchange = ()=>{ 
  const t = themeEl.value; 
  document.body.classList.toggle('light', t==='light'); 
  updateCssVarCache(); // CRITICAL: Update cache when theme changes
  save('theme', t); 
};
muteBtn.onclick = ()=>{ muted = !muted; muteBtn.textContent = 'Sound: ' + (muted? 'Off':'On'); save('muted', muted); };
modeEl.onchange = ()=> restart();
speedRange.oninput = ()=>{ 
  SPEED = validateSpeed(parseInt(speedRange.value, 10)); 
  speedView.textContent = SPEED+'x'; 
  save('speed', SPEED); 
};
helpBtn.onclick = ()=> alert('Eat food (+10). Avoid walls/tail. Controls: WASD/Arrows/Swipe/D-Pad. Space = Pause. Scores saved locally.');

// boot
(function boot(){
  document.querySelector('.brand .pill').textContent = BRAND;
  
  // Initialize CSS var cache
  updateCssVarCache();
  
  // Load and validate settings
  const theme = load('theme','dark'); 
  themeEl.value = theme; 
  document.body.classList.toggle('light', theme==='light');
  
  muted = !!load('muted', false); 
  muteBtn.textContent = 'Sound: ' + (muted? 'Off':'On');
  
  SPEED = validateSpeed(load('speed', 1)); 
  speedRange.value = SPEED; 
  speedView.textContent = SPEED+'x';
  
  const loadedMode = load('mode', 'classic');
  MODE = validateMode(loadedMode);
  modeEl.value = MODE;
  
  high = load('high',0); 
  highEl.textContent = String(high);
  
  renderLB();
  reset(); 
  resize(); 
  draw();
})();