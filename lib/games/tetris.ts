import type { CreateGame } from "@/lib/games/contract";

type Shape = number[][];
type Piece = { type: number; shape: Shape; x: number; y: number };

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

// Canvas único: tablero (300×600) + panel lateral (160×600).
const BOARD_W = COLS * BLOCK;
const BOARD_H = ROWS * BLOCK;
const PANEL_X = BOARD_W + 20;

const COLORS: (string | null)[] = [
  null,
  "#4dd0e1", // I - cyan
  "#ffd54f", // O - yellow
  "#ba68c8", // T - purple
  "#81c784", // S - green
  "#e57373", // Z - red
  "#90caf9", // J - pale blue
  "#ffb74d", // L - orange
  "#9e9e9e", // N - tuerca (gris metálico)
];

const PIECES: (Shape | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
];

const LINE_SCORES = [0, 100, 300, 500, 800];

// Colores fijos del tema oscuro del original (el tema claro se retira).
const C_PANEL_BG = "#0f0f17";
const C_BOARD_BG = "#1a1a25";
const C_BORDER = "#2a2a3a";
const C_GRID = "#22222e";
const C_LABEL = "#555570";
const C_VALUE = "#7aa2f7";
const C_TEXT = "#888888";
const FONT = "'Courier New', Courier, monospace";

// Teclas del juego: se les hace preventDefault para que no hagan scroll.
const GAME_KEYS = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"];

// Tope del paso de tiempo (ms): evita caídas en bloque al volver a la pestaña.
const MAX_DT = 1000;

const CONTROLS = ["← →  mover", "↑ X  rotar", "↓  bajar", "ESPACIO  caída"];

/** Monta el juego sobre el canvas y arranca el bucle. */
export const createTetris: CreateGame = (
  canvas,
  { onGameOver, onRestart, onStats },
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      restart: () => {},
      setPaused: () => {},
      end: () => {},
      destroy: () => {},
    };
  }

  // ── Estado ──────────────────────────────────────────────────────────────────
  let board: number[][] = [];
  let current: Piece;
  let next: Piece;
  let score = 0;
  let lines = 0;
  let level = 1;
  let paused = false;
  let gameOver = false;
  let lastTime: number | null = null;
  let dropAccum = 0;
  let dropInterval = 1000;
  let rafId = 0;
  let lastStats = "";

  function createBoard(): number[][] {
    return Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
  }

  function randomPiece(): Piece {
    const type = Math.floor(Math.random() * 8) + 1;
    const shape = (PIECES[type] as Shape).map((row) => [...row]);
    return {
      type,
      shape,
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };
  }

  function collide(shape: Shape, ox: number, oy: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = ox + c;
        const ny = oy + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function rotateCW(shape: Shape): Shape {
    const rows = shape.length;
    const cols = shape[0].length;
    const result = Array.from({ length: cols }, () =>
      new Array<number>(rows).fill(0),
    );
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
    return result;
  }

  function tryRotate() {
    const rotated = rotateCW(current.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!collide(rotated, current.x + kick, current.y)) {
        current.shape = rotated;
        current.x += kick;
        return;
      }
    }
  }

  function merge() {
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c])
          board[current.y + r][current.x + c] = current.shape[r][c];
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((v) => v !== 0)) {
        board.splice(r, 1);
        board.unshift(new Array<number>(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      lines += cleared;
      score += (LINE_SCORES[cleared] || 0) * level;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    }
  }

  function ghostY(): number {
    let gy = current.y;
    while (!collide(current.shape, current.x, gy + 1)) gy++;
    return gy;
  }

  function hardDrop() {
    const gy = ghostY();
    score += (gy - current.y) * 2;
    current.y = gy;
    lockPiece();
  }

  function softDrop() {
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
      score += 1;
    } else {
      lockPiece();
    }
  }

  function lockPiece() {
    merge();
    clearLines();
    spawn();
  }

  function spawn() {
    current = next;
    next = randomPiece();
    if (collide(current.shape, current.x, current.y)) endGame();
  }

  // Una sola notificación por partida: lo protege el flag `gameOver`.
  function endGame() {
    if (gameOver) return;
    gameOver = true;
    onGameOver(score);
  }

  // ── Dibujo ──────────────────────────────────────────────────────────────────
  function drawBlock(x: number, y: number, colorIndex: number, alpha = 1) {
    if (!ctx || !colorIndex) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS[colorIndex] as string;
    ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
    ctx.fillStyle = "rgba(255,255,255,0.12)"; // highlight
    ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, 4);
    ctx.globalAlpha = 1;
  }

  function drawGrid() {
    if (!ctx) return;
    ctx.strokeStyle = C_GRID;
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK, 0);
      ctx.lineTo(c * BLOCK, BOARD_H);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK);
      ctx.lineTo(BOARD_W, r * BLOCK);
      ctx.stroke();
    }
  }

  function drawPanelStat(label: string, value: string, y: number) {
    if (!ctx) return;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C_LABEL;
    ctx.font = `600 11px ${FONT}`;
    ctx.fillText(label, PANEL_X, y);
    ctx.fillStyle = C_VALUE;
    ctx.font = `700 24px ${FONT}`;
    ctx.fillText(value, PANEL_X, y + 30);
  }

  function drawPanel() {
    if (!ctx) return;
    drawPanelStat("SCORE", score.toLocaleString("es-ES"), 28);
    drawPanelStat("LINES", String(lines), 98);
    drawPanelStat("LEVEL", String(level), 168);

    // NEXT: cuadrícula de 4×4 bloques, pieza centrada.
    ctx.fillStyle = C_LABEL;
    ctx.font = `600 11px ${FONT}`;
    ctx.fillText("NEXT", PANEL_X, 238);
    const boxY = 248;
    ctx.fillStyle = C_BOARD_BG;
    ctx.fillRect(PANEL_X, boxY, 4 * BLOCK, 4 * BLOCK);
    ctx.strokeStyle = C_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(PANEL_X + 0.5, boxY + 0.5, 4 * BLOCK - 1, 4 * BLOCK - 1);
    const shape = next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    ctx.save();
    ctx.translate(PANEL_X, boxY);
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        drawBlock(offX + c, offY + r, shape[r][c]);
    ctx.restore();

    ctx.fillStyle = C_LABEL;
    ctx.font = `600 11px ${FONT}`;
    ctx.fillText("CONTROLS", PANEL_X, 398);
    ctx.fillStyle = C_TEXT;
    ctx.font = `12px ${FONT}`;
    CONTROLS.forEach((line, i) => ctx.fillText(line, PANEL_X, 424 + i * 22));
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = C_PANEL_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = C_BOARD_BG;
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);
    drawGrid();

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) drawBlock(c, r, board[r][c]);

    // fantasma
    const gy = ghostY();
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c])
          drawBlock(current.x + c, gy + r, current.shape[r][c], 0.2);

    // pieza actual
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        drawBlock(current.x + c, current.y + r, current.shape[r][c]);

    ctx.strokeStyle = C_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, BOARD_W - 1, BOARD_H - 1);
    drawPanel();
  }

  // ── Input ───────────────────────────────────────────────────────────────────
  // Los campos de texto de la app (modal) no deben controlar el juego.
  const isTyping = (e: KeyboardEvent) =>
    e.target instanceof HTMLElement && !!e.target.closest("input, textarea");

  const onKeyDown = (e: KeyboardEvent) => {
    if (isTyping(e)) return;
    if (GAME_KEYS.includes(e.code)) e.preventDefault();
    if (paused || gameOver) return;
    switch (e.code) {
      case "ArrowLeft":
        if (!collide(current.shape, current.x - 1, current.y)) current.x--;
        break;
      case "ArrowRight":
        if (!collide(current.shape, current.x + 1, current.y)) current.x++;
        break;
      case "ArrowDown":
        softDrop();
        break;
      case "ArrowUp":
      case "KeyX":
        tryRotate();
        break;
      case "Space":
        hardDrop();
        break;
    }
  };
  window.addEventListener("keydown", onKeyDown);

  // ── Ciclo de vida ───────────────────────────────────────────────────────────
  function init() {
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    paused = false;
    gameOver = false;
    dropInterval = 1000;
    dropAccum = 0;
    lastTime = null;
    next = randomPiece();
    spawn();
  }

  function restart() {
    init();
    onRestart();
  }

  function setPaused(value: boolean) {
    paused = value;
    lastTime = null; // descarta el tiempo transcurrido: sin caída instantánea al reanudar
  }

  function end() {
    if (gameOver) return;
    paused = false;
    endGame();
  }

  // Notifica a la app solo cuando cambian puntuación o nivel (sin vidas: 1 fija).
  function emitStats() {
    const key = `${score}|${level}`;
    if (key === lastStats) return;
    lastStats = key;
    onStats({ score, lives: 1, level });
  }

  function loop(ts: number) {
    const dt = lastTime === null ? 0 : Math.min(ts - lastTime, MAX_DT);
    lastTime = ts;
    if (!paused && !gameOver) {
      dropAccum += dt;
      if (dropAccum >= dropInterval) {
        dropAccum = 0;
        if (!collide(current.shape, current.x, current.y + 1)) current.y++;
        else lockPiece();
      }
    }
    draw();
    emitStats();
    rafId = requestAnimationFrame(loop);
  }

  init();
  rafId = requestAnimationFrame(loop);

  return {
    restart,
    setPaused,
    end,
    destroy: () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
    },
  };
};
