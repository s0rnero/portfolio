---
name: portfolio-blackwall-animation
status: CLOSED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-07 11:53
enriched: 2026-09-08 12:00
executed: 2026-09-08
closed: 2026-09-08
---

# Plan Técnico: BlackWallAnimation.vue — fondo estilo Blackwall (Cyberpunk 2077)

## Analisis

- **Objetivo:** fondo único del portafolio que imite el Blackwall: muro densísimo de rectángulos pequeños (campo tipo DotField) sobre fondo de colores en movimiento constante e interactivo (tipo LiquidEther). Paleta rojo dominante con degradados en azul y negro. Reactivo al mouse en ambas capas, con movimiento automático sin interacción.
- **Scope:** crear `src/components/BlackWallAnimation.vue` (único componente nuevo) + editar `src/App.vue` (montaje global). **No se toca** `HeroSection.vue` ni ningún otro componente: `src/components/HeroSection.vue:27` es solo comentario decorativo. No se tocan secciones ni datos.
- **Base técnica asumida como verificada (no re-inspeccionar fuera del repo):**
  - `khatarsis` expone `useFluidSimulation` y `useCanvasLoop` con import directo: `import { useFluidSimulation, useCanvasLoop } from 'khatarsis'`. Sin shim, sin declaración local de tipos.
  - `src/App.vue:26` main `relative min-h-screen bg-neutral-950 text-zinc-200 antialiased`, sin BlackWall montado.
  - `src/composables/useSmoothScroll.ts:14-18` Lenis modo ventana, `fixed` seguro.
  - `src/components/*.vue` sin `bg-`, muro visible a través.
  - Tooling `eslint.config.mjs`, `.prettierrc` presentes.
- **Riesgos:**
  1. Legibilidad del texto sobre fondo animado rojo/azul → mitigado con prop `scrimOpacity` default `0` como fallback apagado; activarlo queda fuera de alcance sin decisión del usuario.
  2. Bloqueo de interacciones por canvases fullscreen → mitigado: root y ambos canvas con `pointer-events-none`, listeners en `window`.
  3. Rendimiento (muro denso + fluido WebGL) → mitigado con cotas duras (ver Restricciones).
  4. Inventar API del composable → mitigado: usar tal cual lo expuesto por el import, sin envolver ni re-declarar.

## Cambios

### 1. `src/components/BlackWallAnimation.vue` (create)

Componente único, autocontenido, dos capas apiladas. Orden de código según standards: imports → contratos → estado → lógica.

**Plantilla:**

```html
<template>
  <div ref="root" class="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
    <canvas ref="fluidCanvas" class="pointer-events-none absolute inset-0 h-full w-full" />
    <canvas ref="wallCanvas" class="pointer-events-none absolute inset-0 h-full w-full" />
  </div>
</template>
```

Ambos canvas `pointer-events-none`. Root `aria-hidden="true"`. Cero márgenes, cero `[...]`, sin width/height fijos en clases (las medidas viven en props TS).

**Script — contrato inmutable de props con defaults:**

- `colors?: string[]` → `['#ff1a1a', '#dc2626', '#1d4ed8', '#000000']`
- `autoDemo?: boolean` → `true`
- `autoInterval?: number` → `1200`
- `dotSpacing?: number` → `14`
- `rectSize?: number` → `3`
- `bulgeStrength?: number` → `1.6`
- `bulgeRadius?: number` → `140`
- `maxDpr?: number` → `2`
- `scrimOpacity?: number` → `0` (fallback legibilidad, apagado por defecto)

**Script — imports (única forma permitida):**

```ts
import { useFluidSimulation, useCanvasLoop } from 'khatarsis'
```

Prohibido crear o editar `src/khatarsis.d.ts` (no existe y no se crea). Prohibido shim o `declare module`.

**Capa 1 — Fluido (khatarsis):**

```ts
const fluid = useFluidSimulation(fluidCanvas, {
  simResolution: 128,
  dyeResolution: 1024,
  densityDissipation: 1.2,
  velocityDissipation: 0.6,
  curl: 4,
  splatRadius: 0.25,
  splatForce: 6000,
  shading: true,
  transparent: true,
  colors: props.colors,
  autoDemo: props.autoDemo,
  autoInterval: props.autoInterval,
})
```

- `autoDemo: true, autoInterval: 1200` es el movimiento garantizado aunque no haya interacción.
- **Puente window→fluido:** listeners `pointermove` / `mousedown` en `window` (no en el canvas) alimentan la simulación **vía la API real del composable, sin inventar nada**: si el retorno expone `restart` / `splat`, usarlo tal cual para sesgar splats hacia el núcleo (~x65%); si no expone nada accionable, no inventar método: el movimiento garantizado es `autoDemo` + reacción al mouse en capa muro. Todo listener con cleanup en `onUnmounted`.
- Acople muro↔fluido: misma fase por columna y splats sesgados al núcleo cuando la API lo permita.

**Capa 2 — Muro de rectángulos (canvas 2D vía `useCanvasLoop`):**

- Grilla del viewport: `cols = ceil(width / dotSpacing)`, `rows = ceil(height / dotSpacing)`; cada celda dibuja rect centrado de `rectSize` px.
- **Columnas verticales:** rects alargados tipo `2x6` / dashes verticales; brillo por columna con hash determinista `mulberry32` con semilla fija (sin parpadeo).
- **Núcleo caliente:** máscara radial centrada ~x65% del ancho; tamaño/alfa hacia bloom.
- **Sin piso:** muro full-bleed uniforme, sin horizonte.
- **Banding glitch horizontal sutil por filas:** offset leve por fila, baja amplitud.
- **Ondulación viva + acople:** offset vertical `sin(elapsed * freq + fase_por_columna)`; misma fase para sesgar splats del fluido.
- **Batching por color:** 3 buckets (rojo ~70%, azul ~20%, negro/gris ~10%), un `beginPath()` + `rect()` acumulados + un `fill()` por bucket → 3 fills/frame.
- **Interacción mouse (bulge DotField):** `pointermove` en `window`; desplazamiento radial `bulgeStrength * (1 - (d/bulgeRadius)^2) * dotSpacing`.
- **Touch:** `pointermove` cubre drag; tap estático compensado por `autoDemo`.
- `useCanvasLoop` con `{ draw, targetFps: 60, maxDpr: props.maxDpr }`; ResizeObserver, IntersectionObserver, visibilitychange, `prefers-reduced-motion` y cleanup del motor.
- `scrimOpacity` apagado por defecto (`0`); no activar sin usuario.

### 2. `src/App.vue` (edit)

- Importar `BlackWallAnimation` y montarlo como primera capa dentro de `main`, antes de las secciones, sin tocar nada más:
  ```html
  <main class="relative min-h-screen bg-neutral-950 text-zinc-200 antialiased">
    <black-wall-animation
      class="z-0"
      :colors="['#ff1a1a', '#dc2626', '#1d4ed8', '#000000']"
    />
    <hero-section />
    ...
  </main>
  ```
- `main` conserva `relative` y `bg-neutral-950`.

## Restricciones

- Un solo componente principal (RULES 0.3): todo vive en `BlackWallAnimation.vue`.
- **Prohibido `src/khatarsis.d.ts`:** ni create ni edit. Imports directos de `'khatarsis'`.
- Sin dependencias nuevas (no `three`, no WebGL propio). Cero duplicación.
- `CODING_STANDARDS.md` §7: cero márgenes, sin `[...]`, sin width/height fijos con flex, `min-w-0` solo justificado. Medidas en props TS.
- Accesibilidad: `aria-hidden="true"`, `prefers-reduced-motion` del motor.
- **Cotas rendimiento duras:** `dotSpacing` mínimo 10–12px (default 14, nunca bajo 10), `maxDpr` 2, `dyeResolution` 1024, batching 3 fills/frame.
- Gestor bun. Solo scripts reales: `lint:check`, `format:check`, `build`, `dev`, `preview`.
- No tocar `HeroSection.vue`, secciones ni datos. No activar `scrimOpacity` sin usuario.
- No ejecutar dev/build sin autorización (regla 0.4). Estrictamente dentro del repo, nada fuera.

## Steps

1. **create** `src/components/BlackWallAnimation.vue`: SFC con las dos capas (fluido khatarsis con import directo + muro canvas 2D), props con defaults exactos, columnas 2x6 con mulberry32, núcleo radial ~x65%, full-bleed sin piso, banding sutil, acople misma-fase/splats-sesgados, puente `pointermove/mousedown` en `window` vía API real (sin inventar), batching 3 fills, `aria-hidden`, `pointer-events-none`.
2. **edit** `src/App.vue`: importar y montar `<black-wall-animation>` como primera capa dentro de `main`, sin tocar nada más.
3. **Verificar formato/lint:** `bun run lint:check` + `bun run format:check`.
4. **Build/dev con autorización aparte** (RULES 0.4): requieren permiso explícito; sin él quedan pendientes.

## Verificacion

- `bun run lint:check` + `bun run format:check` exit 0.
- `bun run build` (autorización aparte): compila; sin dependencias nuevas.
- `bun run dev` (autorización aparte): visual Blackwall (muro vertical + fluido rojo/azul/negro, núcleo ~x65%, sin piso, glitch sutil), reacción al mouse, auto-demo con mouse quieto, fondo fijo al scroll, sin errores, framerate estable.
- Manual: legibilidad, `prefers-reduced-motion`, background pausado, touch drag / tap compensado.

## Revisión del orquestador — pendiente de aprobación a READY

- Cumple lo pedido: import directo, sin shim, sin búsquedas fuera, alcance intacto (1 create + 1 edit).
- No inventa cambios: deltas dentro del mismo alcance/archivos.
- Respeta RULES / CODING_STANDARDS §7 / DESIGN.
- Pasos ejecutables y verificables.
- No marco READY automático: espero tu visto bueno.

## Cierre (memoria persistente)

- Que cambio: Creado `src/components/BlackWallAnimation.vue` (import directo `useFluidSimulation, useCanvasLoop` de `khatarsis`, sin `khatarsis.d.ts`; props con defaults; 2 capas con `pointer-events-none` y `aria-hidden`; muro con columnas 2x6 mulberry32, núcleo ~x65%, full-bleed sin piso, banding sutil, batching 3 fills, puente `pointermove/mousedown` en `window` sin inventar API, `scrimOpacity: 0`). Editado `src/App.vue`: import + `<black-wall-animation>` primero en `main`, resto intacto.
- Verificacion: `bun run lint:check` exit 0; `bun run format:check` exit 0 ("All matched files use Prettier code style!"). Fix watchdog verificado con lint/format en verde. Pendiente por regla 0.4: `bun run build` y `bun run dev` (prueba visual Blackwall, reacción mouse, auto-demo, fondo fijo, legibilidad, reduced-motion) — requieren autorización aparte.
- Resultado: pendiente — no pasa a CLOSED hasta validar build + visual (o aceptación explícita del pendiente) según DoD.
- Pendientes: autorizar `bun run build` y/o `bun run dev`.

## Cierre (memoria persistente) — CLOSED por descarte, 2026-09-08

- Motivo: el usuario descarta el Blackwall ("no se ve nada", decide pasar a LiquidEther de vue-bits). Se cierra sin validación visual.
- Estado final: `src/components/BlackWallAnimation.vue` queda en el repo SIN USAR (prohibido eliminarlo); su retiro de `src/App.vue` pasa al plan `portfolio-liquid-ether-fondo` (paso 1).
- Verificacion: `lint:check` exit 0, `format:check` exit 0. `build`/`dev` no ejecutados (regla 0.4) y ya innecesarios por descarte explícito del usuario.
- Resultado: descartado — DoD parcial (alcance conforme, higiene OK, verificación de calidad verde; validación visual no aplica por descarte).
- Fix post-ejecución (bug "no se ve nada", 2026-09-08): causa probable = `useCanvasLoop` acepta la llamada sin lanzar pero nunca invoca `draw` (firma distinta a la supuesta) → `engineStarted=true` y el fallback propio jamás arranca → muro en blanco. Corrección: watchdog de frames (contador en `draw`; si 0 frames a los 800ms se arranca el loop propio rAF). Sin archivos nuevos, sin deps, mismo alcance.
