// Game Core - Snake Entity Management
// Responsible for snake state, movement, and collision detection

export class SnakeGame {
  constructor(grid = 20) {
    this.grid = grid;
    this.snake = [];
    this.food = null;
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.gameOver = false;
    this.mode = 'classic';
    this.difficulty = 'normal';
    this.difficulty_config = {
      easy: { speedBase: 100, name: 'Easy' },
      normal: { speedBase: 120, name: 'Normal' },
      hard: { speedBase: 150, name: 'Hard' }
    };
  }

  // Initialize game state
  reset() {
    this.snake = [
      { x: Math.floor(this.grid / 2) - 1, y: Math.floor(this.grid / 2) },
      { x: Math.floor(this.grid / 2), y: Math.floor(this.grid / 2) }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.gameOver = false;
    this.spawnFood();
  }

  // Set game configuration
  setConfig(config) {
    if (config.mode) this.mode = config.mode;
    if (config.difficulty) this.difficulty = config.difficulty;
  }

  // Spawn food at random location not occupied by snake
  spawnFood() {
    const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`));
    let x, y;
    do {
      x = Math.floor(Math.random() * this.grid);
      y = Math.floor(Math.random() * this.grid);
    } while (occupied.has(`${x},${y}`));
    this.food = { x, y };
  }

  // Update game state for one tick
  tick(speedMultiplier = 1) {
    this.direction = { ...this.nextDirection };
    const head = { ...this.snake[this.snake.length - 1] };
    head.x += this.direction.x;
    head.y += this.direction.y;

    // Handle wrapping or walls based on mode
    if (this.mode === 'classic') {
      head.x = (head.x + this.grid) % this.grid;
      head.y = (head.y + this.grid) % this.grid;
    } else if (this.mode === 'arena') {
      if (head.x < 0 || head.y < 0 || head.x >= this.grid || head.y >= this.grid) {
        this.gameOver = true;
        return { type: 'crash', reason: 'Crashed into wall' };
      }
    }

    // Collision with self
    if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this.gameOver = true;
      return { type: 'crash', reason: 'Bit your tail' };
    }

    this.snake.push(head);

    // Food collision
    if (this.food && head.x === this.food.x && head.y === this.food.y) {
      this.score += 10 * speedMultiplier;
      this.spawnFood();
      return { type: 'eat', score: this.score };
    } else {
      this.snake.shift();
    }

    // Prevent unbounded growth
    if (this.snake.length > 1000) {
      this.gameOver = true;
      return { type: 'crash', reason: 'Snake too long!' };
    }

    return { type: 'tick', score: this.score };
  }

  // Set next direction (with prevention of 180-degree turns)
  setDirection(dir) {
    if (this.snake.length > 1) {
      const opposite = this.direction.x === -dir.x && this.direction.y === -dir.y;
      if (opposite) return;
    }
    this.nextDirection = dir;
  }

  // Get difficulty speed base
  getSpeedBase() {
    return this.difficulty_config[this.difficulty]?.speedBase || 120;
  }

  // Serialize state for debugging
  toJSON() {
    return {
      snake: this.snake,
      food: this.food,
      direction: this.direction,
      score: this.score,
      gameOver: this.gameOver,
      mode: this.mode,
      difficulty: this.difficulty
    };
  }
}

export default SnakeGame;