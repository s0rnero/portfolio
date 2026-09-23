---
name: 001-smooth-scroll-gsap-lenis
status: accepted
date: 2026-08-28
domain: portfolio
supersedes: []
---

# ADR-001: Stack de animación y scroll suave del portafolio (GSAP + Lenis + prioridad khatarsis)

## Contexto

El usuario pidió construir la vista única de portafolio "de la mano con gsap" y preguntó si GSAP tiene scroll suave o si hacia falta añadir Lenis. La vista es una sola página con scroll por secciones (hero, perfil, experiencia, proyectos, intereses, contacto) con animaciones de entrada/reveal.

## Decision

- **GSAP core + ScrollTrigger** para animaciones de entrada (intro del hero) y reveals de secciones.
- **Lenis** para el scroll suave: GSAP no incluye smooth scroll en su núcleo; su plugin `ScrollSmoother` es de pago (Club GSAP), así que se usa Lenis (gratuito) integrado con ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker`). Se eliminó `scroll-behavior: smooth` de `src/style.css`.
- **Prioridad khatarsis (`k-*`)** para componentes (card, chip, button, icon, timeline) y efectos de fondo, y Tailwind solo para layout/custom. Los efectos de fondo no están registrados globalmente por la librería → se registran por nombre en `main.ts` (`k-mesh-gradient`, alias `k-icon`). Para el hero se eligió `k-mesh-gradient` (canvas 2D) sobre `k-aurora` (WebGL) por fiabilidad en el contexto GL del runtime.
- **khatarsis no distribuye tipos**: se creó `src/khatarsis.d.ts` con un shim ambient (`declare module 'khatarsis'`).

## Consecuencias

- Positivas: animaciones performantes y fluidas; componentes/reveals reutilizables (`useSmoothScroll.ts`, `useReveal.ts`); a11y vía `prefers-reduced-motion` y reveal que no oculta el contenido (tras `ScrollTrigger.refresh()` en `App.vue`).
- Negativas / trade-offs: Lenis añade una dependencia; los reveals dependen de que ScrollTrigger refresque posiciones (se fuerza con `refresh()` al montar); algunos efectos WebGL de khatarsis fallan según el contexto GL y hubo que sustituirlos por el efecto de canvas 2D.

## Alternativas Consideradas

- **GSAP ScrollSmoother (Club):** smooth scroll nativo de GSAP, potente, pero de pago → descartado.
- **k-aurora como fondo del hero:** WebGL vistoso, pero generó `GL_INVALID_OPERATION` y no pintaba → sustituido por `k-mesh-gradient`.
- **CSS `scroll-behavior: smooth` puro:** no es scroll suave inercial y entra en conflicto con Lenis → eliminado.

## Estado

`proposed` -> `accepted` (confirmada al cerrar los 4 planes del portafolio, 2026-08-28).