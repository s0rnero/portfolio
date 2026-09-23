---
name: portfolio-crt-sin-destello-posterior
status: EXECUTED
type: bugfix
domain: portfolio
owner_rules: .agents
created: 2026-09-09 12:00
enriched: 2026-09-09 12:00
amended: 2026-09-09 23:43
approved: 2026-09-09 23:52
executed: 2026-09-09 23:52
---

# Plan Técnico: Carga visual completa durante la intro CRT y eliminación del destello posterior

## Objetivo

- Hacer que el árbol completo de la página, el fondo WebGL y las animaciones del contenido se monten e inicialicen durante la intro CRT.
- Mantener la intro CRT como una capa exclusivamente visual: no debe ser una compuerta de carga, montaje, render, router, GSAP ni ScrollTrigger.
- Eliminar el destello morado perceptible que aparece al finalizar el efecto de TV, evitando que la primera pintura del canvas, una capa de composición o la animación del hero produzcan un cambio visible después del fundido.
- Conservar la secuencia visual CRT —negro, línea/bloom, expansión, flash y fundido— y el comportamiento de `prefers-reduced-motion`.

## Alcance aprobado para revisión

### Archivos de aplicación a editar

- `src/App.vue`
- `src/components/crt/CrtTurnOnIntro.vue`
- `src/composables/useCrtIntro.ts`
- `src/components/hero/HeroSection.vue`
- `src/components/background/FaultyTerminalBackground.vue`

### Archivo de decisión a crear durante la ejecución

- `.agents/decisions/003-crt-overlay-visual-sin-compuerta.md`

La decisión de separar la visibilidad del overlay de la carga y animación del contenido afecta el contrato entre el shell, el overlay y la vista principal. Por la regla `.agents/RULES.md` 0.12, debe registrarse como ADR; se creará como `proposed` durante la ejecución y se confirmará como `accepted` al cerrar si la implementación y la verificación validan la decisión.

### Archivos de solo lectura

- `src/views/MainView.vue`
- `src/composables/useReveal.ts`
- `src/composables/useSmoothScroll.ts`
- `src/style.css`
- `src/router/index.ts`

### Fuera de alcance

- No cambiar las secciones, los datos del portafolio, el router, Lenis ni la lógica de ScrollTrigger.
- No añadir dependencias, componentes, composables ni archivos de aplicación adicionales.
- No introducir `Suspense`, imports dinámicos, lazy loading, una barrera `ready` ni una espera del fondo para desmontar el CRT.
- No cambiar el tinte morado `#995CD0` para ocultar el síntoma.
- No eliminar el fondo global ni el archivo `BlackWallAnimation.vue` conservado por planes anteriores.
- No alterar la secuencia visual aprobada del CRT ni reemplazar GSAP por otro motor.
- No tocar `useReveal.ts` para forzar la visibilidad de secciones que correctamente esperan a su entrada en viewport; esa animación es independiente del CRT.

## Diagnóstico enriquecido

### Flujo real de montaje

El árbol actual de `App.vue` ya contiene las tres superficies en el orden correcto:

1. `<faulty-terminal-background :page-load-animation="false" />`.
2. `<router-view />`, que monta `MainView` y las seis secciones de forma estática.
3. `<crt-turn-on-intro v-if="showCrt" ... />`, que debe cubrir visualmente las dos superficies anteriores.

No se detectaron componentes asíncronos, imports dinámicos, `Suspense` ni una condición que impida montar `router-view`. El problema no es que la página se cargue después del CRT a nivel de router: es que algunas superficies esperan una señal visual del CRT para comenzar su transición y el canvas no tiene un primer frame explícito antes del loop.

### Causa confirmada de contenido visual tardío

`src/components/hero/HeroSection.vue`:

- En `onMounted`, el hero aplica `gsap.set(items, { y: 40, autoAlpha: 0 })`.
- La función `play()` solo se ejecuta cuando `isCrtRevealed` cambia a `true`.
- `CrtTurnOnIntro.vue` emite `reveal` en el momento del flash, y `App.vue` lo convierte en `markCrtRevealed()`.
- Por tanto, la animación de entrada del hero está acoplada al momento de revelar el CRT, en vez de arrancar durante el montaje cubierto por el overlay.
- Además, el tween tiene una posición inicial de `0.15` segundos y puede terminar prácticamente junto o después del fundido CRT, haciendo visible una segunda transición.

Esta es una compuerta visual innecesaria para el contenido. El hero debe ejecutar su propia intro al montarse; el CRT debe ocultar esa transición, no dispararla.

### Causa candidata confirmada por inspección del fondo

`src/components/background/FaultyTerminalBackground.vue`:

- El renderer, el programa y el canvas se crean y el canvas se inserta durante `onMounted`.
- `resize()` ajusta el renderer y `iResolution`, pero en el camino animado no llama a `renderScene()`.
- El primer `renderScene()` solo ocurre dentro del primer `requestAnimationFrame` de `startLoop()`.
- `App.vue` desactiva correctamente el boot visual del shader con `:page-load-animation="false"`, pero eso no elimina el retraso de la primera pintura del canvas.
- El resultado es que el fondo puede pasar de la base `bg-neutral-950` a la superficie morada del shader en un frame posterior al montaje. El CRT normalmente cubre ese cambio, pero una diferencia de timing/composición puede hacerlo visible al terminar el overlay.

La corrección será separar la actualización/render de la programación del RAF y pintar un primer frame inmediatamente después de insertar y dimensionar el canvas, antes de iniciar el loop.

### Capa de composición a retirar

La plantilla actual de `FaultyTerminalBackground.vue` incluye `backdrop-blur-xs`, aunque el plan original del fondo definía únicamente `pointer-events-none fixed inset-0 z-0`. Es un filtro fullscreen adicional que crea una superficie de composición innecesaria alrededor del canvas y puede forzar repaints durante la desaparición del overlay.

Como el shader ya produce la atmósfera visual y el canvas devuelve color opaco, el plan elimina únicamente `backdrop-blur-xs`. No se cambia el tinte, el shader, el brillo ni la posición del fondo. Esta eliminación se considera una medida de composición/performance directamente relacionada con el destello; la validación visual confirmará que no se necesita para el diseño.

### Coordinación CRT actual y modificación necesaria

`CrtTurnOnIntro.vue` tiene dos eventos:

- `reveal`: se emite durante el flash para liberar el hero.
- `done`: se emite al terminar el fundido para que `App.vue` desmonte el overlay.

Después del cambio, solo `done` será público. La línea temporal, el scroll lock, `visible`, el cleanup y la salida reducida se mantienen. El único cambio de responsabilidad es que el evento deja de coordinar contenido y solo finaliza la superficie visual.

`useCrtIntro.ts` actualmente expone `isCrtRevealed`, que dejará de tener consumidores. Se eliminará ese estado y se mantendrá `isCrtDone` como estado único del overlay. `App.vue` lo consumirá mediante un `computed` para que no quede estado huérfano:

- `showCrt = !isCrtDone && !prefersReducedMotion()`.
- `@done` llama a `markCrtDone`.
- `showCrt` solo controla la existencia del overlay; nunca controla `router-view`, el fondo ni el montaje de las secciones.

## Invariantes de la solución

Estas condiciones deben mantenerse después de la ejecución:

1. `router-view` sigue montado independientemente de `showCrt`.
2. `FaultyTerminalBackground` sigue montado independientemente de `showCrt`.
3. No queda ningún `@reveal`, `isCrtRevealed` ni `markCrtRevealed` en `src/`.
4. No existe ningún `watch` o timeout que espere al CRT para iniciar el hero.
5. El hero inicializa su GSAP en su propio `onMounted`, mientras el overlay aún está presente.
6. El canvas recibe un primer `renderScene()` después de `resize()` y antes de `startLoop()` en el camino animado.
7. Solo existe un RAF activo para el fondo y el primer render no inicia un segundo loop.
8. `done` continúa ocurriendo al terminar el fundido, no durante el flash.
9. `prefers-reduced-motion` no queda bloqueado por el overlay ni por la animación del hero.
10. La desaparición del CRT no dispara ninguna inicialización nueva de contenido o fondo; solo cambia la visibilidad del propio overlay.
11. No se cambia la paleta morada ni se agregan dependencias.

## Mapa de responsabilidades Vue

| Superficie | Responsabilidad | Contrato después del cambio |
| --- | --- | --- |
| `App.vue` | Shell global, fondo, router y overlay | Monta todo desde el inicio; solo desmonta CRT al recibir `done` |
| `CrtTurnOnIntro.vue` | Animación visual CRT y scroll lock temporal | Emite únicamente `done: []`; no conoce el hero ni el router |
| `useCrtIntro.ts` | Estado compartido mínimo del ciclo del overlay | Expone `isCrtDone` y `markCrtDone()` |
| `HeroSection.vue` | Entrada propia del hero | Ejecuta GSAP en `onMounted`, sin depender del CRT |
| `FaultyTerminalBackground.vue` | Canvas WebGL global | Pinta un frame inicial y luego mantiene un solo loop RAF |
| `MainView.vue` | Composición y scroll | Sin cambios; Lenis y `ScrollTrigger.refresh()` siguen siendo independientes |

## Cambios técnicos detallados

### 1. `src/components/hero/HeroSection.vue`

**Acción:** `edit`.

- Retirar el import de `watch`.
- Retirar el import de `isCrtRevealed`.
- Retirar `fallbackTimer`, el `watch` de `isCrtRevealed` y el timeout de 3000 ms.
- Mantener `prefersReducedMotion()` como salida directa: con reduced motion no se aplican estados iniciales ocultos.
- Mantener la selección de `[data-hero]`, el contenido y las clases sin cambios.
- Crear la timeline GSAP directamente en `onMounted` después de `gsap.set()`.
- Mantener `ease: 'power3.out'`, `duration: 0.8` y `stagger: 0.16`.
- Cambiar la posición de inicio del tween de `0.15` a `0` para que la transición completa quede cubierta por el CRT y no exista una cola visual posterior innecesaria.
- Guardar la timeline en una variable `gsap.core.Timeline | null` y matarla en `onBeforeUnmount()`; esto evita que la animación siga escribiendo sobre nodos si la vista se desmonta.
- No modificar tipografía, layout, botones, `GlitchText` ni la lógica de scroll a `#perfil`.

Resultado esperado: el DOM y la intro del hero existen y avanzan desde el montaje inicial. La intro CRT solo los cubre visualmente.

### 2. `src/App.vue`

**Acción:** `edit`.

- Sustituir `ref` por `computed` si ya no queda otro estado local.
- Importar `isCrtDone` y `markCrtDone` desde `useCrtIntro` sin importar ni usar estados de reveal.
- Definir el estado derivado del overlay con la forma equivalente a:

  ```ts
  const showCrt = computed(() => !isCrtDone.value && !prefersReducedMotion())
  ```

- Mantener el orden de montaje: fondo, `router-view`, overlay.
- Mantener `:page-load-animation="false"`.
- Cambiar el binding del overlay para usar únicamente `@done="markCrtDone"`.
- No envolver ni condicionar `router-view` o `faulty-terminal-background` con `showCrt`.
- No cambiar las clases del `main` ni añadir un segundo overlay.

Resultado esperado: el evento `done` solo desmonta la capa CRT; no libera ni inicia ningún contenido.

### 3. `src/components/crt/CrtTurnOnIntro.vue`

**Acción:** `edit`.

- Cambiar `defineEmits` de `{ reveal: []; done: [] }` a `{ done: [] }`.
- Retirar la variable `revealed` y la función `doReveal()`.
- Retirar `timeline.call(doReveal, [], blackHold + 0.65)`.
- Retirar la llamada a `doReveal()` dentro de `finish()`.
- Mantener `finish()` idempotente mediante `finished`, restauración de `document.documentElement.style.overflow`, `visible.value = false` y `emit('done')`.
- Mantener los mismos defaults (`blackHoldMs: 300`, `durationMs: 1400`, `lineHeightPx: 2`), refs, estilos y posiciones de la timeline.
- Mantener `nextTick()` para acceder a refs DOM después del montaje.
- Mantener la salida inmediata de `prefersReducedMotion()` llamando a `finish()` sin bloquear el scroll.
- Mantener `timeline?.kill()` y la restauración defensiva del overflow en `onBeforeUnmount()`.

Resultado esperado: el CRT es una superficie autónoma y no tiene conocimiento del momento de entrada del hero.

### 4. `src/composables/useCrtIntro.ts`

**Acción:** `edit`.

- Conservar `isCrtDone = ref(false)`.
- Conservar `markCrtDone()`.
- Eliminar `isCrtRevealed` y `markCrtRevealed()`.
- Exportar únicamente `isCrtDone` y `markCrtDone`.
- No añadir lógica de animación, timers ni acceso al DOM.

Resultado esperado: no quedan contratos compartidos muertos ni estado de reveal sin consumidores.

### 5. `src/components/background/FaultyTerminalBackground.vue`

**Acción:** `edit`.

- Extraer la parte común de actualización de uniforms y `renderScene()` a una función de frame que:
  - Compruebe `renderer`, `program` y `mesh`.
  - Mantenga el cálculo actual de `iTime`, `frozenTime`, `uPageLoadProgress` y mouse.
  - Termine con un único `renderScene(renderer.gl, mesh)`.
- Mantener `frame(t)` como único scheduler:
  - Si `running` es falso, retorna.
  - Programa exactamente un `requestAnimationFrame(frame)`, como hoy.
  - Ejecuta la función de frame.
- Después de `appendChild(canvas)`, crear/usar el `ResizeObserver`, llamar a `resize()` y antes de `startLoop()` ejecutar un primer frame explícito con `performance.now()` cuando el modo no sea reducido ni pausado.
- Mantener el camino estático actual para `prefersReducedMotion()` o `props.pause`, incluyendo `iTime = 0`, `uPageLoadProgress = 1` y un solo `renderScene()`.
- Asegurar que el primer frame no marque `running` ni cree un RAF adicional; `startLoop()` seguirá siendo el único lugar que activa el RAF.
- Mantener `:page-load-animation="false"` desde `App.vue`, `uUsePageLoadAnimation = 0` en ese caso y todas las props del shader.
- Retirar únicamente `backdrop-blur-xs` de la clase del contenedor, dejando `pointer-events-none fixed inset-0 z-0` intacto.
- Mantener listeners de mouse/visibilidad, `ResizeObserver`, fallback WebGL, cleanup y `loseContext()`.
- No cambiar shaders, `tint`, `brightness`, `timeScale`, `dpr`, reacción al mouse ni el contrato público de props.

Resultado esperado: el shader está pintado antes de que el CRT pueda desaparecer y el filtro fullscreen no introduce una transición de composición al revelar el fondo.

### 6. `.agents/decisions/003-crt-overlay-visual-sin-compuerta.md`

**Acción:** `create` durante la ejecución, no durante esta fase de enrichment.

Registrar:

- Contexto: el overlay CRT estaba disparando la entrada GSAP del hero y su desmontaje coincidía con la primera pintura/composición visible del fondo.
- Decisión: montar e inicializar contenido y fondo independientemente del CRT; usar el CRT solo como cubierta visual temporal; usar `done` únicamente para desmontar la cubierta.
- Consecuencias: elimina el acoplamiento temporal y el destello posterior; exige que el fondo pinte un primer frame temprano y que cada sección gestione sus propias animaciones.
- Alternativas descartadas: esperar un evento `ready` del fondo, retrasar `router-view`, mantener `reveal` como compuerta, cambiar la paleta para disimular el flash.
- Estado inicial `proposed`; pasar a `accepted` al cierre si la verificación confirma el comportamiento.

## Secuencia temporal esperada

| Momento | Acción | Debe estar cubierto por CRT |
| --- | --- | --- |
| Montaje inicial | `FaultyTerminal`, `MainView`, las seis secciones y GSAP del hero se inicializan | Sí |
| Primer frame del fondo | Canvas dimensionado y renderizado antes de `startLoop()` | Sí |
| `B = 0.30 s` | Aparece la línea CRT | Sí |
| `B + 0.20 s` | Comienza la expansión vertical | Sí |
| `B + 0.65 s` | Flash CRT; no seite ningún evento de contenido | Sí |
| `B + 0.73 s` a fin | Fundido del overlay; el fondo y hero ya tienen estado inicial/animado | Parcialmente durante el fundido |
| `done` | Se restaura overflow y se desmonta solo el overlay | No debe iniciar ningún render/carga |

## Riesgos y mitigaciones

1. **La timeline del hero sigue activa al terminar el CRT.**
   - Mitigación: arrancarla en `onMounted`, quitar su posición inicial de `0.15` y conservar cleanup; verificar visualmente que no haya un cambio perceptible posterior.
2. **El primer frame del shader no coincide con el tiempo del siguiente RAF.**
   - Mitigación: reutilizar la misma función de actualización para el primer frame y el loop; no duplicar cálculos ni introducir una segunda animación.
3. **`backdrop-blur-xs` era parte de una intención visual no documentada.**
   - Mitigación: retirarlo como filtro fullscreen directamente relacionado con el compositor, mantener todos los demás estilos y verificar que el fondo conserve la apariencia esperada.
4. **El estado global `isCrtDone` puede persistir durante navegación interna.**
   - Mitigación: conservar el comportamiento actual del overlay, que ya se desmonta una vez por montaje de `App`; no ampliar el plan a replay por ruta.
5. **Reduced motion.**
   - Mitigación: `showCrt` es falso desde el inicio; Hero no oculta sus elementos; Faulty pinta un frame estático; no se bloquea el scroll.
6. **Baseline de build conocido.**
   - Los planes anteriores documentan errores de `vue-tsc` preexistentes relacionados con `khatarsis`, variables sin uso de componentes conservados y handlers de `BlackWallAnimation`. No se añade un shim ni se corrigen esos archivos en este plan. Si el build autorizado falla, se separarán errores nuevos de esa deuda conocida.
7. **Limpieza de efectos.**
   - Mitigación: conservar cleanup de RAF, observer, listeners, contexto WebGL y timeline GSAP; revisar que no haya callbacks después del unmount.

## Pasos ejecutables

1. **read** los cinco archivos de aplicación, los archivos de solo lectura, el plan completo y `.agents/decisions/README.md`; confirmar que no hubo cambios desde el análisis y que los nombres/imports coinciden.
2. **create** el ADR `003-crt-overlay-visual-sin-compuerta.md` en estado `proposed`, con la decisión y alternativas descritas arriba.
3. **edit** `src/components/hero/HeroSection.vue`: retirar la compuerta `isCrtRevealed`, arrancar GSAP en `onMounted` con posición `0`, guardar/matar la timeline y conservar reduced motion/presentación.
4. **edit** `src/App.vue`: consumir `isCrtDone` con un `computed`, mantener las superficies siempre montadas y conectar únicamente `@done="markCrtDone"`.
5. **edit** `src/components/crt/CrtTurnOnIntro.vue`: retirar evento/función/llamada `reveal`, conservar íntegra la timeline visual y emitir solo `done` al finalizar.
6. **edit** `src/composables/useCrtIntro.ts`: retirar el estado y acción `revealed`, conservar el contrato mínimo de finalización.
7. **edit** `src/components/background/FaultyTerminalBackground.vue`: extraer la actualización/render común, pintar un primer frame tras `resize()` antes de `startLoop()` y retirar únicamente `backdrop-blur-xs`.
8. **read/review** el resultado completo buscando `isCrtRevealed`, `markCrtRevealed`, `@reveal`, `watch`/timeouts del CRT en Hero, doble RAF, render duplicado, imports muertos, cambios de shader/paleta y archivos fuera de alcance.
9. **verificar** con `bun run lint:check` y `bun run format:check` únicamente con autorización explícita para ejecutar esos scripts.
10. **verificar visualmente** con `bun run dev` únicamente con autorización independiente: recargar `/`, observar el montaje bajo el CRT, confirmar fondo morado estable antes del fundido, ausencia de destello posterior, hero ya inicializado, scroll/click normales tras `done` y reduced motion directo.
11. **verificar build** con `bun run build` únicamente con autorización independiente; separar cualquier error preexistente de errores introducidos por este plan.
12. **reviewer** aplicar `.agents/subagents/reviewer.md`: revisar alcance, reglas, higiene, verificación, plan actualizado, ADR y memoria de cierre. Marcar el ADR `accepted` y el plan `CLOSED` solo si el DoD queda completo; de lo contrario, mantener el plan en `EXECUTED` y documentar el pendiente.

## Verificación

### Inspección estática

- No existen matches de `isCrtRevealed`, `markCrtRevealed` ni `@reveal` en `src/`.
- `router-view` y `faulty-terminal-background` no dependen de `showCrt`.
- `HeroSection.vue` no importa `useCrtIntro`, no crea watchers/timeout de espera CRT y guarda/mata su timeline.
- `CrtTurnOnIntro.vue` declara únicamente `done: []` y conserva la secuencia temporal.
- `FaultyTerminalBackground.vue` ejecuta un render explícito después de `resize()` y antes de `startLoop()`; el primer render no crea RAF.
- Existe un único `requestAnimationFrame(frame)` activo en el camino animado.
- No se cambian shaders, props públicas, tintes ni dependencias.
- El ADR documenta la decisión de desacoplamiento.

### Scripts reales, siempre con autorización

- `bun run lint:check`: debe terminar con exit 0; si falla, corregir solo errores introducidos por este plan.
- `bun run format:check`: debe terminar con exit 0.
- `bun run build`: debe ejecutarse solo con autorización; se esperan posibles errores base de `khatarsis` ya documentados en planes anteriores. El resultado debe identificar si aparece algún error nuevo en los archivos de este plan.
- `bun run dev`: debe ejecutarse solo con autorización; validación visual manual de la secuencia y ausencia del destello.

### Criterios visuales de aceptación

- Al recargar `/`, el DOM de las seis secciones y el fondo ya existen mientras el CRT reproduce la animación.
- El fondo morado no aparece por primera vez al terminar el CRT.
- El hero no comienza su entrada después del flash CRT: su transición ocurre detrás del overlay y no provoca un segundo destello.
- Al completarse el fundido, solo desaparece el overlay; no se dispara ningún cambio de carga o inicialización en el contenido.
- No hay destello morado o blanco posterior al CRT en varias recargas.
- El fondo sigue fijo, reactivo al mouse y animado con un solo loop.
- El scroll y los clics funcionan después de `done`.
- Con `prefers-reduced-motion`, el contenido aparece sin esperar y el fondo queda en frame estático.

## Enmienda del usuario (2026-09-09 23:43) — scroll ausente y contenido tardío tras el encendido

> Reporte del usuario tras la ejecución de planes posteriores: al recargar la página, después del flash de encendido del TV se ve por un momento el faulty terminal **sin scroll**; después "pestañea", sale el scroll y se muestra el contenido. Criterio del usuario: **el scroll debe existir siempre**; lo único que la intro CRT debe condicionar es la visibilidad de los textos/contenido animado por GSAP, y esos deben estar **ya cargados en el DOM pero invisibles** (no montados tarde, no computados tarde).

### Diagnóstico verificado en disco (2026-09-09 23:43, lectura real de los 4 archivos)

1. **Causa A — scroll bloqueado por el propio overlay (confirmada).** `CrtTurnOnIntro.vue` establece `document.documentElement.style.overflow = 'hidden'` en `onMounted` y solo lo restaura dentro de `finish()` (al completar el timeline completo: línea → expansión → flash → fundido, ≈1.38s). Ese bloqueo de overflow es lo que **no debe existir** según el criterio del usuario: el scroll debe quedar habilitado todo el tiempo. Sustento de decisión: sustituir el bloqueo de scroll por una comprobación no bloqueante en `CrtTurnOnIntro.vue`: `if (document.scrollingElement && document.scrollingElement.scrollTop > 0) finish()` en `onMounted`, que desmonta el overlay de inmediato si la página ya está scrolleada (recarga con scroll restaurado, aterrizaje ancla, SPA interna) — el overlay solo cubre la carga inicial con scroll en cero.
2. **Causa B — hero oculto en la carga (confirmada).** `HeroSection.vue` aplica `gsap.set(items, { y: 40, autoAlpha: 0 })` y solo reproduce la intro al `isCrtRevealed` (con fallback de 3s). Ese acoplamiento ya estaba identificado por este plan (causa "compuerta visual innecesaria"); la enmienda lo reafirma con el criterio del usuario: el contenido debe estar en el DOM desde el principio e **invisible**, y el CRT solo decide cuándo se hace visible.
3. **Causa C — primeras pinturas del fondo tardías (ya cubierta por este plan).** FaultyTerminal pinta su primer frame recién en el primer RAF (`renderScene` diferido); `bg-neutral-950` pinta antes que el shader → transición visible de fondo entre montaje y primer RAF. Este plan ya la corrige (primer frame explícito tras `resize()` antes de `startLoop()`); sin esta corrección, la enmienda del scroll no elimina el "pestañeo" de fondo.
4. **Efecto del bloqueo de overflow sobre el scrollingElement.** El `overflow: hidden` del overlay también suprime la scrollbar de `<html>` durante la intro (≈1.4s): es el "momento sin scroll" que el usuario percibe tras el flash. Al retirar el bloqueo, el scroll existe siempre. Cualquier salto de posición por recarga con hash/ancla queda mitigado por la nueva comprobación de `scrollTop > 0`.
5. **Comportamiento futuro con el plan `portfolio-tv-static-click-flash` (PENDING):** su flash de click sube temporalmente la estática a `z-10`, por debajo del CRT (`z-50`): el flash de click nunca tapa la intro ni el scroll (no interfiere con esta enmienda).
6. **Interacción con el plan PENDING `portfolio-navbar-theme-i18n`:** si se ejecuta después de este plan, sus tareas 3.4 (hash router + smooth scroll) y 3.9 (auditoría English-Only) tocarán `App.vue`/`HeroSection.vue`/secciones; este plan solo les deja como requisito que el scroll no vuelva a bloquearse por overlay alguno. Sin conflicto de solapamiento directo en los mismos pasos.

### Cambios de la enmienda (integran a "Cambios técnicos detallados")

- **`src/components/crt/CrtTurnOnIntro.vue` (edit):** retirar el bloqueo de scroll (`previousOverflow`, las dos asignaciones de `document.documentElement.style.overflow` y su restauración en `finish()`/`onBeforeUnmount`). `finish()` queda idempotente por `finished` y restaura `visible=false` + `emit('done')`. Sustituirlo por la comprobación no bloqueante: `if (document.scrollingElement && document.scrollingElement.scrollTop > 0) finish()` en `onMounted`, que desmonta el overlay de inmediato si la página ya está scrolleada (recarga con scroll restaurado, aterrizaje ancla, SPA interna) — el overlay solo cubre la carga inicial con scroll en cero.
- **`HeroSection.vue` (sin cambios nuevos en este plan):** el desacople del hero (GSAP en `onMounted` con posición 0, sin gate `isCrtRevealed`) ya especificado en "Cambios técnicos detallados" §1 satisface el criterio de la enmienda: elementos en el DOM desde el primer momento, ocultos vía `autoAlpha`, visibles durante el fundido del CRT.
- **Criterio de aceptación añadido a Verificación:** tras recargar `/`, la scrollbar existe y la página es scrollable desde el primer frame (durante y después de la intro); el contenido GSAP del hero está en el DOM (invisible) desde el primer frame y se vuelve visible durante el fundido; sin "pestañeo" posterior de fondo (cobertura por la corrección del primer frame de FaultyTerminal).

## Revisión crítica del orquestador — estado `ENRICHED`

- **Cumple la solicitud:** el plan ataca el destello posterior y hace explícito que todo el contenido debe montar/cargar durante el CRT.
- **Causa confirmada:** el hero está bloqueado por `isCrtRevealed`; el primer render del fondo está diferido al RAF.
- **Causa candidata tratada de forma acotada:** se elimina `backdrop-blur-xs`, un filtro fullscreen que no pertenece a la especificación original del fondo y puede contribuir a composición/repaint; no se cambia la paleta para esconder el problema.
- **Sin carga condicionada:** no se propone esperar al fondo, retrasar el router ni desmontar el contenido; el único `v-if` restante controla el overlay visual.
- **Sin cambios inventados:** no se alteran shaders, datos, secciones, router, Lenis ni las animaciones de reveal por scroll.
- **Estándares:** SFC con Composition API/TypeScript, refs y cleanup; cero márgenes/valores Tailwind arbitrarios nuevos; la clase restante del fondo conserva las utilidades existentes.
- **Decisión registrada:** se incluye ADR porque el desacoplamiento del overlay cambia un contrato de arquitectura/diseño entre shell y contenido.
- **Verificación separada:** lint/format/build/dev se mantienen como comandos reales del repo y requieren autorización conforme a `.agents/RULES.md`.
- **No se marca `READY` automáticamente:** el plan queda en `ENRICHED` y espera la revisión/aprobación explícita del usuario.

## Cierre (memoria persistente)

- Registro de ejecución (2026-09-09, Executor): creado el ADR `003-crt-overlay-visual-sin-compuerta.md` (estado `proposed`). Editado `src/components/hero/HeroSection.vue`: retirado el gate `isCrtRevealed` (import, watch, `fallbackTimer` y timeout de 3s); timeline GSAP creada directamente en `onMounted` con posición `0` (antes `0.15`); `gsap.set` inicial conservado (elementos en el DOM, invisibles vía `autoAlpha`); timeline guardada en `heroTimeline` y matada en `onBeforeUnmount`. Editado `src/App.vue`: `showCrt` es `computed(() => !isCrtDone.value && !prefersReducedMotion())`; fondo, `router-view` y overlay siempre montados; binding único `@done="handleCrtDone"` (fuera `@reveal`/`markCrtRevealed`). Editado `src/components/crt/CrtTurnOnIntro.vue`: `defineEmits` solo `done`; fuera `revealed`/`doReveal()` y su `timeline.call`; **fuera el bloqueo de scroll** (`previousOverflow` y ambas restauraciones de `overflow`, enmienda del usuario); añadida comprobación no bloqueante en `onMounted` (`scrollTop > 0` → `finish()` inmediato); timeline visual, defaults, reduced-motion y cleanup intactos. Editado `src/composables/useCrtIntro.ts`: contrato mínimo (`isCrtDone`, `markCrtDone`), fuera `isCrtRevealed`/`markCrtRevealed`. Editado `src/components/background/FaultyTerminalBackground.vue`: extraída `renderFrame(t)` (uniforms + `renderScene`), `frame(t)` queda como único scheduler (un solo `requestAnimationFrame` activo), primer frame explícito `renderFrame(performance.now())` tras `resize()` y antes de `startLoop()` (condicionado a `!prefersReducedMotion() && !props.pause`; no marca `running` ni crea RAF), y retirado `backdrop-blur-xs` de la plantilla (`pointer-events-none fixed inset-0 z-0`).
- Verificación estática (sin scripts, 2026-09-09): 0 matches de `isCrtRevealed`/`markCrtRevealed`/`@reveal`/`doReveal` en `src/`; `router-view` y `faulty-terminal-background` independientes de `showCrt`; Hero sin watchers/timeouts del CRT y con kill de timeline; `CrtTurnOnIntro` declara solo `done` y conserva la secuencia visual completa; el primer render no crea RAF ni segundo loop; shaders, props públicas, tintes y dependencias intactos. Deuda preexistente detectada sin tocar (fuera de alcance de este plan; ya cubierta por el plan PENDING `portfolio-navbar-theme-i18n`): `goToPerfil`/`#perfil` y comentarios en español en `HeroSection.vue`.
- Que cambio: [completar con los cambios reales y el ADR creado]
- Verificacion: pendiente por regla 0.4 — `bun run lint:check`, `bun run format:check`, `bun run build` y `bun run dev` requieren autorización explícita (no ejecutados).
- Resultado: pendiente — el plan permanece `EXECUTED` hasta validar scripts/visual (o aceptación explícita del pendiente) según DoD; el ADR 003 pasa a `accepted` al cierre si la verificación confirma.
- Pendientes: autorizar `bun run lint:check` + `bun run format:check`, y opcionalmente `bun run build` / `bun run dev` (prueba visual: scroll disponible desde el primer frame, sin destello morado posterior, hero invisible-cargado visible durante el fundido, reduced-motion directo, consola limpia).
