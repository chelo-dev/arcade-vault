# SPEC 02 — Home (Inicio) en `/games`

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-26
> **Objetivo:** Portar a Next.js el home (landing) de `references/resources/templates/home-about/` exactamente igual que la plantilla, servido en `/games`, con la biblioteca movida a `/biblioteca`.

## Por qué existe esta spec

La plantilla `home-about` agrega una landing ("Inicio") que SPEC 01 no cubrió. Hoy `/` es la biblioteca. Esta spec introduce el home como página de entrada (`/` redirige a `/games`) y desplaza la biblioteca a su propia ruta, como en la plantilla, donde Inicio y Biblioteca son pantallas distintas.

## Alcance

**Dentro:**

- Ruta `/games`: home con las secciones de `home.jsx`, en este orden:
  - Hero: eyebrow "INSERTA UNA MONEDA", título de 3 líneas, subtítulo, CTAs "EXPLORAR JUEGOS" y "CREAR CUENTA", indicador "DESLIZA", 8 siluetas pixel flotantes.
  - `// 01` ¿POR QUÉ ARCADE VAULT?: 4 tarjetas de características con iconos pixel SVG.
  - `// 02` JUEGOS DISPONIBLES AHORA: carril con los primeros 6 juegos de `GAMES` y botón "VER TODOS LOS JUEGOS →".
  - Stats: 3 bloques (12+ / MILES / GLOBAL).
  - `// 03` ACTIVIDAD EN VIVO: ticker de últimas puntuaciones y lista "TOP JUGADORES · HOY" con enlace "VER SALÓN →".
  - `// 04` PRECIOS: tarjeta "JUGADOR VAULT" ($0) y 3 preguntas frecuentes.
  - CTA final "¿LISTO PARA JUGAR?" / "INSERTAR MONEDA →".
- Animación de aparición (`.reveal` → `.in`) con `IntersectionObserver`.
- Port a `app/globals.css` de los estilos de la plantilla: bloque `HOME PAGE` (líneas 930–1070), `ACTIVITY` (1621–1671), `PRICING` (1672–1730) y los keyframes `bounce`, `float` y `tickin`. Convive con lo ya portado en SPEC 01.
- `/` redirige a `/games`.
- La biblioteca (hero + `Library`) pasa de `/` a `/biblioteca`.
- Nav (escritorio y panel móvil): nuevo enlace "Inicio" (`/games`) antes de "Biblioteca"; el logo apunta a `/games`. Sin "Acerca de".
- Reapuntar enlaces internos que hoy usan `/` como biblioteca (ver plan, paso 6).
- Datos del home como mock estático tipado en `lib/home.ts`.

**Fuera de alcance (specs futuras):**

- Página "Acerca de" (`about.jsx`, gamepad interactivo, formulario de contacto) y su enlace en el nav.
- Backend o ranking real: actividad, top de hoy y stats son texto fijo; no leen `av_scores`.
- Pasarela de pagos: el plan "EMPEZAR GRATIS →" solo enlaza a `/auth`.
- Cambios al reproductor, detalle, salón o auth, salvo reapuntar enlaces.
- Tests automatizados (no hay runner configurado).

## Modelo de datos

```ts
// lib/home.ts — todo mock estático, copiado de home.jsx
export type Tone = "cyan" | "magenta" | "yellow" | "green";

export type Feature = { icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET"; title: string; desc: string; tone: Tone };
export type Stat = { n: string; unit: string; sub: string };
export type ActivityRow = { player: string; game: string; score: number; when: string; tone: Tone };
export type TopPlayer = { rank: number; player: string; score: number };
export type Faq = { q: string; a: string };

export const FEATURES: Feature[];          // 4
export const STATS: Stat[];                // 3
export const ACTIVITY: ActivityRow[];      // 7
export const TOP_PLAYERS: TopPlayer[];     // 5
export const PERKS: string[];              // 6 ítems del plan
export const FAQS: Faq[];                  // 3
```

Convenciones:

- Textos, números y colores se copian literalmente de `home.jsx`; puntuaciones con `toLocaleString("es-ES")`.
- El carril de juegos usa `GAMES.slice(0, 6)` de `lib/games.ts` (SPEC 01); no se duplican datos de juegos.
- Las clases `neon-*` de actividad se derivan de `tone`.

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/01-app` lo relativo a `redirect`, `cacheComponents` y client components para fijar convenciones antes de codificar.
2. Portar a `app/globals.css` los bloques CSS y keyframes indicados en el alcance. Verificar: `npm run dev` carga sin errores y las pantallas existentes no cambian de aspecto.
3. Crear `lib/home.ts` con tipos y datos. Verificar: `npm run lint` pasa.
4. Crear `app/biblioteca/page.tsx` con el contenido actual de `app/page.tsx` (hero + `Library`). Verificar: `/biblioteca` se ve idéntica a la antigua `/`.
5. Crear los componentes del home:
   - `components/home/silhouettes.tsx` (8 SVG, servidor).
   - `components/home/feature-icon.tsx` (4 iconos, servidor).
   - `components/home/mini-card.tsx` (`Link` a `/juegos/[id]`, servidor).
   - `components/home/reveal.tsx` (cliente; `IntersectionObserver` con `threshold: 0.12` que añade `.in` una sola vez).
6. Crear `app/games/page.tsx` ensamblando las secciones con esos componentes y `lib/home.ts`. CTAs con `Link`: EXPLORAR JUEGOS / VER TODOS → `/biblioteca`; CREAR CUENTA / EMPEZAR GRATIS → `/auth`; VER SALÓN → `/salon`; INSERTAR MONEDA → `/biblioteca`. Verificar: `/games` renderiza las 6 secciones y las animaciones corren.
7. Reemplazar `app/page.tsx` por `redirect("/games")`. Reapuntar enlaces que usaban `/` como biblioteca:
   - `app/juegos/[id]/page.tsx` (volver) → `/biblioteca`.
   - `components/hall-of-fame.tsx` (VOLVER A LA BIBLIOTECA) → `/biblioteca`.
   - `components/game-player.tsx` (VOLVER AL VAULT) → `/biblioteca`.
   - `components/auth-form.tsx` (`router.push("/")` tras login e invitado) → `/games`.
8. Actualizar `components/nav.tsx`: enlace "Inicio" → `/games` (activo con `pathname.startsWith("/games")`), "Biblioteca" → `/biblioteca` (activo en `/biblioteca` y `/juegos*`), logo → `/games`, mismos cambios en el panel móvil. Verificar: resaltado correcto en cada ruta.
9. Revisión visual de `/games` contra `references/resources/templates/home-about/arcade-vault-standalone.html` (home) en escritorio y 375 px.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/` redirige a `/games`.
- [ ] `/games` muestra, en orden, hero, `// 01`, `// 02`, stats, `// 03`, `// 04` y CTA final, con los textos de `home.jsx`.
- [ ] El hero muestra 8 siluetas flotantes y el título en 3 líneas "EL ARCADE / CLÁSICO ESTÁ / DE VUELTA".
- [ ] El carril `// 02` muestra exactamente 6 tarjetas y cada una navega a `/juegos/[id]` de su juego.
- [ ] El ticker muestra 7 filas y el top 5 jugadores, con NEONFOX primero y 312.840 como puntuación.
- [ ] Las secciones con `.reveal` aparecen al hacer scroll (pasan a tener la clase `in`).
- [ ] EXPLORAR JUEGOS, VER TODOS LOS JUEGOS e INSERTAR MONEDA llevan a `/biblioteca`; CREAR CUENTA y EMPEZAR GRATIS a `/auth`; VER SALÓN a `/salon`.
- [ ] `/biblioteca` muestra la biblioteca con filtros igual que la antigua `/` (SPEC 01).
- [ ] El nav tiene "Inicio", "Biblioteca" y "Salón de la Fama", y no tiene "Acerca de" ni existe la ruta `/about`.
- [ ] El nav resalta Inicio en `/games`, Biblioteca en `/biblioteca` y `/juegos/*`, y Salón en `/salon`; el logo lleva a `/games`.
- [ ] "Jugar como invitado" e iniciar sesión redirigen a `/games`.
- [ ] Los botones de volver de detalle, salón y reproductor llevan a `/biblioteca`.
- [ ] A 375 px no hay scroll horizontal en `/games`; las grillas colapsan (features 1 columna, carril 2 columnas).
- [ ] No hay errores de hidratación en la consola en `/games`.

## Decisiones

- **Sí:** home en `/games` con `/` redirigiendo a él. URL canónica única, pedido explícito.
- **Sí:** biblioteca a `/biblioteca`. La plantilla separa Inicio y Biblioteca; opción elegida por el usuario.
- **No:** mantener la biblioteca en `/` o bajo `/games/*`. Mezcla dos pantallas distintas.
- **Sí:** datos mock estáticos en `lib/home.ts`. Igual que la plantilla y coherente con SPEC 01 (sin backend).
- **No:** derivar actividad de `av_scores`. Cambia el comportamiento respecto a "exactamente igual".
- **Sí:** estilos portados casi literales a `globals.css`. Mismo criterio que SPEC 01: minimiza desvío visual.
- **Sí:** server components por defecto; `"use client"` solo en `Reveal`. El resto del home es contenido estático.
- **Sí:** `Link` de Next en lugar de `navigate()` de la plantilla. Rutas reales (SPEC 01).
- **No:** página "Acerca de" ni su enlace. Excluida por el usuario.
- **Sí:** auth redirige a `/games`. El home pasa a ser la entrada del sitio.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Estilos del home chocan con clases existentes (`.btn`, `.fade-in`, `.blink`, `.kicker`) | Paso 2: portar solo bloques nuevos; comparar visualmente las pantallas de SPEC 01 antes y después. |
| `.reveal` deja las secciones invisibles (`opacity: 0`) si no corre JS | Aceptado: igual que la plantilla. `Reveal` añade `.in` apenas monta si el elemento ya es visible. |
| Enlaces que apuntan a `/` quedan obsoletos tras mover la biblioteca | Paso 7 los lista; criterios de aceptación verifican cada volver. |
| `redirect` en `app/page.tsx` con `cacheComponents` puede comportarse distinto a lo conocido | Paso 1: leer docs de Next 16 antes de implementar. |
| Marcadores de SPEC 01 ("invitado vuelve a la biblioteca") dejan de ser ciertos | Esta spec los reemplaza: ahora redirigen a `/games`. |

## Qué **no** está en esta spec

- Página "Acerca de" y su enlace en el nav.
- Backend, ranking real, actividad en vivo real.
- Pagos o planes reales.
- Cambios de diseño al home: debe ser igual a la plantilla.
- Tests automatizados.
