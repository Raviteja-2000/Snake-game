/**
 * Snake Game - Unit Tests
 * Tests for game logic, rendering, and storage
 */

import SnakeGame from '../src/SnakeGame.js';
import AudioManager from '../src/AudioManager.js';
import StorageManager from '../src/StorageManager.js';

describe('SnakeGame', () => {
  let game;

  beforeEach(() => {
    game = new SnakeGame(20);
    game.reset();
  });

  test('should initialize with correct snake length', () => {
    expect(game.snake.length).toBe(2);
  });

  test('should spawn food at valid location', () => {
    expect(game.food).toBeDefined();
    expect(game.food.x).toBeGreaterThanOrEqual(0);
    expect(game.food.x).toBeLessThan(20);
    expect(game.food.y).toBeGreaterThanOrEqual(0);
    expect(game.food.y).toBeLessThan(20);
  });

  test('should not spawn food on snake', () => {
    const occupied = new Set(game.snake.map(s => `${s.x},${s.y}`));
    const foodKey = `${game.food.x},${game.food.y}`;
    expect(occupied.has(foodKey)).toBe(false);
  });

  test('should prevent 180-degree turns', () => {
    game.direction = { x: 1, y: 0 };
    game.setDirection({ x: -1, y: 0 });
    expect(game.nextDirection).toEqual({ x: 1, y: 0 });
  });

  test('should allow valid direction changes', () => {
    game.direction = { x: 1, y: 0 };
    game.setDirection({ x: 0, y: 1 });
    expect(game.nextDirection).toEqual({ x: 0, y: 1 });
  });

  test('should increase score on food collision', () => {
    const initialScore = game.score;
    game.snake.push({ x: game.food.x, y: game.food.y });
    const result = game.tick(1);
    expect(result.type).toBe('eat');
    expect(game.score).toBeGreaterThan(initialScore);
  });

  test('should detect self collision', () => {
    game.snake = [
      { x: 10, y: 10 },
      { x: 11, y: 10 },
      { x: 11, y: 11 },
      { x: 10, y: 11 }
    ];
    game.direction = { x: 0, y: -1 };
    game.nextDirection = { x: 0, y: -1 };
    const result = game.tick(1);
    expect(result.type).toBe('crash');
    expect(game.gameOver).toBe(true);
  });

  test('should wrap around in classic mode', () => {
    game.mode = 'classic';
    game.snake = [{ x: 19, y: 10 }];
    game.direction = { x: 1, y: 0 };
    game.nextDirection = { x: 1, y: 0 };
    game.tick(1);
    expect(game.snake[game.snake.length - 1].x).toBe(0);
  });

  test('should crash at walls in arena mode', () => {
    game.mode = 'arena';
    game.snake = [{ x: 19, y: 10 }];
    game.direction = { x: 1, y: 0 };
    game.nextDirection = { x: 1, y: 0 };
    const result = game.tick(1);
    expect(result.type).toBe('crash');
  });

  test('should return correct difficulty speed base', () => {
    game.difficulty = 'easy';
    expect(game.getSpeedBase()).toBe(100);
    game.difficulty = 'normal';
    expect(game.getSpeedBase()).toBe(120);
    game.difficulty = 'hard';
    expect(game.getSpeedBase()).toBe(150);
  });
});

describe('AudioManager', () => {
  let audio;

  beforeEach(() => {
    audio = new AudioManager();
  });

  test('should initialize unmuted', () => {
    expect(audio.muted).toBe(false);
  });

  test('should toggle mute state', () => {
    audio.setMuted(true);
    expect(audio.muted).toBe(true);
    audio.setMuted(false);
    expect(audio.muted).toBe(false);
  });

  test('should not throw on audio methods when muted', () => {
    audio.setMuted(true);
    expect(() => {
      audio.playEatSound();
      audio.playPauseSound();
      audio.playCrashSound();
    }).not.toThrow();
  });
});

describe('StorageManager', () => {
  let storage;

  beforeEach(() => {
    storage = new StorageManager();
    storage.clear();
  });

  afterEach(() => {
    storage.clear();
  });

  test('should save and load values', () => {
    storage.save('test', { value: 42 });
    const loaded = storage.load('test');
    expect(loaded.value).toBe(42);
  });

  test('should return default value for missing key', () => {
    const result = storage.load('nonexistent', 'default');
    expect(result).toBe('default');
  });

  test('should delete values', () => {
    storage.save('test', 'value');
    storage.delete('test');
    const result = storage.load('test', 'default');
    expect(result).toBe('default');
  });

  test('should manage leaderboard', () => {
    const score1 = { name: 'Player1', score: 100 };
    const score2 = { name: 'Player2', score: 200 };

    storage.addScore(score1);
    storage.addScore(score2);

    const lb = storage.getLeaderboard();
    expect(lb.length).toBe(2);
    expect(lb[0].score).toBe(200);
    expect(lb[1].score).toBe(100);
  });

  test('should cap leaderboard at 10 entries', () => {
    for (let i = 0; i < 15; i++) {
      storage.addScore({ name: `Player${i}`, score: i });
    }
    const lb = storage.getLeaderboard();
    expect(lb.length).toBe(10);
  });
});
