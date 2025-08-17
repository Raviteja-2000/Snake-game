const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const box = 20;
const rows = canvas.height / box;
const cols = canvas.width / box;

let snake = [{ x: 9 * box, y: 9 * box }];
let direction = "RIGHT";
let food = {
  x: Math.floor(Math.random() * cols) * box,
  y: Math.floor(Math.random() * rows) * box
};

const eatSound = document.getElementById("eatSound");
const gameOverSound = document.getElementById("gameOverSound");

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  else if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
});

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

const game = setInterval(draw, 100);
