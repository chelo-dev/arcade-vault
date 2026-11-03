# SPEC 05 — Juego Asteroids (sustituye a ROCAS)

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-03
> **Objetivo:** Portar a Next.js el juego de `references/resources/started-games/02-asteroids/` sin cambiar su jugabilidad ni su HUD, jugable en `/juegos/rocas/jugar`, y, cuando termina la partida, abrir el modal de fin de juego de la app (nombre, guardar puntuación, jugar de nuevo, volver al vault) con comunicación en ambos sentidos entre el juego y la app. *(Ampliado el 2026-11-03: ver «Historial de cambios».)*

## Por qué existe esta spec

Hoy todos los juegos del catálogo corren sobre `GamePlayer`, que simula la partida (puntuación aleatoria cada 220 ms). Asteroids es el primer juego real: un `game.js` autónomo de 510 líneas sobre un `<canvas>` de 800×600, con su propio HUD y pantalla de Game Over. Esta spec lo integra en el proyecto como sustituto del reproductor simulado de ROCAS, y define el contrato mínimo entre un juego real y la app: **el juego avisa de la puntuación final y la app la guarda**. Los siguientes juegos (`03-tetris`, `04-arkanoid`) podrán seguir el mismo patrón.

## Alcance

**Dentro:**

- Módulo del juego en TypeScript con la lógica de `game.js` intacta (clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`, constantes, bucle, colisiones, niveles, HUD y overlay de Game Over dibujados en el canvas).
- Adaptación estrictamente necesaria para que viva dentro de Next.js:
  - Envolver el estado global del script en una función `createAsteroids(canvas, { onGameOver, onRestart })` que devuelve `{ restart, destroy }`.
  - Registrar `keydown`/`keyup` en `window` al crear y retirarlos en `destroy()`; cancelar el `requestAnimationFrame` en `destroy()`.
  - Tipar el código (sin `any` salvo donde el original lo exija) para pasar `npm run lint`.
  - Llamar a `onGameOver(score)` **una sola vez** cada vez que `state` pasa a `'gameover'` (`lives <= 0` en `killShip`).
  - Llamar a `onRestart()` cada vez que la partida se reinicia, ya sea por `Espacio` o por `restart()` (ambos pasan por la misma función).
  - Llamar a `onStats({ score, lives, level })` cada vez que alguno de los tres valores cambia (no en cada fotograma).
  - Exponer `setPaused(paused)` (congela `update`, sigue dibujando) y `end()` (termina la partida en curso: pierde la vida restante, pasa a `'gameover'` y llama a `onGameOver` una sola vez; no hace nada si ya está en Game Over).
  - Ignorar las teclas (sin `preventDefault` ni registro) cuando el objetivo del evento es un `input`, para poder escribir en el modal.
- Componente cliente `components/asteroids-player.tsx`:
  - Marco CRT existente (`.crt`, `.crt-screen`, `.crt-bottom`) con el `<canvas width=800 height=600>` dentro, escalado por CSS al ancho disponible sin deformarse.
  - Enlace SALIR (a `/juegos/rocas`).
  - Al `onGameOver(score)`, abrir el modal FIN DEL JUEGO (mismo diseño que el de `GamePlayer`) con la puntuación final, un campo de nombre precargado con `user?.name ?? "INVITADO"` (editable, mayúsculas, máx. 10), GUARDAR PUNTUACIÓN, JUGAR DE NUEVO y VOLVER AL VAULT (`/biblioteca`).
  - GUARDAR PUNTUACIÓN llama a `saveScore({ game, score, name })` y muestra `▸ PUNTUACIÓN GUARDADA_` (`.toast-saved`) dentro del modal. El guardado es manual.
  - JUGAR DE NUEVO llama a `restart()` del juego; `onRestart` cierra el modal (también al reiniciar con `Espacio`).
- Barra superior con las estadísticas en vivo (Jugador, Puntuación, Vidas, Nivel) con el mismo diseño que la de `GamePlayer`, alimentada por `onStats` y por el nombre de sesión. Se extrae `components/player-stats.tsx` desde `GamePlayer` y se comparte. La barra incluye también PAUSA/REANUDAR y FIN (mismos botones y estilos que `GamePlayer`) y SALIR.
- Catálogo: el título de la ficha pasa de `ROCAS` a `ASTEROIDS` en `lib/games.ts` (y su mención en `lib/home.ts`); se mantienen `id: "rocas"`, portada y textos.
- En `AsteroidsPlayer`: PAUSA alterna `setPaused` y muestra el aviso `EN PAUSA` sobre la pantalla CRT (igual que `GamePlayer`); FIN llama a `end()` y abre el modal de fin de juego. La pausa se desactiva al llegar al Game Over.
- Componente `components/game-over-modal.tsx`: el modal FIN DEL JUEGO extraído de `GamePlayer` y compartido por ambos reproductores, sin cambiar su aspecto ni el de `GamePlayer`.
- `app/juegos/[id]/jugar/page.tsx`: renderiza `AsteroidsPlayer` para `id === "rocas"` y `GamePlayer` para el resto.
- Teclas del juego (`ArrowLeft/Right/Up`, `Space`) con `preventDefault` mientras el canvas está montado, para que las flechas y el espacio no hagan scroll de la página.

**Fuera de alcance (specs futuras):**

- Cambios de jugabilidad, gráficos, sonido, balance, dificultad, controles táctiles o gamepad. El juego se mantiene original.
- Modificar el HUD y overlays del canvas (SCORE, NIVEL, vidas, `3x`, GAME OVER).
- Guardar en Supabase: tabla, RLS, migración o autenticación. La puntuación va a `localStorage` (`av_scores`) vía `saveScore`, como SPEC 01.
- Guardar si el jugador sale a mitad de partida o cierra la pestaña.
- Que el salón de la fama o el detalle lean `av_scores` (hoy usan datos sembrados; no cambia).
- Migrar `03-tetris` y `04-arkanoid`.
- Cambiar el reproductor simulado del resto de juegos.
- `favicon.svg` del juego (el sitio ya tiene el suyo).
- Tests automatizados (no hay runner configurado).

## Modelo de datos

Sin tablas ni estructuras persistentes nuevas: se reutiliza `SavedScore` de `lib/session.tsx` (`{ game, score, name, at }`). Contrato nuevo entre el juego y la app:

```ts
// lib/games/asteroids.ts
export type AsteroidsOptions = {
  /** Se llama una vez por partida, cuando se acaban las vidas. */
  onGameOver: (score: number) => void;
  /** Se llama cuando la partida se reinicia (Espacio o `restart()`). */
  onRestart: () => void;
  /** Se llama cuando cambia la puntuación, las vidas o el nivel. */
  onStats: (stats: AsteroidsStats) => void;
};

export type AsteroidsStats = { score: number; lives: number; level: number };

export type AsteroidsControls = {
  /** Reinicia la partida desde la app (botón JUGAR DE NUEVO). */
  restart: () => void;
  /** Pausa o reanuda la partida (botón PAUSA/REANUDAR). */
  setPaused: (paused: boolean) => void;
  /** Termina la partida en curso (botón FIN): equivale a perder la última vida. */
  end: () => void;
  /** Retira listeners y cancela el bucle. */
  destroy: () => void;
};

/** Monta el juego sobre el canvas y arranca el bucle. */
export function createAsteroids(
  canvas: HTMLCanvasElement,
  options: AsteroidsOptions,
): AsteroidsControls;
```

Convenciones:

- El módulo no importa nada de React ni de la app: solo recibe el canvas y el callback.
- Comunicación juego → app: `onGameOver(score)`, `onRestart()` y `onStats(stats)`. App → juego: `restart()`, `setPaused(paused)` y `end()`.
- Reiniciar (por `Espacio` o `restart()`) ejecuta `initGame` y luego `onRestart()`; deja el juego listo para volver a notificar en la siguiente partida.
- El callback se invoca con el valor de `score` del instante del Game Over.
- La constante `W = 800` / `H = 600` se mantiene; el escalado es solo CSS.

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/01-app` lo relativo a Client Components y a `cacheComponents` (los hooks/APIs de navegador solo dentro de `"use client"` y efectos). Fijar convenciones antes de codificar.
2. Crear `lib/games/asteroids.ts` copiando `game.js` y envolviéndolo en `createAsteroids` según el alcance. Verificar: `npm run lint` pasa y un diff contra `game.js` solo muestra envoltura, tipos, listeners/limpieza y la llamada a `onGameOver`.
3. Crear `components/asteroids-player.tsx`: `useEffect` que llama a `createAsteroids(canvasRef.current, { onGameOver })` y retorna `destroy`; `onGameOver` llama a `saveScore` y activa el aviso de guardado; el aviso se oculta al reiniciar. Verificar: en `/juegos/rocas/jugar` el juego arranca dentro del marco CRT.
4. Ajustar estilos mínimos en `app/globals.css` para que el canvas ocupe el ancho del `.crt-screen` manteniendo 4:3, sin tocar `.game-arena` ni lo demás. Verificar: `GamePlayer` de otros juegos no cambia de aspecto.
5. Editar `app/juegos/[id]/jugar/page.tsx` para elegir `AsteroidsPlayer` cuando `game.id === "rocas"`. Verificar: los otros 7 juegos siguen con el reproductor simulado.
6. Verificar en navegador: jugar hasta perder las 3 vidas; comprobar la entrada en `localStorage.av_scores`; reiniciar con `Espacio` y perder otra vez para comprobar una segunda entrada; navegar fuera y volver sin listeners duplicados.
7. Revisión final: `npm run lint`, `npm run build`, consola sin errores de hidratación y sin scroll de página al usar flechas/espacio.
8. *(Añadido 2026-11-03)* Ampliar el contrato del juego: `onRestart`, retorno `{ restart, destroy }`, y ignorar teclas cuyo objetivo sea un `input`. Verificar: `npm run lint` y `tsc` pasan.
9. *(Añadido 2026-11-03)* Extraer `components/game-over-modal.tsx` desde `GamePlayer` y usarlo en `GamePlayer` y `AsteroidsPlayer`; este último pasa a guardado manual con estado `over/score/name/saved`. Verificar: `GamePlayer` se ve igual.
10. *(Añadido 2026-11-03)* Verificar en navegador el modal: nombre editable, guardar, jugar de nuevo, volver al vault y escribir en el campo sin afectar al juego.
11. *(Añadido 2026-11-03)* Añadir `onStats` al juego, emitido solo cuando cambian puntuación, vidas o nivel.
12. *(Añadido 2026-11-03)* Extraer `components/player-stats.tsx` desde `GamePlayer`, usarlo en ambos reproductores y alimentarlo en `AsteroidsPlayer` con `onStats` y el nombre de sesión. Verificar: la barra de `GamePlayer` se ve igual.
13. *(Añadido 2026-11-03)* Cambiar el título del catálogo a `ASTEROIDS` (`lib/games.ts`, `lib/home.ts`) y usar `game.title` en el pie del CRT.
14. *(Añadido 2026-11-03)* Añadir `setPaused` y `end` al contrato del juego. Verificar: `lint` y `tsc` pasan.
15. *(Añadido 2026-11-03)* Añadir los botones PAUSA/REANUDAR y FIN y el aviso `EN PAUSA` en `AsteroidsPlayer`. Verificar en navegador: pausar congela la partida, reanudar la continúa sin disparo fantasma, FIN abre el modal con la puntuación actual.

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] `/juegos/rocas/jugar` muestra el juego dentro del marco CRT; la nave, asteroides, balas, power-up `3x`, partículas, niveles y HUD del canvas se comportan igual que en `index.html` original.
- [x] Las constantes de jugabilidad (`RADII`, `SPEEDS`, `POINTS`, `POWERUP_*`, `TRIPLE_SPREAD`, rotación, empuje, fricción, 3 vidas, 4 asteroides iniciales, `3 + level` por nivel) coinciden con las de `game.js`.
- [x] Al perder la última vida se llama a `onGameOver` exactamente una vez con la puntuación mostrada en pantalla y se abre el modal FIN DEL JUEGO con esa puntuación; no se guarda nada hasta pulsar GUARDAR PUNTUACIÓN.
- [x] GUARDAR PUNTUACIÓN crea una entrada en `localStorage.av_scores` con `{ game: "rocas", score, name, at }` y el modal muestra `▸ PUNTUACIÓN GUARDADA_`.
- [x] El modal precarga el nombre de la sesión (o `INVITADO`); es editable (mayúsculas, máx. 10) y ese es el nombre que se guarda.
- [x] JUGAR DE NUEVO y `Espacio` reinician la partida y cierran el modal; perder y guardar otra partida añade una segunda entrada sin duplicar la primera.
- [x] VOLVER AL VAULT lleva a `/biblioteca`. Escribir en el campo de nombre (incluido el espacio) no mueve la nave, no reinicia el juego ni hace scroll.
- [x] Salir a mitad de partida (SALIR o navegación) no guarda nada.
- [x] Al desmontar el componente no quedan listeners de teclado ni `requestAnimationFrame` activos (entrar y salir 3 veces no acelera ni duplica el juego).
- [x] Flechas y `Espacio` no hacen scroll de la página mientras se juega.
- [x] El canvas se ve completo y sin deformar a 375 px (sin scroll horizontal).
- [x] La barra superior de `/juegos/rocas/jugar` muestra Jugador (nombre de sesión o `INVITADO`), Puntuación, Vidas y Nivel con el mismo diseño que la de `GamePlayer`, y se actualizan en vivo con la partida (puntuación al destruir, vidas al morir, nivel al limpiar asteroides).
- [x] La ficha del catálogo, la home y el pie del reproductor muestran `ASTEROIDS`; la ruta sigue siendo `/juegos/rocas`.
- [x] PAUSA congela la partida (nave, asteroides, balas y temporizadores) y muestra `EN PAUSA`; el botón pasa a REANUDAR y la partida continúa donde estaba, sin disparo ni salto de tiempo.
- [x] FIN termina la partida en curso (también en pausa): llama a `onGameOver` una sola vez y abre el modal con la puntuación actual; pulsarlo con el modal abierto no repite la llamada.
- [x] Los otros 7 juegos conservan el reproductor simulado sin cambios, y `GamePlayer` se ve y funciona igual tras extraer el modal.
- [x] El módulo `lib/games/asteroids.ts` no importa React ni `@/lib/session`.

## Decisiones

- **Sí:** «NetSies» se interpreta como Next.js, la app anfitriona; confirmado por el usuario. «Notificar» = callback `onGameOver(score)`, «guardar» = `saveScore` existente.
- **Sí:** módulo TS + canvas dentro de un componente React, no `iframe`. Entra en el tipado, lint y estilos del proyecto, y el callback es directo sin `postMessage`.
- **No:** reescribir el juego con el modelo de React (estado, hooks por entidad). Se envuelve el original para conservarlo; reescribir cambiaría comportamiento.
- **Sí:** el «hub» se entiende como el HUD y overlays del canvas; se conservan sin cambios. La app solo aporta marco CRT, SALIR y el aviso de guardado.
- **Sí (2026-11-03):** botones PAUSA y FIN en la barra. Sustituyen a la decisión original de excluirlos: la barra debe coincidir con la del modo demostración. Se resuelven con `setPaused` y `end()` en el contrato, sin estado compartido global.
- **Sí (2026-11-03):** barra superior con estadísticas en vivo. Sustituye a la decisión original de no incluirla: se quiere la misma barra que en modo demostración. La fuente real es el juego vía `onStats`, y el HUD del canvas se conserva sin cambios.
- **Sí (revisado 2026-11-03):** al Game Over se abre el modal de la app y el guardado es manual (GUARDAR PUNTUACIÓN) con nombre editable, igual que en `GamePlayer`. Sustituye a la decisión original de guardado automático con el nombre de sesión: el juego nativo ofrecía nombre, guardar, jugar de nuevo y volver al vault, y la app debía conservarlo.
- **Sí (2026-11-03):** comunicación bidireccional juego ↔ app mediante callbacks (`onGameOver`, `onRestart`) y `restart()`; sin `postMessage` ni estado compartido global.
- **Sí (2026-11-03):** extraer `GameOverModal` y reutilizarlo en lugar de duplicar el markup; es el mismo modal para todos los juegos.
- **No:** guardar al salir a mitad de partida, para no registrar puntuaciones que el jugador abandonó.
- **Sí:** `localStorage` vía `saveScore`. Supabase queda para una spec propia de puntuaciones, coherente con SPEC 04 (solo conexión).
- **Sí (revisado 2026-11-03):** se mantiene el `id: "rocas"`, la portada y los textos, pero el título del catálogo pasa a `ASTEROIDS`. Evita romper rutas y enlaces y el nombre visible coincide con el juego real. Sustituye a la decisión original de no renombrar la ficha.
- **Sí:** el resto de juegos sigue con el reproductor simulado hasta migrarse en sus propias specs.

## Riesgos

| Riesgo                                                                                        | Mitigación                                                                                                              |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| React Strict Mode monta el efecto dos veces y duplica listeners o bucles                      | `destroy()` retira listeners y cancela el `requestAnimationFrame`; criterio de aceptación de montar/desmontar repetido. |
| `onGameOver` se dispara más de una vez por partida (el bucle sigue en `state === 'gameover'`) | Emitir solo en la transición dentro de `killShip`, no en `update`.                                                      |
| El `justPressed` global de `Space` se arrastra entre montajes                                 | El estado de input se crea dentro de `createAsteroids`, no a nivel de módulo.                                           |
| Flechas y espacio hacen scroll de la página                                                   | `preventDefault` en los listeners mientras el juego está montado; se retira en `destroy()`.                             |
| `performance.now()` o `window` usados en SSR                                                  | Todo el código del juego solo corre dentro de `useEffect`; el módulo no toca `window`/`document` al importarse.         |
| `dt` enorme al volver a la pestaña                                                            | El original ya limita `dt` a 0,05 s; se conserva.                                                                       |
| Escribir en el campo del modal dispara el juego (`Espacio` reinicia, `preventDefault` bloquea el espacio) | El juego ignora eventos de teclado cuyo objetivo es un `input`. |
| Tras pulsar un botón con el ratón, `Espacio` lo reactiva o dispara el juego | El juego ya hace `preventDefault` de `Espacio` en `keydown` y `keyup`; al reanudar se descarta el `Espacio` pendiente. |
| El marco CRT (scanlines, `::after`) tapa o distorsiona el canvas                              | Paso 4: revisión visual; si molesta, ajustar solo la capa decorativa para este juego.                                   |

## Qué **no** está en esta spec

- Cambios de jugabilidad, arte o sonido de Asteroids.
- Persistencia en Supabase, auth o ranking real.
- Migración de Tetris, Arkanoid u otros juegos.
- Controles táctiles o de gamepad.
- Renombrar el `id`/ruta `rocas` o su portada.
- Tests automatizados.

## Historial de cambios

- **2026-11-03 — Modal de fin de juego (ampliación de alcance).** Tras probar la implementación de los pasos 1-5, se constató que el modal nativo de Game Over (nombre, guardar puntuación, jugar de nuevo, volver al vault) no se había adaptado. Se incorpora al alcance: contrato del juego ampliado (`onRestart`, `{ restart, destroy }`), `GameOverModal` compartido, guardado manual con nombre editable. Se revisan el objetivo, el alcance, el modelo de datos, el plan (pasos 8-10), los criterios y las decisiones. Se retiran «modal de iniciales» de fuera de alcance y la decisión de guardado automático.
- **2026-11-03 — Barra de estadísticas y nombre del juego.** Se incorpora la barra superior con Jugador/Puntuación/Vidas/Nivel en vivo (`onStats`, `PlayerStats` compartido) y se renombra el título del catálogo de `ROCAS` a `ASTEROIDS` (pasos 11-13). PAUSA y FIN siguen fuera de alcance.
- **2026-11-03 — PAUSA y FIN.** Se añaden los botones PAUSA/REANUDAR y FIN a la barra superior, con `setPaused` y `end()` en el contrato del juego (pasos 14-15). Se retira PAUSA y FIN de «fuera de alcance».
- **2026-11-03 — Reproductor genérico.** `AsteroidsPlayer` pasa a `CanvasGamePlayer` y el contrato a `lib/games/contract.ts` (`CreateGame`); `lib/games/registry.ts` (`REAL_GAMES`) enlaza cada `id` con su módulo. La clase `.asteroids-canvas` pasa a `.game-canvas`. Comportamiento sin cambios.
