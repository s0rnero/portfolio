---
name: 016-cursor-propio-solo-con-raton
status: accepted
date: 2026-09-22
domain: portfolio
---

# ADR-016: El cursor propio solo se activa con ratón (puntero fino)

## Contexto

`GlitchCursor.vue` sustituye el cursor del sistema por un SVG propio y añade al `<html>` la clase `glitch-cursor-active`, que aplica `cursor: none !important` a todo el documento. La decisión se tomaba con una sola condición: `prefers-reduced-motion`.

En un dispositivo táctil eso es incorrecto: **no hay ratón**, pero los navegadores **sí sintetizan eventos de puntero** al tocar (`pointermove`/`pointerover` con `pointerType: 'touch'`), así que el cursor falso aparecía y se colocaba en el punto tocado, siguiendo el dedo. Además, la clase global `cursor: none` quedaba puesta sin ningún ratón que ocultar.

## Decisión

- La capacidad del puntero manda: el cursor propio se activa solo si `matchMedia('(hover: hover) and (pointer: fine)')` coincide (ratón o trackpad).
- La consulta se resuelve en `script setup` y se **escucha su `change`** (el patrón ya usado en `FaultyTerminalBackground.vue`), de modo que un dispositivo híbrido (tablet con teclado, portátil táctil) activa o desactiva el cursor al conectar o desconectar el ratón sin recargar.
- Todo el alta/baja vive en dos funciones simétricas, `attachCursor()` / `detachCursor()`: listeners, clase global, ciclos de glitch y el `v-if` del propio elemento (`supportsCursor`). Sin ratón **no se registra ningún listener, no se añade la clase y no se renderiza el SVG**.
- El estado inicial del render es `false`: nunca aparece un cursor falso antes de saber si hay ratón.
- `@media (prefers-reduced-motion: reduce), (hover: none), (pointer: coarse)` deja el bloque `display: none` como red de seguridad en CSS.

## Consecuencias

- Positivas: en móvil **no hay cursor falso ni `cursor: none`**, y se ahorra el trabajo de los listeners de `pointermove`/`pointerover`/`pointerout` y el rAF por movimiento; los híbridos siguen teniendo el cursor con ratón y lo pierden al usarlos como tablet; el dispositivo con reduced-motion ya no depende de un guard en el montaje (no se llama a `attachCursor`).
- Negativas / trade-offs: la condición real de "hay ratón" es heurística — un dispositivo que reporte `pointer: fine` pero se use con el dedo mostrará el cursor propio (caso raro); la detección duplica la idea en CSS y en JS, pero por caminos distintos (render vs. pintura).
- Verificado: `lint:check`, `format:check` y `build` en verde, y el bundle desplegado contiene la consulta; la comprobación visual en móvil queda del lado del usuario.

## Alternativas Consideradas

- **Detectar por el tipo del primer evento** (`event.pointerType === 'touch'`): descartada: obliga a reaccionar *después* del primer toque (el cursor ya habría aparecido) y a limpiar el estado ya montado.
- **Ocultarlo solo con CSS en pantallas pequeñas**: descartada: confunde tamaño con capacidad (un portátil táctil grande tiene ratón y un móvil grande no).
- **Dejarlo como estaba**: descartado: es el fallo reportado por el usuario.

## Estado

`proposed` -> `accepted` (cuando se confirme) / `superseded` (solo mediante un ADR nuevo que lo reemplace)
