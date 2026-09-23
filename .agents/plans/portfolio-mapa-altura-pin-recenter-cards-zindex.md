---
name: portfolio-mapa-altura-pin-recenter-cards-zindex
status: CLOSED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-11 15:40
---

# Plan: altura y calidad del mapa, pin morado con recentrado, cards centradas, capas de fondo, gradual blur de navbar y footer, y ajustes de light mode

> Tercera tanda de la misma sesion (2026-09-11, con captura del scrollbar): "quiero que el footer en su top tenga el mismo efecto que el de gradual blur top" / "el gradual blur top no esta del todo bien te pido que investigues de nuevo de donde tome el efecto y lo verifiques para que quede similar al de la fuente" (adjunto el codigo fuente de vue-bits GradualBlur) / "corrige como esta hecho el gradual blur para que no solo soporte el top, no tiene que ser tal cual el componente con el mismo codigo, hay cosas que se pueden simplificar o omitir, solo necesito el efecto en top y bottom en este caso para el footer y el navbar" / "que el pointer del mapa si sea morado no rojo" / "que cuando en seccion de proyectos una fila no complete el total de sus columnas centre el contenido no que respete los huecos del elemento que deberia ir en el faltante" / "las flechitas al cambiar de tema no cambiar de color de fondo como se ve en la imagen" / "añade todo esto al plan". Va como **Bloque G** (puntos 12 a 14 del Diagnostico).
>
> Segunda tanda de la misma sesion (2026-09-11, con captura del Contacto): "tambien agrega al plan que cuando sea el light model el tv background tenga un contraste de  1 y un brillo de 1.5 de resto debe tener los default que son los 0.5 y 0.5" / "que el efecto de cuando navega o cambia de tema que el tv noise se muestr dure solo 0.8 segundos" / "cuando sea light mode si puedes haz que el logo de softii y la A de alythos sean negros" / "en la seccion de contact no se por que  los hijos de ese section no toman el h-full ni el flex-1 siempre se ve como en la imagen". Los cuatro se diagnostican abajo (puntos 8 a 11) y se integran como **Bloque F**.

> Solicitud del usuario (2026-09-11, con captura del mapa): "podemos hacer que el mapa tome la altura disponible? respetando el texto dentro de la card claro sin causar overflow ademas como se ve en la foto el mapa tiene como baja calidad, necesito un boton que reubique despues de arrastrar, que reubique en el punto donde esta cali, cambia ese punto morado por un pointer de mapa rojito como el de google maps" / "necesito que me ayudes buscando una mejor forma de distribuir mis cards que no tenga que yo definir x columnas en x tamaños no, ya se con grid o con flex pero por ejemplo si hay 5 cards que se muestren primero 3 y las otras 2 centradas en x debajo, que seria la primera fila de 3 columnas y la segunda de 2 pero centradas, hay algo asi existente? busca en internet" / "cuando navego a una seccion desde el navbar el background de ruido de televisor tapa todo el contenido y no se ve el scroll, es un background nunca debe tapar el contenido, siempre se debe mostrar por detras analiza como estan los z-index ahora debe conservar ese comportamiento siempre" / "investiga y añade los cambios en un nuevo plan".
>
> Compuerta: el usuario pidio explicitamente un plan nuevo. Este documento se entrego en `PENDING`; **no se toco codigo de aplicacion**. Los comandos de verificacion requieren autorizacion (ver "Verificacion" y D3).
>
> Enriquecimiento (2026-09-11): el usuario escribio **"enriquece el plan"**, asi que paso a `ENRICHED` y se agrego la ultima capa de detalle tecnico: la cadena de altura real del `k-card` del mapa medida en el DOM (Bloque B), el comportamiento de `rem` dentro de media queries (Bloque E), las capas esperadas del `GradualBlur` y el arreglo de apilado del footer (Bloque G), y la seccion **Pasos** con el orden de ejecucion. Revisado contra `.agents/RULES.md`, `.agents/CODING_STANDARDS.md` y `.agents/DESIGN.md`: queda en `READY` y la ejecucion espera la frase **"ejecuta el plan"**.

## Diagnostico (medido, no supuesto)

Medido en el dev server del usuario (`http://localhost:5173/`, viewport 408x640, `devicePixelRatio = 1.5`) y en el codigo real.

1. **El mapa no aprovecha la altura de la tarjeta.** La fila del About (`flex gap-6`) estira las dos tarjetas a **534 px** de alto (skills 534, mapa 534), pero dentro de la tarjeta del mapa el wrapper del mapa esta fijo en `h-72` (medido 252 px) mas la linea de la hora: quedan **~200 px de tarjeta vacios**. El cuerpo del `k-card` (`.content`, medido 320 px) no recibe la altura de la tarjeta: la cadena `h-full` no llega mas abajo de la raiz.
2. **La "baja calidad" del mapa es escalado de raster, y es medible.** Los tiles son `<img class="leaflet-tile">` con `naturalWidth = 256` y ancho CSS **256**, en una pantalla de **DPR 1.5**: el navegador agranda el bitmap 1.5x y ese es exactamente el desenfoque reportado. `detectRetina` esta en `false`, que es el default de Leaflet 1.9.4 (`node_modules/leaflet/dist/leaflet-src.js:12093`). Con la tarjeta a 92 px de ancho (el About perdio los prefijos `lg:`, ver "Concurrencia") el `fitBounds` cae en **zoom 9**.
3. **El marcador es un circulo, no un pointer.** `MapCard.vue` (antes `CaliMapCard.vue`) usa `L.circleMarker` de radio 7 con `#995CD0`.
4. **No existe recentrado.** Una vez arrastrado el mapa no hay forma de volver a Cali salvo recargar la pagina.
5. **CSS Grid no puede centrar una ultima fila incompleta.** `ProjectsSection.vue` usa `grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3` con **5** proyectos: fila 1 de 3 y fila 2 de 2 **pegadas a la izquierda**. Grid siempre coloca desde la columna 1; no hay propiedad que centre la fila sobrante. Y el estandar que lo resuelve, `flex-wrap: balance` (CSS Flexbox Level 2), **no esta implementado**: medido en el navegador del usuario, `CSS.supports('flex-wrap', 'balance') === false`.
6. **El ruido de TV tapa el contenido durante la navegacion (causa raiz).** `TvStaticBackground.vue:346` cambia a `z-1` mientras `isFlashVisible` (declarado en `src/composables/useStaticFlash.ts`, disparado por `App.vue:46` en cada navegacion de seccion y por `Navbar.vue:22` al cambiar el tema). Un elemento posicionado con `z-index: 1` se pinta en el **paso 7** del orden de pintado: por encima del texto (paso 5) y por encima de las secciones, que son `position: relative` con `z-index: auto` (paso 6). Estados actuales medidos: `TopGradualBlur` `fixed z-30`, `GlitchCursor` `fixed z-60`, ruido de TV `fixed -z-10` (en reposo) / `z-1` (en flash), terminal `fixed z-0`, `main` = `relative` con `z-index: auto` (**sin** contexto de apilado), contenido de `MainView` = `z-10` pero `position: static` (**el `z-10` no hace nada**).
7. **Prueba del punto 6, con el flash forzado.** Se forzo el estado de flash en el DOM (contenedor del ruido a `z-1`) y se capturo: el contenido del hero queda **tapado** (la capa se pinta por encima del `h1`). El DOM quedo restaurado al estado original (clase `-z-10 pointer-events-none fixed inset-0`, sin estilos inline).
8. **La seccion de Contacto no puede llenar su altura, ni con `h-full` ni con `flex-1` (medido).** `ContactSection.vue:15` es `relative flex min-h-[70vh] w-full`: un contenedor flex **en fila** cuya altura sale de `min-height`, no de `height`. Medido en el dev server (408x640, light): la seccion mide **448 px** (70vh) y su hijo directo (`:16`, `flex size-full flex-col gap-6 p-8`) queda en `flex: 0 1 auto` con **197.5 px** de alto. Dos causas concretas: (a) `height: 100%` se resuelve contra la altura del contenedor, y al ser indefinida (solo `min-height`) el navegador la trata como `auto`; (b) `flex-1` habria crecido en el eje **horizontal**, porque el `flex-direction` de la seccion es `row`. Por eso el titulo y los botones quedan pegados arriba y sobran ~250 px vacios (captura del usuario).
9. **El ruido de TV no reacciona al tema (causa raiz del pedido de contraste/brillo).** `TvStaticBackground.vue:283-284` fija `uContrast`/`uBrightness` **una sola vez**, dentro del `createProgram` del `onMounted`, a partir de los props (`:168-169`, `contrast: 1` / `brightness: 1.5`). No hay `watch(theme, ...)` ni watcher de props: cambiar de tema no vuelve a tocar el shader. El componente vecino si lo hace (`FaultyTerminalBackground.vue:306` `themeUniforms()`, `:333` `applyThemeUniforms()`, `:416` `watch(theme, ...)`), y ese es el patron a replicar. **Discrepancia registrada:** los defaults actuales del componente son `contrast: 1` / `brightness: 1.5` (justo los valores que el usuario pidio para light), no 0.5/0.5; el lado que cambia es **dark** (ver Bloque F, F2).
10. **Los logos de Softii y el monograma de Alytos desaparecen en light mode (medido).** `softii-white-DuLy8ruX.svg` es un SVG monocromo con **`fill="white"`** (unico fill aparte de `none`) renderizado con `filter: none`; el monograma de reemplazo de Alytos es un `<span class="text-5xl font-black text-white">` con `color: rgb(255, 255, 255)` medido (`ProjectCard.vue:44`). Sobre el fondo claro de la pagina los dos quedan invisibles. Los otros logos si se ven: `arqbs-logo-color.png` (raster a color), `red-brilla-logo-JBY3JAAS.svg` (`#E4002B` / `#FFB600`) y `logo_khatarsis.svg` (gradiente).
11. **La duracion del flash esta hardcodeada en 1500 ms.** `useStaticFlash.ts:19` (`flashOnNavigate`) y `:27` (`flashOnThemeToggle`) declaran `durationMs = 1500`, con el comentario de `:18` documentando ese valor. Ningun consumidor pasa argumentos (`App.vue:46` y `Navbar.vue:22` los llaman vacios), asi que el cambio es solo en el default y en el comentario.
12. **La banda superior si sigue la matematica de la fuente, pero no su calibracion (medido capa por capa en el DOM).** Los cinco niveles renderizados son `blur(3.15px) / 4.725 / 7.35 / 11.025 / 15.75` con mascaras escalonadas `transparent 0%, black 20%, black 40%, transparent 60%` (y las siguientes corridas 20% cada una). La formula coincide con la de vue-bits (`0.0625 * (curva(progreso) * divCount + 1) * strength`), pero hay tres desvios reales: **(a)** el proyecto tiene `html { @apply text-sm }`, o sea **1rem = 14px**, asi que todos los numeros en `rem` de la fuente salen 12.5% mas chicos (evidencia: la capa 1 calcula `0.225rem` y el navegador la pinta como **3.15px** = 0.225 x 14, no 3.6); **(b)** los props actuales (`strength 3`, `height 60px`, `curve ease-in`) no son los del preset `header` de la fuente (`height 8rem`, `curve ease-out`, `strength` default 2), y el resultado medido es una rampa de 3.15 a 15.75 px dentro de **60 px**, contra un maximo de 10.5 px dentro de 112 px en la fuente: ~1.5x mas fuerte en la mitad del recorrido; **(c)** faltan dos detalles de fidelidad: el contenedor no tiene `isolate` (medido `isolation: auto`) ni el wrapper interno `relative h-full w-full` con las capas `absolute inset-0`, y los stops se redondean a entero en vez de a un decimal.
13. **Las flechas del scrollbar las pinta la UA, no el tema (medido).** `document.documentElement` no declara `color-scheme` (computado `normal`), `::-webkit-scrollbar` y `::-webkit-scrollbar-button:single-button` resuelven a `background-color: rgba(0, 0, 0, 0)`, y solo el track lleva el token del tema (`rgb(255, 255, 255)` en light, `--color-scrollbar-track: #ffffff` / `#000000` en dark). Sin `color-scheme` y sin fondo propio, Chromium pinta la caja del boton con su paleta clara por defecto: ese es el cuadro blanco de la captura en dark. Las flechas en si ya son violeta del tema (`%23995CD0`, hover `%23B27FE3`): lo que falta es el fondo de su caja.
14. **El flujo paralelo del usuario renombro archivos que este plan nombra.** `CaliMapCard.vue` ya no existe: es `src/components/about/MapCard.vue` (y el reloj paso a ser un parrafo dentro del cuerpo de la card); `src/components/layout/SiteFooter.vue` es hoy `src/components/layout/FooterSection.vue`. En `MapCard.vue` el marcador sigue siendo `L.circleMarker` de radio 7 con la constante `MARKER_COLOR = '#995CD0'`, y el contenedor conserva `h-72`.

## Investigacion (fuentes consultadas)

**Mapa nitido (punto 2).** La causa es que el raster de 256 px se dibuja en 256 px CSS en pantallas HiDPI. `detectRetina: true` hace que Leaflet pida tiles del zoom siguiente y los dibuje a la mitad de tamano (una densidad 2x), que es la recomendacion del propio proyecto Leaflet para tiles borrosos (issue Leaflet#7341: "the best solution is to enable detectRetina"); es tambien el patron documentado por proveedores de mapas (MapTiler: "detectRetina/HiDPI"). Alternativa descartada por ahora: `tileSize: 128` + `zoomOffset: 1` fuerza 2x tambien en pantallas DPR 1, pero multiplica por 4 las peticiones de tiles a OSM (politica de uso); no se aplica.

**Fila de cards centrada (punto 5).** No existe una propiedad CSS que centre la ultima fila de un grid; las soluciones publicadas para grid son trucos con `:nth-child`/`:nth-last-child` y `grid-column` que dependen del conteo exacto (Stack Overflow 46276793; css-irl.info "Controlling Leftover Grid Items with Pseudo-selectors"). Con **flexbox** el problema desaparece: con `flex-wrap: wrap` + `justify-content: center` cada linea usa el espacio sobrante a los lados, y la ultima fila queda centrada **sin saber cuantas cards hay** (CSS-Tricks "A Complete Guide to Flexbox"; MDN `justify-content`; SO 18744164 "Flex-box: Align last row to grid"; webdevvisuals "Responsive Flexbox Cards with No Media Queries"). Es la tecnica que se adopta.

## Cambios propuestos

### Bloque A — Capas de fondo: el ruido nunca tapa el contenido (punto 6)

Contrato de apilado explicito (comentado en el codigo), con `main` como contexto de apilado para que ningun `z-index` negativo se escape:

| Elemento | Ahora | Propuesto | Por que |
| --- | --- | --- | --- |
| `main` (`App.vue`) | `relative min-h-screen` | `relative isolate min-h-screen` | contexto de apilado propio |
| `FaultyTerminalBackground.vue:504` | `fixed inset-0 z-0` | `fixed inset-0 -z-20` | fondo mas bajo: paso 2 del orden de pintado |
| `TvStaticBackground.vue:346` | `fixed inset-0 -z-10` / `z-1` | `fixed inset-0 -z-30` en reposo / `-z-10` en flash | el flash cubre al terminal pero **nunca** al contenido |
| `MainView.vue` raiz | `z-10 flex h-full flex-col` (static) | `relative z-10 flex h-full flex-col` | el `z-10` recien ahi tiene efecto |

Efecto: durante el flash la capa de ruido queda por encima del canvas del terminal (que es opaco, asi que el efecto sigue viendose) y **por debajo de todo el contenido** (texto, tarjetas, footer), asi que el scroll y el contenido siguen visibles. Ninguna seccion tiene fondo propio (verificado), asi que el ruido se sigue viendo por detras.

Verificacion del paso: si Tailwind no emitiera `-z-20` / `-z-30` (la escala numerica de `z-index` es dinamica en v4), usar la forma explicita `z-[-20]` / `z-[-30]`, que no depende de la escala.

**Consecuencia confirmada por el usuario el 2026-09-11 (D1):** `isFlashVisible` tambien es el que dispara el flash al pasar el mouse por los enlaces sociales del hero (`HeroSection.vue:83-84`). Con este contrato ese efecto pasa a ser tambien "solo fondo" (hoy tapa la pantalla completa). Es exactamente lo pedido ("siempre se debe mostrar por detras"), pero es un cambio de comportamiento visible del hero.

### Bloque B — El mapa toma la altura disponible (punto 1)

`src/components/about/AboutSection.vue`
- La fila de skills + mapa pasa de `flex gap-6` a `flex flex-col gap-6 lg:flex-row` (en pantallas angostas el mapa va debajo y a todo el ancho; hoy a 408 px la tarjeta mide 92 px). Los `basis-*` de las dos tarjetas se mueven a `lg:basis-2/3` / `lg:basis-1/3` (70/30 como pidio el usuario).
- La fila de la foto + texto (`flex items-center gap-6`, sin prefijos) pasa a `flex flex-col items-start gap-6 lg:flex-row lg:items-center`: hoy la foto de 240 px y el texto comparten una fila a cualquier ancho, y a 408 px quedan apretados. El `w-60` de la foto no cambia.

`src/components/about/MapCard.vue`
- Raiz `k-card` con la clase nueva `cali-map-card` (sin `h-full`: medido, la fila `flex gap-6` ya la estira a 533 px y su `display` ya es `flex` con `flex-direction: column`; lo que falta es que crezcan sus hijos).
- El `div.flex.flex-col.gap-4` que hoy envuelve el mapa y la linea de la hora suma la clase `cali-map-body` (es el eslabon intermedio de la cadena de altura).
- Wrapper nuevo del mapa: `div.cali-map-wrap.relative.isolate.flex-1` **alrededor** del contenedor de Leaflet, como hijo del `cali-map-body`; es el que evita que el boton de recentrado viva dentro del subarbol que Leaflet muta (ver Bloque D).
- Contenedor del mapa: `ref="mapContainer"` con `cali-map h-full w-full overflow-hidden rounded-lg` (se quita `h-72`).
- La linea de la hora queda como esta (no se toca el texto).

`src/style.css` (bloque del mapa; los selectores se derivaron de la cadena real medida en el DOM, no de suposiciones)
Cadena actual medida a 408 px de ancho: `section.card` (raiz del `k-card`) es `display: flex; flex-direction: column` y mide **533 px** (estirada por la fila); dentro hay `header` **54 px** y `.content` (`display: flex`, `flex-direction: column`, `flex: 0 1 auto`) **320 px**; dentro del cuerpo, `div.flex.flex-col.gap-4` **313 px** y `.cali-map` **252 px** (`h-72`). Conclusion: **hoy sobran 213 px dentro de la tarjeta** y el eslabon que no crece es `.content`.
- No hace falta forzar `display: flex` en la raiz del `k-card` (ya es columna). Las tres reglas que faltan:
```css
.cali-map-card > .content { flex: 1 1 auto; min-height: 0; }
.cali-map-card .cali-map-body { flex: 1 1 auto; min-height: 0; }
.cali-map-card .cali-map { flex: 1 1 auto; min-height: 224px; }
```
- Efecto esperado de la cadena: `.content` pasa de 320 px a ~479 px (533 menos el header de 54 px) y el mapa absorbe el sobrante hasta su `min-height` cuando la fila pasa a columna.
- La `min-height` va **en px a proposito**: en este proyecto `1rem = 14px` (`html { @apply text-sm }`), asi que `16rem` no son 256 px sino 224 px, y el numero esconde la escala. Las utilidades Tailwind no sirven para esta cadena porque el build completo de Tailwind que publica `khatarsis` gana el orden dentro de `@layer utilities` (causa raiz medida en el plan `portfolio-mapa-scrollspy-flash-zindex`).

`ResizeObserver` en el contenedor del mapa
- `resize()` → `map.invalidateSize()`. En el **primer** tamano no-cero, `fitBounds(CALI_BOUNDS)`: la tarjeta ya no tiene altura fija, asi que Leaflet puede inicializar con la caja a 0 px y elegir un zoom basura. Los cambios posteriores de tamano solo preservan centro/zoom del usuario. Se desconecta en `onBeforeUnmount`.

Resultado esperado: mapa de ~420 px de alto en la fila actual (533 px de tarjeta menos header, padding y linea de hora), sin overflow y con la linea de la hora intacta.

### Bloque C — Calidad del mapa (punto 2)

`src/components/about/MapCard.vue`
- `L.tileLayer(TILE_URL, { maxZoom: 19, attribution, detectRetina: true })`. Con `detectRetina` Leaflet sube el `zoomOffset` y baja el `maxZoom` mostrado a 18; el mapa pide tiles del zoom siguiente y los dibuja a 128 px CSS, o sea densidad 2x. Es el mismo cambio que resuelve el desenfoque en pantallas DPR > 1 (medido: DPR 1.5 en la maquina del usuario).
- Efecto secundario esperado y medible: al crecer la tarjeta (Bloque B) el `fitBounds` elige un zoom mas alto, asi que Cali deja de verse como una mancha de pocos pixeles.
- **No se toca** el filtro de tema del mapa (`.dark .cali-map .leaflet-tile-pane` en `style.css`); es el arreglo ya verificado y no forma parte del reporte de hoy.

### Bloque D — Pin de recentrado (puntos 3 y 4; color actualizado a morado)

> El usuario corrigio el color el 2026-09-11: **el pointer va morado, no rojo** ("que el pointer del mapa si sea morado no rojo"). Se descarta el `#EA4335` de la primera version del plan.

`src/components/about/MapCard.vue`
- Reemplazar `L.circleMarker` por `L.marker(CALI_CENTER, { icon: L.divIcon({...}) })` con un SVG inline en forma de gota (estilo Google Maps): relleno **`#995CD0`** (el violeta que ya usa el marcador actual y el token `--color-scrollbar-thumb` en dark), circulo interior blanco (`#ffffff`, radio ~3.5 en un viewBox 24x34), contorno oscuro suave y una sombra tenue. `iconSize: [30, 42]`, `iconAnchor: [15, 42]` (la punta sobre la coordenada exacta), `className: 'cali-pin'` y `title`/`alt` para lectores de pantalla. Se elimina la constante `MARKER_COLOR`.
- CSS defensivo en `style.css`: `.cali-map .cali-pin { background: none; border: 0; }` (el `divIcon` por defecto trae caja blanca y borde).
- **Boton de recentrado**, como overlay del wrapper (no dentro del div de Leaflet: Leaflet muta ese subarbol y Vue no debe patchear ahi):
  - `k-button` con `icon="mdi:crosshairs-gps"`, `icon-only`, `text`, `type="button"`, clases `absolute top-2 right-2 z-[1000]` (la capa de controles de Leaflet empieza en 1000; el wrapper tiene `isolate`, asi que el `z-index` no se escapa) y `:aria-label="t('about.mapRecenter')"`.
  - Estado `isMoved` (ref): el boton se muestra solo si el mapa se fue de Cali. Se actualiza en `moveend` y en `zoomend` comparando `map.getCenter().distanceTo(L.latLng(CALI_CENTER)) > 1500` metros **o** `map.getZoom() < initialZoom`. Al hacer click: `map.fitBounds(CALI_BOUNDS, { padding: [8, 8] })` y se oculta.
  - Umbral y zoom inicial quedan como constantes nombradas y comentadas (por que 1500 m: dentro de ese radio el usuario sigue viendo el casco urbano).
- i18n `src/i18n/locales/es.ts` + `en.ts`: clave nueva `about.mapRecenter` (es: "Centrar en Cali", en: "Center on Cali"). Paridad 55/55.

### Bloque E — Reparto de las cards de proyectos (punto 5)

Opciones investigadas. **D2 quedo resuelta el 2026-09-11**: el usuario pidio que la fila incompleta se **centre** ("no que respete los huecos del elemento que deberia ir en el faltante"), asi que se implementa **E1 + E2** y el resto queda descartado con motivo.

**E1 (elegida) — Grid actual + reglas de viudas: mantiene el grid y centra la ultima fila.**
Es la tecnica canonica documentada por Michelle Barker (CSS { In Real Life }, "Controlling Leftover Grid Items with Pseudo-selectors", 2019): se duplica el numero de tracks y cada item ocupa dos, asi que la fila sobrante se puede correr con `grid-column-end` sin abandonar la colocacion automatica.

```css
.projects-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1.5rem;
}
.projects-grid > * { grid-column: span 2; }
/* 2 viudas: la pareja se centra */
.projects-grid > *:last-child:nth-child(3n - 1) { grid-column-end: -2; }
.projects-grid > *:nth-last-child(2):nth-child(3n + 1) { grid-column-end: 4; }
/* 1 viuda: se centra sola */
.projects-grid > *:last-child:nth-child(3n - 2) { grid-column-end: 5; }
```
- Ventajas: no cambia la proporcion de las columnas (sigue siendo `1fr`, o sea el mismo ancho de card que hoy), funciona con cualquier conteo (5 → 3+2 centradas, 6 → 3+3, 4 → 3+1 centrada, 7 → 3+3+1 centrada), y no hace falta saber cuantas cards hay.
- Limite honesto: son tres reglas con aritmetica de "3 columnas"; si el breakpoint cambia a 2 columnas hay que rehacerlas (ver E2). El autor advierte ademas que no se combina con `auto-fit`/`auto-fill`.

**E2 (se implementa junto con E1) — E1 responsive (2 columnas y 1 columna).**
Mismo esquema por breakpoint: `>=64rem` 6 tracks con las reglas `3n`; `>=40rem` 4 tracks y una sola regla de viuda (`*:last-child:nth-child(odd) { grid-column-end: -2; }`, que con `span 2` deja la card par en los tracks 2-3, o sea centrada); por debajo, `grid-template-columns: 1fr` sin reglas (una sola columna nunca tiene viudas). Es un bloque CSS mas largo, pero deja el reparto determinista en los tres tamanos.

**E3 (descartada: el pedido es centrar, no estirar la ultima card) — Grid con `repeat(3, minmax(0, 1fr))` + la ultima fila a ancho completo.**
La variante "sin trucos": `*:last-child:nth-child(3n - 2) { grid-column: 1 / -1 }` (una viuda ocupa toda la fila) y la pareja se centra con `grid-column-end` como en E1. Menos reglas que E1, pero la ultima card queda mas ancha que las demas y atrae mas atencion (el propio articulo de CSS-IRL desaconseja esto cuando no es la intencion).

**E4 — Flex con `justify-content: center` y anchos calculados.**
La que ya fue rechazada; se deja escrita para no perderla: `display: flex; flex-wrap: wrap; justify-content: center; gap: 1.5rem` + `> * { width: calc((100% - 3rem) / 3) }` (`1.5rem` y `100%` por breakpoint).

**E5 (descartada: el pedido es centrar, no repartir el ancho) — Flex que se estira: la fila sobrante ocupa todo el ancho.**
`display: flex; flex-wrap: wrap; gap: 1.5rem` + `> * { flex: 1 1 20rem }` sin tope: cero reglas de conteo y siempre ocupa el ancho, pero con 5 cards las dos ultimas quedan al doble de ancho que las tres primeras (en 1920 px, ademas, entrarian 4-5 en una sola fila).

**E6 (descartada: el pedido es centrar y no meter layout en JS) — Repartir las filas en JS.**
Un composable calcula el numero de columnas (`matchMedia`/`ResizeObserver`) y renderiza una fila centrada por grupo. Determinista y sin aritmetica CSS, pero mete logica de layout en JavaScript: mas codigo, mas superficie de bug y peor SSR/prerender (relevante si algun dia se hace el prerender que quedo pendiente en `portfolio-seo-metadata.md`). No recomendada.

**Descartadas con motivo medido:**
- `flex-wrap: balance` (lo que el estandar promete para exactamente este caso, en CSS Flexbox Level 2): **no implementado**; medido en el navegador del usuario, `CSS.supports('flex-wrap', 'balance') === false`.
- Grid `auto-fit`/`auto-fill` + viudas: imposible, el conteo por fila no se conoce (fuente: CSS-IRL, misma seccion de conclusiones).
- `grid-template-rows: masonry` / `grid-template-rows: masonry` de nivel 3: no implementado en navegadores estables.
- `display: inline-block` + `text-align: center` en el contenedor: centra la ultima fila, pero pierde alturas iguales entre cards y depende de los espacios en blanco del HTML.

`ProjectCard.vue` no cambia en E1/E2: el `h-full` de sus wrappers sigue funcionando y las cards de una misma fila conservan la misma altura (en grid por `align-items: stretch` de la celda).

La opcion elegida (E1 + E2) se implementa como clases en `src/style.css` y no como utilidades Tailwind, por la causa raiz de capas ya medida (Bloque B).

**Nota medida sobre `rem` en media queries (para no equivocarse de breakpoint).** En este proyecto la raiz es de **14px**, pero el `rem` **dentro de `@media`** no depende de ella: usa el valor inicial (16px). Comprobado en el navegador cambiando `html { font-size }` a 32px: `matchMedia('(min-width: 20rem)').matches` no cambio (siguio siendo `true` a 408 px de viewport, cuando con la raiz como referencia habria pasado a `false`). O sea que `40rem` = **640 px** y `64rem` = **1024 px**, igual que los `sm`/`lg` de Tailwind: las reglas del grid pueden usar esos dos numeros sin compensar nada. Distinto es el `rem` de una propiedad normal (por ejemplo la altura del `GradualBlur`), que si se calcula con los 14px de la raiz.

### Bloque F — Segunda tanda (2026-09-11): flash de 800 ms, ruido por tema, logos en light y altura de Contacto

Cuatro ajustes pedidos despues de revisar la pagina viva. Cada uno corresponde a un punto medido del Diagnostico (8 a 11).

**F1 — Flash de 800 ms (`src/composables/useStaticFlash.ts`).**
- `flashOnNavigate(durationMs = 800)` (`:19`) y `flashOnThemeToggle(durationMs = 800)` (`:27`); el comentario de `:18` pasa a documentar 0.8 s. El valor anterior era 1500 ms (medido 1502 ms en tema y 1515 ms en navegacion en el plan `portfolio-mapa-scrollspy-flash-zindex`).
- Sin cambios de estructura: los dos temporizadores ya limpian y reinician su `setTimeout`, asi que dos disparos seguidos cuentan desde el ultimo.
- El flash de hover del hero (`setHover`) **no** tiene duracion: es estado mientras el puntero esta encima. No se toca.
- El cambio es exacto y no hay transicion CSS que lo estire: el canvas del ruido no declara `transition` (verificado en `TvStaticBackground.vue`), asi que el contenedor pasa a su clase de flash y vuelve a la de reposo dentro de esos 800 ms.

**F2 — Contraste y brillo del ruido por tema (`src/components/background/TvStaticBackground.vue`).**
- Props: `contrast: 0.5` y `brightness: 0.5` pasan a ser los **defaults** (dark) y se agregan `lightContrast: 1` y `lightBrightness: 1.5` para light. Es el mismo patron que ya usa `FaultyTerminalBackground.vue` (base = dark, `light*` = override de light), para no invertir la convencion dentro del mismo directorio.
- `themeUniforms()` local que devuelve `{ uContrast, uBrightness }` segun `theme.value`; se usa en el `createProgram` del `onMounted` (reemplaza `:283-284`) y en un `applyThemeUniforms()` que hace `program.setUniform(...)` y **repinta** cuando el bucle esta detenido (`prefers-reduced-motion` o `pause`), calcado de `FaultyTerminalBackground.vue:333`.
- `watch(theme, applyThemeUniforms)` (mismo patron de `:416`), importando `useTheme` desde `@/composables/useTheme`.
- **Decision registrada, con el aviso que corresponde:** hoy los defaults del componente son `contrast: 1` / `brightness: 1.5`, no 0.5/0.5. Con la redaccion literal del pedido, **light queda igual que hoy** (1 / 1.5) y **dark baja a 0.5 / 0.5**, o sea el flash deja de ser una capa de nieve blanca casi a pleno y se ve mas apagado. Si la intencion era la inversa (light mas suave y dark como esta), el cambio es intercambiar los cuatro valores; queda anotado como decision confirmable en la revision visual.
- El efecto se percibe solo durante el flash: en reposo el canvas del ruido queda por detras del canvas del terminal, que es opaco (medido en el plan anterior).

**F3 — Logos en tinta sobre light mode (`src/data/portfolio.ts`, `src/components/projects/ProjectCard.vue`, `src/style.css`).**
- `interface Project` gana el campo opcional `lightInkLogo?: boolean` con su comentario ("logo monocromo blanco: se pinta en tinta sobre light"), y el proyecto `Softii` (`:147-152`) lo declara. El dato vive junto al resto de la informacion de proyectos y evita adivinar por la URL del asset.
- `ProjectCard.vue`: la `img` (`:37-42`) suma `:class="{ 'project-logo-light-ink': props.project.lightInkLogo }"`; el monograma de reemplazo (`:44`) pasa de `text-white` a `text-black dark:text-white` (Alytos usa ese fallback porque su `image` es `''`).
- `src/style.css`: `:root:not(.dark) .project-logo-light-ink { filter: brightness(0); }`. Una sola regla, sin `dark:` ni `@apply`, para no caer en el problema de orden de capas ya medido. `brightness(0)` sobre un `fill="white"` da negro puro, conserva la transparencia del SVG y no toca a los logos a color (por eso se prefiere a `invert`, que invertiria cualquier asset marcado por error).
- No se tocan los otros tres logos: ya son a color y no forman parte del pedido.

**F4 — El Contacto si llena su altura (`src/components/contact/ContactSection.vue`).**
- La seccion (`:15`) pasa a `relative flex min-h-[70vh] w-full flex-col`: el eje de crecimiento tiene que ser vertical para que `flex-1` signifique "alto".
- El wrapper (`:16`) pasa de `flex size-full flex-col gap-6 p-8` a `flex flex-1 flex-col gap-6 p-8`: se quita el `size-full` (que era el que no hacia nada) y el crecimiento queda explicito.
- El contenedor de los enlaces (`:21`) pasa de `flex h-full ...` a `flex flex-1 ...`, conservando `items-center justify-center`: los botones quedan centrados en el espacio que sobra debajo del titulo en vez de pegados arriba.
- Resultado esperado medible a 408x640: la seccion sigue midiendo 448 px, el wrapper pasa de **197.5 px a 448 px** y el bloque de enlaces ocupa el resto (~330 px) con los botones centrados verticalmente.
- Esto no contradice el diseno: el Contacto es la ultima seccion antes del footer y hoy es la unica del recorrido que no reparte su altura.

### Bloque G — Tercera tanda (2026-09-11): GradualBlur de navbar y footer, pin morado, cards centradas y scrollbar tematica

Cinco ajustes pedidos despues de revisar la pagina viva. Cada uno corresponde a un punto medido del Diagnostico (12 a 14) o a una decision del usuario.

**G1 — Un solo `GradualBlur` con `position: 'top' | 'bottom'` (reemplaza a `TopGradualBlur.vue`).**
- Nuevo `src/components/layout/GradualBlur.vue` que conserva la matematica de la fuente **verbatim**: direccion por posicion (`to top` / `to bottom`), `progress = curva(indice / divCount)`, `blur = 0.0625 * (progress * divCount + 1) * strength` en `rem`, stops escalonados `transparent p1, black p2[, black p3][, transparent p4]` con redondeo a **un decimal** (`Math.round(x * 10) / 10`), y por capa `backdropFilter` + `WebkitBackdropFilter` + `maskImage` + `WebkitMaskImage`.
- Del fuente se omiten, con motivo: `presets` (cada uso fija sus valores en el template), `responsive` + `mobileHeight/tabletHeight/desktopHeight` y los `*Width` (no hay diseno por tamano para estas dos bandas), `animated` / `animated: 'scroll'` + `IntersectionObserver` + `isVisible` + `onAnimationComplete` (las dos bandas son estaticas), `hoverIntensity` (no hay hover), `injectStyles` (las dos reglas van al bloque del componente en `style.css`), `className` / `style` como props, el `slot` y los `PRESETS` completos.
- Lo que **si** se conserva y hoy falta (Diagnostico 12c): `relative isolate` en el contenedor, el wrapper interno `relative h-full w-full` con las capas `absolute inset-0`, y el redondeo a un decimal de los stops.
- API final: `position: 'top' | 'bottom'`, `height`, `strength`, `divCount`, `curve`, `opacity`, `zIndex` y `fixed?: boolean`. `fixed` reemplaza al `target: 'parent' | 'page'` de la fuente (que ademas sumaba +100 al `zIndex`): `false` = `position: absolute` dentro del contenedor relativo (footer), `true` = `position: fixed` en el viewport (navbar). Para las dos posiciones verticales el contenedor se ancla con `left: 0; right: 0` y el borde pedido.
- No lleva compuerta de reduced motion: es decoracion estatica sin transiciones ni animacion (mismo criterio que el componente actual).
- `TopGradualBlur.vue` se **elimina**: el nuevo componente es su unico reemplazo y no tiene otros consumidores (verificado por grep: solo `App.vue:5` y `:61`).

**G2 — Calibracion de la banda del navbar a los valores de la fuente.**
- Hoy: `strength 3`, `height 60px`, `curve ease-in` → medido `3.15 / 4.725 / 7.35 / 11.025 / 15.75 px` en 60 px de alto.
- Fuente (preset `header`): `height 8rem`, `curve ease-out`, `strength 2`. Con la raiz a 14px, ese preset da exactamente estas capas, que son el **objetivo verificable** del paso: `4.9 / 7.35 / 9.1 / 10.15 / 10.5 px` (maximo 10.5 px) y `height` = 112 px.
- Sobre el tamano fisico: en la fuente `8rem` son 128 px, aca son 112 px. Se adoptan los numeros literales igual, porque la proporcion rampa/altura se conserva (el blur tambien se calcula en `rem`, o sea tambien escala con la raiz). Si en la revision visual se prefiere el tamano fisico de la fuente, es `height: 128px`; queda en D6.
- Se conserva `zIndex` **30** (debajo del navbar `z-40`), distinto del 1000/1100 de la fuente, porque aca el texto del navbar no debe difuminarse.
- `App.vue` cambia el import y el uso: `<gradual-blur fixed position="top" :z-index="30" />` (se quita la clase `z-30`, que pasa a ser una prop explicita).

**G3 — Banda del footer (decision del usuario, 2026-09-11).**
- Va **dentro** del footer, anclada a su borde **inferior** (`absolute; bottom: 0; left: 0; right: 0`) con `position="bottom"`: la niebla es maxima en el bottom del footer y se desvanece hacia arriba. Es el mismo comportamiento que el navbar, en el borde opuesto de la pagina (textual del usuario: "empiece desde el bottom del footer hacia el top del mismo no importa si toca o no contactos").
- `pointer-events-none` y `aria-hidden`: es decoracion. El footer hoy no tiene fondo propio (medido `rgba(0, 0, 0, 0)` con `backdrop-filter: blur(8px)`), asi que la banda solo agrega el degradado de blur del efecto sobre el canvas de fondo.
- **Cuidado de apilado, medido (misma trampa que el Diagnostico 6):** el footer mide 158 px, tiene `position: relative` con `isolation: auto`, y su unico hijo (`div.flex.w-full.items-center.justify-between.gap-6.p-8`) es **static** con `z-index: auto`. Una banda posicionada con `z-index: 0` se pinta por encima de ese contenido estatico. Por eso el footer suma `isolate`, la banda va con `-z-10` y el div de contenido con `relative z-10`: la banda queda como fondo, nunca encima de los enlaces ni del copyright.
- Altura alineada al preset `footer` de la fuente (`8rem` = 112 px, ver G2). Como el footer mide 158 px, la banda cubre la mayor parte: si en la revision visual se ve demasiado, se baja a `6rem` (84 px) y queda anotado en D6.
- CSS de apoyo en `style.css`: `.gradual-blur { pointer-events: none; }` y `.gradual-blur-inner { pointer-events: none; }` (la fuente los inyecta con `injectStyles`, que se omite; ver G1).

**G4 — Cards: la fila incompleta se centra.**
- Es el **Bloque E resuelto**: E1 (grid de 6 tracks con reglas de viuda) + E2 (la misma logica a 2 columnas). E3, E5 y E6 quedan descartadas por el pedido de centrar. No hay cambios nuevos que agregar aca: el detalle tecnico vive en el Bloque E.

**G5 — El pin del mapa en morado.**
- Ya esta detallado en el Bloque D (actualizado). Resumen: gota con `iconAnchor` en la punta, relleno `#995CD0`, interior blanco y contorno oscuro; se elimina la constante `MARKER_COLOR` por quedar sin uso.

**G6 — Las flechas del scrollbar siguen el tema.**
- Causa medida (Diagnostico 13): el `<html>` no declara `color-scheme` y las cajas del boton son transparentes, asi que Chromium las pinta con su paleta clara.
- Cambios en `src/style.css`: `::-webkit-scrollbar { @apply size-3 bg-scrollbar-track; }` (hoy no declara fondo), fondo explicito del token en `::-webkit-scrollbar-button:single-button` y `color-scheme: light` en `:root` / `color-scheme: dark` en `:root.dark`, que es el arreglo canonico de las partes nativas.
- Riesgo honesto: `color-scheme` es global y tambien cambia el color de controles nativos y el fondo por defecto del lienzo del documento. El proyecto no tiene `input`/`select` propios, asi que el radio de impacto es chico; si el resultado no gusta en la revision visual, el arreglo quirurgico (los dos `background-color` de los pseudo-elementos) alcanza por si solo y se puede quitar el `color-scheme`.
- Las flechas ya usan el violeta del tema (`%23995CD0`, hover `%23B27FE3`): no se tocan.

### Bloque H — Archivos tocados

Nuevo: `src/components/layout/GradualBlur.vue`. Eliminado: `src/components/layout/TopGradualBlur.vue` (reemplazado por el anterior, sin otros consumidores). Editados: `src/components/about/MapCard.vue` (antes `CaliMapCard.vue`), `src/components/about/AboutSection.vue`, `src/components/background/FaultyTerminalBackground.vue` (1 clase), `src/components/background/TvStaticBackground.vue` (1 clase + props y uniformes por tema), `src/components/layout/FooterSection.vue` (banda del footer), `src/views/MainView.vue` (1 clase), `src/App.vue` (import y props del blur + 1 clase), `src/components/projects/ProjectsSection.vue` (clases del reparto centrado), `src/components/projects/ProjectCard.vue` (2 clases), `src/components/contact/ContactSection.vue` (3 clases), `src/composables/useStaticFlash.ts` (2 defaults + comentario), `src/data/portfolio.ts` (1 campo opcional + 1 dato), `src/style.css` (bloques del mapa, del reparto de cards, del scrollbar y del gradual blur), `src/i18n/locales/es.ts`, `src/i18n/locales/en.ts`.

Fuera de alcance: no se instala ni actualiza ninguna dependencia; no se toca el filtro oscuro del mapa, el CRT ni la metadata/SEO (`portfolio-seo-metadata.md`). Del navbar solo cambia la banda de blur (nada de su estructura, sus enlaces ni el toggle de tema) y del footer se agrega la banda, sin tocar sus enlaces, su logo ni el copyright. El contenido i18n existente no se reescribe.

## Pasos (orden de ejecucion)

1. `src/composables/useStaticFlash.ts`: los dos defaults a 800 ms y el comentario (F1).
2. `src/components/background/TvStaticBackground.vue`: props + `themeUniforms()` + `applyThemeUniforms()` + `watch(theme, ...)` (F2).
3. `src/data/portfolio.ts` y `src/components/projects/ProjectCard.vue`: `lightInkLogo` y las dos clases de logo en light (F3).
4. `src/components/contact/ContactSection.vue`: las tres clases del reparto vertical (F4).
5. `src/components/layout/GradualBlur.vue` nuevo; `src/App.vue` cambia el import y el uso; `src/components/layout/FooterSection.vue` suma la banda con su `isolate` y el `relative z-10` del contenido; se elimina `TopGradualBlur.vue` (G1, G2, G3).
6. `src/style.css`: reglas del gradual blur y del scrollbar (G3, G6).
7. `src/components/background/FaultyTerminalBackground.vue`, `src/App.vue` y `src/views/MainView.vue`: el contrato de capas (Bloque A).
8. `src/components/about/MapCard.vue` + `src/components/about/AboutSection.vue` + `src/style.css`: cadena de altura, `detectRetina`, pin morado con `divIcon` y boton de recentrado (Bloques B, C, D).
9. `src/components/projects/ProjectsSection.vue` + `src/style.css`: el grid con las reglas de viuda (E1 + E2).
10. i18n: la clave `about.mapRecenter` en `es.ts` y `en.ts` (Bloque D).
11. Formatear los archivos tocados, correr la verificacion real y registrar el cierre (DoD).

## Verificacion

- Autorizacion necesaria (la anterior era para otro vuelo de trabajo): `bun run lint:check`, `bun run format:check`, `bun run build`.
- **Mapa (DOM, dev server del usuario):** alto del `.cali-map` ≈ alto de la tarjeta menos chrome (objetivo >= 380 px en la fila actual, hoy 252 px), `.cali-map-card > .content` creciendo de 320 px a ~479 px, `.cali-map` con `min-height: 224px`, y a 408 px de ancho la tarjeta ya no mide 93 px (pasa a ancho completo debajo de skills).
- **Calidad:** `tile.naturalWidth / tile.getBoundingClientRect().width === 2` con `detectRetina` activo en DPR 1.5, y subida del zoom de tile respecto al valor medido hoy (9) tras agrandar la tarjeta.
- **Pin:** `document.querySelector('.cali-pin')` existe, mide 30x42 y su punta cae en la coordenada de Cali; cero `.leaflet-interactive` con `r=7`.
- **Recenter:** simular arrastre con `map.panBy([400, 300])` desde la consola del navegador -> aparece el boton; click -> el centro vuelve dentro de `CALI_BOUNDS` y el boton se oculta.
- **Cards:** con 5 cards a >=1024 px, la 1a/2a/3a en la fila 1 y la 4a/5a simetricas respecto al centro del contenedor (`getBoundingClientRect().left` medidos, no pegadas a la izquierda); con 6 y con 4 el reparto sigue siendo correcto (prueba temporal quitando una card o con el arreglo de datos).
- **Apilado (el punto del reporte):** con el flash forzado, el primer elemento en `document.elementsFromPoint` sobre el `h1` del hero debe ser el texto (hoy es la capa de ruido); y en reposo, el terminal sigue visible como fondo.
- **Flash:** a 800 ms, medido por polling del `classList` del contenedor del ruido tanto al cambiar de tema como al navegar desde el navbar: el regreso a la clase de reposo debe caer entre 750 y 900 ms (hoy 1502 ms y 1515 ms).
- **Ruido por tema:** el cambio de tema debe volver a escribir `uContrast`/`uBrightness`. El pixel no es legible (canvas WebGL sin `preserveDrawingBuffer`, ver el plan anterior), asi que se verifica en dos partes: (a) que el `watch` dispare un `setUniform` en cada cambio de tema y (b) que el helper devuelva 1 / 1.5 en light y 0.5 / 0.5 en dark, ejercitandolo desde la consola del navegador con el mismo codigo.
- **Logos en light:** `getComputedStyle(softiiImg).filter === 'brightness(0)'` y el monograma con `color: rgb(0, 0, 0)`; en dark, `filter: none` y `rgb(255, 255, 255)`.
- **Contacto:** a 408x640, el alto del wrapper (`:16`) iguala el de la seccion (448 px, hoy 197.5 px) y el bloque de enlaces queda centrado verticalmente en el espacio restante, sin scroll extra ni overflow.
- **GradualBlur (paridad con la fuente):** ejecutar en la consola el algoritmo de vue-bits con los props de cada banda y diffear capa por capa contra `getComputedStyle(capa).backdropFilter` y `maskImage`; con el preset `header`/`footer` las capas esperadas son `4.9 / 7.35 / 9.1 / 10.15 / 10.5 px`. Ademas el contenedor debe reportar `isolation: isolate`, el wrapper interno debe existir (`h-full w-full`) y el numero de capas debe ser `divCount`. Hoy el mismo chequeo da la matematica correcta pero con la calibracion vieja (Diagnostico 12).
- **Apilado del footer:** con el copyright del footer como blanco, el primer elemento en `document.elementsFromPoint` debe ser el texto y no la banda (hoy el footer esta con `isolation: auto` y su contenido es static: hay que confirmar que `isolate` + `-z-10` + `relative z-10` lo resuelven).
- **Banda del footer:** la ultima capa (la mas fuerte) debe tener su banda opaca pegada al borde inferior del footer (`transparent 80%, black 100%` con direccion `to bottom`), el contenedor debe medir la altura pedida con `bottom: 0`, y el blur maximo debe caer en el bottom del footer.
- **Scrollbar:** en dark, el track y la caja del boton deben resolver al token del tema (`#000000`) y `getComputedStyle(document.documentElement).colorScheme` debe devolver `dark`; la caja del boton no es legible por DOM (la pinta la UA), asi que se confirma en el navegador del usuario comparando el antes y el despues de la captura.
- **Pin del mapa:** el SVG de la gota debe tener relleno `#995CD0` (no `#EA4335`) y cero `.leaflet-interactive` con `r=7`.
- **Revision visual** light y dark en la pagina del usuario, con el flash ya en 800 ms, el reparto nuevo del Contacto, el blur de las dos bandas y las flechas del scrollbar.

## Riesgos y concurrencia

- **Otro flujo (el usuario) edita en paralelo** `AboutSection.vue`, `MainView.vue`, `MapCard.vue`, `FooterSection.vue`, `TvStaticBackground.vue`, `ContactSection.vue`, `ProjectCard.vue` y `ProjectsSection.vue` (ver el plan anterior). Antes de editar, releer los archivos: el ejecutor debe integrar sobre el estado real, no sobre lo que dice este plan.
- `MainView.vue` tiene hoy dos defectos del flujo paralelo en la misma linea que este plan toca: `fle` (falta la `x` de `flex`) y `z-10` sin `position`. Se corrigen en el Bloque A.
- El About perdio los prefijos responsive (`lg:`): el Bloque B los repone. Si el usuario ya los repuso a mano, el paso se salta sin conflicto.
- Cambiar el apilado puede afectar cualquier lugar donde hoy el canvas del terminal se ve por encima de algo; se verifica con la revision visual de todas las secciones.
- El Bloque F toca archivos del flujo paralelo del usuario (`ContactSection.vue`, `ProjectCard.vue`, `data/portfolio.ts`, `TvStaticBackground.vue`). Releerlos antes de editar: el estado real manda sobre lo que dice este plan. Al leer el disco hoy, el `lightBackground` del terminal volvio a `#fff` (el `#2b2a2a` de la tanda anterior ya no esta en el archivo) y el canvas volvio a `z-0`: se toma como estado vigente y no se revierte nada de eso.
- Las dos bandas del Bloque G conviven con el contrato de capas del Bloque A: la del navbar queda en `z-30` (encima del contenido y debajo del navbar `z-40`, para que su texto no se difumine) y la del footer en `z-0` dentro del footer, que ya esta por encima del canvas por el `relative z-10` de `MainView`. Si el contrato del Bloque A cambia de numeros, estas dos referencias se revisan juntas; la verificacion (elementsFromPoint) cubre ambos casos.

## Decisiones abiertas

1. **D1 (resuelta el 2026-09-11)**: el flash de hover del hero tambien pasa a ser "solo fondo", igual que navegacion y tema. El contrato del Bloque A aplica a los tres disparadores sin excepcion.
2. **D2 (resuelta el 2026-09-11)**: reparto de las cards = **E1 + E2**, o sea la fila incompleta se centra. El usuario lo pidio textualmente ("no que respete los huecos del elemento que deberia ir en el faltante"), asi que E3 (viuda a ancho completo) y E5 (flex que se estira) quedan descartadas.
3. **D3 (resuelta el 2026-09-11)**: el usuario autoriza `bun run lint:check`, `bun run format:check` y `bun run build` para la verificacion de este plan.
4. **D4 (resuelta el 2026-09-11, con discrepancia registrada)**: el ruido de TV queda con `contrast 1` / `brightness 1.5` en light y `0.5` / `0.5` en dark. Los defaults actuales del componente son 1 / 1.5, asi que el cambio efectivo es en dark (ver F2). Si el usuario queria lo inverso, se intercambian los cuatro valores; se confirma en la revision visual.
5. **D5 (resuelta el 2026-09-11 por el usuario)**: la banda de blur del footer va **dentro del footer, anclada a su borde inferior**, con la niebla mas fuerte abajo y desvaneciendose hacia arriba ("empiece desde el bottom del footer hacia el top del mismo no importa si toca o no contactos"), o sea `position="bottom"` en el componente nuevo. No se extiende sobre la seccion de Contacto.
6. **D6 (no bloquea, para la revision visual)**: la calibracion de la banda del navbar se alinea al preset `header` de la fuente (`8rem`, `ease-out`, `strength 2`); si en la revision se ve demasiado suave o demasiado alta, son dos numeros.

## Ejecucion (2026-09-11)

Implementado en el orden de "## Pasos". Verificacion real: `bun run lint:check` y `bun run format:check` en verde, `bun run build` completo (`✓ built in 907ms`, cero errores `TS`), mas verificacion en runtime contra el dev server del usuario a 408x640 en light y dark.

**Dos hallazgos durante la ejecucion, corregidos y documentados:**

1. Faltaba la regla `.project-logo-light-ink` en `style.css` (se habia omitido al escribir el bloque de esa tanda). Se detecto midiendo: el filtro de la `img` de Softii daba `none` en light. Agregada; medido despues `brightness(0)` en light y `none` en dark.
2. **Bug real del recentrado (G4/Bloque D).** El criterio comparaba la distancia contra `CALI_CENTER`, pero el centro del encuadre de `fitBounds` es el centro de `CALI_BOUNDS`, a ~3.2 km del marcador: `isMoved` daba `true` apenas corria el primer `fitCity`, y ademas cualquier cambio de tamano del contenedor volvia a encenderlo. La referencia pasa a ser `cityCenter`, capturado en cada `fitCity`. Medido despues: boton oculto en reposo, oculto tras redimensionar el contenedor (411 px -> 224 px), visible tras un zoom-out a z7 y oculto otra vez tras el click.

**Dos arreglos ajenos, necesarios para que el build quedara verde** (2 lineas, sin cambio de comportamiento, ambos del flujo paralelo): `Navbar.vue` tenia `route` declarado sin uso y `FooterSection.vue` un import de `SocialLinks` sin uso.

### Verificacion medida (runtime)

| Punto | Medido |
| --- | --- |
| Flash de tema | 819 ms |
| Flash de navegacion | 827 ms y 822 ms (hashes `#projects` y `#contact`) |
| Capas | `main` con `isolation: isolate`; ruido `-z-30` en reposo / `-z-10` en flash; terminal `-z-20`; contenido `relative z-10` |
| Contenido durante el flash | `elementsFromPoint` sobre el `H2` de Proyectos devuelve el `H2` primero, no la capa de ruido |
| Banda del navbar | `fixed`, `top: 0`, 112 px, `z-index: 30`, capas `4.9 / 7.35 / 9.1 / 10.15 / 10.5 px` con mascaras `to top` |
| Banda del footer | `absolute`, `bottom: 0`, 112 px, `z-index: -10`, mascaras `to bottom` (el ultimo nivel opaco pegado al borde inferior); footer con `isolate`; contenido `relative z-10`; el copyright gana el `elementsFromPoint` |
| Mapa, ubicacion | tile z12/1177/2008 -> lat 3.513 / lon -76.553 (Cali) |
| Mapa, nitidez | tiles `naturalWidth 256` dibujados en 128 px CSS = densidad 2x (`leaflet-retina`) |
| Mapa, altura | layout ancho simulado: tarjeta 533, `.content` 320 -> 479, mapa 252 -> 411 px; en columna, 224 px (`min-height`) |
| Pin | `.cali-pin` presente, `path` con `fill="#995CD0"`, cero `circleMarker` |
| Recentrado | zoom-out a z7 -> boton con `aria-label="Centrar en Cali"`; click -> vuelve a z12 y el boton se oculta |
| Logos en light | Softii `filter: brightness(0)`; monograma de Alytos `rgb(0, 0, 0)`; en dark, `none` y `rgb(255, 255, 255)` |
| Contacto | seccion 448 px y wrapper 448 px (antes 197.5); enlaces `flex: 1 1 0%` con 282 px y centrados |
| Cards | con las reglas de `>=64rem` aplicadas: fila 1 con offsets -126 / 0 / +126 y la viuda en -63 / +63, simetrica |
| Scrollbar | `color-scheme: dark` en dark y track `#000000`; las flechas ya eran violeta del tema |
| Ruido por tema | `noiseUniforms()` con 1 / 1.5 en light y 0.5 / 0.5 en dark, y `watch(theme, applyThemeUniforms)`; el pixel del canvas no es legible (sin `preserveDrawingBuffer`) |

**Nota de metodo:** como el viewport del preview mide 408 px (una sola columna), la fila de cards se comprobo inyectando temporalmente las reglas del bloque `>=64rem` y quitandolas despues, y el layout ancho del mapa forzando la fila a `row` con los `basis` de `lg`. Ambas inyecciones se revirtieron en el mismo paso.

## Cierre (memoria persistente)

- **Que cambio:** el mapa del About toma la altura de su tarjeta (cadena `.content` / `.cali-map-body` / `.cali-map-wrap` / `.cali-map`), pide tiles 2x (`detectRetina`), usa un pin de gota violeta `#995CD0` con boton de recentrado y un criterio de "se movio" corregido; las cards de proyectos centran la fila incompleta (grid de 6 tracks con reglas de viuda, mas su version a 2 columnas); el contrato de capas deja el ruido de TV siempre detras del contenido (`main isolate`, ruido `-z-30`/`-z-10`, terminal `-z-20`, contenido `relative z-10`); el flash pasa a 800 ms; el ruido de TV reacciona al tema (1 / 1.5 en light, 0.5 / 0.5 en dark); los logos monocromos se pintan en tinta en light (`lightInkLogo`); el Contacto reparte su altura (wrapper de 197.5 a 448 px); `TopGradualBlur.vue` se reemplaza por `GradualBlur.vue` (solo `top`/`bottom`, matematica de la fuente) usado por el navbar y, anclado al borde inferior, por el footer; y las flechas del scrollbar siguen el tema (`color-scheme` + token del track).
- **Verificacion:** `bun run lint:check`, `bun run format:check` y `bun run build`, los tres en verde; mas la verificacion en runtime de la tabla de arriba (light y dark).
- **Resultado:** aprobado.
- **Pendientes:** D6 (calibracion visual de la banda del navbar: `8rem` = 112 px aca; el fisico de la fuente serian 128 px y la banda del footer puede bajar a `6rem` si se ve alta) y la revision visual del usuario en su navegador. Fuera de este plan siguen la metadata/SEO (`portfolio-seo-metadata.md`) y el prerender.
