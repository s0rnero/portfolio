---
name: portfolio-crt-intro-fluidez
status: EXECUTED
type: bugfix
domain: portfolio
owner_rules: .agents
created: 2026-09-09 12:00
enriched: 2026-09-09 12:00
executed: 2026-09-09 12:00
---

## Plan Tecnico: Correcciones de fluidez intro CRT (pausa en línea + destello fondo/hero)

### Analisis

- **Objetivo:** dos fixes sobre la intro CRT (`portfolio-crt-turn-on-intro`, EXECUTED): (1) eliminar la detención percibida en el frame de línea horizontal; (2) eliminar el corte tras el reveal (fondo faulty-terminal destellando solo + texto del hero entrando después, en dos tiempos).
- **Scope:** 0 creates, 4 edits mínimos (`CrtTurnOnIntro.vue`, `useCrtIntro.ts`, `App.vue`, `HeroSection.vue`). `FaultyTerminalBackground.vue` solo lectura: se gobierna vía sus props públicas desde `App.vue`, sin tocar su interior. Sin dependencias nuevas, sin componentes nuevos.
- **Archivos (verificados 2026-09-09):**
  - `src/components/crt/CrtTurnOnIntro.vue:42-70` — timeline actual medido (con `blackHold=0.35`): línea `scaleX` termina 0.60s; flicker aislado 0.67→0.79s; expansión `scaleY power3.inOut` arranca 0.80s; flash 1.35→1.47s; fundido 1.47→1.92s; `done` al completar.
  - `src/composables/useCrtIntro.ts` — `isCrtDone` + `markCrtDone()` (se conserva intacto).
  - `src/App.vue` — shell con `<faulty-terminal-background />` (defaults) + overlay con `@done`.
  - `src/components/hero/HeroSection.vue:13-45` — intro gateada a `isCrtDone` + delay interno 0.15s + fallback 3s.
  - `src/components/background/FaultyTerminalBackground.vue:269,281,335-348,367-424` — `pageLoadAnimation: true` por defecto: `uPageLoadProgress` 0→1 en 2000ms desde su mount; loop `iTime` vivo.
- **Riesgos:**
  1. Regresión del look aprobado (bajo): el fix solo re-tiempea y solapa; plantilla, estilos del destello, props y secuencia intactos.
  2. `pause` reactivo del fondo (verificado: NO sirve) — `frame()` congela `iTime` con `pause` pero el progreso de load avanza igual (L345-348), y no hay watcher que (re)arranque el loop si se monta pausado (L412-418). Decisión: no usar `pause`; usar `:page-load-animation="false"`.
  3. Doble `reveal` (bajo): mitigado con flag `revealed` + `markCrtRevealed` idempotente.
  4. Reduced-motion (bajo): `finish()` emite ambas señales en la vía inmediata; `App.vue` no monta el overlay y marca ambas.

### Causas verificadas

1. **Pausa en la línea (confirmada):** hueco 0.60→0.80s casi sin movimiento (flicker de solo `opacity` del core) + arranque muerto de `power3.inOut` (~primer tercio del expand 0.80→1.00s apenas deforma la línea) = ~0.4s de frame congelado, justo el frame de la imagen del reporte.
2. **Destello fondo + texto en dos tiempos (confirmada, doble causa):** (a) el load de 2s del terminal termina (~2.0s) pegado al reveal (~1.9s): su cola de encendido por celdas + nuestro flash blanco decayendo = doble flash; (b) el hero arranca en `done` con +0.15s de delay interno: el fondo queda solo en pantalla primero y el texto entra después = pop en dos tiempos.

### Cambios

#### 1. `src/components/crt/CrtTurnOnIntro.vue` (edit, solo `<script setup>`)

- Defaults: `blackHoldMs = 300` (antes 350); `durationMs = 1400` (antes 1900); base de `timeScale` 1900→1380.
- Nuevo timeline (posiciones relativas a `blackHold` B=0.30s):
  | Fase | Acción | Inicio | Duración |
  |---|---|---|---|
  | Línea | `line scaleX 0→1`, `power2.out` | B | 0.22 (termina 0.52) |
  | Glow | `core opacity →1`, `power1.out` | B+0.03 | 0.15 |
  | Pulso | `core opacity →0.55` + vuelta `→1` | B+0.12 / B+0.17 | 0.05 + 0.07 (solapado con la línea) |
  | Expansión | `stretch scaleY 0.004→1`, `power2.inOut` | B+0.20 (=0.50, la línea aún se dibuja) | 0.45 (termina 0.95) |
  | Flash | `flash opacity →1`, `power1.in` + `call(doReveal)` misma posición | B+0.65 (=0.95) | 0.10 |
  | Fundido | `root opacity →0`, `power2.out` | B+0.73 (=1.03) | 0.35 (termina ~1.38, `onComplete: finish`) |
- Señales: `defineEmits<{ reveal: []; done: [] }>()`; flag `revealed` + `doReveal()` (emite una sola vez); `timeline.call(doReveal, [], flashPos)`; `finish()` invoca `doReveal()` primero (cubre reduced-motion y fallbacks) y conserva su limpieza + `done`.
- `set` inicial de `stretch` pasa a `scaleY: 0.004`. Plantilla y `<style scoped>` intactos.

#### 2. `src/composables/useCrtIntro.ts` (edit, +4 líneas)

- Añadir `isCrtRevealed = ref(false)` + `markCrtRevealed()` + export; `isCrtDone`/`markCrtDone` intactos.

#### 3. `src/App.vue` (edit, 2 bindings)

- `<faulty-terminal-background :page-load-animation="false" />` → fondo en estado estable desde el primer frame (su flicker/glitch vivo sigue; solo se elimina el boot de 2s, invisible tras el overlay de todos modos).
- `<crt-turn-on-intro v-if="showCrt" @reveal="markCrtRevealed" @done="handleCrtDone" />` + import de `markCrtRevealed`; si reduced-motion, marcar ambas (`markCrtRevealed()` junto al `markCrtDone()` existente).

#### 4. `src/components/hero/HeroSection.vue` (edit, solo el gate)

- Sustituir `isCrtDone` por `isCrtRevealed` en el `if` inicial, el `watch` y el fallback (el timeout de 3s y su cleanup intactos); easing/duración/stagger/delay 0.15s intactos. El hero entra mientras el velo se levanta, no después.

### Restricciones

- RULES 0.3: cero archivos nuevos; 4 edits mínimos dentro del alcance del bug.
- RULES 0.4: sin `dev/build/preview/lint/format` sin autorización aparte; `bun`; solo scripts reales.
- `CODING_STANDARDS.md` §7: sin cambios de plantilla/estilos/tipografía/márgenes; todo el fix es script + bindings.
- Interior de `FaultyTerminalBackground.vue` intocable (solo props públicas).
- Skills subordinadas: `vue-best-practices` (emits tipados, orden SFC), `accessibility` (ambas señales inmediatas con reduced-motion). Prevalece el estándar local.
- Validado contra `.agents/DESIGN.md` (sin cambios de arquitectura) y `.agents/RULES.md` (0.2 sin borrados, 0.6 el helper compartido ya existe y solo crece, 0.8 sin secretos).

### Steps

1. **edit** `src/components/crt/CrtTurnOnIntro.vue`: defaults (`blackHoldMs 300`, `durationMs 1400`, base `timeScale` 1380), `scaleY` inicial `0.004`, timeline según tabla, `reveal` en emits + `doReveal()` con flag + `call` en el flash + `doReveal()` al inicio de `finish()`.
2. **edit** `src/composables/useCrtIntro.ts`: `isCrtRevealed` + `markCrtRevealed()` + export.
3. **edit** `src/App.vue`: `:page-load-animation="false"` al fondo; `@reveal="markCrtRevealed"` al overlay (+ import); marcar ambas señales en la vía reduced-motion.
4. **edit** `src/components/hero/HeroSection.vue`: gate a `isCrtRevealed` (import, `if`, `watch`, fallback); resto intacto.
5. **verificar** `bun run lint:check` + `bun run format:check` (autorización aparte si se consideran bloqueados). `build`/`dev` requieren autorización aparte (regla 0.4).

### Verificacion

- `bun run lint:check` + `bun run format:check` exit 0.
- `bun run build` (autorización aparte): sin errores NUEVOS (persisten los 9 preexistentes ajenos, documentados en `portfolio-crt-turn-on-intro`).
- `bun run dev` (autorización aparte): la línea fluye sin detenerse (expansión continua desde ~0.50s, total ~1.4s); al levantarse el velo el fondo ya está estable (sin flash propio) y el texto entra solapado con el fundido (sin pop en dos tiempos); reduced-motion intacto.
- Manual: sin jank, sin fugas de scroll/clics tras `done`, reveals/Lenis intactos.

## Revision del orquestador — pendiente de aprobacion a READY

- Causas medidas en código (no inferidas): hueco 0.60→0.80s + `power3.inOut` muerto; load 2s del fondo colisionando con el reveal + hero en `done`+0.15s.
- Alcance mínimo (4 edits, 0 creates, 0 deps, interior del fondo intacto); decisión `page-load-animation=false` justificada con la verificación de `pause` (L315,345,412).
- Respeta RULES / CODING_STANDARDS §7 / DESIGN.
- No marco READY automático: espero tu visto bueno.

## Cierre (memoria persistente)

- Que cambio: [resumen real]
- Verificacion: [comando ejecutado y resultado, o pendiente con motivo]
- Resultado: [aprobado / no necesario / pendiente aceptado explicitamente]
- Pendientes: [si existen]
