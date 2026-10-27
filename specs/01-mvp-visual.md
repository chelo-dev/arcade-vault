# SPEC 01 — MVP visual de Arcade Vault

> **Estado:** Implementado
> **Depende de:** ninguna
> **Fecha:** 2026-10-26
> **Objetivo:** Portar a Next.js las 5 pantallas de `references/resources/templates/` (biblioteca, detalle, reproductor, salón de la fama, auth) como MVP solo visual, sin lógica de juego real.

## Por qué existe esta spec

El repo es un scaffold sin tocar. Las plantillas son un prototipo React por CDN (Babel, estado en hash, globals en `window`). Esta spec lo traduce a App Router con rutas reales y TypeScript, y fija la base visual sobre la que se construirán los juegos en specs posteriores.

## Alcance

**Dentro:**

- Marca **Arcade Vault** (no "Arcade Bot"; era un typo del pedido).
- Port de `styles.css` (tokens, nav, tarjetas, CRT, modal, auth, responsive) a `app/globals.css`, conviviendo con `@import "tailwindcss"`.
- Datos mock tipados en `lib/games.ts`: `GAMES`, `CATS`, `seededScores` (de `data.jsx`).
- Pantallas como rutas reales:
  - `/` — Biblioteca: hero, buscador, chips de categoría, grilla con tilt en hover, estado vacío.
  - `/juegos/[id]` — Detalle: portada, info, tabla de top scores simulada.
  - `/juegos/[id]/jugar` — Reproductor: HUD, marco CRT, pausa, modal de fin de juego con guardado de puntuación. Score simulado con `setInterval`, arena decorativa.
  - `/salon` — Salón de la Fama.
  - `/auth` — Iniciar sesión / crear cuenta / invitado (botones Google y GitHub solo visuales).
- Nav (con menú móvil y contador de créditos fijo "03") y footer compartidos en `app/layout.tsx`.
- Sesión mock: usuario en `localStorage` (`av_user`) y puntuaciones en `av_scores`, expuestos vía un contexto cliente.
- Metadata real del sitio (título, descripción) en lugar de la plantilla de Create Next App.

**Fuera de alcance (specs futuras):**

- Cualquier juego jugable (lógica, canvas, input).
- Backend, base de datos, autenticación real, OAuth real, validación de credenciales.
- Ranking real: el Salón y los top scores usan datos sembrados; `av_scores` se escribe pero no alimenta los rankings.
- Sistema de créditos real.
- Tests automatizados (no hay runner configurado).

## Modelo de datos

Estructuras mock, portadas de `data.jsx`:

```ts
// lib/games.ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type Game = {
  id: string;            // slug, p. ej. "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;         // clase CSS "cover-*"
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;         // "12.4K"
};
export type ScoreRow = { rank: number; name: string; score: number; date: string };

// lib/session.tsx (cliente)
export type User = { name: string };  // máx. 10 chars, mayúsculas
// localStorage: "av_user" -> User | null ; "av_scores" -> { game, score, name, at }[]
```

Convenciones: los 8 juegos y 18 jugadores de `data.jsx` se copian tal cual; números con `toLocaleString("es-ES")`.

## Plan de implementación

1. Leer la guía relevante en `node_modules/next/dist/docs/01-app` (layout, rutas dinámicas, `cacheComponents`, client components) y fijar convenciones antes de escribir código.
2. Portar `styles.css` a `app/globals.css` y alinear fuentes en `app/layout.tsx` con las de `Arcade Vault.html`. Verificar: `npm run dev` carga sin errores y el fondo/tipografía coinciden.
3. Crear `lib/games.ts` con tipos y datos. Verificar: `npm run lint` pasa.
4. Crear `lib/session.tsx` (contexto cliente: `user`, `login`, `signOut`, `saveScore`; lectura de `localStorage` en `useEffect` para evitar mismatch de hidratación).
5. Crear `components/nav.tsx` y footer; montarlos en `app/layout.tsx` con el provider y metadata propia. Verificar: nav visible en todas las rutas, menú móvil abre/cierra.
6. Crear `components/game-card.tsx` y `components/library.tsx`; `app/page.tsx` renderiza la biblioteca. Verificar: búsqueda y chips filtran, estado vacío aparece.
7. Crear `app/juegos/[id]/page.tsx` con `generateStaticParams` y `notFound()` para ids inexistentes. Verificar: clic en tarjeta navega.
8. Crear `app/auth/page.tsx` y `components/auth-form.tsx`. Verificar: login guarda usuario, nav muestra nombre, cerrar sesión lo borra, invitado funciona.
9. Crear `app/juegos/[id]/jugar/page.tsx` y `components/game-player.tsx` (HUD, CRT, pausa, modal, guardar puntuación). Verificar: score sube, pausa lo detiene, FIN abre modal, guardar escribe en `av_scores`.
10. Crear `app/salon/page.tsx`. Verificar: nav marca "Salón de la Fama" activo.
11. Revisión visual contra `Arcade Vault.html` en escritorio y móvil.

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] Existen las rutas `/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/salon` y `/auth`; ninguna muestra contenido de Create Next App.
- [x] La biblioteca muestra los 8 juegos; escribir "caí" deja solo CAÍDA; elegir VERSUS deja solo DUELO PIXEL.
- [x] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [x] `/juegos/no-existe` devuelve 404.
- [x] Desde el detalle, "jugar" lleva a `/juegos/[id]/jugar` y SALIR vuelve al detalle.
- [x] En el reproductor, PAUSA detiene el score y REANUDAR lo reanuda; FIN abre el modal "FIN DEL JUEGO".
- [x] Guardar puntuación crea una entrada en `localStorage["av_scores"]` y muestra "PUNTUACIÓN GUARDADA".
- [x] Iniciar sesión con usuario "px_kai" muestra "PX_KAI" en el nav; recargar la página lo conserva; cerrar sesión lo elimina.
- [x] "Jugar como invitado" vuelve a la biblioteca sin usuario.
- [x] El nav resalta Biblioteca en `/`, detalle y reproductor, y Salón de la Fama en `/salon`.
- [x] A 375 px de ancho no hay scroll horizontal y aparece el botón hamburguesa con panel lateral.
- [x] No hay errores de hidratación en la consola del navegador en ninguna ruta.

## Decisiones

- **Sí:** nombre Arcade Vault. Coincide con repo, CLAUDE.md y plantillas.
- **Sí:** rutas reales de App Router. URLs compartibles y encaje con el framework.
- **No:** SPA con estado en hash como `app.jsx`. Va contra el App Router.
- **Sí:** reproductor con score simulado como la plantilla, para validar HUD, pausa y modal.
- **No:** lógica de juego real. Cada juego tendrá su spec.
- **Sí:** auth mock con `localStorage` y datos de `data.jsx` en un módulo TS tipado. Sin backend.
- **No:** validar credenciales ni OAuth. Fuera del MVP visual.
- **Sí:** estilos portados casi literales a `globals.css`. Minimiza desvío visual respecto al diseño aprobado.
- **No:** reescribir estilos en utilidades Tailwind. Costo alto, riesgo de regresión visual.
- **Sí:** server components por defecto; `"use client"` solo en nav, filtros, tilt, auth, reproductor y contexto de sesión.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Next 16 con `cacheComponents` y `partialPrefetching` difiere de lo conocido | Paso 1: leer docs en `node_modules/next/dist/docs/` antes de codificar. |
| Desajuste de hidratación al leer `localStorage` | Leerlo en `useEffect`; render inicial como invitado. |
| `seededScores` y score aleatorio generan contenido no determinista | `seededScores` es determinista por semilla; el score aleatorio del reproductor solo corre en cliente tras montar. |
| Choque entre reset de Tailwind y estilos portados | Revisar visualmente contra `Arcade Vault.html` en el paso 11. |

## Qué **no** está en esta spec

- Ningún juego jugable.
- Backend, auth real, OAuth, ranking real.
- Sistema de créditos real.
- Tests automatizados.
