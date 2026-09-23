---
name: portfolio-projects-section
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-10 12:00
enriched: 2026-09-10
ready: 2026-09-10 (revision orquestador: 5 proyectos literales, URLs dadas, sin inventos, sin borrar archivos)
executed: 2026-09-10
---

# Plan: Seccion Proyectos debajo del hero (grid + cards con skew/spotlight + chips + tooltip)

> Solicitud del usuario (2026-09-10): construir la seccion proyectos (ira debajo del hero) con titulo 5xl "proyectos", subtitulo "proyectos en los que he contribuido", grid de N columnas con filas siempre rellenas (orden de arriba a abajo), cards con imagen grande + titulo + descripcion/resumen de contribucion + icono info con tooltip khatarsis + chips de tecnologias, efectos skew y spotlight de khatarsis por card, texto default 14px (rem/em). Los datos de los proyectos (imagenes, descripciones, traducciones) los pasa el usuario en el enrichment.

## Objetivo

- `ProjectsSection.vue` pasa de stub vacio a seccion completa montada en `MainView.vue` debajo del hero, con el layout y efectos pedidos, copy via i18n (es/en) y texto base 14px.

## Alcance

- Archivos (verificado 2026-09-10):
  - `src/components/projects/ProjectsSection.vue` (edit: hoy stub de 5 lineas, script + div vacios).
  - `src/views/MainView.vue` (edit: hoy solo monta `hero-section`; anadir `projects-section` debajo).
  - `src/data/portfolio.ts` (edit probable: contrato `Project` {name, statusKey?, tech[], url} + 1 proyecto `Catarsis`; falta imagen + descripcion/contribucion — se define con los datos del usuario en enrichment).
  - `src/i18n/locales/es.ts` (L92: bloque `projects` con kicker/title/viewOnGitHub/status) + `en.ts` (L90 espejo) (edit: subtitulo "proyectos en los que he contribuido", tooltip de tecnologias, descripciones por proyecto, traducciones en).
- Verificado en khatarsis (solo lectura, fuente real):
  - `k-chip` registrado (`components/index.ts` L56; props `label`, `variant` default `base`, `size` default `md`, ej. `size="xs"` en `ProductCard.vue`).
  - `k-tooltip` registrado (L71; props `content`, `placement` default `top`, `trigger` default `hover`, `delay` 200).
  - Efectos `skew` y `spotlight` via directiva `effect` (`v-effect="'skew'"` / `v-effect="'spotlight'"`; binding string o `{type, ...options}`; UNA directiva por elemento -> para ambos efectos en la card hay que anidar dos elementos).
  - `k-icon` ya en uso en el repo (`Navbar.vue` con `mdi:*`).
- Fuera de alcance (salvo decision en enrichment):
  - No tocar hero, cursor, CRT, fondos, router, theme, i18n config.
  - No hay `src/assets/` (glob vacio): las imagenes llegan con los datos del usuario (rutas locales vs URLs se decide en enrichment).
  - No reordenar nada mas (MainView hoy solo tiene hero; montar projects debajo = pedido cumplido).

## Restricciones

- RULES 0.2 (no borrar sin aprobacion), 0.3 (cards/chips/tooltip son el requerimiento explicito; la extraccion de subcomponente `ProjectCard` se decide en enrichment con justificacion), 0.4 (sin `dev/build/preview/lint/format` sin autorizacion; bun; solo scripts reales).
- CODING_STANDARDS §2.1 English-Only: identificadores/props/comentarios en ingles; copy ES/EN en locales (nada hardcodeado).
- CODING_STANDARDS §7: cero margenes (flex + gap + padding); sin valores `[...]` (`text-5xl` titulo y `text-sm` = 14px son escala estandar); la excepcion tipografica (5xl + 14px base) viene de orden explicita.
- Dark-aware (superficies/texto light + dark), `aria-hidden`/`aria-label` donde aplique, `prefers-reduced-motion` (skew/spotlight ya lo respetan; reveals con el patron del repo).
- Skills subordinadas (`vue-best-practices`, `tailwind-css-patterns`, `accessibility`): referencia; prevalece el estandar local.

## Decisiones abiertas (se resuelven en enrichment con tus datos)

1. **Datos:** por proyecto: imagen (archivo/URL), descripcion + resumen de contribucion (es + en), lista de techs, url. Contratos: que va a `portfolio.ts` (tecnico) vs locales (display).
2. **Grid "filas siempre rellenas":** interpretacion propuesta: grid responsive (`1 / sm:2 / lg:3` o `auto-fill minmax`) con orden DOM de arriba a abajo; el ejemplo "5 en 2+3" se confirma (el "2 y 5" del mensaje no cuadra aritmeticamente).
3. **Card:** extraer `ProjectCard.vue` (recomendado: N cards identicas, cero duplicacion) vs todo inline.
4. **Tooltip:** texto exacto es/en + icono (`mdi:information` u otro) y `placement`.
5. **Imagen:** aspect/ratio y fallback si falla la carga.

## Pasos

1. Recibir datos del usuario (enrichment): proyectos + imagenes + traducciones.
2. **enrichment** (compuerta "enriquece el plan"): diseno tecnico por archivo con las decisiones 1-5 resueltas.
3. **ejecucion** (compuerta "ejecuta el plan" con plan READY): implementar + verificacion.
4. Revision de cierre + DoD -> `CLOSED`.

## Verificacion

- Estatica (sin autorizacion): contratos vs datos, claves i18n es/en completas, sin imports sin usar, sin `[...]`/margenes, `reveal` consistente.
- Con autorizacion: `bun run lint:check` + `bun run format:check` exit 0; `bun run dev` (grid relleno con N real, cards con imagen/titulo/descripcion/chips+tooltip, skew+spotlight al hover, 14px base, dark/light, reduced-motion); `bun run build` sin errores nuevos.

## Enrichment tecnico (2026-09-10) — compuerta "enriquece el plan" atendida

### Fuentes (verificadas por lectura real)

- Proyectos y stacks: `../cv/career-ops/cv.md` L19-65 (hoja de vida). Orden pedido = orden top-to-bottom:
  1. **Softii** `https://softii.business/login` — Ecommerce SaaS multiempresa (Mexico). CV: modulo comandas, refactor productos/items + inventario/precios/categorias/tags, config usuarios, rediseno POS, perf. Stack: Vue, Quasar, Node.js/NestJS, MongoDB, AWS Lambda.
  2. **Brilla** `https://portal2.brilla.com.co/#/login/ally` — Portal financiacion Promigas. CV: pagos Cencosud/Olimpica/Exito, comisiones/descuentos. Stack: Angular, Spring WebFlux, SQL Server, Azure DevOps, Kubernetes.
  3. **Business Suite** `https://ms-prd.saas.arqbs.com/login` — Suite servicios publicos (ArquitecSOFT). CV: migracion 4.0->5.0, libreria componentes, PQRS, ventanilla, produccion Armenia. Stack: Vue 3, Spring Boot, Kubernetes, PL/SQL, Oracle, OCI.
- Imagenes: `src/assets/brands/` (softii-white `DuLy8ruX.svg`, brilla `JBY3JAAS.svg`, arqbs `logo-color.png`). `vite/client` activo en `tsconfig.app.json` L6 -> imports `.svg/.png` tipados sin shim. Sin `src/assets/` antes: son los primeros assets.
- Nota: `cv-cesar.html` citado en `portfolio.ts` L2 no existe en `../cv/` (referencia colgada, no bloquea).
- khatarsis (4ta card): libreria local (`../khatarsis/`, 60+ componentes `k-*`, efectos, i18n); logo `src/assets/brands/logo_khatarsis.svg` ya en repo.
- alytos (5ta card, `../alytos/` fuera del repo): libreria backend plug-n-play Java (Spring Boot 4 + WebFlux) — starters seguridad JWT/OIDC, CRUD, errores RFC 9457, R2DBC, CLI futuro (verificado en `../alytos/README.md` L1-36). URL `https://github.com/s0rnero/alytos` (dada por el usuario). Imagen PENDIENTE (la pasa el usuario).

### Decisiones (enrichment)

1. **Grid (aclarado 2026-09-10):** `grid grid-cols-1 gap-* sm:grid-cols-2 lg:grid-cols-3` significa 1 columna en movil, 2 en tablet, 3 en escritorio; el grid reparte SOLO de izquierda a derecha y de arriba a abajo, y las filas se llenan solas (3 items = fila llena en desktop; 5 items = 3+2). Esa ES la distribucion auto. `auto-fit/minmax` requeriria un valor arbitrario `[...]` prohibido por §7: no se usa salvo excepcion explicita tuya.
2. **Card:** extraer `src/components/projects/ProjectCard.vue` (3 cards identicas; RULES 0.3 justificado + 0.6 cero duplicacion).
3. **Contrato:** `Project` += `image: string` (imports en `portfolio.ts`, tecnico) + `descriptionKey: 'softii' | 'brilla' | 'businessSuite' | 'khatarsis' | 'alytos'` (display en locales). Entrada `Catarsis` ELIMINADA del array (2026-09-10: el usuario no la reconoce; es entrada de datos, no archivo).
4. **Tooltip (confirmado 2026-09-10):** `k-tooltip` con `:content="t('projects.techTooltip')"` + `k-icon` `mdi:information` como primer elemento antes de los chips; placement `top` por defecto y chips `size="sm"` confirmados.
5. **Imagen:** banda fija `h-48` + `bg-neutral-950` siempre (el SVG blanco de Softii es invisible sobre claro) + `object-contain` con padding. `alt` con el nombre del proyecto.
6. **Efectos:** capa externa `v-effect="'skew'"` + interna `v-effect="'spotlight'"` (una directiva por elemento, verificado en `directive.ts`).
7. **Texto:** base `text-sm` (14px) en la seccion; titulo `text-5xl` con `t('projects.title')` existente; subtitulo `text-lg` con `t('projects.subtitle')` nueva. Sin kicker (no pedido; la clave existente queda sin uso).
8. **Reveal:** `useReveal` + `data-reveal` en header y cards; `section id="projects"` (el router ya resuelve `#projects` via `scrollTo`).
9. **Drafts ES (del CV, usuario ajusta — precedente hero):**
   - softii: "Ecommerce SaaS multiempresa para tiendas locales. Desarrolle el modulo de comandas, refactorice productos e inventario y redisene el POS."
   - brilla: "Plataforma de financiacion de Promigas. Integre pagos con Cencosud, Olimpica y Exito, con logica de comisiones y descuentos."
   - businessSuite: "Suite de servicios publicos en produccion. Migracion 4.0 a 5.0, libreria de componentes, vista PQRS y salida a produccion en Armenia."
  - subtitle: "Proyectos en los que he contribuido." / techTooltip: "Tecnologias que use en ese proyecto."
  - EN espejo (drafteado en ejecucion, mismo patron).
10. **Orden con 5:** softii, brilla, businessSuite, khatarsis, alytos (orden de mencion). Grid 3+2 en `lg` (el ejemplo original del usuario). Nombre display: `Alytos` (asi lo escriben su carpeta, su URL y su README).
11. **Catarsis:** el nombre salio de `src/data/portfolio.ts` L104-111 (`name: 'Catarsis'`, url `github.com/s0rnero/catarsis`) y de `../cv/github-profile-README.md` L35-41 ("Mi proyecto: Catarsis"). Entrada eliminada del array (es dato, no archivo).
12. **khatarsis (4ta card):** draft ES desde el CV fresco (`cv.md` L85-89): "Framework de componentes reutilizables para interfaces web modernas. 2 anos de desarrollo activo." Tech: Vue 3, TypeScript, Tailwind CSS. URL `https://github.com/s0rnero/khatarsis` (dada por el usuario). Sin elemento link en esta iteracion (solo data).
13. **alytos (5ta card):** draft ES: "Libreria backend plug-n-play para Spring Boot con WebFlux: seguridad JWT, CRUD y contratos de API listos para usar." Tech: Java, Spring Boot, WebFlux, R2DBC, Gradle. URL `https://github.com/s0rnero/alytos` (dada por el usuario). Imagen PENDIENTE del usuario (placeholder con iniciales hasta que llegue el asset).

### Cambios

#### E1. `src/data/portfolio.ts` (edit)
`Project` += `image: string` + `descriptionKey` (union de 5: softii, brilla, businessSuite, khatarsis, alytos); `url` sigue requerido: logins (softii, brilla, businessSuite) + GitHub (`https://github.com/s0rnero/khatarsis`, `https://github.com/s0rnero/alytos`, dados por el usuario); array con 5 entradas (`Alytos` como nombre display); alytos sin imagen (placeholder) hasta tu asset; entrada `Catarsis` eliminada.

#### E2. `src/i18n/locales/es.ts` + `en.ts` (edit)
`projects.subtitle`, `projects.techTooltip`, `projects.items.{softii,brilla,businessSuite,khatarsis,alytos}.description` (drafts §Decision 9-13). Comentarios en ingles.

#### E3. `src/components/projects/ProjectCard.vue` (create, unico componente nuevo)
Props `{ project: Project }`. Estructura: `article` con `v-effect="'skew'"` + `data-reveal` > div con `v-effect="'spotlight'"` > banda imagen (`img` full-width `h-48 object-contain`; alytos sin asset: placeholder con iniciales hasta que llegue) + body (`h3` nombre, `p` descripcion, fila: `k-tooltip > k-icon mdi:information` + `k-chip v-for` con `:label` y `size="sm"`). Orden SFC e imports `@/` segun standards.

#### E4. `src/components/projects/ProjectsSection.vue` (edit)
`section#projects` con `text-sm` base + dark-aware; header (`h2.text-5xl` + `p` subtitulo); grid responsive; `v-for` de `ProjectCard` (`:key="project.name"`); `useReveal` en el root.

#### E5. `src/views/MainView.vue` (edit)
Import + `<projects-section />` tras `<hero-section />`. Nada mas.

### Restricciones (refinadas)
- RULES 0.2/0.3/0.4, CODING_STANDARDS §2.1 (English-Only) y §7 (flex+gap, sin `[...]`, `text-5xl`/`text-sm`/`h-48` de escala), DESIGN sin cambios.
- Skills (subordinadas): `vue-best-practices` (SFC, `ProjectCard` focalizado, `MainView` como superficie de composicion); `tailwind-css-patterns` (grid responsive, dark-aware); `accessibility` (`alt` reales, `aria-label` del icono info via `t()`, `aria-hidden` en decorativos, reduced-motion heredado de efectos + reveal).

### Steps ejecutables
1. **read** `ProjectsSection.vue`, `MainView.vue`, `portfolio.ts`, locales es/en, este plan (si hay delta, detener y reportar).
2. **edit** `src/data/portfolio.ts` (E1).
3. **edit** `src/i18n/locales/es.ts` + `en.ts` (E2).
4. **create** `src/components/projects/ProjectCard.vue` (E3).
5. **edit** `src/components/projects/ProjectsSection.vue` (E4).
6. **edit** `src/views/MainView.vue` (E5).
7. **verificar estatico:** claves i18n es/en completas, assets resuelven, sin imports sin usar, sin `[...]`/margenes.
8. **verificar** `bun run lint:check` + `bun run format:check` (autorizacion aparte); `build`/`dev` solo con autorizacion independiente (RULES 0.4).
9. **reviewer + DoD** antes de `CLOSED`.

### Verificacion (criterios dev)
- `/` muestra hero + proyectos debajo; grid 1/2/3 por breakpoint con 5 cards (3+2 en desktop); imagen full-width h-48 con logos visibles en ambos temas (alytos con placeholder hasta su asset); titulo + descripcion + info-icon con tooltip al hover + chips; skew + spotlight por card al hover; texto 14px (titulo 5xl exento); reduced-motion estatico; consola limpia.

## Registro de ejecucion (2026-09-10, Executor, compuerta "ejecuta el plan")

- Cambios reales (E1-E5): `portfolio.ts` (contrato +`image`/`descriptionKey`, 5 entradas, `Catarsis` fuera, 4 logos importados); locales es/en (`subtitle`, `techTooltip`, `items.{5}.description` con drafts); CREATE `ProjectCard.vue` (skew>spotlight anidados, banda `h-48 bg-neutral-950`, `k-tooltip`+`mdi:information`, `k-chip sm`, placeholder con iniciales si no hay imagen); `ProjectsSection.vue` (`#projects`, `text-sm` base, `h2 text-5xl`, grid 1/2/3, `useReveal`); `MainView.vue` (monta debajo del hero). Directiva `effect` verificada registrada (`app.use(khatarsis)`).
- Desviaciones menores: `en.ts` `viewOnGitHub` corregido `in`->`on` (typo en lineas reescritas); titulo card hereda 14px + bold (literal "default 14px"); sin elemento link (spec sin link; urls en data).
- Verificacion estatica: keys 5/5/5, assets importados y usados, sin margenes/`[...]` (solo `scroll-mt-16` de ancla), sin imports muertos. Scripts (`lint/format/build/dev`) pendientes por regla 0.4.
- Resultado: `EXECUTED`. No `CLOSED` hasta DoD + visual.

## Cierre (memoria persistente)

> Completar al cerrar el plan. Es la entrada de memoria del proyecto (ver `.agents/PLANS.md`). Sin esto, el plan no pasa a CLOSED (DoD).

- Que cambio: [resumen real]
- Verificacion: [comando ejecutado y resultado, o pendiente con motivo]
- Resultado: [aprobado / no necesario / pendiente aceptado explicitamente]
- Pendientes: [si existen]
