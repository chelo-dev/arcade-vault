# Juegos implementados

> Estado a 2026-11-05. Fuentes: tabla `public.games` de Supabase (`playable = true`), `lib/games/registry.ts` (`REAL_GAMES`) y los originales de `references/resources/started-games/`.

Arcade Vault tiene **3 juegos reales y jugables**. El resto del catálogo (`duelo-pixel`, `gloton`, `invasores`, `ranaria`, `serpentina`) tiene `playable = false` y usa el reproductor simulado `GamePlayer` (puntuación aleatoria, no guarda en Supabase).

| ID (`games.id`)  | Título en catálogo (`lib/games.ts`) | Título en BD | Categoría | Original                 | Módulo                  | Canvas  | Spec    |
| ---------------- | ----------------------------------- | ------------ | --------- | ------------------------ | ----------------------- | ------- | ------- |
| `rocas`          | ASTEROIDS                           | ASTEROIDS    | SHOOTER   | `02-asteroids/`          | `lib/games/asteroids.ts` | 800×600 | SPEC 05 |
| `caida`          | CAÍDA                               | TETRIX       | PUZZLE    | `03-tetris/`             | `lib/games/tetris.ts`   | 460×600 | SPEC 07 |
| `bloque-buster`  | BLOQUE BUSTER                       | ARKANOID     | ARCADE    | `04-arkanoid/`           | `lib/games/arkanoid.ts` | 800×600 | SPEC 08 |

> **Nota:** el título de la columna `games.title` no coincide con el del catálogo en `caida` y `bloque-buster`. La interfaz muestra el título de `lib/games.ts`.

## Integración común

Los tres juegos siguen el mismo patrón:

- **Contrato** (`lib/games/contract.ts`): `CreateGame = (canvas, { onGameOver, onRestart, onStats }) => { restart, setPaused, end, destroy }`.
  - Juego → app: `onGameOver(score)` (una vez por partida, en la transición), `onRestart()`, `onStats({ score, lives, level })` (solo cuando cambia algún valor).
  - App → juego: `restart()`, `setPaused(paused)`, `end()` (idempotente), `destroy()` (retira listeners y cancela `requestAnimationFrame`).
- **Registro** en `lib/games/registry.ts` (`REAL_GAMES[id] = { create, width, height }`).
- **Reproductor** genérico `components/canvas-game-player.tsx` en `/juegos/[id]/jugar`: marco CRT, barra `PlayerStats` (Jugador, Puntuación, Vidas, Nivel), PAUSA/REANUDAR, FIN, SALIR y modal `GameOverModal` (nombre editable de hasta 10 caracteres, GUARDAR PUNTUACIÓN, JUGAR DE NUEVO, VOLVER AL VAULT).
- **Persistencia** en Supabase: cada partida terminada inserta una fila en `plays`; GUARDAR PUNTUACIÓN inserta en `scores` (`lib/scores-client.ts`). La RLS solo admite inserciones si `games.playable = true`.
- **Aparecen en** `/salon` (salón de la fama), `/biblioteca` y `/juegos/[id]` (detalle + top 10).
- Los módulos no importan React ni la sesión, ignoran el teclado cuando el foco está en un `input`/`textarea` y hacen `preventDefault` de las teclas de juego para evitar el scroll.

---

## ASTEROIDS (`rocas`)

Shooter espacial: una nave triangular en gravedad cero destruye asteroides que se dividen en fragmentos más pequeños.

- **Ruta:** `/juegos/rocas/jugar`
- **Controles:** `←` `→` rotar · `↑` empujar · `Espacio` disparar (y reiniciar en Game Over).
- **Reglas:**
  - 3 vidas; 4 asteroides iniciales y `3 + nivel` en cada nivel siguiente.
  - Tamaños y puntos: grande 20, mediano 50, pequeño 100 (`POINTS`).
  - Power-up `3x` (disparo triple): probabilidad de aparición del 15 %, dura 5 s y desaparece a los 12 s si no se recoge.
- **HUD del canvas:** SCORE, NIVEL, iconos de vidas, indicador `3x` y overlay de GAME OVER (se conservan del original).
- **Fin de partida:** al perder la última vida o al pulsar FIN.

## CAÍDA (`caida`)

Tetris con una pieza extra propia, la «tuerca» `N`.

- **Ruta:** `/juegos/caida/jugar`
- **Controles:** `←` `→` mover · `↑` o `X` rotar (con _wall kicks_) · `↓` caída suave · `Espacio` caída dura.
- **Reglas:**
  - Tablero de 10×20 celdas de 30 px; pieza fantasma y vista de la siguiente pieza.
  - Puntuación por líneas: 100 / 300 / 500 / 800 × nivel; +1 por celda de caída suave y +2 por celda de caída dura.
  - Sube de nivel cada 10 líneas; el intervalo de caída baja de 1000 ms a un mínimo de 100 ms (−90 ms por nivel).
- **Panel lateral (dentro del canvas):** SCORE, LINES, LEVEL, NEXT y leyenda de controles.
- **Particularidades:** no tiene vidas (la barra muestra siempre 1); canvas no 4:3, así que el reproductor aplica la proporción del juego. Se eliminaron el tema claro, la pausa con `P` y los overlays DOM del original.
- **Fin de partida:** cuando una pieza nueva colisiona al aparecer, o al pulsar FIN.

## BLOQUE BUSTER (`bloque-buster`)

Arkanoid/Breakout con sprites y sonido: una paleta rebota la bola para destruir muros de bloques.

- **Ruta:** `/juegos/bloque-buster/jugar`
- **Controles:** `←` `→` o `A` `D` mover la paleta · `Espacio` lanzar la bola (al empezar y tras perder una vida).
- **Reglas:**
  - 3 vidas y 3 niveles con layouts propios (`LEVELS`); velocidades base de la bola 4 / 5 / 6.
  - +10 puntos por bloque destruido; los bloques grises necesitan 2 golpes. Máximo posible: 1.800 puntos.
  - Ángulo de rebote en la paleta de hasta 60°; explosiones animadas de 4 _frames_; overlay «¡Nivel N completado!» durante 2 s.
- **Assets:** `public/games/arkanoid/` (`spritesheet-breakout.png`, `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3`).
- **Particularidades:** paso fijo de 1/60 s (misma velocidad a 60 y a 144 Hz) y reloj propio que se congela en pausa. Se eliminaron el High Score local, la pausa con `Escape`/`P` y los overlays de GAME OVER y VICTORIA (los sustituye el modal).
- **Fin de partida:** al perder la tercera vida, al destruir el último bloque del nivel 3 (victoria) o al pulsar FIN.

---

## Cómo añadir un juego nuevo

1. Colocar el original en `references/resources/started-games/NN-slug/`.
2. Generar la spec con `/game-spec` e implementarla con `/spec-impl`.
3. Crear `lib/games/<slug>.ts` que cumpla `CreateGame` y registrarlo en `REAL_GAMES`.
4. Migración que ponga `playable = true` en `public.games`.
5. Añadir el juego a este documento.
