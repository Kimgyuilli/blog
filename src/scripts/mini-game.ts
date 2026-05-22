type Cell = { x: number; y: number };

const COLS = 20;
const ROWS = 15;
const CELL = 20;

function setupSnake() {
  const root = document.querySelector<HTMLElement>('.mini-game');
  if (!root) return;
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const startBtn = root.querySelector<HTMLButtonElement>('.mini-game-start');
  const scoreEl = root.querySelector<HTMLElement>('.mini-game-score');
  const statusEl = root.querySelector<HTMLElement>('.mini-game-status');
  if (!canvas || !startBtn || !scoreEl || !statusEl) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = COLS * CELL * dpr;
  canvas.height = ROWS * CELL * dpr;
  canvas.style.width = `${COLS * CELL}px`;
  canvas.style.height = `${ROWS * CELL}px`;
  ctx.scale(dpr, dpr);

  let snake: Cell[] = [];
  let dir: Cell = { x: 1, y: 0 };
  let nextDir: Cell = { x: 1, y: 0 };
  let food: Cell = { x: 0, y: 0 };
  let score = 0;
  let best = Number(localStorage.getItem('snake:best') ?? 0);
  let running = false;
  let timer: number | null = null;

  const placeFood = () => {
    while (true) {
      const candidate = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
      if (!snake.some((s) => s.x === candidate.x && s.y === candidate.y)) {
        food = candidate;
        return;
      }
    }
  };

  const draw = () => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, ROWS * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(COLS * CELL, y * CELL);
      ctx.stroke();
    }

    ctx.fillStyle = '#f97373';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL + CELL / 2,
      food.y * CELL + CELL / 2,
      CELL / 2 - 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    snake.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? '#2e7d61' : '#4ea889';
      ctx.fillRect(segment.x * CELL + 1, segment.y * CELL + 1, CELL - 2, CELL - 2);
    });
  };

  const step = () => {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (
      head.x < 0 ||
      head.x >= COLS ||
      head.y < 0 ||
      head.y >= ROWS ||
      snake.some((s) => s.x === head.x && s.y === head.y)
    ) {
      gameOver();
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 1;
      scoreEl.textContent = `점수 ${score} · 최고 ${Math.max(best, score)}`;
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  };

  const gameOver = () => {
    running = false;
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
    if (score > best) {
      best = score;
      localStorage.setItem('snake:best', String(best));
    }
    statusEl.textContent = `게임 오버 · 점수 ${score}`;
    startBtn.textContent = '다시 시작';
    startBtn.hidden = false;
  };

  const start = () => {
    snake = [
      { x: 5, y: 7 },
      { x: 4, y: 7 },
      { x: 3, y: 7 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    placeFood();
    scoreEl.textContent = `점수 0 · 최고 ${best}`;
    statusEl.textContent = '방향키 또는 WASD로 조작';
    startBtn.hidden = true;
    running = true;
    if (timer !== null) window.clearInterval(timer);
    timer = window.setInterval(step, 250);
    draw();
  };

  const setDir = (x: number, y: number) => {
    if (!running) return;
    if (dir.x === -x && dir.y === -y) return;
    nextDir = { x, y };
  };

  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'w'].includes(key)) {
      setDir(0, -1);
      event.preventDefault();
    } else if (['arrowdown', 's'].includes(key)) {
      setDir(0, 1);
      event.preventDefault();
    } else if (['arrowleft', 'a'].includes(key)) {
      setDir(-1, 0);
      event.preventDefault();
    } else if (['arrowright', 'd'].includes(key)) {
      setDir(1, 0);
      event.preventDefault();
    }
  });

  let touchStart: { x: number; y: number } | null = null;
  canvas.addEventListener('touchstart', (event) => {
    const t = event.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  });
  canvas.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      setDir(dx > 0 ? 1 : -1, 0);
    } else {
      setDir(0, dy > 0 ? 1 : -1);
    }
    touchStart = null;
  });

  startBtn.addEventListener('click', start);
  scoreEl.textContent = `최고 점수 ${best}`;
  draw();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupSnake);
} else {
  setupSnake();
}
