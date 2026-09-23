---
name: portfolio-r2-deploy-font-nunito-clouds
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-22 16:20
enriched: 2026-09-22 17:05
updated: 2026-09-22 17:55
---

# Plan Tecnico: datos del juego en Cloudflare R2 + despliegue en Netlify + fuente Nunito y nombres de cloud

## Analisis

- **Objetivo:** (1) sacar los ~1,6 GB del juego de Backblaze B2 (cuota de egress: 3x lo almacenado/mes) y servirlos desde Cloudflare R2 con egress gratis; (2) desplegar el portfolio en Netlify con el build apuntando a R2; (3) sustituir la fuente del sistema por **Nunito** auto-hospedada, dejando solo el fichero de fuente que se usa; (4) en los stacks de proyectos/experiencia, nombrar solo el cloud (`AWS Lambda` -> `AWS`, `Azure DevOps` -> `Azure`).
- **Contexto medido (2026-09-22):**
  - Datos del juego: `streamed/` 17.401 ficheros / 1,4 GB, `build/` 156 MB (`reVC.js|.wasm|.data`), `manifest.json` 1,2 MB, `trailers/vc.mp4` 21,9 MB (reencodado desde 262 MB 4K60 en el turno anterior).
  - `public/game/` esta gitignored: en dev lo sirve Vite, en produccion lo sirve el host de datos. El build copia `public/game` a `dist/game` (421 MB) -> **hay que borrarlo antes de desplegar**, si no se sube a Netlify.
  - Toolchain: Vite 8 / Rolldown, `bun run build`, scripts `lint:check` / `format:check`.
- **Datos verificados antes de tocar nada:**
  - El motor carga `reVC.js` como `<script>` clasico y el trailer como `<video>`; bajo `COEP: require-corp` (heredado del embed) ambos exigen modo CORS -> se anadio `crossOrigin` en los dos puntos en el turno anterior.
  - `manifest.json` es un mapa `clave/minuscula -> { p: "Ruta/Con/Mayusculas", s: tamaño }`; el motor busca por minusculas y descarga el `p` real. R2 distingue mayusculas, asi que la caja del `p` debe coincidir exactamente con la clave del objeto.
  - El CSS del proyecto no declaraba ninguna fuente web: `body` usaba el stack del sistema; Tailwind resuelve preflight con `--default-font-family: var(--font-sans)`.

## Cambios

### 1. Datos del juego -> R2 (fuera del repo)
- Bucket `vicecity` en R2; `streamed/`, `build/`, `manifest.json`, `trailers/vc.mp4` subidos con `rclone` respetando la caja original de cada fichero (17.401 + 4 objetos).
- Credenciales solo en `.env.r2` (gitignored; `.gitignore` amplia `.env*` y exceptua `.env.production`). El script temporal de subida se borro al terminar.

### 2. `.env.production` (create)
- Las 4 `VITE_VC_*` (`BUILD_URL`, `STREAMED_URL`, `MANIFEST_URL`, `TRAILER_URL`) apuntando a la URL publica de R2. Son URLs publicas sin secretos: se versionan a proposito (fuente unica para build local y Netlify).

### 3. `public/_headers` (edit)
- `Content-Type: application/manifest+json` para `/manifest.webmanifest`: Netlify no tiene mapeo para esa extension y lo servia como `application/octet-stream` (los navegadores ignoran el manifest con ese tipo).

### 4. `src/style.css` (edit)
- `@font-face` de Nunito variable (`src/assets/fonts/Nunito-VariableFont_wght.woff2`, `font-weight: 200 1000`, `font-display: swap`). CSS nativo: no hay utilidad Tailwind para `@font-face` (excepcion CODING_STANDARDS §7 documentada).
- `@theme { --font-sans: 'Nunito', ... }` como fuente unica: preflight, la utilidad `font-sans` y `body` leen de ahi.
- `body { font-family: var(--font-sans) }` en lugar del stack del sistema duplicado.

### 5. `src/assets/fonts/` (limpieza)
- Del `Nunito.zip` (2,7 MB, 16 estaticas + 2 variables) se conserva solo la variable romana (cubre los 9 pesos) y `OFL.txt` (la licencia SIL OFL debe acompanar a la fuente). Zip borrado.
- `Nunito-VariableFont_wght.ttf` (275.644 B) se comprimio a `Nunito-VariableFont_wght.woff2` (**100.444 B, -64%**) con `wawoff2` (`bun add -d wawoff2`, CLI `bunx woff2_compress.js <ttf>`) y **se borro el TTF**: solo se publica woff2, que cubre todos los navegadores objetivo.
- Se verifico que el codigo no usa cursivas ni `font-sans` en ningun componente, por lo que no hace falta la variable italica.

### 5-bis. `src/assets/about/portrait.svg` (delete)
- Asset muerto: `PortraitGlitch.vue` compone la imagen del About y su `srcset` con `import.meta.glob('@/assets/me/portrait_*.webp')`, asi que nadie referenciaba el SVG (verificado con `grep`). Con el se elimino la carpeta `src/assets/about/`, que quedaba vacia.

### 6. `src/data/portfolio.ts` (edit)
- `AWS Lambda` -> `AWS` y `Azure DevOps` -> `Azure` en los stacks de experiencia y proyectos (4 ocurrencias). El resto de tecnologias intacto.

### 7. `.gitignore` (edit)
- `.netlify/` ignorado (estado local del enlace del CLI).

## Verificacion

- **Integridad de datos (R2):** `rclone size` = 17.401 objetos / 1,338 GiB, coincide con el origen local. Comparacion contra el manifest: **0 rutas declaradas faltantes**, 25/25 rutas muestreadas resuelven 200 con `content-length` igual al `s` del manifest; 2 objetos sobran (`Audio/sfx.RAW`, `Audio/sfx.SDT.ratesfixed`), no referenciados por el manifest.
- **Host de datos:** `curl` sobre las 5 rutas -> `206 Partial Content` (soporta `Range`), `Access-Control-Allow-Origin: *`, `Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges, ETag`, `application/wasm` y `video/mp4` correctos.
- **Build:** `bun run lint:check` 0, `bun run format:check` 0 (tras `prettier --write src/style.css`), `bun run build` 0. El bundle del juego contiene las 4 URLs de R2 y **cero rutas locales** `/game/` o `/streamed/`; el unico asset de fuente emitido es el woff2 (100,44 kB) y el CSS lo referencia con `format("woff2")`.
- **Sitio desplegado (`https://carv-portfolio.netlify.app`):** `COEP: require-corp`, `COOP: same-origin`, `nosniff`, `Referrer-Policy` y `Cache-Control: immutable` en `/assets/*` aplicados; fuente en vivo `200 font/woff2` inmutable; CSS en vivo con `font-family:Nunito` y `--font-sans` con Nunito; `manifest.webmanifest` ya sale `application/manifest+json`; las 4 variantes `me/portrait_*.webp` presentes en el bundle para el `srcset`.

## Hallazgos posteriores (2026-09-22, sin cambios de codigo)

- **Caché de datos del navegador (medido en el artefacto):** el motor guarda los ficheros `streamed/` en **IndexedDB (base `vcod2`)** con tope `idbCapMB: 900` MB y una lista de arranque en caliente `warmMB: 64` MB que se precarga al boot. O sea: la primera visita baja lo que necesita y las siguientes tiran de IndexedDB. Los **guardados** van aparte, en `/userfiles` (IDBFS de Emscripten), y no se borran al vaciar esa caché. La API publica del loader expone `cacheInfo()` y `clearDataCache()`.
- **El `build/` (156 MB: `reVC.js|.wasm|.data`) no pasa por esa caché**: va por la caché HTTP del navegador, y **R2 no devuelve `Cache-Control`** (solo `ETag` y `Last-Modified`, verificado con `curl`). El navegador revalida en cada visita (304) y no hay frescura heurística util, asi que no hay garantia de no re-descargar 132 MB. **Mejora recomendada (no aplicada):** `Cache-Control: public, max-age=604800` en esos objetos, bien re-subiendo con metadatos (`rclone --header-upload`) o, mejor, con un dominio propio de R2 + una Cache Rule (no necesita re-subir ni credenciales).
- **No se pide almacenamiento persistente**: no hay `navigator.storage.persist()`, asi que la caché es "best-effort" (el navegador puede desalojarla; Safari la borra tras 7 dias sin uso).
- **Coste:** almacenado ~1,55 GB de los 10 GB gratis; el egress de R2 es **siempre gratis**. Los unicos limites facturables son 1M ops clase A (escrituras/listados) y 10M clase B (lecturas) al mes, y la subida inicial gasto ~17,4k escrituras. Red de seguridad: **Budget alert** en Cloudflare (Manage Account > Billing > Billable Usage, desde 2026); no existe tope duro de gasto. A evitar: clase *Infrequent Access*, productos de pago (R2 SQL, colas/eventos), y **no** poner un Worker delante (100k peticiones/dia gratis frente a los miles que hace un jugador).
- **Credenciales:** el token de R2 se uso solo para la subida inicial; `.env.r2` se elimino del disco al terminar y la key se revoca en el panel. No queda ningun secreto en el repo.

## Cierre (memoria persistente)

- **Que cambio:** migrados los datos del juego de B2 a **Cloudflare R2** (bucket `vicecity`, 1,338 GiB en `streamed/` + `build/` + `manifest.json` + `trailers/vc.mp4`) y fijadas las 4 `VITE_VC_*` en `.env.production`; el portfolio quedo **desplegado en Netlify** via CLI (`netlify deploy --prod --dir=dist`), sitio renombrado a `sornero-portfolio` y despues a **`carv-portfolio`**. En `src/style.css` se auto-hospedo **Nunito** variable via `@font-face` + `--font-sans` (preflight, `font-sans` y `body` desde una sola fuente), conservando solo `Nunito-VariableFont_wght.woff2` (100.444 B, comprimido desde el TTF de 275.644 B) + `OFL.txt` (zip de 16 estaticas y TTF origen borrados). Borrado `src/assets/about/portrait.svg` por muerto: el About usa el `srcset` de `src/assets/me/`. En `src/data/portfolio.ts`, `AWS Lambda` -> `AWS` y `Azure DevOps` -> `Azure`. `public/_headers` declara el `Content-Type` del manifest PWA.
- **Verificacion:** ver seccion anterior; todo ejecutado con `lint:check`, `format:check`, `build`, `curl` contra R2 y contra el sitio, y muestreo de integridad del manifest.
- **Resultado:** cerrado y en produccion. Pendiente solo de revision visual del usuario en el navegador (fuente Nunito aplicada, juego arranca desde R2, trailer).
- **Pendientes:** (1) vendors con `rolldownOptions.output.codeSplitting` y `vue-i18n` runtime-only; (2) CSS scoped de khatarsis (plan `khatarsis-scoped-component-css`); (3) decidir si `.env.production` se versiona (hoy sin commit, por la regla de no tocar git); (4) quitar `wawoff2` de devDependencies si no se vuelven a convertir fuentes.
