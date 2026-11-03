# SPEC 06 — Leaderboard y tabla de juegos en Supabase

> **Estado:** Implemantado
> **Depende de:** SPEC 01, SPEC 04, SPEC 05
> **Fecha:** 2026-11-03
> **Objetivo:** Crear en Supabase las tablas `games` y `scores`, guardar ahí las puntuaciones de Asteroids al pulsar GUARDAR PUNTUACIÓN y hacer que `/salon` muestre el top 12 real de cada juego jugable en lugar de datos sembrados.

## Por qué existe esta spec

SPEC 04 dejó la conexión a Supabase lista con la base vacía, y SPEC 05 dejó Asteroids como único juego real, guardando en `localStorage` (`av_scores`) sin que nadie lo lea. Esta spec es el primer uso real de la base: un ranking compartido entre jugadores. Se hace **sin autenticación** (el login sigue siendo mock): el jugador se identifica solo por el nombre de texto que ya escribe en el modal.

## Alcance

**Dentro:**

- Migración versionada en `supabase/migrations/` que crea:
  - Tabla `public.games` (catálogo mínimo) con los 8 juegos de `lib/games.ts` sembrados; solo `rocas` con `playable = true`.
  - Tabla `public.scores` con FK a `games`, CHECKs de validación e índice `(game_id, score desc, created_at)`.
  - RLS en ambas tablas (ver «Modelo de datos»).
- `lib/scores.ts` con los tipos y las funciones de acceso: leer el top de un juego, leer la mejor marca de un jugador con su rango e insertar una puntuación.
- `AsteroidsPlayer`: GUARDAR PUNTUACIÓN inserta en `scores` con el cliente de navegador. Estados del modal: guardando (botón deshabilitado), guardado (`▸ PUNTUACIÓN GUARDADA_`) y error (mensaje y posibilidad de reintentar). `GameOverModal` admite esos dos estados nuevos sin cambiar su aspecto actual.
- `/salon`:
  - Componente de servidor que carga desde Supabase los juegos con `playable = true` y el top 12 de cada uno, dentro de `<Suspense>`.
  - `HallOfFame` recibe esos datos por props; pestañas solo de juegos jugables (hoy solo ASTEROIDS), podio top 3 y tabla de 12 con el diseño actual.
  - Estado vacío «AÚN NO HAY PUNTUACIONES» cuando el juego no tiene filas.
  - Fila «TU MEJOR MARCA EN {juego}»: se muestra solo si hay sesión y existe al menos una puntuación con el `user.name`; rango = filas con mayor puntuación + 1. Se consulta desde el cliente tras montar.
- Se retira `seededScores` de `components/hall-of-fame.tsx` (la función sigue en `lib/games.ts` porque la home la usa).
- **Detalle `/juegos/[id]` con estadísticas reales (ampliación):**
  - Tabla `public.plays` (una fila por partida terminada) con RLS análoga a `scores`. `AsteroidsPlayer` registra una fila al terminar cada partida, se guarde o no la puntuación.
  - `lib/scores.ts`: `fetchGameStats(gameId)` → `{ plays, saved, best }`, para cualquier juego.
  - El detalle sustituye los valores sembrados por datos reales: «Partidas» (partidas jugadas = filas de `plays`), «Guardadas» (puntuaciones guardadas = filas de `scores`), «Mejor global» (`max(score)`, «—» si no hay) y el bloque «MEJORES PUNTUACIONES» (top 10 con `fetchTopScores`, estado vacío «AÚN NO HAY PUNTUACIONES»).
  - La biblioteca (`/biblioteca`, `GameCard`) muestra «MEJOR PUNTUACIÓN» real por juego con `fetchBestScores()` («—» si no hay).
  - Los 7 juegos simulados muestran el estado vacío real (0, 0, «—» y ranking vacío): no tienen datos en Supabase.

**Fuera de alcance (specs futuras):**

- Supabase Auth, `profiles`, `scores.user_id` y RLS por usuario.
- Medidas anti-trampas: servidor autoritativo, firma de puntuaciones, límite de frecuencia, validación de la partida.
- Migrar el catálogo (`biblioteca`, detalle, home) para que lea de `games`: siguen leyendo `lib/games.ts`.
- Los 7 juegos simulados: `GamePlayer` sigue guardando en `av_scores` (localStorage) y no aparecen en el salón.
- Actividad/top de la home y textos de marketing de `lib/home.ts`: siguen con datos sembrados. (El detalle `/juegos/[id]` ya **no** está fuera de alcance.)
- Registrar partidas de los 7 juegos simulados: `GamePlayer` no escribe en `plays`.
- Filtros de periodo (hoy/semana/histórico), «mejor puntuación por jugador» o paginación del ranking.
- Migrar o subir a Supabase las puntuaciones que ya estén en `av_scores`.
- Panel de administración, borrado o moderación de puntuaciones.
- Tipos TypeScript generados desde la base y stack local con Docker.
- Tests automatizados (no hay runner configurado).

## Modelo de datos

```sql
-- supabase/migrations/<timestamp>_games_and_scores.sql
create table public.games (
  id       text primary key,                                        -- mismo id que lib/games.ts ("rocas", ...)
  title    text not null,
  cat      text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  playable boolean not null default false                           -- true = guarda puntuaciones reales
);

create table public.scores (
  id          uuid primary key default gen_random_uuid(),
  game_id     text not null references public.games(id),
  player_name text not null check (char_length(player_name) between 1 and 10),
  score       integer not null check (score >= 0 and score <= 10000000),
  created_at  timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc, created_at);
```

Ampliación (migración `supabase/migrations/<timestamp>_plays.sql`):

```sql
create table public.plays (
  id         uuid primary key default gen_random_uuid(),
  game_id    text not null references public.games(id),
  created_at timestamptz not null default now()
);
create index plays_game_idx on public.plays (game_id);
```

`plays`: RLS activado; SELECT para `anon`/`authenticated` (todas las filas); INSERT para `anon`/`authenticated` solo si el juego tiene `playable = true`; sin UPDATE/DELETE. Grants: `select, insert`.

Políticas RLS (`games` y `scores`, ambas con RLS activado):

| Tabla    | Operación     | Roles                   | Regla                                                               |
| -------- | ------------- | ----------------------- | ------------------------------------------------------------------- |
| `games`  | SELECT        | `anon`, `authenticated` | Todas las filas.                                                    |
| `scores` | SELECT        | `anon`, `authenticated` | Todas las filas.                                                    |
| `scores` | INSERT        | `anon`, `authenticated` | `game_id` pertenece a un juego con `playable = true`.               |
| `scores` | UPDATE/DELETE | —                       | Sin política: nadie puede modificar ni borrar desde la API pública. |

Contratos de `lib/scores.ts`:

```ts
export type ScoreEntry = {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
};
export type PlayerBest = { score: number; rank: number; created_at: string };

// Servidor (cliente de lib/supabase/server.ts)
export async function fetchTopScores(
  gameId: string,
  limit = 12,
): Promise<ScoreEntry[]>;
export async function fetchPlayableGames(): Promise<
  { id: string; title: string }[]
>;
export async function fetchBestScores(): Promise<Record<string, number>>; // mejor por juego jugable
export type GameStats = { plays: number; saved: number; best: number | null };
export async function fetchGameStats(gameId: string): Promise<GameStats>;

// Navegador (cliente de lib/supabase/client.ts)
export async function submitScore(input: {
  gameId: string;
  playerName: string;
  score: number;
}): Promise<void>; // lanza Error si falla
export async function fetchPlayerBest(
  gameId: string,
  playerName: string,
): Promise<PlayerBest | null>;
export async function recordPlay(gameId: string): Promise<void>; // fallo silencioso: no interrumpe la partida
```

> Implementación: por el límite servidor/cliente de Next (`next/headers`), las funciones de navegador viven en `lib/scores-client.ts` y los tipos y funciones de servidor en `lib/scores.ts`.

Convenciones:

- Orden del ranking: `score desc, created_at asc` (a igual puntuación, gana la más antigua).
- `player_name` se guarda tal cual lo deja el modal (mayúsculas, 1–10 caracteres, `INVITADO` si está vacío). No es una identidad: dos jugadores pueden usar el mismo nombre.
- Fechas: la base guarda `timestamptz`; la UI las muestra como `dd/mm/aaaa` en UTC.
- La clave `service_role` no se usa; todo pasa por la clave publicable y RLS.
- Los `id` de `games` se copian de `lib/games.ts`; ese archivo sigue siendo la fuente del catálogo visible.

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/01-app` lo relativo a Server Components con `<Suspense>` bajo `cacheComponents` y a obtención de datos; consultar con `search_docs` la guía vigente de RLS y `@supabase/ssr`. Fijar convenciones antes de codificar.
2. Escribir la migración `supabase/migrations/<timestamp>_games_and_scores.sql` (tablas, índice, RLS, siembra de los 8 juegos con `rocas` jugable) y aplicarla con `apply_migration`. Verificar con `execute_sql`: 8 filas en `games`, 1 con `playable`; y `get_advisors` de seguridad sin avisos de RLS para estas tablas.
3. Verificar la RLS con la clave publicable (`as anon`): insertar una puntuación en `rocas` funciona; en un juego no jugable, con `score < 0`, con nombre vacío o de 11 caracteres falla; `update` y `delete` no afectan filas. Borrar las filas de prueba con `execute_sql`.
4. Crear `lib/scores.ts` con las cuatro funciones. Verificar: `npm run lint` y tipos pasan; ningún archivo lo importa todavía.
5. Conectar `AsteroidsPlayer` a `submitScore` y añadir a `GameOverModal` las props opcionales `saving` y `error` (por defecto inactivas, así `GamePlayer` no cambia). Verificar en navegador: perder una partida, guardar y ver la fila en `scores` con `execute_sql`; con la red cortada aparece el error y el botón permite reintentar.
6. Crear el componente de servidor de `/salon` (carga de juegos jugables y top 12 en paralelo dentro de `<Suspense>`) y cambiar `HallOfFame` para recibir los datos por props, mostrar el estado vacío y quitar `seededScores`. Verificar: `/salon` muestra la partida guardada en el podio y la tabla, con formato `dd/mm/aaaa`.
7. Añadir la fila «TU MEJOR MARCA» en `HallOfFame` con `fetchPlayerBest` (efecto tras montar, solo con sesión). Verificar: con sesión y una puntuación aparece con rango correcto; sin sesión o sin puntuaciones no aparece.
8. **(Ampliación)** Migración `plays` (tabla, índice, RLS, grants) aplicada con `apply_migration` y versionada en `supabase/migrations/`. Verificar como `anon`: insertar en `rocas` funciona, en un juego no jugable falla, `update`/`delete` no afectan filas. Limpiar filas de prueba.
9. **(Ampliación)** `fetchGameStats` en `lib/scores.ts` y `recordPlay` en `lib/scores-client.ts`; `AsteroidsPlayer` llama a `recordPlay` una vez por partida terminada (en `onGameOver`). Verificar: tipos y lint; una partida terminada crea exactamente una fila en `plays`.
10. **(Ampliación)** `app/juegos/[id]/page.tsx` lee `fetchGameStats` y `fetchTopScores(id, 10)` y muestra Partidas, Guardadas, Mejor global y MEJORES PUNTUACIONES reales (estado vacío para juegos sin datos). Verificar con filas de prueba en `rocas` y con un juego simulado.
11. **(Ampliación)** `app/biblioteca/page.tsx` carga `fetchBestScores()` dentro de `<Suspense>` y pasa `bests` a `Library` → `GameCard`, que muestra la marca real (`…` cargando, `—` sin puntuaciones). Verificar: Asteroids muestra su `max(score)` y los otros 7 «—».

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] Existe `supabase/migrations/*_games_and_scores.sql` versionada y su contenido coincide con el esquema aplicado en el proyecto.
- [x] `games` contiene los 8 ids de `lib/games.ts` y solo `rocas` tiene `playable = true`.
- [x] `get_advisors` (seguridad) no reporta tablas sin RLS en `games` ni `scores`.
- [x] Con la clave publicable, un INSERT en `scores` de `rocas` con nombre de 1–10 caracteres y `0 <= score <= 10000000` funciona.
- [x] Con la clave publicable, un INSERT en un juego con `playable = false`, con `score` negativo o mayor que 10.000.000, o con nombre vacío o de más de 10 caracteres es rechazado.
- [x] Con la clave publicable, UPDATE y DELETE sobre `scores` no modifican ninguna fila.
- [x] En `/juegos/rocas/jugar`, al perder y pulsar GUARDAR PUNTUACIÓN se crea exactamente una fila en `scores` con `game_id = 'rocas'`, la puntuación mostrada y el nombre del campo.
- [x] Mientras se guarda, el botón GUARDAR PUNTUACIÓN está deshabilitado; al terminar el modal muestra `▸ PUNTUACIÓN GUARDADA_`.
- [x] Si el guardado falla, el modal muestra un mensaje de error y el botón sigue disponible para reintentar; no aparece `▸ PUNTUACIÓN GUARDADA_`.
- [x] Salir de la partida o pulsar JUGAR DE NUEVO sin guardar no crea ninguna fila.
- [x] Asteroids ya no escribe en `localStorage.av_scores`; `GamePlayer` (los otros 7 juegos) sigue escribiendo ahí y se ve y funciona igual.
- [x] `/salon` muestra una única pestaña, ASTEROIDS, con podio top 3 y tabla de hasta 12 filas ordenadas por puntuación descendente y, a igual puntuación, por fecha ascendente.
- [x] Con `scores` vacío para `rocas`, `/salon` muestra «AÚN NO HAY PUNTUACIONES» sin errores.
- [x] Una puntuación guardada en una pestaña aparece en `/salon` al navegar allí sin recargar a mano.
- [x] Con sesión y al menos una puntuación con ese nombre, `/salon` muestra «TU MEJOR MARCA EN ASTEROIDS» con su mejor puntuación y su rango; sin sesión o sin puntuaciones esa fila no aparece.
- [x] `components/hall-of-fame.tsx` ya no importa `seededScores`; la home sigue mostrando sus datos sembrados.
- [x] Existe `supabase/migrations/*_plays.sql` y coincide con el esquema aplicado; con la clave publicable, INSERT en `plays` de `rocas` funciona, en un juego no jugable es rechazado y UPDATE/DELETE no afectan filas.
- [x] Cada partida de Asteroids que termina (se guarde o no la puntuación) crea exactamente una fila en `plays`; `GamePlayer` no escribe en `plays`.
- [x] En `/juegos/rocas`, «Partidas» = filas de `plays`, «Guardadas» = filas de `scores` y «Mejor global» = `max(score)`; «MEJORES PUNTUACIONES» muestra el top 10 real con fecha `dd/mm/aaaa`, ordenado igual que `/salon`.
- [x] En `/juegos/[id]` de un juego simulado se muestra Partidas 0, Guardadas 0, Mejor global «—» y «AÚN NO HAY PUNTUACIONES», sin errores.
- [x] En `/biblioteca`, la tarjeta de Asteroids muestra su `max(score)` real y las de los 7 simulados «—»; `GameCard` ya no usa `game.best`.
- [x] `/juegos/[id]` ya no usa `seededScores` ni `game.plays`/`game.best`.
- [x] No hay errores de hidratación en la consola en `/salon` ni en `/juegos/rocas/jugar`.
- [x] Ninguna clave `service_role` ni contraseña de Postgres aparece en el código.

## Decisiones

- **Sí:** «tabla de juegos» = tabla `games` en Supabase, elegida por el usuario. Es la FK de `scores` y base del catálogo futuro, pero el catálogo visible sigue en `lib/games.ts` para no tocar 5+ pantallas en esta spec.
- **No:** que biblioteca, detalle y home lean de `games` ahora. Va en una spec propia; aquí solo se crea y siembra la tabla.
- **Sí:** `games` mínima (`id`, `title`, `cat`, `playable`). Sin portadas, colores ni textos hasta que el catálogo migre; evita duplicar contenido que hoy vive en código.
- **Sí:** columna `playable` para decidir qué juegos aparecen en el salón y pueden recibir puntuaciones. Es dato, no código: activar un juego nuevo es un UPDATE, y la RLS de INSERT lo respeta.
- **Sí:** jugador identificado solo por nombre de texto, sin auth. Decisión del usuario; mantiene la spec pequeña y coherente con SPEC 04, que dejó auth fuera.
- **No:** `user_id`, `profiles` ni RLS por usuario. Van con Supabase Auth.
- **Sí:** INSERT anónimo con RLS + CHECKs, y sin UPDATE/DELETE. Es el mínimo seguro sin auth; se asume que un cliente manipulado puede falsear puntuaciones válidas.
- **No:** Server Action para insertar. Sin auth no añade protección real (cualquiera puede llamarla) y añade código; se revisa al introducir auth.
- **Sí:** inserción desde el cliente de navegador con `submitScore`. El modal ya vive en un componente cliente.
- **Sí:** `/salon` reemplaza los datos sembrados por Supabase y solo muestra juegos jugables. Decisión del usuario: no se muestran pestañas vacías de los 7 simulados.
- **Sí:** los 7 juegos simulados siguen con `av_scores`. No se migra `GamePlayer`; se hará juego a juego cuando sean reales.
- **No:** migrar o subir `av_scores` existentes. Son datos locales de pruebas de un solo navegador.
- **Sí:** top 12 histórico con podio, una fila por partida. Mantiene el diseño actual; filtros de periodo y «mejor por jugador» quedan fuera (un nombre libre no es identidad fiable).
- **Sí:** «TU MEJOR MARCA» por nombre de sesión. Sustituye al valor inventado actual; puede coincidir con el nombre de otra persona, y se acepta mientras no haya auth.
- **Sí:** tope de puntuación `10000000` en un CHECK. Es una cota de cordura, no balance de juego; se ajusta con una migración si Asteroids lo supera.
- **Sí (ampliación, decisión del usuario):** el detalle de juego muestra estadísticas reales y se incluye en esta spec. «Partidas» cuenta partidas jugadas reales (tabla `plays`) y además se muestra «Guardadas» (puntuaciones en `scores`), porque no son lo mismo: una partida abandonada sin guardar cuenta como jugada pero no como guardada.
- **Sí:** los 7 simulados muestran estado vacío real en el detalle (0 / — / sin ranking) en vez de datos inventados; no se registran sus partidas hasta que sean reales.
- **Sí:** `plays` se inserta desde el navegador con RLS, igual que `scores`; el contador es inflable por un cliente manipulado (mismo riesgo aceptado que las puntuaciones).
- **Sí:** a igual puntuación gana la fila más antigua (`created_at asc`), para que el orden sea estable y no premie al último en llegar.

## Riesgos

| Riesgo                                                                                          | Mitigación                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Cualquiera puede insertar puntuaciones falsas con la clave publicable                           | Aceptado y documentado; los CHECKs y la RLS acotan el daño (rango, juego jugable, sin UPDATE/DELETE). Anti-trampas va con auth. |
| Spam o relleno masivo de `scores`                                                               | Sin límite de frecuencia en esta spec; se puede borrar con `execute_sql` y queda para la spec de auth/servidor.                 |
| Nombres ofensivos en el ranking público                                                         | Sin moderación en esta spec; el nombre es texto libre de 10 caracteres. Se limpia a mano si ocurre.                             |
| Leer `scores` en un Server Component bajo `cacheComponents` rompe el build o sirve datos viejos | Paso 1; la carga va dentro de `<Suspense>` y se verifica que una puntuación nueva aparece en `/salon` sin recarga manual.       |
| Fallo de red o de Supabase al guardar o al cargar el ranking                                    | El modal muestra error con reintento; `/salon` muestra un mensaje en lugar de romper la página.                                 |
| El catálogo en código y la tabla `games` se desincronizan                                       | Aceptado de forma temporal: los ids se copian en la migración y la migración del catálogo se hará en una spec propia.           |
| La migración se aplica en remoto pero el archivo local difiere                                  | Paso 2 y criterio de aceptación: el SQL versionado es exactamente el aplicado.                                                  |

## Qué **no** está en esta spec

- Autenticación, perfiles ni identidad real de jugadores.
- Protección real contra puntuaciones falsas, moderación o límites de frecuencia.
- Catálogo, detalle de juego o home leyendo desde `games`.
- Migrar `GamePlayer` y los otros 7 juegos a puntuaciones reales.
- Filtros de periodo, mejor por jugador o paginación del ranking.
- Migración de `av_scores` a Supabase.
- Tipos generados, stack local con Docker.
- Tests automatizados.
