---
name: portfolio-navbar-router-hash-glitch-theme-tvstatic
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-11 13:00
enriched: 2026-09-11 13:15
updated: 2026-09-11 13:15
---

# Plan Tecnico: Hash routes por seccion + constante router/nav + glitch solo hover + tema con tooltip/hover y TV static 3s

## Analisis

- **Objetivo:**
  1. Cada seccion accesible por hash (`/#hero`, `/#profile`, `/#experience`, `/#projects`, `/#interests`, `/#contact`) con carga directa en pestaña nueva y scroll suave Lenis.
  2. Constante unica exportada desde `src/router/index.ts` que define las secciones/navegacion y es consumida por `Navbar.vue` (single source of truth, RULES 0.6).
  3. Texto de cada link del navbar con `GlitchText` pero solo en hover (sin ciclo automatico).
  4. Boton de tema con `k-tooltip` que muestra tema actual, prop `hover` de khatarsis, y efecto TV static 3s al cambiar tema (click o cambio de valor).

- **Scope:** 6 edits, 0 creates, 0 deletes. Archivos a editar: `src/router/index.ts`, `src/components/layout/Navbar.vue`, `src/components/hero/GlitchText.vue`, `src/composables/useStaticFlash.ts`, `src/composables/useTheme.ts` (minimo), `src/i18n/locales/{es,en}.ts`. Solo lectura: `src/views/MainView.vue`, `src/App.vue`, `src/components/background/TvStaticBackground.vue`, `src/composables/useSmoothScroll.ts`, `src/components/hero/HeroSection.vue`, `src/components/projects/ProjectsSection.vue`.

- **Archivos verificados 2026-09-11 (lectura real):**
  - `src/router/index.ts:1-35` — `routesMap` con 6 paths (`/`, `/profile`...) todos a `MainView`, `meta.section`, `scrollBehavior` solo path, sin soporte hash. Exporta `routesMap` y default router. No exporta constante de navegacion filtrada por navbar.
  - `src/components/layout/Navbar.vue:1-55` — `navLinks` hardcodeado local (5 entradas, sin hero), `router-link :to="link.path"` con clases `text-zinc-300 hover:text-white`, boton tema `<button>` nativo sin `k-tooltip`, sin prop `hover`, sin TV static.
  - `src/composables/useTheme.ts:1-42` — `theme` ref, `initTheme()` con `localStorage` + `matchMedia`, `toggleTheme()`, sin label helper ni side-effect TV static.
  - `src/composables/useStaticFlash.ts:1-19` — `isHovering`, `isNavigating`, `isFlashVisible = isHovering||isNavigating`, `setHover`, `flashOnNavigate(5000)` con timer unico `navTimer`.
  - `src/components/background/TvStaticBackground.vue:1-250` — WebGL snow, lee `isFlashVisible` para `z-10` vs `-z-10`, sin canal de tema.
  - `src/components/hero/GlitchText.vue:1-200` — props `text`, ciclo `ACTIVE_MS 4000` + `PAUSE_MS 8000` con `isGlitching` automatico desde `onMounted`, hover prolonga glitch pero no lo aisla; sin prop `hoverOnly`.
  - `src/views/MainView.vue:1-20` — monta `hero-section` + `projects-section`, `ScrollTrigger.refresh()` en `onMounted`, sin manejo de `route.hash`.
  - `src/App.vue:1-50` — `initSmoothScroll()` + `router.afterEach` para `flashOnNavigate(5000)`, `main` con `relative min-h-screen` (ya sin colores por `body`).
  - `khatarsis` — `k-tooltip` (`content`, `placement`, `delay`, `trigger hover`) con `floating-ui`, teleported a `body`; `k-button` prop `hover?: boolean` (`hoverable` state). `k-tooltip` requiere slot default con trigger y prop `content`.
  - `src/i18n/locales/es.ts|en.ts` — `nav.toggleTheme` generico, sin `nav.themeDark`/`nav.themeLight` ni keys de tooltip actual.

- **Riesgos:**
  1. Hash scroll en carga fresca falla si Lenis aun no inicia (`App.vue` monta antes que `MainView`) → mitigado con doble handling: `scrollBehavior` hash + fallback en `MainView` con `nextTick` + `setTimeout 150ms` + `scrollTo(hash)`.
  2. `GlitchText hoverOnly` rompe hero que si quiere ciclo → mitigado con prop default `false`, hero sin prop mantiene ciclo.
  3. Doble flash (navigate+theme) con mismo `isFlashVisible` → mitigado con timer independiente `themeTimer` y ref `isThemeFlash` en `useStaticFlash.ts`.
  4. `router-link` activo con hash: `route.hash` vs `route.path` → mitigado comparando `route.hash === section.hash`.

## Cambios

### 1. `src/components/hero/GlitchText.vue` (edit)

**Añadir prop `hoverOnly` para desactivar ciclo automatico en navbar sin tocar hero.**

```ts
interface GlitchTextProps {
  text: string
  hoverOnly?: boolean
}
const props = withDefaults(defineProps<GlitchTextProps>(), { hoverOnly: false })
```

- Modificar `onMounted`: `if (prefersReducedMotion() || props.hoverOnly) return` — no inicia `startActivePhase()`.
- Modificar handlers:
  ```ts
  const handlePointerEnter = () => {
    if (props.hoverOnly) { isGlitching.value = true; return }
    clearCycle(); isGlitching.value = true
  }
  const handlePointerLeave = () => {
    if (props.hoverOnly) { isGlitching.value = false; return }
    clearCycle(); isGlitching.value = false; schedulePause()
  }
  ```
- Mantener `clearCycle`, `ACTIVE_MS`/`PAUSE_MS`, template y `<style>` intactos. Ingles-only comentarios.

### 2. `src/composables/useStaticFlash.ts` (edit)

**Añadir canal tematico independiente de 3s.**

```ts
const isThemeFlash = ref(false)
let themeTimer: number | undefined = undefined

export const isFlashVisible = computed(
  () => isHovering.value || isNavigating.value || isThemeFlash.value,
)

export function flashOnThemeToggle(durationMs = 3000): void {
  isThemeFlash.value = true
  window.clearTimeout(themeTimer)
  themeTimer = window.setTimeout(() => {
    isThemeFlash.value = false
  }, durationMs)
}
```

- Mantener `setHover` y `flashOnNavigate(5000)` intactos, sin romper `TvStaticBackground.vue` que solo lee `isFlashVisible`.

### 3. `src/router/index.ts` (edit)

**Exportar constante unica y soportar hash con Lenis.**

```ts
export const NAV_SECTIONS = [
  { name: 'profile' as const, hash: '#profile' as const, sectionId: 'profile' as const, labelKey: 'nav.profile' as const },
  { name: 'experience' as const, hash: '#experience' as const, sectionId: 'experience' as const, labelKey: 'nav.experience' as const },
  { name: 'projects' as const, hash: '#projects' as const, sectionId: 'projects' as const, labelKey: 'nav.projects' as const },
  { name: 'interests' as const, hash: '#interests' as const, sectionId: 'interests' as const, labelKey: 'nav.interests' as const },
  { name: 'contact' as const, hash: '#contact' as const, sectionId: 'contact' as const, labelKey: 'nav.contact' as const },
] as const

export type NavSection = (typeof NAV_SECTIONS)[number]
export type SectionId = NavSection['sectionId'] | 'hero'
```

- Mantener `routesMap` y `RouteName` por compatibilidad (o derivar `routesMap` de `NAV_SECTIONS` si se quiere DRY, pero no romper imports existentes). Si se deriva, documentar.
- Reescribir `scrollBehavior`:
  ```ts
  scrollBehavior(to) {
    // Hash-first: supports /#projects and direct hash load
    if (to.hash) {
      // Defer: let MainView mount + Lenis init; scrollTo handles offset
      setTimeout(() => scrollTo(to.hash), 80)
      return false
    }
    const section = to.meta.section as string | null
    if (section) {
      scrollTo(`#${section}`)
      return false
    }
    // Fallback: path like /profile without hash -> map to hash
    const byPath = NAV_SECTIONS.find(s => `/${s.name}` === to.path)
    if (byPath) {
      setTimeout(() => scrollTo(byPath.hash), 80)
      return false
    }
    return false
  },
  ```
- Mantener `createWebHistory()`, rutas existentes (todas a `MainView`), `scrollTo` importado de `useSmoothScroll`. Comentarios en ingles.

### 4. `src/views/MainView.vue` (edit menor)

**Fallback hash en carga fresca cuando scrollBehavior corrio antes de Lenis.**

```ts
import { useRoute } from 'vue-router'
import { scrollTo } from '@/composables/useSmoothScroll'
const route = useRoute()
onMounted(async () => {
  await nextTick()
  requestAnimationFrame(() => ScrollTrigger.refresh())
  if (route.hash) {
    setTimeout(() => scrollTo(route.hash), 150)
  }
})
```

- Mantener `hero-section` + `projects-section` con `id` existentes (`hero` en `HeroSection.vue`, `projects` en `ProjectsSection.vue`); si faltan `profile`/`experience`/etc secciones, el `scrollTo` hara no-op sin error (fuera de alcance crear secciones).

### 5. `src/components/layout/Navbar.vue` (edit principal)

**Consumir constante, glitch solo hover, tooltip + hover y TV static.**

```ts
import { NAV_SECTIONS } from '@/router'
import GlitchText from '@/components/hero/GlitchText.vue'
import { flashOnThemeToggle } from '@/composables/useStaticFlash'
import { watch } from 'vue'
const themeTooltip = computed(() =>
  isDark.value ? t('nav.themeDark') : t('nav.themeLight'),
)
watch(theme, () => flashOnThemeToggle(3000))
const handleToggleTheme = () => {
  toggleTheme()
  // watcher will also fire; flash is idempotent via timer clear
  // keep explicit call for click guarantee if watcher coalesces
  flashOnThemeToggle(3000)
}
```

Template changes:

```vue
<ul class="hidden items-center gap-6 sm:flex">
  <li v-for="section in NAV_SECTIONS" :key="section.hash">
    <router-link
      :to="{ path: '/', hash: section.hash }"
      :class="route.hash === section.hash ? 'font-medium text-white' : 'text-zinc-300'"
      class="text-sm transition hover:text-white"
    >
      <glitch-text :text="t(section.labelKey)" hover-only />
    </router-link>
  </li>
</ul>
<k-tooltip :content="themeTooltip" placement="bottom" :delay="200">
  <k-button
    :aria-label="t('nav.toggleTheme')"
    hover
    :icon="isDark ? 'mdi:weather-night' : 'mdi:white-balance-sunny'"
    @click="handleToggleTheme"
  />
</k-tooltip>
<!-- fallback if k-button icon prop not desired: keep k-icon slot -->
```

- Si `k-button` no acepta `:icon` string en este build, usar `<k-button hover ...><k-icon :name="..."/></k-button>`.
- Mantener `handleLogoClick` con `router.push('/')` + `scrollTo(0)`, `isDark` computed, clases Tailwind existentes, sin margenes (`gap-6` ya cumple §7).
- Retirar `navLinks` local hardcodeado, importar `NAV_SECTIONS`.

### 6. `src/i18n/locales/es.ts` + `src/i18n/locales/en.ts` (edit)

**Añadir keys de tooltip de tema actual.**

```ts
// es.ts nav: { ..., themeDark: 'Modo oscuro', themeLight: 'Modo claro' }
// en.ts nav: { ..., themeDark: 'Dark mode', themeLight: 'Light mode' }
```

- Mantener `toggleTheme` existente (aria), añadir `themeDark`/`themeLight` para tooltip `themeTooltip`. Ingles-only keys, copy en i18n.

### 7. `src/composables/useTheme.ts` (read / toque minimo opcional)

- No añadir logica de flash aqui para no acoplar UI a composable. Solo lectura. Si el watcher de Navbar no cubre cambio externo de `localStorage`, añadir export `theme` ya existe; watcher en App.vue opcional pero fuera de este plan.

## Restricciones

- No crear archivos ni secciones nuevas (`profile`, `experience`... ya referenciadas pero no montadas en `MainView` hoy; hash no-op hasta que existan — fuera de alcance).
- `.agents/RULES.md` 0.3/0.4/0.13, `.agents/CODING_STANDARDS.md` §7 (cero margenes, sin `width/height` fijos con flex, sin `[...]` , Tailwind-first con `@apply` en `<style>` si toca — aqui no toca).
- Codigo y comentarios en ingles; copy en `vue-i18n` (RULES 0.13 §2.1).
- Mantener `@custom-variant dark`, Lenis como fuente de scroll, `@tailwindcss/vite` build.

## Steps

1. **read** `src/router/index.ts`, `src/components/layout/Navbar.vue`, `src/components/hero/GlitchText.vue`, `src/composables/useStaticFlash.ts`, `src/composables/useTheme.ts`, `src/views/MainView.vue`, `src/i18n/locales/es.ts`, `en.ts`, `src/App.vue`, `TvStaticBackground.vue`, `useSmoothScroll.ts`.
2. **edit** `src/components/hero/GlitchText.vue`: añadir `hoverOnly` prop + branches en handlers + guard en `onMounted`.
3. **edit** `src/composables/useStaticFlash.ts`: añadir `isThemeFlash`, `themeTimer`, `flashOnThemeToggle(3000)` y actualizar `isFlashVisible`.
4. **edit** `src/router/index.ts`: exportar `NAV_SECTIONS` + `NavSection`/`SectionId`, reescribir `scrollBehavior` para `to.hash` + fallback path, `setTimeout scrollTo`.
5. **edit** `src/views/MainView.vue`: añadir fallback hash en `onMounted` con `useRoute` + `scrollTo`.
6. **edit** `src/i18n/locales/es.ts` + `en.ts`: añadir `nav.themeDark` / `nav.themeLight`.
7. **edit** `src/components/layout/Navbar.vue`: importar `NAV_SECTIONS` + `GlitchText` + `flashOnThemeToggle`, `themeTooltip` computed, `watch(theme)`, `handleToggleTheme` con flash, template con `v-for NAV_SECTIONS`, `glitch-text hover-only`, `k-tooltip` + `k-button hover`.
8. **read/review** diffs: verificar 0 `navLinks` hardcodeado restante, 0 `setHover` roto, `flashOnNavigate` intacto, `hero` GlitchText sin `hover-only` sigue ciclando, sin `font-size:`/`color:` nativos.
9. **verificar** (con autorizacion): `bun run build` compila `@apply`/vue-tsc sin errores nuevos; `bun run dev` — carga `/#projects` en pestaña nueva hace scroll, navbar links glitch solo hover, tooltip tema y TV static 3s al toggle.
10. **reviewer** DoD antes de `CLOSED`, escribir memoria.

## Verificacion

- **Estatica sin permiso:** `src/router` exporta `NAV_SECTIONS`; `Navbar.vue` importa `NAV_SECTIONS` y no declara `navLinks`; `GlitchText.vue` declara `hoverOnly`; `useStaticFlash.ts` exporta `flashOnThemeToggle`; `Navbar.vue` contiene `k-tooltip` + `hover` + `flashOnThemeToggle`; locales contienen `themeDark`/`themeLight`.
- **Scripts con autorizacion:** `bun run build` sin errores nuevos (separar deuda preexistente `khatarsis`); `bun run dev` visual:
  - Abrir `http://localhost:5173/#projects` en pestaña nueva → carga normal + scroll suave a `#projects`.
  - Navegacion por navbar cambia hash sin reload y scrollea con Lenis offset.
  - Hover sobre texto navbar activa glitch; sin hover no hay glitch; hero `GlitchText` sigue con ciclo.
  - Hover boton tema muestra tooltip `Modo oscuro` / `Dark mode` segun tema actual; boton tiene `hover` prop.
  - Click boton tema o `theme.value` watch dispara TV static visible 3s (`z-10`) luego oculta (`-z-10`), sin interferir con hover static de hero ni navigate 5s.

## Revision del orquestador — pendiente de aprobacion a READY

- Cumple lo pedido: hash routes + constante unica + glitch solo hover + tooltip/hover/TV static 3s.
- Auditoría khatarsis `k-tooltip`/`k-button hover` verificada en disco (`../khatarsis/...`).
- Alcance acotado a 6 edits sin crear vistas ni deps; respeta RULES / CODING_STANDARDS §7 Tailwind-first / DESIGN.
- Pasos ejecutables con diffs exactos y verificacion separada por RULES 0.4.
- No marco READY automatico: espero tu visto bueno.

## Cierre (memoria persistente)

- Que cambio: Editado `src/components/hero/GlitchText.vue` (+prop `hoverOnly` con guard en `onMounted` y branches en `handlePointerEnter/Leave`, hero sigue ciclando, navbar solo hover). Editado `src/composables/useStaticFlash.ts` (+`isThemeFlash`/`themeTimer`/`flashOnThemeToggle(3000)` y `isFlashVisible` con 3 canales, `flashOnNavigate(5000)` intacto). Editado `src/router/index.ts` (exporta `NAV_SECTIONS` 5 entradas `profile/experience/projects/interests/contact` con `hash`/`labelKey`, tipos `NavSection`/`SectionId`, `scrollBehavior` hash-first con `setTimeout scrollTo(hash)` + fallback `byPath`, `routesMap` intacto). Editado `src/views/MainView.vue` (import `useRoute`+`scrollTo`, fallback `if(route.hash) setTimeout(scrollTo)` tras `ScrollTrigger.refresh`). Editados `src/i18n/locales/es.ts|en.ts` (+`nav.themeDark`/`nav.themeLight`). Editado `src/components/layout/Navbar.vue` (retira `navLinks` hardcodeado, importa `NAV_SECTIONS`+`GlitchText`+`flashOnThemeToggle`, `themeTooltip` computed `isDark ? themeDark : themeLight`, `watch(theme)` + `handleToggleTheme` disparan `flashOnThemeToggle(3000)`, template `v-for NAV_SECTIONS` con `<router-link :to="{path:'/',hash}">` activo `route.hash === section.hash`, `<glitch-text hover-only />`, `<k-tooltip :content="themeTooltip"><k-button hover icon-only text :icon="..." /></k-tooltip>`).
- Verificacion: Inspección estática 2026-09-11 — `NAV_SECTIONS` exportado, `Navbar.vue` importa `NAV_SECTIONS` sin `navLinks`, `GlitchText.vue` declara `hoverOnly`, `useStaticFlash.ts` exporta `flashOnThemeToggle`, `Navbar.vue` contiene `k-tooltip`+`hover`+`flashOnThemeToggle`, locales contienen `themeDark/themeLight`; sin `font-size:`/`color:` nativos nuevos; `@custom-variant dark` y Lenis intactos. Build/dev no ejecutados por RULES 0.4 (requieren autorización); quedan pendientes.
- Resultado: pendiente — plan permanece EXECUTED hasta validar `bun run build` y `bun run dev` (hash `/#projects` carga+scroll, navbar glitch solo hover, tooltip tema y TV static 3s al toggle) o aceptación explícita del pendiente según DoD.
- Pendientes: autorizar `bun run build` (vue-tsc+vite, sin errores nuevos) y `bun run dev` (verificación visual hash/navbar/glitch/tooltip/TV static).
