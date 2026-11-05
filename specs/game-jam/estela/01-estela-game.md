# GAME JAM estela · SPEC 01 — Juego ESTELA (original) con leaderboard

> **Estado:** Pendiente
> **Tema:** ESTELA — duelo de motos de luz
> **Depende de:** SPEC 01, SPEC 05, SPEC 06
> **Fecha:** 2026-11-05
> **Objetivo:** Crear el juego original ESTELA como módulo canvas, jugable en `/juegos/estela/jugar` con el reproductor genérico `CanvasGamePlayer` y con ficha nueva en el catálogo. Su activación en Supabase se hace en la SPEC 02 de esta carpeta.

## Por qué existe esta spec

El tema es un **duelo de motos de luz**: cada moto avanza sin parar por una rejilla y deja detrás una estela de neón sólida que nadie puede atravesar, ni siquiera su dueña. En ESTELA el jugador pilota la moto cian contra 1–3 motos CPU; solo puede girar en ángulo recto y administrar un turbo limitado. Gana la ronda el último que quede en pie, así que la habilidad está en **cerrar el espacio al rival** sin encerrarse a uno mismo. El tema está en la mecánica, no en el nombre: la estela es a la vez el arma, el muro y la trampa.

Hoy el catálogo tiene tres juegos reales —ASTEROIDS (SHOOTER), CAÍDA (PUZZLE) y BLOQUE BUSTER (ARCADE)— y **ninguno VERSUS jugable**: la única ficha VERSUS (`duelo-pixel`) es simulada. ESTELA es el primer VERSUS real, el primero con **rivales CPU** y el primero con movimiento **por celdas en rejilla** en lugar de física continua. Es diseño propio (sugerido por el `game-planner` en `references/game-suggestions-todo.md`, 34/35), sin original que portar, así que esta spec **define la jugabilidad completa**. Una vez integrado, «jugable» solo requiere módulo + registro + `playable = true` (patrón de SPEC 05/06); la fila de Supabase la crea la SPEC 02 de esta carpeta.

## Alcance

**Dentro:**

### Diseño del juego

- **Lienzo y rejilla.** Canvas de 800×600 (4:3) dividido en una rejilla de 80×60 celdas de 10 px. Las 3 filas superiores (y = 0–29 px) son la **banda del HUD** y no forman parte de la arena. La **arena** son las 80 columnas × 57 filas restantes (filas lógicas 0–56, dibujadas en `y = 30 + fila × 10`): 4.560 celdas. Salir de la arena es chocar.
- **Motos.** Cuatro ranuras fijas (columna, fila de arena, dirección inicial, color):

  | Id  | Moto    | Celda inicial | Dirección | Color              |
  | --- | ------- | ------------- | --------- | ------------------ |
  | 1   | Jugador | (16, 44)      | arriba    | cian `#00f5ff`     |
  | 2   | CPU 1   | (63, 12)      | abajo     | magenta `#ff006e`  |
  | 3   | CPU 2   | (16, 12)      | derecha   | amarillo `#f5ff00` |
  | 4   | CPU 3   | (63, 44)      | izquierda | verde `#00ff88`    |

  La celda inicial de cada moto ya cuenta como estela. Rivales por ronda: ronda 1 → CPU 1; rondas 2–3 → CPU 1 y 2; rondas 4–10 → CPU 1, 2 y 3.

- **Movimiento por pasos.** Todas las motos vivas avanzan **una celda por paso**, sincronizadas. Pasos por segundo: `ritmo(ronda) = min(10 + (ronda − 1), 16)` (10, 11, …, 16 desde la ronda 7). **Ronda larga:** si la fase de juego de una ronda supera 30 s, el ritmo sube +1 paso/s a los 30 s, 40 s, 50 s y 60 s (máximo +4, es decir, 20 pasos/s como tope absoluto), para que las rondas no se eternicen.
- **Giros del jugador.** Las flechas (o WASD) fijan una **dirección absoluta** (↑/W arriba, →/D derecha, ↓/S abajo, ←/A izquierda). Se ignoran la dirección actual y la opuesta (no hay media vuelta). Cola de giros de **máximo 2** entradas, comparadas con la última dirección encolada (permite un giro en U en dos pasos consecutivos); en cada paso se consume como mucho un giro. Las flechas pulsadas durante la cuenta atrás se encolan y se aplican en los primeros pasos; en la pantalla «PULSA SPACE» se ignoran.
- **Turbo.** Mientras se mantiene `Space` en la fase de juego y la energía es mayor que 0, la moto del jugador avanza **2 celdas por paso** (la segunda con el mismo rumbo: el turbo resta maniobrabilidad). Energía 0–100: se gasta a 50/s (2 s de turbo con la barra llena) y, solo en la fase de juego y con `Space` suelto, se recarga a 12,5/s (8 s de 0 a 100). Si se agota con `Space` pulsado, no recarga hasta soltarlo. Al empezar cada ronda vuelve a 100. Al empezar la cuenta atrás `Space` se da por suelto: el turbo exige una nueva pulsación (los `keydown` con `e.repeat` no cuentan).
- **Resolución de un paso** (en este orden):
  1. Se aplica el giro encolado del jugador y la decisión de cada CPU viva.
  2. **Subpaso A:** cada moto viva calcula su celda siguiente. Choca si sale de la arena o si la celda está ocupada (cualquier estela, incluida la propia y las cabezas). Entre las que no chocan, si dos o más apuntan a la misma celda, chocan todas (choque frontal; la celda queda libre). Las supervivientes ocupan su celda.
  3. Si tras el subpaso A el jugador sigue vivo y no queda ninguna CPU viva → **ronda ganada** (no se ejecuta el subpaso B).
  4. **Subpaso B** (solo si el turbo está activo): el jugador avanza una celda más con las mismas reglas de choque.
  5. Si el jugador ha chocado → **ronda perdida**, aunque los rivales también hayan caído en ese paso (empate = derrota: nadie queda en pie).
  - Las estelas de las motos caídas **permanecen** hasta el final de la ronda (se dibujan atenuadas) y siguen siendo obstáculo.
- **IA de las CPU** (una decisión por paso y por CPU, sin media vuelta):
  1. Candidatas: seguir recto, girar a la izquierda, girar a la derecha, cuya celda siguiente esté libre. Si no hay ninguna, sigue recto (y choca).
  2. Con probabilidad `error(ronda) = max(0.04, 0.30 − 0.03 × (ronda − 1))` decide «a ciegas»: recto si es candidata; si no, una candidata al azar.
  3. Si no, calcula el **espacio libre** de cada candidata con un _flood fill_ (BFS en 4 direcciones) desde su celda siguiente, con tope de 300 celdas. Son «buenas» las candidatas con espacio ≥ 90 % del mejor.
  4. **Acoso** (desde la ronda 4): si la distancia Manhattan entre su cabeza y la del jugador es ≤ 15, elige entre las buenas la que minimiza la distancia Manhattan a la celda objetivo = cabeza del jugador + 4 celdas en su dirección (acotada a la arena).
  5. Si no hay acoso: sigue recto si es buena, salvo con probabilidad 0,04, en que elige una buena al azar; si recto no es buena, una buena al azar.
  - Aleatoriedad con `Math.random()`.
- **Puntuación** (`score`, entero):
  - **+1 × ronda** por cada celda que avanza el jugador sin chocar (las del turbo también cuentan).
  - **+200** por cada **rival encerrado**: una CPU que choca contra una celda de la estela del jugador (id 1). No cuenta el choque frontal en la misma celda ni el choque contra muros u otras estelas. Se suma al instante, aunque el jugador caiga en el mismo paso.
  - **+500 × ronda** al ganar la ronda.
  - Textos flotantes amarillos (bold 14 px): `+200` centrado en la cabeza de la CPU encerrada y `+1500` (500 × ronda) centrado 10 px por encima de la cabeza del jugador al ganar. Suben 20 px y se desvanecen en 0,8 s.
- **Vidas y niveles.** 3 vidas. Cada ronda perdida resta una. Nivel = **ronda** (1–10): al ganar se pasa a la siguiente (más rivales y más ritmo); al perder con vidas restantes se **repite la misma ronda** con la arena limpia. Cada ronda empieza con la arena vacía, las motos en sus ranuras y el turbo a 100.
- **Game Over:** el jugador pierde una ronda con 1 vida (vidas 1 → 0). **Victoria:** el jugador gana la ronda 10. En ambos casos el juego pasa a `gameOver`/`victory` en ese mismo paso, deja de actualizar (el último fotograma queda congelado) y llama a `onGameOver(score)`.
- **Fases** (`Phase`):
  - `ready` — arena con las motos colocadas bajo un velo `rgba(5,5,15,0.72)`. En la primera ronda de la partida: título «ESTELA» (bold 72 px, cian con brillo) y subtítulo «DUELO DE MOTOS DE LUZ» (16 px, magenta). Siempre: «RONDA 01 / 10» (bold 28 px, amarillo), «1 RIVAL · 10 PASOS/S» (14 px, `#c8c8e0`; «2 RIVALES»/«3 RIVALES» en plural), «PULSA SPACE» (bold 20 px, cian, parpadeo de 0,5 s con el reloj del juego) y la leyenda «FLECHAS / WASD: GIRAR · SPACE (MANTENER): TURBO» (12 px, `#7a7a9a`). `Space` (sin repetición) pasa a `countdown`.
  - `countdown` — 1,5 s: «3», «2», «1» (0,5 s cada uno), bold 96 px amarillo centrado en la arena.
  - `playing` — juego.
  - `roundEnd` — 2 s con velo: ganada → «RONDA 03 SUPERADA» (bold 32 px, verde `#00ff88`) y «+1500 PUNTOS» (18 px, amarillo); perdida → «ESTELA ROTA» (bold 32 px, magenta) y «VIDAS RESTANTES: 2» (16 px, `#c8c8e0`). Después, `ready` de la ronda siguiente o de la misma.
  - `gameOver` / `victory` — sin overlay en el canvas: lo aporta el modal FIN DEL JUEGO de la app.
- **Dibujo** (todo por código, fuentes `monospace` del sistema; las de `next/font` no son accesibles por nombre desde el canvas):
  - Fondo `#05050f`; rejilla de la arena con líneas cada 10 px `rgba(0,245,255,0.05)` y cada 50 px `rgba(0,245,255,0.12)`; borde de la arena `strokeRect(1, 31, 798, 568)` cian al 70 %, 2 px.
  - Estela: por celda, rectángulo de 8×8 centrado (margen 1 px) con el color de la moto, `globalAlpha` 0,85 si está viva y 0,3 si cayó; se agrupa por dueño (un `beginPath` + `rect` por celda + un `fill` por dueño) y sin `shadowBlur` para no penalizar el rendimiento.
  - Cabeza de cada moto viva: cuadrado de 10×10 a color pleno con `shadowBlur` 14 de su color y núcleo blanco de 4×4.
  - Choque: 14 partículas cuadradas de 3 px del color de la moto, centradas en la cabeza de la moto caída, velocidad 60–180 px/s en dirección aleatoria, vida 0,6 s con desvanecimiento.
- **HUD** en la banda superior (fondo `#0a0a18`, línea inferior magenta al 60 %, texto bold 13 px `monospace`, línea base y = 20):
  - x = 12: `PUNTOS 0001234` (cian, 7 dígitos).
  - x = 200: `RONDA 03/10` (amarillo).
  - x = 340: `RIVALES` + un cuadrado de 10×10 por rival de la ronda a partir de x = 410, cada 16 px (color pleno si vive, contorno gris `#555570` si cayó).
  - x = 510: `TURBO` + barra de 100×10 en x = 570 (relleno amarillo proporcional a la energía; magenta si < 20; contorno `#555570`).
  - x = 690: `VIDAS` + 3 cuadrados de 10×10 en x = 745, 760 y 775 (cian si quedan, contorno gris `#555570` si no).
- **Controles:** `ArrowUp`/`KeyW`, `ArrowRight`/`KeyD`, `ArrowDown`/`KeyS`, `ArrowLeft`/`KeyA` y `Space`. `preventDefault` de `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` y `Space`. Se ignoran los `keydown` con `e.repeat`. Sin tecla de pausa ni de reinicio: los aporta la app.
- **Duración estimada:** 10 rondas de 15–40 s más pantallas de transición → 4–8 min una partida completa; 1–3 min una partida corta.

### Adaptación al contrato

Igual que en SPEC 08 (ver su alcance; aquí solo lo específico):

- Módulo `lib/games/estela.ts` que exporta `createEstela: CreateGame` (`lib/games/contract.ts`). Todo el estado (`state`, `bikes`, `grid`, `visited`, `queue`, partículas, textos flotantes, `spaceHeld`, `paused`, reloj) vive dentro de la factoría; a nivel de módulo solo hay constantes y tipos.
- `keydown`/`keyup`/`blur` en `window`, retirados en `destroy()`; `cancelAnimationFrame` del bucle. `blur` y `setPaused` ponen `spaceHeld = false` y vacían la cola de giros. `keyup` se procesa siempre (aunque el objetivo sea un `input`), para no dejar el turbo «pegado».
- Ignorar `keydown` cuyo objetivo sea `input`/`textarea`.
- `onGameOver(score)` una sola vez por partida, en la transición a `gameOver` (última vida perdida o `end()`) o a `victory` (ronda 10 ganada).
- `onRestart()` tras reiniciar con `restart()`: ronda 1, 3 vidas, puntuación 0, turbo 100, arena limpia, sin partículas ni textos, fase `ready` con título.
- `onStats({ score, lives, level })` con mapeo directo `score = state.score`, `lives = state.lives` (3 → 0), `level = state.round` (1–10). Se emite solo cuando cambia alguno (comparando con el último emitido) y también el estado inicial tras crear y tras `restart()`. `PlayerStats` no cambia; el estado inicial coincide con `INITIAL_STATS` de `CanvasGamePlayer` (`0 / 3 / 1`).
- `setPaused(paused)`: congela `update` (pasos, turbo, temporizadores de `countdown`/`roundEnd`, tiempo de ronda, partículas, textos flotantes, parpadeo) y sigue dibujando. Reloj de juego propio (`clock`, en segundos) que solo avanza en `update`; nada usa `performance.now()` para la lógica. Con pausa, `Space` en `ready` no arranca la cuenta atrás.
- Paso fijo de 1/60 s con acumulador (máximo 5 pasos por _frame_ dibujado; el sobrante se descarta). Los pasos de las motos usan su propio acumulador `moveAccum` alimentado por el paso fijo (`intervalo = 1 / ritmo`); como el ritmo máximo es 20 pasos/s, como mucho hay un paso de moto por paso fijo.
- `end()` termina la partida con la puntuación actual desde cualquier fase salvo `gameOver`/`victory`, donde no hace nada (idempotente).
- Sin React ni `@/lib/session`; nada de `window`/`document` al importar; tipado sin `any` para pasar `npm run lint`. Si `getContext("2d")` devuelve `null`, devuelve controles vacíos (como `arkanoid.ts`).

### Integración

- Registro en `lib/games/registry.ts`: `estela: { create: createEstela, width: 800, height: 600 }` (import de `@/lib/games/estela`).
- Ficha nueva en `lib/games.ts`, añadida **al final** de `GAMES` (la home `/games` muestra `GAMES.slice(0, 6)` y no cambia):

  ```ts
  {
    id: "estela",
    title: "ESTELA",
    short: "Encierra a las motos rivales con tu muro de luz.",
    long: "Pilotas una moto de luz que deja tras de sí un muro de neón imborrable. Gira en ángulo recto, dosifica el turbo y cierra el paso a hasta tres motos rivales: el último que queda en pie gana la ronda. Cada ronda es más rápida y más concurrida. ¿Llegarás a la décima?",
    cat: "VERSUS",
    cover: "cover-estela",
    color: "magenta",
    best: 0,
    plays: "0",
  },
  ```

- Portada `.cover-estela` nueva en `app/globals.css`, junto a las demás `.cover-*`, diseñada con la skill `/frontend-design` y solo con CSS (gradientes y pseudoelementos, como `.cover-duelo`): fondo `#05050f` con rejilla cian tenue en perspectiva (líneas que convergen hacia un horizonte a ~35 % de altura), una estela cian en «L» que sale de la esquina inferior izquierda y gira a la derecha, una estela magenta que baja desde la esquina superior derecha y gira a la izquierda, ambas con cabeza cuadrada brillante (`drop-shadow`) y una chispa amarilla en el hueco donde casi se cortan.
- `lib/home.ts` no se toca: no lista juegos del catálogo (su actividad y top son datos sembrados).
- Sin ajuste de `.crt-screen`: el canvas es 4:3.

**Fuera de alcance:**

- La migración de Supabase que da de alta `estela` en `games` con `playable = true`: va en la SPEC 02 de esta carpeta.
- Sonido y música (ni `Audio` ni WebAudio); assets binarios (imágenes, fuentes, sprites).
- Controles táctiles, de ratón o gamepad; multijugador local o en red; tecla de pausa propia.
- Más de 10 rondas, modo infinito, potenciadores, selección de color o de arena.
- Autenticación, anti-trampas y moderación (ver SPEC 06); guardar si el jugador sale a mitad de partida.
- Tests automatizados (no hay runner).

## Modelo de datos

Sin tablas nuevas: se reutilizan `games`, `scores` y `plays` (SPEC 06). Contrato del juego: el de `lib/games/contract.ts` (SPEC 05), sin cambios. Estado interno del módulo (no se exporta salvo `createEstela`):

```ts
// lib/games/estela.ts
import type { CreateGame } from "@/lib/games/contract";

// ── Constantes ──────────────────────────────────────────────
const W = 800;
const H = 600;
const CELL = 10;
const COLS = 80;
const HUD_H = 30; // 3 filas de la rejilla de 80×60
const ROWS = 57; // filas de arena (60 − 3)
const STEP = 1 / 60; // s
const MAX_STEPS = 5;
const MAX_ROUND = 10;
const START_LIVES = 3;
const BASE_RATE = 10; // pasos/s en la ronda 1
const RATE_PER_ROUND = 1;
const MAX_BASE_RATE = 16;
const LONG_ROUND_START = 30; // s
const LONG_ROUND_EVERY = 10; // s
const LONG_ROUND_MAX_BONUS = 4; // pasos/s
const TURBO_MAX = 100;
const TURBO_DRAIN = 50; // por segundo
const TURBO_REGEN = 12.5; // por segundo
const QUEUE_MAX = 2;
const COUNTDOWN_TIME = 1.5; // s (3 × 0,5)
const ROUND_END_TIME = 2; // s
const POINTS_PER_STEP = 1; // × ronda
const POINTS_ROUND_WIN = 500; // × ronda
const POINTS_ENCLOSE = 200;
const CPU_FLOOD_LIMIT = 300;
const CPU_ERROR_BASE = 0.3;
const CPU_ERROR_STEP = 0.03;
const CPU_ERROR_MIN = 0.04;
const CPU_WANDER = 0.04;
const CPU_GOOD_RATIO = 0.9;
const CPU_AGGRO_FROM_ROUND = 4;
const CPU_AGGRO_RANGE = 15; // celdas (Manhattan)
const CPU_AGGRO_LEAD = 4; // celdas por delante del jugador
const PARTICLES_PER_CRASH = 14;
const PARTICLE_LIFE = 0.6; // s
const POPUP_LIFE = 0.8; // s

// ── Tipos ───────────────────────────────────────────────────
type Dir = 0 | 1 | 2 | 3; // 0 arriba, 1 derecha, 2 abajo, 3 izquierda
type Owner = 1 | 2 | 3 | 4; // 1 = jugador, 2–4 = CPU
type Phase =
  "ready" | "countdown" | "playing" | "roundEnd" | "gameOver" | "victory";
type RoundResult = "win" | "loss";

type Spawn = { col: number; row: number; dir: Dir; color: string };
const SPAWNS: Record<Owner, Spawn> = {
  1: { col: 16, row: 44, dir: 0, color: "#00f5ff" },
  2: { col: 63, row: 12, dir: 2, color: "#ff006e" },
  3: { col: 16, row: 12, dir: 1, color: "#f5ff00" },
  4: { col: 63, row: 44, dir: 3, color: "#00ff88" },
};

type Bike = {
  id: Owner;
  col: number;
  row: number;
  dir: Dir;
  alive: boolean;
  cpu: boolean;
  color: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number; // reloj de juego (s)
  color: string;
};
type Popup = { x: number; y: number; text: string; born: number };

type State = {
  phase: Phase;
  round: number; // 1–10 (= nivel)
  lives: number; // 3 → 0
  score: number;
  turbo: number; // 0–TURBO_MAX
  roundTime: number; // s de fase `playing` en la ronda actual
  phaseTimer: number; // s restantes de `countdown` / `roundEnd`
  moveAccum: number; // s acumulados para el siguiente paso de moto
  result: RoundResult | null; // resultado mostrado en `roundEnd`
  firstScreen: boolean; // true solo en el `ready` de la ronda 1 de cada partida
};

// Dentro de la factoría:
// grid: Uint8Array(COLS * ROWS)   → 0 libre, 1–4 dueño de la estela
// visited: Int32Array(COLS * ROWS) + generación → flood fill sin reservar memoria por paso
// bikes: Bike[]  queue: Dir[]  particles: Particle[]  popups: Popup[]
// spaceHeld: boolean  paused: boolean  clock: number (s)  accumulator: number (s)

export const createEstela: CreateGame = (
  canvas,
  { onGameOver, onRestart, onStats },
) => {
  /* … */
};
```

Funciones de apoyo fijadas: `rate(round) = min(BASE_RATE + (round − 1) × RATE_PER_ROUND, MAX_BASE_RATE) + longBonus`, con `longBonus = roundTime < 30 ? 0 : min(LONG_ROUND_MAX_BONUS, floor((roundTime − 30) / 10) + 1)`; `cpuCount(round) = round === 1 ? 1 : round <= 3 ? 2 : 3`; `cpuError(round) = max(CPU_ERROR_MIN, CPU_ERROR_BASE − CPU_ERROR_STEP × (round − 1))`.

Cambios de datos: ninguno en esta spec (la fila de `games` va en la SPEC 02). Puntuación máxima: ≈ 50.000 en una partida perfecta realista y cota teórica < 400.000 (desglose en la SPEC 02), muy por debajo de `score <= 10000000`.

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/01-app` lo relativo a Client Components (el módulo solo corre dentro del `useEffect` de `CanvasGamePlayer`); revisar `lib/games/arkanoid.ts` y `lib/games/asteroids.ts` como modelo de envoltura (reloj, paso fijo, `emitStats`, listeners) y `components/canvas-game-player.tsx`.
2. Crear `lib/games/estela.ts` con `createEstela`: constantes y tipos del «Modelo de datos», preparación de ronda (rejilla, ranuras, turbo), cola de giros, turbo, resolución del paso (subpasos A/B, choques frontales, encerrados, victoria/derrota), IA con _flood fill_ acotado, fases y temporizadores, partículas y textos flotantes, dibujo (arena, estelas, cabezas, HUD, pantallas `ready`/`countdown`/`roundEnd`), entrada, bucle con paso fijo y los controles `restart`/`setPaused`/`end`/`destroy`. Verificar: `npm run lint` y `npx tsc --noEmit` pasan; el fichero no importa React ni `@/lib/session` y no toca `window`/`document` fuera de la factoría.
3. Registrar `estela` en `lib/games/registry.ts` y añadir la ficha al final de `GAMES` en `lib/games.ts`. Verificar: `/juegos/estela` muestra la ficha y `/juegos/estela/jugar` arranca dentro del marco CRT (4:3, sin ajustes de CSS) con la pantalla «PULSA SPACE»; `/games` sigue mostrando los mismos 6 juegos; ASTEROIDS, CAÍDA y BLOQUE BUSTER siguen igual.
4. Crear `.cover-estela` en `app/globals.css` con la skill `/frontend-design` según el motivo descrito. Verificar: la portada se ve en `/biblioteca` (también con el filtro VERSUS, junto a DUELO PIXEL) y en `/juegos/estela`, sin afectar a las demás portadas.
5. Sin cambios de `.crt-screen` (el canvas es 4:3). Verificar a 375 px de ancho: sin scroll horizontal y el canvas escala completo.
6. Verificar en navegador (Claude in Chrome): flechas y WASD giran sin media vuelta y sin scroll; la cola permite un giro en U en dos pasos; `Space` arranca la cuenta atrás y, mantenido en juego, activa el turbo (2 celdas/paso, barra que baja en 2 s y recarga en 8 s); una CPU que choca con la estela cian suma 200 y muestra «+200»; ganar suma 500 × ronda y pasa de ronda con más rivales según la tabla; perder resta una vida y repite la ronda; la tercera derrota abre el modal una vez; FIN abre el modal una vez; PAUSA congela motos, turbo, cuenta atrás, «RONDA SUPERADA» y parpadeo, y REANUDAR continúa sin saltos; JUGAR DE NUEVO vuelve a ronda 1 / 3 vidas / 0 puntos; escribir en el campo de nombre no gira la moto ni deja el turbo pegado; entrar y salir de `/juegos/estela/jugar` 3 veces no acelera el juego. Para comprobar la Victoria sin jugar 10 rondas, cambiar temporalmente `MAX_ROUND` a 2 en local y revertirlo antes del commit.
7. Revisión final: `npm run lint`, `npx tsc --noEmit`, `npm run build`; consola sin errores de hidratación ni avisos del módulo.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Existe `lib/games/estela.ts`, exporta `createEstela: CreateGame` y no importa React ni `@/lib/session`; `REAL_GAMES` incluye `estela: { create: createEstela, width: 800, height: 600 }`.
- [ ] `lib/games.ts` tiene la ficha `estela` al final de `GAMES` con exactamente los valores de esta spec (`title: "ESTELA"`, `cat: "VERSUS"`, `color: "magenta"`, `cover: "cover-estela"`, `best: 0`, `plays: "0"`); `.cover-estela` existe en `app/globals.css` y se ve en `/biblioteca` y `/juegos/estela`.
- [ ] `/juegos/estela/jugar` muestra el juego en el marco CRT 4:3: banda de HUD de 30 px (PUNTOS, RONDA nn/10, RIVALES, TURBO, VIDAS) y arena de 80×57 celdas de 10 px con borde cian.
- [ ] La partida empieza en la pantalla con «ESTELA», «RONDA 01 / 10», «1 RIVAL · 10 PASOS/S» y «PULSA SPACE»; `Space` lanza la cuenta atrás 3-2-1 de 1,5 s.
- [ ] Ritmo de 10 pasos/s en la ronda 1, +1 por ronda hasta 16, y +1 a los 30/40/50/60 s de una ronda larga; rivales 1 / 2 / 2 / 3… según la ronda, en las ranuras y colores de la tabla.
- [ ] Flechas y WASD fijan direcciones absolutas; la dirección opuesta y la actual se ignoran; ninguna tecla del juego hace scroll; `e.repeat` no encola giros.
- [ ] El turbo avanza 2 celdas por paso, dura 2 s con la barra llena, recarga en 8 s solo con `Space` suelto y vuelve a 100 cada ronda; mantener `Space` desde la pantalla de inicio no activa el turbo.
- [ ] Chocar con un muro, cualquier estela (incluida la propia) o de frente con otra moto elimina a la moto; las estelas de las motos caídas se quedan atenuadas hasta el final de la ronda; empate jugador-último rival cuenta como ronda perdida.
- [ ] Puntuación: +1 × ronda por celda avanzada, +200 por CPU que choca contra la estela del jugador, +500 × ronda por ronda ganada; los textos «+200»/«+N» aparecen y se desvanecen en 0,8 s.
- [ ] La barra superior muestra Jugador, Puntuación, Vidas (3 → 0) y Nivel (= ronda, 1–10) en vivo; `onStats` solo se emite cuando cambia algún valor y tras reiniciar.
- [ ] Perder la ronda con 1 vida y ganar la ronda 10 llaman a `onGameOver` exactamente una vez con la puntuación mostrada y abren el modal; el canvas no dibuja overlays de Game Over, Victoria ni Pausa.
- [ ] PAUSA congela motos, turbo, cuenta atrás, pantalla de fin de ronda, partículas, textos flotantes y parpadeo; REANUDAR continúa sin saltos; FIN termina la partida una sola vez (también desde «PULSA SPACE» o la cuenta atrás).
- [ ] JUGAR DE NUEVO reinicia a ronda 1, 3 vidas, 0 puntos, turbo 100 y arena limpia, cierra el modal y muestra la pantalla de inicio con título.
- [ ] Escribir en el campo de nombre del modal no gira la moto ni activa el turbo; soltar `Space` con el foco en el campo no deja el turbo pegado.
- [ ] La velocidad del juego es la misma a 60 y a 144 Hz, y volver a la pestaña tras un rato no provoca saltos de varios pasos.
- [ ] Entrar y salir de `/juegos/estela/jugar` 3 veces no acelera el juego ni duplica listeners o bucles.
- [ ] A 375 px de ancho no hay scroll horizontal y el canvas se ve completo.
- [ ] ASTEROIDS, CAÍDA, BLOQUE BUSTER y los juegos simulados conservan su comportamiento; `/games` muestra los mismos 6 juegos que antes.

## Decisiones

- **Sí (decisión del agente):** `game-id` y slug del módulo `estela` (`lib/games/estela.ts`, `createEstela`) — es el título en minúsculas, corto, en español y libre en `GAMES`, `REAL_GAMES` y `specs/game-jam/`.
- **Sí (decisión del agente):** categoría VERSUS — es el primer VERSUS jugable; los tres juegos reales actuales son un SHOOTER, un PUZZLE y un ARCADE.
- **Sí (decisión del agente):** `color: "magenta"` en la ficha — solo CAÍDA usa magenta; cian ya está en tres fichas. La moto del jugador sigue siendo cian dentro del juego.
- **Sí (decisión del agente):** ficha añadida al final de `GAMES` — la home muestra los 6 primeros y no debe cambiar; la biblioteca y el filtro VERSUS la recogen solos.
- **Sí (decisión del agente):** reservar las 3 filas superiores de la rejilla de 80×60 para el HUD y jugar en 80×57 — un HUD superpuesto taparía estelas y causaría choques «invisibles».
- **Sí (decisión del agente):** movimiento discreto por celdas, todas las motos en el mismo paso — hace las colisiones exactas y deterministas (incluido el choque frontal) y simplifica la IA.
- **Sí (decisión del agente):** direcciones absolutas con flechas/WASD y cola de 2 giros — es lo más intuitivo con teclado y la cola evita perder giros rápidos en U.
- **Sí (decisión del agente):** turbo = 2 celdas por paso con un único giro por paso — dobla la velocidad sin cambiar el ritmo global y añade un coste táctico (menos maniobrabilidad).
- **Sí (decisión del agente):** energía de turbo 0–100, gasto 50/s, recarga 12,5/s y reinicio a 100 por ronda — 2 s de turbo por ronda garantizados y otros 2 s por cada 8 s de juego prudente.
- **Sí (decisión del agente):** «rival encerrado» = CPU que choca contra la estela del jugador — es comprobable en una línea y premia exactamente la habilidad que el tema pide; detectar regiones cerradas con _flood fill_ sería caro y ambiguo.
- **Sí (decisión del agente):** +200 fijo por encerrado, +1 × ronda por paso y +500 × ronda por ronda ganada, como en el diseño del `game-planner` — los pasos varían en cada partida y hacen los empates muy raros.
- **Sí (decisión del agente):** perder una ronda repite la misma ronda; nivel = ronda a superar — «nivel» refleja el progreso real y no se avanza perdiendo.
- **Sí (decisión del agente):** empate (jugador y último rival caen en el mismo paso) = ronda perdida — «gana el último en pie» y nadie queda en pie.
- **Sí (decisión del agente):** las estelas de las motos caídas permanecen hasta el final de la ronda, atenuadas — la arena se cierra con el tiempo y un rival caído sigue influyendo; borrarlas añadiría un caso más sin ganar jugabilidad.
- **Sí (decisión del agente):** Victoria al ganar la ronda 10 y aceleración en rondas de más de 30 s — acota la partida a 2–10 min y la puntuación máxima.
- **Sí (decisión del agente):** rivales 1 / 2 / 2 / 3 (desde la ronda 4) y ritmo 10 → 16 pasos/s — progresión simple y legible en la pantalla de ronda.
- **Sí (decisión del agente):** IA de CPU con _flood fill_ acotado a 300 celdas, probabilidad de error decreciente y acoso desde la ronda 4 — da rivales creíbles con coste mínimo (≤ 54.000 visitas de celda/s: 3 CPU × 3 candidatas × 300 × 20 pasos/s), sin búsqueda ni árboles de juego.
- **Sí (decisión del agente):** `Math.random()` sin semilla — no hay repeticiones ni validación de partidas que lo requieran.
- **Sí (decisión del agente):** pantalla «PULSA SPACE» antes de cada ronda y cuenta atrás de 1,5 s — da respiro entre rondas y evita arrancar con el turbo pulsado.
- **Sí (decisión del agente):** HUD propio en el canvas (puntos, ronda, rivales, turbo, vidas) aunque duplique parte de la barra superior — rivales y turbo solo existen dentro del juego y el canvas queda autosuficiente.
- **Sí:** reloj de juego y paso fijo de 1/60 s con acumulador (como SPEC 08) — misma velocidad a cualquier tasa de refresco y PAUSA que no consume temporizadores.
- **Sí:** estadísticas con mapeo directo (puntuación, 3 vidas reales, nivel = ronda 1–10); `PlayerStats` no cambia.
- **No:** overlays de Game Over, Victoria o Pausa en el canvas, ni tecla de pausa propia — los aporta la app y evita desincronizar React con el juego (SPEC 07/08).
- **No (decisión del agente):** sonido, assets binarios ni fuentes externas en el canvas — la spec es implementable solo con código.
- **No:** ajuste de `.crt-screen` ni cambios en `lib/home.ts` — el canvas es 4:3 y la home no lista el catálogo explícitamente.
- **No (decisión del agente):** migración de Supabase en esta spec — va separada en la SPEC 02 para poder probar el juego antes de activarlo en el leaderboard.
- **Sí:** guardado manual con nombre editable y registro de partida en `plays`, igual que el resto (SPEC 05/06); se activa al aplicar la SPEC 02.

## Riesgos

| Riesgo                                                                                                                                 | Mitigación                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict Mode monta el efecto dos veces y duplica listeners o bucles                                                                     | `destroy()` retira `keydown`/`keyup`/`blur` y cancela el `requestAnimationFrame`; criterio de montar/desmontar 3 veces                                                                                  |
| `onGameOver` se dispara más de una vez (derrota en el bucle, `end()` en `gameOver`/`victory`)                                          | Emitir solo en la transición de fase; `end()` idempotente                                                                                                                                               |
| Teclas/espacio hacen scroll o giran la moto al escribir en el modal                                                                    | `preventDefault` de flechas y `Space`; ignorar `keydown` con objetivo `input`/`textarea`                                                                                                                |
| Turbo «pegado» si `Space` se suelta con el foco en el modal o fuera de la ventana                                                      | `keyup` siempre procesado; `spaceHeld = false` en `blur`, `setPaused`, `restart` y al empezar la cuenta atrás                                                                                           |
| `window`/`document` usados en SSR                                                                                                      | Todo corre dentro de la factoría, llamada desde `useEffect`; nada se toca al importar                                                                                                                   |
| Giros perdidos o «dobles» por pulsaciones rápidas entre pasos                                                                          | Cola de 2 giros validada contra la última dirección encolada; un giro por paso                                                                                                                          |
| El _flood fill_ de 3 CPU a 20 pasos/s penaliza el rendimiento                                                                          | Tope de 300 celdas, `Int32Array` de visitados con generación (sin reservar memoria por paso)                                                                                                            |
| Dibujar hasta 4.560 celdas cada _frame_ es lento                                                                                       | Estelas sin `shadowBlur`, agrupadas en un `fill` por dueño; brillo solo en las 4 cabezas                                                                                                                |
| IA demasiado fácil o imposible en rondas altas                                                                                         | Los valores de esta spec son los que se implementan; si la verificación muestra un desequilibrio claro, solo se ajustan `CPU_ERROR_*`/`CPU_AGGRO_*` y se anota el cambio en esta spec antes de cerrarla |
| Rondas eternas si jugador y CPU quedan en zonas separadas grandes                                                                      | Aceleración +1 paso/s cada 10 s a partir de 30 s (máx. +4); la arena es finita                                                                                                                          |
| Puntuaciones empatadas en el ranking                                                                                                   | Los pasos dependen de cada partida; a igual puntuación ordena `created_at asc` (SPEC 06)                                                                                                                |
| Hasta aplicar la SPEC 02, GUARDAR PUNTUACIÓN muestra error en el modal (no existe la fila en `games`) y `recordPlay` falla en silencio | Esperado y documentado; aplicar la SPEC 02 justo después de esta y comprobar el guardado allí                                                                                                           |

## Qué **no** está en esta spec

- La fila de `estela` en Supabase y su verificación de RLS (SPEC 02 de esta carpeta).
- Sonido, música, assets binarios; controles táctiles, ratón o gamepad; multijugador local o en red.
- Potenciadores, más de 10 rondas, editor o selección de arenas.
- Auth, ranking anti-trampas, moderación.
- Tests automatizados.
