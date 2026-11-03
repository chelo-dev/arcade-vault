# SPEC 07 — Juego CAÍDA (Tetris) con leaderboard

> **Estado:** Implementada
> **Depende de:** SPEC 01, SPEC 05, SPEC 06
> **Fecha:** 2026-11-03
> **Objetivo:** Portar a Next.js el juego de `references/resources/started-games/03-tetris/` sin cambiar su jugabilidad, jugable en `/juegos/caida/jugar` con el reproductor genérico `CanvasGamePlayer`, y guardar sus puntuaciones en Supabase para que aparezcan en `/salon`, el detalle y la biblioteca.

## Por qué existe esta spec

Asteroids (SPEC 05) fue el primer juego real y SPEC 06 dejó el leaderboard en Supabase. Con el reproductor genérico (`lib/games/contract.ts`, `lib/games/registry.ts`, `CanvasGamePlayer`), CAÍDA —hoy un reproductor simulado con puntuación aleatoria— pasa a ser el segundo juego real. El original es un Tetris de 332 líneas con una pieza propia (la «tuerca» `N`), panel lateral y overlay en DOM, y tema claro/oscuro; esta spec lo adapta al patrón de la app. Es el primer juego **sin vidas** y con **canvas que no es 4:3**.

## Alcance

**Dentro:**

- Módulo `lib/games/tetris.ts` que exporta `createTetris: CreateGame` (`lib/games/contract.ts`) con la lógica de `game.js` intacta (constantes `COLS`, `ROWS`, `BLOCK`, `COLORS`, `PIECES` incluida la tuerca `N`, `LINE_SCORES`, rotación con _kicks_ `[0,-1,1,-2,2]`, fantasma, caída suave y dura, puntuación, nivel y velocidad). Adaptación estrictamente necesaria:
  - Envolver el estado global (`board`, `current`, `next`, `score`, `lines`, `level`, `dropInterval`, …) en la factoría; no queda estado a nivel de módulo.
  - Registrar `keydown` en `window` al crear y retirarlo en `destroy()`; cancelar el `requestAnimationFrame`.
  - `onGameOver(score)` una sola vez, en `endGame()` (pieza nueva que colisiona al aparecer, o `end()`); protegido por el flag `gameOver`.
  - `onRestart()` tras `init()` cuando se reinicia con `restart()` (no hay tecla de reinicio en el original).
  - `onStats({ score, lives: 1, level })` solo cuando cambian puntuación o nivel (la barra muestra siempre 1 vida; ver Decisiones).
  - `setPaused(paused)`: el bucle sigue dibujando pero no acumula `dropAccum` ni procesa teclas; al reanudar se descarta el tiempo transcurrido (sin caída instantánea). Sustituye a la pausa interna con tecla `P` y a su overlay DOM, que se eliminan.
  - `end()` termina la partida en curso (idempotente si ya está en Game Over).
  - Limitar `dt` del bucle (p. ej. 1000 ms máx.) para evitar caídas en bloque al volver a la pestaña; no altera el ritmo normal.
  - Ignorar teclas cuyo objetivo sea `input`/`textarea`; `preventDefault` en `ArrowLeft`, `ArrowRight`, `ArrowDown`, `ArrowUp`, `Space` (y `KeyX`, que no scrollea, solo se procesa). No filtrar `e.repeat`: el original usa la repetición de teclado del sistema para mover y bajar.
  - Sin React ni `@/lib/session`; sin tocar `window`/`document` al importar; tipado sin `any` para pasar `npm run lint`.
- Todo lo que el original dibuja en el DOM pasa al **canvas único** (`width = 460`, `height = 600`): tablero de 300×600 a la izquierda y, a la derecha (160 px), SCORE, LINES, LEVEL, recuadro NEXT con la pieza siguiente y la leyenda de controles (`← →` mover, `↑`/`X` rotar, `↓` bajar, `Espacio` caída). Se eliminan: `index.html`, `style.css`, overlay de Game Over/PAUSA, botón reiniciar y selector de tema claro/oscuro (la app aporta modal, PAUSA/FIN y marco CRT). Sin `localStorage` propio (`tetris-theme` desaparece). Colores fijos del tema oscuro: fondo `#1a1a25`, rejilla `#22222e`, texto `#e0e0e0`, etiquetas `#555570`, valores `#7aa2f7`.
- Registro en `lib/games/registry.ts`: `caida: { create: createTetris, width: 460, height: 600 }`.
- Catálogo: la ficha `caida` de `lib/games.ts` se mantiene (título `CAÍDA`, portada, textos); `GamePlayer` deja de usarse para ella al estar en `REAL_GAMES`. Se ajusta el texto largo si menciona mecánicas que no existen (p. ej. «cada 10 líneas» sí coincide con el original).
- Canvas no 4:3: `CanvasGamePlayer` aplica la proporción del juego (`aspect-ratio: width / height`) al `.crt-screen` y limita su ancho para que el alto quepa en pantalla (≈ `max-height: 75vh`, centrado). Asteroids (800×600) sigue renderizando igual; el cambio es genérico y vive en el reproductor/`globals.css`, no en el módulo del juego.
- Migración `supabase/migrations/{timestamp}_caida_playable.sql`: `update public.games set playable = true where id = 'caida';`, aplicada con `apply_migration`.

**Fuera de alcance:**

- Cambios de jugabilidad, balance (puntuación, velocidad, probabilidad de la tuerca), gráficos o sonido (el original no tiene audio).
- Tema claro, controles táctiles o de gamepad, pieza _hold_, generador de bolsa 7.
- Mostrar `LINES` en la barra superior de la app (queda dentro del canvas) o adaptar `PlayerStats` para ocultar Vidas.
- Autenticación, anti-trampas y moderación (ver SPEC 06).
- Guardar si el jugador sale a mitad de partida.
- Migrar otros juegos; tests automatizados (no hay runner).

## Modelo de datos

Sin tablas nuevas: se reutilizan `games`, `scores` y `plays` (SPEC 06). Contrato del juego: el de `lib/games/contract.ts` (SPEC 05), sin cambios.

Único cambio de datos: `update public.games set playable = true where id = 'caida';`. La RLS de `scores` y `plays` ya admite INSERT para juegos con `playable = true`. El tope `score <= 10000000` es muy superior a lo alcanzable en Tetris; no requiere migración.

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/01-app` lo relativo a Client Components; revisar `lib/games/asteroids.ts` como modelo de envoltura y `components/canvas-game-player.tsx`.
2. Crear `lib/games/tetris.ts` envolviendo `game.js` en `createTetris`: sin DOM de la app, dibujo del panel lateral en el canvas, `setPaused`, `end`, `restart`, `destroy`, callbacks. Verificar: `npm run lint` y `npx tsc --noEmit` pasan; el diff contra `game.js` solo muestra envoltura, tipos, panel en canvas, listeners/limpieza y callbacks.
3. Registrar `caida` en `lib/games/registry.ts`. Verificar: `/juegos/caida/jugar` arranca dentro del marco CRT y el resto de juegos simulados sigue igual.
4. Ajustar `CanvasGamePlayer` y `app/globals.css` para proporción por juego y límite de alto. Verificar: Asteroids sin cambios; Tetris se ve completo y centrado a 1280 px y a 375 px (sin scroll horizontal).
5. Migración `playable` con `apply_migration`; verificar con `execute_sql` (`caida` jugable, el resto salvo `rocas` no) y `get_advisors` (seguridad).
6. Verificar RLS como `anon`: insert en `scores` y `plays` de `caida` funciona; update/delete no afectan filas. Limpiar filas de prueba.
7. Verificar en navegador: jugar hasta topar, modal (nombre, guardar, jugar de nuevo, volver al vault), una fila en `plays` por partida y una en `scores` por guardado, pestaña CAÍDA en `/salon`, detalle `/juegos/caida` y tarjeta de `/biblioteca` con datos reales.
8. Revisión final: `npm run lint`, `npm run build`, consola sin errores de hidratación.

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] `/juegos/caida/jugar` muestra el juego en el marco CRT con tablero 10×20, pieza siguiente, fantasma y panel SCORE/LINES/LEVEL dentro del canvas; las piezas (incluida la tuerca `N`), la rotación con _kicks_, las puntuaciones `LINE_SCORES × nivel`, +1 por caída suave, +2 por celda en caída dura, el nivel `lines/10 + 1` y `dropInterval = max(100, 1000 − (nivel−1)·90)` coinciden con `game.js`.
- [x] Flechas, `X` y `Espacio` funcionan con repetición de teclado y no hacen scroll de la página.
- [x] Al quedar el tablero lleno (o pulsar FIN) se llama a `onGameOver` exactamente una vez con la puntuación mostrada y se abre el modal FIN DEL JUEGO; no se guarda nada hasta pulsar GUARDAR PUNTUACIÓN.
- [x] GUARDAR PUNTUACIÓN crea una fila en `scores` con `game_id = 'caida'`, la puntuación y el nombre del campo; el modal muestra `▸ PUNTUACIÓN GUARDADA_`; si falla, muestra error y permite reintentar.
- [x] Cada partida terminada crea exactamente una fila en `plays`; salir a mitad no crea filas.
- [x] JUGAR DE NUEVO reinicia, cierra el modal y deja el tablero vacío con nivel 1; escribir en el campo de nombre no mueve piezas.
- [x] La barra superior muestra Jugador, Puntuación, Vidas (1 ♥ fijo) y Nivel en vivo; PAUSA congela la partida y REANUDAR la continúa sin caída instantánea; FIN termina la partida una sola vez; la tecla `P` ya no hace nada.
- [x] Al desmontar no quedan listeners ni `requestAnimationFrame` (entrar y salir 3 veces no acelera ni duplica la caída).
- [x] El canvas se ve completo y sin deformar a 375 px (sin scroll horizontal) y a escritorio sin salirse de la pantalla en alto; Asteroids se ve igual que antes.
- [x] Existe `supabase/migrations/*_caida_playable.sql` y coincide con el esquema aplicado; con la clave publicable, insert en `scores`/`plays` de `caida` funciona y update/delete no afectan filas.
- [x] `/salon` muestra las pestañas ASTEROIDS y CAÍDA; `/juegos/caida` y `/biblioteca` muestran partidas, guardadas y mejor puntuación reales de CAÍDA.
- [x] Los otros 6 juegos simulados conservan `GamePlayer`; `lib/games/tetris.ts` no importa React ni `@/lib/session`.

## Decisiones

- **Sí:** sustituir la ficha `caida` conservando `id`, portada, textos y título `CAÍDA` (decisión del usuario). No se renombra a «TETRIS»: el catálogo ya tiene su identidad y la fila `games.title` coincide.
- **Sí:** módulo TS + canvas en `CanvasGamePlayer`, sin player propio ni `iframe`; callbacks directos (SPEC 05).
- **Sí:** envolver `game.js` en lugar de reescribirlo, para conservar el comportamiento.
- **Sí (decisión del usuario):** panel (NEXT, SCORE/LINES/LEVEL, controles) dibujado dentro del canvas único de 460×600; se elimina el DOM del original (overlay, botón reiniciar, tema claro) porque la app ya aporta modal, PAUSA y estilo CRT.
- **Sí (decisión del usuario):** Vidas fijas en 1 ♥ en la barra superior. No se modifica `PlayerStats`; el dato es nominal (una partida = una vida).
- **Sí:** la tecla `P` se retira; la pausa es solo el botón PAUSA/REANUDAR, para no desincronizar el estado de React con el del juego.
- **Sí:** proporción del canvas por juego en `CanvasGamePlayer` (genérico), no un hack solo para Tetris; los futuros juegos no 4:3 lo reutilizan.
- **Sí:** guardado manual con nombre editable y registro de partida en `plays`, igual que Asteroids.
- **No:** _hold_, bolsa de 7 piezas ni cambios de balance; el original se mantiene.

## Riesgos

| Riesgo                                                                                      | Mitigación                                                                                         |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Strict Mode monta el efecto dos veces y duplica listeners o bucles                          | `destroy()` retira el `keydown` y cancela el `requestAnimationFrame`; criterio de montar/desmontar |
| `onGameOver` se dispara más de una vez (`lockPiece` en el bucle, `end()` durante Game Over) | Guardia con el flag `gameOver` dentro de `endGame()`                                               |
| Al reanudar tras pausa o volver a la pestaña la pieza cae varias filas                      | `dt` limitado y se reinicia `lastTime` al reanudar                                                 |
| Flechas/espacio hacen scroll o mueven piezas al escribir en el modal                        | `preventDefault` en teclas del juego; ignorar eventos con objetivo `input`                         |
| Canvas 460×600 muy alto en el marco CRT y en móvil                                          | Proporción por juego y `max-height` en `.crt-screen`; revisión a 375 px y escritorio (paso 4)      |
| Panel lateral dibujado en canvas pierde nitidez al escalar                                  | Fuentes monoespaciadas de tamaño fijo en el canvas; aceptado, igual que el HUD de Asteroids        |
| `getComputedStyle(document.body)` del original (rejilla) usado en SSR o sin el tema         | Color de rejilla fijo en una constante; el módulo no toca `document`                               |

## Qué **no** está en esta spec

- Cambios de jugabilidad, arte o sonido de Tetris; tema claro; controles táctiles.
- Auth, ranking anti-trampas, moderación.
- Migración de Arkanoid u otros juegos; tests automatizados.
