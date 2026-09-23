---
name: portfolio-glitch-cursor-pointer-hand
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-10
enriched: 2026-09-10
ready: 2026-09-10 (orden "ejecuta el plan" tomada como visto bueno del ENRICHED)
executed: 2026-09-10
---

## Plan Tecnico: Cursor manito en zonas pointer — misma glitch, mismos colores

> Solicitud del usuario (2026-09-10): cuando el cursor este sobre algo clicable (cursor pointer), el follower deja de ser flecha y pasa a forma de manito, conservando efecto glitch y colores. Forma investigada en internet por el orquestador (ver Fuentes).

### Analisis

- Objetivo: when the follower is over clickable elements (pointer context), switch silhouette from arrow to pointing-hand (index up) preserving the existing glitch system (3s burst / 8s pause, RGB split, slices, jitter), theme colors (`--cursor-fill` / `--cursor-stroke`), ~26px scale and logical hotspot (fingertip = click point). Outside pointer zones the current arrow stays intact.
- Scope: strictly single file `src/components/cursor/GlitchCursor.vue`. Detection by delegation, 3 extra SVG hand layers reusing keyframes/vars, per-mode hotspot, Apache credit comment. No cycle/edge/outside/reduced-motion/`cursor:none`/z-index changes. No new deps, no external assets, no CustomEvents, no other components.
- Archivos:
  - `src/components/cursor/GlitchCursor.vue` (418 lines CONFIRMED, single target of all edits; script setup + template root div 26px box + 3 arrow SVGs viewBox `0 0 24 24` + 2 slice spans + scoped style with theme vars and 5 keyframes `2.4s steps(1)`).
  - Contexto verificado 2026-09-10: `.agents/RULES.md`, `.agents/CODING_STANDARDS.md` (English-only §2.1, Tailwind §7), `.agents/DESIGN.md`, `.agents/AGENTS.md` (Vue 3 Composition API + Tailwind + Vite + TS, bun, khatarsis). Skill `vue-best-practices` subordinate only.
  - Estructura confirmada sin cambios: `follower`/`position` refs, `ACTIVE_MS=3000`, `PAUSE_MS=8000`, `EDGE_MARGIN_PX=24`, `isGlitching`/`isOutside` refs, cycle timers, edge mode, rAF-throttled `pointermove` (hotspot `client-4,client-4`), `documentElement mouseleave/mouseenter` for outside, `glitch-cursor-active` class adding global `cursor:none`; arrow paths `M6 3 L6 18.2 L9.8 14.4 L12.2 20.8 L14.7 19.6 L12.3 13.3 L16.6 13.3 Z` at lines 150/157/164; no `isPointer`/`pointerover`/`touch_app` present.
  - `k-button` renders real anchors/buttons in DOM, so `closest('a,button,...')` covers them.
- Riesgos:
  - Hotspot mano estimado (~11,3) requiere verificacion visual; si queda desplazado el click parece fallar aunque el hit-test real no cambia (follower tiene `pointer-events:none`).
  - Flicker de `isPointer` si `pointerout` no filtra `relatedTarget` dentro del mismo ancestro interactivo.
  - Falsos positivos en elementos deshabilitados (`[disabled]`, `aria-disabled="true"`) si el selector no los excluye en handlers.
  - Colision de especificidad CSS al mostrar/ocultar arrow vs hand si no se usan modifier classes explicitas.
  - Regresion si `isPointer` toca ciclo glitch/edge/outside; debe ser ref ortogonal.

### Cambios

- `src/components/cursor/GlitchCursor.vue` — script: add `isPointer` ref + `POINTER_SELECTOR` const + `handlePointerOver`/`handlePointerOut` delegation on `window`, register/cleanup in existing `onMounted`/`onBeforeUnmount`; `applyPointerPosition` branches hotspot per mode; no touch to `ACTIVE_MS`/`PAUSE_MS`/`EDGE_MARGIN_PX`/cycle/edge/outside/reduced-motion.
- `src/components/cursor/GlitchCursor.vue` — template: bind `glitch-cursor--pointer: isPointer` on root div; add 3 hand SVGs (split-a/split-b/base pattern) with `touch_app` path + Apache credit comment; keep 2 slice spans untouched and shared.
- `src/components/cursor/GlitchCursor.vue` — style: add visibility toggle arrow vs hand under `.glitch-cursor--pointer`; reuse existing split/slice/jitter keyframes and `--cursor-fill`/`--cursor-stroke` vars; zero new `@keyframes`, zero new Tailwind arbitrary values, zero margin utilities.

### Restricciones

- RULES 0.3: one component only; nothing outside `src/components/cursor/GlitchCursor.vue`; no subcomponents/modules/helpers.
- RULES 0.4: no `dev/build/preview/lint/format` without explicit user authorization; package manager bun; only real scripts from `package.json`.
- RULES 0.1/0.2: no git, no file deletion.
- RULES 0.13 + CODING_STANDARDS §2.1: code 100% English — `isPointer`, `handlePointerOver`, `handlePointerOut`, `POINTER_SELECTOR`; comments in English; no Spanglish.
- CODING_STANDARDS §7 Tailwind: no `m-*`/`mx-*`/`my-*`/`mt/mb/ml/mr-*`, no new `[...]` arbitrary values, no fixed width/height conflicting with flex, no unjustified `min-w-0`, no inherited typography changes.
- DESIGN.md: respect layers/patterns; no new architecture, no public contract change.
- Scope lock: no new deps, no external assets, no new `@keyframes`, no changes to cycle (3s/8s), edge band 24px, outside logic, `prefers-reduced-motion` hide, global `cursor:none`, z-index 60; `aria-hidden` + `pointer-events:none` preserved.
- License: Apache-2.0 `touch_app` path only with credit comment (source URL + license); no sets with unknown license.
- Skills subordinate: `vue-best-practices` never overrides RULES/CODING_STANDARDS/DESIGN.

### Steps

1. Archivo: `src/components/cursor/GlitchCursor.vue` — Accion: `read` — Detalle tecnico: re-read full file (418 lines); confirm unchanged baseline: 3 arrow paths at 150/157/164, script refs, consts `ACTIVE_MS=3000`/`PAUSE_MS=8000`/`EDGE_MARGIN_PX=24`, `applyPointerPosition` with `clientX-4/clientY-4`, listeners `pointermove` on `window` + `mouseleave`/`mouseenter` on `documentElement`, root div classes, 3 svg layers + 2 slice spans, theme vars and 5 keyframes `2.4s steps(1)`, reduced-motion `display:none`. If delta, stop and report. — Restricciones: read-only; no edits in this step; single file scope.
2. Archivo: `src/components/cursor/GlitchCursor.vue` (script) — Accion: `edit` — Detalle tecnico: add after `isOutside` (English comments only): `const isPointer = ref(false)` independent of glitch/edge/outside/timers; `const POINTER_SELECTOR = 'a, button, input, select, textarea, label, summary, [role="button"], [role="link"], [data-cursor="pointer"]'`. Add `handlePointerOver(event: PointerEvent)` — if target matches selector and not disabled (`closest('[disabled], [aria-disabled="true"]')` guard) then `isPointer.value = true`. Add `handlePointerOut` — only set false when `relatedTarget` is NOT inside the same selector (anti-flicker). Use `pointerover`/`pointerout` bubbling with `{ passive: true }` on `window`; register/remove in existing `onMounted`/`onBeforeUnmount` under the same reduced-motion guard. Branch hotspot in `applyPointerPosition`: pointer mode `clientX-11, clientY-3` (fingertip estimate pending visual verification), else `clientX-4, clientY-4`. — Restricciones: English-only; no cycle/edge/outside changes; no new imports/deps; no CustomEvents.
3. Archivo: `src/components/cursor/GlitchCursor.vue` (template) — Accion: `edit` — Detalle tecnico: extend root `:class` with `'glitch-cursor--pointer': isPointer`; tag existing 3 arrow SVGs with `glitch-cursor__layer--arrow`; append 3 hand SVGs mirroring split-a/split-b/base pattern with the exact `touch_app` path (ver paso enriquecido original para el path completo) + HTML credit comment with source URL above them; reuse the 2 slice spans as-is. — Restricciones: no style values; keep `pointer-events:none`/`aria-hidden`.
4. Archivo: `src/components/cursor/GlitchCursor.vue` (style) — Accion: `edit` — Detalle tecnico: visibility toggle only, zero new `@keyframes`: default `.glitch-cursor__layer--hand { display: none; }`; under `.glitch-cursor--pointer` hide `--arrow` and show `--hand`. Hand layers reuse theme vars and existing `--a/--b` animations + slices. — Restricciones: zero new keyframes/values; no z-index/`cursor:none`/edge/outside edits.
5. Archivo: `src/components/cursor/GlitchCursor.vue` — Accion: `read` (static self-review) — Detalle tecnico: verify diff limited to this file; listeners symmetric; `isPointer` orthogonal; hand visible only under pointer class; keyframes byte-identical; Apache credit present; slices still 2 and shared. — Restricciones: no script execution; report verification as pending authorization.

### Verificacion

- Estatica (sin autorizacion, solo lectura): diff acotado al archivo; selector exacto; guards `relatedTarget` + disabled; simetria de listeners; ortogonalidad de `isPointer`; path exacto + credito Apache con URL; visibilidad solo bajo la clase; cero `@keyframes` nuevos; slices 2 compartidos; reduced-motion/edge/outside/`cursor:none`/z-index intactos; English-only; sin violaciones §7.
- Con autorizacion (RULES 0.4): `bun run lint:check` + `bun run format:check` exit 0; `bun run dev` manual: manito sobre links/botones/inputs con mismos bursts y colores, flecha fuera; hotspot en la punta del indice (ajustar `11,3` si hace falta); edge band intacta; consola limpia.
- Criterios de aceptacion: manito solo en clicables; glitch/colores identicos; hotspot en la punta; sin regresiones; cambio en un archivo.

### Fuentes

- Google Material Symbols `touch_app` (Apache 2.0): `https://raw.githubusercontent.com/google/material-design-icons/master/src/action/touch_app/materialicons/24px.svg` — path exacto en el paso 3.

## Compuerta

- Plan en estado **`EXECUTED`**. Ejecutado via Executor tras `READY` + frase "ejecuta el plan". Verificado por orquestador contra diff real.
- `CLOSED` solo con DoD + reviewer.md + entrada de memoria completa (verificacion con scripts bloqueados pendiente).

## Cierre (memoria persistente)

- Que cambio (verificado 2026-09-10): solo `src/components/cursor/GlitchCursor.vue` (418 -> 482 lineas): `isPointer` + `POINTER_SELECTOR` + `handlePointerOver` (guard disabled) / `handlePointerOut` (guard relatedTarget), listeners simetricos bajo reduced-motion guard, hotspot por modo (mano 11,3 / flecha 4,4), 3 capas mano `touch_app` + credito Apache, toggle `display` bajo `.glitch-cursor--pointer`, 5 keyframes intactos, slices 2 compartidos.
- Verificacion: estatica por lectura/grep OK (wiring, guards, simetria, path exacto, English-only, sin violaciones §7). Pendiente por regla 0.4 (sin autorizacion): `bun run lint:check`, `bun run format:check`, `bun run dev` (manito en clicables con mismos bursts/colores, flecha fuera, hotspot en la punta, edge intacta, consola limpia).
- Resultado: pendiente — permanece `EXECUTED` hasta validacion o aceptacion explicita del pendiente.
- Pendientes: autorizar verificaciones; hotspot `11,3` a confirmar visualmente (ajustar si hace falta); luego reviewer + DoD para `CLOSED`.

## Ampliacion 2026-09-22: el cursor desaparece en dispositivos sin raton (ADR-016)

- Que cambio: solo `src/components/cursor/GlitchCursor.vue`. El cursor propio se activa unicamente si `matchMedia('(hover: hover) and (pointer: fine)')` coincide. Se anaden `supportsCursor` (ref, inicial `false`), `FINE_POINTER_QUERY`, `isAttached`, `pointerQuery`, `attachCursor()` / `detachCursor()` (listeners + clase `glitch-cursor-active` + ciclos + `supportsCursor`, simetricas) y `handlePointerCapabilityChange`; `onMounted` ya no devuelve temprano por reduced-motion, resuelve la consulta, la escucha (`change`) y solo adjunta si `matches`; `onBeforeUnmount` quita el listener y llama a `detachCursor()`. Plantilla: `v-if="!isReducedMotion"` -> `v-if="supportsCursor"`. CSS: el bloque de `prefers-reduced-motion` pasa a `@media (prefers-reduced-motion: reduce), (hover: none), (pointer: coarse)`.
- Motivo: en tactil el navegador sintetiza `pointermove`/`pointerover`, asi que el SVG falso aparecia bajo el dedo y la clase global `cursor: none` quedaba puesta sin raton que ocultar.
- Verificacion: `bun run lint:check` 0, `bun run format:check` 0, `bun run build` 0; el bundle desplegado en `https://carv-portfolio.netlify.app` contiene la consulta `(hover: hover) and (pointer: fine)`. Comprobacion visual en movil: pendiente del usuario. Sin tocar keyframes, hotspots ni el resto del componente.
