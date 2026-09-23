---
name: portfolio-seo-metadata
status: EXECUTED
type: improvement
domain: portfolio
owner_rules: .agents
created: 2026-09-11 12:21
---

# Plan: Auditoria y metadata / SEO real del portafolio

> Solicitud del usuario (2026-09-11), como ultimo paso tras ejecutar el mega plan:
> "ejecuta el plan auditoria matadata y seo de ultimo". Se pidio **primero la auditoria**;
> los cambios que salgan de ella se ejecutan bajo las compuertas de este plan.

## Objetivo

Pasar el sitio de "tiene un `meta description`" a un sitio indexable de verdad: metadata de
sitio completa, datos estructurados de persona, crawleabilidad (robots + sitemap) y las
etiquetas sociales para que el link se vea bien al compartirlo.

## Auditoria (medida el 2026-09-11 contra `index.html` y el DOM en runtime)

Criterio: la skill `.agents/skills/seo/SKILL.md` (checklist Critical / High / Medium).

### Lo que ya esta bien (no tocar)

| Item | Evidencia |
| --- | --- |
| `<title>` presente y con longitud sana | 53 caracteres (`César Andrés Ríos Valencia — Desarrollador Full Stack`), en el rango 50-60 |
| `<meta name="description">` unica | 142 caracteres; describe stack y rol |
| Jerarquia de encabezados | **un solo `H1`** (`¡Hola! Soy César Ríos`), luego `H2` en orden de pagina (`Proyectos` → `Perfil profesional` → `Contacto`) con sus `H3` debajo; no se salta ningun nivel |
| `lang` declarado | `<html lang="es">` |
| Viewport responsive | `width=device-width, initial-scale=1.0` |
| `rel="noopener"` en enlaces externos | **14/14** enlaces con `target="_blank"` lo tienen |
| URLs descriptivas | rutas reales `/`, `/projects`, `/contact`; sin parametros ni `?id=` |
| Imagenes con `alt` | logos de marca (`Softii`, `Brilla`, `Business Suite`, `Khatarsis`) y el retrato (`Retrato de César Ríos`) |

### Faltantes (por prioridad)

| # | Prioridad | Hallazgo | Evidencia medida |
| --- | --- | --- | --- |
| S1 | Critical | **No existe `robots.txt`** | `find` sobre `public/` solo devuelve `apple-touch-icon.png`, `favicon.ico`, `favicon.svg`; 0 coincidencias de `robots*` en el repo |
| S2 | Critical | **No existe `sitemap.xml`** | 0 coincidencias de `sitemap*` en el repo |
| S3 | High | **Sin `link rel="canonical"`** | `document.querySelector('link[rel="canonical"]')` → `false` |
| S4 | High | **Sin Open Graph** | 0 etiquetas `meta[property^="og:"]` (ni `og:title`, ni `og:description`, ni `og:image`, ni `og:url`, ni `og:type`) |
| S5 | High | **Sin Twitter Card** | 0 etiquetas `meta[name^="twitter:"]` |
| S6 | Medium | **Sin datos estructurados JSON-LD** | 0 `<script type="application/ld+json">`; un portafolio personal es el caso ideal de `schema.org/Person` |
| S7 | Medium | **Sin `theme-color`** | 0 `meta[name="theme-color"]`; el sitio tiene tema claro/oscuro con dos fondos marcados (`#fff` / negro) |
| S8 | Medium | **Imagenes sin `width`/`height`** | 0 de las 6 imagenes de contenido declara dimensiones → riesgo de CLS |
| S9 | Low | **`description` corta** | 142 caracteres contra el rango recomendado 150-160 |
| S10 | Medium | **Sin manifest web** | 0 `*.webmanifest`; hay `apple-touch-icon.png` pero ningun manifest que lo respalde en Android |
| S11 | Bajo/Informativo | **SPA sin contenido en el HTML inicial** | `#app` se hidrata en cliente; los crawlers modernos ejecutan JS, pero conviene evaluar prerender (ver D2) |
| S12 | Bajo/Informativo | **Sin `hreflang`** | El sitio tiene locales `es`/`en` pero el idioma es **estado de cliente**, no una URL por idioma, asi que `hreflang` no se puede declarar con honestidad hoy (ver D3) |

### Dato importante para el plan

**El dominio de produccion no existe en el repo.** `grep` sobre `README.md`, `package.json`,
`vite.config.ts` y `.agents/` no devuelve ninguna URL publicada (ni Vercel, ni Netlify, ni
GitHub Pages, ni un `CNAME`). `canonical`, `og:url`, `og:image` absoluta, el `<loc>` del
sitemap y el `Sitemap:` de `robots.txt` **necesitan ese dominio**; sin el, esos cinco puntos
no se pueden completar con valores reales y quedan bloqueados (decision D1).

## Cambios propuestos

### A. Crawleabilidad — `public/robots.txt` (create)

```
User-agent: *
Allow: /

Sitemap: <DOMINIO>/sitemap.xml
```

Sin bloqueos: el sitio no tiene areas privadas ni recursos que no deba crawlear (la skill
advierte explicitamente de no bloquear recursos necesarios para el renderizado).

### B. Mapa del sitio — `public/sitemap.xml` (create)

Tres `<url>` (las 3 rutas reales): `/` (`priority 1.0`), `/projects` y `/contact`
(`priority 0.8`, `changefreq monthly`). Solo URLs canonicas e indexables, como pide la skill.

### C. Metadata de sitio — `index.html` (edit)

- `link rel="canonical"` autorreferencial con el dominio (D1).
- `meta name="robots" content="index, follow, max-image-preview:large"`.
- `meta name="theme-color"` con `media="(prefers-color-scheme: light)"` y otro para `dark`
  (los dos fondos del sitio: blanco y negro), para que el chrome del navegador acompañe el tema.
- Open Graph (`og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:locale` con
  `es_CO`) y Twitter Card (`summary_large_image`).
- `og:image` y `twitter:image`: **`og-image.png` de 1200x630** generado desde el logo trazado
  (create en `public/`); sin el, el link compartido no muestra tarjeta.
- Reescritura de `description` a 150-160 caracteres (S9).
- `meta name="author"`.

### D. Datos estructurados — `index.html` (edit) o `src/composables/useStructuredData.ts` (create)

Un unico `<script type="application/ld+json">` con `@graph`:

- **`Person`**: `name`, `jobTitle` ("Desarrollador Full Stack"), `url`, `image`, `address`
  (`Yumbo`, zona metro de Cali, `CO`), `knowsAbout` (los skills de `portfolio.ts`),
  `sameAs` (GitHub, LinkedIn, WhatsApp desde `contact`) y `alumniOf` si se quiere desde el CV.
- **`WebSite`**: `name`, `url`, `inLanguage: es`.

Decision D4: inline en `index.html` (estatico, cero JS) o generado desde `portfolio.ts`
(una sola fuente de verdad, pero se sirve tras hidratar). Recomendado: **inline**, porque los
crawlers que no ejecutan JS lo leen igual y los datos cambian poco.

### E. Imagenes — `src/components/**` (edit) + `public/manifest.webmanifest` (create)

- `width`/`height` en las imagenes de contenido para eliminar el CLS que midio S8.
- Manifest minimo (`name`, `short_name`, `icons` incluyendo el `apple-touch-icon.png` y el SVG
  como `image/svg+xml`, `theme_color`, `background_color`, `display: standalone`).

## Decisiones abiertas (necesitan tu OK)

1. **D1 — el dominio de produccion.** Bloquea S1, S2, S3, S4 (`og:url`, `og:image` absoluta).
   Si todavia no esta publicado, las dos salidas honestas son: (a) dejarlo en un placeholder
   unico documentado (`https://example.com`) y reemplazarlo al publicar, o (b) dejar los campos
   que lo necesitan fuera del primer corte. **Recomendado (b)**, para no publicar metadatos
   con una URL falsa.
2. **D2 — prerender/SSG.** Hoy el HTML inicial es `<div id="app">` vacio. Para un portafolio,
   `vite-plugin-prerender` o `vite-ssg` dejarian el contenido en el HTML. Es un cambio de
   arquitectura de build, no de metadata: **fuera del primer corte** salvo que lo quieras.
3. **D3 — `hreflang`.** No se puede declarar con honestidad mientras el idioma sea estado de
   cliente. Si te interesa, el camino es una URL por locale (`/en/...`), lo que choca con la
   decision previa de pagina unica con anclas. Recomendado: **no hacerlo**.
4. **D4 — JSON-LD inline vs generado** (ver seccion D). Recomendado: inline.
5. **D5 — `og-image.png`.** Puedo generarlo desde el logo trazado (metodo ya validado en el
   plan anterior) o esperar a que me pases una imagen. Recomendado: generarlo.

## Restricciones

- Sin dependencias nuevas: todo se resuelve con `public/` y `index.html` (el resto son edits de
  atributos). Si se eligiera D2 (prerender), ahi si entraria una dependencia de build.
- Sin secretos (RULES 0.8). El dominio se toma de D1, nunca de una variable de entorno en el HTML.
- Sin tocar khatarsis. Sin Git.
- Fuera de alcance: D2 salvo que se apruebe; el contenido/copy de las secciones; el `alt=""` del
  logo del navbar y el de los tiles de Leaflet (son decorativos con alternativa textual vecina).

## Pasos

1. Resolver D1 (dominio) y D4/D5.
2. `create` `public/robots.txt` y `public/sitemap.xml`.
3. Generar `public/og-image.png` (1200x630) desde `src/assets/logo/logo-script-v4.svg`.
4. `create` `public/manifest.webmanifest` + `<link rel="manifest">`.
5. `edit` `index.html`: canonical, robots, theme-color x2, OG, Twitter, description 150-160,
   author, JSON-LD (segun D4).
6. `edit` las imagenes de contenido para `width`/`height`.
7. `verificacion estatica`: los 2 archivos de `public/` existen y son XML/texto valido, 0
   placeholders sin resolver, todas las URLs de `index.html` apuntan al dominio de D1, JSON-LD
   parseable (`JSON.parse` sobre el contenido del script) y con los campos obligatorios de `Person`.
8. `verificacion real` (autorizada): `bun run lint:check`, `bun run format:check`, `bun run build`;
   en runtime, `curl`/fetch de `/robots.txt`, `/sitemap.xml` y `/og-image.png` (200 + content-type).
9. Revision de cierre (`subagents/reviewer.md`) + DoD; `status` `EXECUTED`.

## Verificacion

- **Comandos:** `bun run lint:check`, `bun run format:check`, `bun run build`.
- **Estatica:** `JSON.parse` del bloque JSON-LD, `og:image` de 1200x630 real (`file`/dimensiones),
  y grep de que no quede ningun marcador de dominio sin reemplazar.
- **Externa (opcional, sin cuenta):** Rich Results Test de Google y el validador de Schema.org
  sobre el sitio publicado, una vez que exista el dominio (D1).

## Riesgos

1. **Metadata con dominio equivocado**: peor que no tenerla (canonical apuntando a otro host
   desindexa). Mitigado por D1 y por el grep del paso 7.
2. **`og:image` relativa**: los crawlers de redes sociales exigen URL absoluta.
3. **JSON-LD desincronizado** si se escribe a mano y el CV cambia: por eso D4 ofrece generarlo
   desde `portfolio.ts`.
4. **`robots.txt` con `Disallow` de mas**: descartado por diseno, solo `Allow: /`.

## Cierre (2026-09-18)

Los pasos 2 a 6 de este plan se ejecutaron dentro del corte `portfolio-lighthouse-accesibilidad-seo`
(autorizado con "ejecuta el plan directamente"), que agrego la parte de accesibilidad y de assets
y dejo este documento como referencia de la auditoria. Donde ver la evidencia concreta:

- **S1, S3, S4, S5, S7, S9, S10**: hechos. `public/robots.txt` y `public/manifest.webmanifest`
existen, y `index.html` lleva `robots`, `author`, `theme-color` claro/oscuro, Open Graph y Twitter
sin URL, mas la `description` de 159 caracteres.
- **S3 (canonical)**: se resolvio mejor que lo previsto. En vez de un `<link>` estatico con el
dominio, `main.ts` mantiene un canonical **autorreferencial en runtime** desde el origen real, asi
que es correcto en cualquier host y no hay que reemplazar nada al publicar (ADR-012).
- **S6 (JSON-LD)**: hecho, inline y estatico (`@graph` de `Person` + `WebSite`), sin `url` ni
`image` porque deben ser absolutas (D1).
- **S8 (imagenes sin `width`/`height`)**: el CLS medido por Lighthouse es **0**, asi que no habia
nada que corregir; se deja registrado para no repetir el hallazgo.
- **S2 (sitemap.xml), `og:url` y `og:image`**: siguen **bloqueados por D1** (no hay dominio
  declarado en el repo). `robots.txt` se queda sin linea `Sitemap:` a proposito.
- **S11 (prerender) y S12 (`hreflang`)**: sin cambios, siguen las decisiones D2 y D3 de arriba.
- **D4** se resolvio como recomendaba el propio plan: JSON-LD **inline**.
- **D5 (`og-image.png`)**: no se genero, por lo mismo que D1.

Medicion de cierre de las categorias donde este plan era el unico pendiente (Lighthouse 13.5.0,
perfil movil, build del 2026-09-18): **SEO 92 -> 100** y **Accesibilidad 98 -> 100**.
