---
name: portfolio-bundle-weight-optimizations
status: EXECUTED
type: maintenance
domain: portfolio
created: 2026-09-22 14:10
---

# Plan: Optimizacion del peso del bundle

> Enriquecido con evidencia medida sobre el `dist` real (2026-09-22) y sobre el repo de la
> libreria (`.agents` vecino `../khatarsis`). El usuario autorizo explicitamente la ejecucion
> ("ve procediendo con el plan incluso en khatarsis") y la ejecucion de builds de verificacion.

## Objetivo

- Bajar el peso real que descarga un visitante sin perder funcionalidad ni estilos.
- Verificar (y dejar constancia de) el tree shaking de `khatarsis` en JS y en CSS.

## Evidencia medida (punto de partida)

| Asset | Raw | gzip | brotli |
| --- | --- | --- | --- |
| `index-*.js` | 503.422 B | 175.138 B | 153.419 B |
| `index-*.css` | 388.018 B | 43.914 B | 33.785 B |
| `rugal-*.jpg` (3264x2448 con EXIF -90) | 1.798.456 B | - | 1.750.500 B |
| `rocco-*.webp` (3456x4608) | 562.996 B | - | 563.001 B |
| `logo_khatarsis-*.svg` (3 paths, sin raster) | 181.577 B | 21.974 B | 12.694 B |
| `portrait_master.jpg` + srcset webp | 203.659 B + variantes | - | - |
| `leaflet-src-*.js` (diferido) | 148.731 B | 42.909 B | 37.396 B |

Anatomia de `node_modules/khatarsis/dist/public/khatarsis.css` (348.594 B):
`@layer properties` 17.376 + `base` 3.590 + `theme` 2.029 + `utilities` 37.066
+ ~288.500 B de `<style scoped>` de los 62 componentes (1.595 `@apply`).

Tree shaking en JS: verificado correcto. Cero apariciones de `FluidSimulation`, `Worker`,
`UploadFile`, `TablePaginator`, `InputOtp`, `Crud`, `Resizable`, `Stepper`,
`TIMELINE_STATUSES` en `dist/assets/index-*.js`.

## Alcance

- `src/assets/beasts/*` y su import en `src/data/portfolio.ts` (fotos de las bestias).
- `src/assets/brands/logo_khatarsis.svg` (optimizacion svgo).
- `vite.config.ts` (code splitting de vendors; `manualChunks` no aplica en Rolldown).
- Repo de la libreria `../khatarsis/packages/khatarsis`: CSS por componente, intercepcion de
  `khatarsis/style.css` en `khatarsis/vite`, tokens como fuente unica, guardianes.
- Fuera de alcance: `src/views/ViceCityView.vue` (codigo muerto, requiere OK aparte), el
  frente de despliegue de ViceCity (`VITE_VC_*`, R2), SEO y `portrait_master.jpg`
  (el jpg es el fallback de `srcset`, se conserva).

## Restricciones

- RULES 0.2: no se borra ningun fichero original sin aprobacion explicita (los JPG de origen
  se conservan como archivo).
- RULES 0.13 / CODING_STANDARDS: codigo e identificadores en ingles; sin hardcode de textos.
- RULES 0.6: una sola fuente de verdad (no duplicar tokens ni headers).
- `vite.config.ts` usa Tailwind 4 y el proyecto corre con bun.

## Pasos

1. Bestias: reencodar a webp redimensionado a lado mayor 1024 px (ffmpeg, `libwebp`,
   calidad 80) desde los JPG originales; `src/data/portfolio.ts` apunta a `rugal.webp`.
2. `logo_khatarsis.svg`: pasar por `svgo` (preset-default, multipass) verificando que el
   gradiente y las referencias `url(#...)` sobreviven; medir antes/despues.
3. Libreria `khatarsis`:
   a. Extraer los tokens a `src/tokens.css` (fuente unica; lo importa `src/style.css`).
   b. Build multi-entrada de los componentes con `<style scoped>` usando
      `rolldownOptions.input` + `cssCodeSplit: true` + `build.manifest: true` para emitir
      `dist/public/components/<Nombre>.css` y derivar `css-map.json` del manifest
      (`ManifestChunk.css`).
   c. `khatarsis/vite`: detectar tags **y** imports nombrados; interceptar
      `khatarsis/style.css` (`resolveId` + modulo virtual) devolviendo tokens + solo los CSS
      detectados. Fallback completo y aviso si no se puede mapear (nunca menos funcionalidad).
   d. Guardian de paridad: todo tag de `registry-map.json` debe tener entrada CSS.
   e. Bump de version, regen del tgz y actualizacion del `file:` en `package.json`.
4. `vite.config.ts`: code splitting de vendors con `rolldownOptions.output.codeSplitting`
   (groups), no `manualChunks`.
5. Opcional y solo con medicion: runtime-only de `vue-i18n` precompilando mensajes.

## Verificacion

- `bun run lint:check`, `bun run format:check`, `bun run build` (autorizados por el usuario).
- Medir `dist/assets/*` con `wc -c` y gzip/brotli antes/despues de cada paso.
- Prueba de humo en navegador del hover de las bestias y del about (revision del usuario).

## Registro de ejecucion

### Hecho y verificado (2026-09-22)

**Bestias.** `src/assets/beasts/{rocco,rugal}` reencodadas con ffmpeg a webp, lado mayor 1024 px
(768x1024), calidad 80, `-map_metadata -1` (la rotacion EXIF -90 de `rugal.jpg` se aplica, asi que
sale vertical). Los JPG originales se conservan como `*_master.jpg`. `src/data/portfolio.ts`
apunta a `rugal.webp`.

| Asset | Antes | Despues |
| --- | --- | --- |
| `rocco-*.webp` | 562.996 B (3456x4608) | **55.520 B** (768x1024) |
| `rugal-*.jpg` | 1.798.456 B (3264x2448) | **48.538 B** (768x1024, ahora `.webp`) |

Total: **2.361.452 B -> 104.058 B** (~2,26 MB menos).

**`logo_khatarsis.svg`.** Sin cambios, y es un resultado medido: el repo ya tiene un perfil svgo
curado (`.svgo.config.mjs`, con `cleanupIds: false` a proposito porque el gradiente se referencia
por nombre y con verificacion pixel a pixel documentada) y bajo ese perfil el archivo ya esta al
minimo: **181.577 B -> 181.577 B (0%)**. Una pasada propia con el preset por defecto y precision 1
bajaba a 53.322 B, pero cambia la politica del perfil curado y renombra el gradiente, asi que se
descarto. Rasterizar a webp seria peor en transferencia: 12.694 B brotli hoy frente a ~30 KB de un
webp ya comprimido.

### Bloqueado: CSS scopeado de khatarsis (requiere decision)

Motivo de fondo (no es solo peso): **ADR-004 del portfolio** documenta que el CSS scoped de
khatarsis va **sin capa** y por eso gana siempre (`.button[data-v-*]{z-index:10}` anulaba el
`z-[1000]` del mapa), y su propia seccion de alternativas dice que el arreglo correcto es *"no
publicar utilidades en el `dist` de la libreria"* y meter el CSS de los componentes en
`@layer components`, quedando ese trabajo como *"hilo aparte"*. El plan
`khatarsis-consumer-declaration-contract` del repo de la libreria, en cambio, decidio dejar
`style.css` intacto y la purga de CSS como **opt-in**, con el argumento de que 29 KB brotli no
justifican romperlo. Diseño acordado con el usuario: el plugin `khatarsis/vite` intercepta
`khatarsis/style.css` y lo sustituye por tokens + solo los CSS de los componentes detectados, sin
que el consumidor cambie ni una linea.

**Prototipo hecho y bloqueo encontrado.** Se implemento y se midio: tokens extraidos a
`src/tokens.css` (fuente unica; `dist/public/khatarsis.css` sale igual salvo una variable de tema
de Tailwind) y se generaron `tokens.css` (2.634 B) y `utilities.css` (21.376 B) correctamente.
Lo que **no** es fiable es el CSS scoped por componente:

1. Con el tree-shaking activo, una entrada que nadie consume se descarta entera (y con ella su
   CSS). Se resuelve con `treeshake: false`.
2. Aun asi, un build multi-entrada de Rolldown **solo adjunta CSS a algunas entradas** (medido: 8
   de 19) y mezcla bloques de unas en el CSS de otras (`Select.css` contenia el scope de `Item`).
3. En build de **una** entrada tampoco sale el bloque propio de la entrada: `Card.css` contenia
   solo las reglas de `Separator` (su dependencia) y ninguna de `.card`. Causa probable: el
   `@import '@/style.css' reference;` que comparten todos los componentes convierte la hoja
generada por Tailwind en un modulo CSS compartido que se asigna a una unica entrada; sustituirlo
por `@reference "tailwindcss/theme.css"` no lo arreglo.

Es un comportamiento del bundler (Vite 8.3.0 + Rolldown 1.2.9) con `@tailwindcss/vite`, no del
diseño. Vias para desbloquearlo: (a) separar el CSS **ya precompilado** por `scopeId`
(`data-v-<hash>`); el id de plugin-vue en produccion es `getHash(rutaNormalizada)` (sha256 hex,
8 primeros caracteres), asi que es calculable sin bundler y el reparto seria determinista;
(b) arreglar/reportar en Vite; (c) dejar el CSS como esta (29 KB brotli) y no tocar la libreria.

**Estado de la libreria tras el prototipo:** se conservan `src/tokens.css` (fuente unica de los
tokens, verificada: `build:public` en verde y el CSS publicado practicamente identico) y el
generador `generate-tailwind-entry.mjs` corregido para publicar los tokens desde ahi. Se eliminaron
las piezas no fiables (script de CSS por componente y entries de build) y todos los temporales.
`build:public`, `verify:exports` y `verify:vite-plugin` en verde. El `.tgz` instalado en el
portfolio sigue siendo el 1.0.3, asi que este cambio **no afecta al portfolio** hasta un bump.

### Verificacion ejecutada

- `bun run lint:check` exit 0 · `bun run format:check` exit 0 · `bun run build` exit 0.
- Bundle tras los cambios: `index-*.js` 503,42 kB (177,37 kB gzip) y `index-*.css` 388,01 kB
  (43,87 kB gzip) sin cambios; los assets de las bestias bajan de 2,36 MB a 0,10 MB.
- Libreria: `bun run build:public` en verde; `verify:exports` (14 rutas) y `verify:vite-plugin`
  exit 0.

## Cierre (memoria persistente)

- Que cambio: fotos de las bestias reencodadas a webp 768x1024 (2,26 MB menos) con los JPG
  archivados como `*_master.jpg`; `portfolio.ts` apunta a `rugal.webp`; `logo_khatarsis.svg`
  verificado como ya optimo bajo el perfil svgo del repo (sin cambios). En la libreria se extrajo
  `src/tokens.css` como fuente unica de tokens y se corrigio su generador de `tailwind.css`.
- Verificacion: `lint:check`, `format:check` y `build` en el portfolio (exit 0 cada uno) mas
  `build:public`/`verify:exports`/`verify:vite-plugin` en la libreria. Comparacion byte a byte del
  CSS precompilado antes/despues del refactor de tokens (+68 B, una variable de tema de Tailwind).
- Resultado: aprobado en lo ejecutado; **el CSS scopeado queda pendiente de decision** por el
  bloqueo del bundler descrito arriba.
- Pendientes: (1) decidir la via para el CSS scoped (a/b/c de arriba) y, si se elige (a), abrir un
  plan y un ADR en el repo de la libreria; (2) code splitting de vendors con
  `rolldownOptions.output.codeSplitting` (no se llego a hacer); (3) revision visual del hover de
  las bestias en el navegador; (4) `vue-i18n` runtime-only, sin empezar.
