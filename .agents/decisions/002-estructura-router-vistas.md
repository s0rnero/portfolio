---
name: 002-estructura-router-vistas
status: accepted
date: 2026-09-09
domain: portfolio
supersedes: []
---

# ADR-002: Estructura por dominio + vue-router + vista Main + alias `@`

## Contexto

`src/components/` era plano (9 `.vue` sueltos) y `src/App.vue` componía directamente las 6 secciones sin router. El usuario pidió carpetear cada sección en su carpeta dentro de componentes, mover la composición a una vista (`index` o `main`), instalar `vue-router` y basar el carpeteo en `khatarsis/apps/khatarsis` (ver plan `portfolio-estructura-router-vistas`). Referencia: `apps/khatarsis/src/{router/index.ts,App.vue,main.ts,views/HomeView.vue,components/home/*}` y reglas khatarsis `CODING_STANDARDS.md` §2 (componentes por vista, kebab-case carpetas, PascalCase archivos, `common` solo multi-vista) + ADR-001 (Lenis manda el scroll).

## Decision

- **Carpetas por dominio** espejo khatarsis §2: `hero/` (+ `GlitchText.vue`, uso único, no va a `common`), `profile/`, `experience/` (timeline `k-timeline` dentro, sin carpeta propia), `projects/`, `interests/`, `contact/`, `background/` (fondo en uso + `BlackWallAnimation.vue` sin uso, conservado por RULES 0.2). Nombres de componente sin renombrar (diff mínimo).
- **`src/views/MainView.vue`** como única vista (`main` pedido + convención `*View.vue` khatarsis; no `IndexView`). Orquesta las 6 secciones en orden; `App.vue` queda shell delgada (fondo global + `<router-view />`).
- **`vue-router` v5 con `createWebHistory()`**, `RouteName = 'main'`, `routesMap.main = { path: '/', ... }`, `scrollBehavior() { return false }` (Lenis manda; prohibido `scroll-behavior: smooth`).
- **Alias `@` → `src`** en `vite.config.ts` (`resolve.alias`) + `tsconfig.app.json` (`baseUrl` + `paths`), espejo del `@/` de khatarsis. Imports de secciones reescritos `../` → `@/`.

## Consecuencias

- Positivas: estructura escalable por dominio; vista lista para futuras rutas (`/blog`, `/lab`) sin tocar la shell; imports absolutos estables ante moves; `vue-tsc` + build validan el alias.
- Negativas / trade-offs: `vue-router` añade dependencia + KB al bundle para una sola ruta `/` (asumido por escalabilidad pedida); `createWebHistory` en hosting 100% estático sin rewrites daría 404 fuera de `/` (no aplica hoy: sin deep links); duplicación temporal durante el move hasta borrar orígenes (resuelto al cerrar el plan).

## Alternativas Consideradas

- **`IndexView.vue`:** respeta "index" literal pero rompe la convención espejo `*View.vue` con nombre de dominio y no refleja el "main" pedido → descartado.
- **`createHashHistory`:** evita rewrites en estático, pero ensucia URLs (`#/`) y khatarsis usa `createWebHistory` → descartado.
- **Renombrar componentes sin sufijo (`Hero.vue`):** convención khatarsis pura (contexto en el árbol), pero aumenta el diff y rompe referencias mentales de 4 planes previos → descartado, se mantienen `*Section.vue`.
- **`common/` para `GlitchText`:** prohibido por khatarsis §2 (un solo consumidor) → va bajo `hero/`.

## Estado

`proposed` -> `accepted` (estructura ejecutada y verificada al cerrar lo restante, 2026-09-09: `lint:check` + `format:check` exit 0, smoke `dev` 200 en `/`, `/src/main.ts` y `/src/views/MainView.vue`; `bun run build` rojo solo por 10 errores `vue-tsc` preexistentes ajenos al refactor — ver plan).
