---
name: portfolio-vicecity-precarga-datos
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-22 18:10
enriched: 2026-09-22 19:10
updated: 2026-09-22 19:40
---

# Plan Tecnico: precarga completa de los datos del juego antes de arrancar

## Analisis

- **Objetivo (corregido por el usuario):** el juego **no debe arrancar** hasta tener **TODO** en local; al host (R2) se le pide **una sola vez** por visitante. Nada de precargar "la mitad" ni de barras nuevas: **una sola barra** (la rosa de siempre) que **no termina** hasta que este todo descargado.
- **Diagnostico medido:**
  - El motor trae los ficheros on-demand; el paquete inicial (`reVC.data`, 132 MB) solo lleva **1.932 de 17.399** ficheros. Manifiesto completo: **1.045,5 MB**.
  - Camino de carga real: `OD.ensure()` -> `OD._ensure()` -> **worker** (`WORKER_SRC`, Blob) -> `idbGet()` **antes** de la red -> si falta, `fetch` de `streamed/<p>` y **`idbPut` de CUALQUIER tamano** (el limite `<= 8 MB` solo estaba en el camino antiguo del hilo principal, `idbBuf`).
  - Cache de RAM del motor: `CAP` 360 MB con desalojo LRU (gracia 60 s, duro a partir de 720 MB) que **solo hace `FS.unlink` en MEMFS**: la copia de IndexedDB se conserva ("reabrir re-descarga: IDB lo sirve sin red").
  - La cache de datos es `vcod2` (v2) con stores `files` y `meta` (`{t,s}`); el techo (`idbCapMB`) y su recorte LRU se aplican en el hilo principal. **Con `idbCapMB: 0` no recorta nada.**
  - `ondemand.js` va compilado dentro de `reVC.js` (`--pre-js`): cambiarla exige rebuild de emscripten. No hace falta: su API (`OD.ensure`, `OD.manifest`, `OD.warmLoad`, `OD.idbPut`) es accesible desde JS.

## Cambios

### 1. `src/vendor/gtavc-web/index.js` (edit)
- Opciones nuevas: `prefetch` (false) y `prefetchConcurrency` (4).
- `prefetchPlan()`: plan ordenado con **todas** las entradas del manifiesto que tengan `p` (**17.399 / 1.045,5 MB**), suma de bytes para el progreso y **prioridad por la lista aprendida** del motor (`OD.warmLoad()`).
- `runPrefetch()`: espera al manifiesto (hasta 60 s, sin lanzar), apaga la barra del motor (`hideBar()`, para no superponer dos barras), lanza `prefetchConcurrency` bucles con `await OD.ensure('/' + key)`, cuenta ficheros/bytes/fallos y reporta por `progress('prefetch', ...)` con throttle de 250 ms.
- **Gate de arranque:** con `prefetch` el runtime se monta con `noInitialRun` (OD y FS listos, `main()` sin llamar) y `onRuntimeInitialized` encadena `runPrefetch()` -> `startEngine()`, que llama a `Module.callMain([])` (con `fail()` explicito si no se puede). Sin `prefetch`, el arranque es el de siempre. Nada de descargas durante la partida.
- Handle: `prefetchInfo()` para diagnostico.

### 2. `src/vendor/gtavc-web/index.d.ts` (edit)
- `Phase` gana `'prefetch'` (fase de datos, la barra la lleva el host); `StartGameOptions` gana `prefetch` y `prefetchConcurrency`; `GameHandle` gana `prefetchInfo()`.

### 3. `src/components/vicecity/ViceCityExperience.vue` (edit)
- `startGame({ ..., prefetch: true, prefetchConcurrency: 6, idbCapMB: 0, warmMB: 256, onProgress })`.
- **Una sola barra rosa**: `loadPct` es un `computed` que reparte la barra entre la descarga del motor (primer 20 %) y la de datos (el resto). `isPreloading` **no se apaga** al acabar la descarga del build: sigue encendido hasta que la fase `prefetch` termina (o llega el primer frame, `__vcFrame`).
- Eliminado lo que no se pidio: la barra cian, el porcentaje en texto y su clave i18n.

## Verificacion

- **Estatico:** `bun run lint:check` 0, `bun run format:check` 0, `bun run build` 0 (`vue-tsc` valida las nuevas opciones contra el `.d.ts`). Chunk `ViceCityExperience`: 25,1 kB (diferido).
- **API del motor (leida en el artefacto, sin rebuild):** `OD.ensure` / `_ensure` / `manifest` / `warmLoad` / `norm` / `idbPut` / `idbTouch`; worker con `indexedDB.open('vcod2', 2)`, `idbGet` antes de red e `idbPut` sin limite de tamano; `CAP: 360 * 1048576` con desalojo solo en MEMFS.
- **Datos:** 17.399 entradas / 1.045,5 MB (`public/game/manifest.json`).
- **Desplegado** en `https://carv-portfolio.netlify.app`.
- **Pendiente de revision visual del usuario:** que la barra rosa avance de forma continua y no desaparezca hasta el final, que el juego arranque solo despues, y que en partida no haya peticiones al host (consola: `[lib] precarga completa: 17399 ficheros, 0 fallos`).

## Cierre (memoria persistente)

- **Que cambio:** la precarga la hace el loader vendido (`src/vendor/gtavc-web/index.js`): recorre **todo** el manifiesto (17.399 ficheros / 1.045,5 MB) con `OD.ensure()`, priorizando la lista aprendida del motor, 6 peticiones en paralelo, y **bloquea el arranque** (`noInitialRun` -> `runPrefetch()` -> `callMain()`), asi que el juego solo empieza con todo en local. UI: **una sola barra rosa** que reparte motor (20 %) y datos (80 %) y no termina hasta el final; `idbCapMB: 0` para que la cache no recorte; `warmMB: 256`. Se elimino la barra cian, el texto de porcentaje y su clave i18n (no pedidos). ADR-014 actualizado con el diseno real.
- **Verificacion:** lint/format/build en verde, API del motor confirmada en el artefacto y despliegue hecho. Falta la comprobacion en navegador del usuario.
- **Resultado:** implementado y en produccion; pendiente de validacion visual.
- **Pendientes:** (1) `navigator.storage.persist()` para reducir el riesgo de que el navegador desaloje ~1 GB de IndexedDB (Safari borra a los 7 dias sin uso); (2) vigilar la cuota en Safari/Firefox, donde ~1 GB por origen puede no caber; (3) vendors con `codeSplitting`; (4) CSS scoped de khatarsis.

## Ampliacion 2026-09-22: transporte en un solo archivo + Worker (ADR-015)

- Motivo (pedido del usuario): la precarga pedia los 17.399 ficheros uno a uno (miles de peticiones por visita) y `r2.dev` es solo para pruebas (limite de tasa, sin cabeceras propias).
- Que cambio:
  - `public/game/vc-streamed.tar.gz` (854.866.751 B): los 17.399 ficheros del manifiesto en un `tar.gz` (1.056,6 MiB -> 815 MB; ustar, nombres cortos, sin longlink).
  - `src/vendor/gtavc-web/index.js`: opcion `archiveUrl`; `runPrefetch()` intenta primero el archivo (fetch -> `DecompressionStream('gzip')` -> parser tar por bloques de 512 -> `OD.idbPut` por entrada, tolerante a que falte `content-encoding`), y si falta o falla, cae al recorrido del manifiesto. Pasada de comprobacion final: pide sueltos los ficheros que el archivo no trajera.
  - `src/vendor/gtavc-web/index.d.ts`: `archiveUrl` en `StartGameOptions`.
  - `src/components/vicecity/ViceCityExperience.vue`: `archiveUrl: VITE_VC_ARCHIVE_URL`.
  - `.env.production`: las 5 URLs pasan de `pub-….r2.dev` al Worker.
  - `worker/vc-data.js` + `wrangler.toml`: Worker delante del bucket (`<worker>/<key>` -> objeto `<key>`), CORS `*`, `accept-ranges: bytes`, `cache-control: public, max-age=86400`, 200/206 segun la peticion, 404/416/405. Desplegado como `https://vicecity-data.carv-portfolio.workers.dev` (subdominio `carv-portfolio.workers.dev` registrado por API).
- Verificacion: `lint:check` 0, `format:check` 0, `build` 0; el `dist` (2,3 MB, sin `dist/game`) lleva las 5 URLs del Worker; el archivo se bajo entero a traves del Worker (854.866.751 B, MD5 igual al local, ~21 MB/s); `HEAD` 200 con `content-length` correcto, `Range` 206 con `content-range`, CORS `*`; enlace `200` y deploy de produccion hecho.
- Resultado: una visita al juego pasa de 17.399 peticiones a ~6 (los 3 ficheros del motor, el manifiesto, el archivo y el trailer).
- Pendientes: si cambian los datos, **regenerar y re-subir el archivo** (si no, la comprobacion final pide los que falten sueltos, no se rompe).

### Correccion 2026-09-22 (bug del archivo: el worker del motor no entregaba NADA)

- Sintoma medido por el usuario en consola: `OD.wkStats = {ask: 6981, err: 6981, take: 0, idb: 0, net: 0}`. En partida el motor no recibia **ningun** fichero: bucle de `[game] casepath couldn't find dir/file "CITY.MP3"`, tirones constantes y pantalla final `Error al leer el DVD de Grand Theft Auto: Vice City`. Los datos si estaban en disco (`navigator.storage.estimate().usage` = 1.081.794.775 B, todo en `indexedDB`).
- Causa raiz (verificada en laboratorio): el worker del motor entrega el fichero con `postMessage({op:'data', key, buf, ...}, [buf])`, es decir **transfiriendo** el buffer. Al desempaquetar el archivo se escribia la **vista `Uint8Array`** (`od.idbPut(key, data)`), y una vista **no es transferible**: `DOMException: Found invalid value in transferList` -> el `postMessage` del worker lanza `DataCloneError` en **cada** peticion -> `op:'err'` -> cero entregas (y por eso tambien `idb: 0` y `net: 0`, con el error en ms ~ 0). Comprobado: `structuredClone({buf:u8}, {transfer:[u8]})` falla y `{buf:u8.buffer}` funciona. El motor siempre guarda ArrayBuffers (`fromNet` -> `r.arrayBuffer()`; `dlNetwork` -> `flat.buffer`), asi que la cache quedo con un tipo que su propio worker no puede entregar.
- Arreglo en `src/vendor/gtavc-web/index.js`: se escribe `od.idbPut(key, data.buffer)` (ArrayBuffer del tamano exacto: `take()` siempre devuelve `new Uint8Array(n)`) + **comprobacion de ida y vuelta del primer fichero**, que avisa en consola si la cache no devolviera un ArrayBuffer (para que este fallo no vuelva en silencio). Los valores viejos se sobrescriben solos: el archivo reescribe las 17.399 entradas en cada carga.
- De paso: `warmMB` 256 -> 64 en `ViceCityExperience.vue`. El arranque en caliente solo paga cuando el host es lento; con todo en IndexedDB las lecturas son instantaneas, asi que el presupuesto grande era **RAM (256 MB) sin beneficio**.
- Verificacion: `lint:check` 0, `format:check` 0, `build` 0 y desplegado en `https://carv-portfolio.netlify.app`. Pendiente del usuario (aceptacion): `OD.wkStats` con `idb` creciendo y `err: 0`, sin el bucle de `CITY.MP3`, sin el error de DVD y con la RAM de la pestana medida.

### Correccion 2026-09-22 (segunda visita: el archivo se volvia a bajar entero)

- Sintoma (usuario): con el juego ya fluido y la RAM estable, **al recargar la pagina el `vc-streamed.tar.gz` se descargaba otra vez** (~815 MB) aunque los datos ya estuvieran en IndexedDB.
- Causa: `runPrefetch()` entraba siempre por `unpackArchive()`: no miraba si la cache del motor ya tenia los ficheros. Cada carga era: fetch del tgz -> descomprimir en streaming -> reescribir las 17.399 entradas (~1 GB) en `vcod2`.
- Comprobado antes de tocar nada: los nombres del tar coinciden **exactamente** con las rutas canonicas del motor (`'/' + p` del manifiesto: 17.399/17.399, 0 diferencias de caja), asi que la cache se escribia en las claves correctas y el fallo era solo el fetch repetido.
- Arreglo en `src/vendor/gtavc-web/index.js`:
  - `canReuse()`: antes de pedir nada se mira la cache. `cacheHoldsPlan()` lee **solo las claves** del store `files` (`getAllKeys`, unos cientos de KB, nunca los datos) y exige que esten las 17.399 rutas del plan; un fichero presente esta completo porque IndexedDB escribe cada registro de forma atomica.
  - Marca `vc_archive1` en `localStorage` con la identidad del archivo (URL + `OD.dataTag` del motor + nº de entradas + tamaño esperado del tar): si el archivo o la version de datos cambian, se vuelve a bajar.
  - Sin marca previa (primera vez que corre esta version) se adopta la cache existente solo si el `__datatag__` del motor coincide con `OD.dataTag` y los tamaños de una muestra de 12 ficheros pequenos cuadran con el manifiesto (`sampleMatches`). Asi la primera carga tras este cambio no vuelve a bajar los 815 MB.
  - La marca se escribe **solo** si tras el desempaquetado la cache queda completa (`cacheHoldsPlan()`), para no dejar una marca mentirosa si el motor purga en paralelo. Si el archivo falla, `markClear()`.
  - `askPersistence()`: pide `navigator.storage.persist()` una vez (la cache son ~1 GB y sin persistencia el navegador puede desalojarla) y deja el resultado en consola.
  - `prefetchInfo()` gana el campo `reused` para diagnostico.
- Efecto: la descarga del archivo pasa a ser **una sola vez**. Las cargas siguientes arrancan directas (el motor sirve todo desde IndexedDB) y en consola sale `[lib] datos ya en local: 17399 ficheros, sin descargar nada`. Si cambian los datos (nuevo `dataTag` o archivo distinto), se baja de nuevo y se reescribe.
- Verificacion: `lint:check` 0, `format:check` 0, `build` 0; el chunk desplegado contiene la logica (`vc_archive1`); desplegado en `https://carv-portfolio.netlify.app`. Pendiente del usuario: **recarga normal (F5)** y comprobar en la pestana Network que el tgz **no** vuelve a pedirse.
- Aclaracion: los ficheros del motor (`reVC.js/.wasm/.data`, 132 MB) van por la cache HTTP del navegador (`cache-control: public, max-age=86400` del Worker); una recarga forzada (`Ctrl+Shift+R`) los baja de nuevo y **no** es representativa de una visita normal.
