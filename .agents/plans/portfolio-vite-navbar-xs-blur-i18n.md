---
name: portfolio-vite-navbar-xs-blur-i18n
status: EXECUTED
type: bugfix
domain: portfolio
owner_rules: .agents
created: 2026-09-13 20:15
enriched: 2026-09-13 21:10
executed: 2026-09-13 21:20
---

# Plan: Warning de Vite + labels del navbar bajo `xs` + blur de cards sin reveal + locale EN

> Estados: PENDING -> **ENRICHED** -> READY -> EXECUTED -> CLOSED (ver `.agents/WORKFLOW.md`).
> Origen: 4 problemas reportados por el usuario el 2026-09-13 (warning al correr `bun run dev`, labels del navbar que no se ocultan, cards de proyectos transparentes por un instante, traducciones EN desactualizadas y demasiado formales).
> Enriquecido el 2026-09-13 21:10 con las decisiones del usuario de ese dia: **(a)** frente 3: se quita el reveal a las piezas con blur en vez de introducir una opcion nueva en `useReveal`; **(b)** frente 4: el ES tiene prioridad y el EN solo traduce lo que el ES ya dice, coloquial con contracciones y sin slang; **(c)** se retira del plan la observacion sobre "senior" vs "Full Stack" (no es una inconsistencia: es una autodescripcion). Ejecutado el 2026-09-13 21:20 con la compuerta literal **"ejecuta el plan"** (ver "Registro de ejecucion" al final).

## Objetivo

1. Eliminar el warning de Vite `Your Vite config uses features that are unsupported by configLoader: 'native'` (`__dirname` en `vite.config.ts`).
2. En el navbar, por debajo del breakpoint `xs` (320px) las 3 secciones muestran solo su icono; desde 320px, icono + texto (decision del usuario: lectura literal de "ocultar en xs").
3. Al entrar a Proyectos y a About, las cards con `backdrop-blur-sm` deben mostrar el blur desde el primer frame, sin ventana de card transparente.
4. Que el locale EN traduzca fielmente el ES actual (que manda) con registro coloquial y contracciones, en vez del texto condensado/desactualizado y formal de hoy.

## Alcance

- A editar (4):
  - `vite.config.ts` — frente 1 (linea 11).
  - `src/components/layout/Navbar.vue` — frente 2 (plantilla del `router-link`).
  - `src/components/projects/ProjectsSection.vue` y `src/components/about/AboutSection.vue` — frente 3 (1 atributo `data-reveal` menos en cada uno).
  - `src/i18n/locales/en.ts` — frente 4 (solo valores; el archivo completo propuesto esta abajo).
- A crear (1): `.agents/decisions/006-backdrop-filter-reveal-opacity.md` (regla de composicion del frente 3, RULES 0.12).
- Solo lectura (sin cambios): `src/composables/useReveal.ts` (queda intacto: ya no se le añade ninguna opcion), `src/components/hero/GlitchText.vue` (compartido con el hero), `src/i18n/locales/es.ts` (**fuente de verdad**: no se toca), `src/i18n/index.ts`, `src/components/contact/ContactImages.vue`, `src/components/projects/ProjectCard.vue`, `src/router/index.ts`, `tsconfig*.json`, `eslint.config.mjs`, `package.json`.
- Fuera de alcance: no editar la libreria `khatarsis` (repo externo); no cambiar el diseno de las cards (fondo transparente, borde, radio, hover); no tocar `scrollBehavior`, `wasSpyNav`, `initSmoothScroll`, Lenis ni el CRT; no redefinir breakpoints (`xs`/`sm`/`md` quedan igual); no cambiar textos del ES; no introducir claves i18n nuevas ni un tercer idioma; no tocar el plan `portfolio-seo-metadata` (sigue `PENDING` y bloqueado por su D1); no tocar las cards de contact (su `transform-gpu` del plan anterior queda como esta).

## Hallazgos verificados

1. **Warning de Vite.** Unica aparicion de `__dirname` en el repo: `vite.config.ts:11` (`'@': path.resolve(__dirname, 'src'),`). Vite instalado: **8.2.2**; Node: **v24.14.1**. Es un aviso de migracion, no un error: con `configLoader: 'native'` (el type-stripping nativo de Node) la config se evalua como ESM y `__dirname` no existe, asi que hoy Vite sigue usando el loader con esbuild y avisa que ese modo sera el default. `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` solo silencia el aviso. `import.meta.dirname` esta disponible en Node 24 y tipado (`@types/node` `^24.13.3`); `tsconfig.node.json` incluye `vite.config.ts` con `types: ["node"]` y `module: "nodenext"`, o sea que `vue-tsc -b` lo valida.

2. **Labels del navbar: el `hidden` pierde por orden de cascada, no por especificidad.** El elemento raiz de `GlitchText.vue` trae `class="glitch-text relative inline-block whitespace-nowrap"` y su `<style scoped>` no declara `display`; el choque es entre dos utilidades de la misma especificidad (0,1,0). Medido en el CSS compilado (`dist/assets/index-Bsh6RM5j.css`): Tailwind emite las utilidades de la misma propiedad **en orden alfabetico por valor**, y `.hidden{display:none}` esta en el byte **364650** y `.inline-block{display:inline-block}` en el **364729** (secuencia: `.block` 364564, `.contents` 364585, `.flex` 364612, `.grid` 364631, `.hidden` 364650, `.inline` 364671, `.inline-block` 364729, `.inline-flex` 364764) => gana el ultimo, asi que el texto nunca se oculta. Ademas las variantes `xs:` viven en un `@media (width>=20rem)` posterior (byte **387696**), o sea que una variante `xs:` solo puede ganar **en o por encima** del breakpoint, nunca por debajo: con `hidden` en el mismo nodo el caso base (<320px) queda sin salida. El `xs:relative` probado por el usuario es `position` (y `relative` ya esta puesto), no participa del conflicto.

3. **Cards transparentes durante el reveal: causa deterministica.** Cadena verificada en fuente:
   - `useReveal.ts:26-33` hace `gsap.set(items, { autoAlpha: 0, y: 40 })` y `gsap.to(items, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 82%', once: true } })`: `autoAlpha` anima **opacidad**.
   - `ProjectsSection.vue:29` pasa `data-reveal` a `project-card`; por fallthrough el atributo cae en la raiz de `ProjectCard.vue` (`<div v-effect="'skew'" class="h-full">`), que es **ancestro** del `k-card` con `backdrop-blur-sm` (`ProjectCard.vue:28`). Igual en `AboutSection.vue:51`, donde el `data-reveal` esta en la fila que contiene el `k-card backdrop-blur-sm` de la linea 52.
   - Especificacion (Filter Effects: *backdrop root*): un elemento con `opacity < 1` forma un backdrop root, y un `backdrop-filter` solo puede muestrear el fondo **dentro** de su backdrop root mas cercano. Mientras el wrapper del reveal esta por debajo de opacidad 1 (0.9s + 0.12s de stagger por card), la card se ve a si misma => sin blur, y con `variant="transparent"` (`background-color: #0000`, medido en el plan anterior sobre el CSS scoped de la libreria) queda como un hueco transparente. Al terminar el tween en opacidad exactamente 1 el backdrop root desaparece y aparece el blur: ese es el "hago un poco de scroll y pufff ahi si toma el blur".
   - Descartados en este bug: `skew.ts` (solo `transform` + `will-change: transform` en hover), `spotlight.ts` (solo un `<span>` con `radial-gradient` en hover), `useStaticFlash` (solo hover del hero, navegacion y toggle de tema) y Lenis (scroll nativo, sin transform en el contenedor). Las cards de contact no pasan por esta via: `ContactImages.vue` no tiene `data-reveal` (solo el header de su seccion), por eso su `transform-gpu` atendia otro disparador y no se toca.

4. **Locale EN desactualizado y formal.** Verificado leyendo `es.ts` y `en.ts` completos (misma estructura de claves en ambos: no falta ninguna, solo difieren valores):
   - `about.body`: ES tiene **4 parrafos**; EN tiene **3** condensados y con contenido distinto (omite "gestiona todo lo que una empresa de servicios publicos necesita para operar", el detalle de Portal Brilla y el parrafo 4 completo sobre los perros/naturaleza, y agrega "SaaS product at Softii", "Khatarsis, for UI with Vue, and Alytos, for backend with Java").
   - `contact.footer.rights`: ES '© 2026 César Ríos' vs EN '© 2026 César Andrés Ríos Valencia · Full Stack Developer' (dos cadenas distintas para el mismo pie).
   - `projects.items.businessSuite|softii|brilla.description`: el EN **repite el nombre del proyecto** al inicio ("Business Suite 5.0 — …", "Softii — …", "Brilla Portal — …") y el ES no; el nombre ya es el titulo de la card (`ProjectCard.vue:49`).
   - Valores que en EN son reescritura y no traduccion: `hero.knowMe` ('About me' por 'Conóceme'), `about.stackTitle` ('Everyday tech stack' por 'Stack que uso día a día'), `contact.subtitle` ('Whether you want to talk tech, projects, or just chat:' por 'Si quieres hablar de tecnología, de un proyecto, o simplemente charlar:'), `projects.subtitle` ('Projects I have contributed to.' por 'Proyectos en los que he contribuido.'), `projects.techTooltip` ('this project' por 'ese proyecto'), `nav.about` ('About' por 'Sobre mí'), `social.whatsappMessage` ('I would like to talk to you.' por 'me gustaría hablar contigo.') y `hero.greeting` ('I am' por 'Soy').
   - `hero.description` ya es espejo fiel del ES actual (lo fijo `portfolio-hero-description-rewrite.md`) => **no se toca**.

## Decisiones

- **D1 — Umbral del frente 2 (usuario, 2026-09-13).** Lectura literal: ocultar **solo por debajo de `xs` (20rem / 320px)**. Queda documentado que en un celular real (375px+) los textos siguen visibles; cambiar de parecer es cambiar la variante (`sm:` en vez de `xs:`).
- **D2 — Mecanismo del frente 2.** Envolver el `<glitch-text>` en `<span class="hidden xs:inline-flex">` dentro del `router-link`: el wrapper no tiene utilidad de display competidora, asi que en el caso base gana `.hidden` sin pelea de orden; desde 320px gana `xs:inline-flex` porque el bloque de variantes va despues de las utilidades base (byte 387696 > 364650). Descartados: `max-xs:hidden` sobre el propio `glitch-text` (reintroduce el patron fragil de dos clases de display en el mismo nodo), tocar `GlitchText.vue` (componente compartido con el hero) y `sr-only` en el mismo nodo (misma clase de riesgo). Costo aceptado: un nodo extra por link.
- **D3 — Accesibilidad del frente 2.** Con el label en `display:none` el unico hijo visible del link es el `k-icon` con `aria-hidden`, asi que el link queda sin nombre accesible: se añade `:aria-label="t(section.labelKey)"` al `router-link` (misma cadena que el texto visible, sin claves i18n nuevas).
- **D4 — Frente 3 (usuario, 2026-09-13): se quita el reveal.** En vez de introducir una opcion en `useReveal`, se elimina el atributo `data-reveal` de las **piezas que contienen blur** (`project-card` y la fila de stack+mapa de About). `useReveal.ts` no se toca (sin API nueva, sin opcion muerta) y los headers de esas secciones conservan su reveal, porque no tienen `backdrop-filter`. Descartados: mantener el fade y añadir tinte a la card (enmascara el sintoma y cambia el look "cristal") y `transform-gpu` preventivo en la card de proyectos (no ataca la causa demostrada y la vuelve *containing block* del overlay del `spotlight`).
- **D5 — Frente 4 (usuario, 2026-09-13).** El ES tiene prioridad absoluta y no se toca: el EN **solo traduce lo que el ES ya dice**, sin agregar, quitar ni reordenar contenido, con registro coloquial y contracciones ("I'm", "I've", "I'd", "it's") y sin slang. Sin duplicar el nombre del proyecto en las descripciones. `contact.footer.rights` espeja el ES exactamente. Nombres propios (Business Suite 5.0, Portal Brilla, Softii, Khatarsis, Alytos) no se traducen. Ningun dato inventado. El copy completo propuesto esta en el bloque de abajo y **requiere tu aprobacion** para pasar a `READY`.
- **D6 — ADR.** El frente 3 fija una regla de composicion del proyecto (un `backdrop-filter` no puede vivir dentro de un reveal animado por opacidad) que condiciona futuros reveals: se registra como ADR nuevo en ejecucion (`.agents/decisions/006-backdrop-filter-reveal-opacity.md`, `status: proposed`), sin editar ADR-001..005 (RULES 0.12).

## Copy EN propuesto (`src/i18n/locales/en.ts`, archivo completo)

> Solo cambian los valores marcados en los hallazgos. `es.ts` no se toca. Nada de claves nuevas.

```ts
export default {
  nav: {
    ariaNavigation: 'Portfolio navigation',
    ariaHome: 'Back to home',
    toggleTheme: 'Toggle between light and dark mode',
    themeDark: 'Dark mode',
    themeLight: 'Light mode',
    about: 'About me',
    projects: 'Projects',
    contact: 'Contact',
    selectLanguage: 'Select language',
  },
  hero: {
    greeting: "Hi! I'm",
    knowMe: 'Get to know me',
    role: 'Full Stack Developer',
    description:
      "I've spent over 4 years building full stack web applications, from public-utility suites to business apps for running companies like sales, inventory and billing, plus financing portals billed through utility bills. I work across all three layers of an application from idea to launch. Seeing that the code I write helps others in their daily lives is what drives me, I enjoy writing code that pushes optimization and performance to the limit, creating real value and impact. I'm currently building two libraries of my own, one for UI and one for backend, aimed at shipping apps much faster.",
  },
  social: {
    ariaGitHub: "César Ríos' GitHub",
    ariaLinkedIn: "César Ríos' LinkedIn",
    ariaWhatsApp: 'Send a WhatsApp message to César Ríos',
    ariaEmail: 'Send an email to César Ríos',
    whatsappMessage: "Hi César, I saw your portfolio and I'd like to talk to you.",
  },
  about: {
    kicker: 'About me',
    subtitle: "Who I am, what I've worked on and where I'm from",
    stackTitle: 'Stack I use every day',
    body: [
      "My name is César Andrés Ríos, I'm 23 years old and I'm a senior software developer. I've been building web applications for over 4 years, from the idea to the production release.",
      "I've worked on many projects throughout my career, one of the best known is Business Suite 5.0, a public utility suite that manages everything a utility company needs to operate and that is currently running in the largest utility companies in the country, plus Portal Brilla, the platform where businesses partnered with Brilla manage credit sales through the utility bill, also running with the largest gas companies in the country. I've also worked on projects outside my country, like Softii, a POS system for online stores in Mexico.",
      "My work focuses on creating, developing and maintaining systems across all three layers: frontend, backend and database. I make sure everything always works as expected and with the best possible quality. Right now I'm working on my personal projects, Khatarsis and Alytos, two complementary libraries that gather a big part of the work I've been doing as a full stack developer, focused on building robust and scalable applications in record time.",
      "Outside software I enjoy playing video games and riding my motorbike to discover new places. I also like spending time with my dogs Rocco and Rugal. I've loved nature and technology since I was a kid and I enjoy experiencing both whenever I can. There's not much more I can tell you about myself, the rest is for you to discover... so don't hesitate to contact me!",
    ],
    photoAlt: 'Portrait of César Ríos',
    mapTitle: 'Currently based in',
    mapRecenter: 'Center on Cali',
    timeAria: 'Local time in Cali, Colombia',
  },
  skills: {
    areas: {
      frontend: 'Frontend',
      backend: 'Backend',
      databases: 'Databases',
      cloud: 'Cloud',
      tools: 'Tools',
    },
  },
  projects: {
    title: 'Projects',
    subtitle: "Projects I've contributed to.",
    techTooltip: 'Technologies I used in that project.',
    openProject: 'Open {name}',
    items: {
      businessSuite: {
        description:
          'Public utility suite for water, gas, power and waste, built with microservices and microfrontends. Full stack role with a frontend focus.',
      },
      softii: {
        description:
          'Point of sale system for shops in Mexico, with a monolithic architecture. Full stack role with a frontend focus.',
      },
      brilla: {
        description:
          'Management web portal for service partners, on microservices. Full stack role with a backend focus.',
      },
      khatarsis: {
        description:
          'Vue component library and environment for building interfaces with context, speed and consistency.',
      },
      alytos: {
        description:
          'Plug-and-play modular Java backend library with auto-configuration: to set up the base and only add the business logic.',
      },
    },
  },
  contact: {
    title: 'Contact',
    subtitle: 'If you want to talk about tech, a project, or just chat:',
    footer: {
      rights: '© 2026 César Ríos',
    },
  },
}
```

Cambios frente al EN actual, uno por uno: `nav.about` (`About` -> `About me`), `hero.greeting` (`Hi! I am` -> `Hi! I'm`), `hero.knowMe` (`About me` -> `Get to know me`), `social.whatsappMessage` (`I would like` -> `I'd like`), `about.subtitle` (reescrito, sin punto final como el ES), `about.stackTitle` (`Everyday tech stack` -> `Stack I use every day`), `about.body` (3 parrafos condensados -> 4 parrafos fieles), `projects.subtitle` (contraccion), `projects.techTooltip` (`this project` -> `that project`), las 5 descripciones de proyecto (sin el nombre duplicado, traduccion fiel y "scaffold" -> "set up"), `contact.subtitle` (traduccion fiel, sin "Whether") y `contact.footer.rights` (igual al ES). `hero.description` y los `aria*` quedan igual porque ya son fieles.

## Pasos

### Frente 1 — Warning de Vite (1 edit)

1. **edit** `vite.config.ts:11`: `'@': path.resolve(__dirname, 'src'),` -> `'@': path.resolve(import.meta.dirname, 'src'),`. Restricciones: no tocar el import de `node:path` (sigue usandose), los plugins ni el nombre del alias; no definir `VITE_CONFIG_NATIVE_IGNORE_WARNING`; no agregar dependencias.

### Frente 2 — Labels del navbar bajo `xs` (1 edit)

2. **edit** `src/components/layout/Navbar.vue` (bloque del `router-link`, lineas 64-74): el `router-link` gana `:aria-label` y el label queda envuelto:

   ```html
   <li v-for="section in NAV_SECTIONS" :key="section.hash">
     <router-link
       :to="{ path: '/', hash: section.hash }"
       :aria-label="t(section.labelKey)"
       class="flex items-center gap-2 font-black"
     >
       <k-icon :name="section.icon" class="size-6" aria-hidden="true" />
       <span class="hidden xs:inline-flex">
         <glitch-text :text="t(section.labelKey)" hover-only />
       </span>
     </router-link>
   </li>
   ```

   Restricciones: no mover el `k-icon` ni cambiar su `size-6`/`aria-hidden`; no tocar `hover-only`; el orden de atributos deja los dos bindings dinamicos antes de `class` (`vue/attributes-order` en `eslint.config.mjs`); no tocar el `<select>` de idioma, el boton de tema ni el logo; sin margenes (solo `gap-*`).

### Frente 3 — Blur estable sin reveal en las piezas con blur (2 edits + 1 ADR)

3. **edit** `src/components/projects/ProjectsSection.vue:29`: eliminar la linea `data-reveal` del `<project-card>`. El header (linea 16) mantiene su `data-reveal` y `useReveal(root)` sigue igual.
4. **edit** `src/components/about/AboutSection.vue:51`: eliminar el atributo `data-reveal` de `<div class="flex flex-col gap-6 lg:flex-row" data-reveal>` (queda `<div class="flex flex-col gap-6 lg:flex-row">`). Los otros dos `data-reveal` del archivo (header linea 21 y fila de retrato+texto linea 31) no se tocan: no contienen blur.
   Consecuencia aceptada: esos bloques aparecen ya visibles (sin fade y sin slide). Incluye el `map-card` de About, porque la fila es la unidad del reveal.
5. **create** `.agents/decisions/006-backdrop-filter-reveal-opacity.md` (template `.agents/templates/adr.md`, `status: proposed`): contexto (un ancestro con `opacity < 1` forma backdrop root y apaga el `backdrop-filter` de sus descendientes, medido en `ProjectsSection`/`AboutSection`), decision (las piezas con blur no se revelan por opacidad: hoy se les quita `data-reveal`; `useReveal` queda intacto), consecuencias (los reveals siguen disponibles para piezas sin blur; si en el futuro se quiere animar una de estas piezas, tiene que ser sin opacidad) y alternativas descartadas (tinte de superficie, `transform-gpu` en la card, opcion `fade` en `useReveal`).

### Frente 4 — Locale EN fiel al ES (1 edit)

6. **edit** `src/i18n/locales/en.ts`: aplicar el archivo completo del bloque "Copy EN propuesto" (solo valores, misma estructura de claves, sin claves nuevas, sin tocar `es.ts`). El estilo de formato (ancho, comillas simples, `prettier`) queda igual al actual; `bun run format:check` lo confirma.
7. **read** de los 5 archivos finales + el ADR: cero cambios colaterales, cero comentarios en español, sin `[...]`, sin `!important`, sin margenes, `useReveal.ts` y `es.ts` intactos.

## Restricciones

- `RULES.md`: no Git, no borrar/renombrar archivos, un componente principal por requerimiento, scripts de verificacion solo con autorizacion (0.4), English-Only en codigo (0.13), cero duplicacion (0.6), ADR por la decision del frente 3 (0.12), alcance acotado (0.3).
- `CODING_STANDARDS.md` §7 + `DESIGN.md`: Tailwind-first, sin margenes (solo `gap`), sin valores arbitrarios `[...]` (la variante `xs:` usa el token del tema), sin tocar tipografias ni el orden de imports de CSS (ADR-004).
- El copy EN es contenido de UI (i18n), no codigo: no se hardcodea en componentes ni en identificadores (RULES 0.13).
- La libreria `khatarsis` es solo lectura.

## Verificacion

**Autorizacion registrada (usuario, 2026-09-13): "tienes autorizacion para test".** El repo no declara script `test` (`package.json` solo tiene `dev`, `build`, `preview`, `lint`, `lint:check`, `format`, `format:check`), asi que la autorizacion se aplica a los comandos de verificacion del repo: `bun run lint:check`, `bun run format:check` y `bun run build`. `bun run dev` se usa solo si hace falta para la revision visual (los resultados no se pueden leer desde aca: los ve el usuario en su navegador).

- **Frente 1:** `bun run dev`/`bun run build` dejan de imprimir el aviso de `configLoader: 'native'`; `vue-tsc -b` sigue verde (cubre `vite.config.ts` via `tsconfig.node.json`).
- **Frente 2 (manual):** a <320px el navbar muestra solo los 3 iconos y cada link conserva nombre accesible; de 320px a 639px vuelven los textos; ES/EN y tema claro/oscuro; la navegacion por hash no cambia.
- **Frente 3 (manual):** con recarga limpia y scroll rapido y lento, las cards de Proyectos y la fila de stack de About muestran blur desde el primer frame (sin ventana transparente), y el hover (`skew` + `spotlight`) se ve como antes.
- **Frente 4 (manual):** cambiar a EN en el selector y comparar contra el ES linea por linea: 4 parrafos en About, sin nombres de proyecto duplicados, pie identico, sin lenguaje formal.
- **Comandos:** ejecutar `bun run lint:check`, `bun run format:check` y `bun run build` al terminar los edits y registrar el resultado real en este plan.

## Riesgos y pendientes

- **R1 (frente 3, cambio visible por diseno).** Proyectos y About pierden el reveal en esas piezas: aparecen ya visibles al entrar a la seccion. Es la unica forma de tener blur estable con `backdrop-filter` mientras no se quiera cambiar el aspecto de la card.
- **R2 (frente 3, causa residual no descartada).** Si tras quitar el reveal la card de proyectos mostrara igual un frame sin blur por otra causa (repintado de `backdrop-filter` sobre los canvas fijos), la salida seria `transform-gpu` en la card o un tinte de superficie: ambas requieren aprobacion explicita, porque la primera cambia el *containing block* del overlay del `spotlight` (R1 del plan anterior) y la segunda el aspecto.
- **R3 (frente 4).** El copy propuesto es fiel al ES y coloquial; la ultima palabra la tiene el usuario. Si cambia algun texto, se ajusta antes de ejecutar.
- **R4 (video del reporte).** El adjunto (`Grabación de pantalla 2026-09-13 191948.mp4`, 4.2 MB) es video binario y no se puede decodificar con las herramientas de inspeccion disponibles; el diagnostico del frente 3 se sostiene en la fuente y en la especificacion.
- **R5 (verificacion).** La revision visual de los frentes 2 y 3 depende del navegador del usuario; sin ella el plan queda en `EXECUTED` (el DoD permite registrar la verificacion como pendiente con motivo).

## Registro de ejecucion (2026-09-13 21:20)

Ejecutado con la compuerta literal "ejecuta el plan" (plan aprobado por el usuario el mismo dia). Real, archivo por archivo:

- `vite.config.ts:11` — `path.resolve(__dirname, 'src')` -> `path.resolve(import.meta.dirname, 'src')`.
- `src/components/layout/Navbar.vue` — el `router-link` gano `:aria-label="t(section.labelKey)"` (antes de `class`) y el `<glitch-text>` quedo envuelto en `<span class="hidden xs:inline-flex">`. Nada mas del archivo se toco.
- `src/components/projects/ProjectsSection.vue` — eliminado el `data-reveal` del `<project-card>` (el header conserva el suyo). Al quitar el atributo, prettier colapso el elemento en una linea: `<project-card v-for="project in projects" :project="project" :key="project.name" />`.
- `src/components/about/AboutSection.vue` — eliminado el `data-reveal` de la fila stack + mapa (los otros dos `data-reveal` del archivo quedan intactos).
- `src/i18n/locales/en.ts` — reescrito con el copy aprobado (misma estructura de claves, sin claves nuevas); `es.ts` intacto. Valores cambiados: `nav.about`, `hero.greeting`, `hero.knowMe`, `social.whatsappMessage`, `about.subtitle`, `about.stackTitle`, `about.body` (4 parrafos), `projects.subtitle`, `projects.techTooltip`, las 5 descripciones de proyecto, `contact.subtitle` y `contact.footer.rights`.
- `.agents/decisions/006-backdrop-filter-reveal-opacity.md` — creado, `status: proposed`.
- `src/components/layout/FooterSection.vue` — **fuera del alcance, autorizado aparte**: eliminado el import sin uso `NAV_SECTIONS` que bloqueaba `vue-tsc -b`.
- Sin cambios (verificado por lectura del estado final): `src/composables/useReveal.ts`, `src/i18n/locales/es.ts`, `src/components/projects/ProjectCard.vue`, `src/components/contact/ContactImages.vue`, `src/router/index.ts`.

### Verificacion (comandos autorizados por el usuario el 2026-09-13)

- `bun run lint:check` -> **OK (0 problemas)**.
- `bun run format:check` -> **OK** ("All matched files use Prettier code style!").
- `bun run build` -> **OK** (`vue-tsc -b` sin errores + `vite build`: 108 modulos, `dist/assets/index-CMmPE2CE.css` 437 kB). Para desbloquearlo se aplico **un cambio fuera del alcance de este plan, autorizado por el usuario el 2026-09-13**: eliminar `import { NAV_SECTIONS } from '@/router'` de `src/components/layout/FooterSection.vue`, que estaba sin uso (el archivo no se habia tocado por este plan; su mtime `2026-09-13 19:28:29` era posterior al ultimo build verde, `18:29:33`). Sin ese import el footer se ve y se comporta igual.
- Verificacion de la causa del frente 2 en el CSS recien compilado (`dist/assets/index-CMmPE2CE.css`): `.hidden{display:none}` esta en el byte **364451** (utilidades base) y el bloque `@media (width>=20rem)` en el **387836**, que ya incluye `.xs\:inline-flex{display:inline-flex}`. El wrapper no tiene ninguna otra utilidad de display, asi que por debajo de 320px aplica `.hidden` y desde 320px gana la variante por orden de fuente: el mecanismo funciona como se diseno.
- Hallazgo colateral (no corregido, fuera de alcance): Tailwind esta escaneando `.agents/**/*.md`. Prueba: el bundle nuevo contiene `.xs\:relative{position:relative}` y ese token no existe en `src/`; su unica aparicion en el repo es este mismo plan. La consecuencia es CSS muerto generado desde documentacion. El arreglo natural es acotar los sources de Tailwind en `src/style.css` (`@source`/`@source not`), pero es un cambio aparte.
- Revision manual en navegador (`bun run dev`): **pendiente** (la ve el usuario).

## Cierre (memoria persistente)

> Completar al cerrar el plan. Sin esto, el plan no pasa a CLOSED (DoD).

- Que cambio: warning de Vite resuelto (`import.meta.dirname`); labels del navbar ocultos por debajo de `xs` (wrapper `hidden xs:inline-flex` + `aria-label` en el link); reveal eliminado de las piezas con `backdrop-blur-sm` en Proyectos y About (con ADR-006); locale EN reescrito como traduccion fiel y coloquial del ES.
- Verificacion: `lint:check` OK (0 problemas); `format:check` OK; `build` OK (108 modulos) tras quitar el import sin uso de `FooterSection.vue`; causa del frente 2 confirmada en el CSS compilado; revision visual pendiente.
- Resultado: **pendiente** (no se cierra: falta la revision visual de los frentes 2 y 3).
- Pendientes:
  - Revision visual de los frentes 2 y 3 en el navegador del usuario.
  - ADR-006 pasa a `accepted` cuando se confirme el blur estable.
  - Hallazgo colateral: Tailwind escanea `.agents/**/*.md` y genera CSS muerto (`.xs\\:relative`); acotar los sources es un cambio aparte.
