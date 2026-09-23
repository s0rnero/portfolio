---
name: portfolio-glitch-text
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-07 12:40
enriched: 2026-09-07 12:55
---

# Plan Técnico: GlitchText.vue — texto glitch para el nombre del hero

## Analisis

- **Objetivo:** efecto glitch CSS puro (sin dependencias) sobre el nombre del `<h1>` del hero; fidelidad visual al `GlitchText.vue` de vue-bits, adaptado a nuestros standards.
- **Scope:** crear `src/components/GlitchText.vue` (único archivo nuevo) + editar `src/components/HeroSection.vue` (uso dentro del h1). `portfolio.ts` no cambia: la fuente de verdad sigue siendo `profile.name` (cero duplicación).
- **Riesgos / decisiones ya tomadas:**
  1. **El nombre (3 palabras, `text-6xl`) puede saltar de línea** en pantallas medianas. Las capas `::before`/`::after` deben envolver EXACTAMENTE igual que el texto base: se posicionan con `position: absolute; inset: 0;` (ancho idéntico al texto) y se desplazan con `transform: translateX(±10px)` — NO con `left`, que altera el ancho y puede re-envolver distinto.
  2. **Fondo transparente (decisión del usuario, 2026-09-07):** las capas NO llevan el fondo opaco `#0b0b0b` del original (asume fondo negro plano); el texto base se verá bajo las bandas recortadas (ghosting intencional). Validar contraste sobre `k-mesh-gradient`.
  3. **La intro GSAP del hero anima los elementos `[data-hero]`** (el `<h1>` completo, no sus hijos): como el span del glitch vive DENTRO del h1, la intro queda intacta (el h1 sigue siendo el target).
  4. `prefers-reduced-motion`: texto estático (sin pseudo-elementos animados).
  5. Colores de sombra como props con defaults rojo/cian (fiel a la referencia), configurables.

## Cambios

- **`src/components/GlitchText.vue` (create):**
  - Props (interfaz inmutable): `text: string` (requerido), `speed?: number = 0.5`, `enableOnHover?: boolean = false`, `shadowA?: string = '#ff2d2d'` (rojo), `shadowB?: string = '#00e5ff'` (cian).
  - Plantilla: `<span>` con `data-text` y custom properties computadas:
    - `--glitch-after-duration: speed × 3s`, `--glitch-before-duration: speed × 2s`
    - `--glitch-after-shadow: -10px 0 shadowA`, `--glitch-before-shadow: 10px 0 shadowB` (aberración cromática clásica, dirección opuesta al offset de la capa).
  - `<style scoped>` (todo lo que el original hacía con valores arbitrarios `[...]` va aquí — cumple CODING_STANDARDS §7):
    - `.glitch-text`: `position: relative; display: inline-block;` **sin tipografía propia** (hereda tamaño/peso/tracking/color del h1; no copiar `text-white`/`font-black`/`mx-auto`/`whitespace-nowrap` del original).
    - `::before`/`::after`: `content: attr(data-text); position: absolute; inset: 0; background: transparent; overflow: hidden; pointer-events: none; user-select: none; clip-path: inset(0 0 0 0);`
    - `::before`: `transform: translateX(-10px); text-shadow: var(--glitch-before-shadow); animation: glitch-clip var(--glitch-before-duration) infinite linear alternate-reverse;`
    - `::after`: `transform: translateX(10px); text-shadow: var(--glitch-after-shadow); animation: glitch-clip var(--glitch-after-duration) infinite linear alternate-reverse;`
    - `@keyframes glitch-clip`: los 21 pasos de `inset(...)` de la referencia (0% inset(20% 0 50% 0) … 100% inset(30% 0 40% 0), saltos cada 5%).
    - Variante `.glitch-text--hover` (si `enableOnHover`): capas ocultas (`opacity: 0; animation: none;`) y activadas en `:hover` con sus animaciones.
    - `@media (prefers-reduced-motion: reduce)`: `::before, ::after { animation: none; content: none; }` → texto estático limpio.
- **`src/components/HeroSection.vue` (edit):** importar `GlitchText` y usarlo en el h1:
  ```html
  <h1 class="text-6xl font-black tracking-tight text-white" data-hero>
    <GlitchText :text="profile.name" />
  </h1>
  ```
  Sin ningún otro cambio: las clases del h1, `data-hero` y el resto de la sección quedan intactos (no se altera tipografía, §7).

## Restricciones

- `.agents/CODING_STANDARDS.md` §7: cero márgenes, cero valores arbitrarios `[...]`, no alterar `leading-*`/`tracking-*`/tamaños heredados.
- Un componente principal por requerimiento (regla 0.3); cero duplicación (efecto autocontenido en el SFC).
- No ejecutar dev/build sin autorización (regla 0.4). Gestor bun (no hay dependencias nuevas).

## Steps

1. **create** `src/components/GlitchText.vue`: plantilla span + props + CSS scoped (keyframes `glitch-clip`, capas transparentes con `inset: 0` + `translateX`, variante hover, reduced-motion).
2. **edit** `src/components/HeroSection.vue`: importar `GlitchText` y envolver `profile.name` dentro del `<h1>`.
3. Verificación (siguiente sección).

## Cierre (memoria persistente)

- Que cambio: Creado `src/components/GlitchText.vue` (span con `data-text`, capas `::before`/`::after` con **fondo transparente** según decisión del usuario, `inset: 0` + `translateX(±10px)` para que el wrap del nombre coincida, keyframes `glitch-clip` de 21 pasos, sombras roja `#ff2d2d` / cian `#00e5ff` como props `shadowA`/`shadowB`, duraciones `speed×2s`/`×3s`, variante `enableOnHover` y `prefers-reduced-motion` con texto estático; tipografía heredada del h1, cero valores arbitrarios `[...]`). Editado `src/components/HeroSection.vue`: import de `GlitchText` y `<GlitchText :text="profile.name" />` dentro del `<h1>` (clases, `data-hero` e intro GSAP intactos).
- Verificacion: `bun run lint` (--fix) OK; `bun run lint:check` exit 0; `bun run format:check` exit 0 sobre los archivos nuevos. **Pendiente por regla 0.4**: `bun run build` (requiere autorización del usuario) y la prueba visual en dev con autorización.
- Resultado: pendiente — no pasa a CLOSED hasta validar build + prueba visual (o aceptación explícita del pendiente) según DoD.
- Ajuste post-ejecución (solicitud simple directa del usuario, 2026-09-07): `shadowA`/`shadowB` sin valores por defecto (sin sombras salvo que se pasen como props) y `speed` default 0.3 (antes 0.5). Verificación: lint:check + format:check OK.
- Reajuste post-ejecución #2 (solicitud simple directa del usuario, 2026-09-07): el efecto vue-bits no convenció → reescrito con la mecánica de la referencia pug+sass aportada por el usuario: dos animaciones independientes `glitch-animation-1/2` de 21 pasos (uno cada 5%, timing linear, 2s), capas `::before`/`::after` con `left: ±3px` + `width/height: 100%` + `padding: inherit` (el wrap del nombre coincide con el texto base), `clip-path: inset(t% 0 b% 0)` en porcentajes como equivalente determinista y escalable del `clip: rect(random(150)px, 350px, random(150)px, 30px)` de Sass (bandas pre-generadas al escribir el archivo, con pasos vacíos cuando t+b ≥ 100, igual que rect(top > bottom) en la referencia; sin `animation-direction` porque `reverse-alternate` de la referencia es CSS inválido y los navegadores lo ignoran → dirección normal efectiva). SIN sombras de color: el glitch usa el mismo color del texto (decisión del usuario). Fondo transparente mantenido (decisión previa). `speed` redefinida como multiplicador de los 2s de la referencia (default 1 = resultado idéntico a la referencia); props `shadowA`/`shadowB` eliminadas. `enableOnHover` y `prefers-reduced-motion` se mantienen. Verificación: lint + lint:check + format:check en verde.
- Pendientes: autorizar `bun run build` y/o `bun run dev` para ver el glitch del nombre en vivo y validar contraste sobre el fondo del hero.

## Verificacion

- `bun run build` (requiere autorización, regla 0.4).
- `bun run dev` autorizado: el nombre del hero muestra el glitch en loop (bandas `clip-path` + aberración roja/cian), el salto de línea del nombre envuelve igual en el texto base y en las capas, la intro GSAP sigue funcionando, con reduced-motion el texto queda estático, sin errores de consola.
- Manual: contraste/legibilidad del nombre sobre el fondo del hero; probar `enable-on-hover` si el usuario lo desea.

## Cierre (memoria persistente)

> Completar al cerrar (DoD de `.agents/WORKFLOW.md`). Estados: PENDING -> ENRICHED -> READY -> EXECUTED -> CLOSED.
