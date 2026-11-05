# GAME JAM estela · SPEC 02 — Leaderboard de ESTELA en Supabase

> **Estado:** Pendiente
> **Tema:** ESTELA — duelo de motos de luz
> **Depende de:** SPEC 06, GAME JAM estela · SPEC 01
> **Fecha:** 2026-11-05
> **Objetivo:** Dar de alta ESTELA en la tabla `games` con `playable = true` para que sus puntuaciones se guarden y aparezcan en `/salon`, `/juegos/estela` y `/biblioteca`.

## Por qué existe esta spec

La SPEC 01 de esta carpeta deja ESTELA jugable en `/juegos/estela/jugar` con `CanvasGamePlayer`, pero el `id` `estela` **no existe** en `public.games`: la tabla se sembró en SPEC 06 con los 8 juegos de entonces. Mientras falte la fila, GUARDAR PUNTUACIÓN falla (FK de `scores.game_id` y RLS `scores_insert_playable`) y `recordPlay` falla en silencio (RLS `plays_insert_playable`). SPEC 06 dejó todo lo demás listo: activar un juego es dato, no código. A diferencia de CAÍDA y BLOQUE BUSTER (un `update` sobre una fila existente), aquí hace falta un **insert** de la fila nueva.

## Alcance

**Dentro:**

- Migración versionada `supabase/migrations/<timestamp>_estela_game.sql` (nombre `estela_game` en `apply_migration`; `<timestamp>` es la versión `YYYYMMDDHHMMSS` en UTC que registre `apply_migration`, igual que las migraciones existentes), aplicada con `apply_migration`:

  ```sql
  insert into public.games (id, title, cat, playable)
  values ('estela', 'ESTELA', 'VERSUS', true)
  on conflict (id) do update set playable = true;
  ```

  `id`, `title` y `cat` idénticos a la ficha de la SPEC 01 en `lib/games.ts` (`"estela"`, `"ESTELA"`, `"VERSUS"`). El `on conflict` hace la migración idempotente si la fila ya existiera.

- Verificación de RLS como `anon` y verificación en navegador del flujo completo (modal, `plays`, `scores`, `/salon`, detalle, biblioteca).

**Sin cambios** (leen Supabase y se activan solos al existir la fila con `playable = true`):

- `lib/scores.ts`, `lib/scores-client.ts` (`submitScore`, `recordPlay`, `fetchPlayerBest`).
- `/salon` (`HallOfFame`): añade la pestaña ESTELA porque lista los juegos con `playable = true`.
- `/juegos/[id]` (Partidas, Guardadas, Mejor global, MEJORES PUNTUACIONES) y `/biblioteca` (`GameCard`, MEJOR PUNTUACIÓN).
- `CanvasGamePlayer`, `GameOverModal`, `lib/games.ts`, `lib/games/registry.ts`, `lib/games/estela.ts`.

**Fuera de alcance:**

- El juego, la ficha del catálogo y la portada (SPEC 01 de esta carpeta).
- Cambios de esquema, RLS, CHECKs o índices de `games`, `scores` o `plays`.
- Migrar el catálogo visible para que lea de `games` (sigue en `lib/games.ts`, ver SPEC 06).
- Auth, anti-trampas, límites de frecuencia y moderación (ver SPEC 06).
- Tests automatizados (no hay runner).

## Modelo de datos

Sin tablas nuevas, sin columnas nuevas y sin RLS nueva. Único cambio: una fila en `public.games`.

| Columna    | Valor                                                                               |
| ---------- | ----------------------------------------------------------------------------------- |
| `id`       | `'estela'`                                                                          |
| `title`    | `'ESTELA'`                                                                          |
| `cat`      | `'VERSUS'` (permitido por el CHECK `cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')`) |
| `playable` | `true`                                                                              |

- **RLS:** las políticas `scores_insert_playable` y `plays_insert_playable` (SPEC 06) ya permiten INSERT de `anon`/`authenticated` cuando `games.playable = true`; la lectura es pública. No hay grants de UPDATE/DELETE en `scores` ni `plays`, así que siguen sin poder modificarse.
- **Puntuación frente al CHECK `score <= 10000000`** (reglas de la SPEC 01: +1 × ronda por celda avanzada, +200 por rival encerrado, +500 × ronda por ronda ganada, 10 rondas, 3 vidas, arena de 4.560 celdas):
  - Cota teórica: como mucho se juegan 12 rondas (10 ganadas + 2 perdidas, o 9 + 3). Pasos ≤ 4.560 × (1 + 2 + … + 10) + 2 × 4.560 × 10 = 250.800 + 91.200 = 342.000; rondas ganadas ≤ 500 × 55 = 27.500; encerrados ≤ 200 × (26 + 2 × 3) = 6.400. Total ≤ 375.900.
  - Partida perfecta realista (≈ 300 celdas por ronda, 10 rondas, todos los rivales encerrados): 16.500 + 27.500 + 5.200 ≈ 49.200.
  - Ambas quedan muy por debajo de 10.000.000 y de `integer`: no hace falta ampliar el CHECK.
- **Empates:** los puntos por celda dependen del recorrido de cada partida, así que son raros; si ocurren, el ranking ya ordena `score desc, created_at asc` (SPEC 06).

## Plan de implementación

1. Comprobar con `execute_sql` que la fila no existe: `select id, title, cat, playable from public.games where id = 'estela';` → 0 filas. Comprobar también que la SPEC 01 está implementada (`estela` en `REAL_GAMES` y en `GAMES`).
2. Crear `supabase/migrations/<timestamp>_estela_game.sql` con el `insert … on conflict` del alcance y aplicarlo con `apply_migration` (nombre `estela_game`). Verificar: el nombre del fichero usa la misma versión que registró `apply_migration` (`list_migrations`) y su contenido es exactamente el SQL aplicado.
3. Verificar con `execute_sql`: `select id, playable from public.games where playable order by id;` → `bloque-buster`, `caida`, `estela` y `rocas`; el resto (`duelo-pixel`, `gloton`, `invasores`, `ranaria`, `serpentina`) sigue con `playable = false`. `get_advisors` (seguridad) sin avisos nuevos.
4. Verificar RLS como `anon` (clave publicable o `set local role anon` en `execute_sql`): INSERT en `scores` de `estela` con nombre de 1–10 caracteres y puntuación válida funciona; INSERT en `plays` de `estela` funciona; UPDATE y DELETE sobre esas filas no afectan ninguna. Borrar las filas de prueba con `execute_sql` y comprobar que no queda ninguna.
5. Verificar en navegador (Claude in Chrome) en `/juegos/estela/jugar`: terminar una partida (perder las 3 vidas o FIN) abre el modal; GUARDAR PUNTUACIÓN muestra `▸ PUNTUACIÓN GUARDADA_` y crea exactamente una fila en `scores` con `game_id = 'estela'`, la puntuación mostrada y el nombre del campo; cada partida terminada crea exactamente una fila en `plays` y salir a mitad no crea ninguna; JUGAR DE NUEVO sin guardar no crea filas en `scores`.
6. Verificar en navegador: `/salon` muestra la pestaña ESTELA con podio y tabla; `/juegos/estela` muestra Partidas, Guardadas, Mejor global y MEJORES PUNTUACIONES reales; la tarjeta de ESTELA en `/biblioteca` muestra su mejor puntuación real. Con sesión y una puntuación con ese nombre, `/salon` muestra «TU MEJOR MARCA EN ESTELA».
7. Revisión final: `npm run lint` y `npm run build`; consola sin errores de hidratación en `/salon`, `/juegos/estela` y `/juegos/estela/jugar`. Borrar las filas de prueba del paso 5–6 si no deben quedar en producción.

## Criterios de aceptación

- [ ] Existe `supabase/migrations/*_estela_game.sql` con exactamente el `insert into public.games … on conflict (id) do update set playable = true;` de esta spec, y coincide con la migración registrada en el proyecto.
- [ ] `public.games` contiene la fila `('estela', 'ESTELA', 'VERSUS', true)`; `title` y `cat` coinciden con la ficha de `lib/games.ts`.
- [ ] Los juegos con `playable = true` son exactamente `bloque-buster`, `caida`, `estela` y `rocas`.
- [ ] `get_advisors` (seguridad) no reporta avisos nuevos tras la migración.
- [ ] Con la clave publicable, INSERT en `scores` y en `plays` de `estela` funciona; UPDATE y DELETE no modifican ninguna fila; las filas de prueba se han borrado.
- [ ] En `/juegos/estela/jugar`, GUARDAR PUNTUACIÓN crea exactamente una fila en `scores` con `game_id = 'estela'`, la puntuación mostrada y el nombre del campo, y el modal muestra `▸ PUNTUACIÓN GUARDADA_`; si falla, muestra error y permite reintentar.
- [ ] Cada partida de ESTELA terminada crea exactamente una fila en `plays`; salir a mitad o JUGAR DE NUEVO sin guardar no crea filas en `scores`.
- [ ] `/salon` muestra la pestaña ESTELA con podio top 3 y tabla de hasta 12 filas ordenadas por puntuación descendente y, a igual puntuación, por fecha ascendente; sin filas muestra «AÚN NO HAY PUNTUACIONES».
- [ ] `/juegos/estela` muestra Partidas (= filas de `plays`), Guardadas (= filas de `scores`), Mejor global (= `max(score)`, «—» sin datos) y MEJORES PUNTUACIONES reales; `/biblioteca` muestra la mejor puntuación real de ESTELA.
- [ ] No se ha modificado ningún fichero de `lib/`, `app/` ni `components/` en esta spec.
- [ ] ASTEROIDS, CAÍDA y BLOQUE BUSTER siguen guardando y apareciendo en `/salon` igual que antes.
- [ ] `npm run lint` y `npm run build` terminan sin errores.

## Decisiones

- **Sí (decisión del agente):** `insert … on conflict (id) do update set playable = true` en lugar de `update` — la fila `estela` no existe (SPEC 06 solo sembró 8 juegos) y el `on conflict` hace la migración idempotente.
- **Sí (decisión del agente):** nombre de migración `<timestamp>_estela_game.sql` — sigue la convención de esta jam (`<slug>_game`) y distingue el alta de fila de los `*_playable.sql`, que solo activan filas existentes.
- **Sí (decisión del agente):** spec separada de la del juego — permite implementar y probar ESTELA antes de abrir el leaderboard, y la migración es trivial de revisar por sí sola.
- **Sí:** `title` y `cat` copiados de `lib/games.ts`; ese archivo sigue siendo la fuente del catálogo visible (SPEC 06).
- **No:** cambios de RLS, CHECKs o índices — la RLS de `scores`/`plays` ya depende de `playable` y la puntuación máxima (≤ 375.900) cabe holgadamente en el CHECK `score <= 10000000`.
- **No:** tocar `lib/scores.ts`, `lib/scores-client.ts`, `/salon`, el detalle ni la biblioteca — leen Supabase y se activan solos.
- **No (decisión del agente):** sembrar puntuaciones iniciales para ESTELA — el ranking arranca vacío con el estado «AÚN NO HAY PUNTUACIONES», coherente con `best: 0` y `plays: "0"` de la ficha.
- **Sí:** INSERT anónimo con RLS + CHECKs, sin UPDATE/DELETE, igual que el resto de juegos (SPEC 06).

## Riesgos

| Riesgo                                                                                            | Mitigación                                                                                 |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Se aplica esta spec antes que la SPEC 01: aparece la pestaña ESTELA en `/salon` sin juego jugable | Paso 1 comprueba que `estela` está en `REAL_GAMES` y `GAMES` antes de aplicar la migración |
| `title`/`cat` de `games` y de `lib/games.ts` se desincronizan                                     | Criterio de aceptación que los compara; ambos se copian de la ficha de la SPEC 01          |
| La migración se aplica en remoto pero el fichero local difiere o usa otra versión                 | Paso 2: nombre con la versión de `list_migrations` y contenido idéntico al aplicado        |
| Cualquiera puede insertar puntuaciones falsas de ESTELA con la clave publicable                   | Aceptado (SPEC 06); CHECKs y RLS acotan el daño; anti-trampas va con auth                  |
| Filas de prueba de RLS o del navegador quedan en el ranking público                               | Pasos 4 y 7: borrarlas con `execute_sql` y comprobar que no queda ninguna                  |
| Puntuación de ESTELA fuera del CHECK                                                              | Cota teórica ≤ 375.900, muy por debajo de 10.000.000                                       |

## Qué **no** está en esta spec

- El juego, su ficha y su portada (SPEC 01 de esta carpeta).
- Cambios de esquema, RLS o CHECKs; catálogo leído desde `games`.
- Autenticación, anti-trampas, límites de frecuencia o moderación.
- Filtros de periodo, mejor por jugador o paginación del ranking.
- Tests automatizados.
