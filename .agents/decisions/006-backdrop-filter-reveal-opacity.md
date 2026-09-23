---
name: 006-backdrop-filter-reveal-opacity
status: proposed
date: 2026-09-13
domain: portfolio
supersedes: []
---

# ADR-006: Un elemento con `backdrop-filter` no vive dentro de un reveal animado por opacidad

## Contexto

Las cards de Proyectos y la card de stack de About usan `backdrop-blur-sm` sobre `variant="transparent"` (la librería fija `background-color: #0000`), o sea que toda su superficie visible es el `backdrop-filter`. Al entrar a esas secciones se veían **transparentes por un instante** y el blur aparecía recién después de seguir scrolleando.

Causa verificada en fuente: `useReveal.ts` revela con `gsap.set(items, { autoAlpha: 0, y: 40 })` + `gsap.to(items, { autoAlpha: 1, ... })`, es decir animando **opacidad**; y el atributo `data-reveal` estaba en el elemento que **envuelve** a esas cards (`ProjectsSection.vue`, `AboutSection.vue`). Por especificación (Filter Effects, *backdrop root*), un ancestro con `opacity < 1` forma un backdrop root, y un `backdrop-filter` solo puede muestrear el fondo dentro de su backdrop root más cercano. Durante los 0.9 s del tween (más 0.12 s de stagger) la card solo se veía a sí misma: sin blur y con fondo transparente, un hueco. Al cerrar el tween en opacidad exactamente 1 el backdrop root desaparece y el blur aparece.

Descartados como causa: el efecto `skew` (solo `transform` + `will-change: transform` en hover), el efecto `spotlight` (solo un `<span>` con `radial-gradient` en hover), `useStaticFlash` (solo hover del hero, navegación entre secciones y toggle de tema) y Lenis (scroll nativo, sin `transform` en el contenedor).

Nota: el `transform-gpu` aplicado antes a las cards de contact atiende otro disparador, porque esa sección no tiene `data-reveal` sobre las cards (solo sobre su header).

## Decision

- Ninguna pieza con `backdrop-filter` se revela por opacidad. Hoy eso significa: **quitar el atributo `data-reveal`** de las piezas que contienen blur (la `project-card` de Proyectos y la fila stack + mapa de About), manteniéndolo en los headers de esas secciones, que no tienen `backdrop-filter`.
- `useReveal` queda **sin cambios**: no se le añade ninguna opción, para no dejar API sin uso. Sigue siendo la vía del reveal para piezas sin blur.
- Regla para el futuro: si se quiere animar la entrada de una pieza con `backdrop-filter`, la animación no puede tocar `opacity` (ni `filter`, `mask`, `clip-path` o `isolation`, que también forman backdrop root). Se anima `transform` (por ejemplo escala o desplazamiento) o no se anima.

## Consecuencias

- Positivas: el blur está operativo desde el primer frame en Proyectos y About, sin ventana transparente; la corrección es de un atributo por archivo; la regla evita reintroducir el bug en futuras secciones.
- Negativas / trade-offs: esas piezas aparecen ya visibles al entrar a la sección (pierden fade y slide). En About, la fila completa pierde el reveal, incluido el mapa, porque la fila era la unidad de la animación. La animación queda disponible solo para piezas sin `backdrop-filter`, así que el reveal deja de ser uniforme en todo el sitio.

## Alternativas Consideradas

- **Opción `fade` en `useReveal` (revelar sin opacidad, solo `y`):** descartada por decisión del usuario (2026-09-13) a favor de quitar el reveal; además dejaba dos comportamientos distintos del mismo composable y un header que también debía decidir si conservaba el fade.
- **Tinte translúcido en la card (`bg-white/5 dark:bg-white/5`):** descartada porque enmascara el síntoma y cambia el look "cristal" de las cards; quedó como escalada no aprobada en el plan anterior.
- **`transform-gpu` en la card:** descartada porque no ataca la causa demostrada y convierte la card en *containing block* del overlay absoluto del `spotlight`.

## Estado

`proposed` -> `accepted` (cuando se confirme la verificación visual: blur estable desde el primer frame al entrar a Proyectos y a About, en recarga limpia y con scroll rápido y lento).
