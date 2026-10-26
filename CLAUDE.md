# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Arcade Vault: plataforma para jugar online y competir por puntos. Estado actual: scaffold de Create Next App sin modificar (`app/page.tsx` y metadata del layout siguen siendo los de la plantilla). El README indica que el proyecto sigue Spec Driven Design (`/spec` y `/spec-impl`) con las skills de `Klerith/fernando-skills` (`npx skills@latest add Klerith/fernando-skills`).

## Comandos

```bash
npm run dev     # next dev
npm run build   # next build
npm run start   # next start
npm run lint    # eslint (flat config, next/core-web-vitals + next/typescript)
```

No hay test runner configurado.

## Next.js no estándar

Next 16.4.3 + React 19.3. `AGENTS.md` exige leer la guía relevante en `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`) antes de escribir código: las APIs y convenciones difieren de lo conocido. Ese bloque lo regenera `next dev`.

`next.config.ts` activa flags experimentales que cambian el modelo de render/caché:
- `cacheComponents: true` y `partialPrefetching: true`
- `experimental.agentFeedback: true`
- Tailwind v4 se carga vía regla de Turbopack (`@tailwindcss/turbopack` para `*.css`), no vía PostCSS.

## Arquitectura

- Solo App Router (`app/`). Alias de imports `@/*` apunta a la raíz del repo.
- `app/layout.tsx` usa el tipo global `LayoutProps<"/">` (helper de tipos generado por Next; sin import) y fuentes Geist vía `next/font/google`.
- Estilos: Tailwind v4 con `@import "tailwindcss"` y tokens de tema en `app/globals.css` (`@theme inline`, modo oscuro por `prefers-color-scheme`).
