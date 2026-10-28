# SPEC 04 — Conexión con Supabase

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-27
> **Objetivo:** Conectar la app Next.js al proyecto Supabase con clientes de navegador y servidor listos para usar, variables de entorno documentadas y una verificación de conexión, sin cambiar ninguna funcionalidad.

## Por qué existe esta spec

El proyecto Supabase (`btihlxgpovfyjhesmpwd`) está enlazado por MCP pero la app no tiene cliente, la base está vacía y `.env.example` solo documenta `SUPABASE_PASSWORD`, que la app no necesita. Esta spec deja la conexión lista para que las specs siguientes (autenticación, puntuaciones) solo tengan que usarla.

## Alcance

**Dentro:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Clientes en `lib/supabase/`:
  - `client.ts` — `createClient()` con `createBrowserClient`, para componentes cliente.
  - `server.ts` — `createClient()` asíncrono con `createServerClient` y `cookies()` de `next/headers`, para Server Components, Server Actions y Route Handlers.
- Variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.example`, reemplazando `SUPABASE_PASSWORD`.
- Carpeta `supabase/` versionada creada con `supabase init` (`config.toml`), sin migraciones todavía.
- Verificación de conexión con una consulta de salud temporal, retirada al terminar.

**Fuera de alcance (specs futuras):**

- Autenticación con Supabase Auth: login, registro, `profiles`, `/cuenta`, redirecciones.
- `proxy.ts` para refrescar la sesión: solo tiene sentido con autenticación.
- Tablas, migraciones y RLS.
- Cambios en `lib/session.tsx`: `av_user` y `av_scores` siguen en `localStorage`.
- Cualquier cambio visual o de comportamiento en las pantallas.
- Tipos TypeScript generados desde la base.
- Stack local de Supabase con Docker.
- Tests automatizados (no hay runner configurado).

## Modelo de datos

Esta spec no introduce estructuras de datos ni tablas. Contratos de los clientes:

```ts
// lib/supabase/client.ts
export function createClient(): SupabaseClient; // createBrowserClient(url, publishableKey)

// lib/supabase/server.ts
export async function createClient(): Promise<SupabaseClient>; // createServerClient + await cookies()
```

Variables de entorno:

| Variable                               | Obligatoria | Uso                                                            |
| -------------------------------------- | ----------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Sí          | URL del proyecto (`https://<ref>.supabase.co`).                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sí          | Clave publicable (`sb_publishable_...`); segura en el cliente. |

Convenciones:

- Se crea un cliente nuevo por petición en servidor; nunca un cliente de servidor compartido en un módulo global.
- En `server.ts`, el `setAll` de cookies va en `try/catch`: desde un Server Component no se pueden escribir cookies, y sin autenticación no hace falta.
- Si falta alguna variable, el cliente lanza un error con el nombre de la variable que falta.
- No se usa la clave `service_role` ni la contraseña de Postgres en la app.

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/01-app` lo relativo a variables de entorno (`02-guides/environment-variables.md`) y a `cookies()` con `cacheComponents` (`02-guides/authentication-with-cache-components.md`, sección de `<Suspense>`). Consultar la guía vigente de `@supabase/ssr` para Next.js (MCP `search_docs`). Fijar convenciones antes de codificar.
2. `npm install @supabase/supabase-js @supabase/ssr`. Reemplazar `SUPABASE_PASSWORD` en `.env.example` por las dos variables nuevas, con comentarios de dónde obtenerlas (Project Settings → API, o MCP `get_project_url` / `get_publishable_keys`). Verificar: `npm run dev` arranca igual que antes.
3. Crear `lib/supabase/client.ts` y `lib/supabase/server.ts`. Verificar: `npm run lint` y tipos pasan; ninguna pantalla importa todavía los clientes.
4. `supabase init` para crear `supabase/config.toml`; versionar la carpeta (ignorar lo que el CLI marque como local, p. ej. `supabase/.temp`). Verificar: `git status` muestra solo los archivos esperados.
5. Consulta de salud temporal: desde un componente de servidor dentro de `<Suspense>` (o un Route Handler temporal), crear el cliente de servidor y hacer una petición real al proyecto, p. ej. `GET {URL}/auth/v1/health` con la cabecera `apikey`. Verificar: responde 200 con `.env.local` correcto y falla con una clave inválida. Retirar el código temporal.

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr`.
- [x] `.env.example` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y ya no contiene `SUPABASE_PASSWORD`.
- [x] Existen `lib/supabase/client.ts` y `lib/supabase/server.ts`, cada uno exportando `createClient`.
- [x] `supabase/config.toml` está versionado.
- [x] Con `.env.local` correcto, la consulta de salud recibe respuesta 200 del proyecto; con una clave inválida recibe error.
- [x] Sin las variables, crear un cliente lanza un error que nombra la variable que falta.
- [x] El código de la consulta de salud no queda en el repositorio.
- [x] Ninguna clave `service_role` ni contraseña de Postgres aparece en el código ni en `.env.example`.
- [x] Ninguna pantalla cambia de aspecto ni de comportamiento; login mock y puntuaciones siguen como en SPEC 01.

## Decisiones

- **Sí:** solo la conexión. El usuario la eligió tras descartar incluir autenticación; mantiene la spec pequeña.
- **No:** autenticación con Supabase Auth. Va en su propia spec.
- **Sí:** `@supabase/ssr` con clientes separados para navegador y servidor. Es el patrón oficial para App Router y lo que necesitará la spec de autenticación.
- **No:** `proxy.ts`. Solo refresca la sesión de Auth; sin autenticación sería código sin uso.
- **Sí:** reemplazar `SUPABASE_PASSWORD` por URL + clave publicable. La app nunca necesita la contraseña de Postgres.
- **Sí:** clave publicable (`sb_publishable_...`) en vez de la `anon` antigua. Supabase la recomienda y se puede rotar por separado.
- **Sí:** carpeta `supabase/` versionada desde ya, sin migraciones. Las specs siguientes añaden migraciones ahí.
- **Sí:** consulta de salud temporal en vez de una tabla o una página `/debug` de prueba. Verifica URL y clave sin dejar rastro en el esquema ni en la UI.

## Riesgos

| Riesgo                                                                                           | Mitigación                                                                              |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `cookies()` en el cliente de servidor fuera de `<Suspense>` rompe el build con `cacheComponents` | Paso 1; la consulta de salud va dentro de `<Suspense>` o en un Route Handler.           |
| La API de `@supabase/ssr` difiere de la conocida                                                 | Paso 1: leer la guía vigente antes de codificar.                                        |
| `.env.local` sin completar en otra máquina                                                       | `.env.example` documenta las variables y el cliente lanza un error que dice cuál falta. |
| Se versionan archivos locales del CLI de Supabase                                                | Paso 4: revisar `git status` y respetar el `.gitignore` que genera `supabase init`.     |

## Qué **no** está en esta spec

- Autenticación, perfiles, rutas protegidas ni `proxy.ts`.
- Tablas, migraciones o RLS.
- Cambios en la sesión mock o en las puntuaciones.
- Cambios visuales.
- Tipos generados, stack local con Docker.
- Tests automatizados.
