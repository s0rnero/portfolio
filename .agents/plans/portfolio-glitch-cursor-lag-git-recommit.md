---
name: portfolio-glitch-cursor-lag-git-recommit
status: EXECUTED
type: maintenance
domain: portfolio
owner_rules: .agents
created: 2026-09-23 12:00
enriched: 2026-09-23
ready: 2026-09-23
executed: 2026-09-23
---

# Plan: Glitch cursor sin delay + recommit en ingles + mapa solo OSM

> Estado **`EXECUTED`** 2026-09-23. Compuertas: "enriquece el plan" (PENDING->ENRICHED), revision orquestador + "puedes ejecutar el plan" del usuario (ENRICHED->READY->EXECUTED). Implementado via Executor en la sesion. `CLOSED` pendiente de verificacion con scripts autorizados (DoD).

## Objetivo (original + ajuste)

- A. Reducir o eliminar el delay percibido del `GlitchCursor` (follower X ms detras del mouse real, reportado en Mac/Safari).
- B. Deshacer N commits en espanol hechos por otro agente manteniendo todos los cambios, y recommittearlos en ingles con la cuenta propia de GitHub del usuario.
- C. (Ajustado) En `MapCard.vue`, remover solo el prefijo `Leaflet` y dejar `© OpenStreetMap` con su link.

## Alcance confirmado

- A. Cursor: `src/components/cursor/GlitchCursor.vue` (501 lines verificadas; `position` ref, `handlePointerMove` + `rAF` + `applyPointerPosition`, `:style translate3d`, hotspots arrow `5.5,1` / pointer `11,3`, ciclo 3s/8s, edge 24px).
- B. Git: historia local (N commits a inventariar; mensajes es->en; `author` -> cuenta propia). Sin tocar `src/` en esta pata.
- C. Mapa: `src/components/about/MapCard.vue` (165 lines; `L.map` linea ~69-77 con `attributionControl: true`; `L.tileLayer` linea ~79-86 con `attribution: TILE_ATTRIBUTION`; const `TILE_ATTRIBUTION` lineas 13-14 con link a `openstreetmap.org/copyright`).
- Combinacion en un solo plan por instruccion explicita del usuario (excepcion a RULES 0.3 documentada: una pata = un componente principal).

## Plan Tecnico

### Analisis

- Objetivo: A = bajar de 2 ticks (`rAF` + patch Vue) a 1 tick (`rAF` + escritura directa DOM) sin cambiar el look; B = misma arbol, nuevos mensajes/autor; C = `prefix: false`, atribucion OSM intacta.
- Scope: 2 archivos app (`GlitchCursor.vue`, `MapCard.vue`) + historia Git. Nada mas.
- Archivos:
  - `src/components/cursor/GlitchCursor.vue` (501 lines CONFIRMED 2026-09-23).
  - `src/components/about/MapCard.vue` (165 lines CONFIRMED 2026-09-23).
  - Contexto: `.agents/RULES.md`, `.agents/CODING_STANDARDS.md` (§2.1 English-only, §7 Tailwind, §8 visibilidad), `.agents/DESIGN.md`, `.agents/AGENTS.md` (Vue 3 + TS + Vite + Tailwind, bun, sin suite test). Skill `vue-best-practices` (v18) como referencia subordinada.
- Riesgos:
  - A: snap-back si `:style` y DOM directo divergen; regresion de hotspot; tocar ciclo/edge/outside por accidente.
  - B: rewrite destructivo; `force-push` si ya hay push; perder granularidad si se hace squash involuntario.
  - C: quitar OSM por error (violacion OSM) — mitigado al fijar `prefix: false` y no tocar `TILE_ATTRIBUTION`; flash del prefijo si se quita tarde.

### Cambios

- `src/components/cursor/GlitchCursor.vue` — script: add `cursorElement` template ref + `writeTransform(x, y)` helper (English comments); `applyPointerPosition` calcula una vez, escribe DOM sincronico + actualiza `position.value` al mismo valor (single source stays `position`); `checkEdge` se mueve dentro del `rAF` (una vez por frame, no por evento).
- `src/components/cursor/GlitchCursor.vue` — template: add `ref="cursorElement"` al root; mantener `:style` como fallback de primer pintado (mismo valor que el write directo, sin snap).
- `src/components/about/MapCard.vue` — map setup: `attributionControl: false` en `L.map` + `L.control.attribution({ prefix: false }).addTo(map)` antes del `tileLayer`; `TILE_ATTRIBUTION` y `tileLayer.attribution` intactos; sin CSS `display:none` sobre `.leaflet-control-attribution`.
- Git (sin tocar codigo): inventario de solo-lectura, luego rewrite `reset --soft` + recommit en ingles con identidad propia, o `rebase -i/reword` si se prefiere conservar hashes base; `push --force-with-lease` solo con confirmacion separada si hubo push previo.

### Restricciones

- RULES 0.1: Git solo con autorizacion explicita por fase; rewrite/force-push exigen confirmacion aparte en ejecucion. Enrichment no ejecuto Git.
- RULES 0.2: no borrar archivos.
- RULES 0.3: una pata = un componente (`GlitchCursor.vue` / `MapCard.vue`); Git no toca `src/`; excepcion multi-pata autorizada por el usuario para este plan.
- RULES 0.4: `bun run dev/build/preview/lint/format` solo con autorizacion; bun siempre; solo scripts reales de `package.json`.
- RULES 0.10/0.11/0.12: cambio documentado antes de ejecutar; `CLOSED` solo con DoD + memoria; si surge decision de arquitectura, ADR nuevo (no se preve).
- RULES 0.13 + STANDARDS §2.1: codigo y comentarios 100% ingles (`cursorElement`, `writeTransform`, `handlePointerMove`); sin Spanglish.
- STANDARDS §7: sin margenes, sin `[...]`, sin width/height contra flex, sin tipografia heredada tocada; estilo visual sigue Tailwind; el `style.transform` directo es posicionamiento, no estilo visual nuevo.
- STANDARDS §8 + DESIGN.md: no se cambia `v-if/v-show/active`, capas, z-index, `cursor:none`, `aria-hidden`, `pointer-events:none`, ciclo, edge, outside, reduced-motion.
- Skills subordinadas: `vue-best-practices` (estado minimo predecible, evitar re-renders innecesarios) apoya el write-directo; nunca prevalece sobre RULES/STANDARDS/DESIGN.
- C: no ocultar atribucion con CSS, no retirar `TILE_ATTRIBUTION`, no cambiar URL de tiles ni proveedor en este plan.

### Steps

1. Archivo: `src/components/cursor/GlitchCursor.vue` — Accion: `read` — Detalle tecnico: releer completo (501 lines); confirmar baseline: `position` ref `{-100,-100}`, `ACTIVE_MS 3000`, `PAUSE_MS 8000`, `EDGE_MARGIN_PX 24`, `handlePointerMove` con `rafId` guard, `applyPointerPosition` con hotspots `11,3` / `5.5,1`, root `:style translate3d`, `supportsCursor` + `FINE_POINTER_QUERY`, listeners simetricos, 5 keyframes `2.4s steps(1)`. Si hay delta, parar y reportar. — Restricciones: read-only; scope pata A.
2. Archivo: `src/components/cursor/GlitchCursor.vue` (script) — Accion: `edit` — Detalle tecnico: tras `mapContainer`-style refs, anadir (English comments only) `const cursorElement = ref<HTMLElement | null>(null)` + `const writeTransform = (x: number, y: number) => { cursorElement.value?.style.setProperty('transform', `translate3d(${x}px, ${y}px, 0)`) }`; en `applyPointerPosition`: calcular `x,y` una vez segun `isPointer`, llamar `writeTransform(x, y)` y asignar `position.value = { x, y }` al mismo valor; mover `checkEdge(x, y)` desde `handlePointerMove` al interior de `applyPointerPosition` (usa `lastEvent.clientX/Y`); `handlePointerMove` queda solo como `lastEvent = event; if (rafId === null) rafId = requestAnimationFrame(applyPointerPosition)`. — Restricciones: English-only; no tocar ciclo/edge-valores/outside/reduced-motion/z-index/`cursor:none`; sin nuevos imports salvo `ref` ya existente; sin CustomEvents.
3. Archivo: `src/components/cursor/GlitchCursor.vue` (template) — Accion: `edit` — Detalle tecnico: anadir `ref="cursorElement"` al `div.glitch-cursor`; mantener `:style` y `:class` intactos (fallback primer frame, mismo valor). — Restricciones: no cambiar clases, SVGs, slices, `aria-hidden`, `teleport`, `v-if/v-show`.
4. Archivo: `src/components/cursor/GlitchCursor.vue` — Accion: `read` (self-review) — Detalle tecnico: diff acotado al archivo; `cursorElement` cableado (template ref + script + cleanup existente cubre `cancelAnimationFrame`); sin divergencia `position` vs DOM; listeners simetricos; English-only; sin violaciones §7/§8. — Restricciones: sin scripts; verificacion pendiente queda reportada.
5. Archivo: `src/components/about/MapCard.vue` — Accion: `read` — Detalle tecnico: confirmar 165 lines, `TILE_URL`, `TILE_ATTRIBUTION` con link copyright, `L.map` con `attributionControl: true`, `tileLayer` con `attribution`. — Restricciones: read-only; scope pata C.
6. Archivo: `src/components/about/MapCard.vue` (setup) — Accion: `edit` — Detalle tecnico: cambiar `L.map(container, { ..., attributionControl: true, ... })` a `attributionControl: false`; tras crear `map`, insertar `L.control.attribution({ prefix: false }).addTo(map)` antes de `L.tileLayer(...)`; dejar `attribution: TILE_ATTRIBUTION` intacto; comentario en ingles (`// Show OSM attribution without the Leaflet prefix (Tile Usage Policy compliant)`). — Restricciones: English-only; no CSS hide; no tocar tiles/zoom/pin/recenter/estilos; un archivo.
7. Archivo: `src/components/about/MapCard.vue` — Accion: `read` (self-review) — Detalle tecnico: verificar `prefix: false` presente, `TILE_ATTRIBUTION` byte-identico, sin reglas CSS contra `.leaflet-control-attribution`, diff en un archivo. — Restricciones: sin scripts.
8. Git inventario (solo lectura, en ejecucion y con autorizacion explicita de inspeccion Git) — Accion: `read` (salida de comandos, no edicion de codigo) — Detalle tecnico: `git status -sb`, `git log --oneline -N` (N = numero de commits a rehacer), `git log origin/<branch>..HEAD` para determinar push/no-push, `git config user.name/email` actual vs deseado. Registrar hashes + mensajes actuales + decision `reset --soft` (granularidad a preservar) vs `rebase -i`. — Restricciones: RULES 0.1; si el usuario no autoriza inspeccion, Executor se detiene y lo reporta; no avanzar a rewrite sin confirmacion separada.
9. Git rewrite (destructivo, solo en ejecucion tras confirmacion separada) — Accion: comandos Git — Detalle tecnico: configurar identidad propia (`git config user.name/email` del usuario), `git reset --soft HEAD~N` (mantiene staged), recommit uno-por-uno en ingles (mismo contenido, mensajes nuevos), verificar `git status/diff` conserva el arbol; `push --force-with-lease` solo si habia push previo y con confirmacion explicita. — Restricciones: no `hard/clean`; no mezclar con ediciones de codigo; no inventar mensajes fuera del contenido real.

### Verificacion

- Estatica (sin autorizacion, ya hecha en enrichment via lectura): `GlitchCursor.vue` 501 lines + pipeline `pointermove->rAF->ref->:style`; `MapCard.vue` 165 lines + `attributionControl`/`attribution`; `vue-best-practices` compatible (menos re-renders, estado minimo).
- En ejecucion (con autorizacion RULES 0.4/0.1): `bun run lint:check` + `bun run format:check` exit 0; `bun run dev` visual: cursor sin estela en Mac/Safari con glitch/colores/hotspots intactos; mapa con `© OpenStreetMap` visible y sin `Leaflet`, tiles/zoom/pin/recenter intactos; `git status/diff` confirma mismo arbol tras recommit.
- Criterios de aceptacion: cursor 1 tick con `position` como fuente unica; mapa compliant OSM; commits en ingles con autor propio y mismo contenido; diff app en 2 archivos.

## Compuerta

- Plan en estado **`ENRICHED`**. Enrichment invocado por frase explicita del usuario (typo "ennriquece" aceptado como intencion explicita + contexto). Sin implementacion.
- Siguiente: revision critica del orquestador + visto bueno del usuario antes de `READY`; luego frase **"ejecuta el plan"** para `READY -> EXECUTED` via Executor.

## Cierre (memoria persistente)

> Entrada de memoria 2026-09-23 (EXECUTED, no CLOSED: falta verificacion con scripts).

- Que cambio: `git reset --soft origin/main` (13 commits ES intactos en arbol) + 2 edits (`GlitchCursor.vue`: `cursorElement` + `writeTransform`, `checkEdge` al rAF; `MapCard.vue`: `attributionControl: false` + `L.control.attribution({ prefix: false })`) + 14 recomits EN con `s0rnero <cesarandresriosvalen@gmail.com>` (tooling, assets, content, composables, about, sections, visuals, vicecity, app, public, infra con `git add -f wrangler.toml`, agents, game-host, docs). Sin push (el usuario pushea). `.freebuff/project-id` quedo fuera del historial (estado local, ahora ignorado).
- Verificacion: estatica por `git diff 3f15750 HEAD` (solo los 2 ficheros + `.gitignore` preexistente) y `git status` limpio salvo los 2 planes luego commiteados. Pendiente por regla 0.4 (sin autorizacion independiente): `bun run lint:check`, `bun run format:check`, `bun run build` y revision visual en Mac/Safari.
- Resultado: pendiente — permanece `EXECUTED` hasta validacion o aceptacion explicita del pendiente.
- Pendientes: autorizar scripts; push manual por el usuario; luego reviewer + DoD para `CLOSED`.
