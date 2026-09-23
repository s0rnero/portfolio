---
name: portfolio-navbar-crt-renames-glitch-audit
status: CLOSED
type: refactor
domain: portfolio
owner_rules: .agents
created: 2026-09-10 12:00
enriched: 2026-09-10
ready: 2026-09-10 (revision orquestador: cumple lo pedido literal, sin inventos, sin borrar origenes)
executed: 2026-09-10
closed: 2026-09-10 (DoD: alcance conforme, higiene OK, verificacion scripts pendiente aceptada por el usuario)
---

# Plan: Renames Navbar / Crt + cursor theme/ciclos + hero blur tras flash CRT

> Solicitud del usuario (2026-09-10): (1) renombrar componente navbar de `TheNavbar` a `Navbar` unicamente; (2) renombrar `CrtTurnOnIntro` a `Crt` unicamente; (3) explicar que es CRT (respondido: Cathode Ray Tube, efecto turn-on); (4) auditar de nuevo el efecto glitch y convertir el `.ani` a HTML/CSS lo mas fiel posible — confirmado: es `Glitch Cursor 1.ani` en raiz del repo. Los renames aun NO se ejecutan: primero lectura/contexto (este plan queda en PENDING).
>
> Enmienda del usuario (2026-09-10, solo registrada, NO ejecutada): (a) cursor glitch theme-aware — negro en dark mode, blanco en light mode; (b) glitch del cursor monocromo (mismo color del cursor, fuera azul/rojo); (c) glitch del cursor activo 3s cada 10s; (d) `GlitchText` activo 4s cada 8s. Ver detalle en "Enmienda: cursor theme-aware + ciclos".

## Objetivo

- `src/components/layout/TheNavbar.vue` pasa a llamarse `Navbar` (archivo + simbolo + usages), sin cambiar logica ni estilos.
- `src/components/crt/CrtTurnOnIntro.vue` pasa a llamarse `Crt` (archivo + simbolo + usages + interface de props), sin cambiar la secuencia visual aprobada.
- Responder que es CRT (pregunta informativa, fuera del ciclo de estados).
- Hero tras el flash: los textos del hero animan JUSTO DESPUES de que desaparece el flash CRT (hoy la intro corre oculta tras el overlay y el texto ya sale visible sin efecto). Efecto pedido: blur que se aclara (blur -> nitido) via GSAP al recibir `done` del CRT. La auditoria `.ani` queda CANCELADA (usuario 2026-09-10: el cursor gusta como esta).

## Alcance

- Archivos afectados (verificado por grep 2026-09-10):
  - `src/components/layout/TheNavbar.vue` (origen) -> `src/components/layout/Navbar.vue` (destino).
  - `src/components/crt/CrtTurnOnIntro.vue` (origen) -> `src/components/crt/Crt.vue` (destino). Incluye `interface CrtTurnOnIntroProps` (L6/L12) -> `CrtProps`.
  - `src/App.vue` (edit): `import TheNavbar from '@/components/layout/TheNavbar.vue'`, `import CrtTurnOnIntro from '@/components/crt/CrtTurnOnIntro.vue'`, `<the-navbar />`, `<crt-turn-on-intro v-if="showCrt" @done="handleCrtDone" />` (el `@reveal` ya se retiro en la iteracion 2 del plan navbar-theme-i18n).
- Hero blur tras flash (diseno en enrichment, sin edits aun):
  - `src/components/hero/HeroSection.vue` (edit: intro gateada a `isCrtDone` + blur; ver Enmienda 2).
  - `src/composables/useCrtIntro.ts` + `src/components/crt/CrtTurnOnIntro.vue` (solo lectura: contrato unico `done` ya verificado).
- Ajustes de glitch (solo lectura/diseno en enrichment, sin edits aun):
  - `src/components/cursor/GlitchCursor.vue` (rewrite actual: flecha 24px, hotspot en punta, splits rojo/cian, rafagas en loop 2.4s siempre activo) -> theme-aware + monocromo + ciclo 3s/10s (ver Enmienda).
  - `src/components/hero/GlitchText.vue` (actual: `ACTIVE_MS = 2000`, `PAUSE_MS = 10000`, hover continuo con reinicio) -> `ACTIVE_MS = 4000`, `PAUSE_MS = 8000` (4s ejecucion + 8s pausa, misma mecanica de hover).
  - `Glitch Cursor 1.ani` (raiz del repo): referencia historica; auditoria de conversion CANCELADA por el usuario (el cursor gusta como esta).
- Fuera de alcance:
  - No cambiar logica, estilos, props, animaciones ni rutas fuera de lo listado; los renames son solo renames.
  - No tocar `GlitchCursor.vue`, `GlitchText.vue` ni `HeroSection.vue` hasta la compuerta "ejecuta el plan".
  - No resucitar el emit `reveal` ni `isCrtRevealed` (contrato unico `done`).
  - No tocar el plan `portfolio-navbar-theme-i18n` (`EXECUTED` iteracion 2) fuera de sus compuertas.
  - No eliminar el `.ani` ni los origenes `.vue` sin aprobacion explicita (RULES 0.2).

## Enmienda: cursor theme-aware + ciclos (2026-09-10, PENDING sin ejecutar)

- **Cursor theme-aware (espec corregida 2026-09-10):** flecha BLANCA en dark mode, NEGRA en light mode. Fuente unica: `useTheme()` (`isDark` computado) con clase `glitch-cursor--dark` en el root; las custom props `--cursor-fill/stroke` conmutan ahi (se descarta el selector CSS `:global(html.dark)`: reportado que no conmutaba). Tamano 26px (forma +2px). El stroke mantiene contraste (outline opuesto al fill).
- **Glitch monocromo:** fuera `#ff2d2d`/`#00e5ff`; las capas split y los slices usan el mismo color del cursor (con `mix-blend-mode` u opacidad para el desdoblamiento). El efecto queda en jitter + bandas + split monocromo.
- **Ciclo cursor 3s ejecucion + 10s pausa:** maquina de estados como `GlitchText` (`isGlitching` + timer unico recursivo + cleanup). En pausa se muestra la flecha limpia sin animacion; con `prefers-reduced-motion` no hay ciclo (sin follower, cursor nativo, como hoy).
- **GlitchText 4s + 8s pausa:** `ACTIVE_MS = 4000`, `PAUSE_MS = 8000`; hover continuo + reinicio al salir intactos; keyframes de 42 pasos intactos.
- Verificacion prevista: dev con ambos temas (flecha negra/blanca legible, glitch monocromo visible en ambos fondos), cronometria de ciclos, reduced-motion estatico; `lint:check` + `format:check` exit 0 (con autorizacion).

## Enmienda 2: hero blur justo tras el flash (2026-09-10, PENDING sin ejecutar)

- **Problema (reportado por el usuario):** tras la iteracion 2 la intro del hero corre en `onMounted` oculta tras el overlay (~1.4s) y termina antes del fundido: al desaparecer el flash el texto ya esta visible, sin animacion que mostrar.
- **Requisito:** los textos animan JUSTO DESPUES de que desaparece el flash CRT, con efecto blur-que-aclara. Si, GSAP lo soporta: anima `filter: 'blur(12px)'` -> `'blur(0px)'` como string de filtro, combinado con `y`/`autoAlpha` en el mismo tween, con `clearProps` al completar.
- **Diseno previsto (a detallar en enrichment):**
  - `HeroSection.vue`: `gsap.set(items, { y: 40, autoAlpha: 0, filter: 'blur(12px)' })` en `onMounted` (contenido en DOM, invisible); si `isCrtDone` ya es true (reduced-motion / finish inmediato) reproducir directo; si no, `watch(isCrtDone)` + fallback timeout (p. ej. 3s) por seguridad; tween `to(items, { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.9, stagger: 0.16 })` con `clearProps` al completar y kill en `onBeforeUnmount`; guard reduced-motion intacto (sin estados ocultos).
  - Sin resucitar `reveal`: el gate usa el unico emit `done` (contrato ADR-003 intacto a nivel de eventos; el hero lo usa como senal de arranque, no como compuerta de carga).
  - Nota ADR: ADR-003 pedia intro propia en mount; este gate temporal a `done` lo matiza — registrar el matiz en el cierre (o ADR nuevo si el usuario lo pide).
- **Verificacion prevista:** dev — tras el fundido del flash los textos entran con blur->nitido + subida (~1s, stagger visible); sin flash de contenido previo; reduced-motion directo; fallback nunca dispara en flujo normal (consola limpia).

## Restricciones

- RULES 0.2: el rename implica crear destino + borrar origen; el borrado requiere aprobacion explicita aparte (el move se ejecuta como copia + re-apunte; sin esa aprobacion los origenes quedan temporalmente duplicados).
- RULES 0.3: dos renames en un plan solo por peticion explicita del usuario; nada extra fuera de la lista.
- RULES 0.4: sin `dev/build/preview/lint/format` ni `bun add` sin autorizacion; gestor bun; solo scripts reales de `package.json`.
- CODING_STANDARDS §2.1 English-Only: `Navbar` y `Crt` cumplen (ingles, PascalCase archivos, kebab-case carpetas intactas).
- CODING_STANDARDS §7: los renames no tocan clases, margenes, valores `[...]` ni tipografia.
- DESIGN.md: sin cambios de arquitectura (mismas capas y contratos, solo nuevos nombres).
- Skills subordinadas (`vue-best-practices` para SFC/props/emits): referencia; prevalece el estandar local.

## Pasos

1. Re-leer `src/App.vue`, ambos SFC origen y `useCrtIntro.ts`; confirmar que no hay mas referencias (`TheNavbar`, `the-navbar`, `CrtTurnOnIntro`, `crt-turn-on-intro`, `CrtTurnOnIntroProps`).
2. Rename Navbar: crear `src/components/layout/Navbar.vue` con contenido identico salvo simbolo; re-apuntar import y tag en `src/App.vue`; borrar origen solo con aprobacion explicita (RULES 0.2).
3. Rename Crt: crear `src/components/crt/Crt.vue` con contenido identico salvo `CrtProps` y `defineEmits`; re-apuntar import y tag en `src/App.vue`; borrar origen solo con aprobacion explicita.
4. Disenar intro hero blur-tras-flash (enrichment; ver Enmienda 2): gate a `isCrtDone` + fallback, fromTo con `filter: blur()` + `clearProps`.
5. Disenar ciclo cursor 3s/10s + theme-aware + monocromo y ciclo GlitchText 4s/8s (enrichment; ver Enmienda).
6. Verificacion (seccion siguiente).

## Verificacion

- Estatica (sin autorizacion): cero matches residuales de los nombres viejos en `src/`; `vue-tsc` sin errores nuevos en los archivos tocados.
- Con autorizacion: `bun run lint:check` + `bun run format:check` exit 0; `bun run build` y `bun run dev` solo con permiso (RULES 0.4): navbar monta y navega igual, CRT reproduce negro -> linea -> expansion -> flash -> fundido y emite `done`, hero entra tras el fundido con blur->nitido, sin regresiones.

## Enrichment tecnico (2026-09-10) — compuerta "enriquece el plan" atendida

### Analisis

- **Objetivo:** 5 cambios pedidos, cero inventados: (1) rename `TheNavbar` -> `Navbar`; (2) rename `CrtTurnOnIntro` -> `Crt` (+ `CrtProps`); (3) cursor theme-aware + monocromo + ciclo 3s/10s; (4) `GlitchText` 4s/8s; (5) hero blur-tras-flash gateado a `done`.
- **Scope:** 2 creates + 4 edits, 0 dependencias. Solo lectura: `useCrtIntro.ts` (contrato minimo ya verificado), keyframes de cursor/glitch (intactos).
- **Archivos (grep repo-wide 2026-09-10, `*.{vue,ts,css,json}`):** unicas referencias en codigo: `src/App.vue` (L4 import Navbar, L8 import Crt, L38 `<the-navbar />`, L43 `<crt-turn-on-intro ... @done>`), `src/components/crt/CrtTurnOnIntro.vue` (L6/L12 `CrtTurnOnIntroProps`). Resto de matches solo en historial `.agents/` (no se toca).
- **Riesgos:**
  1. Borrado de origenes (RULES 0.2): requiere aprobacion explicita aparte; sin ella quedan duplicados temporales sin referenciar.
  2. Gate temporal del hero (matiz ADR-003): se usa SOLO la senal de teardown `done` (siempre dispara: reduced-motion, scrolled y timeout-safe via fallback 3s); no se resucita `reveal`; se documenta el matiz en el cierre.
  3. `filter: blur()` animado: costo GPU moderado en 4-5 bloques <1s; mitigado con `clearProps` + duracion corta.
  4. Splits monocromos en light mode (flecha blanca sobre `bg-white`): el split se lee sutil; el jitter + slices + stroke negro mantienen la percepcion. Aceptado por el usuario.
  5. `vue-tsc` estricto (`noUnusedLocals`): no dejar imports (`watch`, `ref`) sin usar.

### Cambios

#### E1. `src/components/layout/Navbar.vue` (create)
Copia byte-identica de `TheNavbar.vue` (verificado: sin autoreferencia `name`, orden SFC intacto). Sin cambios de logica/estilos.

#### E2. `src/components/crt/Crt.vue` (create)
Copia de `CrtTurnOnIntro.vue` con `CrtTurnOnIntroProps` -> `CrtProps` (L6 def + L12 `withDefaults`). Emits `done`, timeline y estilos intactos.

#### E3. `src/App.vue` (edit, unico, 4 reemplazos)
L4 `import Navbar from '@/components/layout/Navbar.vue'`; L8 `import Crt from '@/components/crt/Crt.vue'`; L38 `<navbar />`; L43 `<crt v-if="showCrt" @done="handleCrtDone" />`. Posiciones y orden de imports intactos (diff minimo).

#### E4. `src/components/hero/HeroSection.vue` (edit, solo `<script setup>`)
- Imports: anadir `watch` (`onBeforeUnmount, onMounted, ref, watch`) + `import { isCrtDone } from '@/composables/useCrtIntro'`.
- `gsap.set(items, { y: 40, autoAlpha: 0, filter: 'blur(12px)' })`; `play()` con `.to(items, { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.16, clearProps: 'filter,opacity,visibility,transform' }, 0)`; gate `if (isCrtDone.value) play()` + `watch` once + `fallbackTimer` 3000ms; `onBeforeUnmount` limpia timer y mata timeline. Guard reduced-motion intacto (retorno antes del `set`). Plantilla y estilos intactos.

#### E5. `src/components/cursor/GlitchCursor.vue` (edit, script + CSS; keyframes intactos)
- Script: `isGlitching = ref(false)`, `ACTIVE_MS = 3000`, `PAUSE_MS = 10000`, timer unico recursivo (`startActivePhase`/`schedulePause`/`clearCycle`, patron `GlitchText`); arranque en `onMounted` salvo reduced-motion; cleanup total en `onBeforeUnmount`. Suma `useTheme()` + `isDark = computed(() => theme.value === 'dark')` (misma fuente que el toggle).
- Template: `:class="{ 'glitch-cursor--active': isGlitching, 'glitch-cursor--dark': isDark }"` en el root.
- CSS: default light (`.glitch-cursor { --cursor-fill: #000; --cursor-stroke: #fff; }`) + `.glitch-cursor--dark { --cursor-fill: #fff; --cursor-stroke: #000; }` (sin `:global(html.dark)`); base y splits/slices usan `var()` (monocromo); tamano 26px (root, layers; slices 22px de ancho); animaciones solo bajo `.glitch-cursor--active` (base `animation: none`); `cursor: none` y reduced-motion intactos.

#### E6. `src/components/hero/GlitchText.vue` (edit, solo constantes)
`ACTIVE_MS = 2000` -> `4000`, `PAUSE_MS = 10000` -> `8000`; comentario de hover actualizado al nuevo ciclo. Keyframes (42 pasos), plantilla y hover intactos.

#### E7. Borrados (SOLO con aprobacion explicita aparte)
Eliminar `src/components/layout/TheNavbar.vue` y `src/components/crt/CrtTurnOnIntro.vue` tras verificar cero referencias. Sin ella, quedan sin referenciar y se documenta el pendiente.

### Restricciones (refinadas)
- RULES 0.2/0.3/0.4, CODING_STANDARDS §2.1 (English-Only) y §7 (cero margenes, sin `[...]` — el theme-aware va en `<style scoped>` con `:global(html.dark)`, no en clases Tailwind; Tailwind v4 ya resuelve `dark:` via `@custom-variant` y no se toca), DESIGN sin cambios.
- Skills (subordinadas, prevalece el estandar local): `vue-best-practices` (SFC `<script setup lang="ts">`, orden script->template->style, cleanup de timers/listeners/timelines, contratos tipados); `tailwind-css-patterns` (dark por clase en `documentElement`, adaptado a CSS scoped con `:global` por ser Tailwind v4); `accessibility` (reduced-motion en hero/cursor/glitchtext, `aria-hidden` intactos, foco no afectado; contraste light-mode cubierto por stroke opuesto).

### Steps ejecutables
1. **read** `src/App.vue`, `TheNavbar.vue`, `CrtTurnOnIntro.vue`, `useCrtIntro.ts`, `HeroSection.vue`, `GlitchCursor.vue`, `GlitchText.vue`; confirmar que coinciden con este analisis (si hay delta, detener y reportar).
2. **create** `src/components/layout/Navbar.vue` (copia E1).
3. **create** `src/components/crt/Crt.vue` (copia E2 con `CrtProps`).
4. **edit** `src/App.vue` (4 reemplazos E3).
5. **edit** `src/components/hero/HeroSection.vue` (E4).
6. **edit** `src/components/cursor/GlitchCursor.vue` (E5).
7. **edit** `src/components/hero/GlitchText.vue` (E6).
8. **verificar estatico:** grep cero `TheNavbar|the-navbar|CrtTurnOnIntro|crt-turn-on-intro|CrtTurnOnIntroProps` en `src/`; sin imports/vars sin usar; keyframes intactos; `reveal` sin resucitar.
9. **verificar** `bun run lint:check` + `bun run format:check` (autorizacion aparte si se consideran bloqueados); `build`/`dev` solo con autorizacion independiente (RULES 0.4).
10. **reviewer + DoD:** checklist `.agents/subagents/reviewer.md`, memoria de cierre, matiz ADR-003 registrado.

### Verificacion (criterios)
- Estatica sin autorizacion (paso 8).
- Con autorizacion: lint/format exit 0; `dev` — navbar navega igual, CRT igual, hero entra tras el fundido con blur->nitido + subida (~1s stagger), cursor flecha negra/blanca por tema con glitch monocromo 3s/10s, GlitchText 4s/8s, reduced-motion directo en todo; `build` sin errores nuevos.

## Cierre (memoria persistente)

## Registro de ejecucion (2026-09-10, Executor, compuerta "ejecuta el plan")

- Revision previa: el enriquecido cumple lo pedido literal (renames, cursor 3000/10000 mono theme-aware, GlitchText 4000/8000, hero blur a `done`); sin cambios inventados; borrados fuera por RULES 0.2.
- Cambios reales (E1-E7, sin redefinir alcance):
  - CREATE `src/components/layout/Navbar.vue` (copia byte-identica de `TheNavbar.vue`).
  - CREATE `src/components/crt/Crt.vue` (copia con `CrtProps`).
  - EDIT `src/App.vue`: 2 imports + 2 tags re-apuntados (`navbar`, `crt` con `@done`).
  - EDIT `src/components/hero/HeroSection.vue`: `set` con `blur(12px)`, gate `isCrtDone` + `watch` + fallback 3000ms, tween a `blur(0px)` con `clearProps`, kill en unmount, reduced-motion intacto.
  - EDIT `src/components/cursor/GlitchCursor.vue`: ciclo 3000/10000 con timer unico, vars `--cursor-fill/stroke` conmutadas por `:global(html.dark)`, splits/slices monocromos, animaciones solo bajo `--active`.
  - EDIT `src/components/hero/GlitchText.vue`: `ACTIVE_MS = 4000`, `PAUSE_MS = 8000`, comentario actualizado.
- Verificacion estatica (paso 8): grep en `src/` — cero `the-navbar|crt-turn-on-intro|CrtTurnOnIntroProps|isCrtRevealed|markCrtRevealed|@reveal`; unicos matches viejos dentro del propio origen `CrtTurnOnIntro.vue` (pendiente de borrado con aprobacion). Sin imports/vars sin usar (`watch`/`ref` en uso). Keyframes intactos. `reveal` no resucitado.
- Observacion fuera de alcance (cambio concurrente del usuario detectado en la lectura de verificacion): `src/App.vue` trae clases del `main` distintas al baseline del enrichment (`bg-white text-black dark:bg-neutral-900 dark:text-white`) y `<faulty-terminal-background />` sin `:page-load-animation="false"` (vuelve el boot de 2s por default; puede reintroducir doble-flash con el CRT). No tocado por este plan; flaggeado para tu revision.
- Pendientes: borrado de `TheNavbar.vue` y `CrtTurnOnIntro.vue` (requiere aprobacion explicita, RULES 0.2); `bun run lint:check` + `bun run format:check` + `bun run build` + `bun run dev` (requieren autorizacion independiente, RULES 0.4); checklist visual dev (hero blur tras fundido, cursor por tema 3s/10s, GlitchText 4s/8s, reduced-motion).
- Matiz ADR-003 registrado: el hero usa `done` como senal de arranque (teardown), no como compuerta de carga; sin ADR nuevo salvo que lo pidas.
- Resultado: `EXECUTED` (implementacion terminada, verificacion pendiente). No pasa a `CLOSED` hasta DoD + memoria final.

### Post-ejecucion (2026-09-10): borrado aprobado + fix color/tamano cursor

- Borrado E7 ejecutado con autorizacion explicita del usuario: eliminados `src/components/layout/TheNavbar.vue` y `src/components/crt/CrtTurnOnIntro.vue`; grep en `src/` confirma cero referencias a los nombres viejos.
- `:page-load-animation` se deja como esta por indicacion del usuario (sin accion).
- Fix cursor (reporte: no conmutaba de tema): espec corregida a BLANCO en dark / NEGRO en light; mecanismo cambiado a `useTheme()` + clase `--dark` (fuente unica con el toggle; descartado `:global(html.dark)`); tamano 26px (forma +2px, slices 22px). Verificacion estatica: vars conmutadas, binding de clase presente, keyframes intactos.
- Pendiente (RULES 0.4): `lint:check`, `format:check`, `build`, `dev` + checklist visual (conmutacion real del tema en dev).

### Enmienda 3: cursor se oculta/muestra con glitch en bordes (2026-09-10)

- **Reporte:** al salir de la vista el follower queda congelado en la ultima posicion.
- **Requisito literal:** al salir -> ráfaga de glitch inmediata y desaparece; al entrar -> ráfaga de glitch y reaparece, retomando el ciclo normal.
- **Diseno (solo `src/components/cursor/GlitchCursor.vue`):** `isOutside = ref(false)` + `v-show="!isOutside"`; `LEAVE_BURST_MS = 350`; `handlePointerLeave` (limpia ciclo, glitch on, tras 350ms oculta + glitch off); `handlePointerEnter` (limpia hide/ciclo, posicion inmediata, `isOutside = false`, `startActivePhase()`); listeners `mouseleave`/`mouseenter` en `documentElement` con alta/baja y cleanup total; reduced-motion intacto (sin follower).
- **Ejecutado 2026-09-10:** 6 edits aplicados (constante, estado, handlers, alta/baja, `v-show`); grep confirma 16 marcadores (listeners, timers, `v-show`). Nota: el archivo trae ediciones concurrentes tuyas (atributos reordenados por lint, `PAUSE_MS = 8000` en vez del 10000 del plan) — no tocadas; dime si `PAUSE_MS` queda en 8000 o vuelve a 10000.

### Enmienda 4: glitch continuo en margen de 8px al borde (2026-09-10)

- **Propuesta del usuario:** el cursor detecta la cercania al borde (margen 8px) y ahi el glitch corre sin parar; al salir ya viene con glitch y desaparece de inmediato; al entrar igual.
- **Diseno (solo `src/components/cursor/GlitchCursor.vue`):** `EDGE_MARGIN_PX = 24`; `nearEdge` (ref, tambien bindeado a clase `--edge`) + `setEdgeMode()` con guarda de transicion (al entrar en margen: suspende el ciclo y glitch on; al volver adentro: retoma el ciclo con `startActivePhase()`); `checkEdge(x, y)` con `clientX/clientY` (coords del viewport) vs `innerWidth/innerHeight` (bordes del viewport) — medicion al raz verificada; modo denso en banda: keyframes propios `glitch-cursor-edge-*` a 0.45s con barras visibles en casi todo el loop (el loop normal de 2.4s es escaso y por eso la banda se percibia sin efecto); se evalua en cada `pointermove` y al `pointerenter`; `handlePointerLeave` resetea `nearEdge` sin retomar ciclo; `handlePointerEnter` evalua el borde (si sigue en margen, mantiene glitch sin timers).
- **Ejecutado 2026-09-10:** 6 edits (constante, estado, `setEdgeMode`/`checkEdge`, reset en leave, enter con evaluacion, `checkEdge` en move); grep confirma 15 marcadores.
- **Ajuste margen 24 + modo denso (2026-09-10):** margen a 24px; `nearEdge` a ref bindeada (`--edge`); keyframes densos `glitch-cursor-edge-*` a 0.45s. Causa de la percepcion "sin margen": la medicion si estaba al raz (`clientX/Y` vs `innerWidth/Height`), pero el loop normal de 2.4s es escaso. Grep confirma 17 marcadores consistentes.
- **Reversion a efecto identico (2026-09-10, orden literal):** en el margen corre el MISMO efecto normal (mismos keyframes a 2.4s, solo sostenido); fuera keyframes `edge` a 0.45s, clase `--edge` y ref (vuelve `let` plano). Ejecutado y verificado: cero restos `edge`/0.45s en codigo (solo comentarios).
- **Ajuste 2026-09-10 (orden literal):** margen 8px -> 12px; ocultado inmediato al salir (causa de la demora reportada: no era un `transition` CSS —no existe ninguno en el cursor— sino el timer `LEAVE_BURST_MS = 350ms`; con el glitch preventivo del margen ya no aporta y se elimina con su codigo muerto). Ejecutado: margen 12, `handlePointerLeave` oculta de inmediato, fuera `LEAVE_BURST_MS`/`hideTimer`/`clearHide`; grep confirma cero restos.

> Completar al cerrar el plan. Es la entrada de memoria del proyecto (ver `.agents/PLANS.md`). Sin esto, el plan no pasa a CLOSED (DoD).

- Que cambio: renames `TheNavbar`->`Navbar` y `CrtTurnOnIntro`->`Crt` (+`CrtProps`), origenes eliminados con aprobacion; limpieza huerfanos `reveal` (`useCrtIntro` minimo); hero con blur-que-aclara gateado a `done` + fallback 3s; cursor flecha 26px, blanco en dark / negro en light via `useTheme()`, glitch monocromo 3s + pausa (archivo: 8000), banda 24px con glitch sostenido identico, hide/show inmediato en bordes; `GlitchText` 4000/8000. Auditoria `.ani` cancelada por el usuario.
- Verificacion: estatica por grep (cero nombres viejos/`reveal`/restos en `src/`, keyframes intactos). `lint:check`, `format:check`, `build`, `dev` + checklist visual NO ejecutados (regla 0.4, sin autorizacion).
- Resultado: pendiente aceptado explicitamente (usuario ordena `CLOSED` con "vale" el 2026-09-10).
- Pendientes: autorizar scripts y validacion visual; decidir `PAUSE_MS` cursor 8000 (archivo, edicion concurrente del usuario) vs 10000 (plan); cambios concurrentes del usuario en `App.vue` (clases `main`, fondo sin boot) fuera del plan.
