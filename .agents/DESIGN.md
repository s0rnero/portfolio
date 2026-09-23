---
name: design
description: Arquitectura y criterios de diseno del proyecto.
project: [NOMBRE DEL PROYECTO] - harness generico
---

# Design

Este archivo define el diseno tecnico del portafolio: una SPA Vue 3 sin backend. Verificado el 2026-09-15.

## 1. Arquitectura

```text
index.html
`-- src/main.ts        # createApp: icono global, plugin khatarsis, i18n, router, tema, montaje
    `-- src/App.vue    # raiz de composicion por capas (z-index):
        navbar (z-40) -> gradual-blur (z-30) -> glitch-cursor -> fondos WebGL (-z-30)
        -> router-view -> crt (intro) -> footer -> overlays (z-50)
```

- **Rutas:** `/`, `/projects` y `/contact` resuelven `MainView` (composicion de las 4 secciones); la navegacion por secciones usa `NAV_SECTIONS` (`src/router/index.ts`) con scroll suave propio (Lenis + GSAP, ADR-001). El juego ViceCity es un overlay por estado (`ViceCityExperience`, sin ruta ni cambio de URL; `/vicecity` solo redirige a `/` por compatibilidad, ADR-013) y no entra en `NAV_SECTIONS` ni en `useSectionSpy`.
- **Estado transversal:** composables, con estado de modulo cuando lo comparten varios componentes (`useStaticFlash`, `useTheme`, `useSectionSpy`, `useReveal`, `useCrtIntro`, `useViceCityCode`, `useViceCityGame`). El caso de estado local queda para un composable con un unico consumidor; hoy no hay ninguno (`useViceCityCode` lo era hasta el ADR-010, cuando el fin del ruido paso a gobernar el arranque del trailer).
- **Presentacion:** componentes por dominio en `src/components/<dominio>/`, compartidos en `common/`, fondos animados en `background/`.
- **Contenido:** `src/data/` para datos y `src/i18n/locales/` para textos (ES fuente, EN traduccion).
- **UI:** `khatarsis` aporta los componentes `k-*`; el portafolio es responsable de los puentes que la libreria no cubre (ADR-004 y ADR-008).
- Las decisiones vigentes estan en `.agents/decisions/` (ADR-001 a ADR-013) y son la referencia obligada antes de proponer cambios de arquitectura.
- Cada pieza tiene una responsabilidad clara y el orden de capas visuales se declara aca, no se improvisa por tarea.

## 2. Contratos

- El contrato publico son los **contratos de componentes**: props tipadas (`interface XProps` + `withDefaults`), eventos (`defineEmits`) y slots. Cambiarlos afecta a quien los consume y se planifica.
- Los composables exponen refs/computeds y funciones con nombres estables; el estado compartido es un singleton de modulo y no se duplica por componente.
- Los datos del sitio (`src/data/portfolio.ts`) y las listas de navegacion (`NAV_SECTIONS`) son la fuente unica: no se replican listas en componentes.
- Los textos visibles se resuelven por i18n con claves estables (`nav.*`, `hero.*`, `trick.*`); el español es la fuente y el ingles traduce lo existente.
- Los assets se importan desde `src/assets/` y los tipa `vite/client` (configurado en `tsconfig.app.json`).
- **El documento tambien es contrato** (ADR-012): `index.html` es dueño de la metadata que no depende del host (`description` de 150-160 caracteres, `author`, `robots`, `theme-color` claro/oscuro, Open Graph y Twitter sin URL, y el `@graph` de `Person` + `WebSite`), `main.ts` mantiene el unico `<link rel="canonical">` autorreferencial a partir del origen real, y `public/` sirve `robots.txt` y `manifest.webmanifest`. Lo que exige URL absoluta (`sitemap.xml`, `og:url`, `og:image`) queda fuera hasta que exista un dominio declarado: no se publican URLs inventadas.
- Los SVG pesados se optimizan con `bunx svgo --config .svgo.config.mjs` (perfil conservador: `cleanupIds` y `removeUnknownsAndDefaults` apagados) y **solo se acepta el resultado si el render es equivalente píxel a píxel** contra el original, rasterizado en Chrome headless al tamaño y DPR reales de la pagina.

## 3. Rendimiento

- Fondos WebGL (`TvStaticBackground`, `FaultyTerminalBackground`): `fps` y `dpr` acotados por defecto, render solo con la pestana visible, y respeto de `prefers-reduced-motion`. Una instancia por fondo: no montar copias para cambios de `z-index` o de aspecto.
- Presupuesto medido el 2026-09-18 sobre `dist/` del build de ese dia: **arranque `index-*.js` + `index-*.css` = 1.067.848 B (262.313 B gzip)**, repartido en `index-*.js` 680.589 B (219.001 B gzip) y `index-*.css` 387.259 B (43.312 B gzip); chunks diferidos `leaflet-src-*.js` 148.731 B (42.706 B gzip), `leaflet-*.css` 15.095 B (6.391 B gzip) y `ViceCityView-*.js` 475 B; imagenes `logo_khatarsis-*.svg` **181.577 B (21.040 B gzip, era 578.351 B)**, `arqbs-logo-color-*.webp` 31.078 B, `red-brilla-*.svg` 25.014 B y `portrait-*.svg` 6.257 B; `dist/` total 252 MB con el trailer incluido. Contra el corte del 2026-09-16 (arranque 1.440.522 B / 387.340 B gzip) el arranque baja ~26 % crudo y ~32 % gzip. Cualquier activo que empuje esos numeros se justifica en su plan.
- La carga diferida es la via por defecto para lo que no es la entrada: las rutas fuera de `NAV_SECTIONS` (el truco) y las dependencias de secciones bajo el fold (Leaflet en el mapa) entran por `import()` dinamico, no por el grafo inicial (ADR-011). El idioma del documento y el `<title>` siguen al locale desde el punto de composicion.
- El juego (`reVC` via `src/vendor/gtavc-web`, shell en async chunk) arranca con el video y corre debajo (`fill: parent`); sus datos (~1,6 GB) viven fuera del bundle y del repo, servidos por `vcWeb` en dev y por R2/host propio en despliegue (ADR-013).
- El activo mas pesado del repo es el video de `src/assets/trailers/vc.mp4`: 250 MB (262.477.133 B, 101,58 s, 20,7 Mbps) medido el 2026-09-16; `src/assets/` completo pesa 252 MB. El proximo `build` emite ese archivo tal cual, asi que `dist/` pasa a ~253 MB (el build del 2026-09-15 aun lleva la version anterior, de 128 MB).
- **El LCP de este sitio es el parrafo del hero y su retraso no es de red** (`elementRenderDelay`, no TTFB): lo gobiernan el intro CRT (~1,4 s) mas el reveal de 0,9 s, y el `scriptEvaluation` del bundle de entrada (medido: 8,2 s bajo el throttling 4x de Lighthouse, del cual el grueso es la libreria). Los dos fondos WebGL animan desde el arranque y suman trabajo de main thread. Cualquier recorte ahi **cambia lo visual**, asi que no se hace sin decision explicita del usuario.
- Medir antes de ajustar; no copiar numeros sin build reproducible.
- La claridad tiene prioridad sobre microoptimizaciones no medidas.

## 4. Seguridad

- Frontend estatico: no hay secretos de aplicacion. Nada de claves ni tokens en el codigo, en `.env` versionado ni en el bundle (se elimino `opencode.json`, que tenia una `apiKey` en claro, el 2026-09-15).
- No hay backend, sesiones ni datos de usuario que validar; la superficie es el propio bundle.
- Los enlaces externos abren con `target="_blank"` y `rel="noopener"`.
- El servicio de tiles del mapa (`MapCard.vue`) es una dependencia externa declarada; no se le envian datos del usuario.
- Git, secretos y dependencias: `.gitignore` cubre `node_modules`, `dist` y `*.local`. No se commitean credenciales (regla 0.8 de `.agents/RULES.md`).

## 5. Entornos

- Un solo entorno de ejecucion: `bun run dev` (Vite) para desarrollo, `bun run build` + `bun run preview` para el artefacto. No hay backend, staging ni migraciones en este repo.
- El estado del build depende de la libreria local `khatarsis` (`file:`): si su `dist/` no expone lo que declara su `package.json`, el build del portafolio se rompe. Eso se reporta como fallo externo, no se parchea configuracion del repo.
- Los scripts bloqueados (`dev`, `build`, `preview`, `lint`, `format`) requieren autorizacion explicita (regla 0.4).
- En dev/preview el plugin `vcWeb` sirve los datos del juego desde el checkout local del port y fija COOP/COEP (los exige el motor); en produccion `/game/` lo sirve el host de datos (ADR-013).
- Los cambios de configuracion se registran en planes, no en codigo.

## 6. Documentacion De Decisiones

- Las decisiones no obvias se documentan, no cada linea de codigo.
- `.agents/plans/` registra **como** se ejecuto cada cambio (contexto, pasos, verificacion) y es la memoria operativa.
- `.agents/decisions/` registra **por que** la arquitectura es como es (ADR permanentes: scroll suave, estructura de router y vistas, overlay CRT sin compuerta, cascada CSS de khatarsis, hash de deep-link, backdrop-filter vs reveal por opacidad, navegacion movil en drawer, puente i18n, huevos de pascua, carga diferida y metadata del documento, y metadatos estaticos con nivel de encabezados).
- Antes de proponer un cambio de arquitectura se leen los ADR vigentes; una decision nueva se registra como ADR adicional, nunca editando uno anterior.

**Ultima actualizacion:** Septiembre 2026
**Version:** 1.1 (arquitectura real del portafolio)
