---
name: portfolio-navbar-icons-scroll-blur-xs
status: EXECUTED
type: bugfix
domain: portfolio
owner_rules: .agents
created: 2026-09-13 12:00
enriched: 2026-09-13 13:00
executed: 2026-09-13 14:30
---

# Plan: Iconos navbar + Scroll en reload + Blur estable en contact + Breakpoint xs

> Estados: PENDING -> ENRICHED -> READY -> EXECUTED -> CLOSED (ver `.agents/WORKFLOW.md`).
> Origen: 4 frentes reportados por el usuario el 2026-09-13.
> Enriquecido el 2026-09-13: pasos con archivo, linea, valor y restriccion exactas; evidencia ampliada leyendo la libreria en `node_modules/khatarsis` (symlink a `../khatarsis`, solo lectura) y el set de iconos verificado contra la API de Iconify. Nada de esto se ejecuta sin la compuerta **"ejecuta el plan"**.

## Objetivo

1. Hacer funcionar el breakpoint `xs` (~320px) en el grid de contact: <320px → 1 columna, ≥320px → 2 columnas (hoy la clase no genera efecto).
2. Al recargar con URL en una sección (p. ej. `/#about`), la página debe mantener la posición en vez de saltar a 0, conservando el hash en la URL.
3. Las cards de contact deben mostrar el blur siempre, sin flash transparente al hacer scroll.
4. Añadir iconos a las secciones del navbar (projects, about, contact).

## Alcance

- A editar (6):
  - `src/style.css` — 1 declaracion nueva dentro del `@theme` existente (linea 165).
  - `src/components/contact/ContactImages.vue` — frente 1 (linea 25) + frente 3 (lineas 33 y 55).
  - `src/composables/useSectionSpy.ts` — frente 2 (guard de arranque en `sync()`).
  - `src/views/MainView.vue` — frente 2 (snapshot del hash en setup).
  - `src/router/index.ts` — frente 4 (campo `icon` en las 3 entradas de `NAV_SECTIONS`).
  - `src/components/layout/Navbar.vue` — frente 4 (render del icono en el `router-link`).
- A crear (1): `.agents/decisions/005-deep-link-hash-restore.md` (ADR del frente 2, exigido por RULES 0.12: la decision cambia el contrato de quien posee el hash de la URL).
- Solo lectura (sin cambios): `src/components/layout/FooterSection.vue` (consume `NAV_SECTIONS` y solo usa `hash`/`labelKey`), `src/components/contact/ContactSection.vue`, `src/App.vue`, `src/composables/useSmoothScroll.ts`, `scrollBehavior` de `src/router/index.ts`, `src/components/background/TvStaticBackground.vue`, `src/components/background/FaultyTerminalBackground.vue`.
- Fuera de alcance: no editar la libreria `khatarsis` (repo externo); no cambiar el diseno de las cards (radio, borde, tamanos, efecto hover) ni su contenido; no tocar `scrollBehavior`, `wasSpyNav`, `initSmoothScroll` ni `useReveal`; no redefinir breakpoints existentes (`sm`/`md`/`lg`); no cambiar paletas ni tipografias; no tocar el `icon` desde el footer.

## Hallazgos verificados (orquestador + Enrichment)

1. **`xs` roto por doble causa.** Clase real: `@min-xs:grid-cols-2` (`ContactImages.vue:25`). El prefijo `@` la convierte en *container query* y no existe ningun ancestro `@container` en `src/` (verificado: `@min-`/`@container` aparece solo en esa linea) → nunca matchea. Ademas `xs` no esta declarado: ni el app ni la libreria emiten `--breakpoint-*` (verificado por `grep` en `src/style.css` y `node_modules/khatarsis/dist/khatarsis.css`: cero coincidencias). Los defaults `sm/md/lg` vienen del propio Tailwind. Direccion: declarar `--breakpoint-xs: 20rem` (sintaxis de token v4, sin valores `[...]`, §7.5) y usar `xs:grid-cols-2` mobile-first (base `grid-cols-1` = <320px). El usuario ya edito el archivo por su cuenta (`md:grid-cols-4`, `justify-items-center`, `size-min p-16`); esas decisiones se conservan intactas.

2. **Reload salta a 0 — causa raiz identificada.** `useSectionSpy.ts` corre `schedule()` en `onMounted` → `sync()` con `scrollY === 0` (la restauracion del navegador aun no ocurrio) calcula `activeHash() === ''`; como `route.hash === '#about'`, la linea `void router.replace(hash ? { path: '/', hash } : { path: '/' })` **borra el hash de la URL**. Despues `MainView.vue:20` ejecuta `setTimeout(() => scrollTo(route.hash), 150)`, pero lee un `route.hash` que ya es `''`: `scrollTo('')` no desplaza a ninguna seccion → la pagina queda en 0. Agravantes que se conservan tal cual (ADR-001/ADR-002): `scrollBehavior` devuelve `false` en todas las ramas y delega en `scrollTo` con `setTimeout` de 80 ms; Lenis es el unico motor de scroll.

3. **Flash transparente — cadena verificada, disparador de render hipotetico.** Medido en el bundle de la libreria (`node_modules/khatarsis/dist/khatarsis.es.js:2995`): el `k-card` aplica por defecto `rounded` (`X(t,"card","rounded",!0)`) y `bordered` (`X(t,"card","bordered",!0)`), y el CSS scoped `.card.transparent[data-v-b84d3367]` fija `background-color:#0000` (sin capa). O sea: la unica **superficie** de estas cards es el `backdrop-blur-sm` del portfolio; el borde de 1px y el `radius-xl` son la unica silueta. Efectos verificados en fuente: `skew.ts` solo escribe `transform` + `will-change: transform` (en hover) y `spotlight.ts` solo agrega un `<span>` con `radial-gradient` y `opacity 0→1` (en hover); ninguno toca opacidad/fondo del card, y las cards no llevan `data-reveal` (`useReveal` anima solo el header de la seccion, `MainView` no tiene `ScrollTrigger` sobre contact). Tampoco participa `useStaticFlash` (solo hover del hero, navegacion entre secciones y toggle de tema). Hipotesis restante: el `backdrop-filter` se re-muestrea cada frame sobre los canvas WebGL fijos (TvStatic + FaultyTerminal) durante el rAF de Lenis y algun frame se compone sin el filtro → el card queda solo con su borde. Mitigacion elegida: promover el filtro a su propia capa de composicion con una utilidad estandar de Tailwind.

4. **Iconos navbar — via despejada.** `NAV_SECTIONS` (`router/index.ts:8-27`) admite el campo aditivo `icon` (array `as const`; `useSectionSpy` solo tipa `sectionId`/`hash`, el footer solo `hash`/`labelKey`, asi que el campo extra no rompe ningun consumidor). `k-icon` esta registrado como `KIcon` en `main.ts:13` y ya se usa con nombres `mdi:*` en el repo (`mdi:map-marker` y `mdi:information` en `MapCard.vue`/`ProjectCard.vue`, `mdi:weather-night`/`mdi:white-balance-sunny` en `Navbar.vue`). La resolucion es runtime via `@iconify/vue@5.0.0` (declarado en el `package.json` de la libreria), por eso los nombres se validaron contra la API de Iconify: `folder-multiple`, `account`, `email`, `code-braces`, `send`, `folder-outline`, `account-circle` existen en el set `mdi` (HTTP 200, `https://api.iconify.design/mdi.json?icons=...`). Render solo en el navbar; el footer ignora el campo (sin cambios).

## Decisiones de Enrichment

- **E1 — Breakpoint `xs`.** Token en el `@theme` del app (`--breakpoint-xs: 20rem`) y `xs:grid-cols-2` como unica variante nueva. Descartado `min-[320px]` (valor arbitrario, §7.5) y descartado `@container` (exigiria un ancestro container que hoy no existe y no es lo pedido).
- **E2 — Reload.** Dos edits coordinados y minimos: (a) `useSectionSpy` no descarta un hash de deep-link mientras la posicion inicial no este resuelta; (b) `MainView` fija el hash objetivo en `setup()` (snapshot) y restaura ese valor, para que el destino no dependa de que la URL sobreviva a los primeros frames. No se cambia `scrollBehavior` ni se introduce scroll nativo: Lenis sigue siendo el unico motor (ADR-001/ADR-002 intactos).
- **E3 — Blur estable.** Paso principal: `transform-gpu` en las dos cards de contact (capa de composicion propia para el `backdrop-filter`), sin tocar el diseno (fondo transparente, borde y radio de la libreria quedan igual). **Escalada E1-b, requiere aprobacion explicita del usuario**: si la revision visual sigue mostrando frames sin blur, añadir una superficie translucida con una regla **sin capa** en `src/style.css` (`#contact .card.transparent { @apply bg-white/5 dark:bg-white/5; }`), via que ADR-004 conserva a proposito porque el CSS scoped de la libreria es sin capa y con mas especificidad que una utilidad suelta; el tint cambia el aspecto (deja de ser cristal puro) y por eso no se aplica sin confirmacion visual.
- **E4 — Iconos.** Set fijado y verificado: `projects` → `mdi:folder-multiple`, `about` → `mdi:account`, `contact` → `mdi:email` (alternativa de una linea, si el usuario la pide: `code-braces`/`account-circle`/`send`). Iconos decorativos (`aria-hidden="true"`): no se añade ninguna clave i18n y el texto sigue siendo el accesible. Sin clase de tamano: hereda `1em`, igual que `MapCard.vue`/`ProjectCard.vue`.
- **E5 — ADR.** El frente 2 cambia quien puede borrar el hash de la URL (contrato del spy). Se registra como ADR nuevo en ejecucion (`.agents/decisions/005-deep-link-hash-restore.md`, `status: proposed`), sin editar ADR-001/002/004 (RULES 0.12).

## Pasos

### Frente 1 — Breakpoint `xs` (2 edits)

1. **edit** `src/style.css` (bloque `@theme` de la linea 165, hoy con 5 tokens de color): insertar `--breakpoint-xs: 20rem;` como primera declaracion dentro del bloque. Solo una linea nueva; el resto del archivo intacto (incluido el orden de imports `khatarsis/style.css` → `tailwindcss`, ADR-004). Restricciones: sin `[...]`, sin `!important`, sin tocar tokens existentes.
2. **edit** `src/components/contact/ContactImages.vue:25`: reemplazar la clase `@min-xs:grid-cols-2` por `xs:grid-cols-2`. La clase queda:
   `class="grid flex-1 grid-cols-1 justify-items-center gap-4 xs:grid-cols-2 md:grid-cols-4 md:justify-items-normal"`
   Restricciones: no tocar `justify-items-center`, `flex-1` ni los `md:`; sin margenes.

### Frente 2 — Reload conserva posicion y hash (2 edits + 1 ADR)

3. **edit** `src/composables/useSectionSpy.ts`: guard de arranque en `sync()`. Concretamente, junto a `let frame = 0` (linea 27) añadir `let isDeepLinkPending = route.hash !== ''`, y en `sync()` (linea 40) insertar antes de `const hash = activeHash()`:

   ```ts
   const sync = () => {
     frame = 0
     const hash = activeHash()
     if (isDeepLinkPending) {
       // The deep-link restore lands after the first frames: while the page is still
       // at the top the active section is unknown, so the URL hash must be preserved.
       if (window.scrollY === 0 && hash !== route.hash) return
       isDeepLinkPending = false
     }
     if (hash === route.hash) return
     lastSpyNavAt = Date.now()
     void router.replace(hash ? { path: '/', hash } : { path: '/' })
   }
   ```

   El flag se limpia en cuanto la restauracion movio la pagina (`scrollY > 0`) o en cuanto el hash activo coincide con el de la URL; despues el spy recupera su comportamiento actual (incluido limpiar el hash al volver arriba). No se toca `wasSpyNav`, `activeHash()`, los listeners ni el cleanup.

4. **edit** `src/views/MainView.vue`: en `setup()`, tras `const route = useRoute()` añadir `const initialHash = route.hash`; en `onMounted` usar el snapshot: `if (initialHash) { setTimeout(() => scrollTo(initialHash), 150) }` (el resto del `onMounted`, `nextTick`, `ScrollTrigger.refresh()` y `useSectionSpy`, intacto). Restriccion: sin scroll nativo nuevo, sin cambiar el delay ni `scrollTo`.
5. **create** `.agents/decisions/005-deep-link-hash-restore.md` (template `.agents/templates/adr.md`, `status: proposed`): contexto (spy borraba el hash en el primer frame), decision (flag de deep-link + snapshot del hash en `MainView`; `scrollBehavior` y Lenis intactos), consecuencias y alternativas descartadas (restaurar con scroll nativo, `history.scrollRestoration`, mover la restauracion a un guard de router). Estado queda `proposed` hasta la revision de cierre.

### Frente 3 — Blur estable (1 edit; escalada solo con aprobacion)

6. **edit** `src/components/contact/ContactImages.vue` (lineas 33 y 55, las dos `k-card`): añadir la utilidad `transform-gpu` a la lista de clases existente, sin quitar ni cambiar ninguna otra (`flex size-min items-center justify-center p-16 text-white backdrop-blur-sm md:size-full md:p-4`); el orden canonico exacto dentro de la lista lo fija el plugin de orden de clases, que solo corre con `bun run format` (autorizacion aparte).
   Restricciones: no añadir fondo, borde, radio ni tamano (la superficie la sigue aportando el blur); no tocar `variant`, `v-effect`, `as`, `href`, `target`, `rel`, `aria-label`; sin `will-change-[...]` arbitrario.
7. **Escalada E1-b (no ejecutar sin aprobacion explicita del usuario y sin evidencia visual de que el flash persiste)**: **edit** `src/style.css` añadiendo fuera de cualquier `@layer`, al final del archivo, `#contact .card.transparent { @apply bg-white/5 dark:bg-white/5; }`. Motivo documentado: el CSS scoped de la libreria es sin capa y `.card.transparent` (0,2,0) gana a una utilidad suelta, por lo que la via valida es una regla del app sin capa con especificidad suficiente (ADR-004). Cambia el aspecto (tinte translucido visible en tema claro): decision estetica del usuario.

### Frente 4 — Iconos en el navbar (2 edits)

8. **edit** `src/router/index.ts` (`NAV_SECTIONS`, lineas 8-27): añadir en cada entrada el campo `icon` con literal `as const` — `projects: 'mdi:folder-multiple'`, `about: 'mdi:account'`, `contact: 'mdi:email'`. Nada mas del archivo se toca (tipos `RouteName`, `routesMap` y `scrollBehavior` intactos).
9. **edit** `src/components/layout/Navbar.vue` (lineas 70-74): el `router-link` pasa a `class="flex items-center gap-2 font-black"` y renderiza el icono antes del texto:

   ```html
   <router-link :to="{ path: '/', hash: section.hash }" class="flex items-center gap-2 font-black">
     <k-icon :name="section.icon" aria-hidden="true" />
     <glitch-text :text="t(section.labelKey)" hover-only />
   </router-link>
   ```

   Restricciones: icono decorativo (`aria-hidden`), sin `size-*` ni `text-*` nuevo, sin margenes (`gap-2`), `glitch-text` y su `hover-only` intactos, sin cambios en el `<select>` de idioma, el boton de tema ni el logo.

### Verificacion y diff final

10. **read** de los 6 archivos + el ADR: confirmar los cambios exactos de arriba, cero cambios colaterales, cero comentarios nuevos en espanol (RULES 0.13), cero duplicacion (el guard se escribe una sola vez).
11. Ejecutar la verificacion del repo **solo con autorizacion** (regla 0.4): `bun run lint:check`, `bun run format:check`, `bun run build`; si el usuario autoriza `bun run dev`, smoke en `/#about`, `/#contact` y resize a <320 / 320-767 / md+.

## Restricciones

- `RULES.md`: no Git, no borrar/renombrar archivos, un componente principal por requerimiento, no ejecutar `dev/build/preview/lint/format` sin permiso (0.4), English-Only en codigo (0.13), cero duplicacion (0.6), skills subordinadas (0.5), ADR obligatorio para la decision del frente 2 (0.12).
- `CODING_STANDARDS.md` §7: cero `m-*` (solo `gap`), sin valores `[...]`, sin tocar `leading/tracking/text-*`, Tailwind-first (la escalada E1-b usa `@apply` en CSS del app y queda documentada como excepcion justificada).
- `DESIGN.md` + ADR-001/ADR-002: Lenis es el unico motor de scroll; `scrollBehavior` con `return false` se conserva; prohibido introducir `scroll-behavior: smooth` o restauraciones con scroll nativo. ADR-004: el orden de imports de CSS no se toca y la unica via valida para ganar al CSS sin capa de la libreria es una regla sin capa del app.
- Libreria `khatarsis`: solo lectura (repo externo). Los nombres `mdi:*` no se inventan: los del Paso 8 estan verificados contra el set `mdi` de Iconify.
- No inventar comandos, archivos ni atajos; verificacion con scripts solo con autorizacion.

## Verificacion

- **Frente 1 (manual):** a <320px el grid de contact muestra 1 columna; entre 320px y 767px, 2; desde `md`, 4 (con `justify-items-normal`). La clase `@min-xs:` no debe quedar en el codigo.
- **Frente 2 (manual):** recargar varias veces en `/#about` y en `/#contact` → la pagina mantiene la posicion y la URL conserva el hash; navegar por los links del navbar sigue con scroll suave y el spy sigue limpiando el hash al volver al inicio; entrar por `/projects` y `/contact` se comporta como antes.
- **Frente 3 (manual, el unico punto sin causa raiz demostrada):** scroll rapido sobre la seccion contact en tema claro y oscuro → las cards nunca quedan sin blur. Si aparece un frame sin blur, esta planificado E1-b, que requiere aprobacion antes de aplicarse.
- **Frente 4 (manual):** el navbar muestra icono + texto en las 3 secciones, en ES/EN y en ambos temas; el icono no aparece como texto alternativo en lectores de pantalla; el footer se ve identico.
- **Comandos:** `bun run lint:check`, `bun run format:check`, `bun run build` y `bun run dev` quedan **bloqueados por regla 0.4** hasta autorizacion explicita; si no se autorizan, el cierre lo reporta como pendiente.

## Riesgos y pendientes

- **R1 (frente 3, efecto colateral a verificar).** `transform-gpu` convierte la card en *containing block* de sus descendientes posicionados. Hoy el `<span>` del efecto `spotlight` es `position: absolute; inset: 0` y su containing block es el `<section id="contact">` (el card es estático y su `overflow: hidden` no lo recorta, porque no está en la cadena del containing block); por eso el halo del hover se pinta con coordenadas relativas al card pero sobre una caja del tamaño de la sección. Con el util nuevo la caja del overlay pasa a ser el propio card (que es la intención declarada en `spotlight.ts`: `inset: 0` + `borderRadius: inherit`, "el apilamiento se resuelve por orden DOM"). Es un cambio perceptible en el hover de las 4+1 cards: entra en la revisión visual obligatoria y, si el usuario lo rechaza, la alternativa es promover la capa en el `div` wrapper (`v-effect="'skew'"`) en vez de en el card — mismo efecto de composición, misma consecuencia de containing block, así que la decisión se toma con la evidencia del navegador, no antes.
- **R2** Escalada E1-b (tinte translucido) sin aprobar: no se aplica sin evidencia visual de que el flash persiste y sin confirmacion del usuario, porque cambia el aspecto en tema claro (blanco 5% sobre fondo blanco es casi imperceptible; en tema oscuro se ve como un panel sutil).
- **R3** El disparador exacto del flash (frame compuesto sin `backdrop-filter`) queda como hipotesis: no se puede demostrar sin navegador. Por eso la verificacion del frente 3 es manual y la mitigacion es reversible (una sola clase).
- **R4** `bun run dev/lint:check/format:check/build` siguen bloqueados por regla 0.4: si el usuario no los autoriza, la verificacion queda reportada como pendiente en el cierre (no se cierra el plan sin ese registro).

## Registro de ejecucion (2026-09-13)

Ejecutado con la compuerta literal "ejecuta el plan" (plan aprobado a `READY` en la misma sesion). Se aplicaron los 9 edits y el ADR; no se ejecuto el paso 7 (escalada E1-b), que queda condicionado a aprobacion y a evidencia visual. Real:

- `src/style.css` — `--breakpoint-xs: 20rem;` como primera declaracion del `@theme` (linea 165).
- `src/components/contact/ContactImages.vue` — `@min-xs:grid-cols-2` → `xs:grid-cols-2` (orden de la lista: base, `xs`, `md`); `transform-gpu` añadido a las dos `k-card` de contact, sin tocar el resto de clases ni props.
- `src/composables/useSectionSpy.ts` — `isDeepLinkPending` inicializado con `route.hash !== ''`; guard de arranque en `sync()` con comentario en ingles.
- `src/views/MainView.vue` — snapshot `initialHash = route.hash` antes de `useSectionSpy`; `onMounted` restaura `initialHash`.
- `src/router/index.ts` — campo `icon` en las 3 entradas de `NAV_SECTIONS` (`mdi:folder-multiple`, `mdi:account`, `mdi:email`).
- `src/components/layout/Navbar.vue` — `router-link` a `flex items-center gap-2 font-black` + `<k-icon :name="section.icon" aria-hidden="true" />` antes del `glitch-text`.
- `.agents/decisions/005-deep-link-hash-restore.md` — creado, `status: proposed` (espera verificacion manual).

### Seguimiento 2026-09-13 15:00 — bloque de idioma del navbar (excluido del alcance original)

El usuario pidio corregir los 5 errores de lint preexistentes que este plan habia reportado como pendientes. Flujo simple (1 archivo, 2 edits) en `src/components/layout/Navbar.vue`, sin tocar comportamiento:

- La interpolacion del `<label>` vuelve a una sola linea (`prettier/prettier`).
- `id="navbar-language-select"` baja despues de `v-model` y de los bindings dinamicos (`:clearable`, `:filterable`, `:options`), segun el `order` custom de `vue/attributes-order` en `eslint.config.mjs` (TWO_WAY_BINDING → ATTR_DYNAMIC → GLOBAL/UNIQUE/ATTR_STATIC).
- Verificacion: `bun run lint:check` → **OK (0 problemas)**; `bun run format:check` → **OK** ("All matched files use Prettier code style"). Ninguna prop, valor ni handler cambio.

Sin cambios colaterales verificados por lectura de los 6 archivos en su estado final: cero comentarios en espanol, cero duplicacion, sin margenes, sin valores `[...]`, sin `!important`, `scrollBehavior`/Lenis/`wasSpyNav`/`useReveal` intactos, footer intacto.

## Cierre (memoria persistente)

> Completar al cerrar el plan. Sin esto, el plan no pasa a CLOSED (DoD).

- Que cambio: breakpoint `xs` operativo en el grid de contact (token + variante mobile-first); el deep-link conserva hash y posicion al recargar (guard en el spy + snapshot en `MainView`); `transform-gpu` en las cards de contact; iconos `mdi:*` en las 3 secciones del navbar. ADR-005 creado (`proposed`).
- Verificacion (comandos autorizados por el usuario el 2026-09-13):
  - `bun run build` → **OK** (`vue-tsc -b` sin errores; `vite build` completo, 108 modulos). El typecheck cubre el campo `icon` nuevo y el guard del spy.
  - `bun run lint:check` → **falla por 5 errores preexistentes en `Navbar.vue`**, todos en el bloque del `<select>` de idioma que el plan prohibe tocar: `prettier/prettier` en `t('nav.selectLanguage')` (linea 83) y 4 `vue/attributes-order` (`id` antes de `v-model` y `:clearable`/`:filterable`/`:options`, lineas 88-91). Verificado por lectura: ese bloque es identico al estado previo a esta ejecucion, no lo introdujo este plan.
  - `bun run format:check` → **falla por el mismo archivo/punto preexistente** (`Navbar.vue`); los otros 5 archivos tocados pasan el check, incluido el orden de clases de Tailwind de mis listas de utilidades.
  - Revision manual en navegador (`bun run dev`): **no autorizada**, pendiente.
- Resultado: **pendiente** (no se cierra: falta la revision manual de los 4 frentes; los 5 errores de lint preexistentes quedan reportados, no corregidos por restriccion de alcance).
- Pendientes:
  - ~~Los 5 errores de lint/formato preexistentes de `Navbar.vue` (bloque de idioma)~~ → resueltos el 2026-09-13 15:00 (ver Seguimiento arriba); `lint:check` y `format:check` quedan verdes.
  - Revision manual de los 4 frentes (incluye R1: containing block del `spotlight` tras `transform-gpu`).
  - Escalada E1-b solo si el flash persiste y el usuario la aprueba.
  - ADR-005 pasa a `accepted` tras confirmar el frente 2.
