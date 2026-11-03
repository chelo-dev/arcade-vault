---
name: game-spec
description: Diseña la spec para crear o portar un juego real a Arcade Vault con su leaderboard en Supabase (contrato del juego, reproductor genérico, catálogo, migración playable). Úsalo al añadir un juego nuevo, desde references/resources/started-games/ o desde un diseño propio.
disable-model-invocation: true
argument-hint: 'carpeta de referencia (p. ej. 03-tetris) o descripción del juego'
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*), Bash(wc:*), Bash(grep:*)
---

# /game-spec — Spec para integrar un juego real con su leaderboard

Genera `specs/NN-<slug>-game.md` siguiendo el patrón de `specs/05-asteroids-game.md` (juego + reproductor) y `specs/06-leaderboard-games.md` (Supabase). **Solo escribe la spec; no implementes.** Al terminar, sugiere `/spec-impl specs/NN-<slug>-game.md`.

## Contexto de sesión

Fecha (úsala en la cabecera, nunca la adivines):
!`date +%F`

Specs existentes (el nuevo NN es el siguiente número libre):
!`ls specs/ 2>/dev/null`

Juegos de referencia disponibles:
!`ls references/resources/started-games/ 2>/dev/null`

Catálogo (`id`, título, categoría):
!`grep -nE '^\s+(id|title|cat):' lib/games.ts`

Juegos reales ya integrados (`REAL_GAMES`):
!`cat lib/games/registry.ts`

Migraciones existentes:
!`ls supabase/migrations/`

## Arquitectura que la spec debe reutilizar (no reinventar)

- Contrato en `lib/games/contract.ts`: `CreateGame = (canvas, { onGameOver, onRestart, onStats }) => { restart, setPaused, end, destroy }`.
- El módulo vive en `lib/games/<slug>.ts`, exporta `create<Juego>: CreateGame` y se registra en `lib/games/registry.ts` (`REAL_GAMES[id] = { create, width, height }`).
- `app/juegos/[id]/jugar/page.tsx` ya usa `CanvasGamePlayer` para todo `id` de `REAL_GAMES`; **no** se crea un player por juego.
- `CanvasGamePlayer` ya aporta: marco CRT, `PlayerStats` (Jugador/Puntuación/Vidas/Nivel), PAUSA/FIN/SALIR, `GameOverModal`, `submitScore` (tabla `scores`) y `recordPlay` (tabla `plays`).
- `/salon`, `/juegos/[id]`, `/biblioteca` leen Supabase y se activan solos cuando `games.playable = true`: la spec no los toca.
- Lo único de base de datos por juego: migración que pone `playable = true` (o inserta la fila si el id no existe en `games`). La RLS de `scores` y `plays` ya depende de ese flag.

## Flujo

1. **Origen.** Según `$ARGUMENTS`: carpeta de `started-games/` o juego propio. Si es propio, debe ser original (mecánicas de género sí; nombre, arte, personajes o niveles de un juego existente no).
2. **Analiza la fuente** (si hay referencia): lee `index.html`, `game.js`, CSS, assets y ficheros extra. Anota para la spec:
   - estado global que hay que envolver en la factoría;
   - listeners (`document`/`window`/canvas/ratón/botones DOM) y cómo retirarlos en `destroy`;
   - tamaño del canvas y si es 4:3 (si no, ajuste de `.crt-screen` solo para ese juego);
   - HUD dentro del canvas vs. paneles/overlays DOM (SCORE/LINES/NEXT, overlay de Game Over, botón reiniciar, selector de tema) y qué se elimina porque la app ya lo aporta;
   - punto exacto de Game Over y de reinicio; pausa propia (tecla `P`) a unificar con `setPaused`;
   - `localStorage`, `Audio`, imágenes, módulos extra (`levels.js`) → assets a `public/games/<slug>/` con rutas absolutas; audio solo tras interacción;
   - estadísticas disponibles para `onStats`: si el juego no tiene vidas o nivel, decide con el usuario (p. ej. vidas fijas, líneas como nivel) y, si hace falta, la spec incluye adaptar `PlayerStats`.
3. **Pregunta con AskUserQuestion solo lo no deducible**: ficha del catálogo (sustituir una simulada conservando su `id`, como `rocas`, o ficha nueva con portada); mapeo de estadísticas; qué hacer con HUD/overlays/tema del original; ajuste de canvas no 4:3.
4. **Escribe la spec** con `.claude/skills/game-spec/template.md`, sección a sección, rellenando todos los `{…}`. Mantén jugabilidad, constantes y gráficos del original intactos (fuera de alcance: cambios de balance, sonido nuevo, táctil). Cualquier UI nueva usa la skill `/frontend-design` (CLAUDE.md).
5. Pide revisión y termina sugiriendo `/spec-impl`.

## Reglas de calidad

- Español, mismo tono y estructura que SPEC 05/06; criterios de aceptación como casillas `- [ ]`, estado `Pendiente`.
- Una decisión = una línea con **Sí/No** y su porqué. Riesgos en tabla con mitigación.
- No dupliques lo que ya está en SPEC 05/06: referencia («ver SPEC 05») y detalla solo lo específico del juego.
