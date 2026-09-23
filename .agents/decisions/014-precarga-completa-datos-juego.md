---
name: 014-precarga-completa-datos-juego
status: proposed
date: 2026-09-22
domain: portfolio
supersedes: []
---

# ADR-014: Precarga completa de los datos del juego a la caché del motor

## Contexto

El motor pide los ficheros de `streamed/` **on-demand**: los `txd/dff` de una zona llegan cuando el juego los necesita, asi que en partida el juego avanza al ritmo que le responda el host y aparecen tirones (freezes) al entrar en zonas nuevas. Tres agravantes medidos en el artefacto:

- La cache de datos (`vcod2`, IndexedDB) traia techo de **900 MB** frente a los ~1.045 MB del manifiesto: con desalojo LRU, lo mismo se re-descargaba.
- El "arranque en caliente" (`warmMB`) solo adelantaba **64 MB** por sesion.
- El paquete inicial (`reVC.data`, 132 MB) lleva solo **1.932 de los 17.399 ficheros**.

## Decision

- La precarga vive en **nuestro loader vendido** (`src/vendor/gtavc-web/index.js`), no en la libreria compilada: recorre el manifiesto y trae cada fichero con **`OD.ensure()`**, la misma ruta que el motor usa internamente desde C. Asi los datos acaban en la cache del propio motor (MEMFS + IndexedDB) **sin tocar su esquema ni recompilar el wasm**.
- Se precarga el **manifiesto completo: 17.399 ficheros / 1.045,5 MB**, sin exclusiones. Lo hace posible el camino real del motor: su **worker** de carga consulta IndexedDB **antes** de la red y guarda **cualquier tamano** (el limite de 8 MB solo existia en el camino antiguo del hilo principal), y su cache de RAM (`CAP` 360 MB) desaloja por LRU **sin tocar** esa copia. Con `idbCapMB: 0` no hay recorte, asi que en partida todo sale de local.
- Prioridad: la **lista aprendida** del motor (`OD.warmLoad()`) primero, despues el resto del manifiesto. 6 peticiones en paralelo.
- **El juego no arranca hasta que esta todo en local**: con `prefetch: true` el runtime se monta con `noInitialRun` (OD y FS listos, sin `main()`), se descarga el manifiesto completo y **solo entonces** se llama a `main()` (`callMain`).
- Una **unica barra** para toda la preparacion (la rosa del sitio): el host la mantiene desde la descarga del motor hasta el final de la descarga de datos, y la barra del propio motor se apaga durante la fase de datos para no superponerse. Fase `prefetch` por `onProgress`; si el motor no expone su API, se arranca igual (degradacion silenciosa).
- La cache se deja **sin techo** (`idbCapMB: 0`) para que lo precargado no se desaloje, y `warmMB: 256`.

## Consecuencias

- Positivas: en partida **nada depende del host** (ni texturas, ni modelos, ni audio, ni emisoras ni cinematica); los datos viajan **una sola vez por visitante** y quedan en IndexedDB.
- Negativas / trade-offs: la primera visita **espera** a los ~1.045 MB antes de que el juego arranque (la espera es visible en la barra; es lo pedido). Ocupa ~1 GB de IndexedDB, con riesgo de cuota en navegadores estrechos (Safari ~1 GB por origen, y borra tras 7 dias sin uso); si falla, los fallos se cuentan y el juego sigue on-demand. Depende de API interna del motor (`OD.ensure`, `OD.manifest`, `OD.warmLoad`) — si cambia, la precarga **se degrada en silencio y nunca rompe el juego** (todo va en `try/catch`). Sin `Cache-Control` en R2, las peticiones de la precarga cuentan como operaciones clase B (17.399 por visita completa: holgado frente a las 10M/mes del plan gratis).

## Alternativas Consideradas

- **Precarga dentro del motor** (`web/ondemand.js` + rebuild de `reVC.js`): descartada por coste (rebuild emscripten) y porque `OD.ensure` ya es la ruta oficial.
- **Precargar solo lo "persistible" (<= 8 MB, sin `.adf`)**: descartada: se midio que el worker del motor si guarda cualquier tamano, asi que excluir 463 MB era infundado y dejaba 274 MB de emisoras y la cinematica fuera de local.
- **Ampliar `bootseed` en `reVC.data`**: descartada, agrandaria la descarga obligatoria para todo el mundo.
- **Escribir en IndexedDB desde el host**: descartada, acopla al esquema privado del motor (`files` + `__datatag__`) y su purga por `dataTag` invalidaria lo escrito.

## Estado

`proposed` -> `accepted` (cuando se confirme) / `superseded` (solo mediante un ADR nuevo que lo reemplace)
