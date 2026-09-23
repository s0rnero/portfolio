---
name: 010-truco-vicecity-sonido-y-arranque-del-trailer
status: proposed
date: 2026-09-16
domain: portfolio
supersedes: []
---

# ADR-010: El truco comparte su estado, el panel posee su sonido y el trailer arranca cuando termina el ruido

## Contexto

El huevo de pascua del ADR-009 (`vicecity` + `Enter`) dejaba dos cabos sueltos de experiencia:

- El panel "Truco activado" aparecía **sin sonido**, aunque `src/assets/c/unlocksomething.m4a` existía en el repo sin consumidor.
- El trailer `src/assets/trailers/vc.mp4` se reproducía con `autoplay` al entrar en `/vicecity`, es decir en **t = 0**, tapado por el ruido de TV y antes de que el usuario viera el panel. El arranque no dependía de la secuencia, sino del montaje de la vista.

Eso choca con un supuesto del ADR-009 que ya no se sostiene: la señal del truco era un `ref` **local** de `useViceCityCode()`, consumido solo por `App.vue`. Con el arranque del trailer gobernado por el fin del ruido hacen falta **dos** consumidores en ramas distintas del árbol —`App.vue` (ruido y panel) y `ViceCityView.vue` (trailer)— y la vista se monta con el router, fuera de `App.vue`. Un `ref` local no atraviesa ese límite.

El temporizador `TRICK_DURATION_MS = 3000` sigue siendo el dueño del tiempo: "el ruido desapareció" es exactamente el instante en que `isTrickActive` vuelve a `false`.

## Decisión

- El estado del truco es **estado de módulo**: `isTrickActive` (y el `timer` que lo apaga) viven a nivel de módulo en `src/composables/useViceCityCode.ts` y se exportan de dos formas, el patrón que ya usan `useCrtIntro` y `useStaticFlash`: `useViceCityCode()` devuelve `{ isTrickActive }` e instala el listener de teclado, y `export { isTrickActive }` permite **leer** la señal sin instalar un segundo `keydown` global. El disparador, la secuencia de 8 letras, la guarda de reentrada y la navegación no cambian.
- El sonido del panel lo **posee** `TrickOverlay.vue`, como `<audio :src="unlockSound" autoplay />` dentro de su propio nodo raíz: el audio nace en el mismo instante en que aparece el panel —con la activación del usuario todavía fresca— y desaparece con él. Sin `onMounted`, sin `new Audio()`, sin estado nuevo, sin limpieza. El m4a dura 0,379 s, así que termina mucho antes de que empiece el trailer: no se corta ni se solapa.
- El arranque del trailer lo gobierna el fin del ruido: `ViceCityView.vue` pierde `autoplay` y arranca por `handleStart()` (guarda `hasStarted` de un solo disparo) desde dos disparadores, ambos contra la señal compartida: `onMounted` si el truco **no** está activo —deep-link o recarga directa en `/vicecity`— y un `watch(isTrickActive)` que arranca cuando pasa a `false`. Un segundo truco con el video ya arrancado repite panel y ruido, pero **no** reinicia la reproducción.
- El video **nunca se mutea en silencio**: si el navegador rechaza el `play()` diferido (~3 s después del `Enter`), el fallo se reporta en la revisión visual. Se mantiene la política del ADR-009 R2.
- `App.vue` solo cambia el destructure a `{ isTrickActive }`; la plantilla no se toca.

## Consecuencias

- Positivas: una sola fuente de verdad para "el truco está activo"; el sonido queda encapsulado en el componente que ya representa el panel (sin componente nuevo ni prop nueva); el trailer deja de reproducirse a ciegas detrás del ruido y empieza cuando el usuario puede verlo; la vista del video gana el caso de deep-link con el mismo código que el caso normal; `.agents/DESIGN.md` §1 recupera coherencia (ya no lista un composable de estado local que dejó de serlo).
- Negativas / trade-offs: `ViceCityView.vue` pasa a **depender** del composable del truco, que antes no conocía, y la vista ya no es un `<video>` autocontenido (acoplamiento aceptado a cambio de no duplicar la señal); el estado de módulo sobrevive a la vista, así que la limpieza del `setTimeout` en `onBeforeUnmount` de `App.vue` sigue siendo obligatoria para no dejarlo "activo"; el arranque diferido depende de que el navegador siga considerando válida la activación del usuario ~3 s después, y ese fallo no tiene remedio dentro de este alcance (ni `muted` silencioso ni reintentos).
- Riesgos aceptados: con red lenta el trailer puede arrancar en negro, porque sin `autoplay` el navegador no tiene la misma urgencia de precarga; el activo sigue pesando 250 MB y su empaquetado no se toca aquí. La secuencia completa sigue sin consultar `prefers-reduced-motion` (pedido explícito del usuario en el ADR-009).

## Alternativas Consideradas

- **Sonido dentro de `useViceCityCode` (`new Audio(...)` en `activate()`):** el composable es comportamiento y el audio es un efecto de presentación; además obligaría a manejar el rechazo del `play()` en un lugar que no puede mostrarlo. El panel ya existe justo en ese instante, así que el elemento `audio` declarativo es el mismo resultado con menos código.
- **`new Audio()` + `ref` + `onMounted` + `play().catch()` dentro del panel:** única ventaja real, poder registrar el rechazo; el audio es un efecto decorativo y `CODING_STANDARDS.md` §4 admite degradación silenciosa documentada (precedente: el `catch` de WebGL en `TvStaticBackground.vue`). Queda como la vía natural si algún día se quiere ese rechazo observado.
- **Pasar `isTrickActive` al `<router-view>` como prop o con `provide/inject`:** obliga a `App.vue` a conocer el contrato de una vista concreta y a mantener un puente que solo existe para un caso; el estado de módulo ya es el patrón declarado del repo.
- **Mantener `autoplay` y "esperar" a que el ruido termine:** el video se reproduciría durante 3 s por debajo del ruido, con su audio arrancando antes del panel; es exactamente el comportamiento que el usuario pidió eliminar.
- **Un `setTimeout` propio en la vista, replicando los 3 s:** duplicaría la constante `TRICK_DURATION_MS` y se desincronizaría en cuanto el truco cambiara de duración (`CODING_STANDARDS.md` §3 prohíbe duplicar contratos y listas).
- **Reproducir el m4a desde `ViceCityView.vue`:** el sonido pertenece al panel, que es lo que el usuario ve al activarse; atarlo a la vista lo desacoplaría del elemento visual y del momento correcto.

## Estado

`proposed` (creado durante la ejecución del plan `portfolio-vicecity-sound-trailer-gating`). Pasará a `accepted` cuando la verificación visual confirme: el m4a en el mismo instante del panel, el trailer en silencio durante los 3 s de ruido y el arranque con sonido en el momento exacto en que el ruido desaparece. ADR-009 sigue vigente y no se edita (regla 0.12): el disparador, el panel, el reuso del ruido y la ruta propia no cambian; este ADR solo agrega señal compartida, dueño del audio y arranque gobernado por el fin del ruido.
