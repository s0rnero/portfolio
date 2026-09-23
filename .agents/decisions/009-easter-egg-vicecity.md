---
name: 009-easter-egg-vicecity
status: proposed
date: 2026-09-15
domain: portfolio
supersedes: []
---

# ADR-009: Los huevos de pascua se disparan desde un composable global y reutilizan los fondos existentes

## Contexto

El portafolio necesitaba un efecto oculto: escribir la secuencia `vicecity` y presionar `Enter` activa un panel "Truco activado", un fondo de ruido que tapa todo el contenido durante ~3 segundos y el salto a una vista nueva que reproduce un video a pantalla completa con sonido.

Eso obliga a resolver tres cosas que el sitio no tenía:

- Un **disparador global de teclado**: no existía ningún `keydown` en `src/`, y la secuencia puede escribirse desde cualquier sección y con cualquier elemento enfocado.
- Un **fondo que tape el contenido**: `TvStaticBackground` es hoy un fondo `fixed inset-0` con `z-index` negativo (`-z-30`, o `-z-10` durante el flash de navegación), pensado para quedar **detrás** de todo.
- Una **vista que no es una sección**: el router solo conocía `/`, `/projects` y `/contact`, todas resolviendo `MainView` con las 4 secciones del portafolio.

## Decisión

- El disparador vive en un composable, `useViceCityCode`, con el listener en `window`: acumula las últimas 8 letras (case-insensitive) y dispara con `Enter`. Ignora eventos con `ctrl`/`meta`/`alt` y los que nacen dentro de `input`, `textarea`, `select` o `contenteditable`; cualquier tecla que no sea letra limpia el buffer. El composable **también navega** con `useRouter()`: detectar, mostrar y navegar es una sola secuencia y no debe repartirse en dos lugares.
- El ruido **reutiliza la instancia única de `TvStaticBackground`** a través de una prop nueva `overlay`, que cambia la clase de `z-index` a `z-50` en lugar de montar un segundo componente. Se evita un segundo contexto WebGL y un segundo loop `requestAnimationFrame`, y el ruido es literalmente el mismo fondo que ya usa el sitio. La instancia no se desmonta en la vista del video.
- El panel vive en `src/components/common/TrickOverlay.vue` y se monta en `App.vue` (raíz de composición), **después** del fondo de ruido y de `<router-view>`: con los dos en `z-50`, el orden del DOM decide quién pinta encima.
- La vista del video es una **ruta propia** (`/vicecity`) que monta `ViceCityView.vue`. `RouteName` se amplía con `'vicecity'`; `NAV_SECTIONS` y `useSectionSpy` **no** se tocan, porque el truco no es una sección de navegación.
- En la vista del video el chrome desaparece (`v-if` sobre la ruta en `App.vue`): navbar, `GradualBlur`, `GlitchCursor` y footer. Los dos fondos WebGL y el `Crt` de intro **no** se tocan: quedan detrás del video (opaco, `fixed inset-0`) y el CRT ya está desmontado cuando el truco puede dispararse.
- Los textos del panel salen de i18n (`trick.unlocked`: "Truco activado" / "Cheat activated"), con el español como fuente.
- El panel usa **valores literales autorizados por el usuario** (2026-09-15): `w-[341px] h-[42px]`, `border-[#8ffaf6]`, `bg-[#183135]`, `text-[#afbdbc]`, medidos píxel a píxel de la referencia visual. Es la excepción que `CODING_STANDARDS.md` §7.5 contempla ("salvo que el usuario lo pida explicitamente"), así que `src/style.css` no se toca y no se agregan tokens.

## Consecuencias

- Positivas: el truco queda contenido en una pieza de comportamiento, un panel y una vista; no agrega dependencias ni contextos WebGL; el fondo es el existente, así que el efecto respeta tema, `fps` y `dpr` sin trabajo extra; los huevos de pascua futuros tienen un patrón (composable + overlay en `common/` + ruta propia).
- Negativas / trade-offs: `App.vue` pasa a conocer la ruta activa (acoplamiento ruta → composición); el ruido adquiere un segundo rol (portada, no solo fondo) y su `z-index` deja de ser un detalle interno del componente; el panel queda con medidas literales, así que un cambio de diseño no sale de tokens sino de valores en la plantilla; la vista del recorrido no tiene salida propia (el "después" del video se conecta más adelante por decisión del usuario).
- Riesgos aceptados: `z-50` empata con el drawer de `khatarsis` (teleportado al `body`, posterior en el DOM), así que con el drawer abierto el ruido podría quedar por debajo; y el autoplay con sonido depende del gesto previo del usuario (si el navegador lo rechaza, se reporta, no se mutea en silencio). La secuencia y el video **no** consultan `prefers-reduced-motion` (pedido explícito del usuario), a diferencia de los fondos WebGL.

## Alternativas Consideradas

- **Componente invisible que monte el listener:** mezcla comportamiento con presentación y obliga a renderizar algo que no se ve; descartado.
- **Listener dentro de `Navbar.vue`:** la secuencia debe funcionar desde cualquier sección y con el navbar oculto (vista del video), no solo donde está el navbar; descartado.
- **Segunda instancia de `TvStaticBackground` para el ruido:** duplica contexto WebGL y loop de render durante 3 segundos para lograr algo que una clase de `z-index` resuelve; descartado.
- **Panel dentro de la vista del video:** el panel tiene que verse **sobre el portafolio** y sobrevivir al cambio de ruta, que ocurre en el mismo instante; descartado.
- **Ruta dentro de `MainView` (sección oculta):** obligaría a que la vista del video conviva con las 4 secciones, el `useSectionSpy` y el layout del portafolio; descartado.
- **Tokens en `@theme` en lugar de valores literales:** más limpio, pero el usuario pidió explícitamente las medidas exactas de la referencia; queda como la vía natural si algún día se quiere parametrizar.

## Estado

`proposed` (creado durante la ejecución del plan `portfolio-agents-refresh-vicecity-easter-egg`). Pasará a `accepted` cuando la verificación visual confirme la secuencia completa: panel con el texto en el idioma activo, ruido tapando el contenido, salto al video con sonido y apagado a los 3 segundos.
