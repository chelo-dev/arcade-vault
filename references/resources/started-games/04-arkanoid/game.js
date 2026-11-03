// Arkanoid — MVP clásico
// Estado global del juego (ver specs/01-mvp-arkanoid-clasico.md)

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const state = {
  screen: 'start', // 'start' | 'playing' | 'paused' | 'levelComplete' | 'gameOver' | 'victory'
  level: 1, // 1..3
  score: 0,
  lives: 3,
  highScore: 0, // cargado de localStorage al iniciar
};

// Paleta
const paddle = { x: 350, y: 560, w: 100, h: 20, speed: 8 };

// Bola
const ball = { x: 400, y: 300, vx: 4, vy: -4, radius: 8 };

// Ángulo máximo de rebote en la paleta (respecto a la vertical), en radianes.
const PADDLE_MAX_BOUNCE_ANGLE = Math.PI / 3; // 60°

// Velocidad base de la bola (px/frame) según el nivel (índice 0 = nivel 1).
const BASE_SPEEDS = [ 4, 5, 6 ];

function resetPaddle() {
  paddle.x = 350;
}

function launchBall() {
  const speed = BASE_SPEEDS[ state.level - 1 ];
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

function loseLife() {
  state.lives--;
  if ( state.lives <= 0 ) {
    state.screen = 'gameOver';
    return;
  }
  resetPaddle();
  attachBallToPaddle();
  state.screen = 'start';
}

function restartGame() {
  state.level = 1;
  state.score = 0;
  state.lives = 3;
  state.screen = 'start';
  initLevel( state.level );
  resetPaddle();
  attachBallToPaddle();
}

// Duración de la pantalla "Nivel X completado" antes de pasar al siguiente nivel.
const LEVEL_COMPLETE_DURATION = 2000;
let levelCompleteStartTime = null;

function checkLevelComplete() {
  if ( blocks.length !== 0 ) return;
  if ( state.screen === 'gameOver' || state.screen === 'levelComplete' || state.screen === 'victory' ) return;

  if ( state.level < LEVELS.length ) {
    state.screen = 'levelComplete';
    levelCompleteStartTime = performance.now();
  } else {
    state.screen = 'victory';
  }
}

function updateLevelTransition() {
  if ( state.screen !== 'levelComplete' ) return;
  if ( performance.now() - levelCompleteStartTime < LEVEL_COMPLETE_DURATION ) return;

  state.level++;
  initLevel( state.level );
  resetPaddle();
  launchBall();
  state.screen = 'playing';
}

const bounceSound = new Audio( 'assets/sounds/ball-bounce.mp3' );
const breakSound = new Audio( 'assets/sounds/break-sound.mp3' );

function playBounceSound() {
  bounceSound.currentTime = 0;
  bounceSound.play().catch( () => {} );
}

function playBreakSound() {
  breakSound.currentTime = 0;
  breakSound.play().catch( () => {} );
}

// Geometría de la cuadrícula de bloques.
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCK_GAP = 4;
const BLOCK_OFFSET_TOP = 50;
const BLOCK_OFFSET_LEFT = ( canvas.width - ( 10 * ( BLOCK_W + BLOCK_GAP ) - BLOCK_GAP ) ) / 2;

// Layout de cada nivel: matriz de colores (null = sin bloque en esa celda).
const LEVELS = [
  // Nivel 1
  [
    [ 'gray', 'gray', 'gray', 'gray', 'gray', 'gray', 'gray', 'gray', 'gray', 'gray' ],
    [ 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red' ],
    [ 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow' ],
    [ 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan' ],
    [ 'magenta', 'magenta', 'magenta', 'magenta', 'magenta', 'magenta', 'magenta', 'magenta', 'magenta', 'magenta' ],
  ],
  // Nivel 2
  [
    [ 'hotpink', 'hotpink', 'green', 'green', 'gray', 'gray', 'green', 'green', 'hotpink', 'hotpink' ],
    [ 'gray', 'red', 'red', 'yellow', 'yellow', 'yellow', 'yellow', 'red', 'red', 'gray' ],
    [ 'cyan', 'cyan', 'magenta', 'magenta', 'gray', 'gray', 'magenta', 'magenta', 'cyan', 'cyan' ],
    [ 'green', 'green', 'hotpink', 'hotpink', 'red', 'red', 'hotpink', 'hotpink', 'green', 'green' ],
    [ 'gray', 'yellow', 'yellow', 'cyan', 'cyan', 'cyan', 'cyan', 'yellow', 'yellow', 'gray' ],
    [ 'magenta', 'magenta', 'gray', 'gray', 'green', 'green', 'gray', 'gray', 'magenta', 'magenta' ],
  ],
  // Nivel 3
  [
    [ 'gray', 'red', 'gray', 'yellow', 'gray', 'gray', 'yellow', 'gray', 'red', 'gray' ],
    [ 'red', 'hotpink', 'hotpink', 'green', 'green', 'green', 'green', 'hotpink', 'hotpink', 'red' ],
    [ 'yellow', 'green', 'gray', 'cyan', 'cyan', 'cyan', 'cyan', 'gray', 'green', 'yellow' ],
    [ 'gray', 'magenta', 'magenta', 'gray', 'hotpink', 'hotpink', 'gray', 'magenta', 'magenta', 'gray' ],
    [ 'cyan', 'cyan', 'green', 'green', 'gray', 'gray', 'green', 'green', 'cyan', 'cyan' ],
    [ 'hotpink', 'gray', 'yellow', 'yellow', 'red', 'red', 'yellow', 'yellow', 'gray', 'hotpink' ],
    [ 'gray', 'magenta', 'gray', 'red', 'gray', 'gray', 'red', 'gray', 'magenta', 'gray' ],
  ],
];

let blocks = [];
let explosions = [];

function buildBlocksFromLayout( layout ) {
  const result = [];
  layout.forEach( ( row, rowIndex ) => {
    row.forEach( ( color, colIndex ) => {
      if ( !color ) return;
      result.push( {
        x: BLOCK_OFFSET_LEFT + colIndex * ( BLOCK_W + BLOCK_GAP ),
        y: BLOCK_OFFSET_TOP + rowIndex * ( BLOCK_H + BLOCK_GAP ),
        w: BLOCK_W,
        h: BLOCK_H,
        color,
        hitsLeft: color === 'gray' ? 2 : 1,
      } );
    } );
  } );
  return result;
}

function initLevel( levelNumber ) {
  blocks = buildBlocksFromLayout( LEVELS[ levelNumber - 1 ] );
}

const keys = {};
window.addEventListener( 'keydown', ( e ) => {
  keys[ e.key ] = true;

  if ( state.screen === 'gameOver' ) {
    restartGame();
    return;
  }

  if ( state.screen === 'start' ) {
    if ( e.key === ' ' ) {
      launchBall();
      state.screen = 'playing';
    }
    return;
  }

  const isPauseKey = e.key === 'Escape' || e.key === 'p' || e.key === 'P';
  if ( isPauseKey ) {
    if ( state.screen === 'playing' ) {
      state.screen = 'paused';
    } else if ( state.screen === 'paused' ) {
      state.screen = 'playing';
    }
  }
} );
window.addEventListener( 'keyup', ( e ) => { keys[ e.key ] = false; } );

function isLeftPressed() {
  return keys[ 'ArrowLeft' ] || keys[ 'a' ] || keys[ 'A' ];
}

function isRightPressed() {
  return keys[ 'ArrowRight' ] || keys[ 'd' ] || keys[ 'D' ];
}

function updatePaddle() {
  if ( isLeftPressed() ) paddle.x -= paddle.speed;
  if ( isRightPressed() ) paddle.x += paddle.speed;
  paddle.x = Math.max( 0, Math.min( canvas.width - paddle.w, paddle.x ) );
}

function updateBall() {
  const prevX = ball.x;
  const prevY = ball.y;

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Borde inferior: la bola cayó por debajo de la paleta, se pierde una vida.
  if ( ball.y - ball.radius > canvas.height ) {
    loseLife();
    return;
  }

  // Pared izquierda / derecha
  if ( ball.x - ball.radius <= 0 ) {
    ball.x = ball.radius;
    ball.vx = Math.abs( ball.vx );
    playBounceSound();
  } else if ( ball.x + ball.radius >= canvas.width ) {
    ball.x = canvas.width - ball.radius;
    ball.vx = -Math.abs( ball.vx );
    playBounceSound();
  }

  // Pared superior
  if ( ball.y - ball.radius <= 0 ) {
    ball.y = ball.radius;
    ball.vy = Math.abs( ball.vy );
    playBounceSound();
  }

  // Paleta: se detecta el cruce entre el frame anterior y el actual para
  // evitar que la bola la atraviese en frames de alta velocidad (tunneling).
  const crossedPaddleTop = prevY + ball.radius <= paddle.y && ball.y + ball.radius >= paddle.y;
  const withinPaddleX = ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.w;
  if ( ball.vy > 0 && crossedPaddleTop && withinPaddleX ) {
    ball.y = paddle.y - ball.radius;

    const hitPoint = ( ball.x - ( paddle.x + paddle.w / 2 ) ) / ( paddle.w / 2 ); // -1..1
    const clampedHitPoint = Math.max( -1, Math.min( 1, hitPoint ) );
    const angle = clampedHitPoint * PADDLE_MAX_BOUNCE_ANGLE;
    const speed = Math.hypot( ball.vx, ball.vy );

    ball.vx = speed * Math.sin( angle );
    ball.vy = -speed * Math.cos( angle );
    playBounceSound();
  }
}

function circleIntersectsBlock( block ) {
  const closestX = Math.max( block.x, Math.min( ball.x, block.x + block.w ) );
  const closestY = Math.max( block.y, Math.min( ball.y, block.y + block.h ) );
  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  return ( dx * dx + dy * dy ) <= ball.radius * ball.radius;
}

function resolveBlockBounce( block ) {
  const overlapLeft = ( ball.x + ball.radius ) - block.x;
  const overlapRight = ( block.x + block.w ) - ( ball.x - ball.radius );
  const overlapTop = ( ball.y + ball.radius ) - block.y;
  const overlapBottom = ( block.y + block.h ) - ( ball.y - ball.radius );
  const minOverlap = Math.min( overlapLeft, overlapRight, overlapTop, overlapBottom );

  if ( minOverlap === overlapLeft || minOverlap === overlapRight ) {
    ball.vx = -ball.vx;
  } else {
    ball.vy = -ball.vy;
  }
}

function spawnExplosion( block ) {
  explosions.push( {
    x: block.x,
    y: block.y,
    w: block.w,
    h: block.h,
    color: block.color,
    startTime: performance.now(),
  } );
}

function updateBlocks() {
  for ( let i = 0; i < blocks.length; i++ ) {
    const block = blocks[ i ];
    if ( !circleIntersectsBlock( block ) ) continue;

    resolveBlockBounce( block );
    block.hitsLeft--;

    if ( block.hitsLeft <= 0 ) {
      blocks.splice( i, 1 );
      state.score += 10;
      playBreakSound();
      spawnExplosion( block );
    }

    break; // un solo bloque por frame es suficiente (no se solapan)
  }
}

function updateExplosions() {
  const now = performance.now();
  explosions = explosions.filter( ( ex ) => now - ex.startTime < EXPLOSION_DURATION * EXPLOSION_FRAMES[ ex.color ].length );
}

function draw() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );
  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h );
  drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );

  blocks.forEach( ( block ) => {
    drawSprite( ctx, `block_${ block.color }`, block.x, block.y, block.w, block.h );
  } );

  const now = performance.now();
  explosions.forEach( ( ex ) => {
    const frames = EXPLOSION_FRAMES[ ex.color ];
    const frameIndex = Math.min( frames.length - 1, Math.floor( ( now - ex.startTime ) / EXPLOSION_DURATION ) );
    drawFrame( ctx, frames[ frameIndex ], ex.x, ex.y, ex.w, ex.h );
  } );

  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText( `Puntaje: ${ state.score }`, 10, 20 );

  const LIFE_ICON_SIZE = 16;
  const LIFE_ICON_GAP = 6;
  ctx.fillText( 'Vidas:', 10, 40 );
  for ( let i = 0; i < state.lives; i++ ) {
    const iconX = 70 + i * ( LIFE_ICON_SIZE + LIFE_ICON_GAP );
    drawSprite( ctx, 'ball', iconX, 40 - LIFE_ICON_SIZE + 4, LIFE_ICON_SIZE, LIFE_ICON_SIZE );
  }

  if ( state.screen === 'gameOver' ) {
    drawGameOverOverlay();
  }

  if ( state.screen === 'levelComplete' ) {
    drawLevelCompleteOverlay();
  }

  if ( state.screen === 'start' ) {
    drawStartOverlay();
  }

  if ( state.screen === 'paused' ) {
    drawPausedOverlay();
  }

  if ( state.screen === 'victory' ) {
    drawVictoryOverlay();
  }
}

function drawVictoryOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  ctx.font = '48px monospace';
  ctx.fillText( '¡VICTORIA!', canvas.width / 2, canvas.height / 2 - 40 );

  ctx.font = '24px monospace';
  ctx.fillText( `Puntaje final: ${ state.score }`, canvas.width / 2, canvas.height / 2 );

  ctx.textAlign = 'left';
}

function drawStartOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  ctx.font = '48px monospace';
  ctx.fillText( 'ARKANOID', canvas.width / 2, canvas.height / 2 - 40 );

  ctx.font = '24px monospace';
  const message = ( state.level === 1 && state.score === 0 )
    ? 'Presiona SPACE para jugar'
    : 'Presiona SPACE para continuar';
  ctx.fillText( message, canvas.width / 2, canvas.height / 2 );
  ctx.fillText( `High Score: ${ state.highScore }`, canvas.width / 2, canvas.height / 2 + 40 );

  ctx.textAlign = 'left';
}

function drawPausedOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '36px monospace';
  ctx.fillText( 'PAUSA', canvas.width / 2, canvas.height / 2 );
  ctx.font = '18px monospace';
  ctx.fillText( 'Presiona Escape o P para continuar', canvas.width / 2, canvas.height / 2 + 30 );
  ctx.textAlign = 'left';
}

function drawLevelCompleteOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '36px monospace';
  ctx.fillText( `¡Nivel ${ state.level } completado!`, canvas.width / 2, canvas.height / 2 );
  ctx.textAlign = 'left';
}

function drawGameOverOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  ctx.font = '48px monospace';
  ctx.fillText( 'GAME OVER', canvas.width / 2, canvas.height / 2 - 40 );

  ctx.font = '24px monospace';
  ctx.fillText( `Puntaje final: ${ state.score }`, canvas.width / 2, canvas.height / 2 );
  ctx.fillText( 'Presiona una tecla para reiniciar', canvas.width / 2, canvas.height / 2 + 40 );

  ctx.textAlign = 'left';
}

function loop() {
  if ( state.screen === 'playing' ) {
    updatePaddle();
    updateBall();
    updateBlocks();
    updateExplosions();
    checkLevelComplete();
  }
  if ( state.screen === 'start' ) {
    updatePaddle();
    attachBallToPaddle();
  }
  updateLevelTransition();
  draw();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  initLevel( state.level );
  attachBallToPaddle();
  requestAnimationFrame( loop );
} );
