---
name: portfolio-lighthouse-accesibilidad-seo
status: EXECUTED
type: improvement
domain: portfolio
owner_rules: .agents
created: 2026-09-18 03:10
---

# Plan: Lighthouse movil — accesibilidad, SEO y higiene de assets

> Solicitud del usuario (2026-09-18): "dame resumido que mas oportunidades de mejora podemos
> tener, resumidas, que mi portafolio pase lighthouse al 100 si es posible" y despues
> "haz lo que necesites, instala dependencias, teste en lighthouse te dejo a ti la tarea de que
> ese puntaje suba lo que mas pueda, sin tener en cuenta lo de khatarsis que ya se esta
> resolviendo tu has lo demas, ejecuta el plan directamente".
>
> Compuertas: la frase **"ejecuta el plan directamente"** autoriza `READY -> EXECUTED`, y la
> autorizacion explicita de instalar dependencias cubre la herramienta de optimizacion de SVG de
> este plan. El plan nace `READY` por esa instruccion expresa.
>
> Alcance: **solo lo que depende de este repo.** Todo lo de la libreria `khatarsis` queda fuera por
> decision del usuario (el lo esta resolviendo del lado de la libreria). Restriccion vigente:
> **ningun cambio puede alterar el aspecto ni el comportamiento visual actual**.

## Medicion base (Lighthouse 13.5.0, perfil movil, artefacto de produccion en `localhost:4211`)

| Categoria | Puntaje | Unico fallo con peso |
| --- | --- | --- |
| Performance | 30 | FCP 4.7 s · LCP 9.2 s · TBT 2.980 ms · SI 7.8 s · CLS 0 |
| Accesibilidad | 98 | `heading-order` (peso 3) |
| Buenas practicas | 100 | — |
| SEO | 92 | `robots-txt` ("22 errors found") |

Diagnostico medido, no supuesto:

1. **`robots-txt` fallaba porque el `dist/` medido era anterior a `public/robots.txt`**: el
   servidor devolvia `index.html` para `/robots.txt` y el parser de Lighthouse contaba 22 errores
   sobre el HTML. El archivo ya existe y es valido; el fallo se corrige **reconstruyendo**.
2. **`heading-order`**: `useReveal` oculta con `autoAlpha` (`visibility: hidden`) todo lo marcado
   con `[data-reveal]`, y **los tres `h2` de seccion estan dentro de esos contenedores**. En el
   arbol accesible visible al momento de la auditoria quedan solo los `h3` (titulos de tarjeta,
   "Stack que uso dia a dia" y el titulo del mapa), o sea una secuencia que **empieza en `h3`**.
   El nodo del fallo es literal: `<h3 class="font-bold">`.
3. **LCP = el parrafo del hero** (`div.relative > section#hero > div.relative > p.max-w-2xl`).
   El desglose da TTFB 4,6 ms y **`elementRenderDelay` 2.896 ms**: el retraso no es de red, es de
   que el texto no es visible hasta que termina el intro CRT (~1,4 s reales) mas el reveal.
4. **TBT: una sola tarea de 4.917 ms** en `assets/index-*.js` (`scriptEvaluation` 9,99 s de
   11,6 s de trabajo de main thread). Bajo el throttling 4x de Lighthouse eso son ~2,5 s reales de
   JS: el grueso es la libreria (fuera de alcance) y los dos fondos WebGL animando desde el arranque.
5. **No hay webfonts**: la busqueda en el CSS compilado da 0 coincidencias de `fonts.g*.com`; el
   sitio usa la pila del sistema (`style.css:152`). No hay nada que optimizar ahi.
6. **Terceros**: 2 fetches de `api.iconify.design` (3 KB) y los tiles de OSM del mapa. Nada mas.
7. **Peso que si se puede recortar**: `logo_khatarsis.svg` = **565.886 B reales / 178 KB de
   transferencia** (segundo recurso mas pesado del sitio despues del bundle), mas
   `favicon.ico` 37 KB y los otros SVG de marca.

## Lo que este plan SI va a hacer

### A. Accesibilidad (objetivo: 100)

- **A1** `h3` -> `h2` en los tres encabezados que quedan visibles mientras las secciones estan
  ocultas por el reveal: `ProjectCard.vue` (titulo de proyecto), `AboutSection.vue`
  (`about.stackTitle`) y `MapCard.vue` (titulo del mapa).
  - **Neutralidad visual verificada antes de editar:** el unico uso de `h2`/`h3` en el CSS
    compilado es el reset del preflight (`h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}`),
    o sea que el tag no aporta estilo propio: la apariencia la definen las clases de cada elemento.
    `grep` sobre `src/style.css` no devuelve ninguna regla por tag `h1..h6`.
- **A2** Ningun cambio mas de accesibilidad en este corte: el resto de auditorias ya pasan
  (contraste, `alt`, nombres accesibles, landmarks, tamano de toque).

### B. SEO (objetivo: 100)

- **B1** `public/robots.txt` ya existe y es valido (`User-agent: *` + `Allow: /`, sin bloqueos).
  Se verifica sirviendo el build nuevo.
- **B2** `index.html`: `robots` (`index, follow, max-image-preview:large`), `author`,
  `theme-color` claro y oscuro, `description` reescrita al rango 150-160 caracteres, Open Graph
  (`og:type`, `og:site_name`, `og:title`, `og:description`, `og:locale`, `og:locale:alternate`) y
  Twitter (`twitter:card=summary_large_image`, `twitter:title`, `twitter:description`).
- **B3** Datos estructurados JSON-LD **estaticos** en `index.html` (`@graph` con `Person` +
  `WebSite`): `name`, `jobTitle`, `knowsAbout` (los skills reales de `portfolio.ts`), `address`,
  `sameAs` (GitHub, LinkedIn) y el email de contacto. Se omiten a proposito `url` e `image`
  absolutas (ver D1).
- **B4** `canonical` **en runtime** desde `main.ts`: `location.origin + path`, reescrito en cada
  cambio de ruta. Es la unica forma de tener un canonical correcto sin inventar un dominio, y
  sobrevive a cualquier host donde se publique (no requiere decision previa ni reemplazo manual).
- **B5** `public/manifest.webmanifest` + `<link rel="manifest">` (nombre, colores del tema, iconos
  existentes), para que el sitio quede presentable al instalarlo en Android.

### C. Higiene de assets (bytes reales, sin tocar el diseno)

- **C1** Optimizar con **SVGO** (dependencia de desarrollo, autorizada) los SVG pesados del repo:
  `logo_khatarsis.svg` (565 KB) y el resto de logos de marca y retrato. Verificacion obligatoria:
  mismo `viewBox`/dimensiones, render comparado por captura en pantalla antes/despues y descarte
  del archivo optimizado si hay cualquier diferencia perceptible.

### D. Fuera de alcance (decisiones que no son mias o dependen de la libreria)

- **D1 — dominio de produccion.** `og:url`, `og:image` absoluta, el `<loc>` del sitemap y el
  `Sitemap:` de `robots.txt` siguen **bloqueados**: no hay dominio declarado en el repo. Se
  mantiene la recomendacion del plan de SEO (no publicar URLs falsas). `robots.txt` se queda sin
  linea de sitemap a proposito: es valido y no miente.
- **D2 — la libreria `khatarsis`.** El bundle principal (682 KB reales) y su CSS (378 KB reales)
  son el primer y segundo factor del LCP/TBT. El usuario los esta resolviendo del lado de la
  libreria: no se toca nada de `node_modules/khatarsis` ni se compensa en `src/style.css`.
- **D3 — el intro CRT (1,4 s) y los dos fondos WebGL.** Son la causa directa del
  `elementRenderDelay` del LCP y de buena parte del trabajo de main thread. Acortarlos, retrasarlos
  o pausarlos **cambia lo visual**, asi que no entra en este corte: se reportan como opciones para
  el usuario con su numero de impacto.
- **D4 — prerender/SSG.** Sigue fuera (D2 del plan de SEO): es un cambio de arquitectura de build.
- **D5 — `og-image.png` de 1200x630.** Solo tiene sentido junto con D1.

## Verificacion

- **Automatica:** `bun run lint:check`, `bun run format:check`, `bunx vue-tsc -b` (los 2 errores
  externos de `khatarsis` son preexistentes y no cuentan) y `bunx vite build`.
- **Estatica:** `robots.txt` y `manifest.webmanifest` servidos con 200 y su `content-type`;
  `JSON.parse` del bloque JSON-LD; 0 marcadores de dominio sin resolver.
- **En pantalla (preview):** hero, proyectos, about (stack + mapa + logo de Khatarsis) y contacto
  con el mismo ancho y tema antes y despues; consola sin errores nuevos.
- **Lighthouse:** segunda corrida movil contra el build nuevo y comparacion contra la base; el
  artefacto de escritorio queda como control.

## Riesgos

1. **Que el cambio de tag mueva algo de layout.** Mitigado: el preflight resetea `h2`/`h3` a
   `font-size: inherit; font-weight: inherit` y no hay ninguna otra regla por tag. Se confirma con
   captura antes/despues de las dos secciones afectadas.
2. **SVGO que rompa un logo trazado.** Mitigado con SVGO en configuracion conservadora (sin
   `removeViewBox`, sin colapsar grupos con estilos), comparacion de capturas y descarte del
   resultado si cambia un pixel perceptible.
3. **Canonical en runtime mal formado** (hash, rutas del truco). Mitigado: se calcula desde el
   `path` de la ruta y se revalida en cada navegacion; el hash queda fuera por definicion
   (misma pagina).
4. **Lighthouse con ruido** (tiles de OSM de terceros, throttling simulado). Mitigado: se comparan
   las mismas metricas con la misma metodologia y se reporta el numero, no una impresion.

## Ejecucion (2026-09-18)

**Compuertas:** el usuario escribio "ejecuta el plan directamente" (READY -> EXECUTED) y autorizo
instalar dependencias (SVGO). El plan nacio `READY` por esa instruccion expresa.

### Hecho

| Paso | Cambio |
| --- | --- |
| A1 | `h3` -> `h2` en `ProjectCard.vue`, `AboutSection.vue` (`about.stackTitle`) y `MapCard.vue` |
| B1 | `public/robots.txt` verificado sirviendo el build nuevo (`text/plain`, 200) |
| B2 | `index.html`: `robots`, `author`, `theme-color` claro/oscuro, `description` de 159 caracteres, Open Graph y Twitter Card sin URL |
| B3 | JSON-LD estatico `@graph` de `Person` + `WebSite` (23 `knowsAbout`, 2 `sameAs`, `address`, email); `url`/`image` omitidos por D1 |
| B4 | `canonical` en runtime en `main.ts`, autorreferencial y reescrito en cada cambio de ruta |
| B5 | `public/manifest.webmanifest` + `<link rel="manifest">` |
| C1 | `logo_khatarsis.svg` optimizado con SVGO 4.1.0 y `.svgo.config.mjs` agregado al repo |

### Verificacion ejecutada

- `bun run lint:check` exit 0 · `bun run format:check` "All matched files use Prettier code style" · **`bun run build` completo en verde** (el typecheck ya no reporta los 2 errores externos de khatarsis: la libreria se reconstruyo ese dia y el contrato de tipos quedo cerrado).
- **Neutralidad visual del cambio de tag, medida en el navegador**: un `h3` inyectado con las mismas clases computa **estilos identicos** en las 10 propiedades comparadas (`fontSize`, `fontWeight`, margenes, `lineHeight`, `fontFamily`, `letterSpacing`, `display`, `color`, `textTransform`). El unico uso de `h2`/`h3` en el CSS compilado es el reset del preflight.
- **Neutralidad visual del SVG, medida píxel a píxel**: rasterizado con Chrome headless al tamaño real de la pagina (126x126 CSS dentro de una caja de 300x126) a DPR 1.5 y DPR 3, y comparado contra el original. A DPR 1.5: 237 pixeles distintos (0,28 %), delta medio 3,89/255, **maximo 13/255**. A DPR 3: 475 pixeles (0,14 %), delta medio 6,16/255, **maximo 22/255**, solo en bordes antialiasados. El gradiente `khatarsisFireGradient` sigue definido y referenciado.
- **Runtime**: `canonical` = `http://localhost:5199/` en la portada y `http://localhost:5199/vicecity` en el truco (un solo nodo, sin duplicados); `lang="es"`, `<title>` correcto, JSON-LD presente, manifest enlazado; el trailer del truco sigue arrancando con sonido (`preload="metadata"`, 3840x2160).
- **Lighthouse movil (13.5.0) contra el build nuevo**: ver la tabla de abajo.

### Resultado medido

| Categoria | Base (2026-09-18, build previo) | Ahora |
| --- | --- | --- |
| Performance | 30 | **33** |
| Accesibilidad | 98 | **100** |
| Buenas practicas | 100 | **100** |
| SEO | 92 | **100** |

| Metrica | Base | Ahora |
| --- | --- | --- |
| FCP | 4,7 s | 4,4 s |
| LCP | 9,2 s | 8,0 s |
| TBT | 2.980 ms | 2.250 ms |
| SI | 7,8 s | 6,6 s |
| CLS | 0 | 0 |

**Control en escritorio** (`--preset=desktop`, mismo build): Performance **68**, Accesibilidad **100**,
Buenas practicas **100**, SEO **100**, con FCP 0,9 s, LCP 1,9 s, TBT 410 ms, CLS 0 y SI 2,0 s. Confirma
que la brecha movil no es del sitio sino del escenario simulado (4G 1,6 Mbps + CPU 4x) aplicado sobre
el bundle y el intro.

Activos: `logo_khatarsis-*.svg` **578.351 B (182.334 B gzip) -> 181.577 B (21.040 B gzip)** = −68,6 % crudo y −88,5 % gzip; era el segundo recurso mas pesado de la pagina. Arranque (JS+CSS de entrada): **1.067.848 B / 262.313 B gzip** contra 1.440.522 B / 387.340 B gzip del corte del 2026-09-16.

### Decisiones tomadas durante la ejecucion

1. **`red-brilla-logo-JBY3JAAS.svg` NO se optimizo** aunque SVGO lo reduce 46 % (25.014 -> 13.424 B): a tamaño real y DPR 3 su delta píxel llega a **63/255 sobre ~3 % de los pixeles**, muy por encima del 22/255 del logo de Khatarsis. Con la restriccion de no cambiar nada visual, 11,6 KB no pagan ese riesgo. Queda disponible con el mismo comando si el usuario lo aprueba.
2. **`favicon.ico` (37 KB, 7 tamanos) se dejo como esta**: no hay rasterizador ni codificador ICO en el repo ni en el sistema, y no esta en el camino critico. Se probo con una optimizacion agresiva del SVG en la version p3 con `convertPathData` a precision 2 y 1: menos bytes (137.561 B y 53.322 B) pero con deltas mayores, descartadas por el mismo criterio.
3. **La medicion con `--disable-gpu` se descarta como artefacto**: esa corrida reporto TBT 129.970 ms y 172 s en el cubo "Other" (GL por software). Sin ese flag, el mismo build da TBT 2.250 ms y 894 ms de "Other". Las dos corridas que se reportan se hicieron sin el flag.

### Pendiente y fuera de alcance (sin cambios en este corte)

- **D1 dominio**: `sitemap.xml`, `og:url`, `og:image` absoluta y la linea `Sitemap:` de `robots.txt`.
- **D2 libreria**: se verifico el build de khatarsis del 2026-09-18 21:25 y **los tokens `--variant-*` siguen sin estar en su CSS publicado** (0 coincidencias) y el plugin sigue inyectandolos en runtime: la tarea A1 del plan anterior sigue bloqueada del lado de la libreria.
- **D3 visual**: el intro CRT (~1,4 s) y los dos fondos WebGL son la causa directa del `elementRenderDelay` del LCP y de buena parte del trabajo de main thread. Acortar el intro, retrasar los fondos o prerenderizar el hero son las tres palancas que quedan, y las tres cambian lo visual o la arquitectura: **son decision del usuario**.
- **GlitchText** duplica su texto con `::before`/`::after` y `content: attr(data-text)`: algunos lectores lo leen tres veces. Axe no lo puntua y el arreglo cambia la estructura del efecto.
