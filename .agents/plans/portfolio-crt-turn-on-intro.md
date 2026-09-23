---
name: portfolio-crt-turn-on-intro
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-09 12:00
enriched: 2026-09-09 12:00
executed: 2026-09-09 12:00
---

## Plan Tecnico: Intro CRT turn-on (destello televisores antiguos al cargar)

### Analisis

- **Objetivo:** al entrar a `/`, overlay fullscreen que reproduce el encendido CRT pedido: negro unos frames → línea/destello horizontal blanco central (fiel a la imagen) → expansión vertical al máximo → flash breve + fundido a transparente revelando el contenido. Fiel y suave (60fps, solo `transform`/`opacity`).
- **Scope:** 1 create componente + 1 create composable mínimo + 2 edits mínimos (`App.vue`, `HeroSection.vue`). Sin dependencias nuevas (GSAP ya instalado, ADR-001). Sin tocar fondo faulty-terminal, secciones, datos, router, ni `BlackWallAnimation.vue`.
- **Archivos (re-escaneo repo 2026-09-09, estructura router ya aplicada):**
  - `src/App.vue` — shell delgada: `main` + `<faulty-terminal-background />` + `<router-view />`. Aquí va el overlay (encima de todo).
  - `src/views/MainView.vue` — compone las 6 secciones + `initSmoothScroll()` + `ScrollTrigger.refresh()`. Sin cambios previstos (el overlay es `fixed`, no altera layout/medidas).
  - `src/router/index.ts` — `createWebHistory`, ruta `/` → `MainView`, `scrollBehavior false`. Sin cambios.
  - `src/components/hero/HeroSection.vue` — intro GSAP `[data-hero]` (`set y:40/autoAlpha:0` → `to` delay 0.15s). Es el único punto de coordinación: debe esperar al `done` del CRT o su animación ocurriría tapada.
  - `src/composables/useReveal.ts` — expone `prefersReducedMotion()` (reutilizar, cero duplicación).
  - `src/composables/useSmoothScroll.ts` — Lenis + `gsap.ticker`. Sin cambios (ver riesgos).
  - `package.json` — `gsap ^3.15`, `vue ^3.5`, `vue-router ^5.3`, `lenis`, `tailwindcss ^4.3`, alias `@` ya en `vite.config.ts`. No se añade nada.
- **Riesgos:**
  1. Hero intro tapada (alto): `HeroSection` anima a los ~0.15s y el CRT dura ~1.9s → se coordina vía estado compartido (ver Cambios). Sin esto la intro se pierde.
  2. Scroll durante la intro (medio-bajo): 2s con overlay; se bloquea con `overflow:hidden` en `documentElement` y se restaura al `done`. No se expone `lenis.stop()` para no ampliar alcance; Lenis respeta el lock de overflow en la práctica para este caso corto.
  3. Jank (bajo): solo `transform`/`opacity` + `will-change` en 2 capas; sin `box-shadow` animado (las sombras son estáticas, se anima escala/opacidad), sin blur animado, sin canvas.
  4. Reduced-motion / SSR (bajo): se resuelve con `prefersReducedMotion()` → sin animación, `done` inmediato.

### Fuentes investigadas (fidelidad)

1. **Secuencia canónica turn-off → invertir para turn-on:** gist `frbarbre` (variante Lucas Bebber) `@keyframes turn-off`: `scale(1,1.3)` → `scale(1.3,0.001)` con `brightness(10)` (línea horizontal) → `scale(0,0.0001)` con `brightness(50)` (punto). Nuestro turn-on es el inverso: punto/línea → expansión vertical → fullscreen. Su `turn-on` usa además `brightness(30)` inicial y `contrast(0) brightness(0)` antes de revelar — de ahí el flash + fundido final.
2. **GSAP como motor (prueba de técnica):** CodePen `hodd/pLJPMm` "TV turn off" con `TimelineMax`: `.to(screen,.2,{width:'100vw',height:'2px',background:'#fff'})` → `.to(screen,.2,{width:0,height:0})`. Confirma que el colapso a línea blanca de 2px y su reverso (nuestro caso) se hace limpio con timeline GSAP; usamos `scaleX/scaleY` (GPU) en vez de `width/height` (layout).
3. **Look línea + bloom (tu imagen):** núcleo blanco puro con estela horizontal fina a todo el ancho y caída radial suave a negro. Se replica con 2 capas: línea de 2px (`background:#fff` + `box-shadow` estática multicapa) + blob radial (`radial-gradient(ellipse, #fff → transparent)`). Referencias de glow/flicker: `aleclownes.com/2017/02/01/crt-display.html`, `codescompiler.com/blog/css-crt-tv-effect/`. Deliberadamente SIN scanlines ni RGB-shift: tu imagen es solo destello limpio.
4. **Boot + a11y:** portfolio `AntonLangbruttig/Portfolio` (CRT boot con `requestAnimationFrame`, flicker, fade-in, respeto a reduced-motion). Tomamos el patrón `done` + salida inmediata con reduced-motion; NO tomamos su cache de sesión (tú pediste la animación en cada navegación a la página).

### Cambios

#### 1. `src/components/crt/CrtTurnOnIntro.vue` (create, único componente principal)

SFC autocontenido, orden: imports → props/emits → estado → timeline → template → `<style scoped>`. Ubicación `components/crt/` (dominio propio estilo khatarsis: carpeta kebab, archivo Pascal; no va en `hero/` porque es global del shell, no del hero; no se crea `common/` porque solo lo usa `App.vue`).

- **Props (inmutables, mínimas):** `blackHoldMs?: number = 350`, `durationMs?: number = 1900` (informativa; el timeline manda), `lineHeightPx?: number = 2`. Sin `className`/`style` genéricos.
- **Emits:** `done: []` al terminar (tras el fundido, antes del desmontaje).
- **Plantilla:** root `fixed inset-0 z-50 flex items-center justify-center bg-black` + `aria-hidden="true"`, `ref="root"`; dentro `.crt-stretch` (capa que escala) con `.crt-line` (línea 2px) + `.crt-core` (blob radial). Todo lo visual con medidas en `<style scoped>` (cero `[...]`, cero márgenes, sin tipografía).
- **Timeline GSAP (única animación, sin ScrollTrigger):**
  1. `0.00–0.35s` negro puro (línea `scaleX:0`, glow `opacity:0`).
  2. `0.35–0.60s` línea: `scaleX 0→1` (`power2.out`, 0.25s) + glow `opacity→1`; leve pulso de brillo.
  3. `0.60–0.75s` hold línea + micro-flicker (1 yoyo rápido de `opacity`/`filter:brightness`, amplitud pequeña).
  4. `0.75–1.30s` expansión vertical: wrapper `scaleY 0.002→1` (`power3.inOut`, ~0.55s) con overshoot leve (`1.04→1`), brillo sube (`brightness 1→1.8`).
  5. `1.30–1.45s` flash blanco fullscreen breve.
  6. `1.45–1.90s` fundido overlay `opacity→0` (`power2.out`); `emit('done')` ≈1.60s; al completar, `visibility:hidden` + lock de scroll restaurado; el padre desmonta con `v-if`.
- **Accesibilidad y limpieza:** si `prefersReducedMotion()` → `emit('done')` en `nextTick` sin animar ni bloquear scroll. `pointer-events:none` en capas internas; root captura durante la intro y se desmonta al final (nunca bloquea clics/scroll después). `onBeforeUnmount` mata el timeline. Scroll-lock solo `documentElement.style.overflow` con restauración en `finally`/cleanup.

#### 2. `src/composables/useCrtIntro.ts` (create, helper compartido mínimo)

Singleton reactivo (`isCrtDone = ref(false)`, `markCrtDone()`), justificado por cero-duplicación (RULES 0.6): coordina `App.vue` → `HeroSection.vue` sin prop-drilling a través de `router-view`. Sin lógica de animación aquí.

#### 3. `src/App.vue` (edit, solo shell)

Importar `CrtTurnOnIntro` + `useCrtIntro`; estado local `showCrt = ref(true)` (arranca `!prefersReducedMotion()`; con reduced-motion no se monta); montar `<crt-turn-on-intro v-if="showCrt" @done="showCrt=false; markCrtDone()" />` tras `<router-view />` dentro de `main`. Nada más: clases de `main`, fondo y router intactos.

#### 4. `src/components/hero/HeroSection.vue` (edit mínimo, solo trigger)

Envolver la intro existente: si `isCrtDone` ya es `true` (o reduced-motion) animar como hoy; si no, esperar (`watch(isCrtDone, start, {once:true})`) con fallback timeout (≈3s) por seguridad. No se cambia easing/duración/stagger ni clases; `gsap.set` inicial se mantiene para no mostrar contenido sin animar bajo el overlay.

### Restricciones

- RULES 0.3: un componente principal; el composable es helper compartido permitido (evita duplicar estado/eventos).
- RULES 0.4: sin `dev/build/preview/lint/format` ni `bun add` sin autorización; gestor `bun`; solo scripts reales de `package.json`.
- `CODING_STANDARDS.md` §7: cero márgenes; layout Tailwind estándar + todo lo visual del destello en `<style scoped>`; sin `[...]`; sin width/height fijos en elementos flex; sin tocar tipografía.
- Sin dependencias nuevas; GSAP ya presente. `vue-best-practices` (SFC `<script setup lang="ts">`, props/emits tipados) y `accessibility` (reduced-motion, `aria-hidden`, foco no robado) como referencia subordinada.
- Secuencia innegociable: negro → línea/destello → expansión máxima → fundido que revela. No invertir ni añadir scanlines/RGB/scanline-scroll sin pedirlo.
- `BlackWallAnimation.vue` (en `components/background/`, sin uso) no se toca ni se elimina.

### Steps

1. **create** `src/composables/useCrtIntro.ts`: `isCrtDone` + `markCrtDone()` (tipado, 15 líneas).
2. **create** `src/components/crt/CrtTurnOnIntro.vue`: SFC según Cambios §1 (props con defaults `350/1900/2`, emit `done`, timeline GSAP por fases, `prefersReducedMotion()` con salida inmediata, scroll-lock con restore, cleanup en `onBeforeUnmount`, estilos del destello fieles a la imagen en `<style scoped>`).
3. **edit** `src/App.vue`: importar overlay + composable, `v-if` + handler `done` que desmonta y marca; resto intacto.
4. **edit** `src/components/hero/HeroSection.vue`: gatear la intro existente con `isCrtDone` + fallback 3s; resto intacto.
5. **verificar** `bun run lint:check` + `bun run format:check` (autorización aparte si se consideran bloqueados; si no, inspección segura). `build`/`dev` requieren autorización aparte (regla 0.4).

### Verificacion

- `bun run lint:check` + `bun run format:check` exit 0.
- `bun run build` (autorización aparte): `vue-tsc -b` verde con alias `@` y `vue-router`.
- `bun run dev` (autorización aparte): al cargar `/` → negro ~350ms → línea blanca horizontal con bloom central (como la imagen) → expansión vertical suave al máximo con flash → fundido revelando hero + faulty-terminal; hero anima DESPUÉS del fundido; 60fps sin jank; consola limpia; tras el `done` el overlay no existe (clics/scroll normales); con `prefers-reduced-motion` no hay animación y el contenido sale directo.
- Manual: refresh directo a `/` (history mode en dev) repite la intro; reveals/Lenis/ScrollTrigger intactos; `BlackWallAnimation.vue` sigue sin uso.

## Revision del orquestador — pendiente de aprobacion a READY

- Alcance exacto pedido (overlay CRT + coordinación hero), verificado contra la estructura real post-mudanza (`@/components/*`, `views/MainView.vue`, `router`, alias `@`).
- Sin cambios inventados: 2 creates + 2 edits mínimos; sin deps, sin scanlines, sin tocar fondo/secciones/datos/composables existentes (solo lectura + gate en hero).
- Respeta RULES / CODING_STANDARDS §7 / DESIGN; técnica GSAP+CSS validada con 4 fuentes citadas.
- No marco READY automático: espero tu visto bueno.

## Cierre (memoria persistente)

- Que cambio: creado `src/composables/useCrtIntro.ts` (`isCrtDone` + `markCrtDone`); creado `src/components/crt/CrtTurnOnIntro.vue` (overlay `fixed inset-0 z-50 bg-black`, línea 2px + bloom radial fiel a la imagen en `<style scoped>`, timeline GSAP negro 350ms → línea → flicker → expansión `scaleY` → flash → fundido ~1.9s, emite `done`, `prefersReducedMotion` con salida inmediata, scroll-lock con restore, cleanup); editado `src/App.vue` (monta el overlay tras `router-view`, `v-if` + `done` que desmonta y marca); editado `src/components/hero/HeroSection.vue` (intro `[data-hero]` intacta pero gateada a `isCrtDone` con fallback 3s + cleanup). Desviación mínima justificada: `done` se emite al completar el fundido (no a mitad) para que el desmontaje no corte la animación.
- Verificacion: `bun run lint:check` exit 0; `bun run format:check` exit 0 ("All matched files use Prettier code style!"). `bun run build` (autorizado) FALLA por errores preexistentes fuera del alcance del plan, sin ningún error en los 4 archivos del plan (`CrtTurnOnIntro.vue`, `useCrtIntro.ts`, `App.vue`, `HeroSection.vue` compilan limpio): `TS7016` falta `declare module 'khatarsis'` (en `BlackWallAnimation.vue`, `FaultyTerminalBackground.vue`, `ExperienceSection.vue`, `main.ts`), `TS6133` vars sin usar (`BlackWallAnimation.vue` ×3, `GlitchText.vue` ×1), `TS2769` listener `mousedown` vs `PointerEvent` (`BlackWallAnimation.vue` ×2). Fix post-validación dentro del alcance: faltaba `)` de `onMounted(` + orden de atributos `vue/attributes-order` + colapso prettier (todo en `CrtTurnOnIntro.vue`), verificado en verde tras corregir.
- Resultado: pendiente — no pasa a CLOSED: el build sigue rojo por preexistentes ajenos al plan (requieren decisión aparte: shim `khatarsis.d.ts` y/o fixes en `BlackWallAnimation`/`GlitchText`, fuera de RULES 0.3 de este plan) o aceptación explícita del pendiente según DoD.
- Pendientes: `bun run dev` (prueba visual negro → destello → expansión → fundido + hero posterior + reduced-motion directo); decidir fix de los errores preexistentes del build en otro plan.
