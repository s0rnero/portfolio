---
name: portfolio-tv-static-fondo
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-09 20:19
enriched: 2026-09-09 20:54
approved: 2026-09-09 22:06
executed: 2026-09-09 22:06
---

# Plan Técnico: TvStaticBackground.vue — ruido de TV analógico (snow) con distorsión CRT

## Análisis (enrichment)

- **Objetivo:** crear `src/components/background/TvStaticBackground.vue`: snow (ruido de TV sin señal) animado y fiel al fenómeno real, con distorsión CRT completa (curvatura de barril, jitter de línea, RGB shift, scanlines, viñeta, flicker, entrelazado), todo con props. **Montaje (enmienda del usuario):** junto a `FaultyTerminalBackground` en `App.vue`, con z-index menor (debajo de él).
- **Scope:** 1 create (`TvStaticBackground.vue`) + 1 edit (`App.vue`, enmienda del usuario), 0 dependencias. Motor = minimotor khatarsis (ya usado por `FaultyTerminalBackground.vue`).

## Enmienda del usuario (2026-09-09 22:06) — compuertas recibidas

- **"apruebo el plan"** → revisión del orquestador superada; transición `ENRICHED -> READY`.
- **"ejecuta el plan"** → autorizada la transición `READY -> EXECUTED` vía Executor (rol asumido por el orquestador en sesión única).
- **Enmienda de alcance:** "la animación agrégala al lado de faulty terminal pero esta tendrá un z-index menor a la de faultyterminal por ahora, ya te diré después por qué". Sustituye la decisión previa "no se monta":
  - `App.vue` (edit): importar `TvStaticBackground` y montar `<tv-static-background />` junto a `<faulty-terminal-background :page-load-animation="false" />`, declarado antes de él (capa inferior).
  - Clase raíz del componente: `pointer-events-none fixed inset-0 -z-10` — z-index `-10` (utilidad estándar Tailwind, sin valores arbitrarios), menor que el `z-0` de FaultyTerminal.
  - **Observación registrada (no bloquea):** el shader de FaultyTerminal emite alpha 1.0 (superficie opaca), por lo que el snow quedará ocluido donde el terminal pinte opaco. Se monta tal cual lo pidió el usuario, a la espera del motivo que anunciará (posible ajuste futuro fuera de este plan).
- **Archivos leídos en enrichment (2026-09-09):** `FaultyTerminalBackground.vue` (arquitectura de motor completa: vertex/fragment ES 1.00 `attribute/varying/gl_FragColor`, `createRenderer({dpr})`, `createProgram(gl, {vertex, fragment, uniforms})`, `setUniform`, `createMesh(gl, {geometry: createFullscreenTriangle(gl), program})`, `renderScene(gl, mesh)`, `hexToRgb`, loop rAF con flag `running`, `visibilitychange`, `ResizeObserver` + `resize()`, mouse suavizado en `window`, reduced-motion con render estático único, cleanup con `removeChild` + `loseContext`); `useReveal.ts` (exporta `prefersReducedMotion()` reutilizable).
- **Riesgos:**
  1. **vue-tsc compila el archivo aunque no esté montado** (precedente: `BlackWallAnimation.vue` tiene TS6133 preexistentes): el SFC nuevo debe quedar limpio de tipos/imports sin usar para no añadir errores al build.
  2. **Hash con `sin()` en mediump** pierde precisión con coordenadas grandes → se usa hash de la familia `fract/dot` (sin `sin`), como ya hacen `FaultyTerminalBackground` y `CRTWarp`.
  3. **`hexToRgb` duplicado**: `FaultyTerminalBackground` lo tiene privado; extraerlo a un helper compartido tocaría un archivo fuera de alcance. Se mantiene local (patrón de familia) y se deja flagueado como refactor candidato cuando se toque FaultyTerminal. `prefersReducedMotion` SÍ se importa de `@/composables/useReveal` (cero duplicación real).
  4. **Curvatura recorta esquinas** (out-of-range del UV curvado): se pinta negro (tubo apagado), intencional y fiel; default `curvature 0.12` mantiene las esquinas casi completas.
  5. **[Superado por la enmienda]** el componente ahora sí se monta (debajo de FaultyTerminal), por lo que la prueba visual en `dev` es directa cuando se autorice.

## Fuentes y criterios de fidelidad (investigación 2026-09-09)

1. **Wikipedia — Noise (video):** patrón aleatorio de puntos sin señal; fuentes térmicas + atmosféricas (Fondo Cósmico); "random flicker of dots/snow"; dos polaridades culturales (snow claro sobre oscuro / hormigas sobre blanco); "lluvia" en español.
2. **Eggert et al. 2026 (IOVS 67(10):32, PMC13489210):** el snow real se caracteriza como elementos **pequeños (~2.2 arcmin), dispersos, flicker rápido (~15 Hz), polaridad mixta** (claros Y oscuros sobre fondo medio).
3. **The Book of Shaders cap. 11 + Ronja's Tutorials (White Noise):** hash canónico, grano por celdas con `floor()`, campos de ruido por frame.
4. **react-bits `CRTWarp`** (misma familia vue-bits que ya portamos 2 veces): técnica verificada de `crtCurve` (barril con radio seguro), grano por frame con `fract(uTime)`, RGB shift por canales, viñeta radial, tope de fps (30). No se copia código; técnica y contraste de defaults.
5. **Shadertoy Mt2XDV "Distorted TV (Fast)"**: noise + distorsión como patrón establecido del efecto completo.

Criterios derivados: granos pequeños densos con zonas grises intermedias (no checkerboard B/N puro); refresco de campo a ~15–30 Hz; polaridad mixta; jitter horizontal por línea (desincronía H); entrelazado par/impar sutil; curvatura + RGB shift + scanlines + viñeta + flicker lento de alto voltaje.

## Cambios (especificación técnica por archivo)

### `src/components/background/TvStaticBackground.vue` (create, único archivo)

SFC `<script setup lang="ts">` espejo de la familia de fondos del repo. Orden: comentario de fuentes → imports → shaders → tipos/props → estado → funciones → ciclo de vida.

**Comentario de cabecera:** código original; técnica citada (Book of Shaders / Ronja para el hash y el grano; CRTWarp-Shadertoy para el pipeline CRT); monocromo por fidelidad.

**Vertex shader (ES 1.00, idéntico en contrato al de FaultyTerminal):**

```glsl
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
```

**Fragment shader (ES 1.00, `precision mediump float;`) — pipeline en orden exacto:**

1. **Barril CRT:** `vec2 c = uv * 2.0 - 1.0; float r2 = dot(c, c); c *= 1.0 + uCurvature * r2; vec2 cuv = c * 0.5 + 0.5;` Si `cuv` sale de `[0,1]` → negro (tubo apagado en esquinas). Todas las muestras posteriores usan `cuv`.
2. **Jitter por línea (desincronía H):** `float lineIdx = floor(cuv.y * uScanlineFrequency); cuv.x += (hash21(vec2(lineIdx, seed)) - 0.5) * 2.0 * uLineJitter;`
3. **Campo de nieve** `float snow(vec2 p, float channel)`:
   - Aspecto corregido: `vec2 q = p * vec2(iResolution.z, 1.0);`
   - Celda: `vec2 cell = floor(q * uGrainScale);`
   - **Semilla temporal cuantizada + entrelazado:** `float seed = floor(uTime * uGrainSpeed); if (uInterlace > 0.5) seed += mod(cell.y, 2.0) * 0.5;` (líneas pares refrescan en pasos enteros, impares a medio paso — shimmer de campos alternos).
   - **Hash sin `sin`:** `float hash21(vec2 p) { p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }` (misma familia fract/dot que los shaders existentes; constantes propias, código original).
   - **Luminancia con densidad y polaridad mixta:**
     ```glsl
     float g = hash21(cell + vec2(seed * 0.618, seed * 0.382));
     float c01 = (g - 0.5) * 2.0;                       // -1..1
     float dead = 1.0 - uDensity;                        // zona gris central
     float s = sign(c01) * max(0.0, (abs(c01) - dead) / max(uDensity, 0.0001));
     float v = 0.5 + s * uContrast * 0.5;                // 0=negro .. 0.5=gris .. 1=blanco
     ```
     `density=1` → nieve completa B/N; `density` bajo → mayoría gris con granos dispersos (estudio IOVS).
   - **Mouse (interferencia de antena):** si `uUseMouse > 0.5`, `v += exp(-dist(q, uMouse * vec2(iResolution.z, 1.0)) * 6.0) * uMouseStrength * 0.35;`
   - `return clamp(v, 0.0, 1.0);`
4. **RGB shift (convergencia):** `col.r = snow(cuv + vec2(uRgbShift, 0.0)); col.g = snow(cuv); col.b = snow(cuv - vec2(uRgbShift, 0.0));` (fringes de color sutiles sobre campo monocromo, fiel al desajuste de cañones).
5. **Scanlines (sobre el UV curvado):** `col *= 1.0 - uScanlineStrength * (0.5 + 0.5 * cos(cuv.y * PI * uScanlineFrequency));` con `#define PI 3.141592653589793`.
6. **Viñeta:** `float edge = 1.0 - dot(uv - 0.5, uv - 0.5) * 2.5; col *= mix(1.0, smoothstep(0.0, 1.0, clamp(edge, 0.0, 1.0)), uVignette);`
7. **Flicker global (fuente de alto voltaje):** `float fl = 1.0 - uFlicker * (0.5 + 0.5 * sin(uTime * 8.0 + sin(uTime * 1.7) * 3.0)); col *= fl * uBrightness;`

**Props (interface `TvStaticBackgroundProps`, inmutables, defaults fieles):**

| Prop | Tipo | Default | Significado |
| --- | --- | --- | --- |
| `grainScale` | number | `420` | celdas de grano por unidad de alto (~4–5 px en 1080p; fiel a granos pequeños) |
| `grainSpeed` | number | `15` | Hz de refresco del campo (Eggert et al.) |
| `density` | number | `0.75` | fracción de granos que se apartan del gris (polaridad mixta) |
| `contrast` | number | `0.85` | profundidad B/N de los granos |
| `brightness` | number | `1` | brillo global |
| `curvature` | number | `0.12` | curvatura de barril (esquinas fuera de rango → negro) |
| `lineJitter` | number | `0.0025` | desincronización horizontal por línea (uv) |
| `rgbShift` | number | `0.0012` | error de convergencia RGB (uv) |
| `scanlineStrength` | number | `0.15` | profundidad de scanlines |
| `scanlineFrequency` | number | `400` | líneas del tubo (480 NTSC visible ≈ 400) |
| `vignette` | number | `0.35` | caída de fósforo en bordes |
| `flicker` | number | `0.06` | oscilación lenta de brillo |
| `tint` | string | `'#ffffff'` | tinte (blanco = mono fiel al snow real) |
| `interlace` | boolean | `true` | refresco alternado por campos par/impar |
| `mouseReact` | boolean | `false` | reactividad al mouse (default apagado: el snow real no reacciona) |
| `mouseStrength` | number | `0.3` | intensidad de la interferencia del mouse |
| `pause` | boolean | `false` | congela el campo (frame estático) |
| `fps` | number | `30` | tope de fps (snow real ~25–30 campos/s; técnica CRTWarp) |
| `dpr` | number | `min(devicePixelRatio, 2)` | igual que FaultyTerminal |

**Motor (espejo de `FaultyTerminalBackground.vue`, mismas responsabilidades):** `hexToRgb` local (tint → `uTint` vec3); `container` ref; estado `rafId/running/resizeObserver/renderer/program/mesh/frozenTime`; `timeOffset = Math.random() * 100` (variación por carga); mouse en `window` con suavizado 0.08 y `uMouse`/`uUseMouse`; `handleVisibility` (pausa en `document.hidden`, reanuda si !reduced && !pause); `resize()` con `iResolution = [w, h, w/h]`; **tope de fps por acumulador** (`if (now - last < 1000 / fps) return` antes de render, patrón CRTWarp adaptado); reduced-motion o `pause` → un solo `renderScene` estático (seed 0) sin loop; cleanup completo (`cancelAnimationFrame`, `disconnect`, `removeEventListener` ×2, `removeChild` condicional, `loseContext`, reset de refs). `prefersReducedMotion` **importada de `@/composables/useReveal`** (no duplicada). Uniforms iniciales desde props; los props se leen una vez al montar (misma política "sin watch deep" de la familia).

**Plantilla:** `<div ref="container" class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />` (enmienda: `-z-10`, menor que el `z-0` de FaultyTerminal) — **sin `backdrop-blur-xs`** (se evita la superficie de composición detectada como problema en el plan CRT activo). Sin márgenes, sin `[...]`, sin tipografía (Standards §7).

**Rendimiento:** 1 triángulo fullscreen; 3 evaluaciones de hash por píxel (~3× más barato que `digit()` de FaultyTerminal con sus 9 taps + fbm); pausa con pestaña oculta y fps-cap 30.

### Edits de aplicación (enmienda del usuario)

- **`src/App.vue` (edit, mínimo):** añadir `import TvStaticBackground from '@/components/background/TvStaticBackground.vue'` y montar `<tv-static-background />` en la plantilla, justo antes de `<faulty-terminal-background :page-load-animation="false" />` (el snow queda debajo por su `-z-10` vs `z-0`). Nada más: resto del shell intacto (`router-view`, CRT overlay, clases de `main`).
- Resto de `src/` intacto.

## Restricciones

- `CODING_STANDARDS.md` §7: cero márgenes; clases utilitarias fijas estándar; cero valores arbitrarios `[...]`; sin tocar tipografía.
- `RULES.md` 0.3 (un componente principal), 0.4 (sin dev/build/preview/lint/format ni `bun add` sin autorización; gestor bun; solo scripts reales de `package.json`), 0.6 (reutilizar `prefersReducedMotion`; motor espejo sin módulos nuevos), 0.7 (WebGL1/ES 1.00 como los shaders existentes — no inventar APIs), 0.8 (sin secretos).
- `DESIGN.md`: superficie `pointer-events-none` + `aria-hidden`; no interfiere con Lenis/ScrollTrigger; fallback silencioso sin WebGL2 (try/catch → refs null).
- No tocar `FaultyTerminalBackground.vue`, `CrtTurnOnIntro.vue`, secciones, datos, router, composables, `BlackWallAnimation.vue`.
- Skills subordinadas (`vue-best-practices`, `tailwind-css-patterns`, `vite`): SFC Composition API tipado, props con `withDefaults`, orden de código; prevalece el estándar local.

## Steps (ejecutables)

1. **read** (Executor): re-leer `FaultyTerminalBackground.vue`, `useReveal.ts` y este plan; confirmar que las APIs de khatarsis y los nombres no cambiaron.
2. **create** `src/components/background/TvStaticBackground.vue`: según la especificación de Cambios (props tabla, shaders, motor espejo, fps-cap, reduced-motion estático, cleanup completo, plantilla sin blur).
3. **verificar** estático: revisar que no queden imports sin usar (riesgo TS6133), que los uniforms del shader coincidan 1:1 con los `setUniform`/valores iniciales, y que el archivo no dependa de nada nuevo.
4. **verificar** `bun run lint:check` + `bun run format:check` (autorización aparte si se consideran bloqueados).
5. **verificar build/visual** solo con autorización explícita: `bun run build` (sin errores NUEVOS en este archivo; los 10 preexistentes documentados quedan fuera de alcance) y prueba visual con montaje temporal pactado (ver Verificación).
6. **reviewer + DoD**: checklist de `.agents/subagents/reviewer.md`, memoria de cierre, `CLOSED` solo si el DoD queda completo.

## Verificación

- **Estática (sin autorización):** correspondencia uniforms↔props; sin imports sin usar; hash sin `sin()`; pipeline en el orden especificado; plantilla sin `backdrop-blur-xs`; cleanup completo.
- **Scripts reales, con autorización:**
  - `bun run lint:check` + `bun run format:check` → exit 0.
  - `bun run build` → `vue-tsc -b` no añade errores nuevos en `TvStaticBackground.vue`.
  - `bun run dev` → prueba visual: snow B/N/gris granulado refrescándose (~15–30 Hz), flicker, jitter de líneas, curvatura con esquinas negras suaves, fringes RGB sutiles, scanlines, viñeta; sin jank; consola limpia; con reduced-motion un frame estático.
  - **Montado (enmienda):** la prueba visual en `dev` es directa: el snow debe verse como capa inferior (bajo el terminal, que es opaco hoy); validar consola limpia y que scroll/clics no cambien.
- **Criterios de aceptación visuales:** fidelidad al snow real (granos pequeños, polaridad mixta, refresco rápido), distorsión visible pero no invasiva con defaults, sin conflictos con scroll/clics.

## Revisión crítica del orquestador — estado `ENRICHED`

- Cumple exactamente lo pedido: snow animado super fiel (criterios del estudio IOVS + Wikipedia) + distorsión CRT completa con props.
- Sin cambios inventados: 1 create + 1 edit mínimo (App.vue, enmienda del usuario), 0 deps; no toca nada más.
- Respeta RULES (0.3/0.4/0.6/0.7/0.8), CODING_STANDARDS §7 y DESIGN; reutiliza `prefersReducedMotion` y el patrón de motor probado.
- Técnica verificada con fuentes citadas; hash robusto en mediump; riesgo vue-tsc mitigado por diseño del archivo.
- Compuertas recibidas (2026-09-09 22:06): "apruebo el plan" + "ejecuta el plan" + enmienda de montaje con z-index menor documentada arriba. Plan **aprobado a `READY`**; la ejecución procede según los Steps.

## Cierre (memoria persistente)

> Completar al cerrar el plan (DoD de `.agents/WORKFLOW.md`). Sin esto no pasa a CLOSED.

- Registro de ejecución (2026-09-09, Executor): creado `src/components/background/TvStaticBackground.vue` (348 líneas) según la especificación completa — shader snow con hash fract/dot, semilla cuantizada a `grainSpeed` Hz, polaridad mixta por `density`, entrelazado por campo, pipeline CRT (barril con negro fuera de rango, jitter por línea, RGB shift, scanlines, viñeta, flicker), 19 props con defaults de la tabla, motor espejo de FaultyTerminal (fps-cap 30, visibilitychange, reduced-motion estático, cleanup completo con loseContext), plantilla `pointer-events-none fixed inset-0 -z-10`. Editado `src/App.vue` (enmienda del usuario): `<tv-static-background />` montado antes de `<faulty-terminal-background :page-load-animation="false" />`. Verificación estática aprobada: uniforms 1:1, sin imports/vars sin usar, pipeline en orden.
- Observaciones registradas (no bloquean, a decisión del usuario): (1) el shader de FaultyTerminal emite alpha 1.0 (superficie opaca) → el snow queda ocluido donde el terminal pinta; (2) al ser `-z-10` (negativo) dentro de `main.relative` sin z-index propio (no crea stacking context), la capa del snow pinta DETRÁS del fondo `bg-neutral-950` de `main` (comportamiento estándar de z-index negativo). Ambas consecuentes de la instrucción literal del usuario ("z-index menor... ya te diré después por qué"): se implementó tal cual, sin desviaciones.
- Que cambio: [completar al cerrar]
- Verificacion: [comandos ejecutados y resultado, o pendientes con motivo]
- Resultado: [aprobado / no necesario / pendiente aceptado explicitamente]
- Pendientes: [si existen]
