---
name: 003-crt-overlay-visual-sin-compuerta
status: proposed
date: 2026-09-09
domain: portfolio
supersedes: []
---

# ADR-003: El overlay CRT es una cubierta exclusivamente visual, sin compuerta de carga ni de contenido

## Contexto

La intro CRT (`CrtTurnOnIntro.vue`) acoplaba el contenido al overlay: emitía `reveal` durante el flash para liberar la entrada GSAP del hero, bloqueaba el scroll con `overflow: hidden` hasta el fin de la intro y su desmontaje coincidía con la primera pintura visible del fondo (`FaultyTerminalBackground` solo renderizaba en el primer RAF). El resultado, verificado en ejecución, fue un destello morado posterior al CRT y un periodo tras el flash sin scrollbar ni contenido visible. El usuario fijó el criterio (enmienda 2026-09-09 23:43 del plan `portfolio-crt-sin-destello-posterior`): el scroll debe existir siempre; el CRT solo condiciona la visibilidad del contenido animado por GSAP, que debe estar cargado en el DOM e invisible desde el inicio.

## Decision

- Montar e inicializar el contenido y el fondo de forma independiente del CRT: `router-view`, `FaultyTerminalBackground` y las secciones se montan siempre; el overlay no condiciona nada de eso.
- El CRT es solo una cubierta visual temporal: emite únicamente `done` al terminar su fundido, y `done` solo desmonta la cubierta.
- El hero ejecuta su intro GSAP en su propio `onMounted` (elementos en el DOM, invisibles vía `autoAlpha`), sin esperar señal alguna del CRT.
- El scroll nunca se bloquea: el overlay no toca `overflow`. Si la página ya está scrolleada al montar (recarga con scroll restaurado, aterrizaje en ancla), el overlay se desmonta de inmediato.
- El fondo pinta un primer frame explícito tras `resize()` y antes de iniciar el loop, para que el shader esté pintado antes de que la cubierta pueda desaparecer.

## Consecuencias

- Positivas: elimina el acoplamiento temporal (sin destello posterior, sin periodo sin scroll, contenido ya cargado e invisible bajo la cubierta); el CRT queda como superficie autónoma sin conocimiento del hero, el router ni el fondo; un solo contrato de salida (`done`).
- Negativas / trade-offs: exige que cada pieza gestione su propia inicialización temprana (el fondo necesita primer frame explícito; el hero necesita estado inicial invisible y cleanup de su timeline); si en el futuro se quiere una intro condicionada a carga real, se tendrá que diseñar como mecanismo distinto.

## Alternativas Consideradas

- **Esperar un evento `ready` del fondo para desmontar el CRT:** acopla de nuevo overlay y fondo; descartado.
- **Retrasar `router-view` hasta el fin del CRT:** rompe "contenido ya cargado en el DOM"; descartado.
- **Mantener `reveal` como compuerta del hero:** es la causa del destello posterior y del contenido tardío; descartado.
- **Cambiar la paleta para disimular el destello:** esconde el síntoma sin eliminar la causa; descartado.

## Estado

`proposed` (creado durante la ejecución del plan `portfolio-crt-sin-destello-posterior`). Pasará a `accepted` al cierre del plan si la verificación confirma el comportamiento.
