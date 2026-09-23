---
name: portfolio-tv-static-hover-hash-flash
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-10
enriched: 2026-09-10
ready: 2026-09-10 (aprobado por usuario con "ta ready ejecuta el plan")
executed: 2026-09-10
---

## Plan Tecnico: Flash de estatica por hover en GlitchText y por navegacion a seccion (5s) — sin trigger por click

> Solicitud del usuario (2026-09-10): el flash de `TvStaticBackground` ya no cambia su z-index con cada click. Solo se eleva (1) mientras se hace hover al `GlitchText` del hero y (2) durante 5 segundos al navegar a un hash/seccion dentro de la misma vista; despues vuelve a su capa inferior.

### Analisis

- Objetivo:
  - `TvStaticBackground` flash must NO longer trigger on click (`pointerdown` on `window` removed entirely, including debug `console.log('asd')` hygiene).
  - Flash raises only (1) while hovering the `GlitchText` in the hero, and (2) for 5 seconds when navigating between sections of the same view (`MainView`), then lowers to base layer.
  - Shared state via new composable `useStaticFlash`, mirroring `useCrtIntro` module-level refs pattern (no prop-drilling, no `window` CustomEvents).
- Scope:
  - In: create `src/composables/useStaticFlash.ts`; edit `src/components/background/TvStaticBackground.vue` (remove click mechanism, bind class to shared state); edit `src/components/hero/HeroSection.vue` (`mouseenter`/`mouseleave` on `glitch-text`); edit `src/App.vue` (`router.afterEach` for intra-`MainView` nav, 5s with cleanup).
  - Out: shaders/uniforms/loop, curvature `0.3`/motor, `FaultyTerminalBackground.vue`, sections content, i18n, `GlitchText` internals, `App.vue` renamed tags, `router/index.ts` routes/`scrollBehavior`, no `window` CustomEvents, no black frame, no z-index base change.
- Archivos:
  - `src/composables/useStaticFlash.ts` (create, new file; pattern ref: `src/composables/useCrtIntro.ts`, 11 lines, module-level `const isCrtDone = ref(false)` + setter).
  - `src/components/background/TvStaticBackground.vue` (edit, 367 lines; prop `raiseDuration?: number` line 43; `withDefaults raiseDuration: 500`; `const raised = ref(false)` line 188; `let raiseTimer: number | undefined` line 193; `handlePointerDown` lines 224-231 with `console.log('asd')` line 225; `onMounted window.addEventListener('pointerdown', handlePointerDown, { passive: true })` line 334 outside try; `onBeforeUnmount` remove + clear lines 345-346; template lines 360-366 multiline div `:class="raised ? 'z-10' : '-z-10'"` + `pointer-events-none fixed inset-0` + `aria-hidden`).
  - `src/components/hero/HeroSection.vue` (edit, 132 lines; `<glitch-text :text="...">` line 81 inside `h1`; script owns router, i18n, GSAP intro).
  - `src/App.vue` (edit, 43 lines; current renamed tags MUST NOT be touched: `<navbar />`, `<glitch-cursor />`, `<tv-static-background />`, `<faulty-terminal-background />`, `<router-view />`, `<crt v-if="showCrt" @done="handleCrtDone" />`; script owns `initSmoothScroll()` in `onMounted` with cleanup in `onBeforeUnmount`).
  - `src/router/index.ts` (read-only reference, 40 lines; routes `main /` + `profile/experience/projects/interests/contact`, ALL rendering `MainView`, section routes carry `meta.section`; `scrollBehavior` returns `false` after `scrollTo`).
- Riesgos:
  - Overlap hover/nav: `mouseleave` killing an active 5s nav window or nav end killing an active hover. Mitigation: two independent booleans `isHovering` + `isNavigating` with single `computed isFlashVisible = hovering OR navigating`; nav side owns re-armed timeout; hover side only touches its own flag.
  - `afterEach` over/under-firing: all section routes resolve the same `MainView` component, so path-change alone is not the signal; literal `hash` change is unreliable because nav in this app is section-route nav (`meta.section`). Condition must be intra-`MainView` with section change (see Cambios/Step 5).
  - Initial-load flash: `afterEach` fires on first navigation where `from` has no name/meta; guard prevents flash on mount.
  - Listener/timer leak: old `pointerdown` listener + `raiseTimer` must fully disappear; new `afterEach` unregister + nav-timeout re-arm (`clearTimeout` before `setTimeout`) must leave zero orphans.
  - `TvStaticBackground` shader/curvature regression if edit touches anything outside the raise mechanism; restrict edit to props/state/listener/template class binding only.

### Cambios

- `src/composables/useStaticFlash.ts` (create):
  - Module-level (no wrapper-function state, `useCrtIntro` pattern): `const isHovering = ref(false)`, `const isNavigating = ref(false)`, `let navTimer: number | undefined = undefined`.
  - `const isFlashVisible = computed(() => isHovering.value || isNavigating.value)`.
  - `function setHover(value: boolean): void` sets only `isHovering`.
  - `function flashOnNavigate(durationMs = 5000): void` sets `isNavigating = true`, `clearTimeout` existing `navTimer`, re-arms `navTimer = window.setTimeout(() => { isNavigating.value = false; }, durationMs)`.
  - English-only identifiers; no CustomEvents; no component code.
- `src/components/background/TvStaticBackground.vue` (edit):
  - Remove from `TvStaticBackgroundProps`: `raiseDuration?: number`; remove `raiseDuration: 500` from `withDefaults`.
  - Remove `const raised = ref(false)`, `let raiseTimer`, `handlePointerDown` (lines 224-231) including `console.log('asd')` line 225 hygiene.
  - Remove `window.addEventListener('pointerdown', handlePointerDown, { passive: true })` (line 334) and its `onBeforeUnmount` removal + timer clear (lines 345-346); leave shader/curvature `0.3`/motor `onMounted`/`onBeforeUnmount` intact.
  - Import `isFlashVisible` from `useStaticFlash`; template binding becomes `:class="isFlashVisible ? 'z-10' : '-z-10'"` keeping `pointer-events-none fixed inset-0` + `aria-hidden` + multiline div structure. Only `z-10`/`-z-10` literals.
- `src/components/hero/HeroSection.vue` (edit):
  - Only change: on existing `<glitch-text>` tag (line 81) add `@mouseenter="setHover(true)"` and `@mouseleave="setHover(false)"` with `setHover` imported from `useStaticFlash`. No script logic change to router/i18n/GSAP; no `GlitchText` internals change.
- `src/App.vue` (edit):
  - In `onMounted` (stable-mount owner alongside `initSmoothScroll`), register `const removeAfterEach = router.afterEach((to, from) => { if (isIntraMainViewSectionNav(to, from)) flashOnNavigate(5000); })`; in `onBeforeUnmount`, call `removeAfterEach()` alongside existing smooth-scroll cleanup. Do NOT rename existing component tags.
  - Condition `isIntraMainViewSectionNav`: destination resolves `MainView` AND (`to.meta.section !== from.meta.section` OR same-path hash change `to.path === from.path && to.hash !== from.hash`). Rationale: every section route renders `MainView`, so "hash navigation within same route" in this app equals "navigation staying inside `MainView`"; `meta.section` is the authoritative section discriminator, hash comparison covers same-path hash-only navs without over-firing on unrelated route changes.

### Restricciones

- RULES 0.3: one behavior per plan; only the four files listed (one create + three edits); no sections, shaders, `FaultyTerminal`, i18n, `GlitchText` internals changes.
- RULES 0.4: no `dev`/`build`/`preview`/`lint`/`format` without user authorization; package manager `bun` only; only real `package.json` scripts (`bun run dev`, `bun run build`, `bun run preview`).
- RULES 0.13 + CODING_STANDARDS §2.1 English-Only: identifiers `useStaticFlash`, `isHovering`, `isNavigating`, `isFlashVisible`, `setHover`, `flashOnNavigate`; no Spanish identifiers or comments in code.
- CODING_STANDARDS §7: no margins, no arbitrary `[...]` values; z-index only existing literals `z-10` / `-z-10`.
- Full cleanup: `pointerdown` listener + `raiseTimer` fully deleted; `afterEach` unregistered in `onBeforeUnmount`; nav timeout re-armed via `clearTimeout` (no orphan timers); preserve existing `initSmoothScroll` cleanup and shader/motor cleanup.
- No `window` CustomEvents; no click-based trigger reintroduced; no prop-drilling of flash state.
- Stack: Vue 3 Composition API + `<script setup>` + TS, Tailwind, Vite; `vue-best-practices` skill is subordinate reference only, `CODING_STANDARDS` prevails.

### Steps

1. Archivo `src/components/background/TvStaticBackground.vue` + `src/components/hero/HeroSection.vue` + `src/App.vue` + `src/router/index.ts` + `src/composables/useCrtIntro.ts` — Accion `read` — Re-leer los cinco y confirmar que coinciden con el contexto verificado (367/132/43/40/11 lineas, `raiseDuration` line 43, `raised` 188, `console.log('asd')` 225, listener 334, cleanup 345-346, template 360-366, `glitch-text` line 81, tags renombrados de `App.vue`, `meta.section` + `scrollBehavior false`, patron module-refs de `useCrtIntro`); si hay delta, detener y reportar sin editar — Restriccion: sin ejecucion de scripts, sin edits en este paso.
2. Archivo `src/composables/useStaticFlash.ts` — Accion `create` — Crear composable con `import { computed, ref } from 'vue'`; module-level `const isHovering = ref(false)`, `const isNavigating = ref(false)`, `let navTimer: number | undefined = undefined`; `export const isFlashVisible = computed(...)` (`isHovering.value || isNavigating.value`); `export function setHover(value: boolean)`; `export function flashOnNavigate(durationMs = 5000)` con `isNavigating.value = true`, `clearTimeout(navTimer)`, `navTimer = window.setTimeout(...)` — Restricciones: English-Only, sin CustomEvents, sin estado dentro de funcion wrapper, sin logica de componentes.
3. Archivo `src/components/background/TvStaticBackground.vue` — Accion `edit` — Borrar `raiseDuration` de la interfaz + `withDefaults`, `raised`, `raiseTimer`, `handlePointerDown` completo (incluido `console.log('asd')`), `addEventListener('pointerdown', ...)` y su `removeEventListener` + `clearTimeout`; importar `isFlashVisible` de `useStaticFlash`; plantilla `:class="isFlashVisible ? 'z-10' : '-z-10'"` — Restricciones: no tocar shader/uniforms/loop/curvatura `0.3`/motor, solo literales `z-10`/`-z-10`, English-Only.
4. Archivo `src/components/hero/HeroSection.vue` — Accion `edit` — Importar `setHover` de `useStaticFlash`; añadir unicamente `@mouseenter="setHover(true)"` y `@mouseleave="setHover(false)"` al tag `<glitch-text>` existente (line 81); no alterar router/i18n/GSAP intro ni `GlitchText` interno — Restricciones: English-Only, sin nuevos listeners/timers en este archivo.
5. Archivo `src/App.vue` — Accion `edit` — Importar `flashOnNavigate` + `router`; en `onMounted` registrar `router.afterEach` con condicion intra-`MainView` (`to` resuelve `MainView` con `to.meta.section !== from.meta.section` OR `to.path === from.path && to.hash !== from.hash`, con guarda de carga inicial) que llama `flashOnNavigate(5000)`; guardar el removedor y llamarlo en `onBeforeUnmount` junto al cleanup de `initSmoothScroll`; no renombrar tags existentes — Restricciones: cleanup completo, English-Only, bun scripts solo con autorizacion.
6. Archivo `src/components/background/TvStaticBackground.vue` + `src/App.vue` + `src/components/hero/HeroSection.vue` + `src/composables/useStaticFlash.ts` — Accion `read` (verificacion estatica) — Confirmar cero restos de `pointerdown`/`raiseDuration`/`raised`/`raiseTimer`/`console.log('asd')` en `TvStaticBackground`; `isFlashVisible` enlazado en plantilla; `setHover` solo en `glitch-text`; `afterEach` registrado y removido; timeout con re-arme — Restriccion: sin `dev/build/preview/lint/format` sin autorizacion.

### Verificacion

- Estatica (sin autorizacion): `pointerdown`/`raiseDuration`/`raised`/`raiseTimer`/`'asd'` ausentes en `TvStaticBackground.vue`; `:class` usa `isFlashVisible ? 'z-10' : '-z-10'`; `HeroSection.vue` solo añade `mouseenter`/`mouseleave` en `glitch-text` line 81; `App.vue` registra `afterEach` en `onMounted` y lo remueve en `onBeforeUnmount`, tags renombrados intactos; `useStaticFlash.ts` expone `isHovering`/`isNavigating` + `isFlashVisible` computado + `setHover` + `flashOnNavigate(5000)` con `clearTimeout` re-armado; sin `window` CustomEvents; sin cambios en shaders/curvatura/motor/secciones/i18n.
- Con autorizacion: `bun run lint:check` + `bun run format:check` exit 0; `bun run dev` manual: hover sobre el nombre con glitch muestra estatica y al salir se oculta; navegar entre secciones (`/`, `/profile`, `/experience`, `/projects`, `/interests`, `/contact`) la muestra ~5s y baja; click normal sin flash; consola limpia.
- Aceptacion: click sin efecto; hover visible-solo-mientras-hover sin matar ventana nav activa y viceversa; navegacion 5s y baja con re-disparo si se navega de nuevo; cero cambios visuales en reposo (`-z-10`).

## Compuerta

- Plan en estado **`EXECUTED`**. Ejecutado via Executor tras `READY` + frase "ejecuta el plan". Verificado por orquestador contra diff real.
- `CLOSED` solo con DoD + reviewer.md + entrada de memoria completa (verificacion con scripts bloqueados pendiente).

## Cierre (memoria persistente)

- Que cambio (verificado 2026-09-10): creado `src/composables/useStaticFlash.ts` (20 lineas: `isHovering`/`isNavigating`, `isFlashVisible` OR, `setHover`, `flashOnNavigate(5000)` con re-arme); `TvStaticBackground.vue`: fuera `raiseDuration`/`raised`/`raiseTimer`/`handlePointerDown` (incluido `console.log('asd')`), fuera listener `pointerdown`, plantilla a `:class="isFlashVisible ? 'z-10' : '-z-10'"`, shader/curvatura/motor intactos; `HeroSection.vue`: solo `@mouseenter/@mouseleave` en `glitch-text:82`; `App.vue`: `router.afterEach` intra-`MainView` (`meta.section` o hash misma path, guarda carga inicial) + cleanup en unmount, tags intactos.
- Delta no bloqueante: default `curvature` en TvStatic esta en `0.25` (`TvStaticBackground.vue:170`) vs `0.3` del plan/Faulty — ajuste fino del usuario en dev, se conserva; transicion entre fondos equivalente.
- Verificacion: estatica por lectura/grep OK (cero restos click/debug, wiring confirmado en 4 archivos). Pendiente por regla 0.4 (sin autorizacion): `bun run lint:check`, `bun run format:check`, `bun run dev` (hover muestra/oculta, nav 5s y baja, click sin efecto, consola limpia).
- Resultado: pendiente — permanece `EXECUTED` hasta validacion o aceptacion explicita del pendiente.
- Pendientes: autorizar verificaciones bloqueadas; luego reviewer + DoD para `CLOSED`.
