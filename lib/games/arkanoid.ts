import type { CreateGame } from "@/lib/games/contract";

// ── Spritesheet (de assets/spritesheet.js, coordenadas sin cambios) ──────────

type Frame = { sx: number; sy: number; sw: number; sh: number };
type SpriteName = "paddle" | "ball" | `block_${string}`;

const EXPLOSION_FRAMES: Record<string, Frame[]> = {
  red: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
  cyan: [
    { sx: 256, sy: 192, sw: 32, sh: 16 },
    { sx: 288, sy: 192, sw: 32, sh: 16 },
    { sx: 320, sy: 192, sw: 32, sh: 16 },
    { sx: 352, sy: 192, sw: 32, sh: 16 },
  ],
  green: [
    { sx: 256, sy: 208, sw: 32, sh: 16 },
    { sx: 288, sy: 208, sw: 32, sh: 16 },
    { sx: 320, sy: 208, sw: 32, sh: 16 },
    { sx: 352, sy: 208, sw: 32, sh: 16 },
  ],
  magenta: [
    { sx: 256, sy: 224, sw: 32, sh: 16 },
    { sx: 288, sy: 224, sw: 32, sh: 16 },
    { sx: 320, sy: 224, sw: 32, sh: 16 },
    { sx: 352, sy: 224, sw: 32, sh: 16 },
  ],
  yellow: [
    { sx: 256, sy: 240, sw: 32, sh: 16 },
    { sx: 288, sy: 240, sw: 32, sh: 16 },
    { sx: 320, sy: 240, sw: 32, sh: 16 },
    { sx: 352, sy: 240, sw: 32, sh: 16 },
  ],
  hotpink: [
    { sx: 256, sy: 256, sw: 32, sh: 16 },
    { sx: 288, sy: 256, sw: 32, sh: 16 },
    { sx: 320, sy: 256, sw: 32, sh: 16 },
    { sx: 352, sy: 256, sw: 32, sh: 16 },
  ],
  gray: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
};

const EXPLOSION_DURATION = 150;

const SPRITES: { paddle: Frame; ball: Frame; blocks: Record<string, Frame> } = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  },
};

const SPRITESHEET_URL = "/games/arkanoid/spritesheet-breakout.png";
const BOUNCE_SOUND_URL = "/games/arkanoid/sounds/ball-bounce.mp3";
const BREAK_SOUND_URL = "/games/arkanoid/sounds/break-sound.mp3";

// ── Constantes del juego (de game.js, sin cambios) ──────────────────────────

type Screen = "start" | "playing" | "levelComplete" | "gameOver" | "victory";
type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  hitsLeft: number;
};
type Explosion = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  startTime: number;
};

// Ángulo máximo de rebote en la paleta (respecto a la vertical), en radianes.
const PADDLE_MAX_BOUNCE_ANGLE = Math.PI / 3; // 60°

// Velocidad base de la bola (px/paso) según el nivel (índice 0 = nivel 1).
const BASE_SPEEDS = [4, 5, 6];

// Duración de la pantalla "Nivel X completado" antes de pasar al siguiente nivel.
const LEVEL_COMPLETE_DURATION = 2000;

// Geometría de la cuadrícula de bloques.
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCK_GAP = 4;
const BLOCK_OFFSET_TOP = 50;

// Layout de cada nivel: matriz de colores (null = sin bloque en esa celda).
const LEVELS: (string | null)[][][] = [
  // Nivel 1
  [
    [
      "gray",
      "gray",
      "gray",
      "gray",
      "gray",
      "gray",
      "gray",
      "gray",
      "gray",
      "gray",
    ],
    ["red", "red", "red", "red", "red", "red", "red", "red", "red", "red"],
    [
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
    ],
    [
      "cyan",
      "cyan",
      "cyan",
      "cyan",
      "cyan",
      "cyan",
      "cyan",
      "cyan",
      "cyan",
      "cyan",
    ],
    [
      "magenta",
      "magenta",
      "magenta",
      "magenta",
      "magenta",
      "magenta",
      "magenta",
      "magenta",
      "magenta",
      "magenta",
    ],
  ],
  // Nivel 2
  [
    [
      "hotpink",
      "hotpink",
      "green",
      "green",
      "gray",
      "gray",
      "green",
      "green",
      "hotpink",
      "hotpink",
    ],
    [
      "gray",
      "red",
      "red",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "red",
      "red",
      "gray",
    ],
    [
      "cyan",
      "cyan",
      "magenta",
      "magenta",
      "gray",
      "gray",
      "magenta",
      "magenta",
      "cyan",
      "cyan",
    ],
    [
      "green",
      "green",
      "hotpink",
      "hotpink",
      "red",
      "red",
      "hotpink",
      "hotpink",
      "green",
      "green",
    ],
    [
      "gray",
      "yellow",
      "yellow",
      "cyan",
      "cyan",
      "cyan",
      "cyan",
      "yellow",
      "yellow",
      "gray",
    ],
    [
      "magenta",
      "magenta",
      "gray",
      "gray",
      "green",
      "green",
      "gray",
      "gray",
      "magenta",
      "magenta",
    ],
  ],
  // Nivel 3
  [
    [
      "gray",
      "red",
      "gray",
      "yellow",
      "gray",
      "gray",
      "yellow",
      "gray",
      "red",
      "gray",
    ],
    [
      "red",
      "hotpink",
      "hotpink",
      "green",
      "green",
      "green",
      "green",
      "hotpink",
      "hotpink",
      "red",
    ],
    [
      "yellow",
      "green",
      "gray",
      "cyan",
      "cyan",
      "cyan",
      "cyan",
      "gray",
      "green",
      "yellow",
    ],
    [
      "gray",
      "magenta",
      "magenta",
      "gray",
      "hotpink",
      "hotpink",
      "gray",
      "magenta",
      "magenta",
      "gray",
    ],
    [
      "cyan",
      "cyan",
      "green",
      "green",
      "gray",
      "gray",
      "green",
      "green",
      "cyan",
      "cyan",
    ],
    [
      "hotpink",
      "gray",
      "yellow",
      "yellow",
      "red",
      "red",
      "yellow",
      "yellow",
      "gray",
      "hotpink",
    ],
    [
      "gray",
      "magenta",
      "gray",
      "red",
      "gray",
      "gray",
      "red",
      "gray",
      "magenta",
      "gray",
    ],
  ],
];

// Paso fijo de 1/60 s: el original mueve todo en px por frame de rAF, así que
// sin él iría el doble de rápido a 120 Hz. Máximo de pasos por frame dibujado.
const STEP_MS = 1000 / 60;
const MAX_STEPS = 5;

/** Monta el juego sobre el canvas y arranca el bucle. */
export const createArkanoid: CreateGame = (
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

  const BLOCK_OFFSET_LEFT =
    (canvas.width - (10 * (BLOCK_W + BLOCK_GAP) - BLOCK_GAP)) / 2;

  // ── Estado ──────────────────────────────────────────────────────────────────
  const state: { screen: Screen; level: number; score: number; lives: number } =
    {
      screen: "start",
      level: 1, // 1..3
      score: 0,
      lives: 3,
    };
  const paddle = { x: 350, y: 560, w: 100, h: 20, speed: 8 };
  const ball = { x: 400, y: 300, vx: 4, vy: -4, radius: 8 };
  let blocks: Block[] = [];
  let explosions: Explosion[] = [];
  let keys: Record<string, boolean> = {};
  let levelCompleteStartTime = 0;

  let paused = false;
  let destroyed = false;
  let rafId = 0;
  let lastTs: number | null = null;
  let accumulator = 0;
  // Reloj del juego (ms): solo avanza en cada paso, no durante la pausa.
  let gameTime = 0;
  let lastStats = "";

  // ── Spritesheet y sonido ────────────────────────────────────────────────────
  let ssImg: HTMLCanvasElement | null = null;

  function loadSpritesheet(cb: () => void) {
    const rawImg = new Image();
    rawImg.onload = () => {
      if (destroyed) return;
      const oc = document.createElement("canvas");
      oc.width = rawImg.width;
      oc.height = rawImg.height;
      oc.getContext("2d")?.drawImage(rawImg, 0, 0);
      ssImg = oc;
      cb();
    };
    rawImg.onerror = () => console.error("Failed to load spritesheet");
    rawImg.src = SPRITESHEET_URL;
  }

  function drawFrame(frame: Frame, x: number, y: number, w: number, h: number) {
    if (!ssImg) return;
    ctx!.drawImage(ssImg, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
  }

  function drawSprite(
    name: SpriteName,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    if (!ssImg) return;
    const sp = name.startsWith("block_")
      ? SPRITES.blocks[name.slice(6)]
      : name === "paddle"
        ? SPRITES.paddle
        : SPRITES.ball;
    if (!sp) return;
    ctx!.drawImage(ssImg, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h);
  }

  const bounceSound = new Audio(BOUNCE_SOUND_URL);
  const breakSound = new Audio(BREAK_SOUND_URL);

  function playBounceSound() {
    bounceSound.currentTime = 0;
    bounceSound.play().catch(() => {});
  }

  function playBreakSound() {
    breakSound.currentTime = 0;
    breakSound.play().catch(() => {});
  }

  // ── Lógica ──────────────────────────────────────────────────────────────────
  function resetPaddle() {
    paddle.x = 350;
  }

  function launchBall() {
    const speed = BASE_SPEEDS[state.level - 1];
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.radius;
    ball.vx = speed;
    ball.vy = -speed;
  }

  function attachBallToPaddle() {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.radius;
    ball.vx = 0;
    ball.vy = 0;
  }

  function buildBlocksFromLayout(layout: (string | null)[][]): Block[] {
    const result: Block[] = [];
    layout.forEach((row, rowIndex) => {
      row.forEach((color, colIndex) => {
        if (!color) return;
        result.push({
          x: BLOCK_OFFSET_LEFT + colIndex * (BLOCK_W + BLOCK_GAP),
          y: BLOCK_OFFSET_TOP + rowIndex * (BLOCK_H + BLOCK_GAP),
          w: BLOCK_W,
          h: BLOCK_H,
          color,
          hitsLeft: color === "gray" ? 2 : 1,
        });
      });
    });
    return result;
  }

  function initLevel(levelNumber: number) {
    blocks = buildBlocksFromLayout(LEVELS[levelNumber - 1]);
  }

  function loseLife() {
    state.lives--;
    if (state.lives <= 0) {
      state.screen = "gameOver";
      onGameOver(state.score);
      return;
    }
    resetPaddle();
    attachBallToPaddle();
    state.screen = "start";
  }

  function restartGame() {
    state.level = 1;
    state.score = 0;
    state.lives = 3;
    state.screen = "start";
    explosions = [];
    levelCompleteStartTime = 0;
    initLevel(state.level);
    resetPaddle();
    attachBallToPaddle();
  }

  function checkLevelComplete() {
    if (blocks.length !== 0) return;
    if (
      state.screen === "gameOver" ||
      state.screen === "levelComplete" ||
      state.screen === "victory"
    )
      return;

    if (state.level < LEVELS.length) {
      state.screen = "levelComplete";
      levelCompleteStartTime = gameTime;
    } else {
      state.screen = "victory";
      onGameOver(state.score);
    }
  }

  function updateLevelTransition() {
    if (state.screen !== "levelComplete") return;
    if (gameTime - levelCompleteStartTime < LEVEL_COMPLETE_DURATION) return;

    state.level++;
    initLevel(state.level);
    resetPaddle();
    launchBall();
    state.screen = "playing";
  }

  function isLeftPressed() {
    return keys["ArrowLeft"] || keys["a"] || keys["A"];
  }

  function isRightPressed() {
    return keys["ArrowRight"] || keys["d"] || keys["D"];
  }

  function updatePaddle() {
    if (isLeftPressed()) paddle.x -= paddle.speed;
    if (isRightPressed()) paddle.x += paddle.speed;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));
  }

  function updateBall() {
    const prevY = ball.y;

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Borde inferior: la bola cayó por debajo de la paleta, se pierde una vida.
    if (ball.y - ball.radius > canvas.height) {
      loseLife();
      return;
    }

    // Pared izquierda / derecha
    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
      playBounceSound();
    } else if (ball.x + ball.radius >= canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.vx = -Math.abs(ball.vx);
      playBounceSound();
    }

    // Pared superior
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
      playBounceSound();
    }

    // Paleta: se detecta el cruce entre el paso anterior y el actual para
    // evitar que la bola la atraviese a alta velocidad (tunneling).
    const crossedPaddleTop =
      prevY + ball.radius <= paddle.y && ball.y + ball.radius >= paddle.y;
    const withinPaddleX =
      ball.x + ball.radius >= paddle.x &&
      ball.x - ball.radius <= paddle.x + paddle.w;
    if (ball.vy > 0 && crossedPaddleTop && withinPaddleX) {
      ball.y = paddle.y - ball.radius;

      const hitPoint = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2); // -1..1
      const clampedHitPoint = Math.max(-1, Math.min(1, hitPoint));
      const angle = clampedHitPoint * PADDLE_MAX_BOUNCE_ANGLE;
      const speed = Math.hypot(ball.vx, ball.vy);

      ball.vx = speed * Math.sin(angle);
      ball.vy = -speed * Math.cos(angle);
      playBounceSound();
    }
  }

  function circleIntersectsBlock(block: Block) {
    const closestX = Math.max(block.x, Math.min(ball.x, block.x + block.w));
    const closestY = Math.max(block.y, Math.min(ball.y, block.y + block.h));
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    return dx * dx + dy * dy <= ball.radius * ball.radius;
  }

  function resolveBlockBounce(block: Block) {
    const overlapLeft = ball.x + ball.radius - block.x;
    const overlapRight = block.x + block.w - (ball.x - ball.radius);
    const overlapTop = ball.y + ball.radius - block.y;
    const overlapBottom = block.y + block.h - (ball.y - ball.radius);
    const minOverlap = Math.min(
      overlapLeft,
      overlapRight,
      overlapTop,
      overlapBottom,
    );

    if (minOverlap === overlapLeft || minOverlap === overlapRight) {
      ball.vx = -ball.vx;
    } else {
      ball.vy = -ball.vy;
    }
  }

  function spawnExplosion(block: Block) {
    explosions.push({
      x: block.x,
      y: block.y,
      w: block.w,
      h: block.h,
      color: block.color,
      startTime: gameTime,
    });
  }

  function updateBlocks() {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (!circleIntersectsBlock(block)) continue;

      resolveBlockBounce(block);
      block.hitsLeft--;

      if (block.hitsLeft <= 0) {
        blocks.splice(i, 1);
        state.score += 10;
        playBreakSound();
        spawnExplosion(block);
      }

      break; // un solo bloque por paso es suficiente (no se solapan)
    }
  }

  function updateExplosions() {
    explosions = explosions.filter(
      (ex) =>
        gameTime - ex.startTime <
        EXPLOSION_DURATION * EXPLOSION_FRAMES[ex.color].length,
    );
  }

  function step() {
    if (state.screen === "playing") {
      updatePaddle();
      updateBall();
      updateBlocks();
      updateExplosions();
      checkLevelComplete();
    }
    if (state.screen === "start") {
      updatePaddle();
      attachBallToPaddle();
    }
    updateLevelTransition();
    gameTime += STEP_MS;
  }

  // ── Dibujo ──────────────────────────────────────────────────────────────────
  function draw() {
    const c = ctx!;
    c.clearRect(0, 0, canvas.width, canvas.height);
    drawSprite("paddle", paddle.x, paddle.y, paddle.w, paddle.h);
    drawSprite(
      "ball",
      ball.x - ball.radius,
      ball.y - ball.radius,
      ball.radius * 2,
      ball.radius * 2,
    );

    blocks.forEach((block) => {
      drawSprite(`block_${block.color}`, block.x, block.y, block.w, block.h);
    });

    explosions.forEach((ex) => {
      const frames = EXPLOSION_FRAMES[ex.color];
      const frameIndex = Math.min(
        frames.length - 1,
        Math.floor((gameTime - ex.startTime) / EXPLOSION_DURATION),
      );
      drawFrame(frames[frameIndex], ex.x, ex.y, ex.w, ex.h);
    });

    c.fillStyle = "#fff";
    c.font = "16px monospace";
    c.fillText(`Puntaje: ${state.score}`, 10, 20);

    const LIFE_ICON_SIZE = 16;
    const LIFE_ICON_GAP = 6;
    c.fillText("Vidas:", 10, 40);
    for (let i = 0; i < state.lives; i++) {
      const iconX = 70 + i * (LIFE_ICON_SIZE + LIFE_ICON_GAP);
      drawSprite(
        "ball",
        iconX,
        40 - LIFE_ICON_SIZE + 4,
        LIFE_ICON_SIZE,
        LIFE_ICON_SIZE,
      );
    }

    if (state.screen === "levelComplete") drawLevelCompleteOverlay();
    if (state.screen === "start") drawStartOverlay();
  }

  function drawStartOverlay() {
    const c = ctx!;
    c.fillStyle = "rgba(0, 0, 0, 0.7)";
    c.fillRect(0, 0, canvas.width, canvas.height);

    c.fillStyle = "#fff";
    c.textAlign = "center";

    c.font = "48px monospace";
    c.fillText("ARKANOID", canvas.width / 2, canvas.height / 2 - 40);

    c.font = "24px monospace";
    const message =
      state.level === 1 && state.score === 0
        ? "Presiona SPACE para jugar"
        : "Presiona SPACE para continuar";
    c.fillText(message, canvas.width / 2, canvas.height / 2);

    c.textAlign = "left";
  }

  function drawLevelCompleteOverlay() {
    const c = ctx!;
    c.fillStyle = "rgba(0, 0, 0, 0.7)";
    c.fillRect(0, 0, canvas.width, canvas.height);

    c.fillStyle = "#fff";
    c.textAlign = "center";
    c.font = "36px monospace";
    c.fillText(
      `¡Nivel ${state.level} completado!`,
      canvas.width / 2,
      canvas.height / 2,
    );
    c.textAlign = "left";
  }

  // ── Estadísticas ────────────────────────────────────────────────────────────
  function emitStats() {
    const key = `${state.score}|${state.lives}|${state.level}`;
    if (key === lastStats) return;
    lastStats = key;
    onStats({ score: state.score, lives: state.lives, level: state.level });
  }

  // ── Entrada ─────────────────────────────────────────────────────────────────
  function onKeyDown(e: KeyboardEvent) {
    const target = e.target;
    if (
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
    )
      return;

    const isSpace = e.key === " " || e.code === "Space";
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || isSpace)
      e.preventDefault();

    keys[e.key] = true;

    if (state.screen === "start" && isSpace && !paused) {
      launchBall();
      state.screen = "playing";
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    keys[e.key] = false;
  }

  function onBlur() {
    keys = {};
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  // ── Bucle ───────────────────────────────────────────────────────────────────
  function frame(ts: number) {
    rafId = requestAnimationFrame(frame);

    const dt = lastTs === null ? 0 : ts - lastTs;
    lastTs = ts;

    if (paused) {
      accumulator = 0;
    } else {
      accumulator = Math.min(accumulator + dt, STEP_MS * MAX_STEPS);
      while (accumulator >= STEP_MS) {
        step();
        accumulator -= STEP_MS;
      }
    }

    draw();
    emitStats();
  }

  initLevel(state.level);
  attachBallToPaddle();
  emitStats();
  loadSpritesheet(() => {
    if (destroyed) return;
    rafId = requestAnimationFrame(frame);
  });

  return {
    restart: () => {
      paused = false;
      keys = {};
      restartGame();
      lastStats = "";
      onRestart();
      emitStats();
    },
    setPaused: (value) => {
      paused = value;
      keys = {};
    },
    end: () => {
      if (state.screen === "gameOver" || state.screen === "victory") return;
      state.screen = "gameOver";
      onGameOver(state.score);
    },
    destroy: () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      bounceSound.pause();
      breakSound.pause();
    },
  };
};
