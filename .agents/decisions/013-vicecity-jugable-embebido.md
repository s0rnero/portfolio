---
name: 013-vicecity-jugable-embebido
status: proposed
date: 2026-09-21
domain: portfolio
supersedes: []
---

# ADR-013: ViceCity jugable embebido tras el video

## Contexto

El truco `vicecity` + `Enter` montaba la ruta `/vicecity` con `vc.mp4` a pantalla completa. El pedido nuevo: el port `reVC + Emscripten` (`web/lib`, `startGame({ el })`) debe arrancar cuando cae el ruido (con el video), correr debajo del video y revelarse con fade negro al pulsar `Enter` con el juego listo. La URL no debe cambiar nunca y `/vicecity` deja de existir como vista. Los datos pesan ~1,6 GB (`streamed/` 1,37 GB + `build/` ~150 MB) y Pages limita a 25 MiB por fichero.

## Decision

- El juego es un overlay por estado (`useViceCityGame` + `ViceCityExperience.vue`), sin ruta: `useViceCityCode.activate()` abre el shell en vez de `router.push`; `/vicecity` queda como redirect a `/`.
- La libreria se copia a `src/vendor/gtavc-web/` (4 ficheros + `vite.d.ts` local); `build/streamed/manifest` nunca entran a Git: dev los sirve desde el checkout del port via `vcWeb`, despliegue desde R2/host propio con URLs por entorno.
- Arranque diferido y conjunto: el shell monta video + hueco del juego al disparar el truco; `startGame(fill: parent)` y `video.play()` se disparan juntos al caer `isTrickActive`. Listo = primer frame (`__vcFrame`); solo entonces `Enter` hace fade (`opacity` 700 ms sobre fondo negro) y desmonta la capa del video.
- Una sola instancia por carga de pagina (`destroy()` no libera wasm): sin remontajes en bucle.

## Consecuencias

- Positivas: sin cambio de URL ni recargas de ruta; bundle inicial intacto (shell en async chunk); primera carga del juego gratis despues via IDB (`vcod2`); despliegue gratis viable (Pages + R2).
- Negativas / trade-offs: COOP/COEP globales en dev (los exige pthreads); doble WebGL + video 250 MB en arranque del shell; `guardUnload` pregunta al recargar en partida; `vc.mp4` debe externalizarse para Pages (hoy sigue bundelado).

## Alternativas Consideradas

- `file:` a `web/lib` en vez de copiar: descartado, ata el repo a una ruta absoluta del Desktop que no existe en servidor/CI.
- `fill: viewport` del lib: descartado, su `z-index 2147482000` taparia video y fade; `parent` mantiene el apilado del sitio.
- Segundo listener en la vista para el `Enter` de revelado: descartado, duplicaba el keydown global; se centralizo en `useViceCityCode`.
- Copiar `streamed/build` al repo: descartado, 1,6 GB en Git rompen clone, Pages y `dist`.

## Estado

`proposed`
