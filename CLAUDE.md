# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Arcade Vault: portal retro para jugar arcades en el navegador y competir por puntos en un leaderboard (Supabase). Interfaz en español. Se desarrolla con Spec Driven Design: cada feature tiene su spec en `specs/NN-slug.md` (`/spec` para redactar, `/spec-impl` para implementar; skills de `Klerith/fernando-skills`). `specs/.spec-config.yml` → `AutoCreateBranch: true` (`/spec-impl` crea la rama `spec-NN-slug`).

Specs: 01 MVP visual, 02 home `/games`, 03 about + contacto, 04 conexión Supabase, 05 Asteroids, 06 leaderboard, 07 Tetris (CAÍDA), 08 Arkanoid (BLOQUE BUSTER). Al terminar una spec se actualiza su línea `> **Estado:**` a `Implementado`.

## Comandos

```bash
npm run dev     # next dev
npm run build   # next build
npm run start   # next start
npm run lint    # eslint (flat config, next/core-web-vitals + next/typescript)
npm run format  # prettier --write .
```

No hay test runner configurado. El hook `PostToolUse` (`.claude/hooks/format.sh`) ejecuta Prettier (y `eslint --fix` en código) sobre cada archivo escrito.

## Next.js no estándar

Next 16.4.3 + React 19.3. `AGENTS.md` exige leer la guía relevante en `node_modules/next/dist/docs/` antes de escribir código: las APIs y convenciones difieren de lo conocido. Ese bloque lo regenera `next dev`.

`next.config.ts`:

- `cacheComponents: true` y `partialPrefetching: true`: el acceso a datos dinámicos (`params`, cookies, Supabase) va dentro de un componente envuelto en `<Suspense>` (ver `app/juegos/[id]/jugar/page.tsx`).
- `experimental.agentFeedback: true`, `allowedDevOrigins: ["192.168.1.90"]`.
- Redirección temporal `/` → `/games` (no hay `app/page.tsx`).
- Tailwind v4 se carga vía regla de Turbopack (`@tailwindcss/turbopack` para `*.css`), no vía PostCSS.
- Tipos globales generados sin import: `LayoutProps<"/">`, `PageProps<"/ruta/[id]">`.

## Arquitectura

- Solo App Router. Alias `@/*` → raíz del repo.
- Rutas: `/games` (home), `/biblioteca`, `/juegos/[id]` (detalle + top 10), `/juegos/[id]/jugar`, `/salon` (salón de la fama), `/auth`, `/about` (form de contacto con Server Action `app/about/actions.ts` → Resend en `lib/email.ts`, con honeypot y validación).
- Estilos: `app/globals.css` (tema retro CRT, clases propias + tokens `@theme inline` expuestos como utilidades Tailwind: `bg-bg-2`, `text-cyan`, `font-pixel`…). Fuentes Press Start 2P, JetBrains Mono y Courier Prime vía `next/font/google`.
- Sesión: `lib/session.tsx` (`SessionProvider`/`useSession`) es solo un nombre de jugador en `localStorage` (`av_user`), sin autenticación real. Se lee tras montar para evitar mismatch de hidratación.
- Catálogo: `lib/games.ts` (`GAMES`, datos estáticos de fichas); `lib/home.ts` contiene datos de la home.

### Juegos

- Contrato en `lib/games/contract.ts`: `CreateGame = (canvas, { onGameOver, onRestart, onStats }) => { restart, setPaused, end, destroy }`.
- Cada juego real es un módulo `lib/games/<slug>.ts` registrado en `lib/games/registry.ts` (`REAL_GAMES[id] = { create, width, height }`): `rocas` (Asteroids), `caida` (Tetris, 460×600), `bloque-buster` (Arkanoid). Assets en `public/games/<slug>/` con rutas absolutas.
- `/juegos/[id]/jugar` usa `CanvasGamePlayer` (genérico: marco CRT, `PlayerStats`, pausa/fin, `GameOverModal`, guardar puntuación) para los ids de `REAL_GAMES`; el resto usa `GamePlayer` con score simulado. No se crea un player por juego.
- Originales a portar en `references/resources/started-games/`; plantillas de diseño en `references/resources/templates/`.
- Para añadir un juego: skill de proyecto `/game-spec` (`.claude/skills/game-spec/`) genera la spec y luego `/spec-impl`.

### Supabase

- Clientes en `lib/supabase/{server,client}.ts` (`@supabase/ssr`, clave publicable; servidor crea un cliente por petición). Lecturas de servidor en `lib/scores.ts`; escrituras desde navegador en `lib/scores-client.ts` (`submitScore`, `recordPlay`, `fetchPlayerBest`).
- Tablas (`supabase/migrations/`): `games` (`id`, `title`, `cat`, `playable`), `scores` (`player_name` 1–10 chars, ranking `score desc, created_at asc`), `plays`. RLS: lectura pública; inserción en `scores`/`plays` solo si `games.playable = true`.
- Activar un juego = migración que pone `playable = true`; `/salon`, `/biblioteca` y `/juegos/[id]` lo recogen solos.
- MCP de Supabase configurado en `.mcp.json`.
- Variables de entorno (`.env.example` → `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (opcional).

## Convenciones

- Usa la skill `/frontend-design` para la interfaz de usuario.
- Formato Prettier: 2 espacios, comillas dobles, punto y coma.
- Commits en español con prefijo convencional (`feat:`…); trabajo en ramas y PR (`.github/pull_request_template.md`).
