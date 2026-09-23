---
name: portfolio-estructura-router-vistas
status: EXECUTED
type: refactor
domain: portfolio
owner_rules: .agents
created: 2026-09-09 12:00
enriched: 2026-09-09
executed: 2026-09-09
---

## Plan Tecnico: Estructura por carpetas + vue-router + vista Main (estilo khatarsis)

### Analisis

- **Objetivo:** sacar la composición de `src/App.vue` a `src/views/MainView.vue`, re-carpetear `src/components/` plano a `components/<dominio>/` estilo khatarsis, cablear `vue-router` con `createWebHistory`, dejar `App.vue` como shell delgada (`fondo global + <router-view />`) y añadir alias `@` → `src`.
- **Scope:** 9 `.vue` en `src/components/`, `src/App.vue`, `src/main.ts`, `vite.config.ts`, `tsconfig.app.json`, `package.json` (solo vía `bun add vue-router`), 2 creates (`src/router/index.ts`, `src/views/MainView.vue`). `index.html` sin cambios. `src/data/portfolio.ts`, composables, estilos y khatarsis intactos.
- **Archivos (verificado por lectura real 2026-09-09):**
  - `src/components/` plano con 9 archivos: `HeroSection.vue`, `ProfileSection.vue`, `ExperienceSection.vue`, `ProjectsSection.vue`, `InterestsSection.vue`, `ContactSection.vue`, `GlitchText.vue`, `FaultyTerminalBackground.vue` (en uso, fondo global), `BlackWallAnimation.vue` (SIN USO, plan `portfolio-blackwall-animation` CLOSED por descarte — se conserva).
  - `src/App.vue`: compone fondo + 6 secciones en `main.relative.min-h-screen`; script con `gsap` + `ScrollTrigger` + `initSmoothScroll()` + `nextTick/refresh`.
  - `src/main.ts`: sin router; registra `khatarsis` + `KIcon`; importa `khatarsis/style.css`, `./App.vue`, `./style.css`.
  - `vite.config.ts`: plugins `vue()` + `tailwindcss()` presentes, **sin alias**. `tsconfig.app.json`: **sin `paths`/`baseUrl`** (con `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`). `package.json`: **sin `vue-router`**; scripts reales: `dev`, `build` (`vue-tsc -b && vite build`), `preview`, `lint`, `lint:check`, `format`, `format:check`.
- **Mapa exacto de imports reales (grep sobre `src/`, 2026-09-09):**
  - `App.vue`: `vue` (`nextTick,onMounted`), `gsap`, `gsap/ScrollTrigger`, `./composables/useSmoothScroll` (`initSmoothScroll`), `./components/FaultyTerminalBackground.vue`, `./components/HeroSection.vue`, `./components/ProfileSection.vue`, `./components/ExperienceSection.vue`, `./components/ProjectsSection.vue`, `./components/InterestsSection.vue`, `./components/ContactSection.vue`.
  - `hero/HeroSection.vue`: `gsap`, `vue` (`onMounted,ref`), `../data/portfolio` (`contact, profile`), `../composables/useReveal` (`prefersReducedMotion`), `../composables/useSmoothScroll` (`scrollTo`), `./GlitchText.vue` (default).
  - `profile/ProfileSection.vue`: `vue` (`ref`), `../data/portfolio` (`profile, skills`), `../composables/useReveal` (`useReveal`).
  - `experience/ExperienceSection.vue`: `vue` (`computed,ref`), `khatarsis` (type `TimelineItem`), `../data/portfolio` (`experiences`), `../composables/useReveal` (`useReveal`). Template con slots dinámicos `<template v-for="..." #[`item-${i}`]>` — **no cambia lógica tras el move**.
  - `projects/ProjectsSection.vue`: `vue` (`ref`), `../data/portfolio` (`projects`), `../composables/useReveal`.
  - `interests/InterestsSection.vue`: `vue` (`ref`), `../data/portfolio` (`interests`), `../composables/useReveal`.
  - `contact/ContactSection.vue`: `vue` (`ref`), `../data/portfolio` (`contact`), `../composables/useSmoothScroll` (`scrollTo`), `../composables/useReveal`.
  - `hero/GlitchText.vue`: solo `vue` (`computed`); sin imports locales. Consumidor único: `HeroSection.vue`.
  - `background/FaultyTerminalBackground.vue`: `vue`, `khatarsis` (`createFullscreenTriangle, createMesh, createProgram, createRenderer, renderScene`) — intacto tras el move.
  - `background/BlackWallAnimation.vue`: `vue`, `khatarsis` (`useFluidSimulation, useCanvasLoop`) — sin uso, se conserva.
  - **Negativos confirmados (cero matches):** `?raw`, `import.meta.glob`, `defineAsyncComponent`/imports dinámicos, `router-link`/`RouterLink`. No hay referencias de runtime a rutas físicas fuera de imports ES estáticos.
- **Tabla de reescritura de imports a `@/` tras el alias:**

  | Origen actual | Destino reescrito |
  | --- | --- |
  | `../data/portfolio` (6 secciones) | `@/data/portfolio` |
  | `../composables/useReveal` (5 secciones + hero `prefersReducedMotion`) | `@/composables/useReveal` |
  | `../composables/useSmoothScroll` (hero, contact) | `@/composables/useSmoothScroll` |
  | `./GlitchText.vue` (en hero) | `./GlitchText.vue` (misma carpeta destino) o `@/components/hero/GlitchText.vue` |
  | `./components/<X>.vue` (en App/MainView) | `@/components/<dominio>/<X>.vue` según árbol final |
  | `./composables/useSmoothScroll` (en App/MainView) | `@/composables/useSmoothScroll` |
  | `./App.vue`, `./router` (en main.ts) | se mantienen relativos (`./App.vue`, `./router`) — khatarsis usa `./router` en su `main.ts`; `@/` opcional pero no obligatorio |
- **Estructura final exacta (espejo khatarsis §2: carpetas `kebab-case`, archivos `PascalCase`, sin prefijo redundante):**

  ```text
  src/
  |-- views/
  |   `-- MainView.vue
  |-- router/
  |   `-- index.ts
  |-- components/
  |   |-- hero/HeroSection.vue + hero/GlitchText.vue
  |   |-- profile/ProfileSection.vue
  |   |-- experience/ExperienceSection.vue
  |   |-- projects/ProjectsSection.vue
  |   |-- interests/InterestsSection.vue
  |   |-- contact/ContactSection.vue
  |   `-- background/FaultyTerminalBackground.vue + background/BlackWallAnimation.vue (sin uso, conservado)
  ```

  - `GlitchText` va bajo `hero/` (no en `common`): un solo consumidor real → khatarsis §2 lo prohíbe en `common`.
  - `FaultyTerminalBackground` + `BlackWallAnimation` comparten `background/` por responsabilidad visual común (fondos fullscreen), no por uso.
  - **Por qué `MainView.vue` y no `IndexView`:** petición explícita del usuario ("main") + convención `*View.vue` de khatarsis (`HomeView`, `DocsView`, …). `IndexView` rompería la convención espejo y no refleja el nombre pedido. `RouteName = 'main'`, `path: '/'`.
- **Riesgos:**
  1. `createWebHistory` en preview estático: con una sola ruta `/` el riesgo es mínimo en `dev`/`preview` (Vite sirve fallback SPA); en un hosting 100% estático sin rewrites, un refresh fuera de `/` daría 404 — no aplica hoy (no hay deep links), se documenta.
  2. Alias `@` rompe `vue-tsc -b` si falta `paths` o `baseUrl` en `tsconfig.app.json`, o si `include` no cubre `src/**/*.vue` (ya lo cubre — no tocar `include`).
  3. Lenis + `scrollBehavior`: debe ser `scrollBehavior() { return false }` verbatim khatarsis; prohibido reintroducir `scroll-behavior: smooth` (ADR-001 `001-smooth-scroll-gsap-lenis.md`).
  4. Slots `#[`item-${i}`]` del timeline en `ExperienceSection.vue`: sintaxis intacta tras el move; solo cambian sus 3 imports (lógica cero).
  5. `FaultyTerminalBackground.vue` WebGL: move puro (ruta + nada más); shaders, uniforms y loop (`setUniform`, `Float32Array`, mouse en `window`) intactos según plan EXECUTED `portfolio-faulty-terminal-fondo`.
  6. `noUnusedLocals/noUnusedParameters` activos: `src/router/index.ts` no debe dejar imports/tipos sin usar.
  7. RULES 0.2 (no borrar sin aprobación): el move se ejecuta como **creación en destino + re-apunte de imports**; el borrado de los 9 orígenes requiere aprobación explícita aparte. Sin ella, los orígenes quedan temporalmente sin referencia (ver Steps 5–6).
- **No-contradicción con planes existentes:** `portfolio-faulty-terminal-fondo` (EXECUTED — fondo en uso, no se toca su lógica) y `portfolio-blackwall-animation` (CLOSED por descarte — `BlackWallAnimation.vue` se mueve con su carpeta pero sigue sin uso y **no se elimina**).

### Cambios

- **1. `package.json`/`bun.lock` (vía `bun add vue-router`, con autorización aparte):** única dependencia nueva (v4, compatible Vue 3.5). Gestor `bun`, nunca npm.
- **2. `src/router/index.ts` (create):** espejo mínimo de khatarsis — import estático de `MainView` (una sola vista, sin lazy), `export type RouteName = 'main'`, `routesMap.main = { path: '/', name: 'main' as RouteName, component: MainView }` (sin campo `title`: no hay navbar/tabs que lo consuman), `createRouter({ history: createWebHistory(), scrollBehavior() { return false }, routes: [...] })`, `export { routesMap }` + `export default router`. Sin `beforeEach`, sin `getRoutePosition` (una ruta).
- **3. `src/views/MainView.vue` (create):** composición movida verbatim de `App.vue` — los 6 tags de sección en el mismo orden, tags en `kebab-case` (convención template khatarsis §3.2), imports con `@/`. Bloque `onMounted` (`initSmoothScroll()` + `nextTick` + `ScrollTrigger.refresh()`) movido íntegro aquí (depende del layout de las secciones); orden de imports según khatarsis §1.1: Vue core → terceros (`gsap`) → componentes locales `@/components/*` → `@/composables/*`.
- **4. Re-carpetado (9 creates en destino + re-apunte; borrado de orígenes solo con aprobación explícita, RULES 0.2):** contenido idéntico salvo la tabla de reescritura de imports; nombres de componente sin renombrar (diff mínimo); plantillas y estilos intactos (§7: cero márgenes, sin `[...]`, sin tocar tipografía).
- **5. `src/App.vue` (edit):** shell delgada — conserva `main.relative.min-h-screen.bg-neutral-950...` intacto, monta `<faulty-terminal-background />` + `<router-view />`; script reducido a esos 2 imports (fondo vía `@/components/background/FaultyTerminalBackground.vue`). Sin lógica de scroll (vive en `MainView`).
- **6. `src/main.ts` (edit):** añade `import router from './router'` + `app.use(router)` antes de `app.mount` (orden khatarsis: router primero entre los `use` de app); resto intacto (`khatarsis`, `KIcon`, `style.css`).
- **7. `vite.config.ts` + `tsconfig.app.json` (edit):** alias `@` → `src` espejo khatarsis (`vite.config.ts`: `import path from 'node:path'` + `resolve.alias['@'] = path.resolve(__dirname, 'src')`; `tsconfig.app.json`: añadir `"baseUrl": "."` + `"paths": { "@/*": ["src/*"] }` preservando el resto). Plugin `vue()` ya presente, no se toca.

### Restricciones

- RULES 0.2: no eliminar archivos — `BlackWallAnimation.vue` se conserva sin uso; el borrado de los 9 orígenes tras el move requiere aprobación explícita aparte.
- RULES 0.3: refactor multi-archivo justificado como necesidad técnica explícita del usuario (un solo cambio de arquitectura, no features extra).
- RULES 0.4: `bun add vue-router` (modifica `package.json`/`bun.lock`) y `bun run build/dev/preview` requieren autorización aparte. `bun run lint:check` / `format:check` son inspección segura (no están en la lista bloqueada: dev/build/preview/test).
- Bun siempre (no npm). Solo comandos/scripts reales de `package.json`: `bun add vue-router`, `bun run lint:check`, `bun run format:check`, `bun run build`, `bun run dev`, `bun run preview`. Nada inventado.
- `CODING_STANDARDS.md` §7: moves solo cambian rutas + imports; cero retoques visuales/tipográficos.
- Khatarsis solo-lectura: nada fuera del repo portfolio.
- Skills subordinadas (`vue-best-practices`, `vite`, `typescript-advanced-types`): referencia, prevalece el estándar local.
- `createWebHistory`, no hash. `scrollBehavior` = `false`. No `scroll-behavior: smooth` (ADR-001).

### Steps

1. **read** `src/components/{HeroSection,ProfileSection,ExperienceSection,ProjectsSection,InterestsSection,ContactSection,GlitchText,FaultyTerminalBackground,BlackWallAnimation}.vue` (cabeceras de imports), `src/App.vue`, `src/main.ts`, `vite.config.ts`, `tsconfig.app.json` — confirmar que el contenido coincide con el mapa de la sección Analisis (imports, ausencia de `?raw`/`import.meta.glob`/`router-link`/dinámicos, slots `#[`item-${i}`]` en Experience). Si hay delta, detener y reportar antes de crear.
2. **install** vía `bun add vue-router` en el repo — **REQUIERE autorización aparte (RULES 0.4)**. Única dependencia nueva; verificar que `package.json` suma `vue-router` (v4) sin tocar versiones de `vue`/otros.
3. **edit** `vite.config.ts` — añadir `import path from 'node:path'` y bloque `resolve: { alias: { '@': path.resolve(__dirname, 'src') } }` (espejo khatarsis); plugins existentes intactos. **edit** `tsconfig.app.json` — añadir `"baseUrl": "."` y `"paths": { "@/*": ["src/*"] }` preservando `extends`, `types`, flags de lint y `include`.
4. **create** `src/router/index.ts` — contenido: `import MainView from '@/views/MainView.vue'` + `import { createRouter, createWebHistory } from 'vue-router'`; `export type RouteName = 'main'`; `const routesMap = { main: { path: '/', name: 'main' as RouteName, component: MainView } }`; `const router = createRouter({ history: createWebHistory(), scrollBehavior() { return false }, routes: [{ path: routesMap.main.path, name: routesMap.main.name, component: routesMap.main.component }] })`; `export { routesMap }; export default router`. Sin imports sobrantes (respeta `noUnusedLocals`).
5. **create** destinos (contenido idéntico al origen salvo reescritura de imports según tabla):
   - `src/components/hero/HeroSection.vue` (`../data/portfolio`→`@/data/portfolio`, `../composables/*`→`@/composables/*`, `./GlitchText.vue` intacto misma carpeta)
   - `src/components/hero/GlitchText.vue` (idéntico, sin cambios)
   - `src/components/profile/ProfileSection.vue`, `src/components/experience/ExperienceSection.vue` (slots `#[`item-${i}`]` intactos), `src/components/projects/ProjectsSection.vue`, `src/components/interests/InterestsSection.vue`, `src/components/contact/ContactSection.vue` (reescritura `../`→`@/` análoga)
   - `src/components/background/FaultyTerminalBackground.vue` (idéntico) + `src/components/background/BlackWallAnimation.vue` (idéntico, sigue sin uso)
   - **create** `src/views/MainView.vue` — plantilla con las 6 secciones en orden (`hero, profile, experience, projects, interests, contact`, tags `kebab-case`, sin wrapper `main`); script con bloque `onMounted` movido verbatim de `App.vue` e imports `@/` (Vue core → `gsap`/`ScrollTrigger` → `@/components/*` → `@/composables/*`).
6. **edit** `src/App.vue` — shell: script con solo `FaultyTerminalBackground` (`@/components/background/FaultyTerminalBackground.vue`); plantilla conserva `main` y sus clases intactas con `<faulty-terminal-background />` + `<router-view />`. **edit** `src/main.ts` — añadir `import router from './router'` y `app.use(router)` antes de `app.mount('#app')`; resto intacto. **Limpieza de orígenes** (`src/components/*.vue` planos): SOLO con aprobación explícita aparte (RULES 0.2); sin ella quedan sin referenciar y el plan cierra como EXECUTED con ese pendiente documentado. Verificar con búsqueda que ningún import apunta ya a `./components/<Plano>.vue` ni a `../data|../composables` desde secciones.
7. **Verificar** `bun run lint:check` + `bun run format:check` (inspección segura). `bun run build` y `bun run dev`/`preview` solo con autorización aparte (RULES 0.4).

### Verificacion

- `bun run lint:check` exit 0 + `bun run format:check` exit 0.
- `bun run build` (autorización aparte): `vue-tsc -b` verde con `vue-router` + alias `@`; `vite build` genera dist.
- `bun run dev` (autorización aparte): `/` renderiza `MainView` (6 secciones en orden, fondo faulty-terminal fijo detrás, reveals/scroll/Lenis intactos, cero errores de consola; refresh directo a `/` OK).
- Manual: `BlackWallAnimation.vue` existe en `background/` sin ningún import que lo referencie; `GlitchText` importado solo desde `hero/`; ningún import relativo `../`/`./components/<Plano>` residual en secciones/vista; `index.html` y estilos sin cambios.

## Cierre (memoria persistente)

- Que cambio (ejecutado 2026-09-09, alcance del plan sin redefinir):
  - CREATE `src/router/index.ts` (import estatico MainView, RouteName='main', routesMap, createWebHistory, scrollBehavior false, export routesMap + default).
  - CREATE `src/views/MainView.vue` (composicion verbatim de App.vue: 6 secciones en orden, tags kebab-case, onMounted integro, imports `@/`, sin wrapper `main`).
  - CREATE 9 destinos byte-identicos salvo `../`→`@/` (hero/HeroSection.vue, hero/GlitchText.vue identico, profile/ProfileSection.vue, experience/ExperienceSection.vue slots intactos, projects/ProjectsSection.vue, interests/InterestsSection.vue, contact/ContactSection.vue, background/FaultyTerminalBackground.vue identico, background/BlackWallAnimation.vue identico sin uso).
  - EDIT `vite.config.ts` (alias `@`), `tsconfig.app.json` (baseUrl + paths), `src/App.vue` (shell: fondo + router-view, main y clases intactos), `src/main.ts` (import router + app.use(router) antes de mount).
  - Origenes planos `src/components/*.vue` CONSERVADOS sin referenciar (RULES 0.2, sin borrado).
- Verificacion:
  - READ de verificacion previo: mapa del plan coincide con el repo (imports, negativos `?raw`/`import.meta.glob`/dinamicos/`router-link` confirmados ausentes, slots `#[`item-${i}`]` intactos). Sin deltas.
  - Grep: cero `../data|../composables` en destinos, cero `./components/<Plano>.vue` referenciado desde vista/shell, `BlackWallAnimation` sin import que lo referencie, `GlitchText` solo desde `hero/`.
  - `bun run lint:check`: exit 0. `bun run format:check`: exit 0 ("All matched files use Prettier code style!").
- Resultado: aprobado como EXECUTED con pendientes aceptados (requieren autorizacion aparte, no bloquean el cierre).
- Pendientes:
  1. `bun add vue-router` (modifica package.json/bun.lock, RULES 0.4, sin autorizacion): `src/router/index.ts` importa `vue-router` aun no instalado → `vue-tsc -b`/`bun run build` fallara hasta instalarlo. Pendiente esperado, no error de codigo.
  2. Limpieza de los 9 origenes planos (RULES 0.2, requiere aprobacion explicita aparte).
  3. `bun run build` / `dev` / `preview` (RULES 0.4, requieren autorizacion aparte): incluye verificar `/` renderiza MainView y refresh directo OK.

## Cierre de lo restante — autorizado 2026-09-09 (sigue EXECUTED, no CLOSED)

- **Install (autorizado):** `bun add vue-router` ejecutado → `vue-router@5.3.1` en `package.json`/`bun.lock` (52 paquetes). Única dependencia nueva.
- **Limpieza (autorizada):** eliminados los 9 orígenes planos `src/components/*.vue` (verificado antes: cero referencias a rutas planas y cero `../data|../composables` en destinos). `src/components/` queda solo con las 7 subcarpetas; duplicación temporal resuelta.
- **ADR (regla 0.12):** creado `.agents/decisions/002-estructura-router-vistas.md` (`accepted`).
- **Fix de config:** `tsconfig.app.json` sin `baseUrl` (deprecado en TS 6, error TS5101) → `paths: { "@/*": ["./src/*"] }` relativo. Reintentado build.
- **Verificación real con comandos autorizados:**
  - `bun run lint:check` exit 0; `bun run format:check` exit 0.
  - `bun run build` ROJO por 10 errores `vue-tsc` **preexistentes y ajenos al refactor** (ninguno referencia `@/` ni la nueva estructura): TS7016 `khatarsis` sin tipos en `background/*`, `experience/*`, `main.ts` (no existe `src/khatarsis.d.ts`); TS6133 `root`/`wallW`/`wallH` (BlackWall) y `computed` (GlitchText); TS2769 `mousedown` vs `PointerEvent` (BlackWall ×2). Evidencia de preexistencia: regiones de código intactas por este plan + los 4 planes previos documentan build siempre pendiente, nunca verde.
  - Smoke `bun run dev -- --port 5199 --strictPort` (autorizado): `/` 200, `/src/main.ts` 200, `/src/views/MainView.vue` 200 → `vue-router` + alias `@` resuelven en runtime; árbol huérfano posterior eliminado (`taskkill /T`). Sin procesos colgados.
- **Revisión de cierre (reviewer.md):** alcance conforme, higiene OK (duplicación resuelta tras limpieza autorizada), standards OK, plan actualizado, memoria escrita, ADR existe. **No cumple DoD item 2** (build rojo) por deuda preexistente fuera de alcance (archivos de planes `faulty-terminal`/`blackwall`/`glitch-text`): **se queda en `EXECUTED`** con el motivo documentado. Propuesta: plan pequeño aparte para los 10 errores de tipos (shim `khatarsis.d.ts` + vars sin uso + handlers `pointerdown`/tipos) — toca archivos de otros planes y excede este alcance (RULES 0.3/0.10).

## Revisión del orquestador (enrichment)

- Cumple lo pedido: carpetas por dominio estilo khatarsis, vista `MainView.vue` (petición "main" + convención `*View.vue`), `vue-router` `createWebHistory` espejo khatarsis, alias `@`, `App.vue` shell. Sin features extra.
- No inventa cambios: moves con mismo contenido + reescritura `../`→`@/` mapeada por lectura real; `?raw`/`import.meta.glob`/`router-link`/dinámicos confirmados ausentes; shaders/composables/datos intactos.
- Respeta RULES 0.2 (BlackWall conservado, borrado de orígenes solo con aprobación), 0.3 (refactor justificado como necesidad técnica explícita), 0.4 (bun add + build/dev con autorización aparte), CODING_STANDARDS §7 (sin retoques visuales) y ADR-001 (`scrollBehavior false`, sin smooth CSS).
- Pasos ejecutables con archivo exacto + acción + detalle; verificación con scripts reales de `package.json`.
- Decisión importante: `MainView.vue` en vez de `IndexView.vue` (ver Análisis). `scrollBehavior false` por Lenis. `GlitchText` bajo `hero/` (no `common`). Limpieza de orígenes hecha con tu autorización 2026-09-09.
