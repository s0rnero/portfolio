---
name: portfolio-cascada-breakpoints-footer-blur-boton-mapa
status: READY
type: bugfix
domain: portfolio
owner_rules: .agents
created: 2026-09-11 23:00
---

# Plan: cascada de utilidades rotas por khatarsis (breakpoints), banda de blur del footer y boton de recentrado del mapa

> Solicitud del usuario (2026-09-11, con tres capturas): "marca este closed y en uno nuevo agrega estos cambios, los breakpoints de sm o md o lg no estan funcionando como se ve en la primera imagen por alguna razon, inspeccionando veo que los estilos son tachados por las clases que se aplican sin breakpoint pero por que? quizas tiene que ver el style de khatarsis?" / "en la segunda imagen se supone que el footer debe tener un bg transparente y detras verse el efecto de gradual blur pero como se ve se ve un blur cortado nada mas" / "en el mapa debe haber un boton para centrar el mapa al punto marcado de nuevo".
>
> Cierra la tanda anterior: `portfolio-mapa-altura-pin-recenter-cards-zindex.md` ya esta en `CLOSED` con su entrada de memoria; no se reabre ni se toca.
>
> Compuerta: el usuario pidio un plan nuevo, asi que este documento nacio en `PENDING`. El usuario escribio **"enriquece el plan"** el 2026-09-11, asi que paso a `ENRICHED` con las mediciones de la seccion "Diagnostico" ampliadas (punto 3 nuevo: el apilado del boton), el ADR obligatorio de la regla 0.12 y el chequeo de skills. **No se toco codigo de aplicacion.**
>
> **Revision del orquestador (2026-09-11):** aprobado y pasado a `READY`. Se verifico que el plan cumple exactamente lo pedido (tres sintomas, sin rediseno), que no amplia alcance (los unicos agregados son obligatorios por reglas del repo: el ADR de la regla 0.12, y quitar `z-[1000]` que la regla 5 de `CODING_STANDARDS.md` prohibe), que los cambios respetan `RULES.md`, `CODING_STANDARDS.md` (cero margenes, sin valores arbitrarios nuevos, CSS nativo documentado como excepcion) y `DESIGN.md`, y que la verificacion es ejecutable con criterio binario. Desvio registrado a proposito: los dos comentarios de `style.css` se reescriben porque el arreglo los deja falsos.

## Diagnostico (medido, no supuesto)

Todo lo de abajo se midio sobre el build del repo (`dist/assets/index-CXEvSEkc.css`, 433.837 bytes, generado el 2026-09-11 17:50) y sobre el codigo en disco. El dev server estaba caido (`curl http://localhost:5173/` -> `000`), asi que la causa de los tres puntos es estatica; lo que necesita runtime esta marcado en "Verificacion".

**Mapa del build, para ubicar todo lo que sigue** (barrido de llaves con node sobre el archivo): capas `properties` 21.521-41.780, `theme` 41.781-46.119, `base` 46.120-50.011, declaracion `@layer components;` en 50.012 y **una sola** capa `utilities` de 50.030 a 104.898. Despues del cierre de `utilities` empieza, **sin capa**, el CSS scoped de los componentes de khatarsis (`.accordion[data-v-7c77a478]` en 104.900 y siguientes) y, mas al final, las reglas propias del app (`style.css`, `.cali-map-card` en 424.512). El CSS de Leaflet, tambien sin capa, esta al principio (2.835-4.847).

1. **Los breakpoints pierden por orden dentro de la misma capa, y la causa es `khatarsis` (confirmado).** `src/style.css:1-2` hace `@import 'tailwindcss';` y despues `@import 'khatarsis/style.css';`. Ese segundo archivo (`node_modules/khatarsis/dist/khatarsis.css`, **symlink** a `/c/Users/s0rno/OneDrive/Documents/khatarsis/packages/khatarsis/dist/khatarsis.css`, 382.380 bytes) es un **build completo de Tailwind 4.2.4** que incluye su propia capa de utilidades.
   - Dentro de esa unica capa `utilities`: el `.lg\:flex-row{flex-direction:row}` de la app queda en el byte **65.733** (dentro del `@media (width>=64rem)` que abre en 65.385) y el `.flex-col{flex-direction:column}` que aporta la libreria en el byte **80.043**.
   - Misma capa, misma especificidad (0,1,0), sin `!important`: decide el orden, y **gana el que aparece despues** = el de khatarsis. Eso es lo que DevTools muestra tachado: `lg:flex-row` no compite contra un `flex-col` de la app (que si perderia), compite contra el `flex-col` de la libreria, que esta mas al final de la capa.
   - Consecuencia practica: toda utilidad de la app cuyo "par sin breakpoint" tambien exista en el build de khatarsis queda anulada. Medido en el mismo archivo: `.flex-col{` en 80.043, `.absolute{` en 68.101, `.hidden{` en 71.067 / 71.157 / 81.174, `.grid-cols-1{` en 51.984, `.backdrop-blur-sm{` en 95.410. Ejemplos del repo que hoy no hacen nada: `lg:flex-row` y `lg:items-center` del About, `lg:flex-row` de la fila skills+mapa, `lg:basis-2/3` / `lg:basis-1/3`, y los `sm:`/`md:`/`lg:` de cualquier par con utilidad equivalente.
   - Esto **ya estaba diagnosticado** en `portfolio-mapa-scrollspy-flash-zindex.md` (orden de cascada del CSSOM en dev: `.flex-col` en 381 y otra vez en 2718) pero se cerro como riesgo documentado, sin arreglo: la estrategia elegida entonces fue escribir las reglas criticas **sin capa** en `style.css` (`.cali-map-card`, `.projects-grid`, `.gradual-blur`, scrollbar), que ganan a cualquier capa. Es un parche que funciona y no se revierte en este plan.
   - No hay `!important` en las clases del app: `grep -rnoE '[a-z0-9:/\[\]-]+!' src --include=*.vue` devuelve vacio. El workaround de "ponerles important" que el usuario recuerda no esta en el codigo.
   - **Segundo efecto del mismo origen, que hay que tener presente en el resto del plan:** el CSS scoped de khatarsis esta **sin capa** y, sin capa, gana siempre a cualquier regla dentro de una capa, por mas especifica que sea la utilidad. Ver el punto 3.

2. **La banda del footer no se ve porque el propio footer forma un Backdrop Root (causa especificada, no supuesta).** El spec de Filter Effects Level 2 (§3 Backdrop Root) define la lista de disparadores: elemento raiz, `filter`, `opacity < 1`, `mask` / `mask-image` / `mask-border` / `clip-path`, `backdrop-filter`, `mix-blend-mode`, y `will-change` de cualquiera de esos. La misma seccion aclara que `z-index`, posicionamiento fijo/sticky y `transform` **no** forman Backdrop Root.
   - `FooterSection.vue` declara `relative isolate w-full backdrop-blur-sm`. Ese `backdrop-blur-sm` es un `backdrop-filter` no-`none` sobre el footer, o sea: **Backdrop Root para sus descendientes**. La banda (`<gradual-blur>`, 65 px, `absolute`, `bottom: 0`, `z-index: -10`) y sus cinco capas son descendientes, asi que su "backdrop image" queda limitada a lo pintado entre el footer y la capa: el footer es transparente, o sea nada. La banda no tiene que desenfocar y el degradado nunca aparece.
   - Lo que queda visible es el `backdrop-filter: blur(8px)` **uniforme** del footer: un rectangulo desenfocado con borde duro, que es exactamente el "blur cortado" del reporte. Es el comportamiento que Chromium documenta mejor que los demas motores (havn.blog 2024-03-14: "If an element has a backdrop-filter, Chromium won't let its children have it as well"; Stack Overflow 60997948; el issue de Chromium 40421534). En Gecko/WebKit el anidado funciona, de ahi que el componente de origen funcione en sus demos.
   - **No son la causa** (verificado contra el spec, para no arreglar lo que no esta roto): `isolate` en el footer ni el `isolation: isolate` de `.gradual-blur` (`style.css`) forman Backdrop Root; el `z-index: -10` de la banda tampoco. Y aunque `mask-image` si es disparador, cada capa es **hermana** de las otras, no su ancestro, asi que la mascara de una capa no bloquea el `backdrop-filter` de las demas.
   - Tampoco hay otro disparador en la cadena de ancestros del footer (revisado en el codigo): `#app` es un div pelado (`index.html`), `body`/`html` solo llevan tipografia (`style.css`), `main` es `relative isolate` y el contenedor de `MainView` es `relative z-10` (un stacking context por `z-index`, que no es disparador). `useReveal` aplica `autoAlpha` (opacidad) y `y` con GSAP **solo** a los `[data-reveal]`, y el footer no tiene ninguno.
   - Consecuencia: basta quitar el `backdrop-blur-sm` del `<footer>` para que quede de fondo transparente (lo pedido) y la banda recupere su backdrop real (el canvas del terminal y el contenido pintado por encima, dentro del documento raiz). El apilado interno se queda como esta.
   - Fuera de alcance por decision del usuario (D3): las tarjetas del About y el mapa conservan `backdrop-blur-sm`; mismo mecanismo, mismo borde duro, pero es una eleccion estetica suya.

3. **El boton de recentrado ademas queda por debajo del mapa: su `z-index` efectivo es 10, no 1000 (hallazgo del enriquecimiento).** Hay dos causas, y la segunda explica por que no se ve ni cuando el estado lo muestra.
   - `MapCard.vue` lo renderiza con `v-if="isMoved"`, y `isMoved` solo pasa a `true` si el centro se alejo mas de `RECENTER_DISTANCE_M = 1500` metros del centro del encuadre o si el zoom quedo por debajo del de `fitCity`: un arrastre corto o un scroll sin zoom no lo muestran. Ademas la variante `text` del `k-button` es `&[data-text] { @apply bg-transparent }` sobre el `.content` interno (leido en `khatarsis/.../base/button/Button.vue`), o sea que es un icono violeta sin superficie.
   - **Lo grave, medido en el build del repo:** la raiz del boton lleva `.button[data-v-69b6f085]{z-index:10;cursor:pointer;justify-content:center;align-items:center;display:flex}` en el byte **118.561**, o sea **despues** del cierre de `@layer utilities` (104.898) y por lo tanto **sin capa**. La utilidad de la app `.z-\[1000\]{z-index:1000}` esta en el byte 50.285, **dentro** de `@layer utilities`. Una regla sin capa gana siempre a una dentro de una capa (y ademas 0,2,0 > 0,1,0): **el `z-[1000]` de la clase no aplica y el boton queda en `z-index: 10`**.
   - Con `z-index: 10` el boton pierde contra los panes de Leaflet, que tambien estan sin capa y viven en la misma caja de apilado: `.leaflet-pane{z-index:400}` (el `.leaflet-map-pane`, ancestro de los tiles), `.leaflet-tile-pane{z-index:200}`, `.leaflet-control{z-index:800}`, `.leaflet-top,.leaflet-bottom{z-index:1000}` (todos medidos en 4.238-4.847). El contenedor del mapa no es un stacking context (Leaflet le pone `position: relative` inline y ningun `z-index`, y `.leaflet-container{overflow:hidden}` no lo crea), asi que esos `z-index` compiten en el contexto de `.cali-map-wrap`, que si lo es por su `isolation: isolate`. Resultado: **el boton se pinta detras de los tiles**, o sea invisible aunque este en el DOM.
   - Consecuencia: hay que arreglar las dos cosas por separado (siempre visible + por encima de los panes). Para el `z-index` no alcanza ninguna utilidad, y no solo por la cascada: hace falta un valor mayor que 1000 y la escala estandar de Tailwind termina en `z-50`; con la regla 5 de `CODING_STANDARDS.md` (prohibido `[...]`) el `z-[1000]` actual es ademas una violacion preexistente. La via limpia es una regla sin capa en `style.css` con especificidad `0,2,0` (`.cali-map-wrap .cali-recenter`), que empata con la del componente y gana por ser posterior en el archivo.

4. **Nota de medicion pendiente (no es un hallazgo de este plan).** La primera captura adjunta muestra la esquina superior con el toggle de tema y el scrollbar; si lo que señala es la caja clara del boton de flecha del scrollbar en dark, hay que volver a medirlo con dev server arriba (el arreglo de `color-scheme` + token del track quedo del plan anterior). No se toca en este plan salvo que el usuario lo confirme.

## Cambios propuestos

### Bloque A — Cascada: `khatarsis` primero, `tailwindcss` despues (D1)

`src/style.css`, lineas 1-2
- Invertir los dos `@import` para que quede `@import 'khatarsis/style.css';` y luego `@import 'tailwindcss';`, con un comentario que explique el porque (la libreria publica un build completo de Tailwind dentro de su CSS y, dentro de una misma capa, gana el ultimo).
- Es el arreglo minimo y no mueve ninguna capa: los dos archivos declaran las mismas capas y en el mismo orden (`properties`, `theme`, `base`, `components`, `utilities`; verificado en el barrido del build), asi que lo unico que cambia es quien gana los empates **dentro** de cada capa.
- No se tocan las reglas propias del app (`style.css` despues de los imports, sin capa): siguen ganando por especificidad de capa y son las que sostienen el mapa, el grid de cards, la banda de blur y el scrollbar.
- Efecto colateral esperado y benigno: en las capas `theme` y `base` el que gana los empates pasa a ser el app. Hoy la libreria (construida con Tailwind 4.2.4) le gana al app (que tiene `^4.3.3` instalado) en los tokens por defecto y el preflight; despues del cambio gana el app. Los valores por defecto son los mismos en la practica, pero entra en la revision visual (ver Riesgos).
- **Plan B documentado, si la verificacion estatica no confirma el cambio:** `@import 'khatarsis/style.css' layer(components);`. Por capas es determinista (todo lo de khatarsis queda por debajo de `utilities`), pero mueve tambien sus tokens de tema y su preflight a la capa `components`, con mas superficie de cambio que el reordenamiento. Se usa solo si el reordenamiento no alcanza.
- Limpieza de documentacion en el mismo archivo: los dos comentarios que hoy justifican escribir CSS propio "porque el build completo de khatarsis gana el orden dentro de `@layer utilities`" (cabecera del bloque del mapa y del bloque del grid de cards) quedan desactualizados con el arreglo. Se reescriben para decir el motivo real que sigue vigente: son reglas que Tailwind no puede expresar (reglas de viuda en el grid, cadena de altura de un `.content` de la libreria) y viven sin capa por eso.
- **ADR obligatorio (regla 0.12):** la decision de orden de import va a `.agents/decisions/004-cascada-css-khatarsis-orden-de-imports.md` (ver Bloque D).

### Bloque B — Footer: fondo transparente y banda visible (punto 2, D3)

`src/components/layout/FooterSection.vue`
- Quitar `backdrop-blur-sm` de la clase del `<footer>` (queda `relative isolate w-full`). Es el unico cambio en ese archivo: el footer queda de fondo transparente (sin el `backdrop-filter` uniforme) y deja de ser Backdrop Root, asi que las capas de la banda vuelven a ver el contenido de atras.
- **No se toca** el resto del apilado: `isolate` en el footer, `<gradual-blur :z-index="-10" position="bottom" />` y el `relative z-10` del contenido quedan igual (verificado contra el spec que `isolate` no forma Backdrop Root, o sea que no es parte del problema).
- **No se toca** la calibracion de la banda (`height` de 65 px y los defaults de `GradualBlur.vue`): el usuario ya la ajusto despues de la ejecucion anterior.
- **No se toca** el `backdrop-blur-sm` de las tarjetas del About ni del mapa (D3).
- Resultado esperado: en el borde inferior del footer el patron violeta del terminal se ve progresivamente mas desenfocado (5 niveles, rampa `4.9 / 7.35 / 9.1 / 10.15 / 10.5 px` con los defaults actuales) y desaparece el rectangulo con borde duro.
- Aviso honesto de percepcion: el efecto es un `backdrop-filter`, o sea que solo se percibe donde hay estructura detras. Sobre zonas planas del canvas el cambio es sutil por definicion del efecto, no por un bug. Si tras el cambio se quiere mas o menos intensidad, son los props de la banda (`strength`, `height`), no el apilado.

### Bloque C — Boton de recentrado: siempre visible y por encima del mapa (punto 3, D2)

`src/components/about/MapCard.vue`
- Quitar `v-if="isMoved"`: el boton se renderiza siempre y al hacer click siempre vuelve al punto marcado (`handleRecenter` -> `fitCity()` -> `fitBounds(CALI_BOUNDS)`).
- **Codigo muerto que hay que borrar** (queda sin consumidores): el `ref` `isMoved`, la funcion `updateMoved`, los dos `let` `cityCenter` / `cityZoom`, el `map.on('moveend zoomend', updateMoved)` y las asignaciones dentro de `fitCity`. En su lugar, un booleano `hasFitted` para el `ResizeObserver` (el primer tamaño no-cero encuadra la ciudad; los cambios posteriores solo hacen `invalidateSize()`), que es el unico motivo por el que existia `cityZoom === null`.
- Clase nueva en el componente: `cali-recenter` (gancho para la regla de `style.css`), y se **quita** `z-[1000]` (valor arbitrario prohibido por la regla 5 de `CODING_STANDARDS.md`, y ademas inefectivo segun el Diagnostico 3).
- Superficie para que se lea sobre los tiles: se mantiene `icon-only` y se le da al **elemento raiz** del `k-button` una superficie propia, por ejemplo `class="cali-recenter absolute top-2 right-2 rounded-xl bg-white/85 shadow-sm hover:bg-white dark:bg-black/70"`.
- **Tamano del control (skill `accessibility`):** con el default `size="md"` el boton mide ~22.75 px de lado (padding `p-1.5` = 0.375rem x 2 = 10.5 px + icono `size-3.5` = 0.875rem = 12.25 px, todo con la raiz de 14 px) y queda por debajo del criterio de target size de WCAG 2.2 SC 2.5.8 que lista la skill (24 x 24 CSS px, AA). Se agrega `size="lg"` (padding `p-2` x 2 = 14 px + icono `size-4` = 14 px = **28 px**) usando la API del propio componente, sin medidas propias. Motivo tecnico medido al leer el componente de la libreria: el CSS scoped del `k-button` define `bg-transparent` sobre el `.content` interno (no sobre la raiz) y la raiz no trae `border-radius` (el `rounded` aplica al `.wrapper`/`.content`), asi que la superficie y el `rounded-xl` van en la raiz, donde no hay competencia. El color del icono hereda de la raiz (la variante `text` no fija color) y el `hover` del componente ya lo lleva al violeta del tema.
- **La posicion y el `z-index` van a `src/style.css`, sin capa** (Diagnostico 3): `position` y los offsets no tienen competencia, pero el `z-index` si (la regla sin capa del componente, `0,2,0`, le gana a cualquier utilidad). Regla nueva:
```css
/* The k-button root ships an unlayered `z-index:10` from khatarsis's scoped
   stylesheet (`.button[data-v-...]{z-index:10}`), which beats any utility in
   `@layer utilities`. The recenter control has to sit above Leaflet's panes
   (`.leaflet-map-pane` 400, `.leaflet-control` 800, `.leaflet-top` 1000), and
   Tailwind's z scale stops at 50 while arbitrary values are forbidden by the
   project style rules, so this one declaration is native CSS on purpose. The
   two-class selector matches the component's specificity and wins by document
   order (this file is emitted last). */
.cali-map-wrap .cali-recenter {
  z-index: 1100;
}
```
- Opcional de descubribilidad: **se descarta** `k-tooltip` (D5). Motivo: el componente inserta un wrapper y un portal de posicionamiento flotante dentro de un contenedor con `isolation: isolate` y sobre un mapa que captura punteros y rueda; no aporta y agrega superficie de bug. El `aria-label` existente (`t('about.mapRecenter')`) cubre accesibilidad.
- No se toca el pin (gota violeta `#995CD0` con `iconAnchor` en la punta), ni `detectRetina`, ni la cadena de altura: quedaron verificados en la tanda anterior. No hay claves i18n nuevas (se reutiliza `about.mapRecenter`, 55/55).

### Bloque D — ADR de la decision de cascada (RULES 0.12)

`create .agents/decisions/004-cascada-css-khatarsis-orden-de-imports.md`
- Frontmatter segun `.agents/templates/adr.md` y la convencion del repo (`status: proposed`, `date: 2026-09-11`, `domain: portfolio`, `supersedes: []`), leido de `003-crt-overlay-visual-sin-compuerta.md`.
- Contenido: contexto (la libreria publica un build completo de Tailwind en su CSS; dentro de `@layer utilities` gana el ultimo; los `sm/md/lg` del app quedaban anulados), decision (el CSS de terceros se importa **antes** del propio, de modo que las utilidades del app ganan los empates), consecuencias (positivas: los breakpoints funcionan y no hace falta `!important`; negativas: el que gana los empates de `theme`/`base` pasa a ser el app, y el problema estructural sigue en la libreria para otros consumidores) y alternativas consideradas (`layer(components)`, arreglar la libreria, seguir parcheando con reglas sin capa).

### Skills revisadas (checklist del enriquecimiento)

- `tailwind-css-patterns`: su seccion "Responsive Styles Not Working" atribuye el sintoma al orden de las clases en el atributo (`md:flex` antes de `flex`). En este repo la causa medida es otra: el orden de las **hojas** (el `@import` de la libreria despues del de Tailwind). Esa afirmacion de la skill no contradice el arreglo (el orden de las clases en el atributo no cambia nada aqui), pero se deja registrada la divergencia: prevalece la medicion local por RULES 0.5.
- `accessibility`: su criterio de target size (WCAG 2.2 SC 2.5.8, 24 x 24 px) es el que fija el `size="lg"` del boton del mapa (Bloque C) y refuerza que el `icon-only` conserve su `aria-label`.
- `frontend-design`: sin impacto (es un bugfix, no un rediseno); no se cambian tipografias, paleta ni layout mas alla de lo pedido.

### Bloque E — Archivos tocados

Editados: `src/style.css` (orden de los dos `@import`, 1 regla nueva del boton, 2 comentarios corregidos), `src/components/layout/FooterSection.vue` (1 clase menos), `src/components/about/MapCard.vue` (boton siempre visible con su clase y superficie, borrado del estado `isMoved`). Creado: `.agents/decisions/004-cascada-css-khatarsis-orden-de-imports.md`.

Fuera de alcance: no se toca el CSS ni el repo de la libreria `khatarsis`, no se cambia el resto del navbar ni del footer, no se tocan las tarjetas del About ni del mapa (D3), no se toca el CRT, ni el pin, ni el scrollbar, ni metadata/SEO, y no se instala ni actualiza ninguna dependencia.

## Pasos (orden de ejecucion)

1. `read src/style.css` y `edit`: invertir los dos `@import` con su comentario (Bloque A).
2. `edit src/style.css`: reescribir los dos comentarios desactualizados sobre el orden de capas (Bloque A).
3. `read src/components/layout/FooterSection.vue` y `edit`: quitar `backdrop-blur-sm` del `<footer>` (Bloque B).
4. `read src/components/about/MapCard.vue` y `edit`: boton sin `v-if`, `size="lg"`, clase `cali-recenter` con su superficie, `z-[1000]` fuera y borrado de `isMoved` / `updateMoved` / `cityCenter` / `cityZoom` / listeners (Bloque C).
5. `edit src/style.css`: agregar la regla `.cali-map-wrap .cali-recenter` (Bloque C, Diagnostico 3).
6. `create .agents/decisions/004-cascada-css-khatarsis-orden-de-imports.md` (Bloque D).
7. Formatear los archivos tocados.
8. Verificacion real: `bun run lint:check`, `bun run format:check`, `bun run build` (D4).
9. Verificacion estatica del CSS construido (script del barrido de capas) y verificacion en runtime con dev server (D4).
10. Registrar el cierre (DoD) en este plan.

## Verificacion

- Autorizacion necesaria (D4): `bun run lint:check`, `bun run format:check`, `bun run build` y `bun run dev` (los dos ultimos, scripts reales de `.agents/AGENTS.md`; `lint:check` y `format:check` estan declarados en `package.json`).
- **El arreglo de la cascada, con criterio binario y sin navegador.** Sobre `dist/assets/index-*.css`:
```bash
node -e '
const fs=require("fs");const css=fs.readFileSync(process.argv[1],"utf8");
const idx=s=>{const o=[];let i=css.indexOf(s);while(i!==-1){o.push(i);i=css.indexOf(s,i+1);}return o;};
const extent=p=>{let d=0;for(let i=p;i<css.length;i++){const c=css[i];if(c==="{")d++;else if(c==="}"){d--;if(d===0)return i;}}return -1;};
const L=[];const re=/@layer\s+([^{;]+)([;{])/g;let m;while((m=re.exec(css)))L.push({n:m[1].trim(),p:m.index,o:m[2]==="{"});
const at=o=>L.filter(l=>l.o&&l.p<o&&extent(l.p)>o).map(l=>l.n).join(">")||"(ninguna)";
for(const s of ["flex-col{","lg\\:flex-row{","cali-recenter","button[data-v-","z-index:1100"])
  console.log(s, idx(s).map(o=>o+" ["+at(o)+"]").join(" | "));
' dist/assets/index-*.css
```
  Criterio: el offset del `.flex-col{` de la libreria debe quedar **antes** del `.lg\:flex-row{` de la app (hoy 80.043 > 65.733, o sea invertido). Si no cambia, se aplica el Plan B del Bloque A y se vuelve a medir.
- **La cascada en runtime:** con dev server arriba y viewport >= 1024 px, `getComputedStyle` de la fila del About devuelve `flex-direction: row` (hoy `column`) y la de la fila skills+mapa tambien; los `lg:basis-*` se resuelven en 66.67% / 33.33%. Chequeo negativo: `matchMedia('(min-width: 64rem)')` sigue dando `true` (para descartar que el "arreglo" haya sido desactivar el breakpoint).
- **Footer:** `getComputedStyle(footer).backdropFilter === 'none'` y `background-color` transparente; la banda sigue `absolute`, 65 px, `bottom: 0`, `z-index: -10` y con sus 5 capas; el contenido del footer sigue ganando `document.elementsFromPoint` sobre el copyright (no lo tapa la banda). El degradado se confirma visualmente en light y dark sobre el canvas del terminal.
- **Boton del mapa, las tres partes:** (a) al cargar la pagina, sin arrastrar ni hacer zoom, `document.querySelector('[aria-label="Centrar en Cali"]')` existe; (b) **hit test de visibilidad**, que es lo que el arreglo del `z-index` cambia: `document.elementsFromPoint` en el centro del rectangulo del boton devuelve el boton (o su icono) como primer elemento y no un `<img class="leaflet-tile">`; `getComputedStyle(boton).zIndex === '1100'` (hoy `10`); (c) target size: `getBoundingClientRect()` del boton con lados >= 24 px en ambos ejes (con `size="lg"` son ~28 px; con el default serian ~22.75 px). (c) tras `map.panBy([400, 300])` sigue visible, y al hacer click el centro vuelve dentro de `CALI_BOUNDS` y el zoom al del encuadre. (d) Chequeos negativos: `grep -n isMoved src/components/about/MapCard.vue` sin resultados y `grep -n 'z-\[1000\]' src/components/about/MapCard.vue` sin resultados.
- **Revision visual del usuario** en light y dark: las secciones del About en fila a partir de 1024 px, el footer con el degradado, el boton del mapa, y un barrido general de la pagina por si el nuevo orden de la cascada cambio algo donde antes ganaba khatarsis (ver Riesgos).

## Riesgos y concurrencia

- **El arreglo de la cascada cambia quien gana en TODOS los empates de utilidades del sitio.** Es el objetivo, pero implica que cualquier lugar donde el diseño se hubiera acomodado al ganador viejo puede moverse. Censo hecho: no hay `!important` en las clases del app y los ajustes criticos viven sin capa en `style.css` (mapa, grid de cards, gradual blur, scrollbar), asi que quedan por encima. Aun asi, la verificacion incluye un barrido visual de todas las secciones en light y dark.
- **Choque de versiones de Tailwind:** el app tiene `^4.3.3` instalado y la libreria se construyo con 4.2.4. Antes del cambio ganaba la copia de la libreria en los tokens por defecto y el preflight; despues gana la del app. En la practica los valores por defecto coinciden, pero es la primera cosa que hay que mirar si un color, un radio o un reset se ve distinto.
- **Regla general que deja este diagnostico:** el CSS scoped de khatarsis esta sin capa, asi que **cualquier utilidad del app aplicada a la raiz de un componente `k-*` puede perder** contra las propiedades que ese componente declare (caso medido: `z-index` del `k-button`). No se arregla en este plan; queda documentado en el ADR para no volver a diagnosticarlo desde cero.
- **La causa raiz vive en la libreria, no en el portafolio.** `node_modules/khatarsis` es un symlink al repo local: si se reconstruye la libreria, su CSS vuelve a entrar igual y este arreglo sigue funcionando, pero el problema estructural (una libreria que publica un build completo de Tailwind) sigue ahi para cualquier otro consumidor. Propuesta para un hilo aparte: que khatarsis no publique utilidades en su `dist` o las publique dentro de `@layer components`.
- **Verificacion en runtime pendiente de dev server:** el diagnostico es estatico y solido, pero los puntos (b) del boton y del footer necesitan la pagina viva. Si no hay dev server al ejecutar, esos quedan reportados como pendientes con el motivo (regla 0.4), no como aprobados.
- **Concurrencia:** el usuario edita en paralelo `FooterSection.vue`, `MapCard.vue` y `style.css` (viene renombrando componentes y ajustando la banda). Releer cada archivo antes de editarlo: el estado real manda sobre lo que dice este plan.
- **Apilado:** el Bloque B no cambia ningun `z-index` del fondo; el unico `z-index` nuevo es el del boton, dentro del contexto aislado `.cali-map-wrap`, asi que no puede escaparse ni tapar nada fuera de la tarjeta del mapa.
- **Las capturas del preview** pueden mostrar frames viejos del canvas WebGL (sin `preserveDrawingBuffer` ni `readPixels`): la confirmacion visual del degradado del footer es del usuario en su navegador.

## Decisiones

1. **D1 (resuelta el 2026-09-11)**: el arreglo de la cascada se hace **reordenando los dos `@import`** en `src/style.css` (opcion minima, sin mover capas). `layer(components)` queda como Plan B documentado si la verificacion estatica no confirma el cambio.
2. **D2 (resuelta el 2026-09-11)**: el boton del mapa queda **siempre visible** y siempre recentra en el punto marcado.
3. **D3 (resuelta el 2026-09-11)**: las tarjetas del About y del mapa **conservan** su `backdrop-blur-sm`; solo el footer lo pierde.
4. **D4 (pendiente al pasar a ejecucion)**: autorizacion del usuario para `bun run lint:check`, `bun run format:check`, `bun run build` y `bun run dev`.
5. **D5 (resuelta en el enriquecimiento)**: el boton **no** lleva `k-tooltip` (wrapper + portal flotante dentro de un contenedor aislado sobre un mapa interactivo, sin aporte real); su `z-index` va en `style.css` sin capa porque ninguna utilidad puede ganarle a la regla del componente, y se deja un ADR de la decision de cascada (regla 0.12).
6. **D6 (para la revision visual, no bloquea)**: si el boton siempre visible tapa demasiado el mapa, se puede volver al auto-ocultado con umbral mas sensible sin tocar el resto del plan. En el mismo repaso: si el `size="lg"` se ve grande, se puede bajar a `md` aceptando el desvio del criterio de target size de 24 px (queda anotado, no se decide solo).

## Cierre (memoria persistente)

> Completar al cerrar el plan. Es la entrada de memoria del proyecto (ver `.agents/PLANS.md`). Sin esto, el plan no pasa a `CLOSED` (DoD).

- Que cambio: [pendiente]
- Verificacion: [pendiente]
- Resultado: [pendiente]
- Pendientes: [pendiente]
