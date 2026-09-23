---
name: portfolio-top-gradual-blur-navbar
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-10
enriched: 2026-09-10
ready: 2026-09-10 (orden "ejecuta el plan" tomada como visto bueno del ENRICHED)
executed: 2026-09-10
---

## Plan Tecnico: Gradual blur superior estilo vue-bits (top, fade hacia bottom) para el navbar

> Solicitud del usuario (2026-09-10): replicar el efecto GradualBlur de vue-bits pero invertido — anclado arriba (`top`) con el degradado hacia abajo — para acompañar al navbar. El `ScrollBlur` de khatarsis se descarta por distinto (decision del usuario).

### Analisis

- Objetivo:
  - New fixed top overlay with progressive blur: maximum blur at the top edge, fading to transparent at the bottom of its height, so scrolled content blurs gradually as it approaches the navbar.
  - Navbar stays crisp and clickable above the overlay; overlay never captures pointer events and is hidden from assistive technology.
  - Faithful technique port from vue-bits `GradualBlur` (stacked `backdrop-filter` + `mask-image` layers), reduced to top-only static variant, no JS listeners.
- Scope:
  - In: create `src/components/layout/TopGradualBlur.vue` (top-only, props `strength` / `height` / `divCount` / `curve` / `opacity`); edit `src/App.vue` (mount fixed top with z below navbar).
  - Out: `Navbar.vue` (untouched, `header.fixed.top-0.z-40` + `backdrop-blur-md`), WebGL backgrounds, router, sections, i18n, full 4-position port, no new deps, no `responsive` / `animated` / `scroll` / `hoverIntensity` / `presets` / `slot`.
- Archivos:
  - `src/components/layout/TopGradualBlur.vue` (create) — decorative overlay, Vue 3 Composition API `<script setup>` + TS.
  - `src/App.vue` (edit) — add import + mount line adjacent to `<navbar />`; nothing else changes.
  - Read-only reference: `src/components/layout/Navbar.vue` (~60px tall inner nav), `src/components/background/FaultyTerminalBackground.vue` (credit-header style precedent), vue-bits source `GradualBlur.vue` + `LICENSE.md` (MIT + Commons Clause v1.0, Copyright (c) 2025 David Haz — verified 2026-09-10, use-as-part-of-website allowed with credit notice).
- Riesgos:
  - Perf: multilayer `backdrop-filter` over animating WebGL canvas recomputes per frame. Precedent exists (`Navbar.vue` `backdrop-blur-md` over same background). Mitigation: keep `divCount` low (default 5), static overlay with zero listeners/animations, verify framerate in `dev` with authorization.
  - Z-order regression: overlay above `z-40` would blur the navbar itself; below backgrounds would be invisible. Fixed decision `z-30` prevents both.
  - Scope creep: full vue-bits port (positions, animated, scroll, responsive) is explicitly excluded.

### Cambios

- `src/components/layout/TopGradualBlur.vue` (create): static top-only gradual-blur overlay. Root `fixed top-0 left-0 right-0 pointer-events-none` with `height`/`opacity` via inline `:style` from props; `aria-hidden="true"`; N child layers `absolute inset-0` each with computed `backdrop-filter: blur(Xrem)` + `mask-image: linear-gradient(to top, ...)` slice. Pure computed, no lifecycle, no event listeners, no slot. Defaults = vue-bits `page-header` preset for top: `height '10rem'`, `strength 3`, `divCount 5`, `curve 'bezier'`, `opacity 1`.
- `src/App.vue` (edit): import `TopGradualBlur` and mount `<top-gradual-blur class="z-30" />` immediately after `<navbar />`, before `<glitch-cursor />`. No other template/script change.

### Restricciones

- RULES 0.2 / 0.3: 1 create + 1 mount edit only; no file deletions, no extra subcomponents, helpers, or composables; no changes outside the two files above.
- RULES 0.4: no `dev` / `build` / `preview` / `lint` / `format` sin autorizacion explicita; gestor bun; scripts reales verificados en `package.json`: `dev`, `build` (`vue-tsc -b && vite build`), `preview`, `lint` (`eslint . --fix`), `lint:check` (`eslint .`), `format` (`prettier --write .`), `format:check` (`prettier --check .`).
- CORRECCION 2026-09-10 (orquestador): el plan ENRICHED afirmaba que `lint:check`/`format:check` no existen — FALSO. Si existen en `package.json` (lectura propia del orquestador). Quedan pendientes por falta de autorizacion, no por inexistencia.
- RULES 0.13 + CODING_STANDARDS §2.1 English-only: component name, props, identifiers, and all code comments in English. No text content (decorative component).
- CODING_STANDARDS §7 decorative: zero margins; `height` only via string prop bound to inline style (never Tailwind arbitrary values `h-[...]` / `top-[...]` / `z-[...]`); no flex sizing conflicts; no `min-w-0`; no typography utilities.
- License: English credit header mirroring `FaultyTerminalBackground.vue` required (MIT + Commons Clause v1.0, Copyright (c) 2025 David Haz; use-as-part-of-website allowed, sale/redistribution of the component as such prohibited).
- Scope lock: top-only fixed overlay; no `position` prop, no responsive/animated/scroll/hoverIntensity/presets/slot; no JS listeners; no new dependencies; no `Navbar.vue` edit; no i18n keys.
- Reduced motion: intentional no-gate — static decoration with zero animation/transition/listeners, nothing to gate (documented in a code comment).
- DESIGN.md: no conflicting layer rule; component lives in existing `src/components/layout/` alongside `Navbar.vue`.

### Steps

1. Archivo exacto: `src/App.vue`, `src/components/layout/Navbar.vue`, `src/components/background/FaultyTerminalBackground.vue` (+ vue-bits `GradualBlur.vue` + `LICENSE.md` como referencia externa ya verificada).
   Accion: `read`.
   Detalle tecnico: re-confirmar antes de editar — orden en `App.vue` (`<navbar />` z-40, fondos, `<router-view />`); `Navbar.vue:34` `header.fixed.top-0.z-40` + nav `max-w-5xl px-6 py-3` (~60px); estilo de cabecera de credito en `FaultyTerminalBackground.vue:1-7`; tecnica vue-bits (contenedor al borde, N capas `absolute inset-0`, direccion `top -> 'to top'`, formula `0.0625 * (progress * divCount + 1) * strength` rem). Si hay delta, detenerse y reportar.
   Restricciones: solo lectura; sin scripts; sin edits en este paso.
2. Archivo exacto: `src/components/layout/TopGradualBlur.vue`.
   Accion: `create`.
   Detalle tecnico: cabecera de credito EN (estilo `FaultyTerminalBackground.vue`); contrato `interface TopGradualBlurProps { strength?: number; height?: string; divCount?: number; curve?: 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out'; opacity?: number }` con defaults `strength 3, height '10rem', divCount 5, curve 'bezier', opacity 1`; capas/mascaras top-only via `computed` (mapa de curvas + formula vue-bits + slices `linear-gradient(to top, ...)` con `maskImage`/`WebkitMaskImage` y `backdropFilter`/`WebkitBackdropFilter`); template raiz `fixed top-0 right-0 left-0 pointer-events-none` con `:style { height, opacity }` + `aria-hidden`, hijos `absolute inset-0` por capa; comentario EN explicando que la omision de reduced-motion gating es intencional (decoracion estatica, cero animacion/listeners).
   Restricciones: un componente, English-only, §7 (sin margenes, sin `[...]`, sin tipografia, height solo por prop), sin responsive/animated/scroll/hoverIntensity/presets/slot, sin listeners, sin deps nuevas, sin i18n.
3. Archivo exacto: `src/App.vue`.
   Accion: `edit`.
   Detalle tecnico: import `TopGradualBlur` (PascalCase, alias `@/`); insertar `<top-gradual-blur class="z-30" />` inmediatamente despues de `<navbar />` y antes de `<glitch-cursor />` (orden resultante: navbar z-40 → blur z-30 → cursor → fondos → router-view). Resto de `App.vue` (smooth-scroll, `afterEach`, CRT) intacto. Alternativa rechazada (overlay desde el bottom del navbar): deja el borde del navbar sin transicion y acopla al alto del navbar — solo en plan, no en codigo.
   Restricciones: solo montaje; no tocar `Navbar.vue`, fondos, router ni secciones; English-only.
4. Archivos exactos: `src/components/layout/TopGradualBlur.vue` + `src/App.vue`.
   Accion: `read` (verificacion estatica).
   Detalle tecnico: diff exactamente 1 create + 1 edit (import + montaje); raiz con `pointer-events-none` + `aria-hidden`; `z-30` estandar bajo `z-40`; cabecera de credito presente; English-only; §7 limpio; sin listeners/deps/slot.
   Restricciones: sin scripts; verificacion con comandos solo con autorizacion.

### Verificacion

- Estatica (sin autorizacion): diff acotado; `pointer-events-none` + `aria-hidden`; `z-30` bajo `z-40`; credito MIT + Commons Clause (c) 2025 David Haz; English-only; §7 limpio; sin listeners ni deps.
- Con autorizacion (bun, scripts reales de `package.json`): `bun run lint:check` + `bun run format:check` exit 0; `bun run build` (`vue-tsc -b && vite build`) exit 0; `bun run dev` manual — el contenido se difumina gradualmente al acercarse al navbar (fuerte arriba → transparente ~10rem), navbar nitido y clicable, sin banda visible en reposo sobre el hero, consola limpia, sin caida de framerate vs baseline con los fondos WebGL animando.
- Aceptacion: blur fuerte arriba → transparente abajo; navbar nitido/clicable; overlay click-through y AT-hidden; sin banda en reposo; paridad de perf; cabecera de licencia presente.

## Compuerta

- Plan en estado **`EXECUTED`**. Ejecutado via Executor tras `READY` + frase "ejecuta el plan". Verificado por orquestador contra diff real (componente 74 lineas + montaje `z-30`).
- Fe de erratas: el plan ENRICHED afirmaba que `lint:check`/`format:check` no existen — falso, si existen en `package.json`. Corregido arriba; quedan pendientes por falta de autorizacion.
- `CLOSED` solo con DoD + reviewer.md + entrada de memoria completa (verificacion con scripts bloqueados pendiente).

## Cierre (memoria persistente)

- Que cambio (verificado 2026-09-10): creado `src/components/layout/TopGradualBlur.vue` (74 lineas: cabecera MIT + Commons Clause (c) 2025 David Haz, props strength 3 / height 10rem / divCount 5 / curve bezier / opacity 1, capas `backdrop-filter` + `mask-image to top` via computed, raiz `fixed top-0 pointer-events-none aria-hidden`, comentario reduced-motion intencional); `src/App.vue`: import + `<top-gradual-blur class="z-30" />` tras `<navbar />` (z-40). `Navbar.vue` y resto intactos.
- Verificacion: estatica por lectura/grep OK (diff acotado, z-order, credito, English-only, §7 limpio, sin listeners/deps). Pendiente por regla 0.4 (sin autorizacion): `bun run lint:check`, `bun run format:check`, `bun run build`, `bun run dev` (blur gradual al navbar, navbar nitido, sin banda en reposo, paridad de perf).
- Resultado: pendiente — permanece `EXECUTED` hasta validacion o aceptacion explicita del pendiente.
- Pendientes: autorizar verificaciones; luego reviewer + DoD para `CLOSED`.

## Ajuste altura 56px (2026-09-10, pedido directo)

- Pedido: el overlay de `10rem` (~160px) es demasiado alto; debe medir 56px.
- Fix: default `height: '10rem'` -> `'56px'` en `TopGradualBlur.vue` (1 linea). Verificacion estatica OK; visual pendiente por regla 0.4.

## Fix feathering mascaras (2026-09-10, corte visible a 56px)

- Causa: mascaras simplificadas de 2 paradas (`transparent -> black` con corte duro en cada frontera de franja). A 160px las bandas anchas lo disimulaban; a 56px (~11px por franja con divCount 5) los bordes duros se ven como un corte en el bottom.
- Fix: formula verbatim de vue-bits de 4 paradas con solape (`transparent p1, black p2[, black p3][, transparent p4]`), cada capa entra/sale suave. Solo `TopGradualBlur.vue`. Verificacion estatica OK; visual pendiente por regla 0.4.

## Curva ease-in por defecto (2026-09-10, mas fuerza arriba)

- Pedido: suavizar mas, con el blur cargado arriba y gentil abajo.
- Fix: default `curve: 'bezier'` -> `'ease-in'` (`p^2`: las capas bajas crecen despacio y las altas rapido — top fuerte, bottom suave). 1 linea. Verificacion estatica OK; visual pendiente por regla 0.4.
