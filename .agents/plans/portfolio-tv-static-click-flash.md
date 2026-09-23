---
name: portfolio-tv-static-click-flash
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-09 22:53
enriched: 2026-09-10
ready: 2026-09-10 (aprobado por usuario con "vale volvamos al plan enriched ejecuta el plan")
executed: 2026-09-10
---

## Plan Tecnico: Flash de estática al hacer click — TvStaticBackground sobre FaultyTerminal (0.5s por click)

### Analisis

- Objetivo: Al hacer `pointerdown` en cualquier parte de la pagina, la capa `TvStaticBackground` sube a `z-10` por encima de `FaultyTerminalBackground` (`z-0`) y del contenido estatico del `router-view` durante 0.5s por click, y luego vuelve a `-z-10`. Comportamiento autocontenido en el propio componente, literal y minimo (el usuario anticipo cambio futuro, sin especulacion).
- Scope: Estrictamente un edit en un unico SFC. 0 cambios en `App.vue`, sin dependencias nuevas, sin archivos nuevos, sin cambios en shaders/motor/loop/props existentes.
- Archivos:
  - `src/components/background/TvStaticBackground.vue` (348 lineas verificadas): unico archivo a editar. `<script setup lang="ts">` con `TvStaticBackgroundProps` (19 props + `withDefaults`), estado no reactivo del motor WebGL khatarsis (`createRenderer`/`createProgram`/`createMesh`/`renderScene`), `container` ref, `handleMouseMove` + `handleVisibility`, `resize`, `frame` con fps-cap 30, `startLoop`, `onMounted` (listeners `pointermove` solo si `mouseReact` + `visibilitychange`, `ResizeObserver`, reduced-motion con frame estatico), `onBeforeUnmount` con cleanup completo. Plantilla linea 347: `<div ref="container" class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />`.
  - `src/App.vue` (45 lineas verificadas, solo lectura de contraste): `main.relative.min-h-screen` monta en orden `<the-navbar />` + `<glitch-cursor />` + `<tv-static-background />` + `<faulty-terminal-background :page-load-animation="false" />` + `<router-view />` + `<crt-turn-on-intro v-if="showCrt" @done>`. No se toca.
  - Referencias leidas: `.agents/RULES.md`, `.agents/CODING_STANDARDS.md`, `.agents/DESIGN.md`, `.agents/AGENTS.md` (Vue 3 Composition API + Tailwind + Vite + TS, gestor bun, khatarsis `k-*`). Skill `vue-best-practices` solo como referencia subordinada.
- Riesgos:
  - Reposo invisible esperado (no regresion): snow en `-z-10` dentro de `main.relative` pinta detras del fondo de `main` y el terminal emite alpha 1.0 opaco. El flash elevado es el unico momento visible. Conservar reposo tal cual.
  - Toggle de `z-index` no debe reiniciar WebGL ni disparar `ResizeObserver` (`inset-0` constante, sin resize). Loop sigue corriendo; flash muestra nieve viva al instante.
  - Riesgo TS6133 (imports/variables sin usar) si el edit deja cabos sueltos. Mitigacion: verificacion estatica de que solo se anade `raiseDuration`/`raised`/`raiseTimer`/`handlePointerDown`.
  - Riesgo Tailwind purge si las clases no aparecen literales. Mitigacion: ternario con literales `'z-10'` / `'-z-10'` en fuente.
  - Riesgo de romper clicks (navegacion/botones/scroll). Mitigacion: listener `{ passive: true }`, jamas `preventDefault`/`stopPropagation`, contenedor siempre `pointer-events-none` + `aria-hidden`.
  - Overlay `CrtTurnOnIntro` (`z-50`) sigue por encima del flash durante la intro (~1.4s al cargar). Irrelevante y correcto; con `prefers-reduced-motion` el flash muestra frame congelado sin iniciar animacion nueva.

### Cambios

- `src/components/background/TvStaticBackground.vue` (edit, unico archivo):
  - Interface `TvStaticBackgroundProps`: anadir `raiseDuration?: number` (unica prop nueva).
  - `withDefaults`: anadir `raiseDuration: 500` (parametriza los 0.5s pedidos). Ninguna otra prop nueva ni cambio de defaults existentes.
  - Estado junto al resto de estado del SFC: `const raised = ref(false)` (import `ref` ya existente) + `let raiseTimer: number | undefined` (modulo del SFC, junto a `rafId`/`running`/etc).
  - Handler English-Only: `handlePointerDown` sin parametros que pone `raised.value = true`, hace `window.clearTimeout(raiseTimer)` y re-arma `raiseTimer = window.setTimeout(() => { raised.value = false }, props.raiseDuration)` (debounce: cada click garantiza 0.5s desde ese instante).
  - `onMounted`: tras listeners existentes, `window.addEventListener('pointerdown', handlePointerDown, { passive: true })` incondicional (el flash aplica siempre).
  - `onBeforeUnmount`: anadir `window.removeEventListener('pointerdown', handlePointerDown)` + `window.clearTimeout(raiseTimer)` junto al cleanup existente (sin listeners/timers huerfanos).
  - Plantilla (unica linea afectada): separar `class="pointer-events-none fixed inset-0"` estatica de `:class="raised ? 'z-10' : '-z-10'"`, manteniendo `ref="container"` y `aria-hidden="true"`. Sin transicion CSS (corte instantaneo fiel a sintonizador analogico).
  - Intacto: shaders, uniforms, motor WebGL, loop, fps-cap, `mouseReact`/`pause`/`visibilitychange`/`ResizeObserver`/reduced-motion y resto del cleanup.
- Resto de `src/`: sin cambios. `App.vue`, `FaultyTerminalBackground.vue`, `CrtTurnOnIntro.vue`, secciones, datos, router, composables: intactos.

### Restricciones

- RULES 0.3 (un componente por requerimiento: toda la logica vive en el SFC, sin subcomponentes/modulos/helpers nuevos; alternativas descartadas: orquestar desde `App.vue` o reestructurar z-index del `router-view`).
- RULES 0.4 (sin `dev`/`build`/`preview`/`lint`/`format` sin autorizacion explicita; gestor bun; solo scripts reales de `.agents/AGENTS.md`: `bun run dev`, `bun run build`, `bun run preview`).
- RULES 0.6 (cero duplicacion: reutilizar motor/listeners/cleanup existentes, no copiar bloques).
- RULES 0.7 (codigo actual: WebGL/shaders intactos, sin APIs deprecated).
- RULES 0.13 + CODING_STANDARDS §2.1 (English-Only: solo `raiseDuration`, `raised`, `raiseTimer`, `handlePointerDown`; sin spanglish; comentarios inline en ingles si se anaden).
- CODING_STANDARDS §1 (orden SFC script→template; estado/logica/efectos en posiciones existentes, no reordenar archivo).
- CODING_STANDARDS §7 (cero margenes `m-*`; cero valores arbitrarios `[...]`; solo utilidades estandar `z-10`/`-z-10` literales; sin tocar tipografia `text-*`/`leading-*`/`tracking-*`; sin `width`/`height` fijos ni `min-w-0`).
- DESIGN (superficie decorativa: `pointer-events-none` + `aria-hidden` en ambos estados; no interferir con Lenis/ScrollTrigger ni router).
- Evento siempre `passive: true`, jamas `preventDefault`/`stopPropagation`.
- Sin dependencias nuevas, sin `watch` de props (politica de la familia: props leidas al montar; `raiseDuration` se lee en el handler via `props`, sin watcher).
- Sin features extra: sin duraciones distintas, sin transiciones, sin toggle manual, sin cambios de opacidad/visibilidad.

### Steps

1. Archivo: `src/components/background/TvStaticBackground.vue` | Accion: `read` | Detalle tecnico: Re-leer SFC completo (interface + `withDefaults` 19 props, bloque `container`/`rafId`/`running`/`lastFrame`/`resizeObserver`/`renderer`/`program`/`mesh`, `handleMouseMove`, `handleVisibility`, `resize`, `frame`, `startLoop`, `onMounted`, `onBeforeUnmount`, plantilla linea 347). Confirmar que coincide con contexto verificado; si hay delta, detener y reportar al orquestador sin editar. | Restricciones aplicables: RULES 0.3 (alcance), solo lectura (RULES 0.4 no aplica a lectura).
2. Archivo: `src/App.vue` | Accion: `read` | Detalle tecnico: Re-leer 45 lineas; confirmar orden `tv-static-background` → `faulty-terminal-background :page-load-animation="false"` → `router-view` → `crt-turn-on-intro v-if="showCrt" @done`, y que `App.vue` no requiere edit. Si el orden o props difieren, detener y reportar. | Restricciones aplicables: RULES 0.3 (0 cambios en `App.vue`); no editar este archivo bajo ningun concepto.
3. Archivo: `src/components/background/TvStaticBackground.vue` | Accion: `edit` | Detalle tecnico: En `<script setup lang="ts">`: (a) anadir a `TvStaticBackgroundProps` la linea `raiseDuration?: number`; (b) anadir a `withDefaults` la entrada `raiseDuration: 500`; (c) junto al estado existente anadir `const raised = ref(false)` (reusar import `ref`) y `let raiseTimer: number | undefined`; (d) anadir funcion `handlePointerDown` que hace `raised.value = true`, `window.clearTimeout(raiseTimer)`, `raiseTimer = window.setTimeout(() => { raised.value = false }, props.raiseDuration)`. No tocar shaders, uniforms, `hexToRgb`, `frame`, `resize`, `startLoop` ni props existentes. | Restricciones aplicables: RULES 0.13 + CODING_STANDARDS §2.1 (English-Only), §1 (orden), §7 (sin estilos aqui); RULES 0.6 (sin duplicacion).
4. Archivo: `src/components/background/TvStaticBackground.vue` | Accion: `edit` | Detalle tecnico: En `onMounted`, tras `document.addEventListener('visibilitychange', handleVisibility)`, anadir `window.addEventListener('pointerdown', handlePointerDown, { passive: true })` incondicional. En `onBeforeUnmount`, junto a los `removeEventListener` existentes, anadir `window.removeEventListener('pointerdown', handlePointerDown)` y `window.clearTimeout(raiseTimer)`. Mantener resto del cleanup byte-identico (cancel rAF, disconnect `ResizeObserver`, remove canvas, `loseContext`, nulls). | Restricciones aplicables: listener siempre `passive`, jamas `preventDefault`/`stopPropagation`; RULES 0.7 (no tocar WebGL); DESIGN (no interferir con scroll/router).
5. Archivo: `src/components/background/TvStaticBackground.vue` | Accion: `edit` | Detalle tecnico: En `<template>`, reemplazar unica linea por `<div ref="container" class="pointer-events-none fixed inset-0" :class="raised ? 'z-10' : '-z-10'" aria-hidden="true" />`. Verificar que ambas clases aparecen como literales para Tailwind, que `pointer-events-none` y `aria-hidden` se conservan en ambos estados, y que no se introduce transicion, margen ni valor arbitrario. | Restricciones aplicables: CODING_STANDARDS §7 (solo `z-10`/`-z-10` estandar, cero margenes, cero `[...]`); DESIGN (decorativa no interactiva/no expuesta a AT).
6. Archivo: `src/components/background/TvStaticBackground.vue` | Accion: `read` (verificacion estatica, sin autorizacion) | Detalle tecnico: Re-leer diff del SFC y confirmar: (a) resto del archivo byte-identico salvo lo listado en steps 3-5; (b) sin imports/variables sin usar (riesgo TS6133); (c) listener `pointerdown` registrado y removido con misma referencia `handlePointerDown`; (d) timer limpiado en unmount; (e) ternario con dos literales estandar. Reportar cualquier desviacion antes de pedir verificaciones bloqueadas. | Restricciones aplicables: RULES 0.4 (esta verificacion no requiere `dev`/`build`/`lint`; si se quiere `lint`/`format`/`dev`, pedir autorizacion explicita primero).

### Verificacion

- Estatica (sin autorizacion): correspondencia exacta con la especificacion de Cambios/Steps 3-5; sin imports/variables sin usar; cleanup completo de listener + timer en `onBeforeUnmount`; plantilla con ternario de dos utilidades estandar literales; `pointer-events-none` + `aria-hidden` intactos; resto del archivo (shaders, motor, loop, fps-cap, reduced-motion) intacto; `App.vue` y resto de `src/` intactos.
- Con autorizacion explicita (RULES 0.4): `bun run lint:check` + `bun run format:check` exit 0 (solo si existen como scripts reales; si no existen, reportar pendiente sin inventar comandos). `bun run dev` unicamente con autorizacion: click en cualquier zona (fondo, texto, boton, enlace) → estatica cubre toda la pantalla sobre terminal y contenido ~0.5s y desaparece sola; clicks rapidos repetidos re-arman el flash (0.5s desde el ultimo click); el click sigue funcionando normal (navegacion/scroll/botones intactos); sin errores en consola; framerate estable; durante intro CRT el overlay `z-50` sigue por encima; con `prefers-reduced-motion` el flash muestra frame congelado.
- Criterios de aceptacion: fidelidad al comportamiento pedido (click → 0.5s encima del faulty → volver debajo), cero cambios en `App.vue`, cero regresiones visuales en reposo, validado contra DESIGN (superficie decorativa no interactiva), CODING_STANDARDS §7 (cero margenes, cero arbitrarios, solo `z-10`/`-z-10`) y RULES 0.3/0.4/0.6/0.7/0.13 (un componente, sin scripts sin permiso, sin duplicacion, WebGL intacto, English-Only). Skill `vue-best-practices` subordinada: no prevalece sobre estandares locales.

## Compuerta

- Plan en estado **`EXECUTED`**. Ejecutado via Executor tras `READY` + frase "ejecuta el plan". Queda pendiente verificacion con scripts bloqueados (RULES 0.4) antes de `CLOSED`.
- `CLOSED` solo con DoD + reviewer.md + entrada de memoria completa.

## Cierre (memoria persistente)

> Completar al cerrar el plan (DoD de `.agents/WORKFLOW.md`). Sin esto no pasa a CLOSED.

- Que cambio: `src/components/background/TvStaticBackground.vue` (unico archivo): prop `raiseDuration` default 500, `raised` + `raiseTimer`, `handlePointerDown` con debounce, listener `pointerdown` passive en `onMounted`, cleanup en `onBeforeUnmount`, plantilla con `:class="raised ? 'z-10' : '-z-10'"`. `App.vue` y resto intactos. Verificado por orquestador contra diff real (363 lineas).
- Verificacion: estatica por lectura OK (sin TS6133, cleanup completo, clases literales, WebGL intacto). Pendiente por regla 0.4 (sin autorizacion): `bun run lint:check`, `bun run format:check`, `bun run dev` (flash 0.5s, re-arme, clicks intactos).
- Resultado: pendiente — permanece `EXECUTED` hasta validacion o aceptacion explicita del pendiente.
- Pendientes: autorizar verificaciones bloqueadas; luego reviewer + DoD para `CLOSED`.

## Fix post-EXECUTED (2026-09-10, bug reportado: handlePointerDown no se ejecuta)

- Causa raiz verificada: shader declara `uniform float iTime` pero usa `uTime` en 3 lineas -> `createProgram` lanza -> `catch` silencioso anula `renderer` y nunca se alcanzan los `addEventListener` (lineas dentro del `try`), incluido el `pointerdown`. Listener jamas registrado.
- Fix previsto (mismo archivo, sin ampliar alcance): (1) renombrar `uTime` -> `iTime` en shader (3 ocurrencias); (2) mover `window.addEventListener('pointerdown', ...)` fuera del `try` para que la conducta UI no dependa de WebGL. Cleanup ya fuera del `try`, intacto.
- Fix aplicado 2026-09-10: `uTime` -> `iTime` en 3 lineas del fragment + listener `pointerdown` fuera del `try` (linea ~337) con `removeEventListener` + `clearTimeout` intactos. Verificacion estatica: 0 matches `uTime` en `src/components/background/`, registro/remocion con misma referencia, `App.vue` intacto. Visual (`dev` click 0.5s) pendiente por regla 0.4.

## Fondo full-bleed (2026-09-10, pedido directo: estatica a pantalla completa, sin forma de TV)

- Pedido: el ruido debe ocupar todo el fondo; el negro debe reducirse porque el area de ruido se expande, no quitando negro. Nunca se pidio simular un TV.
- Causa: el barrel (`curvature: 0.3` en defaults) curva el muestreo y deja fuera de rango los bordes -> negro tube-off enorme.
- Fix aplicado 2026-09-10 (turno 1): default `curvature: 0.3` -> `0` (`TvStaticBackground.vue:173`, unica linea). Revertido a peticion del usuario.
- Fix aplicado 2026-09-10 (turno 2, enfoque FaultyTerminal): default de vuelta a `0.3` + eliminada la rama tube-off (el campo procedural es infinito: fuera de `[0,1]` sigue habiendo ruido, sin negro). Misma matematica de barrel que `FaultyTerminalBackground.vue:211-216`, transicion entre ambos sin salto. Verificacion estatica OK; visual pendiente por regla 0.4.
