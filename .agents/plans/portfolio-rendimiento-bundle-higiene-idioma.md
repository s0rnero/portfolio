---
name: portfolio-rendimiento-bundle-higiene-idioma
status: EXECUTED
type: maintenance
domain: portfolio
owner_rules: .agents
created: 2026-09-18 20:50
enriched: 2026-09-18 20:56
ready: 2026-09-18 21:02
executed: 2026-09-18 21:15
---

# Plan Tecnico: Rendimiento del bundle, higiene de idioma y build publicable

> Enriquecido el 2026-09-18 20:56 sobre la compuerta **"enriquece el plan"**. Todo lo de este
> documento esta verificado leyendo el repo y midiendo assets el 2026-09-18; las anclas de linea
> corresponden a ese estado (salvo lo indicado).
>
> **Restriccion nueva y vinculante del usuario (2026-09-18):** *"estos cambios no deben romper ni
> cambiar nada de lo realizado actualmente a nivel visual"*, y a la vez el objetivo final es que el
> **compilado quede lo mas apto posible en SEO, rendimiento y calidad para publicar**.
>
> **El enrichment NO implementa codigo.** Queda listo para la revision critica del orquestador
> (obligatoria) y despues para la compuerta **"ejecuta el plan"**.
>
> **Hallazgo que cambio el plan:** la version inicial daba por hecho que quitar `app.use(khatarsis)`
> era visualmente neutro. **No lo es** (ver A1): el plugin es lo unico que define los tokens
> `--variant-*` en runtime. A1 queda bloqueado por la libreria y pasa al handoff como el item de
> mayor valor para ambos repos.

## Registro De Ejecucion (2026-09-18 21:15)

> Compuertas atendidas: **"enriquece el plan"** (`PENDING -> ENRICHED`), **"marca ready y ejecuta el
> plan"** (`ENRICHED -> READY -> EXECUTED`) y la autorizacion explicita de B3 (*"b3 autorizo"*). El
> usuario ademas decidio resolver khatarsis por su cuenta (*"no dependas de khatarsis"*), asi que A1
> se ejecuta del lado de la libreria, no aca.

### Archivos tocados (10)

| Archivo | Cambio real |
| --- | --- |
| `src/router/index.ts` | Fuera el `import ViceCityView` estatico; la ruta `/vicecity` pasa a `component: () => import('@/views/ViceCityView.vue')` con comentario en ingles |
| `src/components/about/MapCard.vue` | Fuera `import * as L` y `import 'leaflet/dist/leaflet.css'` del grafo inicial; `import type { Map as LeafletMap }`; `map: LeafletMap \| null`; `onMounted` async con `const L = await import('leaflet')` y `await import('leaflet/dist/leaflet.css')` antes de crear el mapa |
| `index.html` | `<link rel="preconnect" href="https://api.iconify.design" />` |
| `src/views/ViceCityView.vue` | `preload="metadata"` en el `<video>` (con el mismo orden de atributos que valida `vue/attributes-order`) |
| `src/i18n/locales/es.ts` | Clave nueva `meta.title` + los 4 typos de `hero.description` corregidos (B3, autorizado) |
| `src/i18n/locales/en.ts` | Clave nueva `meta.title` (paridad 46/46 tras el `hero.description` de la sincronizacion previa) |
| `src/main.ts` | `watch(i18n.global.locale, ..., { immediate: true })` que aplica `document.documentElement.lang` y `document.title` desde `meta.title` |
| `src/components/background/FaultyTerminalBackground.vue` | Bloque de cabecera español -> ingles, con la parte legal literal |
| `src/data/portfolio.ts` | `arqbsLogo` pasa de `.png` a `.webp` |
| `src/assets/brands/arqbs-logo-color.webp` | **Nuevo**: WebP **lossless** de 31.078 B generado con `ffmpeg -c:v libwebp -lossless 1` desde el PNG de 65.685 B (mismas dimensiones 1813x1029, alpha conservado) |

### Desvios respecto del plan enriquecido

1. **A1 no se ejecuto**: bloqueado en origen (los tokens `--variant-*` solo existen si corre
   `app.use(khatarsis)`) y, por pedido explicito del usuario, se resuelve del lado de la libreria. Va
   al handoff (Frente D, item 5).
2. **A5 parcial**: el WebP lossless se ejecuto (pixeles identicos por definicion + dimensiones
   verificadas). El `logo_khatarsis.svg` de 578.351 B **no** se pudo optimizar: no hay `svgo` en el
   proyecto ni en el sistema, y `bunx svgo` descargaria un paquete fuera del proyecto (requiere
   autorizacion). Queda pendiente con su verificacion por pixel.
3. **B6 no se ejecuto**: borrar codigo requiere aprobacion explicita (RULES 0.2) y no fue autorizado.
4. **D3 (peso del trailer)** sigue abierto: no se toco el activo de 250 MB.

### Verificacion real

- `bun run lint:check` -> exit 0, sin hallazgos.
- `bun run format:check` -> "All matched files use Prettier code style!".
- `bunx vue-tsc -b` -> **solo los 2 errores externos de khatarsis** (`src/main.ts(13,9)` y `(18,48)`);
  **0 errores nuevos** en los archivos de este plan.
- `bunx vite build` -> exit 0, 118 modulos, 1,73-2,60 s.

| Activo | Antes (build 2026-09-16) | Ahora (build 2026-09-18) | Delta |
| --- | --- | --- | --- |
| `index-*.js` | 1.038.068 B / 337.267 B gzip | 698.791 B / 224.334 B gzip | **-339.277 B / -112.933 B (-33 %)** |
| `index-*.css` | 402.454 B / 50.073 B gzip | 387.462 B / 43.857 B gzip | -14.992 B / -6.216 B |
| `leaflet-src-*.js` (diferido) | — (dentro del chunk unico) | 148.731 B / 42.910 B gzip | chunk propio |
| `leaflet-*.css` (diferido) | — | 15.095 B / 6.400 B gzip | chunk propio |
| `ViceCityView-*.js` (diferido) | — | 475 B / 378 B gzip | chunk propio |
| `arqbs-logo-color` | 65.685 B PNG | 31.078 B WebP | **-34.607 B (-53 %)** |
| `logo_khatarsis-*.svg` | 578.351 B / 182.334 B gzip | igual | pendiente (SVGO) |
| `dist/` total | 253 MB | 253 MB | lo domina el trailer |

**Arranque (JS + CSS):** 1.440.522 B -> 1.086.253 B crudo (**-24,6 %**) y 387.340 B -> 268.191 B gzip
(**-30,8 %**). El win es de camino critico: el chunk de Leaflet se sigue pidiendo en el arranque real
porque About esta montada en la vista, pero ya no bloquea la primera pintura.

- **Revision en el navegador** (Vite dev en `localhost:5199`, servidor que queda levantado para tu
  revision):

| Caso | Evidencia medida | Resultado |
| --- | --- | --- |
| Arranque en ES | `document.documentElement.lang === 'es'`; `title` = el de `index.html`; `h1` "¡Hola! Soy César Ríos" | Sin cambio visible; el copy ya se lee con los typos corregidos |
| Arranque en EN (`portfolio-locale = 'en'`) | `lang === 'en'`; `title === 'César Andrés Ríos Valencia — Full Stack Developer'`; `h1` "Hi! I'm César Ríos" | B2 funciona con la clave nueva |
| Mapa (A3) | `.leaflet-container` 1, 7 `leaflet-pane`, **6 tiles HTTP 200**, `position: relative`, alto 224 px, control de zoom y boton "Centrar en Cali" | Leaflet diferido **con su CSS**: el mapa queda igual |
| Logo WebP (A5) | `<img src="arqbs-logo-color.webp">` con `naturalWidth x naturalHeight = 1813 x 1029` | La card de Proyectos usa el WebP sin cambio de tamaño |
| Deep-link `/vicecity` (A2) | `/src/views/ViceCityView.vue` aparece en los recursos **solo tras navegar**; `video` con `preload="metadata"`, `paused: false`, `volume: 1`, `readyState: 4` | Ruta diferida y trailer con sonido (ADR-010) |
| Truco `vicecity` + `Enter` desde `/` | t≈0,6 s: panel "Truco activado" y `video.paused === true` (currentTime 0); a los 3 s: panel desmontado y `video.paused === false` (6,33 s), `volume: 1` | Gating de ADR-010 intacto con la ruta diferida |
| Consola | Sin errores; un unico `[Vue warn]: inject() can only be used inside setup()` | Ajeno a este plan: no hay ningun `inject(` en `src/` y ningun cambio de este corte lo introduce (nace de una llamada de la libreria desde el punto de composicion). Queda anotado como observacion |

- **No verificado por mi:** el cambio de idioma **en vivo** desde el selector (el `k-select` del drawer
  no abre con gestos sinteticos; necesita tu click real) y la comparacion visual fina de las 4
  secciones. Lo verificado en idioma es la rama de arranque en ES y EN; el `watch` nuevo usa la misma
  fuente (`i18n.global.locale`) que el puente de ADR-008 ya validado.

## Regla Vinculante: Neutralidad Visual

Cada paso de este plan declara su **impacto visual esperado**. Por defecto debe ser **ninguno**:

| Paso | Impacto visual esperado | Como se comprueba |
| --- | --- | --- |
| A2, A3, A6, B2, B4 | Ninguno | Comparacion en pantalla antes/despues (misma seccion, mismo tema, mismo ancho) |
| A5 | Ninguno | Comparacion de la imagen optimizada contra la original al tamaño real de uso |
| B3 | **Cambia texto visible** (4 typos), cero cambio de layout | Revision del parrafo del hero en ES |
| B6 | Ninguno (codigo sin consumidor) | `grep` sin referencias + build |
| A1, A4, D3 | Fuera de este corte o bloqueados | — |

Si un cambio no puede garantizar impacto visual nulo, **no se ejecuta**: queda como decision
abierta o se descarta con su motivo escrito.

## Analisis

- **Objetivo:** (1) reducir el peso real del arranque con cambios que no se vean; (2) dejar el
  documento HTML declarando el idioma que el usuario ve y el codigo 100 % en ingles; (3) dejar el
  build en condiciones de publicarse (SEO, rendimiento y calidad) junto con el plan de SEO ya
  existente; (4) entregar a khatarsis los defectos de su artefacto que hoy bloquean `bun run build`.
- **Scope:** 1 archivo de entrada (`main.ts`), 1 router, 1 componente con Leaflet, 2 locales, 1
  `index.html`, 1 comentario de codigo, 2 assets de imagen, 1 atributo de `<video>`, y los documentos
  `.agents/DESIGN.md` §3 (+ ADR si el corte fija una decision). **No** se crean componentes nuevos.
- **Archivos exactos:** los de la seccion "Cambios". Fuera: la libreria `khatarsis` (handoff), el
  SEO estructural (`portfolio-seo-metadata.md`, PENDING), el copy mas alla de B3, Git.
- **Riesgos altos:** A3 (que el mapa pierda su primer frame o su CSS) y B2 (que el `<title>`
  cambie en el idioma equivocado). Los dos tienen caso de verificacion propio.
- **Skills consultadas** (`.agents/skills/`): `seo` (checklist Critical/High y guia de `robots.txt`,
  canonical, JSON-LD, `hreflang`/`lang`, imagenes), `vite` (build, ESM, code-splitting por import
  dinamico) y `vue-best-practices` (Composition API + `<script setup lang="ts">`, estado y data flow
  explicito). **Ninguna contradice este plan** y ninguna prevalece sobre `CODING_STANDARDS.md` ni
  `DESIGN.md`.

## Cambios

### A1 — Bundle de khatarsis: **BLOQUEADO por la libreria** (no ejecutable en este corte)

**Objetivo original:** dejar de registrar globalmente los componentes de la libreria (hoy
`src/main.ts:13` → `app.use(khatarsis)`) e importar por nombre los 8 que el sitio usa
(`k-image`, `k-icon`, `k-card`, `k-button`, `k-tooltip`, `k-chip`, `k-select`, `k-item`, en 9
archivos), que es lo que impide el tree-shaking y mete `Heatmap`, `Carousel`, `TablePaginator`,
`UploadFile`, `Calendar` y `Doughnut` en el chunk de arranque.

**Por que no se puede ejecutar hoy (verificado en fuente de la libreria):**

`packages/khatarsis/src/plugins/khatarsis.ts` hace tres cosas, y con `app.use(khatarsis)` (sin
config) las tres corren:

1. `for (const [name, cfg] of Object.entries(config)) setComponentConfig(...)` → con config vacia,
   inofensivo.
2. `generateVariantStyles(config)` → **inyecta un `<style data-variant-tokens>` en `document.head`
   con los tokens `--variant-*`**: los built-ins cromaticos (`.primary`, `.secondary`, `.danger`,
   `.warning`, `.info`, `.success`), sus flips `.dark` y `.base`/`.dark .base`
   (`variantTokens.ts:110-134`). Es **lo unico** que define esos tokens: el CSS publicado
   (`dist/public/khatarsis.css`) tiene **0 ocurrencias** de los selectores que los definen
   (`grep` de `--variant-*:` → vacio), y el propio CSS de los componentes consume
   `var(--variant-bg)`, `var(--variant-fg)`, `var(--variant-hover)`… (ej. en `k-item`).
   `src/components/**` no lo llama por su cuenta y `generateVariantStyles` **no esta en el entry
   publico** de la libreria (no aparece en `dist-types/public/public.d.ts` ni en los exports del
   bundle).
3. `app.component(name, component)` para cada entrada del registry + `app.directive('effect', vEffect)`.

**Conclusion:** si se quita el plugin sin sustituir el paso 2, los componentes pierden los colores de
sus variantes → **rompe la restriccion de neutralidad visual**. Las alternativas evaluadas:

| Alternativa | Veredicto |
| --- | --- |
| Reescribir los tokens `.base`/cromaticos en `src/style.css` | Rechazada: duplicaria internos de la libreria (RULES 0.6) y se desincronizaria con su build; ademas `DESIGN.md` §5 prohibe parchear el fallo de la libreria desde el repo |
| Mantener `app.use(khatarsis)` y sacar el peso de otra forma | Rechazada: el registro global es exactamente lo que impide el tree-shaking |
| Que la libreria publique los tokens en su CSS (o exporte la funcion) | **Via correcta → handoff D5.** Cuando este, A1 se ejecuta en este mismo plan: en `main.ts` queda `app.directive('effect', vEffect)` y los 8 componentes pasan a import nombrado en sus 9 consumidores (`Navbar.vue` ya lo hace con `Drawer`, linea 5 y `<drawer>` en linea 75: el patron esta probado en el repo) |

**Medicion pendiente (post-ejecucion):** con el plugin actual la libreria completa esta en el chunk
(`khatarsis.es.js` publicado pesa 482.646 B); el win real de A1 se mide al ejecutarlo, no se estima
aca.

### A2 — Ruta diferida del huevo de pascua (edit)

- `src/router/index.ts`: quitar el `import ViceCityView from '@/views/ViceCityView.vue'` (linea 4) y
  declarar la ruta `/vicecity` con componente diferido: `component: () => import('@/views/ViceCityView.vue')`.
- Motivo: `MainView` es la ruta de entrada y se queda eager; `/vicecity` no es seccion de navegacion
  (`NAV_SECTIONS` no la incluye, ADR-009) y su logica + el `vc.mp4` no necesitan estar en el grafo
  inicial.
- No se toca: `scrollBehavior`, `routesMap`, `RouteName`, ni el gating del trailer (ADR-010).
- **Impacto visual esperado:** ninguno.

### A3 — Leaflet diferido en el mapa (edit)

- `src/components/about/MapCard.vue`: hoy importa `* as L from 'leaflet'` (linea 4) y
  `'leaflet/dist/leaflet.css'` (linea 5) de forma estatica, y el mapa vive en About (muy debajo del
  fold). La anotacion de tipo `let map: L.Map | null` (linea 50) se cubre con un import **solo de
  tipos** (`import type { Map } from 'leaflet'`), que no emite codigo.
- El uso real de Leaflet esta **todo dentro del `onMounted`** (lineas 65-85: `L.map`, `L.tileLayer`,
  `L.marker`, `L.divIcon`), asi que el cambio es: `onMounted(async () => { ... const L = await
  import('leaflet'); await import('leaflet/dist/leaflet.css'); ... })` y nada mas cambia.
- No se toca: `ResizeObserver`, `fitCity()`, `hasFitted`, el `wheel` pasivo, el `clock` de la hora
  local, `map.remove()` en `onBeforeUnmount`, el pin SVG, `minZoom`, `worldCopyJump` ni el
  `attribution`. Todo lo ya ganado en `portfolio-mapa-altura-pin-recenter-cards-zindex` queda intacto.
- **Riesgo:** el CSS de Leaflet llega con el chunk → posible primer frame sin estilos.
  Mitigacion: el mapa se inicializa dentro del mismo `await`, asi que Leaflet arranca despues de que
  su CSS entro; el caso de verificacion lo comprueba con scroll rapido y lento.
- **Impacto visual esperado:** ninguno.

### A4 — Iconos: **NO bundlear sets** (decision D2, recomendacion: no hacerlo) + `preconnect` (edit)

- Hoy los iconos se resuelven on-demand contra `https://api.iconify.design` (la URL esta en el
  bundle y no hay `@iconify-json` instalado en ningun repo). Bundlear los sets NO es una mejora de
  rendimiento: el JSON completo de un set (`mdi`, del que cuelgan tambien los iconos internos de la
  libreria — `mdi:alert`, `mdi:check-circle`, `mdi:close-circle`, `mdi:information`, `mdi:close`) es
  de orden de magnitud de MB, contra ~15 iconos sueltos que hoy se piden una vez y quedan en cache.
  **Se rechaza** salvo que el usuario quiera la independencia de terceros por encima del peso
  (decision D2).
- Lo que si es barato y neutro: `<link rel="preconnect" href="https://api.iconify.design" />` (y
  `<link rel="dns-prefetch" ...>` si se quiere) en `index.html`, para adelantar el handshake donde ya
  se piden los iconos.
- **Impacto visual esperado:** ninguno.

### A5 — Imagenes pesadas (edit + verificacion por pixel)

| Archivo | Hoy | Accion | Verificacion |
| --- | --- | --- | --- |
| `src/assets/brands/logo_khatarsis.svg` | 578.351 B (182.334 B gzip); 3 `<path>`, sin base64 → el peso es data de paths | Optimizar con SVGO en configuracion conservadora (mantener `viewBox`, no tocar el `radialGradient`, precision alta, sin fusiones que alteren el dibujo). Si el resultado no convence: rasterizar a WebP al tamaño real de uso en la card | Comparar el render original vs. optimizado al tamaño de la card; si hay cualquier diferencia visible, no se reemplaza |
| `src/assets/brands/arqbs-logo-color.png` | 65.685 B | Convertir a WebP/AVIF conservando dimensiones y alpha | Comparacion visual + bytes |

- Requiere herramienta externa (`svgo`/`cwebp`/`sharp`) → autorizacion explicita al ejecutar.
- Si no hay herramienta disponible o el resultado no es indistinguible, **se deja como esta** y se
  reporta (no se inventa una version "aproximada").
- `src/assets/logo/logo-script-v4.png` **no se toca**: es el respaldo declarado del
  `apple-touch-icon` (`portfolio-about-contact-footer-logo-map`).
- **Impacto visual esperado:** ninguno (con verificacion por pixel obligatoria).

### A6 — `<video>` del trailer (edit; re-encode = decision D3)

- `src/views/ViceCityView.vue:30`: agregar `preload="metadata"` al `<video>` (se conserva `:src`,
  `ref`, `class`, `playsinline`, sin `muted`). Hoy no declara `preload`, o sea que el navegador
  decide; `metadata` evita que se tire a descargar 250 MB y **no cambia lo que se ve**.
- **No se agrega `poster`** en este corte: un poster se ve antes del primer frame y el trailer
  arranca solo (ADR-010), asi que introduciria un parpadeo visible.
- El peso del archivo (262.477.133 B, 250 MB, 20,7 Mbps; `dist/` = 253 MB) **no es publicable con
  criterio**: o se re-encodea (CRF + `+faststart`, o VP9/AV1) o se saca del bundle. Es decision
  (D3) porque cambia el activo y necesita ffmpeg.
- **Impacto visual esperado:** ninguno con `preload`; el re-encode queda fuera hasta D3.

### B2 — El documento declara el idioma equivocado (edit)

Hoy `index.html` es `<html lang="es" class="dark">` y **nada lo actualiza**: el unico lugar que toca
`document.documentElement` es `useTheme.ts:13` (clase `dark`). Con el sitio en ingles, `<html lang>`,
`<title>` y la meta description siguen en español.

- `src/i18n/locales/es.ts`: agregar `meta: { title: 'César Andrés Ríos Valencia — Desarrollador Full Stack' }`
  (el mismo texto que hoy tiene `index.html` → en español no cambia nada visible ni de SEO).
- `src/i18n/locales/en.ts`: agregar `meta.title` traducido (`'César Andrés Ríos Valencia — Full Stack Developer'`).
- `src/main.ts`: junto al puente de idioma que ya existe (ADR-008, `watch(i18n.global.locale, ...)`),
  aplicar el idioma del documento: `document.documentElement.lang = value` y
  `document.title = i18n.global.t('meta.title')`, con `{ immediate: true }` para cubrir el arranque
  (el idioma inicial ya sale de `localStorage` de forma sincrona, antes del montaje).
  Sin archivo nuevo y sin composable nuevo: 3 lineas en el punto de composicion, que es donde el
  host ya mantiene sus puentes.
- **No se toca la meta description** de `index.html`: es del plan de SEO (`portfolio-seo-metadata.md`),
  y tocarla desde aca crearia dos duenos del mismo metadato.
- **Impacto visual esperado:** ninguno (cambia el idioma declarado y el texto de la pestaña).

### B3 — Typos del español (decision D1)

`src/i18n/locales/es.ts` (`hero.description`): "mucho **mas**" → "mucho más", "produccion" →
"producción", "código que **generan**" → "genera", "**lleve** a su punto" → "lleva". Es correccion de
copy (fuente de verdad): **cambia texto visible** (no layout) y por eso necesita tu OK. Si se
aprueba, el ingles no cambia (ya refleja el sentido).

### B4 — Codigo en español (edit; viola RULES 0.13)

`src/components/background/FaultyTerminalBackground.vue:1-6` tiene el bloque de cabecera en español.
Se traduce la prosa y **se conserva literal la parte legal** (atribucion y licencia del componente de
terceros):

```
<!--
  Animated background based on "FaultyTerminal" by vue-bits by David Haz.
  Copyright (c) 2025 David Haz — MIT + Commons Clause License Condition v1.0.
  In use in this portfolio since 2026.
  Permission to use, copy and modify as part of this website;
  selling or redistributing the component itself is prohibited.
-->
```

- **Impacto visual esperado:** ninguno (es un comentario).
- Revisado el resto de `src/`: no hay mas español fuera de los locales salvo `NavControls.vue:27`
  (`{ label: 'Español', value: 'es' }`, endonimo por decision previa: **no se toca**) y los datos
  muertos de B6.

### B6 — Exports muertos con contenido en español (decision D4)

`src/data/portfolio.ts` exporta `experiences`, `education`, `languages` e `interests` **sin ningun
consumidor** (grep sin usos fuera del propio archivo) y con contenido en español
(`'Ene 2022 - Feb 2024'`, `'Técnico en Programación de Software'`, `'Español'`/`'Nativo'`). Es deuda
ya documentada (`portfolio-about-contact-footer-logo-map` los conservo a proposito;
`portfolio-navbar-i18n-contact-responsive-scale` R5 la dejo abierta). Salidas: **eliminarlos**
(requiere aprobacion explicita, RULES 0.2) o cablearlos con i18n si vas a montar la seccion. No se
hace nada sin tu decision.

## Restricciones

- **Neutralidad visual** (regla vinculante de arriba) por encima de todo lo demas.
- `.agents/RULES.md` 0.1 Git sin solicitud, 0.2 no eliminar archivos sin aprobacion (B6), 0.3 un
  componente principal por requerimiento (no se crean componentes ni composables nuevos), 0.4 scripts
  bloqueados, 0.6 cero duplicacion, 0.9 no inventar cambios de stack, 0.12 ADR para decisiones de
  arquitectura, 0.13 codigo 100 % en ingles.
- `.agents/CODING_STANDARDS.md` §1 (orden de bloques del SFC), §2 (identificadores en ingles;
  plantillas en kebab-case), §3 (contratos tipados; textos solo en i18n), §4 (sin `console.log` de
  debug; degradacion silenciosa documentada solo en efectos decorativos), §5 (la verificacion real es
  `lint:check` + `format:check` + `build` + revision en pantalla; **no hay suite de tests y no se
  inventa una**), §7 (las 6 reglas de Tailwind: cero margenes, sin `width/height` fijos donde hay
  medidas flexibles, `min-w-0` justificado, tipografia heredada intacta, sin valores `[...]`,
  Tailwind-first con `@apply`).
- `.agents/DESIGN.md` §1 (patron de estado: composable de modulo; aca ni siquiera hace falta), §3
  (medir antes de ajustar; todo activo que empuje el presupuesto se justifica), §5 (el fallo de la
  libreria no se parchea desde este repo).
- Sin secretos, sin dependencias nuevas (A4 se rechaza en este corte), sin tocar el copy fuera de B3.

## Steps

1. **read** `src/main.ts`, `src/router/index.ts`, `src/components/about/MapCard.vue`,
   `src/views/ViceCityView.vue`, `src/i18n/locales/es.ts`, `src/i18n/locales/en.ts`, `index.html`,
   `src/components/background/FaultyTerminalBackground.vue` y `.agents/DESIGN.md` §3 (confirmar que
   no cambiaron desde el 2026-09-18 20:56).
2. **edit** A2 `src/router/index.ts`: fuera el import estatico de `ViceCityView`; la ruta `/vicecity`
   con `component: () => import('@/views/ViceCityView.vue')`.
3. **edit** A3 `src/components/about/MapCard.vue`: `import type { Map } from 'leaflet'` (solo tipos),
   `let map: Map | null = null`, y dentro de `onMounted` (ahora `async`) `const L = await
   import('leaflet')` + `await import('leaflet/dist/leaflet.css')` antes de crear el mapa.
4. **edit** B2 `src/i18n/locales/es.ts` y `en.ts`: agregar `meta.title` (paridad exacta).
5. **edit** B2 `src/main.ts`: aplicar `document.documentElement.lang` + `document.title` desde i18n
   con `{ immediate: true }`.
6. **edit** A4 `index.html`: `<link rel="preconnect" href="https://api.iconify.design" />`.
7. **edit** B4 `src/components/background/FaultyTerminalBackground.vue`: traducir el bloque de
   cabecera conservando la parte legal literal.
8. **edit** A6 `src/views/ViceCityView.vue`: `preload="metadata"` en el `<video>` (sin `poster`).
9. **edit** B3 (solo si D1 se aprueba) `src/i18n/locales/es.ts`: los 4 typos.
10. **edit** B6 (solo si D4 se aprueba) `src/data/portfolio.ts`: eliminar los exports muertos y sus
    interfaces sin consumidor.
11. **edit** A5 (si hay herramienta y D5 lo incluye): optimizar los 2 assets con verificacion por
    pixel.
12. **edit** `.agents/DESIGN.md` §3: presupuesto con las cifras nuevas (crudo + gzip), su fecha y si
    el cambio vino de este repo o de la libreria.
13. **create** ADR si el corte fija una decision de arquitectura. Candidato: "el idioma del documento
    y el `<title>` siguen al locale desde el punto de composicion" + "las secciones fuera de la
    entrada se cargan por import dinamico". Regla 0.12.
14. **Verificacion** (seccion siguiente) y registro real en "Registro De Ejecucion".

## Casos de verificacion (todos obligatorios antes de reportar)

| # | Caso | Se espera |
| --- | --- | --- |
| 1 | Arranque en `/` en ES y en EN | Misma pintura que hoy; `lang` y `<title>` correctos en cada idioma |
| 2 | Cambio de idioma con el selector (navbar y drawer) | El sitio cambia de copy como hoy y el documento queda con el idioma elegido |
| 3 | Scroll rapido y lento hasta About | El mapa aparece identico (altura, pin, `recenter`, `z-index`), sin frame sin estilos |
| 4 | Navegacion por las 4 secciones y footer | Idem a hoy (reveals, blur, cards, chips, botones, tooltips) |
| 5 | Truco `vicecity` + `Enter`, y deep-link `/vicecity` | Panel + sonido, 3 s de ruido, trailer arranca al desaparecer el ruido (ADR-010 intacto) |
| 6 | Drawer en movil (<640 px) | Abre, cierra por item/tema/idioma y por `Esc` |
| 7 | Tema claro y oscuro | Idem a hoy en las 4 secciones |
| 8 | Consola del navegador | Sin errores nuevos (incluido el aviso de chunk diferido) |

## Verificacion

- **Comandos** (requieren autorizacion explicita, RULES 0.4): `bun run lint:check`,
  `bun run format:check`, y `bunx vite build` como medicion interina mientras
  `bun run build` siga bloqueado por khatarsis (`vue-tsc` con los 2 errores TS2345 de `main.ts`).
- **Medicion** (mismo metodo que el baseline): bytes crudos y gzip de `index-*.js`, `index-*.css`,
  los chunks nuevos de A2/A3, los 2 assets de A5 y el `dist/` total. Se registra el delta real; si
  un numero no baja, se dice.
- **Estatica:** `grep` sin `app.use(khatarsis)` solo si A1 se ejecuto (si no, se conserva);
  `grep` de imports dinamicos ≥ 2; `grep` sin español fuera de `src/i18n/locales`; paridad de claves
  `es`/`en` (mismo arbol, mismos arrays); 0 valores `[...]`, 0 `m-*`, 0 `console.log`.
- **Manual:** los 8 casos de la tabla de arriba, con el mismo ancho, tema y seccion antes/despues.
- **Publicacion (criterio de "build publicable"):** ver seccion siguiente.

## Criterio De Build Publicable

El build queda publicable cuando se cumplen las cuatro condiciones:

1. **Este plan ejecutado** (rendimiento neutro + `lang`/`title` correctos + higiene de idioma).
2. **`portfolio-seo-metadata.md` ejecutado** (PENDING, con su propia compuerta): robots, sitemap,
   canonical, Open Graph, Twitter Card, JSON-LD, `theme-color`, manifest, `width`/`height` (CLS) y
   su decision D1 (dominio de produccion), que es la que habilita canonical/`og:url`/sitemap reales.
   **Los dos planes se complementan; ninguno duplica al otro** (`PLANS.md` prohibe duplicar).
3. **Handoff de khatarsis resuelto** (Frente D): sin eso, `bun run build` no pasa y no hay artefacto
   publicable verificable.
4. **Peso del trailer decidido** (D3): publicar un `dist/` de 253 MB por un huevo de pascua no es
   una decision tecnica defendible; hay que re-encodear o servirlo fuera del bundle.

Complementos declarados fuera del repo (no se ejecutan aca): compresion gzip/brotli y HTTPS en el
host, y el alta en Google Search Console con el sitemap.

## Decisiones Abiertas

> **Estado al 2026-09-18 21:15:** D1 **aprobado y ejecutado** (*"b3 autorizo"*); D2 **resuelto** a
> favor de no bundlear (solo `preconnect`, ya aplicado); D5 **ejecutado** en su parte neutral (A2, A3,
> A4, A5 parcial, A6, B2, B3, B4). Siguen abiertas: D3 (peso del trailer), D4/B6 (exports muertos) y
> D6 (fusionar el plan de SEO).

| # | Decision | Recomendacion |
| --- | --- | --- |
| D1 | B3: corregir los 4 typos del español en `hero.description` | Si (cambia texto, no layout) |
| D2 | A4: bundlear sets de iconos para cortar la dependencia de la API de terceros | No (pesa mas que los ~15 iconos on-demand); solo `preconnect` |
| D3 | A6: peso del trailer: re-encode con ffmpeg o salida del bundle | Re-encodear conservando resolucion (la alternativa es publicar 253 MB) |
| D4 | B6: eliminar los exports muertos de `portfolio.ts` o cablearlos con i18n | Eliminar los que no vas a usar (necesita tu aprobacion explicita) |
| D5 | Corte: ejecutar A2, A3, A4(preconnect), A5, A6(preload), B2, B3, B4 ahora y dejar A1/B6/D3 para despues | Si; A1 no puede ejecutarse hasta que khatarsis publique los tokens |
| D6 | Fusionar el alcance del plan de SEO en este para tener un unico plan de publicacion | No: `PLANS.md` prohibe duplicar y ese plan ya tiene su auditoria; se ejecutan los dos antes de publicar |

## Frente D — Handoff a khatarsis (externo; resumen para pasar al agente de la libreria)

> **No se ejecuta desde este repo** (`DESIGN.md` §5). Es el unico bloqueante de `bun run build` y, a
> la vez, la llave del mayor win de rendimiento (A1).

**Defectos ya reportados (2026-09-18):**

1. **Dos copias de los tipos de Vue** en la misma compilacion → 2 errores TS2345 en
   `src/main.ts:13` (`app.use(khatarsis)`) y `:18` (`provideKhatarsisLocale`) del consumidor. Los
   `.d.ts` de la libreria resuelven `vue` contra el `node_modules` de su propio repo
   (`.bun/@vue+runtime-core@3.5.32`) porque el dependency es un symlink y TypeScript sigue el
   realpath. `plugins/khatarsis.d.ts` (`Plugin`) y `composables/useKhatarsisLocale.d.ts` (`App`) son
   los archivos que lo disparan. Debe haber **una sola** copia de Vue en el consumidor.
2. **57 de los 110 `.d.ts` publicados** importan con el alias interno `@/...` (en el consumidor ese
   alias apunta a **su** `src`, sin `src/types`) → los tipos degradan a `any` en silencio.
3. **Faltan archivos que importa el entry de tipos:** `dist-types/public/public.d.ts` importa
   `./locales/en.json`, `./locales/es.json` y `./style.css`, y ninguno existe en `dist-types/public/`.
4. **`tests/consumer/` es ciego a 1 y 2** (no tiene Vue propio y usa `skipLibCheck: true`).

**Defectos nuevos que este enrichment agrega:**

5. **Los tokens `--variant-*` solo existen en runtime.** `generateVariantStyles` (llamado desde
   `plugins/khatarsis.ts` y desde `plugins/i18n.ts`) inyecta un `<style data-variant-tokens>` con
   `.base`, los cromaticos y sus flips `.dark`; el CSS publicado **no los contiene** (0 ocurrencias).
   Consecuencias: (a) el consumidor **no puede** dejar de usar `app.use(khatarsis)` sin perder los
   colores de las variantes → hoy es imposible tree-shakear la libreria (`Heatmap`, `Carousel`,
   `TablePaginator`, `UploadFile`, `Calendar`, `Doughnut` terminan en el chunk de un sitio que usa 8
   componentes); (b) hay CSS critico inyectado por JS (parpadeo potencial y dependencia de que el
   plugin corra). **Pedido:** emitir esos tokens en el CSS del paquete en `build:public` (o exponer
   `generateVariantStyles` en el entry publico) para que el consumidor pueda registrar componentes
   por nombre sin perder las variantes.
6. **El CSS publicado es un build completo de Tailwind** (`khatarsis.css`, 348.981 B), la causa raiz
   de ADR-004 en este repo; su plan B documentado es publicarlo sin las utilidades o dentro de
   `@layer components`.

**Criterios de aceptacion:** consumidor externo con su propia Vue typechequea sin error; ningun
`.d.ts` publicado importa via `@/`; los archivos que importa `public.d.ts` existen; `build:types` +
`build:public` + `verify:exports` + `verify:consumer` (endurecido: Vue propio, `skipLibCheck: false`,
uso real de `app.use` + `provideKhatarsisLocale`, y fallo si algun `.d.ts` publicado contiene `'@/'`)
en verde; tokens de variante disponibles sin depender del plugin; sin cambio de API publica.

**Verificacion desde nuestro lado (sin tocar el portafolio):** `bun run build` en
`C:/Users/s0rno/OneDrive/Documents/portfolio` → despues del arreglo, `vue-tsc -b` en verde; y al
ejecutar A1, el chunk de arranque debe dejar de contener los componentes no usados.

## Baseline Medido (2026-09-18 sobre `dist/` del build del 2026-09-16)

| Activo | Crudo | gzip |
| --- | --- | --- |
| `index-*.js` (**un solo chunk**) | 1.038.068 B | 337.267 B |
| `index-*.css` | 402.454 B | 50.073 B |
| `logo_khatarsis-*.svg` | 578.351 B | 182.334 B |
| `arqbs-logo-color-*.png` | 65.685 B | — |
| `red-brilla-logo-*.svg` | 25.014 B | — |
| `vc-*.mp4` | 262.477.133 B | — |
| `dist/` completo | 253 MB | — |

## Riesgos

1. **R1 — A3 deja un frame sin CSS de Leaflet** (el mapa se ve roto un instante). Mitigacion: el
   `await` del CSS ocurre antes de crear el mapa; caso 3 de verificacion con scroll rapido y lento.
   Si se ve cualquier parpadeo, se revierte A3 (es un cambio de 3 lineas) y se reporta.
2. **R2 — B2 publica un `<title>` distinto** en el idioma equivocado si el watch no cubre el
   arranque. Mitigacion: `{ immediate: true }` + caso 1 de verificacion en ES y EN.
3. **R3 — A5 cambia el dibujo del SVG** (gradiente o precision de paths). Mitigacion: comparacion por
   pixel obligatoria; si hay diferencia visible, no se reemplaza.
4. **R4 — A2 cambia el momento de carga del trailer** y podria afectar el arranque de ADR-010 en red
   lenta. Mitigacion: caso 5 de verificacion (truco y deep-link).
5. **R5 — El baseline deja de ser comparable** si el `dist` de khatarsis cambia entre mediciones.
   Mitigacion: registrar fecha y hash del activo medido, y no atribuir a este plan ninguna mejora que
   venga de la libreria.
6. **R6 — A1 no se puede ejecutar** y el win mas grande queda esperando a khatarsis. Mitigacion:
   declarado en el criterio de publicacion (condicion 3); no se compensa duplicando tokens en el repo.

## Relacion Con Planes Y ADR Previos

- **No duplica** `portfolio-seo-metadata.md` (PENDING; S1–S12 y D1–D5 mantienen su dueno).
- **Recoge deuda documentada**: `portfolio-navbar-i18n-contact-responsive-scale` R5 (exports muertos)
  y `portfolio-about-contact-footer-logo-map` (assets de marca y el PNG de respaldo).
- **Respeta** `portfolio-navbar-icons-scroll-blur-xs` y `portfolio-hero-social-glitch` (iconos
  on-demand como decision consciente → A4 se rechaza con numeros, no por descuido).
- **Depende** de que khatarsis resuelva el Frente D para cerrar con `bun run build`.
- **ADR vigentes:** 001 (Lenis), 002 (router/vistas), 004 (cascada CSS de khatarsis), 009/010 (truco y
  trailer) siguen intactos; cualquier decision nueva se registra como ADR adicional, nunca editando
  uno existente.

## Ejecutado Fuera De Este Plan (flujo simple, pedido explicito del usuario)

- **2026-09-18 — Sincronizacion ES→EN del copy.** Pedido: *"asegurate que lo escrito en español este
  tal cual el mismo contenido pero traducido en ingles, el español es fuente de verdad"*. Paridad
  verificada de `src/i18n/locales/es.ts` y `en.ts` (45 claves por lado, misma estructura, mismos
  arrays) con **un unico desfase real**: `hero.description`, donde el ingles traducia una version
  vieja del español (parafraseaba los casos de uso, omitia "y mucho mas" y arrastraba una oracion
  entera sin contraparte: *"I'm currently building two libraries of my own..."*). Se reescribio
  `en.hero.description` espejando el español en 3 oraciones. Verificacion: paridad 45/45, 3
  oraciones por lado; `lint:check`/`format:check`/`build` no se ejecutaron por no estar autorizados
  para ese cambio. Cambio de 1 archivo con pedido explicito → flujo simple; no cambia el estado de
  este plan.

## Cierre (memoria persistente)

> `EXECUTED`. La verificacion automatica y funcional ya esta hecha y documentada arriba; falta tu
> revision visual en pantalla (doctrina del repo: el DoD de un cambio visual no se cumple con
> "deberia verse igual") para autorizar `CLOSED`.

- **Que cambio:** el portafolio deja de pagar en el arranque cosas que no necesita y pasa a declarar
  el idioma que el usuario lee. La ruta del truco entra por `import()` dinamico y Leaflet (con su
  CSS) se carga dentro del `onMounted` del mapa; el chunk de entrada baja **-33 %** (-339.277 B crudo,
  -112.933 B gzip) y el arranque completo (JS+CSS) -24,6 % crudo / -30,8 % gzip, con chunks propios
  para `leaflet` (148.731 B + 15.095 B de CSS) y `ViceCityView` (475 B). El logo de Business Suite
  pasa a WebP **lossless** (65.685 B -> 31.078 B, -53 %, mismos pixeles y mismas dimensiones). Se
  agrega un `preconnect` a la API de iconos. En idioma: clave nueva `meta.title` (es/en), `lang` y
  `<title>` siguen al locale desde `src/main.ts` (junto al puente de ADR-008), los 4 typos del
  español quedan corregidos y el comentario de `FaultyTerminalBackground.vue` pasa a ingles
  (RULES 0.13). Todo el diseno visual y el `showcase` quedan intactos: mapa, secciones, drawer, tema,
  glitch, CRT y truco verificados en el navegador.
- **Verificacion:** `lint:check` exit 0; `format:check` en verde; `vue-tsc -b` solo con los 2 errores
  externos de khatarsis (0 nuevos); `vite build` exit 0 con la tabla de tamanos antes/despues; y
  revision funcional en el navegador con los 7 casos de la tabla (arranque ES/EN, mapa con tiles y
  CSS, WebP con dimensiones reales, deep-link diferido con trailer, truco con su gating de 3 s y
  consola sin errores propios).
- **Resultado:** corte neutral aprobado y medido; A1 queda en el handoff (el usuario optimiza
  khatarsis), A5 a medias (PNG->WebP hecho, SVG pendiente de SVGO) y B6/D3 sin autorizacion.
- **Pendientes:** (1) tu revision visual en pantalla, que autoriza `CLOSED`; (2) `logo_khatarsis.svg`
  (578.351 B) con SVGO o rasterizado, con verificacion por pixel; (3) D3: decidir el peso del trailer
  (250 MB; `dist/` = 253 MB no es publicable con criterio); (4) `bun run build` sigue bloqueado por
  los 2 errores externos de khatarsis y la configuracion del repo no se toca por eso (RULES 0.9,
  `DESIGN.md` §5); (5) B6 (exports muertos de `portfolio.ts`) si lo apruebas; (6) el plan
  `portfolio-seo-metadata.md` sigue en `PENDING` y es condicion de publicacion junto con este; (7)
  ADR-011 queda en `proposed` hasta la confirmacion visual, y el `[Vue warn] inject()` preexistente
  queda como observacion sin tocar.
