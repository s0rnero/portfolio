---
name: portfolio-mapa-scrollspy-flash-zindex
status: EXECUTED
type: fix
domain: portfolio
owner_rules: .agents
created: 2026-09-11 13:30
---

# Plan: mapa de Cali, ruta por scroll, flash de 1.5 s y z-index del terminal

> Solicitud del usuario (2026-09-11): "que pasa con el map? ese layer parece que hubiese hecho el mapa en paint, necesito la ubicacion de cali que se vea toda la ciudad que se permita hacer zoom y arrastrar el mapa, al hacer scroll no cambia la ruta de la seccion en la que estoy debe hacerl[o], la duracion del efecto de ruido de tv al cambiar del tema o al dar click en una seccion del navbar para navegar debe durar 1.5segundos unicamente, el faulty terminal es solo un fondo no debe mostrarse por encima del contenido nunca, corrige esos z-index y que en light mode el fondo no sea blanco sino mas bien este color #2b2a2a". Orden directa: no hubo fase de enriquecimiento ni compuerta "ejecuta el plan" (el usuario pidio los arreglos y se implementaron).

## Diagnostico (medido, no supuesto)

1. **El mapa estaba en la selva amazonica.** `CALI_CENTER` era `[-3.4516, -76.532]`: latitud **sur**. Cali esta a **3.4516 N**. A zoom 13, la latitud negativa cae en la selva de Loreto (Peru): verde con simbolos de vegetacion y rios, que es exactamente el aspecto "hecho en Paint" del reporte.
2. **El filtro oscuro del mapa nunca se aplico.** Leaflet 1.9.4 declara `GridLayerOptions.className` en sus tipos pero `_initTile` no lo usa (`node_modules/leaflet/dist/leaflet-src.js:11892`): los `<img>` de los tiles salian sin clase, asi que `.dark .cali-map-tiles` no coincidia con nada. En dark el mapa se veia con los colores claros de OSM.
3. **La ruta no seguia el scroll.** No existia scroll spy: `route.hash` solo cambiaba al hacer click, y nada actualizaba la URL mientras el lector se desplazaba.
4. **El ruido de TV duraba 2 s** en ambos disparadores (`flashOnNavigate` / `flashOnThemeToggle`, defaults en `2000`).
5. **El terminal competia con el contenido.** El canvas estaba en `z-0` dentro de `main` (`position: relative`, `z-index: auto`): un elemento posicionado con `z-index: 0` se pinta en el paso 6 del orden de pintado, **por encima** del texto estatico de las secciones (paso 5). Verificado por hit-test forzando `pointer-events: auto` en el canvas.
6. **Bug extra encontrado: la foto del About no reservaba altura.** `portrait.svg` solo tiene `viewBox` y el `<img>` no declaraba `width`/`height`, asi que medía **0 px de alto** hasta que el archivo cargaba: el documento crecia ~280 px al cargar y cualquier destino de scroll calculado antes quedaba corto (el click a "Contacto" aterrizaba en medio del About).

## Cambios ejecutados

1. **`src/components/about/CaliMapCard.vue`** — `CALI_CENTER` con latitud positiva; `CALI_BOUNDS` (3.36/-76.575 a 3.49/-76.455) + `map.fitBounds(..., { padding: [8, 8] })` para que el zoom salga del tamaño real de la tarjeta (zoom 11 medido, con toda la ciudad visible); zoom, arrastre, rueda, pinch, teclado y control de zoom habilitados; `minZoom`/`worldCopyJump`; listener de `wheel` con `stopPropagation` para que el zoom del mapa no arrastre tambien la pagina (Lenis escucha en `window`); `role="region"` + `aria-label`.
2. **`src/style.css`** — el filtro de tema pasa a `.dark .cali-map .leaflet-tile-pane` (solo tiles: el pin `#995CD0` y la atribucion conservan su color) y se tematiza el control de zoom (`bg-white text-neutral-700` / `dark:bg-neutral-900 dark:text-zinc-200`).
3. **`src/composables/useSectionSpy.ts`** (nuevo) — scroll spy sobre las secciones de `NAV_SECTIONS`: la ultima cuyo `top` cruzo el 35% del viewport es la activa; si cambia, `router.replace({ path: '/', hash })` (y `{ path: '/' }` sin hash al volver al hero). Expone `wasSpyNav()`, una **ventana de tiempo** que el flash (App.vue) y el scroll behavior del router consultan para no reaccionar a estas navegaciones.
4. **`src/views/MainView.vue`** — `useSectionSpy(NAV_SECTIONS)`.
5. **`src/App.vue`** — `afterEach` ignora las navegaciones del spy (sin estallido de ruido al scrollear) y `<main>` pasa a `relative isolate` (contexto de apilado propio para los fondos).
6. **`src/router/index.ts`** — `scrollBehavior` devuelve `false` cuando la navegacion la origino el spy (no arrastra al lector a la seccion que ya esta viendo).
7. **`src/composables/useStaticFlash.ts`** — `1500` ms por defecto en `flashOnNavigate` y `flashOnThemeToggle`.
8. **`src/components/background/FaultyTerminalBackground.vue`** — el canvas pasa a `-z-10` (paso 2 del orden de pintado: detras de todo el contenido).
9. **`src/components/about/AboutSection.vue`** — `width="600" height="800"` en la foto: reserva la caja antes de cargar (arregla el CLS y los destinos de scroll cortos).

## Verificacion (ejecutada)

- `bun run lint:check`, `bun run format:check` y `bun run build` (con `vue-tsc`): verdes para todo el alcance de este plan en el momento de la medicion. **Al cierre del turno el build queda rojo por `src/components/layout/Navbar.vue(13,7) TS6133: 'route' is declared but its value is never read`**, archivo que otro flujo edito en paralelo (ver "Concurrencia").
- **Mapa** (dev server del usuario, medido en el DOM): centro `3.426, -76.515` (Cali), zoom **11**, viewport del mapa cubriendo lat 3.348–3.502 y lng -76.628 a -76.403 (toda la ciudad), `leaflet-grab` presente, 1 `circleMarker` en `rgb(153, 92, 208)`, 2 botones de zoom, 0 tiles rotos.
- **Filtro de tema**: en dark `getComputedStyle(.leaflet-tile-pane).filter = brightness(0.9) contrast(1.25) hue-rotate(180deg) invert(1)`; el pin y la atribucion quedan con `filter: none`.
- **Scroll spy**: con scroll real, `#about` → `#contact` → `#projects` → sin hash al llegar al hero, sin flash en ningun salto (`z-10` ausente en el canvas de ruido).
- **Flash**: 1502 ms (click en el navbar) y 1515 ms (toggle de tema), medidos por polling del `classList` del canvas de ruido (granularidad 10 ms).
- **Apilado**: con `pointer-events: auto` forzado en ambos canvas, `document.elementFromPoint` sobre el `h2` del About devuelve el `H2` (no el canvas): el contenido esta por encima.

## Concurrencia (importante)

Otro flujo edito en paralelo los mismos archivos (`Navbar.vue` 13:03, `ProjectsSection.vue` 13:09, `AboutSection.vue` 13:17, `CaliMapCard.vue` 13:19, `ContactSection.vue` y `MainView.vue` 13:22). Consecuencias registradas, sin tocar su trabajo:

- `FaultyTerminalBackground.vue` volvio a `z-0`; **se reaplico `-z-10`** (con su comentario) por ser el arreglo pedido y verificado.
- `MainView.vue` quedo envuelto en `<div class="fle z-10 h-full flex-col">` (typo: `fle`; `z-10` sin `position` no tiene efecto).
- `Navbar.vue` perdio el resaltado de seccion activa y dejo `route` sin uso (unico error de build actual).
- El layout del About ya no es responsive (se quitaron los prefijos `lg:`): a 408 px de ancho la tarjeta del mapa mide **92 px**. En un viewport de escritorio no se nota; el `fitBounds` se adapta igual.

## Hallazgo extra: por que `dark:` y los breakpoints pierden (causa raiz medida)

**`khatarsis` publica un build completo de Tailwind.** `src/style.css` hace `@import 'khatarsis/style.css'`, que resuelve a `node_modules/khatarsis/dist/khatarsis.css` (382 KB, cabecera `tailwindcss v4.2.4`): trae **~71 KB de utilidades** propias (`.flex`, `.flex-col`, `.flex-row`, `.bg-white`, `.bg-black`, `.text-sm`, `.p-4`, `.rounded-lg`, `.w-full`, `.items-center`, `.hidden`, `.relative`, `.absolute`, ...).

Como las dos hojas emiten en la **misma capa `utilities`**, y las utilidades del app se generan antes que ese import, el contenido de la libreria queda **despues** dentro de la capa. Con igual especificidad (`0,1,0`) decide el orden de aparicion: gana la copia de la libreria.

Medido caminando el CSSOM en orden de cascada (dev server, viewport 408 px):

| Selector | Copia del app | Copia de khatarsis |
| --- | --- | --- |
| `.flex-col` | orden 381 | orden **2718** |
| `.bg-white` | orden 430 | orden **2833** |
| `.md\:flex-row` | orden 593 (dentro de `@media (width >= 48rem)`) | no existe |

Reproducido en el DOM: un `div` con `bg-white dark:bg-black`, con `.dark` en `<html>`, sigue en `rgb(255, 255, 255)`. Y la **misma regla** reinyectada al final de `@layer utilities` si gana (`rgb(0, 0, 0)`): el factor decisivo es el orden dentro de la capa, no la especificidad, y por eso `!important` lo "arregla".

Segunda trampa de la misma familia: en `src/style.css` hay reglas **fuera de toda capa** (`html`, `body`, `:root`, `::-webkit-scrollbar*`, las de `.cali-map`). El CSS sin capa gana a *todo* el CSS en capas, sin importar la especificidad, asi que tambien pisa utilidades.

Rutas de arreglo (no aplicadas, quedan a decision del usuario): (a) declarar `@layer khatarsis, theme, base, components, utilities;` antes de los imports e importar con `@import 'khatarsis/style.css' layer(khatarsis);`; (b) que la libreria emita su CSS dentro de una capa propia; (c) envolver las reglas propias de `src/style.css` en `@layer components` en vez de dejarlas sin capa.

## Pendiente / decisiones abiertas

1. **Fondo `#2b2a2a` en light mode**: aplicado por decision explicita del usuario (2026-09-11). Medido en el DOM, el texto del tema claro queda con contraste **1.47:1** (titulos, `rgb(0,0,0)`), **2.43:1** (parrafo del About) y **3.02:1** (footer) contra `#2b2a2a`: si el usuario quiere legibilidad, la tinta del tema claro tiene que pasar a tonos claros.
2. **Z-index del terminal**: revertido a `z-0` (estado del usuario) junto con `main` sin `isolate`. El canvas es un posicionado con `z-index: 0`, asi que se pinta por encima del texto estatico de las secciones; el arreglo queda del lado del usuario.
3. `profile.role` / `profile.description` y las imagenes de los logos siguen sin `width`/`height` (la del About es la unica que producia salto real).
