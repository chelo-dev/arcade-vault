# SPEC 08 — Juego BLOQUE BUSTER (Arkanoid) con leaderboard

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 05, SPEC 06
> **Fecha:** 2026-11-03
> **Objetivo:** Portar a Next.js el juego de `references/resources/started-games/04-arkanoid/` sin cambiar su jugabilidad, jugable en `/juegos/bloque-buster/jugar` con el reproductor genérico `CanvasGamePlayer`, y guardar sus puntuaciones en Supabase para que aparezcan en `/salon`, el detalle y la biblioteca.

## Por qué existe esta spec

Asteroids (SPEC 05) y CAÍDA (SPEC 07) ya son juegos reales sobre el reproductor genérico (`lib/games/contract.ts`, `lib/games/registry.ts`, `CanvasGamePlayer`). BLOQUE BUSTER —hoy un reproductor simulado con puntuación aleatoria— pasa a ser el tercero, con el Arkanoid de `started-games/04-arkanoid/` (≈ 380 líneas de `game.js`, spritesheet y dos sonidos). Es el primer juego **con sprites y audio**, **con vidas y niveles reales** (3 vidas, 3 niveles) y **con final de victoria**. Una vez integrado, «jugable» solo requiere módulo + registro + `playable = true` (patrón de SPEC 05/06).

## Alcance

**Dentro:**

- Módulo `lib/games/arkanoid.ts` que exporta `createArkanoid: CreateGame` (`lib/games/contract.ts`) con la lógica de `game.js` intacta (`paddle`, `ball`, `PADDLE_MAX_BOUNCE_ANGLE`, `BASE_SPEEDS = [4, 5, 6]`, geometría de bloques `BLOCK_*`, `LEVELS` de 3 niveles, bloques `gray` de 2 golpes, +10 por bloque destruido, rebote por solape mínimo, detección de cruce de paleta anti-_tunneling_, explosiones animadas). Adaptación estrictamente necesaria:
  - Envolver el estado global (`state`, `paddle`, `ball`, `blocks`, `explosions`, `keys`, `levelCompleteStartTime`) en la factoría; `canvas`/`ctx` vienen por parámetro; no queda estado a nivel de módulo.
  - Registrar `keydown`/`keyup` en `window` al crear y retirarlos en `destroy()`; cancelar el `requestAnimationFrame`.
  - `onGameOver(score)` una sola vez por partida, en la transición a `gameOver` (tercera vida perdida, dentro de `loseLife`) **y** en la transición a `victory` (último bloque del nivel 3, dentro de `checkLevelComplete`). Se emite en la transición, nunca en el bucle.
  - `onRestart()` tras `restartGame()` cuando se reinicia con `restart()`. La reacción «cualquier tecla reinicia» de `gameOver` se elimina: la app aporta el modal.
  - `onStats({ score, lives, level })` solo cuando cambia alguno de los tres: `score = state.score`, `lives = state.lives` (3 → 0), `level = state.level` (1–3). Mapeo directo; no se adapta `PlayerStats`. Se emite también el estado inicial tras reiniciar.
  - `setPaused(paused)` (ver SPEC 05): congela `update` (paleta, bola, bloques, explosiones y temporizador de «Nivel completado») y sigue dibujando; descarta las teclas pendientes (`keys = {}`). Sustituye a la pausa interna (`Escape`/`P` y su overlay), que se eliminan.
  - `end()` termina la partida en curso con la puntuación actual (idempotente si ya hay Game Over o Victoria).
  - Reloj propio del juego en lugar de `performance.now()` (`explosions[].startTime`, `levelCompleteStartTime`, `updateLevelTransition`): solo avanza cuando no está en pausa, para que explosiones y la pantalla «Nivel X completado» no se consuman durante PAUSA.
  - Paso fijo de 1/60 s con acumulador (máx. 5 pasos por _frame_ dibujado): el original mueve la bola y la paleta en px por _frame_ de `requestAnimationFrame`, así que en monitores de 120/144 Hz iría el doble de rápido. El paso fijo conserva la velocidad del original a cualquier tasa de refresco; no altera constantes.
  - Ignorar `keydown` cuyo objetivo sea `input`/`textarea`; `preventDefault` de `ArrowLeft`, `ArrowRight` y `Space`. `keyup` se procesa siempre (y `blur` de la ventana limpia `keys`) para no dejar la paleta «pegada» si la tecla se suelta con el foco en el campo de nombre del modal. No se filtra `e.repeat`.
  - Sin React ni `@/lib/session`; sin tocar `window`/`document`/`Audio`/`Image` al importar; tipado sin `any` para pasar `npm run lint`.
- **Pantallas del canvas que se conservan** (son parte del juego y de su mecánica): HUD `Puntaje` / `Vidas` (iconos de bola), pantalla de inicio «Presiona SPACE para jugar» / «…para continuar» (tras perder una vida y al arrancar; SPACE lanza la bola y desbloquea el audio) y overlay «¡Nivel N completado!» (2 s). Se **quita de la pantalla de inicio la línea `High Score`** y `state.highScore` (nunca se persistía; el Salón aporta el ranking). Sin `localStorage`.
- **Se elimina lo que la app ya aporta:** overlay «GAME OVER» y «¡VICTORIA!» en canvas (los sustituye el modal FIN DEL JUEGO), overlay «PAUSA» y tecla `Escape`/`P` (los sustituye el botón PAUSA/REANUDAR), y los ficheros `index.html`, `style.css` (fondo/centrado del `body`) y `levels.js` (ya no existe; `LEVELS` vive en `game.js`).
- **Assets** a `public/games/arkanoid/` con rutas absolutas: `spritesheet-breakout.png`, `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3` (se omite `.DS_Store`). `assets/spritesheet.js` (tablas `SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION` y `drawSprite`/`drawFrame`) se integra en `lib/games/arkanoid.ts` (o `lib/games/arkanoid-sprites.ts` si el fichero queda demasiado largo), sin cambiar coordenadas. La caché global `ssImg`/`ssLoaded`/`ssCallbacks` pasa a ser estado de la factoría; si `destroy()` ocurre antes de que cargue el PNG, el `onload` no arranca el bucle. `new Audio('/games/arkanoid/sounds/…')` se crea dentro de la factoría y `play()` mantiene su `.catch(() => {})` (autoplay bloqueado hasta la primera interacción).
- Registro en `lib/games/registry.ts`: `"bloque-buster": { create: createArkanoid, width: 800, height: 600 }`. El lienzo del original ya es 800×600 (4:3), igual que Asteroids.
- Catálogo: la ficha `bloque-buster` de `lib/games.ts` (y `lib/home.ts`) se mantiene (título `BLOQUE BUSTER`, portada `cover-bricks`, textos). Su texto largo («Cada nivel reorganiza la grilla») coincide con el original; no se edita salvo que la verificación muestre una mecánica inexistente.
- Migración `supabase/migrations/{timestamp}_bloque_buster_playable.sql`: `update public.games set playable = true where id = 'bloque-buster';`, aplicada con `apply_migration`.

**Fuera de alcance:**

- Cambios de jugabilidad, gráficos, sonido, balance o dificultad: sin _power-ups_, sin más niveles, sin ajustar velocidades ni puntuación; sin silenciar/volumen (el original no los tiene); controles táctiles, de ratón o gamepad.
- High Score local (`localStorage`) y panel DOM; ya lo cubre `/salon`.
- Mostrar un resumen propio de Victoria dentro del canvas (el modal de FIN DEL JUEGO cubre ambos finales con la puntuación).
- Autenticación, anti-trampas y moderación (ver SPEC 06).
- Guardar si el jugador sale a mitad de partida.
- Migrar otros juegos; tests automatizados (no hay runner).

## Modelo de datos

Sin tablas nuevas: se reutilizan `games`, `scores` y `plays` (SPEC 06). Contrato del juego: el de `lib/games/contract.ts` (SPEC 05), sin cambios.

Único cambio de datos: `update public.games set playable = true where id = 'bloque-buster';` (la fila ya existe desde SPEC 06; se comprueba con `execute_sql` antes de aplicarla). La RLS de `scores` y `plays` ya admite INSERT para juegos con `playable = true`. La puntuación máxima posible es 1.800 (180 bloques × 10), muy por debajo del tope `score <= 10000000`: no requiere migración del CHECK.

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/01-app` lo relativo a Client Components; revisar `lib/games/asteroids.ts` y `lib/games/tetris.ts` como modelo de envoltura y `components/canvas-game-player.tsx`.
2. Copiar `spritesheet-breakout.png` y los dos `.mp3` a `public/games/arkanoid/` y fijar las rutas absolutas. Verificar: las tres URLs responden 200 con `next dev`.
3. Crear `lib/games/arkanoid.ts` envolviendo `game.js` + `spritesheet.js` en `createArkanoid`: estado en la factoría, reloj de juego y paso fijo, `setPaused`, `end`, `restart`, `destroy`, callbacks, retirada de overlays de Game Over/Victoria/Pausa y de `High Score`. Verificar: `npm run lint` y `npx tsc --noEmit` pasan; el diff contra `game.js` solo muestra envoltura, tipos, reloj/paso fijo, listeners/limpieza, callbacks y las eliminaciones decididas.
4. Registrar `bloque-buster` en `lib/games/registry.ts`. Verificar: `/juegos/bloque-buster/jugar` arranca dentro del marco CRT (4:3, sin ajustes de CSS) y Asteroids, CAÍDA y los demás simulados siguen igual.
5. Migración `playable` con `apply_migration`; verificar con `execute_sql` (`bloque-buster`, `rocas` y `caida` jugables; el resto no) y `get_advisors` (seguridad).
6. Verificar RLS como `anon`: insert en `scores` y `plays` de `bloque-buster` funciona; update/delete no afectan filas. Limpiar filas de prueba.
7. Verificar en navegador (Claude in Chrome): SPACE lanza la bola y suenan rebote y rotura; perder 3 vidas abre el modal una vez; limpiar los 3 niveles abre el modal por Victoria; PAUSA congela bola, explosiones y el temporizador de «Nivel completado»; modal (nombre, guardar, jugar de nuevo, volver al vault); una fila en `plays` por partida y una en `scores` por guardado; pestaña en `/salon`, detalle `/juegos/bloque-buster` y tarjeta de `/biblioteca` con datos reales; a 375 px sin scroll horizontal.
8. Revisión final: `npm run lint`, `npm run build`, consola sin errores de hidratación; entrar y salir 3 veces sin acelerar la bola ni duplicar sonidos.

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] `/juegos/bloque-buster/jugar` muestra el juego en el marco CRT con paleta, bola, bloques del spritesheet, HUD `Puntaje`/`Vidas` y se comporta como el original: 3 niveles con los layouts de `LEVELS`, velocidades base 4/5/6, bloques grises de 2 golpes, +10 por bloque destruido, ángulo de rebote en la paleta hasta 60° y explosiones de 4 _frames_.
- [x] La pantalla de inicio pide SPACE (al empezar y tras perder una vida) y ya no muestra `High Score`; A/D y flechas mueven la paleta sin hacer scroll; Space no hace scroll.
- [x] La velocidad de bola y paleta es la misma a 60 y a 144 Hz (paso fijo) y tras volver a la pestaña no hay saltos.
- [x] Al perder la tercera vida y al destruir el último bloque del nivel 3 se llama a `onGameOver` exactamente una vez con la puntuación mostrada y se abre el modal; no se guarda nada hasta pulsar GUARDAR PUNTUACIÓN. El canvas ya no dibuja «GAME OVER» ni «¡VICTORIA!».
- [x] GUARDAR PUNTUACIÓN crea una fila en `scores` con `game_id = 'bloque-buster'`, la puntuación y el nombre del campo; el modal muestra `▸ PUNTUACIÓN GUARDADA_`; si falla, muestra error y permite reintentar.
- [x] Cada partida terminada crea exactamente una fila en `plays`; salir a mitad no crea filas.
- [x] JUGAR DE NUEVO reinicia (nivel 1, 3 vidas, puntuación 0, bloques y explosiones limpios), cierra el modal y deja la pantalla de inicio; escribir en el campo de nombre no mueve la paleta ni deja una tecla pegada.
- [x] La barra superior muestra Jugador, Puntuación, Vidas (3 → 0) y Nivel (1–3) en vivo; PAUSA congela bola, explosiones y la cuenta atrás de «Nivel completado», y REANUDAR continúa sin saltos; FIN termina la partida una sola vez; `Escape` y `P` ya no hacen nada.
- [x] Los assets se sirven desde `/games/arkanoid/…`; si el audio está bloqueado el juego no lanza errores; no hay `localStorage` propio.
- [x] Al desmontar no quedan listeners ni `requestAnimationFrame` (entrar y salir 3 veces no acelera la bola ni duplica sonidos); desmontar antes de que cargue el PNG no arranca el bucle.
- [x] Existe `supabase/migrations/*_bloque_buster_playable.sql` y coincide con el esquema aplicado; con la clave publicable, insert en `scores`/`plays` de `bloque-buster` funciona y update/delete no afectan filas.
- [x] `/salon` muestra la pestaña BLOQUE BUSTER; `/juegos/bloque-buster` y `/biblioteca` muestran partidas, guardadas y mejor puntuación reales.
- [x] Asteroids, CAÍDA y el resto de juegos conservan su comportamiento; `lib/games/arkanoid.ts` no importa React ni `@/lib/session`.

## Decisiones

- **Sí (decisión del usuario):** sustituir la ficha `bloque-buster` conservando `id`, portada, textos y título; no se crea ficha «ARKANOID».
- **Sí:** módulo TS + canvas dentro de `CanvasGamePlayer`, sin `iframe` ni player propio; callbacks directos, sin `postMessage` (SPEC 05).
- **Sí:** envolver `game.js` en lugar de reescribirlo, para conservar el comportamiento.
- **Sí:** estadísticas con mapeo directo (puntuación, 3 vidas reales, nivel 1–3); `PlayerStats` no cambia.
- **Sí (decisión del usuario):** Game Over y Victoria disparan `onGameOver` y los muestra el modal de la app; se retiran sus overlays de canvas. Tecla `P`/`Escape` retirada; la pausa es solo el botón, para no desincronizar el estado de React con el del juego (igual que SPEC 07).
- **Sí (decisión del usuario):** se mantiene la pantalla de inicio con SPACE (es mecánica: lanza la bola y desbloquea el audio) y se quita la línea `High Score` y `localStorage`.
- **Sí:** HUD `Puntaje`/`Vidas` dentro del canvas, aunque duplique la barra superior, para no alterar los gráficos del original.
- **Sí:** reloj de juego y paso fijo de 1/60 s: son la única forma de preservar el comportamiento del original (px por _frame_) con PAUSA y en pantallas de alta frecuencia; no cambian ninguna constante.
- **Sí:** assets y audio bajo `public/games/arkanoid/` con rutas absolutas; el audio solo suena tras SPACE, que es una interacción.
- **No:** ajuste de `.crt-screen`; el canvas 800×600 es 4:3.
- **No:** _power-ups_, más niveles, volumen/silencio ni cambios de balance.
- **Sí:** guardado manual con nombre editable y registro de partida en `plays`, igual que Asteroids (SPEC 05/06).

## Riesgos

| Riesgo                                                                                                                | Mitigación                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict Mode monta el efecto dos veces y duplica listeners, bucles o sonidos                                           | `destroy()` retira `keydown`/`keyup`/`blur`, cancela el `requestAnimationFrame` y descarta el `onload` del PNG; criterio de montar/desmontar 3 veces |
| `onGameOver` se dispara más de una vez (`loseLife` en el bucle, `end()` durante Game Over/Victoria)                   | Emitir solo en la transición a `gameOver`/`victory` y guardar con el estado de pantalla; `end()` idempotente                                         |
| El juego mueve en px por _frame_: en 120/144 Hz iría el doble de rápido                                               | Paso fijo 1/60 s con acumulador y tope de 5 pasos                                                                                                    |
| Al pausar se consumen explosiones y los 2 s de «Nivel completado» (usan `performance.now()`)                          | Reloj de juego que no avanza en pausa                                                                                                                |
| Soltar una tecla con el foco en el campo de nombre del modal deja la paleta pegada                                    | `keyup` siempre procesado, `keys` limpiado en `blur` y en `setPaused`/`restart`                                                                      |
| Flechas/espacio hacen scroll o mueven la paleta al escribir en el modal                                               | `preventDefault` en teclas del juego; ignorar `keydown` con objetivo `input`/`textarea`                                                              |
| Audio bloqueado por _autoplay_ o `Audio` usado en SSR                                                                 | `new Audio` solo dentro de la factoría (`useEffect`); `play().catch(() => {})`; SPACE precede a cualquier sonido                                     |
| El PNG no ha cargado y `draw` pinta vacío; o `destroy()` llega antes que `onload`                                     | `drawSprite`/`drawFrame` ya devuelven si no hay imagen; el bucle arranca en `onload` solo si la factoría sigue viva                                  |
| Spritesheet escalado se ve borroso o distinto al original                                                             | No se toca `imageSmoothingEnabled` ni los tamaños de dibujo; mismo canvas 800×600                                                                    |
| El diff con `references/` (hay cambios locales sin commitear en `04-arkanoid`) hace dudar de qué versión es la fuente | La fuente es el `game.js` del árbol de trabajo actual (con `LEVELS` inline); se anota en el commit                                                   |

## Qué **no** está en esta spec

- Cambios de jugabilidad, arte o sonido de Arkanoid; controles táctiles, ratón o gamepad.
- Auth, ranking anti-trampas, moderación.
- Migración de otros juegos; tests automatizados.
