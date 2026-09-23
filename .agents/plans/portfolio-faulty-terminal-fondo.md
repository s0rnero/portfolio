---
name: portfolio-faulty-terminal-fondo
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-08 12:00
enriched: 2026-09-08 12:00
executed: 2026-09-08
---

# Plan Técnico: Fondo global FaultyTerminal (vue-bits) con minimotor khatarsis

> Sustituye a `portfolio-liquid-ether-fondo` (CLOSED por sustitución). `src/components/BlackWallAnimation.vue` queda sin usar (no eliminar). Fuente del shader: código `FaultyTerminal` aportado por el usuario (vue-bits, MIT + Commons Clause).

## Analisis

- **Objetivo:** fondo global animado estilo terminal defectuoso (dígitos/scanlines/glitch/flicker, reactivo al mouse) detrás de las 6 secciones, con tinte rojo del portafolio.
- **Scope:** create `src/components/FaultyTerminalBackground.vue` + edit `src/App.vue` (quitar BlackWall, montar el fondo). Sin nuevas dependencias, sin cambios en khatarsis.
- **Base verificada contra khatarsis real (solo lectura, 2026-09-08):** `packages/khatarsis/src/effects/webgl/` — `createRenderer({dpr}) → {gl, canvas, setSize, loseContext}`; `createFullscreenTriangle(gl)` con attrs `position`/`uv`; `createProgram(gl, {vertex, fragment, uniforms: {name: value}})` con `UniformValue = number | Int32Array | Float32Array` y `setUniform(name, value)`; `createMesh(gl, {geometry, program})`; `renderScene(gl, mesh)`. Todo exportado desde `'khatarsis'`.
- **Adaptaciones obligatorias (únicas):** imports ogl → khatarsis; `new Program` → `createProgram`; `program.uniforms.x.value = v` → `setUniform('x', v)`; `new Color(r,g,b)` → `new Float32Array([r,g,b])`; `renderer.render({scene})` → `renderScene(gl, mesh)`; mouse en `window` (el contenedor es `pointer-events-none`).
- **Riesgos:** WebGL2 ausente → fallback silencioso a `bg-neutral-950` (try/catch, sin romper). Shaders ES 1.00 sin texturas → compilan en WebGL2 sin cambios.

## Cambios

### 1. `src/components/FaultyTerminalBackground.vue` (create)

- Cabecera con copyright vue-bits (`Copyright (c) 2025 David Haz`, MIT + Commons Clause, uso desde 2026).
- Props fijas con defaults (sin `className`/`style` genéricos): `tint '#ff2d2d'`, `brightness 1`, `scale 1`, `gridMul [2,1]`, `digitSize 1.5`, `timeScale 0.3`, `scanlineIntensity 0.3`, `glitchAmount 1`, `flickerAmount 1`, `noiseAmp 1`, `chromaticAberration 0`, `dither 0`, `curvature 0.2`, `mouseReact true`, `mouseStrength 0.2`, `dpr` min(devicePixelRatio,2), `pageLoadAnimation true`. Sin `watch` deep (props estáticas tras montar).
- Shaders `vertex`/`fragment` verbatim del código aportado.
- Loop rAF propio + ResizeObserver; pausa en `document.hidden` y `prefers-reduced-motion` (frame estático); cleanup total (cancel rAF, disconnect, removeChild, `loseContext`).
- Plantilla: `<div class="pointer-events-none fixed inset-0 z-0" aria-hidden="true">` + canvas del renderer dentro.

### 2. `src/App.vue` (edit)

- Quitar import + tag `<black-wall-animation>`; importar y montar `<faulty-terminal-background />` primero en `main`. Nada más.

## Restricciones

- `CODING_STANDARDS.md` §7: clases fijas, cero márgenes, sin `[...]`. Medidas en TS, no en clases.
- Un componente (regla 0.3); bun; sin `three`/`ogl` ni deps nuevas; no dev/build/preview sin autorización (regla 0.4).
- Estrictamente dentro del repo; khatarsis solo lectura de API (sin cambios en la librería).

## Steps

1. **create** `src/components/FaultyTerminalBackground.vue` según Cambios (imports khatarsis, uniforms directos, `setUniform` por frame, `Float32Array` en vez de `Color`, mouse en `window`, fallback sin WebGL, reduced-motion).
2. **edit** `src/App.vue`: retirar BlackWall, montar el fondo primero en `main`.
3. `bun run lint:check` + `bun run format:check`.
4. Build/dev con autorización aparte (regla 0.4).

## Verificacion

- `lint:check` + `format:check` exit 0.
- `bun run build` (autorización aparte): `vue-tsc` verde.
- `bun run dev` (autorización aparte): terminal visible detrás de las secciones, glitch/flicker/scanlines, reacción al mouse, page-load de 2s, fondo fijo al scroll, sin errores, framerate estable; sin WebGL → fondo liso.

## Revisión del orquestador — pendiente de aprobación a READY

- Alcance exacto pedido (solo faulty-terminal, 1 create + 1 edit); sin BlackWall, sin LiquidEther, sin `three`/`ogl`.
- APIs khatarsis confirmadas en su código real; adaptaciones listadas 1:1; shaders intactos.
- Respeta RULES / CODING_STANDARDS §7 / DESIGN; licencia con copyright en el archivo.
- No marco READY automático: espero tu visto bueno.

## Cierre (memoria persistente)

- Que cambio: Creado `src/components/FaultyTerminalBackground.vue` (shaders verbatim, imports khatarsis `createRenderer/createFullscreenTriangle/createProgram/createMesh/renderScene`, uniforms directos, `setUniform` por frame, `Color→Float32Array`, mouse en `window`, loop rAF + ResizeObserver, pausa en tab oculta, frame estático con `reduced-motion`, fallback silencioso sin WebGL, copyright vue-bits en cabecera, tinte `#ff2d2d`). Editado `src/App.vue`: fuera BlackWall (archivo conservado sin usar), montado `<faulty-terminal-background />` primero en `main` (se restauró `bg-neutral-950` como base).
- Verificacion: `lint:check` exit 0; `format:check` exit 0. Pendiente por regla 0.4: `bun run build` y `bun run dev` (requieren autorización aparte).
- Resultado: pendiente — no pasa a CLOSED hasta validar build + visual (o aceptación explícita del pendiente) según DoD.
- Pendientes: autorizar `bun run build` y/o `bun run dev` para ver la terminal en vivo.
