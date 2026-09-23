---
name: portfolio-navbar-cards-scrollbar-flash
status: EXECUTED
type: bugfix
domain: portfolio
owner_rules: .agents
created: 2026-09-10 20:51
enriched: 2026-09-10
ready: 2026-09-10 (revision orquestador: validado contra RULES/CODING_STANDARDS/DESIGN, aprobado por el usuario)
executed: 2026-09-10
---

# Plan: Ajustes — navbar visible, cards con k-card, scrollbar por tema y ruido TV de 2 s

> Solicitud del usuario (2026-09-10): (1) "no se estan visualizando las secciones del portafolio en el navbar"; (2) "las cards de la seccion de proyectos no usa las cards de khatarsis cuando deberia hacerlo"; (3) "en `src/style.css` hay unos estilos para dark mode y light mode que se aplican en el thumb y no lo esta haciendo al cambiar de tema"; (4) "cuando se aplica click en el cambio de tema que ya no dure el ruido de tv 3 segundos sino 2 segundos, al dar click para navegar tambien debe durar 2 segundos"; (5) "tambien el faulty terminal el fondo negro cambiarlo a blanco cuando cambie a light mode". Orden explicita: investigar y diagnosticar primero y armar el plan.

> **Aviso de edicion concurrente (2026-09-10 20:53):** durante esta investigacion `src/components/hero/HeroSection.vue` cambio por fuera de este plan (el `h1` y la descripcion del hero perdieron `text-white` y `text-gray-300` y ahora heredan el color del `body`). El executor debe **releer** los archivos antes de editarlos y no revertir ese cambio.

## Objetivo

- El navbar deja de ocultar sus enlaces de seccion (`hidden sm:flex` → `flex` siempre) y solo lista secciones que existen de verdad en la pagina.
- El fondo animado (faulty terminal) pasa a claro en light mode y deja de pintar negro sobre el tema claro, revisando el contraste de todo lo que hoy asume fondo oscuro.
- `ProjectCard.vue` deja de reimplementar la card a mano y se construye sobre `k-card` de khatarsis (media/title/description/content), conservando los dos efectos (`skew` + `spotlight`), la banda de imagen y los chips.
- El scrollbar (track y thumb) sigue el tema activo en Chrome/Safari de forma real (hoy es incondicional) sin perder las flechas personalizadas; `scrollbar-width`/`scrollbar-color` quedan solo donde no hay `::-webkit-scrollbar` (Firefox).
- El destello de ruido TV dura 2000 ms tanto al cambiar de tema como al navegar entre secciones.

## Diagnostico (evidencia real, 2026-09-10)

Dev server ya en ejecucion (`localhost:5173`, PID 22084) — lectura sin arrancar nada (RULES 0.4 respetada).

### 1. Navbar: dos defectos distintos

- `src/components/layout/Navbar.vue` L45: `<ul class="hidden items-center gap-6 sm:flex">`. Medido en el preview (ancho 408 px < `sm` 640 px): `getComputedStyle(ul).display === 'none'`, `width 0`, `matchMedia('(min-width: 640px)') === false`. Los 5 enlaces existen en el DOM pero no se ven.
- `src/router/index.ts` L6-42: `NAV_SECTIONS` declara 5 secciones (`profile, experience, projects, interests, contact`). En el DOM solo hay **2** `<section>`: `#hero` (`HeroSection.vue` L76) y `#projects` (`ProjectsSection.vue` L15). No existen `ProfileSection`, `ExperienceSection`, `InterestsSection` ni `ContactSection` (`src/components/` solo tiene `background, crt, cursor, hero, layout, projects`). Al hacer click en esos 4 enlaces: `router.push({path:'/', hash:'#profile'})` → `scrollBehavior` → `scrollTo('#profile')` → Lenis contra un selector inexistente → no hace nada (ni scroll ni estado activo). El copy i18n (`profile.*`, `experience.items`, `interests.items`, `contact.*`) y los datos (`skills`, `experiences`, `interests`, `contact`) existen pero sin consumidor de UI.

**Decision del usuario (2026-09-10):** "esas secciones no existen… jamas pedi ese hidden eliminalo no tiene sentido siempre flex" + "Quitar del navbar los enlaces sin sección". → Se elimina el `hidden` (siempre `flex`) y `NAV_SECTIONS` queda solo con las secciones que existen (`projects`). **No** se crean las 4 secciones en este plan.

### 2. Cards de proyectos: no usan `k-card`

- `src/components/projects/ProjectCard.vue` L22-30: card hecha a mano (`div.flex.h-full.flex-col.overflow-hidden.rounded-2xl.border.border-neutral-200.bg-white.dark:border-neutral-800.dark:bg-neutral-900`) que duplica lo que ya entrega khatarsis (RULES 0.6).
- `k-card` **si existe** y esta registrado: `node_modules/khatarsis/src/components/index.ts` → `'k-card': Card` (`base/card/Card.vue`).
  - Props: `title`, `description`, `variant` (`base` default), `size` (`md` default), `divided`, `rounded` (true), `square`, `outlined`, `borderless`, `bordered` (true), `filled`, `hover`/`noHover`, `as` (**`section`** por defecto), `ui` (Record **selector CSS → clases**, aplicado por `useUi` con MutationObserver, no por names).
  - Slots: `media` (solo se renderiza si existe), `header` (+ `title`), `description`, default (`content`), `footer`.
  - Estilos base: `flex flex-col overflow-hidden bg-white dark:bg-neutral-900`, `rounded-xl`, borde por tokens `--variant-soft-*`; tamanos `xs/sm/md/lg/xl` fijan padding de `header/content/footer` (`p-0.5` … `p-3`) y tipografia (`text-base` … `text-2xl` en `.title`).
  - Precedente interno de khatarsis: `blocks/product-card/ProductCard.vue` usa `<k-card bordered rounded>` + slots `media/title/description/footer`.
- DOM medido en runtime: `#projects article` ×5 = 5 cards reales, con `div` manual (no `k-card`). Los reveals funcionan (opacity 1 tras scroll), no hay bug de revelado.
- Efectos: `v-effect` (`effects/directive.ts`) exige **una directiva por elemento** y pone `position: relative` si hace falta; `spotlight` inyecta un `span` overlay como ultimo hijo (absoluto, `inset:0`, `border-radius: inherit`) y `skew` aplica `transform` con perspectiva. La estructura actual ya anida `skew` (externo) > `spotlight` (interno).

### 3. Scrollbar: no sigue el tema (3 causas medidas)

- `src/style.css` L50: `html { scrollbar-width: thin; scrollbar-color: #995cd0 #000; }` es incondicional. En la pagina real (`Chrome/130`, Blink): `getComputedStyle(document.documentElement).scrollbarColor === 'rgb(153, 92, 208) rgb(0, 0, 0)'` **en light y en dark**. Segun el comportamiento de Chromium ≥121, un `scrollbar-color` distinto de `auto` **anula** los estilos `::-webkit-scrollbar*`: se pierden las flechas SVG y el track/thumb personalizados.
- El `@apply dark:bg-black` del track compila a un selector invalido. CSS efectivo del dev server:
  ```css
  ::-webkit-scrollbar-track {
    background-color: var(--color-white);
    &:where(.dark, .dark *) { background-color: var(--color-black); }
  }
  ```
  Es decir `::-webkit-scrollbar-track:where(.dark, .dark *)`: pseudo-clase no-accional despues de un pseudo-elemento → el navegador descarta esa regla. Medido con `getComputedStyle(el, '::-webkit-scrollbar-track')`: `rgb(255,255,255)` **en light y en dark** (nunca cambia).
- El build de produccion (`dist/assets/index-Bvq-2r_5.css`, ignorado por git) contradice al dev: Lightning CSS aplana el anidado a `::-webkit-scrollbar-track{background:#000}` incondicional → dev queda siempre blanco y prod siempre negro. Ninguno sigue el tema.
- El thumb no tiene variante de tema: `background-color: #995cd0` fijo, `:hover #b27fe3` (L59-66).

**Decision del usuario (2026-09-10):** "Variables de tema + flechas WebKit, `scrollbar-color` solo Firefox".

### 4. Duraciones del ruido TV

- `src/composables/useStaticFlash.ts` L18: `flashOnNavigate(durationMs = 5000)`; L26: `flashOnThemeToggle(durationMs = 3000)`.
- `src/App.vue` L43: `flashOnNavigate(5000)` en `router.afterEach` (navegacion intra-`MainView`).
- `src/components/layout/Navbar.vue` L21 (dentro de `watch(theme, ...)`) y L31 (dentro de `handleToggleTheme`): `flashOnThemeToggle(3000)` **dos veces por click** (duplicado: el `watch` ya cubre cualquier cambio de tema).
- No relacionado (no se toca): `HeroSection.vue` L58 `fallbackTimer` 3000 (fallback del intro CRT), `GlitchCursor.vue` L15 `ACTIVE_MS` 3000, `Crt.vue` `durationMs: 1400`, `FaultyTerminalBackground.vue` L345 `/2000`.

## Alcance

- `src/components/layout/Navbar.vue` (edit): `<ul>` a `flex` sin breakpoint; sin cambios de copy ni de estructura.
- `src/router/index.ts` (edit): `NAV_SECTIONS` reducido a las secciones existentes (`projects`); tipos `NavSection`/`SectionId` ajustados si quedan huerfanos.
- `src/components/projects/ProjectCard.vue` (edit): reconstruida sobre `k-card`.
- `src/style.css` (edit): tokens de scrollbar por tema + reglas de scrollbar sin variantes invalidas.
- `src/composables/useStaticFlash.ts` (edit): duraciones objetivo 2000 ms.
- `src/App.vue` (edit): llamada de navegacion a 2000 ms.
- `src/components/background/FaultyTerminalBackground.vue` (edit): fondo del shader por tema (light/oscuro), sin alterar el look actual de dark.
- `src/components/layout/Navbar.vue` (edit, consecuencia de E): logo `text-white` y enlaces `text-white`/`text-zinc-300` (L44, L56-57) son ilegibles sobre fondo claro → pasan a theme-aware.
- `src/components/hero/GlitchText.vue` (edit, consecuencia de E): capas `::before/::after` con `background: rgb(0 0 0 / 50%)` y `text-shadow: -2px 0 #fff` fijas para fondo oscuro.
- `src/components/hero/HeroSection.vue` (revision, consecuencia de E): rol en `text-violet-300` (L86) sobre blanco; el resto ya quedo theme-aware por el cambio externo de las 20:53.
- `.agents/plans/portfolio-navbar-cards-scrollbar-flash.md` (este plan, memoria persistente).

Fuera de alcance:

- **No** se crean `ProfileSection`, `ExperienceSection`, `InterestsSection` ni `ContactSection` (decision del usuario: quitar los enlaces sin seccion).
- **No** se eliminan las rutas `/profile`, `/experience`, `/interests`, `/contact` de `routesMap`/`routes`, ni las claves i18n de esas secciones (RULES 0.2 + copy ya preparado). Queda como pendiente documentado: son rutas sin entrada de UI hasta que existan las secciones.
- No se toca hero, cursor, CRT, fondos, i18n, datos, reveals, Lenis ni `khatarsis` (solo lectura).
- No se agrega el link "Ver en GitHub" (`projects.viewOnGitHub` + `project.url` siguen sin elemento UI): no fue pedido.
- No se toca `src/components/crt/Crt.vue` (overlay de intro con `bg-black`, z-50, dura ~1.4 s) ni `TopGradualBlur.vue` (`backdrop-filter` sin color), salvo que la decision D9 lo pida.
- No se toca el shader de `TvStaticBackground.vue` (nieve blanca, `z-(-10)`): queda detras del faulty terminal.

## Restricciones

- RULES 0.1 (nada de Git), 0.2 (sin eliminar archivos), 0.3 (alcance acotado a los 4 ajustes), 0.4 (dev/build/preview/lint/format requieren autorizacion aparte), 0.6 (cero duplicacion: card reutiliza `k-card`, duracion via defaults), 0.13 y CODING_STANDARDS §2.1 (codigo 100% en ingles; copy via i18n).
- CODING_STANDARDS §7: flex + gap + padding, sin margenes; sin valores `[...]`; no alterar tipografia heredada mas alla de lo que ya fija `k-card` con su `size`; Tailwind-first con `@apply`, y CSS nativo solo en las excepciones ya permitidas por §7.6(b): `scrollbar-color`, `scrollbar-width` y `background-image` con SVG data-uri (flechas). Variables nuevas documentadas aqui.
- khatarsis en solo lectura: no se modifica la libreria (`../khatarsis`), solo se consume.
- Skills subordinadas (`vue-best-practices`, `tailwind-css-patterns`, `accessibility`): referencia; prevalece el estandar local.

## Cambios propuestos (a detallar en enrichment)

### A. Navbar visible + solo secciones existentes

1. `Navbar.vue`: `class="hidden items-center gap-6 sm:flex"` → `class="flex items-center gap-6"` (el resto del markup intacto).
2. `router/index.ts`: `NAV_SECTIONS` pasa a una sola entrada real (`projects`: `hash: '#projects'`, `sectionId: 'projects'`, `labelKey: 'nav.projects'`). Revisar que `NavSection`, `SectionId` y el `scrollBehavior` sigan sin tipos/imports huerfanos (`noUnusedLocals` activo).
3. Resultado esperado: el navbar muestra el logo + "Proyectos" + el toggle de tema, siempre visible en cualquier ancho; sin enlaces sin destino.

### B. `ProjectCard.vue` sobre `k-card`

4. `<div v-effect="'skew'" class="h-full">` externo (una directiva por elemento) + `<k-card as="article" bordered rounded class="h-full" v-effect="'spotlight'">` con:
   - slot `media`: banda `h-48 bg-neutral-950 p-6` con `img object-contain` (`alt` = nombre) o el placeholder de iniciales cuando `project.image` esta vacio (hoy: Alytos).
   - slot `title`: `<h3>` con el nombre (decision abierta D3: `<h3>` por semantica vs `:title` prop de k-card).
   - contenido: descripcion + fila `k-tooltip` (`mdi:information`) + `k-chip v-for size="sm"`.
5. Eliminar del componente las clases de card duplicadas (borde, fondo, radio, `overflow-hidden`) que ahora aporta `k-card`.

### C. Scrollbar por tema (Chrome/Safari con flechas, Firefox con `scrollbar-color`)

6. `src/style.css`: tokens por tema en lugar de valores fijos, p. ej.
   ```css
   @theme {
     --color-scrollbar-track: <light>;
     --color-scrollbar-thumb: <light>;
     --color-scrollbar-thumb-hover: <light>;
   }
   :root.dark { --color-scrollbar-track: #000; --color-scrollbar-thumb: #995cd0; --color-scrollbar-thumb-hover: #b27fe3; }
   ```
   (los nombres/valores exactos se fijan en enrichment, ver D1) y las reglas del scrollbar referencian los tokens (`@apply bg-scrollbar-track`, etc.) **sin** variantes `dark:` dentro de pseudo-elementos (la causa raiz del fallo).
7. Envolver `html { scrollbar-width; scrollbar-color }` en `@supports not selector(::-webkit-scrollbar)` para que solo aplique en Firefox; Chrome/Safari se quedan con `::-webkit-scrollbar*` (flechas incluidas).
8. Documentar en el plan que la excepcion de CSS nativo es §7.6(b) (`scrollbar-color`/`scrollbar-width`/SVG data-uri) + variables de tema.

### D. Ruido TV a 2000 ms

9. `useStaticFlash.ts`: `flashOnNavigate(durationMs = 2000)` y `flashOnThemeToggle(durationMs = 2000)` (defaults = fuente unica de la duracion).
10. `App.vue` L43: `flashOnNavigate()` sin argumento (hereda 2000).
11. `Navbar.vue`: dejar **una sola** invocacion — el `watch(theme, ...)` — y quitar la llamada duplicada de `handleToggleTheme` (RULES 0.6); el flash ya cubre cualquier cambio de tema.

### E. Faulty terminal: fondo claro en light mode

12. Diagnostico: el "fondo negro" de la pagina **no** es CSS. `FaultyTerminalBackground.vue` renderiza un canvas WebGL `fixed inset-0 z-0` cuyo fragmente termina en `gl_FragColor = vec4(col, 1.0)` (**opaco**) y donde los digitos son aditivos sobre negro (`vec3 baseColor = vec3(0.9) * middle + sum * 0.1 * vec3(1.0) * bar`, con `uTint: '#995CD0'`, `uBrightness: 0.5`). Medido en runtime: `html` y `body` tienen `background-color: rgba(0,0,0,0)` y el canvas tiene `opacity: 1` → el fondo que se ve es el shader, igual en light y en dark.
13. Cambio pedido: que el fondo sea **blanco en light mode**, conservando el look actual en dark (RULES 0.3: no se cambia lo no pedido). Enfoques posibles a decidir en enrichment:
    - **(a) Uniform de fondo en el shader (propuesto, fiel):** un `uBackground` (vec3) + un camino de render claro que mapee la intensidad del digito sobre el fondo (`col = mix(uBackground, ink, mask)`), dejando intacto el camino aditivo actual cuando el tema es dark.
    - **(b) Alfa + fondo CSS:** que el shader emita alfa (0 donde no hay digito) y que el contenedor ponga el color de fondo por tema, conservando el bajo el shader para dark.
    - **(c) Solo CSS:** `filter: invert(1)` o `mix-blend-mode` sobre el canvas en light. Minimo codigo, pero invierte tambien el violeta de marca (los digitos dejarian de ser violetas) → probablemente inaceptable.
14. **Reactividad obligatoria:** hoy los uniforms se fijan una sola vez en `onMounted` (`program.setUniform(...)`) y el loop solo actualiza `iTime`; un cambio de tema en vivo **no** re-renderiza. Cualquier enfoque necesita escuchar `theme` (o `isDark`) y volver a aplicar el uniform de fondo + repintar un frame, incluyendo el camino de `prefers-reduced-motion`/`pause` (que hoy pinta un frame unico).
15. **Consecuencia obligatoria (contraste):** con el fondo claro en light mode, todo lo que hoy asume fondo oscuro queda ilegible. Revisado en el codigo actual: `Navbar.vue` L44 (logo `text-white`), L56-57 (activo `text-white` / inactivo `text-zinc-300`), `GlitchText.vue` (`.glitch-text::before/::after { background: rgb(0 0 0 / 50%); text-shadow: -2px 0 #fff; }`), `HeroSection.vue` L86 (`text-violet-300`). El `body` ya tiene `text-black dark:text-white` (`style.css` L28) y el hero perdio sus colores fijos por el cambio externo de las 20:53. Los botones `k-button relief/hover` del hero hay que mirarlos en light en la verificacion visual.

## Decisiones abiertas (se resuelven en enrichment)

- **D1. Colores del scrollbar por tema.** Propuesta: dark = track `#000`, thumb `#995cd0`, hover `#b27fe3` (actual); light = track `#fff`, thumb/hover en el violeta del tema (`--kt-primary` / `#7c3aed`) para contraste sobre blanco. Falta tu confirmacion de los dos valores del thumb en light.
- **D2. `size` de `k-card`.** `md` (default, padding `p-2`) cambia el aire interior actual (`p-6`); alternativas `lg` (`p-2.5`) o `xl` (`p-3` + `text-lg`). Se propone `md` para adoptar el look khatarsis tal cual; se puede ajustar con la prop `ui` (selectores CSS) si hace falta.
- **D3. Titulo de la card.** Propuesta: slot `#title` con `<h3>` (mantiene la jerarquia h2 de la seccion → h3 de la card y la semantica actual) en vez de la prop `title` (que renderiza un `span`).
- **D4. Flechas SVG en light.** Propuesta: dejar las flechas en el violeta de marca en ambos temas (evita duplicar 8 reglas de data-uri). Alternativa: `mask` + `background-color` tokenizado si se quiere que la flecha tambien cambie.
- **D5. Rutas `/profile`, `/experience`, `/interests`, `/contact`.** Propuesta: conservarlas (evita pantallas vacias y no pierde estructura); se documentan como pendientes hasta que existan esas secciones.
- **D6. Claves i18n y tipos que quedan sin uso** (`nav.profile/experience/interests/contact`, `SectionId` con valores muertos): propuesta conservarlas (copy listo para las secciones futuras) y documentarlo.
- **D7. Contraste de light mode.** Con el fondo claro hay que decidir los colores: logo/enlaces del navbar (violeta de marca vs `text-neutral-*`), capas del glitch en `GlitchText` (sombra oscura en vez de `#fff`), rol del hero (`text-violet-300` no se lee sobre blanco). Propuesta: violeta de marca (`--kt-primary`) para acentos y `neutral-*` para texto, igual que ya hace la seccion de proyectos.
- **D8. Enfoque del fondo claro** (12.13): (a) uniform en el shader, (b) alfa + fondo CSS, (c) CSS invert. Propuesta: (a) o (b), nunca (c).
- **D9. Overlay de intro CRT** (`Crt.vue`, `bg-black` + linea blanca, ~1.4 s al cargar): hoy aparece negro aunque el tema sea light. Propuesta: dejarlo como efecto CRT (no es el fondo de la pagina); confirmar si tambien debe seguir el tema.
- **D10. Densidad/contraste del terminal en light.** `uBrightness: 0.5` y `uTint: '#995CD0'` estan calibrados para fondo negro; sobre blanco puede hacer falta bajar la intensidad de los digitos para que no cansen la vista. Propuesta: mantener `uTint` y bajar intensidad solo en light, a confirmar con vos en la revision visual.

## Pasos

1. **read** todos los archivos del alcance + este plan; confirmar que el diagnostico sigue vigente (si hay delta, detener y reportar). Ojo con la edicion concurrente de `HeroSection.vue`.
2. **edit** `src/components/layout/Navbar.vue` (A1 + item 11).
3. **edit** `src/router/index.ts` (A2).
4. **edit** `src/components/projects/ProjectCard.vue` (B4-B5) con las decisiones D2/D3.
5. **edit** `src/style.css` (C6-C8) con la decision D1.
6. **edit** `src/composables/useStaticFlash.ts` + `src/App.vue` (items 9-10).
7. **edit** `src/components/background/FaultyTerminalBackground.vue` (E12-E14) con el enfoque que se decida en D8 + reaccion al tema.
8. **edit** `src/components/layout/Navbar.vue` + `src/components/hero/GlitchText.vue` + `src/components/hero/HeroSection.vue` (E15 + D7): colores theme-aware para fondo claro, sin tocar el look de dark.
9. **verificacion estatica:** `NAV_SECTIONS` sin entradas muertas; `k-card` usado (cero clases de card duplicadas en `ProjectCard.vue`); ningun `dark:` dentro de pseudo-elementos de scrollbar; `2000` como unica duracion del flash; cero colores fijos ilegibles sobre fondo claro en navbar/glitch/hero; sin imports/vars sin usar; sin `[...]` ni margenes nuevos.
10. **verificacion real** (requiere autorizacion aparte, RULES 0.4): `bun run lint:check`, `bun run format:check`, `bun run build`; `bun run dev` para comprobar en el navegador: navbar con enlaces visibles a cualquier ancho, cards `k-card` con skew+spotlight/chips/tooltip, scrollbar y fondo del terminal cambiando con el tema (light y dark), texto legible en ambos temas, flash de 2 s en tema y en navegacion.
11. **reviewer + DoD** antes de `CLOSED`.

## Verificacion

- Estatica (sin autorizacion): grep de `hidden sm:flex`, de `NAV_SECTIONS`, de `scrollbar-color`/`::-webkit-scrollbar`, de `3000`/`5000` en `useStaticFlash`/`Navbar`/`App`, y de las clases de card duplicadas.
- Runtime (autorizada): en el navegador, `getComputedStyle(document.documentElement).scrollbarColor` debe cambiar entre light y dark; el navbar debe mostrar los enlaces a 408 px (hoy `display: none`); el DOM de cada card debe ser un `k-card` (`article.card` con `data-variant`), no el `div` manual.
- Comandos: `bun run lint:check` y `bun run format:check` (inspeccion segura) + `bun run build`/`bun run dev` (autorizacion aparte por RULES 0.4).
- Runtime del punto E: en light, el fondo debe ser claro y el texto del hero/navbar legible; en dark, el fondo debe seguir siendo el terminal actual (sin regresion visual). Comprobable tambien con `getComputedStyle` / muestreo del canvas en el preview ya registrado sobre `localhost:5173`.

## Enrichment tecnico (2026-09-10) — compuerta "enriquece el plan" atendida

### Analisis

- **Objetivo exacto:** 5 ajustes acotados (navbar visible y sin enlaces muertos, cards de proyectos sobre `k-card`, scrollbar por tema, ruido TV a 2 s, fondo claro del faulty terminal en light mode). Sin features nuevas.
- **Scope:** 8 archivos de aplicacion (2 router/navbar, 1 card, 1 style, 2 duracion, 2 del fondo y contraste) + este plan. Nada fuera.
- **Fuentes verificadas por lectura real (no inferidas):**
  - `Navbar.vue` (76 lineas), `router/index.ts` (86), `ProjectCard.vue` (60), `ProjectsSection.vue`, `style.css` (109), `useStaticFlash.ts` (32), `App.vue` (52), `FaultyTerminalBackground.vue` (418), `GlitchText.vue`, `HeroSection.vue`, `Crt.vue`, `TopGradualBlur.vue`, `useTheme.ts`, `TvStaticBackground.vue`.
  - khatarsis (solo lectura, fuente real en `../khatarsis/packages/khatarsis/src`): `components/index.ts` (registra `'k-card': Card`), `base/card/Card.vue` (props/slots/estilos), `blocks/product-card/ProductCard.vue` (precedente de uso), `effects/directive.ts` + `effects/skew.ts` + `effects/spotlight.ts`, `composables/useUi.ts` (la prop `ui` son **selectores CSS**, se aplican por MutationObserver), `effects/webgl/renderer.ts` (WebGL2 con `alpha: true`), `program.ts` (`setUniform` soporta `Float32Array` de 2/3/4), `scene.ts` (`clearColor(0,0,0,0)` + draw).
  - `node_modules/khatarsis/dist/khatarsis.es.js`: `k-card` presente en el bundle que carga la app (5 registros) → no hay riesgo de componente inexistente.
- **Riesgos identificados:** ver seccion "Riesgos" al final.

### Decisiones (resueltas; antes eran D1-D10)

| # | Decision | Resolucion |
| --- | --- | --- |
| 1 | Colores del scrollbar | Tokens por tema. **Light (default):** track `#ffffff`, thumb `#7c3aed`, hover `#8b5cf6`. **Dark (`:root.dark`):** track `#000000`, thumb `#995cd0`, hover `#b27fe3` (lo actual, sin cambios en dark). |
| 2 | `size` de `k-card` | `size="md"` (default nativo de khatarsis). **Excepcion §7.4 documentada:** la card fija su propio padding interno (`p-2` en `header/content/footer`); el texto sigue heredando los 14px de la seccion porque se evita `size="xl"` (que aplicaria `text-lg`). Si en la revision visual queda apretado, el unico knob es la prop `size`, no clases sueltas. |
| 3 | Titulo de la card | Slot `#title` con `<h3 class="font-bold">`. Motivo tecnico verificado: el slot `#title` reemplaza al `<span class="title">` de la libreria, asi que su tipografia (`leading-none font-semibold whitespace-nowrap`) **no** se aplica y se conserva la tipografia actual (14px bold) sin tocar `text-*` en el proyecto (§7.4). |
| 4 | Flechas SVG del scrollbar | Se quedan con el violeta de marca hardcodeado en ambos temas (evita duplicar 8 reglas de data-uri). Documentado como excepcion §7.6(b). |
| 5 | Rutas `/profile`, `/experience`, `/interests`, `/contact` | Se conservan en `routesMap`/`routes` (evita pantallas en blanco y no pierde la estructura para las secciones futuras). Pendiente documentado. |
| 6 | Claves i18n y tipos sin uso | Se conservan (`nav.profile/experience/interests/contact` y `SectionId`, que **ya** estaba sin consumidores antes de este plan: verificado por grep, solo el router lo define). No es deuda introducida aqui. |
| 7 | Contraste en light mode | Navbar: logo y enlace activo `text-black dark:text-white`; enlaces inactivos `text-neutral-600 dark:text-zinc-300`; hover `hover:text-black dark:hover:text-white`. Hero: rol `text-violet-600 dark:text-violet-300`. Glitch: capas invertidas en light (ver E7). |
| 8 | Enfoque del fondo claro | **(a) Uniform de fondo en el shader.** Se descarta (b) alfa + fondo CSS (el contexto se crea con `alpha: true` y `premultipliedAlpha` por defecto `true`, lo que obliga a emitir RGB premultiplicado) y (c) `filter: invert` (arruina el violeta de marca). |
| 9 | Overlay de intro CRT | `Crt.vue` **no se toca**: `bg-black` + linea blanca son el efecto de encendido del tubo, no el fondo de la pagina. |
| 10 | Densidad del terminal en light | No se toca `uBrightness` (esta calibrado para dark). El knob del light pasa a ser el color de tinta `lightInk` (E6). **Confirmado por el usuario 2026-09-10: violet-400 `#a78bfa`.** |

### Cambios

#### E1. `src/router/index.ts` (edit)

- `NAV_SECTIONS` pasa de 5 entradas a **una**: `{ name: 'projects' as const, hash: '#projects' as const, sectionId: 'projects' as const, labelKey: 'nav.projects' as const }` dentro del `as const`.
- **No** se toca: `RouteName`, `routesMap`, `routes`, `scrollBehavior` (su rama `byPath` sigue funcionando: `/projects` resuelve y los demas paths quedan como deep links sin entrada de UI, decision 5), `NavSection`/`SectionId` (decision 6).
- Unico consumidor de `NAV_SECTIONS` en el repo: `Navbar.vue` L7/L53 (verificado por grep).

#### E2. `src/components/layout/Navbar.vue` (edit)

1. L45: `<ul class="hidden items-center gap-6 sm:flex">` → `<ul class="flex items-center gap-6">` (siempre visible, sin breakpoint; pedido explicito del usuario).
2. L21: `watch(theme, () => { flashOnThemeToggle(3000) })` → `watch(theme, () => flashOnThemeToggle())` (default 2000, ver E5).
3. L31: en `handleToggleTheme` queda **solo** `toggleTheme()`; se elimina la llamada duplicada a `flashOnThemeToggle` (el `watch` sobre `theme` ya dispara con cualquier cambio de tema).
4. Contraste (decision 7): L44 logo `text-white` → `text-black dark:text-white`; L56 `'font-medium text-white'` → `'font-medium text-black dark:text-white'` y `'text-zinc-300'` → `'text-neutral-600 dark:text-zinc-300'`; L57 `hover:text-white` → `hover:text-black dark:hover:text-white`. No se toca ninguna clase de tamano/tipografia (§7.4).

#### E3. `src/components/projects/ProjectCard.vue` (edit)

Reemplazo del `<template>` (el `<script setup>` no cambia: `props`, `description`, `initials`). Estructura de **3 niveles obligatoria** (evita que GSAP y `skew` peleen por `el.style.transform`):

```vue
<template>
  <div class="h-full">
    <div v-effect="'skew'" class="h-full">
      <k-card v-effect="'spotlight'" as="article" bordered rounded class="h-full" size="md">
        <template #media>
          <div class="flex h-48 w-full items-center justify-center overflow-hidden bg-neutral-950 p-6">
            <img v-if="props.project.image" :src="props.project.image" :alt="props.project.name"
                 class="max-h-full max-w-full object-contain" loading="lazy" />
            <span v-else class="text-5xl font-black text-white" aria-hidden="true">{{ initials }}</span>
          </div>
        </template>
        <template #title>
          <h3 class="font-bold">{{ props.project.name }}</h3>
        </template>
        <p class="text-neutral-600 dark:text-zinc-400">{{ description }}</p>
        <div class="flex flex-wrap items-center gap-2">
          <k-tooltip :content="t('projects.techTooltip')">
            <k-icon :aria-label="t('projects.techTooltip')" name="mdi:information" />
          </k-tooltip>
          <k-chip v-for="tech in props.project.tech" :label="tech" :key="tech" size="sm" />
        </div>
      </k-card>
    </div>
  </div>
</template>
```

- Nivel 1 (`div.h-full`) es el que recibe `data-reveal` por fallthrough desde `ProjectsSection` (es su unico root). **No** se le pone `v-effect`: `useReveal` anima `transform: translateY` sobre ese elemento y `skew` escribe `transform` en el suyo; mezclarlos en un solo elemento se pisaria (gsap sobreescribe `el.style.transform` en cada frame).
- Nivel 3 = `k-card` (single root): la directiva `v-effect` sobre un componente se aplica a su elemento raiz. `spotlight` inyecta un `<span>` absoluto como ultimo hijo, recortado por el `overflow-hidden` + `rounded-xl` de la card (`border-radius: inherit`).
- `as="article"` evita el `<section>` por defecto de la card (ya hay un `<section id="projects">`).
- `bordered` y `rounded` explicitos (son los defaults, pero `khatarsis` los escribe explicitos en su `ProductCard`; mismo patron).
- Se eliminan las clases de card duplicadas (`flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900`): borde, radio, fondo, `overflow` y variante dark los aporta `k-card`.
- Se conserva: banda `h-48` + `bg-neutral-950` (los logos SVG blancos necesitan fondo oscuro en ambos temas), `alt` real, `aria-hidden` del placeholder de iniciales, `k-tooltip` + `k-icon` accesible y `k-chip size="sm"`.
- Nunca usar la prop `ui` de `k-card`: sus claves son selectores CSS aplicados por MutationObserver (`useUi.ts`), innecesario y fragil para este caso.

#### E4. `src/style.css` (edit)

1. Reemplazar el bloque `html { scrollbar-width: thin; scrollbar-color: #995cd0 #000 }` (L50-53) por tokens de tema + guard de soporte:

```css
/* Theme-aware scrollbar tokens: light is the default, dark overrides on <html>. */
@theme {
  --color-scrollbar-track: #ffffff;
  --color-scrollbar-thumb: #7c3aed;
  --color-scrollbar-thumb-hover: #8b5cf6;
}

:root.dark {
  --color-scrollbar-track: #000000;
  --color-scrollbar-thumb: #995cd0;
  --color-scrollbar-thumb-hover: #b27fe3;
}

/* Standard scrollbar properties only where ::-webkit-scrollbar does not exist
   (Firefox): a non-auto scrollbar-color makes Chromium/Safari ignore the
   ::-webkit-scrollbar* customization, arrows included. */
@supports not selector(::-webkit-scrollbar) {
  html {
    scrollbar-width: thin;
    scrollbar-color: var(--color-scrollbar-thumb) var(--color-scrollbar-track);
  }
}
```

2. `::-webkit-scrollbar-track { @apply bg-white dark:bg-black }` → `::-webkit-scrollbar-track { @apply bg-scrollbar-track }`. **Esta es la causa raiz**: `@apply` con variante dentro de un pseudo-elemento producia `::-webkit-scrollbar-track:where(.dark, .dark *)` (pseudo-clase no-accional despues de un pseudo-elemento), regla que el navegador descarta; el token elimina la necesidad de la variante.
3. `::-webkit-scrollbar-thumb { background-color: #995cd0; ... }` → `@apply bg-scrollbar-thumb;` + se conservan tal cual las 3 declaraciones nativas preexistentes (`border-radius: 9999px`, `border: 3px solid transparent`, `background-clip: content-box`; excepcion §7.6(b) documentada).
4. `::-webkit-scrollbar-thumb:hover { background-color: #b27fe3 }` → `@apply bg-scrollbar-thumb-hover;`.
5. Las 8 reglas de flechas (`background-image` con SVG data-uri) quedan intactas (decision 4).
6. `body { @apply text-black dark:text-white }` y `::selection` no se tocan.

#### E5. `src/composables/useStaticFlash.ts` + `src/App.vue` (edit)

- `useStaticFlash.ts` L18: `export function flashOnNavigate(durationMs = 2000): void`; L26: `export function flashOnThemeToggle(durationMs = 2000): void`. Los defaults pasan a ser la **unica** fuente de la duracion (RULES 0.6).
- `App.vue` L43: `flashOnNavigate(5000)` → `flashOnNavigate()`.
- `Navbar.vue`: ver E2 (una sola invocacion).

#### E6. `src/components/background/FaultyTerminalBackground.vue` (edit)

El fondo visible es este canvas WebGL (opaco, `gl_FragColor = vec4(col, 1.0)`); `html`/`body` son transparentes. Se hace que el shader reciba el fondo y la tinta por tema, **sin cambiar el render de dark** (matematica identica, ver nota).

1. Imports del `<script setup>`: sumar `watch` a los imports de `vue` y `import { useTheme } from '@/composables/useTheme'` (el repo ya acopla componentes de `background/` a composables de la app: `TvStaticBackground.vue` importa `useStaticFlash`). `const { theme } = useTheme()`.
2. Props nuevas (con defaults en `withDefaults`): `lightBackground: '#ffffff'`, `lightInk: '#a78bfa'` (violet-400; alternativas de un solo valor: `#c4b5fd` violet-300 mas sutil / `#7c3aed` violet-600 mas marcado). El resto de props no cambia.
3. Fragment shader: agregar `uniform vec3 uBackground;` y `uniform vec3 uInk;` y, **justo despues** de `col *= uTint; col *= uBrightness;` y **antes** del bloque `uDither`:

```glsl
// Digitos como tinta sobre el fondo del tema. En dark (uBackground=negro,
// uInk=tint*brightness) el resultado es identico al aditivo original: mask ya
// es la intensidad cruda del digito, porque col = raw * tint * brightness.
vec3 emission = uTint * uBrightness;
float emissionMax = max(max(emission.r, emission.g), emission.b);
float mask = clamp(max(max(col.r, col.g), col.b) / max(emissionMax, 0.0001), 0.0, 1.0);
col = mix(uBackground, uInk, mask);
```

4. Uniforms iniciales (en el mapa de `createProgram`): `uBackground` = `Float32Array` de `hexToRgb(theme.value === 'light' ? props.lightBackground : '#000000')`; `uInk` = `Float32Array` de `hexToRgb(props.tint).map(c => c * props.brightness)` en dark, o `hexToRgb(props.lightInk)` en light. Deben quedar aplicados **antes** del primer `renderFrame(performance.now())` y del render de `prefers-reduced-motion`/`pause`.
5. Reactividad: `watch(theme, () => { reaplicar uBackground/uInk; si el loop no esta corriendo (reduced-motion/pause) -> renderScene(gl, mesh) })`. Sin esto el canvas no repinta al cambiar de tema (hoy los uniforms se fijan una sola vez en `onMounted`). Guardar el `stop` del watcher no hace falta (el componente vive toda la app), pero el `onBeforeUnmount` debe liberar el contexto como hoy.
6. No se toca: `renderFrame`, el loop, `resize`, `handleVisibility`, `uPageLoadProgress`, `uDither`, `uChromaticAberration`, `uCurvature` ni la logica de mouse.

#### E7. Contraste de light mode (edit) — consecuencia obligatoria de E6

- `src/components/layout/Navbar.vue`: decision 7 (ya detallado en E2.4).
- `src/components/hero/HeroSection.vue` L86: `text-5xl font-black text-violet-300` → `text-5xl font-black text-violet-600 dark:text-violet-300` (unico cambio; el archivo no se toca en nada mas, respetando la edicion externa de las 20:53).
- `src/components/hero/GlitchText.vue` (`<style scoped>`, `.glitch-text::before/::after`): los dos valores fijos (`background: rgb(0 0 0 / 50%)` y `text-shadow: -2px 0 #fff`) pasan a tokens de tema definidos en `style.css` junto a los del scrollbar: `@theme { --color-glitch-layer: <light>; --color-glitch-shadow: <dark> }` y `:root.dark { ...invertidos... }`, usados como `background: var(--color-glitch-layer)` y `text-shadow: -2px 0 var(--color-glitch-shadow)`. Valores propuestos: light = capa `rgb(255 255 255 / 50%)` + sombra `#000`; dark = capa `rgb(0 0 0 / 50%)` + sombra `#fff` (los actuales). `text-shadow` y `var()` son excepcion §7.6(b) (no existen utilidades de Tailwind para `text-shadow`). No se toca el `@media (prefers-reduced-motion: reduce)` ni los `@keyframes`.
- No se toca `Crt.vue` (decision 9), `TopGradualBlur.vue` (solo `backdrop-filter`), `ProjectCard` (banda `bg-neutral-950` intencional) ni `TvStaticBackground.vue` (nieve blanca detras del terminal).

### Restricciones (refinadas)

- RULES 0.1 (sin Git), 0.2 (sin eliminar archivos), 0.3 (solo los 5 ajustes), 0.4 (dev/build/preview requieren autorizacion aparte), 0.6 (cero duplicacion), 0.13 + CODING_STANDARDS §2.1 (codigo en ingles; copy en i18n).
- §7.1-§7.3, §7.5: sin margenes, sin valores `[...]`, sin `width/height` fijos mezclados con `flex-*`; `min-w-0` solo si hay causa (no hace falta).
- §7.4 (tipografia): no se agregan/cambian clases `text-*` de tamano mas alla de los colores; la unica excepcion es la que fija `k-card` por su `size` (decision 2) y queda documentada.
- §7.6 (Tailwind-first): excepciones documentadas en este plan — `scrollbar-color`, `scrollbar-width`, `background-image` con SVG data-uri, `text-shadow`, `background-clip`/`border`/`border-radius` preexistentes del thumb, variables de tema (`--color-scrollbar-*`, `--color-glitch-*`) y los strings GLSL del shader (no son CSS).
- khatarsis solo lectura; sin dependencias nuevas; `bun` como gestor; sin comandos inventados.
- No revertir la edicion externa de `HeroSection.vue` (20:53). Releer todo antes de editar.

### Steps

1. **read** (obligatorio antes de editar): `src/router/index.ts`, `src/components/layout/Navbar.vue`, `src/components/projects/ProjectCard.vue`, `src/style.css`, `src/composables/useStaticFlash.ts`, `src/App.vue`, `src/components/background/FaultyTerminalBackground.vue`, `src/components/hero/HeroSection.vue`, `src/components/hero/GlitchText.vue`. Si algo no coincide con E1-E7 (por ediciones concurrentes), detener y reportar antes de tocar.
2. **edit** `src/router/index.ts` (E1).
3. **edit** `src/components/layout/Navbar.vue` (E2 completo).
4. **edit** `src/components/projects/ProjectCard.vue` (E3, solo el `<template>`).
5. **edit** `src/style.css` (E4 items 1-4).
6. **edit** `src/composables/useStaticFlash.ts` + `src/App.vue` (E5).
7. **edit** `src/components/background/FaultyTerminalBackground.vue` (E6).
8. **edit** `src/components/hero/HeroSection.vue` + `src/components/hero/GlitchText.vue` + tokens de `src/style.css` (E7).
9. **verificacion estatica** (grep, sin permisos): 
   - `hidden sm:flex` ausente; `NAV_SECTIONS` con 1 entrada y sin `profile/experience/interests/contact`; `routesMap` intacto.
   - `k-card` presente en `ProjectCard.vue`; ausentes las clases `rounded-2xl border border-neutral-200 bg-white dark:bg-neutral-900` en ese archivo; `v-effect` sigue apareciendo 2 veces con un solo elemento entre cada uno.
   - Cero `@apply` con variante `dark:` dentro de reglas de pseudo-elemento; `@supports not selector(::-webkit-scrollbar)` presente; `scrollbar-color` solo dentro del guard.
   - `2000` en los dos defaults de `useStaticFlash.ts` y cero `3000`/`5000` en `Navbar.vue`/`App.vue`.
   - Cero `text-white`/`text-zinc-300` incondicionales en `Navbar.vue`; `text-violet-300` solo como variante `dark:`.
10. **verificacion real** (RULES 0.4, autorizacion aparte): `bun run lint:check`, `bun run format:check`, `bun run build`; `bun run dev` para revision visual.
11. **reviewer + DoD** antes de `CLOSED`.

### Verificacion

- **Estatica:** la de Step 9 (grep).
- **Comandos (autorizacion aparte):** `bun run lint:check` y `bun run format:check` exit 0; `bun run build` sin errores nuevos de `vue-tsc`; con el build hecho, revisar el CSS generado: el track del scrollbar **no** debe quedar con un color incondicional (hoy dev = `background-color: white` y prod = `#000`; tras el fix ninguno de los dos, sino `var(--color-scrollbar-track)`).
- **Runtime (dev server):**
  - Navbar: a ~408 px de ancho los enlaces de seccion se ven (`display: flex`, ancho > 0) y solo existe el enlace de Proyectos (`href="/#projects"`); el logo y el toggle de tema siguen ahi.
  - Cards: cada card es un `k-card` (`<article class="card ..." data-variant="base">`), con skew+spotlight al hover, chips, tooltip y banda `h-48`.
  - Scrollbar: `getComputedStyle(document.documentElement).scrollbarColor` cambia entre light y dark (hoy es fijo `rgb(153,92,208) rgb(0,0,0)`); el track del pseudo-elemento cambia de color al alternar el tema (hoy no cambia: `rgb(255,255,255)` en ambos).
  - Flash: al cambiar de tema y al navegar, `flashOnThemeToggle`/`flashOnNavigate` mantienen `isFlashVisible` en `true` ~2 s (medible con un `setTimeout` de referencia o visualmente contra el ruido TV).
  - Fondo: en light el terminal se ve claro y el hero/navbar legibles; en dark el terminal se ve igual que hoy (sin regresion).
- **DoD:** el plan queda `EXECUTED` al implementar; `CLOSED` solo con verificacion documentada (aprobada o pendiente aceptada) + entrada de cierre.

### Riesgos

1. **`v-effect` sobre un componente** (`<k-card v-effect="'spotlight'">`): funciona porque `Card.vue` tiene root unico; si khatarsis cambiara a fragment root la directiva fallaria con warning. No se toca la libreria (solo lectura).
2. **GSAP vs skew:** mitigado con los 3 niveles del template (E3); el nivel 1 conserva `data-reveal` y los otros dos los efectos.
3. **Light ink:** `#a78bfa` es una eleccion estetica (mas marcada que la simetria con dark). El knob es de un solo valor por prop (`lightInk`), sin tocar el shader.
4. **Scrollbar en Chrome:** al quitar `scrollbar-color` en Blink vuelve la barra personalizada de 12 px con flechas (hoy el navegador la ignora). Es el comportamiento pedido, pero es un cambio visual mas alla del color: confirmar en la revision visual.
5. **`@supports not selector(::-webkit-scrollbar)`:** si un navegador reportara soporte y a la vez ignorara los pseudo-elementos, perderia `scrollbar-width/color`. Riesgo bajo (Firefox no soporta `::-webkit-scrollbar`; Blink/Safari si).
6. **Pause/reduced-motion:** el watcher de tema debe repintar explicitamente o el fondo no cambiaria para esos usuarios (incluido en E6.5).
7. **Edicion concurrente:** otros agentes pueden estar tocando los mismos archivos (`HeroSection.vue` cambio a las 20:53). Releer antes de editar y no pisar cambios ajenos; si aparecen conflictos de alcance, reportar.
8. **Tipos sin uso:** `SectionId` queda con valores reducidos y sin consumidores (ya lo estaba antes); `noUnusedLocals` no aplica a exports, no rompe `vue-tsc`. Si el reviewer lo marca como codigo muerto, se resuelve en un plan aparte (no se elimina aqui: RULES 0.2/0.3).

## Registro de ejecucion (2026-09-10, Executor, compuerta "ejecuta el plan")

- Cambios reales (E1-E7, sin desviaciones de alcance):
  - `src/router/index.ts`: `NAV_SECTIONS` reducido a `projects` (unico ancla existente) + comentario del porque. `routesMap`, `routes`, `scrollBehavior`, `RouteName`, `NavSection`, `SectionId` intactos.
  - `src/components/layout/Navbar.vue`: `<ul>` a `flex` (sin `hidden sm:flex`); `flashOnThemeToggle()` sin argumento en el `watch` y **eliminada** la llamada duplicada de `handleToggleTheme`; colores theme-aware (logo `text-black dark:text-white`, activo igual, inactivo `text-neutral-600 dark:text-zinc-300`, `hover:text-black dark:hover:text-white`).
  - `src/components/projects/ProjectCard.vue`: `<template>` reconstruido sobre `<k-card as="article" bordered rounded class="h-full" size="md">` con slots `media` (banda `h-48 bg-neutral-950` + `img`/placeholder de iniciales) y `title` (`<h3 class="font-bold">`), contenido con descripcion + `k-tooltip`/`k-icon` + `k-chip size="sm"`; estructura de 3 niveles (reveal / `skew` / `spotlight`) con comentario del porque; eliminadas las clases de card duplicadas. `<script setup>` sin cambios.
  - `src/style.css`: tokens `@theme` + `:root.dark` (`--color-scrollbar-track/thumb/thumb-hover`, `--color-glitch-backdrop/shadow`); `html { scrollbar-width; scrollbar-color }` movidos dentro de `@supports not selector(::-webkit-scrollbar)`; track y thumb con `@apply bg-scrollbar-*` (fuera la variante `dark:` dentro del pseudo-elemento).
  - `src/composables/useStaticFlash.ts`: `flashOnNavigate(durationMs = 2000)` y `flashOnThemeToggle(durationMs = 2000)`.
  - `src/App.vue`: `flashOnNavigate()` (sin 5000).
  - `src/components/background/FaultyTerminalBackground.vue`: uniforms `uBackground`/`uInk` en el fragment shader + `col = mix(uBackground, uInk, mask)` antes del dither; props `lightBackground` (`#ffffff`) y `lightInk` (`#a78bfa`); `themeUniforms()` + `applyThemeUniforms()` y `watch(theme, applyThemeUniforms)` (repinta un frame si el loop no corre); `useTheme` importado. El resto del shader y el ciclo de vida quedan intactos.
  - `src/components/hero/HeroSection.vue`: rol a `text-violet-600 dark:text-violet-300`.
  - `src/components/hero/GlitchText.vue`: capas del glitch con `var(--color-glitch-backdrop)` y `text-shadow` con `var(--color-glitch-shadow)`; el resto del `<style scoped>` intacto.
- Verificacion estatica (ejecutada, grep): 0 `hidden sm:flex`; `NAV_SECTIONS` con 1 entrada; `k-card` presente y 0 clases de card duplicadas en `ProjectCard.vue`; 0 `@apply` con variante `dark:` en pseudo-elementos; `@supports not selector(::-webkit-scrollbar)` presente; ambos defaults en `2000`; 0 `text-white`/`text-zinc-300` incondicionales en `Navbar.vue`; `violet-300` solo como variante `dark:`; 0 tokens `glitch-*` sin usar.
- Verificacion runtime (ejecutada contra el dev server ya activo en `localhost:5173`, sin arrancar procesos):
  - Navbar: `ul` con `display: flex`, ancho 53 px y un solo enlace (`Proyectos` → `/#projects`).
  - Cards: 5 x `article.card[data-variant="base"]` con hijos `media/header/content/overlay` (k-card real, no el `div` manual).
  - Scrollbar: light → thumb `rgb(124,58,237)` + track `rgb(255,255,255)`; dark → thumb `rgb(153,92,208)` + track `rgb(0,0,0)` (antes era fijo en ambos temas).
  - Fondo: light → `uBackground=[1,1,1]`, `uInk=[0.655,0.545,0.98]` y `readPixels` del centro del canvas = `[255,255,255,255]`; dark → `uBackground=[0,0,0]`, `uInk=[0.3,0.18,0.408]` (= `tint * brightness`, identico al render anterior) y pixeles de fondo negros. Screenshots de ambos temas revisados: light blanco con digitos violeta, dark sin regresion.
- Verificacion pendiente por RULES 0.4 (sin autorizacion del usuario): `bun run lint:check`, `bun run format:check`, `bun run build`. No se ejecutaron; el plan queda `EXECUTED` y no puede pasar a `CLOSED` sin este resultado.
- Pendiente funcional menor (a evaluar en la revision visual): el padding interno de la card pasa de `p-6` a `p-2` por el `size="md"` nativo de khatarsis. Si molesta, el cambio es una sola prop (`size`), no clases sueltas.

### Verificacion autorizada (2026-09-10, RULES 0.4 habilitada por el usuario)

- `bun run lint:check`: **exit 0** tras corregir 3 hallazgos propios (2 de `vue/attributes-order` en `ProjectCard.vue` — `class`/`size` son `ATTR_STATIC` y deben ir antes de los shorthand `bordered`/`rounded` — y 1 de `prettier/prettier` en la terna de `FaultyTerminalBackground.vue`).
- `bun run format:check`: **exit 0** ("All matched files use Prettier code style!") tras agregar los `;` que Prettier pedia en los dos `@apply` de `style.css` (uno de ellos ya estaba sin `;` antes de este plan).
- `bun run build`: **rojo (exit != 0)**, con **3 errores y todos en `src/components/cursor/GlitchCursor.vue`** (archivo ajeno a este plan, con plan propio en curso: TS6133 `follower` sin usar + 2 x TS2769 por listeners `mouseenter` tipados como `PointerEvent`). Verificado con `grep -oE "^src/[^(]+"` sobre la salida de `vue-tsc -b`: ese archivo es el **unico** con errores; los 9 archivos de este plan compilan limpios.
- Motivo por el que este plan **no pasa a `CLOSED`**: el DoD exige build verde y el rojo pertenece a un flujo concurrente (RULES 0.3 prohibe ampliar el alcance). Queda `EXECUTED` con el resultado documentado, a la espera de un cierre explicito del usuario (pendiente aceptado) o del fix de `GlitchCursor.vue` en su propio plan.

## Cierre (memoria persistente)

> Completar al cerrar el plan. Es la entrada de memoria del proyecto (ver `.agents/PLANS.md`). Sin esto, el plan no pasa a CLOSED (DoD).

- Que cambio: [pendiente]
- Verificacion: [pendiente]
- Resultado: [pendiente]
- Pendientes: [pendiente]
