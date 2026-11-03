# SPEC 05 — Juego Asteroids (sustituye a ROCAS)

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-03
> **Objetivo:** Portar a Next.js el juego de `references/resources/started-games/02-asteroids/` sin cambiar su jugabilidad ni su HUD, jugable en `/juegos/rocas/jugar`, y guardar la puntuación en la sesión de la app cuando termina la partida.

## Por qué existe esta spec

Hoy todos los juegos del catálogo corren sobre `GamePlayer`, que simula la partida (puntuación aleatoria cada 220 ms). Asteroids es el primer juego real: un `game.js` autónomo de 510 líneas sobre un `<canvas>` de 800×600, con su propio HUD y pantalla de Game Over. Esta spec lo integra en el proyecto como sustituto del reproductor simulado de ROCAS, y define el contrato mínimo entre un juego real y la app: **el juego avisa de la puntuación final y la app la guarda**. Los siguientes juegos (`03-tetris`, `04-arkanoid`) podrán seguir el mismo patrón.

## Alcance

**Dentro:**

- Módulo del juego en TypeScript con la lógica de `game.js` intacta (clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`, constantes, bucle, colisiones, niveles, HUD y overlay de Game Over dibujados en el canvas).
- Adaptación estrictamente necesaria para que viva dentro de Next.js:
  - Envolver el estado global del script en una función `createAsteroids(canvas, { onGameOver })` que devuelve `destroy()`.
  - Registrar `keydown`/`keyup` en `window` al crear y retirarlos en `destroy()`; cancelar el `requestAnimationFrame` en `destroy()`.
  - Tipar el código (sin `any` salvo donde el original lo exija) para pasar `npm run lint`.
  - Llamar a `onGameOver(score)` **una sola vez** cada vez que `state` pasa a `'gameover'` (`lives <= 0` en `killShip`).
- Componente cliente `components/asteroids-player.tsx`:
  - Marco CRT existente (`.crt`, `.crt-screen`, `.crt-bottom`) con el `<canvas width=800 height=600>` dentro, escalado por CSS al ancho disponible sin deformarse.
  - Enlace SALIR (a `/juegos/rocas`).
  - Aviso `▸ PUNTUACIÓN GUARDADA_` (clase `.toast-saved`) cuando se guarda.
  - Guardado con `saveScore({ game, score, name })`, con `name = user?.name ?? "INVITADO"`.
- `app/juegos/[id]/jugar/page.tsx`: renderiza `AsteroidsPlayer` para `id === "rocas"` y `GamePlayer` para el resto.
- Teclas del juego (`ArrowLeft/Right/Up`, `Space`) con `preventDefault` mientras el canvas está montado, para que las flechas y el espacio no hagan scroll de la página.

**Fuera de alcance (specs futuras):**

- Cambios de jugabilidad, gráficos, sonido, balance, dificultad, controles táctiles o gamepad. El juego se mantiene original.
- Modificar el HUD y overlays del canvas (SCORE, NIVEL, vidas, `3x`, GAME OVER).
- Guardar en Supabase: tabla, RLS, migración o autenticación. La puntuación va a `localStorage` (`av_scores`) vía `saveScore`, como SPEC 01.
- Barra superior de `GamePlayer` (Jugador/Puntuación/Vidas/Nivel), PAUSA, FIN y modal de iniciales en este juego.
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
};

/** Monta el juego sobre el canvas y arranca el bucle. Devuelve la función de limpieza. */
export function createAsteroids(
  canvas: HTMLCanvasElement,
  options: AsteroidsOptions,
): () => void;
```

Convenciones:

- El módulo no importa nada de React ni de la app: solo recibe el canvas y el callback.
- Reiniciar con `Espacio` tras Game Over (`initGame`) deja el juego listo para volver a notificar en la siguiente partida.
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

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/juegos/rocas/jugar` muestra el juego dentro del marco CRT; la nave, asteroides, balas, power-up `3x`, partículas, niveles y HUD del canvas se comportan igual que en `index.html` original.
- [ ] Las constantes de jugabilidad (`RADII`, `SPEEDS`, `POINTS`, `POWERUP_*`, `TRIPLE_SPREAD`, rotación, empuje, fricción, 3 vidas, 4 asteroides iniciales, `3 + level` por nivel) coinciden con las de `game.js`.
- [ ] Al perder la última vida se llama a `onGameOver` exactamente una vez con la puntuación mostrada en pantalla y aparece una nueva entrada en `localStorage.av_scores` con `{ game: "rocas", score, name, at }`.
- [ ] El nombre guardado es el de la sesión si hay usuario y `INVITADO` si no.
- [ ] Tras Game Over, `Espacio` reinicia; perder otra partida guarda una segunda entrada (sin duplicar la primera).
- [ ] Salir a mitad de partida (SALIR o navegación) no guarda nada.
- [ ] Se muestra `▸ PUNTUACIÓN GUARDADA_` al guardar y desaparece al reiniciar.
- [ ] Al desmontar el componente no quedan listeners de teclado ni `requestAnimationFrame` activos (entrar y salir 3 veces no acelera ni duplica el juego).
- [ ] Flechas y `Espacio` no hacen scroll de la página mientras se juega.
- [ ] El canvas se ve completo y sin deformar a 375 px (sin scroll horizontal).
- [ ] Los otros 7 juegos conservan el reproductor simulado sin cambios.
- [ ] El módulo `lib/games/asteroids.ts` no importa React ni `@/lib/session`.

## Decisiones

- **Sí:** «NetSies» se interpreta como Next.js, la app anfitriona; confirmado por el usuario. «Notificar» = callback `onGameOver(score)`, «guardar» = `saveScore` existente.
- **Sí:** módulo TS + canvas dentro de un componente React, no `iframe`. Entra en el tipado, lint y estilos del proyecto, y el callback es directo sin `postMessage`.
- **No:** reescribir el juego con el modelo de React (estado, hooks por entidad). Se envuelve el original para conservarlo; reescribir cambiaría comportamiento.
- **Sí:** el «hub» se entiende como el HUD y overlays del canvas; se conservan sin cambios. La app solo aporta marco CRT, SALIR y el aviso de guardado.
- **No:** barra de stats, PAUSA, FIN ni modal de iniciales en este juego. Duplicarían el HUD del canvas y las stats de la barra no tienen fuente real sin tocar el juego.
- **Sí:** guardado automático solo en Game Over, con el nombre de sesión. Es el único momento en que la puntuación es final y evita guardados parciales.
- **No:** guardar al salir a mitad de partida, para no registrar puntuaciones que el jugador abandonó.
- **Sí:** `localStorage` vía `saveScore`. Supabase queda para una spec propia de puntuaciones, coherente con SPEC 04 (solo conexión).
- **Sí:** se mantiene el `id: "rocas"` y la entrada del catálogo (título, portada, textos). Evita romper rutas y enlaces; la spec cambia lo que se juega, no la ficha. Renombrar a ASTEROIDS, si se quiere, es un cambio aparte en `lib/games.ts`.
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
| El marco CRT (scanlines, `::after`) tapa o distorsiona el canvas                              | Paso 4: revisión visual; si molesta, ajustar solo la capa decorativa para este juego.                                   |

## Qué **no** está en esta spec

- Cambios de jugabilidad, arte o sonido de Asteroids.
- Persistencia en Supabase, auth o ranking real.
- Migración de Tetris, Arkanoid u otros juegos.
- Controles táctiles o de gamepad.
- Renombrar la ficha del catálogo.
- Tests automatizados.
