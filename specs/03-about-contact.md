# SPEC 03 — Acerca de y contacto con Resend en `/about`

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-27
> **Objetivo:** Portar a Next.js la página "Acerca de" de `references/resources/templates/home-about/about.jsx` exactamente igual que la plantilla, servida en `/about`, con el formulario de contacto enviando correos reales mediante Resend desde una Server Action.

## Por qué existe esta spec

SPEC 02 dejó fuera la página "Acerca de" y su enlace en el nav. La plantilla `home-about` la incluye con un formulario de contacto que solo simula el envío (`setSent(...)`). Esta spec añade la página y convierte ese formulario en un envío real a través de Resend, dejando la configuración (dependencia, variables de entorno, módulo de correo) lista para reutilizarse en futuros correos.

## Alcance

**Dentro:**

- Ruta `/about` con las secciones de `about.jsx`, en este orden:
  - Hero: kicker "▸ ACERCA DE", título "ACERCA DE ARCADE VAULT", párrafo de misión y 3 tarjetas destacadas (corazón magenta, navegador cyan, planta verde) con iconos pixel SVG.
  - Divisor decorativo con 24 píxeles animados (`.reveal`).
  - Contacto (`.reveal`): kicker "▸ CONTACTO", título "CONTÁCTANOS", texto, 3 tips con LED ("RESPUESTA EN 24-48H", "SUGERENCIAS BIENVENIDAS", "SIN SPAM, JAMÁS") y formulario NOMBRE / CORREO ELECTRÓNICO / MENSAJE con botón "▶  ENVIAR MENSAJE".
- Estados del formulario, como en la plantilla:
  - Campos vacíos: el formulario hace `shake` 400 ms y no envía.
  - Éxito: terminal "VAULT-OS // TERMINAL" con "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {NOMBRE}." y botón "ENVIAR OTRO MENSAJE" que limpia el formulario.
- Estado nuevo (no existe en la plantilla): error de envío o de validación del servidor, mostrado dentro del formulario con el mismo lenguaje visual (línea de error en rojo/magenta de la paleta existente), sin terminal de éxito.
- Envío real con Resend:
  - Dependencia `resend`.
  - `lib/email.ts`: cliente de Resend y función `sendContactEmail`.
  - Server Action `app/about/actions.ts`: valida en servidor, comprueba el honeypot y envía.
  - Variables de entorno `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` documentadas en `.env.example`.
- Anti-abuso: validación en servidor con límites de longitud y campo honeypot oculto.
- Port a `app/globals.css` del bloque `ABOUT PAGE` de la plantilla (líneas 1071–1146 de `styles.css`: `.about*`, `.highlight*`, `.about-divider`, `.contact*`, `.terminal-success`, `.term-*`, keyframe `shake`) y de `.btn.press:active`. Convive con lo ya portado en SPEC 01 y 02.
- Nav (escritorio y panel móvil): nuevo enlace "Acerca de" → `/about`, activo con `pathname.startsWith("/about")`, después de "Salón de la Fama".
- Metadata propia de la página (`title`, `description`).

**Fuera de alcance (specs futuras):**

- Verificación de dominio en Resend: se usa el remitente de pruebas `onboarding@resend.dev` por defecto.
- Rate limit por IP (requeriría Redis/Upstash u otra infraestructura).
- Correo de confirmación al visitante, plantillas HTML/React Email, guardado de mensajes en base de datos.
- CAPTCHA.
- El gamepad interactivo (`.gp`): `about.jsx` no lo usa, así que no se porta.
- Enlace a "Acerca de" en el footer.
- Tests automatizados (no hay runner configurado).

## Modelo de datos

No introduce datos persistentes. Contratos de la Server Action y del módulo de correo:

```ts
// app/about/actions.ts ("use server")
export type ContactState =
  | { status: "idle" }
  | { status: "ok"; name: string }
  | { status: "error"; message: string };

export async function sendContact(prev: ContactState, formData: FormData): Promise<ContactState>;
// campos del FormData: name, email, msg, website (honeypot)

// lib/email.ts
export type ContactMessage = { name: string; email: string; msg: string };
export async function sendContactEmail(m: ContactMessage): Promise<void>; // lanza si Resend devuelve error
```

Límites de validación (servidor): `name` 1–60 caracteres, `email` formato válido y ≤ 254, `msg` 1–2000, todos tras `trim()`.

Variables de entorno (`.env.example`, valores vacíos o de ejemplo):

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `RESEND_API_KEY` | Sí | Clave de API de Resend. |
| `CONTACT_TO_EMAIL` | Sí | Destinatario de los mensajes de contacto. |
| `CONTACT_FROM_EMAIL` | No | Remitente; por defecto `onboarding@resend.dev`. |

Convenciones:

- Textos, tips y clases se copian literalmente de `about.jsx`.
- El correo se envía como `text` plano (sin HTML) para no interpretar contenido del visitante; `replyTo` es el correo del visitante y el asunto incluye el nombre.
- `RESEND_API_KEY` solo se lee en servidor; nunca con prefijo `NEXT_PUBLIC_`.

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/01-app` lo relativo a Server Actions y formularios (`07-mutating-data`), variables de entorno, `cacheComponents` y client components, y la API vigente de `resend` (`emails.send` devuelve `{ data, error }`). Fijar convenciones antes de codificar.
2. Portar a `app/globals.css` el bloque `ABOUT PAGE` y `.btn.press:active`. Verificar: `npm run dev` carga sin errores y las pantallas existentes no cambian de aspecto.
3. Preparar Resend:
   - `npm install resend`.
   - Crear `.env.example` y añadir la excepción `!.env.example` a `.gitignore` (hoy `.env*` lo ignora).
   - Crear `lib/email.ts` con `sendContactEmail`. Verificar: `npm run lint` pasa.
4. Crear `app/about/actions.ts`: honeypot (si `website` viene relleno devuelve `ok` sin enviar), validación y límites, llamada a `sendContactEmail`, y errores controlados: mensaje genérico al visitante y detalle solo en el log del servidor; si faltan `RESEND_API_KEY` o `CONTACT_TO_EMAIL` devuelve `error`, nunca un falso éxito. Verificar: lint y tipos.
5. Crear los componentes de `/about`:
   - `components/about/highlight-icon.tsx` (HEART, BROWSER, PLANT; servidor).
   - `components/about/contact-form.tsx` (cliente; `useActionState(sendContact)`, `shake` en campos vacíos antes de enviar, estado de éxito con terminal, "ENVIAR OTRO MENSAJE", estado de error, botón deshabilitado mientras envía, campo `website` oculto con `tabIndex={-1}` y `aria-hidden`).
6. Ajustar `components/home/reveal.tsx` para aceptar `aria-hidden` (el divisor decorativo lo requiere). Crear `app/about/page.tsx` ensamblando hero, divisor y contacto con `Reveal`. Verificar: `/about` renderiza las 3 secciones y las animaciones corren.
7. Actualizar `components/nav.tsx`: enlace "Acerca de" → `/about` en escritorio y panel móvil con resaltado propio. Verificar: resaltado correcto en cada ruta.
8. Prueba de envío real con una clave de prueba de Resend en `.env.local`: mensaje válido llega al destinatario con `replyTo` correcto; sin la variable muestra el error.
9. Revisión visual de `/about` contra `references/resources/templates/home-about/arcade-vault-standalone.html` (página Acerca de) en escritorio y 375 px.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/about` existe y muestra, en orden, hero, divisor y contacto, con los textos de `about.jsx`.
- [ ] El hero muestra 3 tarjetas destacadas con iconos pixel y colores magenta, cyan y verde.
- [ ] El nav tiene "Acerca de" (escritorio y panel móvil) y lo resalta solo en `/about`.
- [ ] Enviar con algún campo vacío hace `shake` y no llama a Resend.
- [ ] Enviar un mensaje válido con `RESEND_API_KEY` y `CONTACT_TO_EMAIL` reales entrega el correo a `CONTACT_TO_EMAIL`, con `reply_to` igual al correo del visitante y cuerpo en texto plano.
- [ ] Tras el envío se muestra la terminal con "GRACIAS, {NOMBRE EN MAYÚSCULAS}."; "ENVIAR OTRO MENSAJE" devuelve el formulario vacío.
- [ ] Si falta `RESEND_API_KEY` o `CONTACT_TO_EMAIL`, o Resend devuelve error, el formulario muestra un mensaje de error, conserva lo escrito y no muestra la terminal de éxito.
- [ ] El servidor rechaza correo inválido, nombre > 60 o mensaje > 2000 caracteres aunque se salte la validación del navegador.
- [ ] Con el honeypot relleno la acción responde como éxito pero no se envía ningún correo.
- [ ] `RESEND_API_KEY` no aparece en el bundle del cliente ni en la respuesta de la acción.
- [ ] `.env.example` está versionado; `.env.local` sigue ignorado por git.
- [ ] A 375 px no hay scroll horizontal en `/about`; `.highlight-row` y `.contact-grid` colapsan a 1 columna.
- [ ] No hay errores de hidratación en la consola en `/about`.
- [ ] El resto de pantallas (`/games`, `/biblioteca`, `/salon`, `/auth`) no cambia de aspecto.

## Decisiones

- **Sí:** ruta `/about`. Coincide con `about.jsx` y con el pedido; elegida por el usuario.
- **Sí:** envío real con Server Action. Formulario y envío en el mismo árbol, sin endpoint público adicional ni `fetch` en cliente; elegida por el usuario.
- **No:** Route Handler `/api/contact`. Más código de cliente sin ventaja en este caso.
- **No:** solo "preparación" con éxito simulado. Un formulario que dice "MENSAJE RECIBIDO" sin enviar nada engaña al visitante.
- **Sí:** remitente y destinatario por variables de entorno, con `onboarding@resend.dev` por defecto. Permite pasar a un dominio verificado sin tocar código.
- **Sí:** validación en servidor + honeypot. Cubre abuso básico sin infraestructura nueva.
- **No:** rate limit. Un contador en memoria no es fiable en serverless y uno real exige otro servicio; se revisa en otra spec si hay abuso.
- **Sí:** correo en texto plano. Evita inyección de HTML con contenido del visitante.
- **Sí:** estado de error nuevo, ausente en la plantilla. Con envío real el fallo es posible y no puede quedar mudo; es la única desviación visual respecto a "exactamente igual".
- **Sí:** estilos portados casi literales a `globals.css`. Mismo criterio que SPEC 01 y 02.
- **Sí:** server components por defecto; `"use client"` solo en el formulario (y `Reveal`, ya existente).
- **Sí:** `Link` de Next para el nav. Esta spec reemplaza el criterio de SPEC 02 "el nav no tiene Acerca de ni existe `/about`".
- **Sí:** `!.env.example` en `.gitignore`. Hoy `.env*` lo ocultaría y la documentación de variables se perdería.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `onboarding@resend.dev` solo entrega al correo de la cuenta de Resend | Documentarlo en `.env.example`; `CONTACT_TO_EMAIL` debe ser ese correo hasta verificar un dominio. |
| Spam o abuso del formulario público (cuota de Resend) | Honeypot y límites de longitud; rate limit queda como mejora futura. |
| Fuga de `RESEND_API_KEY` | Solo se lee en `lib/email.ts` (servidor); sin prefijo `NEXT_PUBLIC_`; criterio de aceptación verifica el bundle. |
| Estilos nuevos chocan con `.btn`, `.field`, `.kicker`, `.fade-in` | Paso 2: portar solo el bloque nuevo y comparar visualmente las pantallas de SPEC 01 y 02. |
| `.reveal` deja el contacto invisible si no corre JS | Aceptado, igual que la plantilla y SPEC 02. |
| `useActionState` y la Server Action se comportan distinto en Next 16 con `cacheComponents` | Paso 1: leer docs de Next 16 antes de implementar. |
| API de `resend` distinta a la conocida (cliente lanza vs. devuelve `{ error }`) | Paso 1: comprobar la versión instalada; `sendContactEmail` normaliza ambos casos a una excepción. |

## Qué **no** está en esta spec

- Verificación de dominio de Resend ni remitente propio.
- Rate limit, CAPTCHA, correo de confirmación al visitante.
- Plantillas de correo HTML o React Email.
- Persistencia de mensajes.
- Gamepad interactivo ni enlace en el footer.
- Cambios de diseño a la página: debe ser igual a la plantilla, salvo el estado de error.
- Tests automatizados.
