// Main Game Controller - Orchestrates all game systems
// Responsible for game loop, state management, and event handling

import SnakeGame from './SnakeGame.js';
import GameRenderer from './GameRenderer.js';
import AudioManager from './AudioManager.js';
import StorageManager from './StorageManager.js';

export class GameController {
  constructor(config) {
    this.config = config;
    this.game = new SnakeGame(config.grid || 20);
    this.renderer = new GameRenderer(config.canvas, config.grid || 20);
    this.audio = new AudioManager();
    this.storage = new StorageManager();

    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.startTime = 0;
    this.speedMultiplier = 1;
    this.highScore = this.storage.load('high', 0);

    this._bindEvents();
  }

  // Bind UI events
  _bindEvents() {
    if (this.config.startBtn) this.config.startBtn.addEventListener('click', () => this.start());
    if (this.config.pauseBtn) this.config.pauseBtn.addEventListener('click', () => this.pause());
    if (this.config.restartBtn) this.config.restartBtn.addEventListener('click', () => this.restart());
    if (this.config.difficultyEl) this.config.difficultyEl.addEventListener('change', () => this.restart());
    if (this.config.modeEl) this.config.modeEl.addEventListener('change', () => this.restart());

    document.addEventListener('keydown', (e) => this._handleKeydown(e));
  }

  // Handle keyboard input
  _handleKeydown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      this.pause();
      return;
    }

    const dirMap = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      KeyW: { x: 0, y: -1 },
      KeyS: { x: 0, y: 1 },
      KeyA: { x: -1, y: 0 },
      KeyD: { x: 1, y: 0 }
    };

    if (dirMap[e.code]) {
      e.preventDefault();
      this.game.setDirection(dirMap[e.code]);
    }
  }

  // Initialize game
  init() {
    const theme = this.storage.load('theme', 'dark');
    const difficulty = this.storage.load('difficulty', 'normal');
    const muted = this.storage.load('muted', false);

    this.speedMultiplier = this.storage.load('speed', 1);
    this.game.setConfig({
      difficulty,
      mode: this.storage.load('mode', 'classic')
    });
    this.audio.setMuted(muted);
    this.renderer.updateCssVars(document.body);
    this.game.reset();
    this.render();
  }

  // Start game
  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.startTime = performance.now();
    this._gameLoop();
  }

  // Pause/unpause game
  pause() {
    if (!this.running) return;
    this.paused = !this.paused;
    this.audio[this.paused ? 'playPauseSound' : 'playUnpauseSound']();
    if (this.config.pauseOverlay) {
      this.config.pauseOverlay.setAttribute('aria-hidden', this.paused ? 'false' : 'true');
    }
  }

  // Restart game
  restart() {
    this.running = false;
    this.paused = false;
    this.accumulator = 0;
    if (this.config.pauseOverlay) {
      this.config.pauseOverlay.setAttribute('aria-hidden', 'true');
    }
    this.game.reset();
    this.render();
  }

  // Main game loop
  _gameLoop = () => {
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    if (!this.paused) {
      this.accumulator += dt;
    }

    const speedBase = this.game.getSpeedBase();
    const step = speedBase / this.speedMultiplier;

    while (this.accumulator >= step) {
      this.accumulator -= step;
      const result = this.game.tick(this.speedMultiplier);

      if (result.type === 'eat') {
        this.audio.playEatSound();
        if (navigator.vibrate) navigator.vibrate(30);
        if (this.config.scoreEl) this.config.scoreEl.textContent = String(result.score);
      } else if (result.type === 'crash') {
        this._gameOver(result.reason);
        return;
      }
    }

    this.render();
    if (this.running) requestAnimationFrame(this._gameLoop);
  }

  // Game over handler
  _gameOver(reason) {
    this.running = false;
    this.paused = false;
    this.audio.playCrashSound();
    if (navigator.vibrate) navigator.vibrate([70, 50, 70]);

    const duration = Math.round((performance.now() - this.startTime) / 1000);
    this.highScore = Math.max(this.game.score, this.highScore);
    this.storage.save('high', this.highScore);

    const scoreData = {
      name: 'BRS Enterprises',
      score: this.game.score,
      difficulty: this.game.difficulty,
      mode: this.game.mode,
      time: duration,
      date: new Date().toISOString()
    };

    this.storage.addScore(scoreData);

    if (this.config.onGameOver) {
      this.config.onGameOver({
        score: this.game.score,
        length: this.game.snake.length,
        time: duration,
        reason
      });
    }
  }

  // Render game state
  render() {
    const elapsed = this.running ? Math.floor((performance.now() - this.startTime) / 1000) : 0;
    if (this.config.timeEl) this.config.timeEl.textContent = elapsed + 's';
    this.renderer.draw(this.game.toJSON(), this.paused);
  }
}

export default GameController;