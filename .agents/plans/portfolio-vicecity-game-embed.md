---
name: portfolio-vicecity-game-embed
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-21 12:00
enriched: 2026-09-21 12:30
ready: 2026-09-21 13:00
executed: 2026-09-21 13:30
---

## Plan Tecnico: ViceCity jugable embebido tras el video

> Enriquecido el 2026-09-21 12:30 sobre la compuerta **"enriquece el plan"**. Verificado leyendo el repo y el port el 2026-09-21; las anclas corresponden a ese estado. El enrichment **no** implementa codigo: los pasos quedan listos para revision del orquestador (`READY`) y compuerta **"ejecuta el plan"`.
> Autorizacion nueva del usuario: "vas a tener que copear de esa carpeta tambien lo que necesites" -> se autoriza copiar `web/lib/` al portfolio; no se autoriza copiar `build/`, `streamed/`, `assets/` ni `node_modules`.

### Analisis

- Objetivo: el truco `vicecity` + `Enter` monta un shell sin cambiar URL; al caer el ruido (~3 s) arrancan en paralelo `vc.mp4` (arriba) y `startGame` (abajo, ya corriendo); un segundo `Enter` con juego listo hace fade negro del video y revela el juego.
- Scope: retirar ruta `/vicecity`, nuevo shell overlay, nuevo puente Vue al motor, copiar libreria `gtavc-web`, cablear `vite.config.ts` + COOP/COEP, servir datos fuera del bundle, fade por Tailwind, ADR nuevo.
- Archivos:
  - Portfolio hoy: `src/composables/useViceCityCode.ts:26-33` (`activate` hace `router.push vicecity`), `src/router/index.ts:6,70-76` (`RouteName vicecity` + lazy `ViceCityView`), `src/views/ViceCityView.vue:1-37` (solo video + `handleStart` por `isTrickActive`), `src/App.vue:27-29,65-77` (`isTrailerView`, chrome oculto), `vite.config.ts:7-14` (sin headers COOP/COEP), `public/` (sin `game/`), `.gitignore` (sin reglas de datos del juego).
  - Port: `Nueva carpeta/web/lib/index.js:101-113` (`startGame({ el })`, instancia unica, `fill viewport|parent`), `:322-326` (`window.__vcFrame` = primer frame = senal buena), `:542-555` (`onRuntimeInitialized` -> `ready`), `:199-276` (barra rosa solo `probe|build`, se retira sola), `styles.js:10-17` (`.vc-root` fixed + z altisimo; `data-fill=parent` -> relative + z auto), `vite.js:19-31,112-131` (`vcWeb({ streamedDir, assetsDir })` + COOP/COEP + serve `/streamed/ /vc/ /odtrace`), `lib/package.json` (`@re3/gtavc-web`, `index.js + index.d.ts + vite.js + styles.js`), `.gitignore` (`build/ *.wasm *.data web/public/build/ assets/ streamed/ bootseed/ radio_light/ *.log web/public/manifest.json` = no copiar), `web/public/build/` (contiene `reVC.js/.wasm/.data` generados, no van a Git).
- Riesgos: (1) `crossOriginIsolated=false` sin COOP/COEP rompe pthreads; activar COOP/COEP global puede romper tiles Leaflet/fuentes; (2) datos ~GB no van al bundle ni a Git: dev sirve desde Desktop, prod exige host estatico aparte; (3) `startGame` una vez por pagina, `destroy()` no libera wasm: no remontar; (4) quitar `/vicecity` rompe deep-links viejos y `RouteName`; (5) segundo `Enter` choca con buffer del truco si no se aisla; (6) `.vc-root` viewport trae z `2147482000`: obliga `fill: parent` para no tapar fade/video.

### Cambios

- `src/vendor/gtavc-web/` — copy (create, 4 ficheros): `index.js`, `styles.js`, `vite.js`, `index.d.ts` desde `Nueva carpeta/web/lib/`. No copiar `package.json` como dependencia ni `README.md` al bundle; dejar nota de origen + `VERSION 2026-09-19-orig1` en cabecera. `import { startGame } from '@/vendor/gtavc-web/index.js'` con tipos del `d.ts` local.
- `src/composables/useViceCityGame.ts` — create: singleton `isExperienceVisible`, `isVideoVisible`, `isVideoFaded`, `isGameReady`, `gameHandle`; `openExperience()` (sin router), `markVideoStarted()`, `markGameReady()`, `revealGame()` (solo si `isVideoVisible && isGameReady && !isVideoFaded`), `closeExperience()` opcional. Comentarios en ingles, booleanos `is*`, handlers `handle*`.
- `src/components/vicecity/ViceCityExperience.vue` — create (unico componente principal del requerimiento): shell `fixed inset-0` con dos capas: `div ref=gameHost` (z menor, `fill parent`) + `video` (z mayor) + capa fade negra `bg-black transition-opacity duration-700`. `startGame` en `onMounted` del shell (coincide con fin de ruido), `fill: 'parent'`, `buildUrl/streamedUrl/manifestUrl` a `/game/...`, `traceUrl: null`, `title: false`, `guardUnload: true`. Escucha `game.on('ready')` + wrap `window.__vcFrame` para `isGameReady`; `onBeforeUnmount` no llama `destroy()` salvo salida explicita (documentar).
- `src/composables/useViceCityCode.ts` — edit: `activate()` deja de hacer `router.push vicecity`; llama `openExperience()` y mantiene ventana 3 s de `isTrickActive`. Segundo listener (o extension del mismo) para `Enter` cuando `isExperienceVisible && isVideoVisible && !isVideoFaded`: si `isGameReady` -> `revealGame()`, si no -> no-op (sin re-disparar truco). Respetar `isTypingTarget` y modificadores.
- `src/views/ViceCityView.vue` — delete o reconvertir: deja de ser ruta; o se elimina (requiere aprobacion 0.2) o queda como wrapper fino que monta `ViceCityExperience` para compatibilidad interna. Propuesta: eliminar ruta pero conservar el `.vue` como re-export del shell solo si evita churn; si no, borrar con aprobacion explicita en ejecucion.
- `src/router/index.ts` — edit: quitar `'vicecity'` de `RouteName`, quitar ruta `/vicecity` lazy, quitar import diferido; agregar redirect `'/vicecity' -> '/'` para deep-links viejos. `NAV_SECTIONS` intacto, `routesMap` intacto.
- `src/App.vue` — edit: sustituir `isTrailerView` (por `route.name`) por `isExperienceVisible` del nuevo composable; chrome (`navbar`, `gradual-blur`, `glitch-cursor`, `footer-section`) con `v-if="!isExperienceVisible"`; montar `<vice-city-experience v-if="isExperienceVisible" />` tras `router-view`; `tv-static-background :overlay` intacto.
- `vite.config.ts` — edit: importar `vcWeb` desde `@/vendor/gtavc-web/vite.js`; `plugins: [vue(), tailwindcss(), vcWeb({ streamedDir: '<abs>/Nueva carpeta/streamed', assetsDir: '<abs>/Nueva carpeta/assets', publicDir: 'public' })]` solo para dev/preview local; `server.headers` + `preview.headers` COOP/COEP via `vcWeb` (`crossOriginIsolated` true). Medido 2026-09-21: `streamed/` 17.401 ficheros / 1.436.694.428 B, `web/public/build/reVC.data` 131.983.777 B + `reVC.wasm` 23.115.771 B + `reVC.js` 725.223 B, `manifest.json` 1.242.102 B. Por eso no se copian al repo: en prueba `bun run dev` sirven desde Desktop via middlewares y el juego corre normal; prod necesita mismo header + `/game/` servido aparte.
- `public/game/` — no copiar ni commitear datos: en dev el plugin sirve desde Desktop (`buildUrl=/game/build/` etc. via middlewares, no copiados a `public/`); la prueba tras implementar usa esos middlewares, sin duplicar 1,6 GB en el repo. Anadir a `.gitignore`: `public/game/build/`, `public/game/streamed/`, `public/game/manifest.json`, `*.wasm`, `*.data` si se cuelan.
- Despliegue a server de prueba (sin inflar el repo): los 1,6 GB nunca entran a Git. Hallazgo 2026-09-21 (docs Cloudflare): Pages free admite 20.000 ficheros pero max 25 MiB por fichero — `vc.mp4` (250 MB), `reVC.data` (126 MB) y 17.401 ficheros de `streamed/` no pasan por Pages; van a R2 (free: 10 GB-mes storage, 1 M ops A, 10 M ops B, egress 0). Recomendado: Pages para el portfolio (repo Git sin datos) + bucket R2 `game/` con dominio propio (`game.tudominio.com`) para `build|streamed|manifest.json` + `vc.mp4`. Opciones: (A) mismo host por `scp/rsync` a `/game/` (prueba rapida, sin CORS, con COOP/COEP en el server); (B) R2 + CDN (definitivo gratis: `GET` publico, CORS `*`, `Cache-Control: no-store` en `streamed/`, COOP/COEP en Pages via `_headers`). En ambos el shell usa URLs por entorno (`VITE_VC_BUILD_URL|STREAMED_URL|MANIFEST_URL|TRAILER_URL`, default `/game/...` en prueba y Desktop via `vcWeb` en dev). GitHub/Git bloquean >100 MB y el clone se volveria impracticable. `manifest.json` (1,2 MB) se sube con los datos o se regenera con `tools/gen_manifest.py`. El streaming ya es on-demand (`ondemand.js` fetch + IDB): con R2 funciona (soporta Range + CORS), no hay que reprogramarlo, solo apuntar URLs + subir con `wrangler/rclone` (no Git). Cache IDB (`vcod2`): lo pedido queda en IndexedDB y la 2ª vez no pide al server (salvo `probe`: 3×HEAD + `manifest.json`, minusculo); `build/reVC.*` va por cache HTTP del navegador, no por IDB. Cap default `idbCapMB: 900` + `warmMB: 64`: como `streamed/` son 1,37 GB, con cap 900 MB habra recorte y siempre habra on-demand residual; `idbCapMB: 0` lo guarda todo (~1,4 GB por navegador, limite del navegador) pero el primer arranque igual descarga todo una vez. IDB es por navegador/origen, no se puede pre-sembrar desde el repo.
- `.gitignore` — edit: agregar lineas de datos del juego (ver arriba) sin tocar lo existente.
- `.agents/decisions/013-vicecity-jugable-embebido.md` — create (`proposed`): sin ruta, shell por estado, `fill parent`, datos fuera del bundle, COOP/COEP, fade como revelado, `Enter` en dos fases.
- `.agents/DESIGN.md` §1/§3/§5 — edit al ejecutar: estado transversal suma `useViceCityGame`, rutas quitan `/vicecity`, rendimiento anota `reVC` diferido + datos externos + COOP/COEP.

### Restricciones

- RULES 0.1-0.13: sin Git, sin borrar sin aprobacion (ViceCityView), un componente principal (`ViceCityExperience`), scripts solo con permiso, cero duplicacion (una senal de truco, un shell, un `startGame`), sin secretos, plan antes de ejecutar, DoD + memoria antes de CLOSED, ADR permanente, codigo 100% ingles.
- CODING_STANDARDS §1 orden SFC (`script` imports/tipos/props-emits/refs/computed/watch-handlers, `template` kebab-case, `style` solo si Tailwind no alcanza); §2 naming (`isVideoFaded`, `handleReveal`, `GAME_BUILD_URL`); §3 contratos tipados + textos en i18n si hace falta copy visible; §4 sin `console.log`, `play().catch` y `startGame` con `onError` explicito; §7 Tailwind-first `@apply`, cero margenes (flex+gap+padding), sin `width/height` fijos con `grow/shrink`, sin `[...]` salvo permiso, fade con utilidades estandar (`transition-opacity duration-700 opacity-0`).
- DESIGN: no duplicar WebGL, diferido fuera de `NAV_SECTIONS` (el `vendor` + shell entran por `import()` dinamico, no al arranque), no empeorar arranque medido; COOP/COEP justificado en plan.
- Port: respetar `crossOriginIsolated`, `fill parent` obligatorio, una instancia, audio por gesto (el `Enter` del truco ya es gesto), `F11`/`pointerLock` por defecto del lib.

### Steps

1. read `src/composables/useViceCityCode.ts`, `src/App.vue`, `src/router/index.ts`, `src/views/ViceCityView.vue`, `vite.config.ts`, `.gitignore`, `Nueva carpeta/web/lib/index.js:98-145,199-276,319-326,655-709`, `styles.js`, `vite.js`, `.agents/DESIGN.md` §1/§3.
2. create `src/vendor/gtavc-web/index.js` desde `Nueva carpeta/web/lib/index.js` (copia exacta, cabecera de origen intacta).
3. create `src/vendor/gtavc-web/styles.js` desde `Nueva carpeta/web/lib/styles.js`.
4. create `src/vendor/gtavc-web/vite.js` desde `Nueva carpeta/web/lib/vite.js`.
5. create `src/vendor/gtavc-web/index.d.ts` desde `Nueva carpeta/web/lib/index.d.ts`.
6. create `src/composables/useViceCityGame.ts` (estado shell + `openExperience/revealGame`, ingles, sin router).
7. create `src/components/vicecity/ViceCityExperience.vue` (capas juego z-menor + video z-mayor + fade negro, `startGame fill parent`, `onReady` + `__vcFrame` -> ready, `play().catch` documentado).
8. edit `src/composables/useViceCityCode.ts` (quitar `router.push`, llamar `openExperience`, segundo `Enter` para reveal solo si ready).
9. edit `src/router/index.ts` (quitar `vicecity` de `RouteName` + ruta, agregar redirect `/vicecity -> /`).
10. edit `src/App.vue` (cambiar `isTrailerView` por `isExperienceVisible`, montar shell, chrome oculto).
11. edit `vite.config.ts` (plugin `vcWeb` con `streamedDir/assetsDir` absolutos a Desktop, hereda COOP/COEP).
12. edit `.gitignore` (ignorar `public/game/build|streamed|manifest.json`, `*.wasm`, `*.data`).
13. create `.agents/decisions/013-vicecity-jugable-embebido.md` (`proposed`, template ADR).
14. Verificacion (siguiente seccion); con resultado `EXECUTED` + registro real; `CLOSED` solo con DoD + memoria.

### Verificacion

- Autorizada solo con permiso (0.4): `bun run lint:check`, `bun run format:check`, `bun run build` (`vue-tsc -b && vite build`). Sin permiso, reportar pendiente con motivo exacto. `node scripts/verify.mjs` opcional para frontmatter del plan.
- Inspeccion sin permiso: `crossOriginIsolated` en consola dev, `div.vc-root[data-fill=parent]` presente, `canvas.vc-canvas` bajo `video`, red `/game/build/reVC.js` + `/manifest.json` 200 servidos desde Desktop via `vcWeb` (no `text/html`). La prueba tras implementar corre con `bun run dev` sin copiar `streamed/` al repo.
- Manual (navegador, criterio del usuario): (1) `vicecity`+`Enter` sin cambio de URL; (2) 3 s panel+ruido, luego video encima + juego cargando debajo; (3) `Enter` con juego no listo = no-op; (4) `Enter` con juego listo = fade negro ~700 ms -> juego visible, video `pointer-events-none`; (5) recarga = estado limpio, hay que re-teclear; (6) `/vicecity` directo redirige a `/` sin juego; (7) resto del sitio intacto.
- Higiene: sin `console.log`, sin secretos, sin `[...]` nuevo, sin duplicar senales, vendor intacto salvo cabecera.

### Riesgos

- R1 COOP/COEP global rompe Leaflet tiles o fuentes: mitigar midiendo dev + documentar; alternativa (headers solo en preview del juego) se descarta por pthreads.
- R2 Datos GB fuera del repo (medido: `streamed/` 1,37 GB + `build/` ~150 MB): si Desktop cambia de ruta, dev cae a `vc-msg`; prod sin `/game/` estatico no arranca (mensaje del lib, no crash). Copiarlos al repo duplicaria 1,6 GB en `public/` + `dist/` y se commitearian por error: por eso se sirven, no se copian, y la prueba usa dev.
- R3 Doble WebGL (fondos + motor) + video 250 MB: jank en arranque; no optimizar sin medir (DESIGN §3).
- R4 `destroy()` no libera wasm: el shell no se desmonta/remonta en bucle; segunda `vicecity` con shell abierto = no-op.
- R5 `.vc-root` viewport por defecto taparia todo: `fill: 'parent'` es obligatorio y se valida en revision.

### Relacion con planes y ADR previos

- Extiende `portfolio-agents-refresh-vicecity-easter-egg` (EXECUTED) y `portfolio-vicecity-sound-trailer-gating` (EXECUTED): no se reescriben; este posee shell jugable, retiro de ruta y fade.
- ADR-009/010 siguen vigentes para disparo/panel/ruido/trailer; lo nuevo (shell sin ruta, vendor copiado, datos externos, fade por `Enter`) va al ADR-013. ADR-009 no se edita (0.12).

## Registro De Ejecucion (2026-09-21 13:30)

> Ejecutado sobre la orden explicita "ejecuta el plan" (vale como aprobacion del `ENRICHED` y compuerta `READY -> EXECUTED`). Sin Git en ningun momento (pedido del usuario: sin commits).

### Archivos tocados (6 codigo + 5 config/docs; 4 copias exactas)

| Archivo | Cambio real |
| --- | --- |
| `src/vendor/gtavc-web/index.js|styles.js|vite.js|index.d.ts` | Copia exacta del port (SHA-256 identico 4/4); no se tocan |
| `src/vendor/gtavc-web/vite.d.ts` | Nuevo: tipos del plugin (importa `VcWebPluginOptions` de `./index.js`); lo exige `tsconfig.node` (nodenext) |
| `src/composables/useViceCityGame.ts` | Nuevo: `isExperienceVisible/isVideoVisible/isVideoFaded/isVideoHidden/isGameReady` + `openExperience/markVideoStarted/markGameReady/revealGame` (fade 750 ms) |
| `src/components/vicecity/ViceCityExperience.vue` | Nuevo (async chunk): juego `fill: parent` (z-40) + video (z-50, `bg-black`, `transition-opacity duration-700`) + `startGame` y `video.play()` juntos al caer el ruido; listo = `__vcFrame`; URLs por env con default `/game/...` |
| `src/composables/useViceCityCode.ts` | Sin `useRouter`/`router.push`; `activate()` abre el shell (no-op si ya visible); con shell visible solo atiende `Enter` -> `revealGame()` |
| `src/router/index.ts` | Fuera `'vicecity'` de `RouteName` y la ruta lazy; `/vicecity` redirige a `/` |
| `src/App.vue` | `isTrailerView` (por ruta) -> `isExperienceVisible` (por estado); shell async tras `router-view`; sin `computed`/`useRoute` (quedaban sin uso) |
| `vite.config.ts` | Plugin `vcWeb` (dirs por env con default al Desktop, COOP/COEP); solo afecta dev/preview |
| `.gitignore` | Ignora `public/game/`, `*.wasm`, `*.data` |
| `eslint.config.mjs` + `.prettierignore` | Desvio documentado: `src/vendor/**` fuera de lint/format (terceros con formato propio; si no, `prettier` falla por los `;` del upstream) |
| `.agents/decisions/013-vicecity-jugable-embebido.md` | Nuevo, `proposed` |
| `.agents/DESIGN.md` | §1 rutas/estado/ADRs, §3 juego diferido, §5 `vcWeb` |
| `src/views/ViceCityView.vue` | Intacto a proposito: borrarlo exige aprobacion 0.2; queda sin ruta (muerta, pendiente de limpieza) |

### Desvios respecto del enriquecido

1. `vite.d.ts` extra (no estaba en steps): sin el, `vue-tsc -b` (nodenext) no resuelve `./vite.js` en `vite.config.ts`.
2. Ignores de vendor en `eslint`/`prettier`: el lib upstream usa `;` y otra anchura; lintarlo romperia `lint:check`/`format:check` sin aportar nada.
3. Trailer sigue bundelado (`import vcTrailer`): externalizarlo a R2 es paso de despliegue con decision de host pendiente, no de codigo.

### Verificacion real

- Copias: SHA-256 origen=destino en los 4 ficheros (ver sesion).
- `bun run lint:check` / `format:check` / `build`: NO ejecutados (regla 0.4: "ejecuta el plan" no autoriza scripts; queda pendiente con este motivo exacto).
- Navegador: pendiente (requiere `bun run dev` + datos en Desktop + autorizacion).

### Follow-up open-fail `kb_planter+bush.dff` 2026-09-21 (causa probada, fix en ejecucion)

- Sintoma: `ODSHORT open-fail models/gta3.img/kb_planter+bush.dff errno=44` repetido + `Error al leer el DVD` en juego; el resto de la ciudad carga bien.
- Causa (codigo, no hipotesis): el cliente pide `.../kb_planter%2Bbush.dff` (`ondemand.js:941`, `encodeURIComponent` por segmento, correcto). Quien sirve `/game/*` es el static middleware de Vite (`vite/dist/node/chunks/dep-*.js:35530`, `decodeURI(url.pathname)`), y `decodeURI` NO decodifica `%2B`: busca un fichero literalmente llamado `kb_planter%2Bbush.dff`, falla y cae al fallback SPA (`index.html`), que el guard del lib rechaza (`isHtmlHead`/content-type, `ondemand.js:946`). El fichero existe en disco y en el manifest (`s: 20480`).
- Fix sin recompilar (pedido "solo copea", sin plugin nuevo): `streamed/` se sirve por el `vcWeb` ya montado (`/streamed/`, su `serveDir` usa `decodeURIComponent` y si resuelve `+`), no por `public/`. Defaults del shell: `streamedUrl` `/game/streamed/` -> `/streamed/` (envs mandan igual). Se borra `public/game/streamed/` (1,44 GB liberados, era copia temporal); `public/game/build/` + `manifest.json` se quedan (nombres seguros para el static de Vite).

- Copiados a `public/game/` (gitignored, se eliminan despues): `build/` (reVC.js 725.223 B + reVC.wasm 23.115.771 B + reVC.data 131.983.777 B), `manifest.json` (1.242.102 B) y `streamed/` (17.401 ficheros / 1.436.694.428 B, conteo y bytes identicos al origen). Sirven en dev como `/game/build|streamed|manifest.json`, que son los defaults del shell (sin envs).
- No hizo falta compilar nada: el build ya existia en `Nueva carpeta/web/public/build/`.
- Ojo: `vite build` tambien copiaria `public/game/` a `dist/` (~1,6 GB extra): borrar `public/game/` antes de un build de despliegue o asumir la espera.
- Follow-up barra/Enter/fin (ejecutado 2026-09-21, verificado en lecturas): override `.vc-bar/.vc-msg` z 60 en `style.css`; video hasta `Enter` con juego listo o `ended` (fade igual, negro hasta que cargue); `Enter` consumido en captura; preload lineal real con barra propia.
- Follow-up DOM/scroll 2026-09-21 (ejecutado, verificado en lecturas): con shell activo y ruido ya fuera, el portafolio sale del DOM (`isPortfolioVisible = !isExperienceVisible || isTrickActive` en `App.vue`, solo queda el shell); scroll bloqueado (`overflow hidden` en `body`+`html`, con restore en `onBeforeUnmount`); el video ya se desmontaba tras el fade (`v-if="!isVideoHidden"`), sin cambio ahi.
- Follow-up mapa/toast/cursor 2026-09-21 (ejecutado, verificado en lecturas): `crossOrigin: true` en tiles OSM; pointer lock automatico al revelar (watcher `isVideoFaded` + gesto del `Enter`, fallback a primer click si el video termino solo); toast propio inicial `game.setupHint` (i18n es+en).
- Follow-up toast khatarsis 2026-09-21 (ejecutado, verificado en lecturas): toast propio eliminado; `toast()` de khatarsis (`top-center`, 8 s, `game.setupHint`) con host `<k-toast />` en el shell; dispara en `watch(isGameReady)` (juego listo, no con el video).
- Follow-up iconos contacto 2026-09-21 (ejecutado, verificado): `invert` incondicional -> `dark:invert` en las 2 `k-image` (orden `sm:` antes de `dark:` segun precedente del repo).
- Follow-up titulos + recarga 2026-09-21 (ejecutado, verificado en lecturas): `useDocumentTitle` centraliza (base `meta.siteName`, seccion con `✦` + `nav.*`, juego estable; `main.ts` ya no escribe titulo); `index.html` a `portfolio`; `MainView` restaura seccion post-mount; `useSectionSpy` protege rutas con `meta.section`.
- Follow-up efectos re-verificado 2026-09-21 (lectura cruda `Get-Content -Raw` + `.Contains`, sin depender de lineas): 0/13 nombres en `dist/public` Y en `dist` (apps); `ripple` solo aparece como `k-button-ripple`. Reconciliacion: en fuente (`src/effects/*` + `index.ts` auto-registro, `spotlight.ts` del 27/08, tarball del 18/09) si existen; el build instalado los podo (`sideEffects: ["**/*.css"]`). Veredicto sin cambio: con `khatarsis-1.0.0` instalado es imposible verlos; fix en repo lib (sideEffects o imports explicitos + `build:public` + reinstalar tgz), pendiente de tu OK.

- Follow-up estrella/cursor/toast 2026-09-21 (ejecutado, verificado incl. byte U+2605): separador `★`; cursor a z-index maximo; toast sin clamp via `class: k-toast-full-text` (override documentado).

- Follow-up recarga robusta 2026-09-21 (ejecutado, verificado en lecturas): `history.scrollRestoration = 'manual'` (nativa peleaba con Lenis); restore de `MainView` inmediato; espia solo sale de pendiente al aterrizar (`scrollY > 0` + hash objetivo) o por timeout 6 s; `scrollTo` acepta `immediate`.

- Follow-up Esc 3 s 2026-09-21 (ejecutado, verificado en lectura): `handleEscDown/Up` en el shell (auto-repeat blindado por `escTimer`, solo con video oculto); convive con el listener del truco (no toca `Escape`).

- Follow-up mapa/espia/toast 2026-09-21 (ejecutado, verificado en lecturas): mapa `scrollWheelZoom: false` + fuera `stopWheelPropagation` (+ cleanup muerto); espia reescrito sin estado (objetivo live + gracia 3 s; se reparo un duplicado de edicion); toast con juego visible (`isVideoHidden && isGameReady`).

- Follow-up pre-subida Netlify 2026-09-21 (ejecutado, verificado): trailer a `public/game/trailers/` (bytes identicos) + `VITE_VC_TRAILER_URL` (default `/game/trailers/vc.mp4`); `src/assets/trailers/vc.mp4` borrado (dir queda vacio); `netlify.toml` con build bun + COOP/COEP + cache + seguridad basica.

- Follow-up truco limpio 2026-09-21 (ejecutado, verificado en lecturas): ruta `/` por replace con guardia; titulo `VC`; icono intacto (vendor no lo toca); prefetch idle del chunk; fuera overflow redundante; rampa volumen 0->1 en 3 s + fade-in visual + pausa al ocultar.

- Follow-up hosting pesado 2026-09-21 (investigacion): recomendado Backblaze B2 (sin tarjeta oficial, 10 GB gratis, S3, CORS, egress 3x gratis); R2 pide tarjeta; Firebase Storage exige Blaze; Storj es trial 30 dias; HF/Archive son publicos (no aptos para assets retail). Al usar B2, `COEP` en netlify.toml pasa a `credentialless` (script clasico cross-origin).

- Follow-up subida B2 2026-09-21 (ejecutado por el orquestador con remoto `vice` del usuario; key jamas pedida ni vista): `build/` (4 ficheros), `manifest.json`, `vc.mp4` y `streamed/` (17401 objetos / 1436694428 B identicos + `kb_planter+bush.dff` verificado) en bucket `vicecity`; keys y MimeTypes correctos. Pendiente lado usuario: pasar bucket a Public o Worker + CORS; luego envs + `COEP credentialless`.
- Follow-up CORS B2 2026-09-21 (correccion del usuario, correcta): origenes exactos del front, no `*` (protege el egress gratuito de hotlinking; CORS igual no es control de acceso real).
- Follow-up Worker B2 2026-09-21 (codigo entregado en chat, no en repo): bucket quedo privado (public exige tarjeta); proxy en Cloudflare Workers (subdominio workers.dev gratis) con `B2_KEY_ID/B2_APP_KEY` por secrets del dashboard (jamas en chat/codigo); re-autoriza ante 401, streaming con Range, CORS por allowlist + `CORP: cross-origin` (vale con `COEP require-corp`, sin tocar netlify.toml). Pendiente usuario: desplegar worker + pasarme el host para las env de Netlify.

- Follow-up despliegue Netlify 2026-09-22 (en ejecucion): revision de lo que faltaba para subir el sitio.
  - Hallazgos medidos en el repo: (1) las 4 envs `VITE_VC_*` no existian en ningun lado (sin `.env`, sin `[build.environment]`), asi que el dist apuntaba a los defaults de dev (`/game/build/`, `/game/manifest.json`, `/game/trailers/vc.mp4`, `/streamed/`); (2) `public/game/` (402 MB: build 149 MB + trailer 251 MB + manifest 1,2 MB) entraba al `dist/` (el dist del 2026-09-21 19:22 pesa 402 MB y lo lleva); (3) ese `dist/` era anterior a los ultimos follow-ups (titulo/recarga, espia, toast, Esc, trailer movido a `public/game/trailers/`); (4) `netlify.toml` no tenia fallback SPA, asi que `/projects` y `/contact` daban 404 con `createWebHistory`; (5) `reVC.js` se carga con `<script>` clasico cross-origin (`src/vendor/gtavc-web/index.js:558-561`), lo que con `COEP: require-corp` exige `Cross-Origin-Resource-Policy: cross-origin` en el host de datos (el `<video>` tambien necesita CORP o CORS); (6) el host de datos no esta registrado en el repo (el Worker se entrego en chat, no como archivo).
  - Decisiones del usuario (2026-09-22): excluir los 402 MB del dist; agregar `_redirects` + `_headers` en `public/` para que viajen dentro del dist (deploy por SDK/CLI); autorizado ejecutar `lint:check`, `format:check` y `build`.
  - Ejecutado: `public/_headers` y `public/_redirects` nuevos, como unica fuente de headers/redirects del deploy; `netlify.toml` queda solo con el build mas una nota que apunta a esos archivos (evita dos fuentes del mismo header, RULES 0.6).
  - Ejecutado tambien: `public/game/**` fuera de `lint:check` y `format:check` (`eslint.config.mjs` + `.prettierignore`), mismo criterio que el desvio de `src/vendor/**` ya documentado: es salida generada de Emscripten (reVC.js 725 KB + manifest.json 1,2 MB) y formatearla o lintarla rompe la verificacion sin aportar nada.
  - Desvio documentado: NO se borro `public/game/` aunque la opcion elegida lo decia. `public/game/trailers/vc.mp4` (251 MB) es la **unica copia local** (no aparece en el Desktop) y borrarlo es irreversible. Se excluye del dist de forma reversible (se borra `dist/game` despues del build). Si el bucket confirma que tiene `vc.mp4`, se puede borrar `public/game/` con una orden explicita (0.2).
  - Pendiente bloqueante: la URL base del host de datos para inyectar las 4 envs en el build (`import.meta.env`, se hornean al construir); sin ellas el juego y el trailer no cargan en Netlify.
  - Verificacion ejecutada (autorizada 2026-09-22): `bun run lint:check` exit 0, `bun run format:check` exit 0 y `bun run build` (`vue-tsc -b && vite build`) exit 0 — primera vez que el typecheck pasa con la libreria local en este plan. Prettier reformateo 3 archivos propios del plan que estaban desviados (`ViceCityExperience.vue`, `useDocumentTitle.ts`, `vite.config.ts`).
  - Dist resultante: **1,5 MB** (antes 402 MB) con `_headers` y `_redirects` dentro; `dist/game` eliminado tras el build (regenerable) y `public/game/` intacto. Arranque medido: `index-*.js` 498.844 B (175,89 kB gzip) + `index-*.css` 387.932 B (43,87 kB gzip) = 886.776 B crudo, mejor que el presupuesto anotado en `DESIGN.md` §3 (1.067.848 B) — se actualiza al cerrar.
  - Confirmado en el chunk: sin envs el shell apunta a los defaults de dev (`/game/build/`, `/game/manifest.json`, `/game/trailers/vc.mp4`), asi que el dist actual sirve el portafolio pero **no** arranca el juego; el build definitivo va despues de fijar las URLs.
  - Sin Git en ningun momento (pedido explicito del usuario, 2026-09-22).

## Cierre (memoria persistente)

> Pendiente. Se completa al cerrar el plan (DoD de `.agents/WORKFLOW.md`).

- Que cambio: [resumen real]
- Verificacion: [comando ejecutado y resultado, o pendiente con motivo]
- Resultado: [aprobado / no necesario / pendiente aceptado explicitamente]
- Pendientes: [si existen]
