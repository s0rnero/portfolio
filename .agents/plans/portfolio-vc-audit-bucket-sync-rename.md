---
name: portfolio-vc-audit-bucket-sync-rename
status: ENRICHED
type: maintenance
domain: portfolio
owner_rules: .agents
created: 2026-09-23 12:00
enriched: 2026-09-23
---

# Plan: Auditoria VC — sync al repo del juego + renombre a VC + limpieza

> Compuerta atendida 2026-09-23: frase explicita **"enriquece el plan"** (`PENDING -> ENRICHED`). Estado actual **`ENRICHED`**, pendiente revision critica del orquestador + visto bueno del usuario antes de `READY`. No se ejecuto codigo, Git, borrados ni scripts bloqueados. El plan `portfolio-glitch-cursor-lag-git-recommit` no se toca (sigue en `ENRICHED`).

## Objetivo (original + ajustes 2026-09-23)

- A. Aclarar donde vive el juego y si `public/game/` se usa (verificado por lectura, ver Alcance).
- B. Mover (copiar) de este repo a la raiz del juego (`C:/Users/s0rno/Desktop/Nueva carpeta`) lo necesario para que el bucket + config web queden al dia alla. Executor hara la copia en ejecucion.
- B2. Desacoplar este repo de rutas absolutas al Desktop: ninguna ruta `C:/.../Nueva carpeta` hardcodeada; todo por `.env` (`VC_STREAMED_DIR`, `VC_ASSETS_DIR`) con fallback seguro + aviso si falta.
- C. Auditar y eliminar archivos no usados (autorizacion de borrado concedida por el usuario el 2026-09-23 para los no usados; ejecucion borra solo la lista cerrada abajo).
- D. Renombrar archivos con `vicecity` a `VC` en sus nombres (solo `src/`, sin tocar ADR/planes/history).
- E. Cachear el build (`reVC.wasm` + `reVC.data`) en Cache Storage para no descargarlo en cada apertura; maximizar Cache Storage con criterio (build + manifiesto si, `streamed/`/tar/trailer no, con motivo).
- F. Cero comentarios en el codigo por defecto (pedido 2026-09-23; decision 2026-09-23: los ficheros del juego quedan EXCLUIDOS, sus comentarios no se tocan): auditar y eliminar comentarios salvo lista vital confirmada (ver Alcance F).
- G. Eliminar el harness de testing movil (pedido 2026-09-23): `?perf=1` + `public/diag.js` + `?q=` + canal `vc-quality` + override guardado; no debe quedar rastro. El nucleo productivo de calidad se conserva (ver Alcance G).

## Alcance confirmado por lectura 2026-09-23

- Motor: `src/vendor/gtavc-web/` (5 ficheros; `index.js` 1179 lines, `VERSION 2026-09-19-orig1`; `vite.js` plugin dev con `Cache-Control: no-store`). `probeBuild` (`index.js:473-478`) pide `HEAD reVC.js/wasm/data`; `locateFile: buildUrl + path` (`:957`); IDBFS solo monta `/userfiles` (guardados, `:962-975`): el build NO vive en IndexedDB; `streamed/` si (`OD.ensure`/`OD.idbPut`, ADR-014/015).
- Shell: `src/components/vicecity/ViceCityExperience.vue` (288 lines; `BUILD_FILES`, `fileSize` HEAD + `preloadBuildFile` GET en cada `handleStartGame`, `:137-143`).
- Estado compartido: `src/composables/useViceCityGame.ts` (84 lines); trigger: `src/composables/useViceCityCode.ts` (81 lines, `CODE='vicecity'`).
- Legacy huerfana: `src/views/ViceCityView.vue` (37 lines, nadie la importa; `/vicecity` redirige a `/` en `src/router/index.ts:71-75`; unica importadora de `@/assets/trailers/vc.mp4`).
- Datos fuera de Git (`.gitignore`: `public/game/`, `*.wasm`, `*.data`, `src/assets/trailers/*.mp4`): dev = checkout local via `vcWeb` (`vite.config.ts:68-71`, absolutas al Desktop) + fallback `public/game/` (local: `build/`, `manifest.json` 1 linea, `trailers/vc.mp4` + `vc_master.mp4`, `vc-streamed.tar.gz`); deploy = R2 via Worker (`worker/vc-data.js` 80 lines + `wrangler.toml` con `account_id`, URLs en `.env.production` verificado sin secretos).
- Destino verificado: `C:/Users/s0rno/Desktop/Nueva carpeta` existe con layout upstream (`assets/`, `streamed/`, `build/`, `web/` con `lib/`, `public/`, `ondemand.js`, `vite.config.js`, `index.html`); su `.gitignore` ya excluye `build/`, `*.wasm`, `*.data`, `assets/`, `streamed/`, `web/public/build/`, `web/public/manifest.json`, `*.log`.
- i18n: grupos `trick`/`game` en `es.ts`/`en.ts` sin la cadena `vicecity` en claves: el renombre no toca locales.
- F. Comentarios (inventario 2026-09-23 por lectura, `rg` line-start + `<!--`; excluye `node_modules/dist/public/game`):
  - Conteo: `ViceCityExperience.vue` 29, `useQuality.ts` 48, `index.js` vendor 193+26 trailing, `diag.js` 52, `setup.mjs` 49, `worker/vc-data.js` 15, `.env.production` 14, `App.vue` 12, `vite.config.ts` 11, `MapCard.vue` 8, resto `src/` 1-6 por fichero, `_headers` 6, resto raiz 2-4.
  - Alcance de limpieza: `src/` (menos juego y vendor, ver abajo), `worker/`, `index.html`, raiz (`vite.config.ts`, `eslint.config.mjs`, `.svgo.config.mjs`, `netlify.toml`, `public/_headers`, `public/_redirects`, `.env.production`).
  - Excluidos (no se tocan): ficheros del juego (decision 2026-09-23: `src/vendor/**`, `VCExperience.vue`, `useVCCode.ts`, `useVCGame.ts`: sus comentarios quedan tal cual) + `scripts/setup.mjs` + `scripts/verify.mjs` (nucleo del harness, se sobrescribe en cada update) + `.agents/**` (memoria/docs, no codigo) + generados e ignorados. `public/diag.js` no entra en F: se elimina entero en la pata G.
  - Vital confirmado por el usuario (se conserva): 1) credito Apache 2.0 `touch_app` en `GlitchCursor.vue` (la licencia exige conservar attribution notices: OBLIGATORIO), 2) comentario fase `capture` del `Enter` en `useVCCode.ts` (fichero de juego: queda por exclusion general), 3) header de `.env.production` (contrato de URLs), 4) header de `worker/vc-data.js` (duplica ADR-015). Default: todo lo demas fuera, incluidos los comentarios en espanol (ya violan English-only).
- G. Harness testing movil (rastro verificado 2026-09-23): `public/diag.js` (580 lines, panel `?perf=1` con modos `q lite/full`, A/B `terminalScale/terminalFps`, `vc-quality`, `localStorage portfolio-quality`) + `index.html:102-112` (loader `/diag.js` + 2 comentarios HTML) + `useQuality.ts:64-82,91-98,100-127` (`storedLite`, `urlLite` `?q=`, `persist`, `setLite`, `patchQuality`, listener `initQuality`) + `main.ts:6` (llamada `initQuality`).
  - Se elimina: `public/diag.js` (delete), bloque loader de `index.html` (edit), `?q=`/`vc-quality`/`storedLite`/`persist`/`setLite`/`patchQuality`/`initQuality` (edit en `useQuality.ts` + `main.ts`).
  - Se conserva (nucleo productivo, ADR-018/019): `quality` reactivo + `derived()` (defecto full + `terminalScale` 0.25 en tactil) + consumidores (`App.vue`, `GradualBlur.vue`, `FaultyTerminalBackground.vue` via props). Quitar tambien esto contradice ADR-018 (calidad adaptada al dispositivo) y exige ADR nuevo: flag para revision READY. Pregunta abierta al usuario: ¿el `quality` productivo tambien fuera (hardcodear full en los 3 consumidores) o se queda?

## Plan Tecnico

### Analisis

- Objetivo: mismo arbol y mismo comportamiento; solo cambia donde se guarda el build (Cache Storage), como se configura el dev (env), los nombres de ficheros y la copia al juego. Sin cambios visuales ni de gameplay.
- Scope: `src/components/vicecity/` + 2 composables + `src/views/ViceCityView.vue` + `src/components/vicecity/ViceCityExperience.vue` (cache) + `vite.config.ts` + `create .env.example` + borrados autorizados + copia a `Nueva carpeta/web|raiz`.
- Archivos: los 6 de portfolio listados en Steps + destinos en `Nueva carpeta` (`web/lib/`, raiz, `web/public/`, docs).
- Riesgos: snap de imports tras renombre (mitigado: mapa cerrado + grep); `ViceCityView` importaba el unico `vc.mp4` bundelado (si se borra la vista, el import muere con ella); absolutas eliminadas rompen dev sin env (mitigado: warn + fallback + `.env.example`); `wrangler.toml` con `account_id` (revisar, no commitear a ciegas); HEADs del motor (`exists()`) siguen en red (bytes, aceptado; los GET gordos si se eliminan); cuota Safari si se duplicara IDB+Cache (mitigado: sin duplicar `streamed/`).

### Cambios

- Renombre D (carpeta + 3 ficheros; la vista huerfana se borra, no se renombra): `src/components/vicecity/` -> `src/components/vc/`; `ViceCityExperience.vue` -> `VCExperience.vue`; `useViceCityCode.ts` -> `useVCCode.ts`; `useViceCityGame.ts` -> `useVCGame.ts`. Imports actualizados en `App.vue` (4 sitios: 2 estaticos + 2 dinamicos), `VCExperience.vue`, `useVCCode.ts`, `useDocumentTitle.ts`. Intactos: `CODE='vicecity'`, redirect `/vicecity`, `VITE_VC_*`, claves i18n, ADR/planes.
- Cache E (solo shell, sin tocar `src/vendor/gtavc-web/index.js` ni el esquema `OD`/IDB): `BUILD_CACHE = 'vc-build-<VERSION>'` + `cachedFetch` (`cache.match` primero, `fetch` + `cache.put` en miss, misma URL que el motor) + `fileSize` via cabecera cacheada (HEAD solo en miss) + purga de `vc-build-*` viejos + guard sin Cache API. Progreso de la barra intacto (los bytes se cuentan igual).
- Desacople B2: `vite.config.ts` sin literales `C:/...`; `vcWeb({ streamedDir: process.env.VC_STREAMED_DIR, assetsDir: process.env.VC_ASSETS_DIR })` (undefined = defaults del plugin) + `console.warn` en dev si faltan; `create .env.example` con ambas vars documentadas.
- Borrado C (autorizado): `src/views/ViceCityView.vue`; `src/assets/trailers/vc.mp4` solo si existe en disco y queda sin importadores (verificado: glob 2026-09-23 no lo lista; Executor confirma antes de borrar). `public/game/*`, `dist/`, `.netlify/`, `.freebuff/`, `*.log`: no se tocan.
- Copia B (al final, tras E): a `Nueva carpeta`: `src/vendor/gtavc-web/index.js` -> `web/lib/` (con diff contra `VERSION 2026-09-19-orig1` documentado); `worker/vc-data.js` + `wrangler.toml` -> raiz (revisar `account_id`); contrato `.env.production` -> documentado para `web/`; `public/_headers` (COOP/COEP) -> `web/public/`; ADR-013/014/015 como spec. Nunca: `node_modules`, `dist/`, locales.

### Restricciones

- RULES 0.1: Git de lectura solo con autorizacion; la copia entre repos es por ficheros, no por Git; `force-push` no aplica aqui.
- RULES 0.2: borrado autorizado 2026-09-23 limitado a la lista cerrada (vista + trailer huerfano si existe); nada mas se borra.
- RULES 0.3: excepcion multi-pata autorizada por el usuario; cada pata toca su archivo.
- RULES 0.4: `bun run dev/build/preview/lint/format` solo con autorizacion; bun; solo scripts reales.
- RULES 0.8: `account_id` de `wrangler.toml` no se publica sin revision; `.env.production` sin secretos.
- RULES 0.10/0.11/0.12: planes/ADR permanentes (no renombrar ni editar retroactivamente).
- RULES 0.13 + STANDARDS §2.1: codigo/comentarios en ingles; destinos `VCExperience.vue`, `useVCCode.ts`, `useVCGame.ts`, `src/components/vc/`, `BUILD_CACHE`, `cachedFetch`.
- Nueva convencion del repo (pedido 2026-09-23, vale para este plan y en adelante salvo ADR en contra): cero comentarios en el codigo por defecto; solo la lista vital confirmada. Executor elimina el resto al tocar cada archivo (si un edit ya reescribe el bloque, el comentario cae ahi; pasada final `rg` para el resto).
- STANDARDS §7/§8 + DESIGN.md: sin cambios de estilos, visibilidad, capas ni contratos; el `caches` es almacenamiento, no arquitectura nueva (sin Service Worker).
- Skills subordinadas: `vue-best-practices` (estado minimo, sin re-renders extra: el cache no crea reactividad nueva).

### Steps (orden de ejecucion: D -> E -> B2 -> C -> G -> F -> B)

1. Archivo: `src/views/ViceCityView.vue` + importadores — Accion: `read`/`grep` — Detalle tecnico: confirmar que sigue sin importadores (`grep ViceCityView` en `src/` debe dar solo su propio fichero) y que `@/assets/trailers/vc.mp4` solo se importa ahi. Si aparece un importador nuevo, parar y reportar. — Restricciones: solo lectura.
2. Renombre D — Accion: `rename` (4 movimientos) + `edit` imports — Detalle tecnico: `src/components/vicecity/ViceCityExperience.vue` -> `src/components/vc/VCExperience.vue`; `src/composables/useViceCityCode.ts` -> `src/composables/useVCCode.ts`; `src/composables/useViceCityGame.ts` -> `src/composables/useVCGame.ts`; actualizar `App.vue:17-18,32-39` (2 imports + 2 dynamic `import()`), `VCExperience.vue:5-13` (imports `useVCCode`/`useVCGame`), `useVCCode.ts:3` (import `./useVCGame`), `useDocumentTitle.ts:5` (import `./useVCGame`). Verificar con grep que no queda `from '@/composables/useViceCity` ni `components/vicecity` en `src/`. — Restricciones: no tocar `CODE`, redirect, env, i18n, ADR/planes; English-only.
3. Cache E — Accion: `edit` `src/components/vc/VCExperience.vue` (script) — Detalle tecnico: anadir (English comments) `const BUILD_CACHE = 'vc-build-2026-09-19-orig1'` (atado a `VERSION` del vendor) + `cachedFetch(url)` (match-first, put-on-miss con `cache.put(url, response.clone())`, guard `if (!('caches' in window)) return fetch(url)`) + purga de `vc-build-*` distintos en `handleStartGame` antes de precargar; `fileSize` intenta cabecera de `cache.match` antes del `HEAD`; `preloadBuildFile` usa `cachedFetch`. Comportamiento de `buildPct`/`loadPct` intacto. — Restricciones: sin tocar vendor ni `OD`/IDB; sin Service Worker; sin reactividad nueva; English-only.
4. Desacople B2 — Accion: `edit` `vite.config.ts` + `create` `.env.example` — Detalle tecnico: sustituir los literales `C:/Users/s0rno/Desktop/Nueva carpeta/...` por `process.env.VC_STREAMED_DIR` / `process.env.VC_ASSETS_DIR` (undefined = defaults del plugin) + `console.warn('[vcWeb] VC_STREAMED_DIR/VC_ASSETS_DIR not set, using defaults; see .env.example')` solo en dev; `.env.example` con ambas vars + comentario (donde apuntar tras mover la carpeta). Grep final `C:/Users` + `Nueva carpeta` en cero en el repo (excluyendo este plan y `.agents/plans/` historia). — Restricciones: no cambiar plugins ni alias; no commitear valores locales (`.env.example` solo, sin `.env` local).
5. Borrado C (autorizado) — Accion: `delete` — Detalle tecnico: borrar `src/views/ViceCityView.vue`; borrar `src/assets/trailers/vc.mp4` unicamente si existe en disco y `grep @/assets/trailers/vc.mp4` en `src/` da cero tras el paso 2. Reportar cada borrado. — Restricciones: solo esa lista; si algo no existe, se registra como "ya ausente", no es error.
6. Copia B — Accion: `copy` (lectura en portfolio, escritura en `Nueva carpeta`) — Detalle tecnico: `worker/vc-data.js` -> `<juego>/worker-vc-data.portfolio.js` (o ruta que indique el usuario en ejecucion; por defecto raiz con sufijo para no pisar); `wrangler.toml` -> igual, tras revisar `account_id`; `src/vendor/gtavc-web/index.js` -> `<juego>/web/lib/index.js` solo si el diff contra su `lib` aporta (prefetch/archive/`OD.idbPut`); `.env.production` (contrato de URLs) + `public/_headers` (COOP/COEP) + ADR-013/014/015 como documentos de referencia. Cada copia con confirmacion de destino antes de escribir fuera del workspace. — Restricciones: no pisar sin confirmar; no copiar `node_modules/dist/locales`; no llevarse absolutas.
7. Harness G — Accion: `delete` + `edit` — Detalle tecnico: `delete public/diag.js`; `edit index.html` (fuera bloque loader `?perf` + sus 2 comentarios HTML, resto intacto); `edit src/composables/useQuality.ts` (fuera `storedLite`, `urlLite`, `persist`, `setLite`, `patchQuality`, `initQuality` + `STORAGE_KEY`; `initial()` queda `{ lite: false, ...derived(false) }`; sus comentarios caen salvo vitales que confirme el usuario); `edit src/main.ts` (fuera import + llamada `initQuality`). Grep final en cero en `src/index/public`: `diag`, `?perf`, `perf=1`, `vc-quality`, `portfolio-quality`, `urlLite`, `storedLite`, `setLite`, `patchQuality`, `initQuality` (sensible a mayusculas, excluyendo historia `.agents/`). — Restricciones: no tocar `quality`/`derived`/consumidores (nucleo productivo); English-only.
8. Limpieza F — Accion: `edit` (pasada final, tras D/E/B2/C/G) — Detalle tecnico: en cada archivo del alcance F, eliminar todo comentario salvo la lista vital confirmada por el usuario (credito Apache siempre se conserva); los comentarios en espanol caen sin excepcion (ya violan English-only). Verificar con `rg` conteo cero en el alcance (salvo vitales). — Restricciones: no tocar ficheros del juego, harness, `.agents/`; no reescribir logica, solo borrar comentarios.
9. Self-review — Accion: `read`/`grep` — Detalle tecnico: diff limitado a renombres + `VCExperience.vue` (cache) + `vite.config.ts` + `.env.example` + borrados listados + G + limpieza F; `vue-tsc` limpio de nuevos errores; `C:/Users` en cero; `caches` con guard; `prefix`/`attribution` no tocados (pata de otro plan). — Restricciones: sin scripts; verificacion con comandos queda pendiente de autorizacion.

### Verificacion

- Estatica (sin autorizacion, hecha en enrichment via lectura): importadores cerrados, destinos en `Nueva carpeta` verificados (`web/lib/`, `web/public/`, `.gitignore` upstream compatible), `VERSION` base `2026-09-19-orig1`, i18n sin `vicecity` en claves.
- En ejecucion (con autorizacion RULES 0.4): `bun run lint:check` + `bun run format:check` exit 0; `bun run build` (`vue-tsc -b` + `vite build`); `bun run dev`: truco `vicecity` + `Enter` abre shell sin 404, primera apertura llena `vc-build-*`, segunda apertura sin `GET reVC.data/reVC.wasm` en red (solo HEADs del `exists()` del motor, bytes).
- Criterios: imports resuelven tras renombre; `C:/Users` en cero en el repo; borrados = lista autorizada; copias en `Nueva carpeta` con destinos confirmados; build cacheado versionado con purga; `rg` de comentarios en cero en el alcance F salvo vitales confirmados; `rg` de `diag/?perf/vc-quality/?q=` en cero fuera de `.agents/`.

## Compuerta

- Plan en estado **`ENRICHED`**. Enrichment invocado por frase explicita del usuario. Sin implementacion.
- Siguiente: revision critica del orquestador + visto bueno del usuario antes de `READY`; luego frase **"ejecuta el plan"** para `READY -> EXECUTED` via Executor.

## Cierre (memoria persistente)

> Completar al cerrar. Sin esto no hay `CLOSED` (DoD).

- Que cambio: [pendiente]
- Verificacion: [pendiente — comando ejecutado y resultado, o pendiente con motivo]
- Resultado: [pendiente]
- Pendientes: [pendiente]
