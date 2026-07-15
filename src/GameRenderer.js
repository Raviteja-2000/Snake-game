// Renderer - Canvas drawing and visual management
// Responsible for all game rendering to canvas

export class GameRenderer {
  constructor(canvas, gridSize = 20) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridSize = gridSize;
    this.cellSize = 0;
    this.cssVars = {};
  }

  // Update CSS variable cache
  updateCssVars(styleElement) {
    const styles = getComputedStyle(styleElement);
    this.cssVars = {
      panel: styles.getPropertyValue('--panel').trim() || '#0f162e',
      grid: styles.getPropertyValue('--grid').trim() || '#1b2342',
      text: styles.getPropertyValue('--text').trim() || '#e8efff',
      accent: styles.getPropertyValue('--accent').trim() || '#34d399'
    };
  }

  // Resize canvas to fit container
  resize(containerWidth, containerHeight, dpr = 1) {
    const size = Math.min(containerWidth, containerHeight);
    this.canvas.width = this.canvas.height = Math.floor(size * dpr);
    this.canvas.style.width = this.canvas.style.height = size + 'px';
    this.cellSize = Math.floor(this.canvas.width / this.gridSize);
  }

  // Draw complete game frame
  draw(gameState, paused = false) {
    const { snake, food, mode } = gameState;
    const { ctx, cellSize, gridSize, cssVars } = this;

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background
    ctx.fillStyle = cssVars.panel;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Arena walls
    if (mode === 'arena') {
      this._drawArenaWalls(cssVars.grid);
    }

    // Food
    if (food) {
      this._drawFood(food);
    }

    // Snake
    snake.forEach((segment, index) => {
      this._drawSnakeSegment(segment, index === snake.length - 1);
    });

    // Pause overlay
    if (paused) {
      this._drawPauseOverlay();
    }
  }

  // Draw arena walls
  _drawArenaWalls(color) {
    const b = Math.max(2, Math.floor(this.cellSize / 6));
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, b);
    this.ctx.fillRect(0, this.canvas.height - b, this.canvas.width, b);
    this.ctx.fillRect(0, 0, b, this.canvas.height);
    this.ctx.fillRect(this.canvas.width - b, 0, b, this.canvas.height);
  }

  // Draw food
  _drawFood(food) {
    const pad = Math.floor(this.cellSize * 0.12);
    const x = Math.floor(food.x * this.cellSize) + pad;
    const y = Math.floor(food.y * this.cellSize) + pad;
    const size = this.cellSize - 2 * pad;
    this.ctx.fillStyle = '#fb7185';
    this._roundRect(x, y, size, size, 6);
    this.ctx.fill();
  }

  // Draw snake segment
  _drawSnakeSegment(segment, isHead) {
    const pad = Math.floor(this.cellSize * 0.12);
    const x = Math.floor(segment.x * this.cellSize) + pad;
    const y = Math.floor(segment.y * this.cellSize) + pad;
    const size = this.cellSize - 2 * pad;
    this.ctx.fillStyle = isHead ? '#22d3ee' : '#7dd3fc';
    this._roundRect(x, y, size, size, 8);
    this.ctx.fill();
  }

  // Draw pause overlay
  _drawPauseOverlay() {
    this.ctx.fillStyle = 'rgba(0,0,0,.35)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'center';
    this.ctx.font = `${Math.floor(this.cellSize * 1.2)}px ui-sans-serif`;
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
  }

  // Draw rounded rectangle
  _roundRect(x, y, w, h, r) {
    if (this.ctx.roundRect) {
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, w, h, r);
      return;
    }
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, r);
    this.ctx.arcTo(x + w, y + h, x, y + h, r);
    this.ctx.arcTo(x, y + h, x, y, r);
    this.ctx.arcTo(x, y, x + w, y, r);
    this.ctx.closePath();
  }
}

export default GameRenderer;