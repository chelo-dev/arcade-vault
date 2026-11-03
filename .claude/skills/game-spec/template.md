# SPEC {NN} — Juego {TÍTULO} con leaderboard

> **Estado:** Pendiente
> **Depende de:** SPEC 01, SPEC 05, SPEC 06
> **Fecha:** {YYYY-MM-DD}
> **Objetivo:** Portar a Next.js {el juego de `references/resources/started-games/{carpeta}/` | un juego original de {género}} sin cambiar su jugabilidad, jugable en `/juegos/{id}/jugar` con el reproductor genérico, y guardar sus puntuaciones en Supabase para que aparezcan en `/salon`, el detalle y la biblioteca.

## Por qué existe esta spec

{Qué juego es, de dónde viene, por qué ahora. Una vez integrado, «jugable» solo requiere módulo + registro + `playable = true` (patrón de SPEC 05/06).}

## Alcance

**Dentro:**

- Módulo `lib/games/{slug}.ts` que exporta `create{Juego}: CreateGame` (`lib/games/contract.ts`) con la lógica original intacta. Adaptación estrictamente necesaria:
  - Envolver el estado global en la factoría; el estado de input vive dentro, no a nivel de módulo.
  - Registrar listeners en `window` al crear y retirarlos en `destroy()`; cancelar `requestAnimationFrame`.
  - `onGameOver(score)` una sola vez, en la transición a Game Over (no en el bucle).
  - `onRestart()` tras reiniciar, sea por tecla o por `restart()` (misma función).
  - `onStats({ score, lives, level })` solo cuando cambia alguno: {mapeo de estadísticas para este juego}.
  - `setPaused(paused)` (congela `update`, sigue dibujando; descarta la tecla pendiente) y `end()` (idempotente en Game Over).
  - Ignorar teclas cuyo objetivo sea `input`/`textarea`; `preventDefault` de las teclas del juego: {lista}.
  - Sin React ni `@/lib/session`; sin tocar `window`/`document` al importar; tipado sin `any` para pasar `npm run lint`.
- {Eliminar del original lo que la app ya aporta: botón reiniciar, overlay DOM de Game Over, selector de tema, panel de estadísticas DOM… Lo que se conserva dentro del canvas: {HUD}.}
- {Assets: copiar a `public/games/{slug}/` y cargar con rutas absolutas `/games/{slug}/…`.}
- Registro en `lib/games/registry.ts`: `{id}: { create: create{Juego}, width: {W}, height: {H} }`.
- Catálogo: {ficha existente `{id}` con título `{TÍTULO}` en `lib/games.ts` (y `lib/home.ts`) | ficha nueva con portada y textos}.
- {Si el canvas no es 4:3: ajuste de `.crt-screen` solo para este juego, sin tocar el resto.}
- Migración `supabase/migrations/{timestamp}_{slug}_playable.sql`: {`update public.games set playable = true where id = '{id}';` | `insert` de la fila con id/título/cat de `lib/games.ts` y `playable = true`}, aplicada con `apply_migration`.

**Fuera de alcance:**

- Cambios de jugabilidad, gráficos, sonido, balance o dificultad; controles táctiles o gamepad.
- Autenticación, anti-trampas y moderación (ver SPEC 06).
- Guardar si el jugador sale a mitad de partida.
- Migrar otros juegos; tests automatizados (no hay runner).
- {Otros específicos.}

## Modelo de datos

Sin tablas nuevas: se reutilizan `games`, `scores` y `plays` (SPEC 06). Contrato del juego: el de `lib/games/contract.ts` (SPEC 05), sin cambios.

Cambios de datos: solo la migración de `playable` descrita arriba. {Si `scores.score` puede superar 10.000.000: justificar una migración que amplíe el CHECK.}

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/01-app` lo relativo a Client Components; fijar convenciones. Revisar el original y `lib/games/asteroids.ts` como modelo de envoltura.
2. Crear `lib/games/{slug}.ts` envolviendo el original en `create{Juego}`. Verificar: `npm run lint` y `tsc` pasan; el diff contra el original solo muestra envoltura, tipos, listeners/limpieza y callbacks.
3. {Copiar assets a `public/games/{slug}/` y ajustar rutas.}
4. Registrar el juego en `lib/games/registry.ts` y ajustar la ficha del catálogo. Verificar: `/juegos/{id}/jugar` arranca dentro del marco CRT; el resto de juegos sigue igual.
5. {Ajuste de CSS para canvas no 4:3.} Verificar a 375 px sin scroll horizontal.
6. Migración `playable` con `apply_migration`; verificar con `execute_sql` y `get_advisors` (seguridad).
7. Verificar RLS como `anon`: insert en `scores` y `plays` de `{id}` funciona; update/delete no afectan filas; limpiar filas de prueba.
8. Verificar en navegador: partida completa, modal (nombre, guardar, jugar de nuevo, volver al vault), una fila en `plays` por partida y una en `scores` por guardado, pestaña en `/salon`, detalle `/juegos/{id}` y tarjeta de `/biblioteca` con datos reales.
9. Revisión final: `npm run lint`, `npm run build`, consola sin errores de hidratación.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/juegos/{id}/jugar` muestra el juego en el marco CRT y se comporta como el original ({detalles específicos: constantes, niveles, controles}).
- [ ] Al terminar la partida se llama a `onGameOver` exactamente una vez con la puntuación mostrada y se abre el modal; no se guarda nada hasta pulsar GUARDAR PUNTUACIÓN.
- [ ] GUARDAR PUNTUACIÓN crea una fila en `scores` con `game_id = '{id}'`, la puntuación y el nombre del campo; el modal muestra `▸ PUNTUACIÓN GUARDADA_`; si falla, muestra error y permite reintentar.
- [ ] Cada partida terminada crea exactamente una fila en `plays`; salir a mitad no crea filas.
- [ ] JUGAR DE NUEVO y {tecla de reinicio} reinician y cierran el modal; escribir en el campo de nombre no afecta al juego.
- [ ] La barra superior muestra Jugador, Puntuación, Vidas y Nivel en vivo; PAUSA congela y reanuda sin saltos; FIN termina la partida una sola vez.
- [ ] Al desmontar no quedan listeners ni `requestAnimationFrame` (entrar y salir 3 veces no acelera ni duplica); las teclas del juego no hacen scroll.
- [ ] `/salon` muestra la pestaña {TÍTULO}; `/juegos/{id}` y `/biblioteca` muestran partidas, guardadas y mejor puntuación reales.
- [ ] Existe `supabase/migrations/*_{slug}_playable.sql` y coincide con el esquema aplicado; con la clave publicable, insert en `scores`/`plays` de `{id}` funciona y update/delete no afectan filas.
- [ ] Asteroids y el resto de juegos conservan su comportamiento; `lib/games/{slug}.ts` no importa React ni `@/lib/session`.

## Decisiones

- **Sí:** módulo TS + canvas dentro de `CanvasGamePlayer` (sin `iframe` ni player propio); callbacks directos, sin `postMessage`.
- **Sí:** envolver el original en lugar de reescribirlo, para conservar el comportamiento.
- **Sí:** guardado manual con nombre editable y registro de partida en `plays`, igual que Asteroids (SPEC 05/06).
- {Decisiones específicas: HUD y overlays, mapeo de estadísticas, assets, ficha de catálogo.}

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Strict Mode monta el efecto dos veces y duplica listeners o bucles | `destroy()` retira todo; criterio de montar/desmontar |
| `onGameOver` se dispara más de una vez | Emitir solo en la transición a Game Over |
| Teclas/espacio hacen scroll o se activan al escribir en el modal | `preventDefault` en teclas del juego; ignorar eventos de `input` |
| `window`/`Audio`/`Image` usados en SSR | Todo corre dentro de `useEffect`; nada se toca al importar |
| {Riesgos específicos: audio bloqueado, assets, canvas no 4:3, listeners en `document`} | {…} |

## Qué **no** está en esta spec

- Cambios de jugabilidad, arte o sonido; controles táctiles.
- Auth, ranking anti-trampas, moderación.
- Migración de otros juegos; tests automatizados.
