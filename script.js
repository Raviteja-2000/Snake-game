const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const box = 20;
const rows = canvas.height / box;
const cols = canvas.width / box;

let snake = [];
let direction = "RIGHT";
let food;
let game;
let isRunning = false;

const eatSound = document.getElementById("eatSound");
const gameOverSound = document.getElementById("gameOverSound");

document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  if ((key === "arrowup" || key === "w") && direction !== "DOWN") direction = "UP";
  else if ((key === "arrowdown" || key === "s") && direction !== "UP") direction = "DOWN";
  else if ((key === "arrowleft" || key === "a") && direction !== "RIGHT") direction = "LEFT";
  else if ((key === "arrowright" || key === "d") && direction !== "LEFT") direction = "RIGHT";
});

document.getElementById("startBtn").addEventListener("click", () => {
  if (!isRunning) {
    isRunning = true;
    game = setInterval(draw, 100);
  }
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  clearInterval(game);
  isRunning = false;
});

document.getElementById("resetBtn").addEventListener("click", () => {
  clearInterval(game);
  isRunning = false;
  resetGame();
});

function resetGame() {
  snake = [{ x: 9 * box, y: 9 * box }];
  direction = "RIGHT";
  food = {
    x: Math.floor(Math.random() * cols) * box,
    y: Math.floor(Math.random() * rows) * box
  };
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw snake
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? "#0f0" : "#fff";
    ctx.fillRect(snake[i].x, snake[i].y, box, box);
  }

  // Draw food
  ctx.fillStyle = "#f00";
  ctx.fillRect(food.x, food.y, box, box);

  // Move snake
  let headX = snake[0].x;
  let headY = snake[0].y;

  if (direction === "UP") headY -= box;
  if (direction === "DOWN") headY += box;
  if (direction === "LEFT") headX -= box;
  if (direction === "RIGHT") headX += box;

  // Check collision
  if (
    headX < 0 || headX >= canvas.width ||
    headY < 0 || headY >= canvas.height ||
    snake.some(segment => segment.x === headX && segment.y === headY)
  ) {
    clearInterval(game);
    isRunning = false;
    gameOverSound.play();
    alert("Game Over!");
    return;
  }

  let newHead = { x: headX, y: headY };

  // Eat food
  if (headX === food.x && headY === food.y) {
    eatSound.play();
    food = {
      x: Math.floor(Math.random() * cols) * box,
      y: Math.floor(Math.random() * rows) * box
    };
  } else {
    snake.pop();
  }

  snake.unshift(newHead);
}

// Initialize game
resetGame();
