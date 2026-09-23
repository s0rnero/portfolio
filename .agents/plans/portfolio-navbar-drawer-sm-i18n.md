---
name: portfolio-navbar-drawer-sm-i18n
status: CLOSED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-15 11:08
enriched: 2026-09-15 11:40
closed: 2026-09-15 16:20
---

# Plan: Navbar movil con drawer de khatarsis + puente i18n y consumo tipado de khatarsis

## Objetivo

- Por debajo de `sm` (640px) el navbar queda solo con el logo del portafolio a la izquierda y el trigger del drawer a la derecha del todo; los 3 accesos de seccion, el cambio de idioma y el cambio de tema viven dentro de un drawer de khatarsis (items de seccion arriba, idioma + tema al fondo).
- El drawer se cierra al cambiar de tema, al cambiar de idioma y al hacer click en un item de seccion.
- Se revierten las adaptaciones para `xs` del navbar: los textos de los items dejan de ocultarse y el bloque de idioma/tema deja de usar `flex-col-reverse`.
- khatarsis se consume con sus tipos reales (import nombrado, validado por `vue-tsc`) y su capa i18n escucha el cambio de idioma de la app.

## Analisis

### Scope (archivos)

| Archivo | Accion |
| --- | --- |
| `src/components/layout/Navbar.vue` | edit (componente principal) |
| `src/components/layout/NavControls.vue` | create (pieza compartida, decision E6) |
| `src/main.ts` | edit (puente i18n khatarsis ↔ vue-i18n) |
| `src/i18n/locales/es.ts` | edit (1 clave) |
| `src/i18n/locales/en.ts` | edit (1 clave) |
| `.agents/decisions/007-navegacion-movil-en-drawer.md` | create (al ejecutar) |
| `.agents/decisions/008-puente-i18n-khatarsis-host.md` | create (al ejecutar) |

### Fuera de alcance

La libreria `khatarsis` (repo externo), `useSmoothScroll`/Lenis, `useSectionSpy`, `src/router/index.ts`, `src/style.css`, el breakpoint `xs` global, CRT / glitch-text / TV static / contact, `FooterSection.vue`, `GradualBlur.vue`, y cualquier seccion del portafolio.

### Restricciones aplicables

- `RULES.md` 0.2 (no borrar), 0.3 (un componente principal), 0.4 (scripts), 0.6 (cero duplicacion), 0.8 (secretos), 0.12 (ADR), 0.13 (codigo en ingles).
- `CODING_STANDARDS.md` §7: cero margenes (`m-*`, `mx/my/ms/me/mt/mb/ml/mr`), flex + gap + padding; sin `width`/`height` fijos en piezas `flex-*`; `min-w-0` solo justificado; no alterar tipografia heredada; sin valores arbitrarios `[...]`; Tailwind-first con `@apply` (aqui no hace falta CSS nuevo).
- `CODING_STANDARDS.md` §2.1: identificadores, comentarios y nombres de archivo en ingles; el copy de UI vive en i18n.
- Textos de UI: **el español es la fuente** y el ingles traduce lo que ya existe; no se inventa copy nuevo.
- Config real del repo que condiciona el codigo (verificado):
  - `vue/attributes-order` con orden `DEFINITION -> [LIST_RENDERING, CONDITIONALS, RENDER_MODIFIERS, SLOT, TWO_WAY_BINDING, OTHER_DIRECTIVES] -> ATTR_DYNAMIC -> [GLOBAL, UNIQUE, ATTR_STATIC] -> ATTR_SHORTHAND_BOOL -> EVENTS -> CONTENT`.
  - `vue/component-name-in-template-casing: [error, 'kebab-case', { registeredComponentsOnly: false }]` → **todo componente en plantilla va en kebab-case**, incluso los importados: se importa `Drawer` y se escribe `<drawer>`; se importa `NavControls` y se escribe `<nav-controls>`.
  - `prettier/prettier` con `.prettierrc` (`printWidth: 100`, sin semicolons, comillas simples, `arrowParens: avoid`, `trailingComma: all`, `prettier-plugin-tailwindcss` con `tailwindStylesheet: ./src/style.css`, que ordena las clases).
  - `tsconfig.app.json`: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`.
- Sin tocar Git, sin eliminar archivos, sin instalar ni actualizar dependencias.

### Estado del i18n de khatarsis (verificado en fuente)

- `useKhatarsisLocale()` = `inject(KhatarsisLocaleSymbol) ?? getFallbackApi()`; el api de fallback arranca en `locale: 'en'`. Por eso hoy el boton de cerrar del drawer usa `khatarsis.drawer.closeLabel` y cae a **ingles** ("Close drawer"); en español el bundled es `"Cerrar drawer"`.
- `provideKhatarsisLocale(app, options)` construye el estado con los mensajes **bundled** (`en`.json y `es`.json ya vienen en el paquete), hace `app.provide(...)` y **devuelve el api**. Es la via directa desde `main.ts` (no necesita contexto de componente, a diferencia de `useKhatarsisLocale()`).
- `syncVueI18nWithKhatarsis(api, i18n, options)` mezcla los mensajes bundled en la instancia `vue-i18n` del host, hace `api.setLocale(localeDelHost)` una vez y devuelve `watch(api.locale -> host)`. **No escucha el cambio de idioma del host**: esa es la direccion que falta y la que agrega este plan con un `watch` propio.
- `api.locale` es un `Ref<string>`, asi que los componentes de la libreria reaccionan solos en cuanto el api cambia de locale (el drawer recalcula su etiqueta).

### Estado del navbar hoy (anclas verificadas 2026-09-15)

`src/components/layout/Navbar.vue`:

| Linea | Contenido actual |
| --- | --- |
| 1-11 | imports (`useI18n`, `useRouter`, `useSmoothScroll`, `useTheme`, `NAV_SECTIONS`, `GlitchText`, `useStaticFlash`, `LOCALE_STORAGE_KEY`/`AppLocale`, logo) |
| 13-16 | `interface LocaleOption` |
| 21-33 | `t`/`locale`, `router`, `theme`/`toggleTheme`, `isDark`, `themeTooltip`, `localeOptions`, `selectedLocale` |
| 34-37 | `watch(selectedLocale)` → setea `locale.value` + `localStorage` |
| 39-41 | `watch(theme)` → `flashOnThemeToggle()` |
| 43-46 | `handleLogoClick` |
| 48-50 | `handleToggleTheme` |
| 54-55 | `<header class="fixed top-0 z-40 w-full bg-transparent">` + `<nav>` |
| 57-64 | boton del logo |
| 69 | `<ul class="flex items-center gap-8 xs:gap-6">` |
| 71-80 | item: `router-link` con `:aria-label` (73), `k-icon` (75) y wrapper `<span class="hidden sm:inline-flex">` (77-79) |
| 85 | `<div class="flex flex-col-reverse items-center gap-1 xs:flex-row xs:gap-4">` |
| 86-97 | label `sr-only` + `k-select` (`id="navbar-language-select"`) |
| 98-107 | `k-tooltip` + `k-button` de tema |
| 109-110 | `</nav>` `</header>` |

`src/main.ts` (18 lineas): `app.component('KIcon', Icon)` en 13; `app.use(khatarsisPlugin)` 14; `app.use(khatarsis)` 15; `app.use(i18n)` 16; `app.use(router)` 17; `app.mount('#app')` 18.

## Decisiones

- **E1 — Breakpoint del drawer:** `:breakpoint="640"` via la constante local `drawerBreakpoint` en `Navbar.vue`. El prop compara contra `window.innerWidth` y `sm` de Tailwind es `40rem` en `@media` (media queries resuelven `rem` con el font-size inicial, 16px → 640px): los dos lados coinciden. Se documenta en un comentario en ingles que ambos valores deben moverse juntos.
- **E2 — Se usa el slot `trigger` del drawer, no un boton propio:** el slot solo se renderiza por debajo del breakpoint y el panel solo se monta ahi mismo; ademas el drawer emite `update:modelValue false` al superar el breakpoint, asi que la apertura, el cierre por resize y la visibilidad del trigger los gobierna la libreria. No se agregan `hidden`/`sm:hidden` al trigger (seria logica duplicada).
- **E3 — Emplazamiento:** el nav sigue siendo un unico `flex` con `justify-between`: por debajo de `sm` solo participan logo + trigger (los otros bloques quedan `display: none`), por encima participan logo + lista + controles (el trigger no se renderiza). Cero margenes y sin tocar el layout de escritorio.
- **E4 — `side="right"` y `size="md"`:** `md` es 85% del ancho en movil, adecuado para items con icono + texto y un selector; `sm` (45%) queda angosto. Ajustable sin cambiar la estructura.
- **E5 — Cierres:** el cambio de tema y el cambio de idioma cierran el drawer desde `Navbar.vue` (`watch(theme)` y `watch(locale)`), no desde el control; el click en un item usa el handler `handleSectionClick`. Asi el control compartido (E6) no necesita emitir nada.
- **E6 — Extraccion de `NavControls.vue`** (respuesta del usuario 2026-09-15): los controles deben verse en el navbar (>=640px) y en el pie del drawer (<640px). Se extrae un unico componente presentacional reutilizado dos veces con distinto `selectId`, para cumplir RULES 0.6 en lugar de duplicar el bloque. Es la unica pieza nueva y se justifica como necesidad tecnica explicada.
- **E7 — `lang` como computed escribible en `NavControls`:** con dos instancias, un `ref` local queda obsoleto cuando el idioma cambia en la otra (p. ej. se cambia desde el drawer y la instancia del navbar, oculta, muestra la etiqueta vieja al volver a >=640px). Un `computed` con getter sobre `locale` y setter que persiste elimina el problema y el watcher correspondiente. La persistencia (`LOCALE_STORAGE_KEY`) se mantiene identica.
- **E8 — Puente i18n (D2 del usuario):** en `main.ts`, `provideKhatarsisLocale(app, { locale: i18n.global.locale.value, fallbackLocale: 'en' })` + `watch(i18n.global.locale, value => khatarsisLocale.setLocale(value))`. **Alternativa descartada en esta iteracion:** `createI18nKhatarsis` + `app.runWithContext(() => useKhatarsisLocale())` + `syncVueI18nWithKhatarsis(api, i18n)`; la via documentada agrega los mensajes de la libreria al i18n del host (nada del portafolio usa claves `khatarsis.*`) y un `watch` en la direccion contraria a la que falta, asi que se prefiere el camino directo. Queda registrada en ADR-008.
- **E9 — Consumo tipado:** `import { Drawer } from 'khatarsis'` y `<drawer>` en plantilla. El paquete no declara `GlobalComponents`, asi que `<k-drawer>` no lo validaria `vue-tsc`; con el import nombrado el typecheck revisa props y slots contra `DrawerProps` (el payoff pedido por el usuario).
- **E10 — Ids distintos:** el `k-select` del navbar conserva `id="navbar-language-select"` y el del drawer usa `id="drawer-language-select"` (los dos existen en el DOM a la vez cuando uno esta oculto por `display: none`; ids duplicados invalidan el `for` del label).

## Cambios por archivo

### 1. `src/components/layout/NavControls.vue` (create)

Componente presentacional, raiz multiple (label + select + tooltip): no recibe attrs por fallthrough, asi que cada consumidor lo envuelve en su propio contenedor de layout con clases.

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import { LOCALE_STORAGE_KEY, type AppLocale } from '@/i18n'

interface NavControlsProps {
  selectId: string
}

interface LocaleOption {
  label: string
  value: AppLocale
}

defineProps<NavControlsProps>()

const { t, locale } = useI18n()
const { theme, toggleTheme } = useTheme()

const isDark = computed(() => theme.value === 'dark')

const themeTooltip = computed(() => (isDark.value ? t('nav.themeDark') : t('nav.themeLight')))

// Fixed endonyms: identical in every locale by definition, so they are not translated.
const localeOptions: LocaleOption[] = [
  { label: 'Español', value: 'es' },
  { label: 'English', value: 'en' },
]

// Writable computed over the shared locale: two instances stay in sync and the
// choice is persisted, unlike a local ref that would go stale.
const selectedLocale = computed<AppLocale>({
  get: () => locale.value as AppLocale,
  set: value => {
    locale.value = value
    localStorage.setItem(LOCALE_STORAGE_KEY, value)
  },
})
</script>

<template>
  <label class="sr-only" :for="selectId">{{ t('nav.selectLanguage') }}</label>
  <k-select
    v-model="selectedLocale"
    :clearable="false"
    :filterable="false"
    :options="localeOptions"
    :id="selectId"
    option-label="label"
    option-value="value"
    size="sm"
    value-only
  />
  <k-tooltip :content="themeTooltip" placement="bottom">
    <k-button
      :aria-label="t('nav.toggleTheme')"
      :icon="isDark ? 'mdi:weather-night' : 'mdi:white-balance-sunny'"
      hover
      icon-only
      text
      @click="toggleTheme"
    />
  </k-tooltip>
</template>
```

Notas de fidelidad: el markup y todos los valores de props son los que hoy estan en `Navbar.vue` (86-107) sin cambios de comportamiento; lo unico nuevo es `:id` dinamico y el `computed` escribible. `flashOnThemeToggle()` no viaja aca: sigue en el `watch(theme)` de `Navbar.vue` (evita dos llamadas al mismo evento).

### 2. `src/components/layout/Navbar.vue` (edit)

- **Imports:** agregar `import { Drawer } from 'khatarsis'` y `import NavControls from '@/components/layout/NavControls.vue'`; quitar `LOCALE_STORAGE_KEY`/`AppLocale` (se van a `NavControls`) y el `interface LocaleOption` (lineas 13-16).
- **Estado:** quitar `toggleTheme` del destructuring de `useTheme()` (queda `const { theme } = useTheme()`), quitar `themeTooltip`, `localeOptions`, `selectedLocale` y `handleToggleTheme`; agregar:

```ts
// Mirrors Tailwind's `sm` (40rem) breakpoint: both values must move together.
const drawerBreakpoint = 640

const isDrawerOpen = ref(false)
```

- **Watchers (34-41):** el de locale cambia de fuente y suma el cierre; el de tema suma el cierre:

```ts
watch(locale, () => {
  isDrawerOpen.value = false
})

watch(theme, () => {
  flashOnThemeToggle()
  isDrawerOpen.value = false
})
```

- **Handler nuevo** (junto a los otros, antes del `</script>`):

```ts
const handleSectionClick = () => {
  isDrawerOpen.value = false
}
```

- **Plantilla:**
  - Linea 69: `<ul class="flex items-center gap-8 xs:gap-6">` → `<ul class="hidden items-center gap-8 sm:flex">` (se quita `xs:gap-6`: con la lista oculta por debajo de `sm` esa variante queda muerta).
  - Linea 73: quitar `:aria-label="t(section.labelKey)"` del `router-link` (con el texto siempre visible, el nombre accesible vuelve a salir del contenido).
  - Lineas 77-79: quitar el wrapper `<span class="hidden sm:inline-flex">` y dejar `<glitch-text :text="t(section.labelKey)" hover-only />` directo.
  - Lineas 85-108: reemplazar el bloque completo de controles por:

```vue
      <div class="hidden items-center gap-4 sm:flex">
        <nav-controls select-id="navbar-language-select" />
      </div>
```

  - **Antes de `</nav>` (linea 109), agregar el drawer:**

```vue
      <drawer
        v-model="isDrawerOpen"
        :aria-label="t('nav.ariaNavigation')"
        :breakpoint="drawerBreakpoint"
        side="right"
        size="md"
      >
        <template #trigger="{ open }">
          <k-button
            :aria-label="t('nav.openMenu')"
            icon="mdi:menu"
            hover
            icon-only
            text
            @click="open"
          />
        </template>

        <ul class="flex flex-col gap-2">
          <li v-for="section in NAV_SECTIONS" :key="section.hash">
            <router-link
              :to="{ path: '/', hash: section.hash }"
              class="flex items-center gap-3 font-black"
              @click="handleSectionClick"
            >
              <k-icon :name="section.icon" class="size-6" aria-hidden="true" />
              <glitch-text :text="t(section.labelKey)" hover-only />
            </router-link>
          </li>
        </ul>

        <template #footer>
          <div class="flex w-full items-center justify-between gap-4">
            <nav-controls select-id="drawer-language-select" />
          </div>
        </template>
      </drawer>
```

  - `:aria-label="t('nav.ariaNavigation')"` reemplaza la etiqueta interna del panel (que caeria al ingles de la libreria) sin depender del locale de khatarsis. No se pasa `title` ni `header`: sin titulo ni slots de header, el drawer no dibuja cabecera y el boton de cerrar sigue apareciendo (`closable` es `true` por defecto).
  - El icono `mdi:menu` fue validado contra la API de Iconify (HTTP 200, sin alias).

### 3. `src/i18n/locales/es.ts` y `src/i18n/locales/en.ts` (edit)

Una clave nueva en `nav`, despues de `ariaHome` (mismo lugar en los dos archivos):

- `es.ts`: `openMenu: 'Abrir menú',`
- `en.ts`: `openMenu: 'Open menu',`

### 4. `src/main.ts` (edit)

- Import: `import khatarsisPlugin, { Icon, khatarsis, provideKhatarsisLocale } from 'khatarsis'` y `import { createApp, watch } from 'vue'`.
- Despues de `app.use(i18n)` (linea 16), antes de `app.use(router)`:

```ts
// khatarsis keeps its own locale state; this bridges it with the app locale in
// both directions (initial value here, changes through the watcher below).
const khatarsisLocale = provideKhatarsisLocale(app, {
  locale: i18n.global.locale.value,
  fallbackLocale: 'en',
})

watch(i18n.global.locale, value => khatarsisLocale.setLocale(value))
```

### 5. ADR (create, al ejecutar)

- `.agents/decisions/007-navegacion-movil-en-drawer.md`: la navegacion por debajo de `sm` vive en un drawer de khatarsis y el navbar deja de tener el layout completo; el trigger y el cierre por resize los gobierna el prop `breakpoint` de la libreria, y el cierre por interaccion lo gobierna el portafolio (tema, idioma, item de seccion). Consecuencias: el navbar pasa a tener dos modos, aparece una pieza compartida (`NavControls.vue`) y el estado del drawer vive en el navbar. Estado `proposed`.
- `.agents/decisions/008-puente-i18n-khatarsis-host.md`: el puente i18n khatarsis ↔ `vue-i18n` es responsabilidad del host y en ambas direcciones; la libreria aporta `provideKhatarsisLocale` (estado + bundled `en`/`es`) y su `syncVueI18nWithKhatarsis` solo cubre khatarsis → host, asi que el portafolio agrega host → khatarsis con `setLocale`. Consecuencias: los textos internos de los componentes `k-*` siguen el idioma de la app; el portafolio asume mantener ese `watch`. Estado `proposed`.

## Steps

1. **read** `src/components/layout/Navbar.vue`, `src/main.ts`, `src/i18n/locales/es.ts`, `src/i18n/locales/en.ts` (confirmar que las anclas de este plan siguen vigentes) y `src/composables/useTheme.ts`.
2. **create** `src/components/layout/NavControls.vue` con el contenido de la seccion 1 (nombres de archivo, props e identificadores en ingles; sin margenes; sin valores arbitrarios).
3. **edit** `src/i18n/locales/es.ts`: agregar `openMenu: 'Abrir menú',` despues de `ariaHome` en el bloque `nav`.
4. **edit** `src/i18n/locales/en.ts`: agregar `openMenu: 'Open menu',` despues de `ariaHome` en el bloque `nav`.
5. **edit** `src/components/layout/Navbar.vue` — script: imports nuevos, quitar los que se van a `NavControls`, `drawerBreakpoint`, `isDrawerOpen`, los dos `watch`, `handleSectionClick` (secciones 2.-imports a 2.-handler).
6. **edit** `src/components/layout/Navbar.vue` — plantilla: `ul` oculto hasta `sm`, quitar el `:aria-label` del item y el wrapper del `glitch-text`, reemplazar el bloque de controles por `<nav-controls>`, y agregar el `<drawer>` con sus tres slots.
7. **edit** `src/main.ts`: import de `provideKhatarsisLocale` y `watch`, y el bloque de puente i18n antes de `app.use(router)`.
8. **create** los dos ADR de la seccion 5, en `proposed`.
9. **Verificacion** (seccion siguiente) y, con el resultado, `status: EXECUTED` + entrada de cierre.

## Verificacion

- **Autorizada (D3 del usuario):** `bun run lint:check`, `bun run format:check`, `bun run build`. El build corre `vue-tsc -b`, que es la validacion fuerte de E9 (props y slots del `Drawer` contra `DrawerProps`, `NavControls` con su prop tipada, `AppLocale` en el computed).
- **Chequeo de cascada (opcional, lectura):** confirmar en el CSS compilado que `.hidden` (base) aparece antes que el bloque `@media (width >= 40rem)` con `.sm\:flex`, igual que se verifico para `xs:inline-flex` en el plan anterior.
- **Correcciones:** si `format:check` marca orden de clases, o `lint:check` marca algo, corregir a mano; ejecutar los fixers (`bun run lint`, `bun run format`) solo con autorizacion aparte.
- **Manual (usuario):**
  1. 375px y 639px: se ve logo + trigger, sin items ni controles inline; el drawer abre y se ve la lista de 3 items arriba y el idioma/tema al fondo.
  2. Cierra con overlay, `Esc`, click en un item, cambio de idioma y cambio de tema.
  3. 640px y 1280px: navbar completo (items con texto, idioma y tema) y **sin** trigger.
  4. Agrandar la ventana con el drawer abierto: se cierra solo (breakpoint).
  5. En ES, el `aria-label` del boton de cerrar del drawer dice "Cerrar drawer" (traduccion de la libreria, via puente i18n); en EN, "Close drawer". Cambiar de idioma en vivo con el drawer abierto.
  6. Scroll de fondo con el drawer abierto (riesgo R2).

## Riesgos

- **R1 — `k-select` dentro del drawer teleportado (`z-50`):** el desplegable podria quedar detras del panel. Mitigacion sin autorizar: ninguna. Escalada (requiere OK): subir el `z` del desplegable con la prop `ui` del select, o cambiar el control por uno sin desplegable flotante.
- **R2 — Scroll de fondo:** el drawer hace `document.body.style.overflow = 'hidden'` al abrir, pero Lenis es el motor de scroll (ADR-001) y podria seguir desplazando el fondo. Escalada (requiere OK): congelar Lenis mientras el drawer esta abierto.
- **R3 — `k-tooltip` del boton de tema dentro del panel:** el panel tiene `overflow: hidden`; si el tooltip se recorta, cambiar `placement`.
- **R4 — Orden de clases y formato:** la lista de clases nueva y los atributos pasan por prettier + `eslint-plugin-better-tailwindcss`; el plan no agrega tokens nuevos, pero si `format:check` reclama, se ajusta a mano.
- **R5 — Registro de plugins:** `khatarsisPlugin` (componentes + directiva), `khatarsis` (config, hoy con objeto vacio: solo registra la directiva) y el nuevo `provideKhatarsisLocale` conviven; confirmar en el build que no aparecen advertencias de provide duplicado.
- **R6 — Ids duplicados:** resuelto por E10; se verifica igual en el DOM (una sola `navbar-language-select` y una sola `drawer-language-select`).
- **R7 — Perdida del `aria-label` del item:** al quitar `:aria-label` (linea 73), el nombre accesible del link pasa a ser el texto del `glitch-text`; verificar en el arbol de accesibilidad que el link sigue nombrado (no queda vacio) en ambos modos.

## Pendientes y observaciones reportadas

- **`--breakpoint-xs` hoy vale `28rem` (448px)** en `src/style.css:166`; el plan anterior lo habia dejado en `20rem`. No lo toca este plan, pero el contacto pasa de 1 a 2 columnas a 448px, no a 320px. Reportado para decision aparte.
- **Escaladas R1 y R2:** sin autorizar; solo se aplican si la revision visual las dispara.
- **`app.use(khatarsis)`** en `main.ts:15` hoy no aporta configuracion (objeto vacio); retirarlo es una limpieza aparte, fuera del alcance.
- **Lado y tamano del drawer** (`right` / `md`) los fija E4; ajustables sin cambiar la estructura.

## Registro de ejecucion (2026-09-15 12:05)

Ejecutado con la compuerta **"ejecuta el plan"** del usuario (`READY -> EXECUTED`), dentro del alcance aprobado y sin agregar pasos.

### Archivos tocados

| Archivo | Cambio real |
| --- | --- |
| `src/components/layout/NavControls.vue` | **nuevo**: label + `k-select` + `k-tooltip` + boton de tema, con prop `selectId` y `selectedLocale` como `computed` escribible (E6/E7) |
| `src/components/layout/Navbar.vue` | import nombrado de `Drawer` + `NavControls`; `drawerBreakpoint = 640`; `isDrawerOpen`; `watch(locale)` y `watch(theme)` cierran el drawer; `handleSectionClick`; lista y controles ocultos hasta `sm`; drawer con slots `trigger`, `default` y `footer`; sin el wrapper `hidden sm:inline-flex` ni el `aria-label` redundante del item |
| `src/main.ts` | `provideKhatarsisLocale` + `watch(i18n.global.locale)` para el puente i18n (E8) |
| `src/i18n/locales/es.ts` / `en.ts` | clave nueva `nav.openMenu` ('Abrir menú' / 'Open menu') |
| `.agents/decisions/007-navegacion-movil-en-drawer.md` | **nuevo**, `proposed` |
| `.agents/decisions/008-puente-i18n-khatarsis-host.md` | **nuevo**, `proposed` |

### Desvio menor respecto del texto del plan

El plan decia aplicar `hidden sm:flex` a la `<ul>` de items. En la ejecucion se aplico al `<div>` que ya la envolvia (`<div class="hidden items-center gap-6 sm:flex">`), porque ocultar solo la `ul` dejaba ese `div` participando como hijo vacio del `justify-between`. Comportamiento identico (la lista no se ve por debajo de `sm`) y sin DOM muerto. Tambien se quito `xs:gap-6` de la `ul`, como preveia el paso 6.

### Verificacion: BLOQUEADA por un cambio externo

Los tres comandos autorizados fallan por la misma causa, ajena a este plan:

- `bun run build` → `error TS2307: Cannot find module 'khatarsis'` en `src/main.ts`, `src/components/layout/Navbar.vue`, `src/components/background/TvStaticBackground.vue` y `src/components/background/FaultyTerminalBackground.vue` (los dos ultimos **no** se tocaron en este plan).
- `bun run lint:check` → ESLint aborta: `Can't resolve 'khatarsis/style.css' in .../src` (el `entryPoint` de `eslint-plugin-better-tailwindcss` es `src/style.css`, que importa `khatarsis/style.css`).
- `bun run format:check` → mismo error en `prettier-plugin-tailwindcss` (38 archivos, incluidos `vite.config.ts` y `scripts/*.mjs`, sin relacion con este plan).

Causa verificada: el repositorio de la libreria regenero `packages/khatarsis/dist/` el 2026-09-15 11:13 con `khatarsis.{es,cjs}.js`, `khatarsis.css` y `types/`, **sin `dist/public/`**; pero su `package.json` (enlazado como symlink desde `node_modules/khatarsis`) sigue declarando `types` y `exports` hacia `./dist/public/...`. En `node_modules/khatarsis/dist/public/` quedaron symlinks rotos a `dist/public/khatarsis.{es,cjs}.js` y `khatarsis.css`, y TypeScript resuelve el paquete por la ruta real del symlink, donde `dist/public/types/public.d.ts` ya no existe.

Consecuencia: **no se pudo validar el typecheck de este plan** (`vue-tsc` no llega a compilar ningun modulo que importe `khatarsis`). El bloqueo se resuelve en el repo de la libreria (regenerar su build publico o revertir los `exports`), no en el portafolio: no se modifico ninguna configuracion del repo para sortearlo.

### Revision pendiente

- Chequeo de cascada (`.hidden` antes del bloque `@media (width >= 40rem)` con `.sm\:flex`) y revision visual de los dos modos del navbar, los tres cierres del drawer y el cierre por resize: pendientes hasta que compilen.

## Cierre (memoria persistente)

Cerrado el 2026-09-15 16:20 por confirmacion explicita del usuario: **"el drawer del navbar ya funciona"**. Se aplico el checklist de `.agents/subagents/reviewer.md` (DoD de `.agents/WORKFLOW.md`).

- **Que cambio:** el navbar pasa a dos modos. Por debajo de `sm` (640px) solo logo + trigger del drawer de khatarsis; los 3 items de `NAV_SECTIONS` en el slot `default` y el idioma/tema en el slot `footer`, con cierre al cambiar de tema, al cambiar de idioma y al hacer click en un item. Los textos de los items dejaron de ocultarse y el bloque de controles dejo de usar `flex-col-reverse`. Pieza nueva `src/components/layout/NavControls.vue` (compartida entre navbar y pie del drawer) y puente i18n `provideKhatarsisLocale` + `watch` en `src/main.ts`. Detalle completo en el registro de ejecucion de arriba.
- **Alcance:** coincidio con el plan aprobado. Un solo desvio, documentado arriba (ocultar el `<div>` que envuelve la `<ul>` en lugar de la `<ul>`); comportamiento identico y sin DOM muerto.
- **Verificacion:**
  - **Manual (usuario):** aprobada. El drawer funciona en pantalla.
  - **Scripts (`lint:check`, `format:check`, `build`):** pendientes por regla 0.4 (cada ejecucion necesita autorizacion independiente) y, de fondo, bloqueados por un fallo externo del repo de la libreria: `khatarsis` regenero `packages/khatarsis/dist/public/` el 2026-09-15 15:26 **sin la carpeta `types/`**, mientras su `package.json` sigue declarando `"types": "./dist/public/types/public.d.ts"` (verificado 2026-09-15 16:20). Con eso `vue-tsc` no resuelve el modulo, asi que el typecheck de este plan sigue sin poder ejecutarse.
- **Resultado:** aprobado por verificacion manual del usuario; scripts pendientes (regla 0.4 + bloqueo externo de la libreria).
- **Pendientes:** (1) cuando `khatarsis` vuelva a publicar `dist/public/types/`, correr `lint:check`, `format:check` y `build` y confirmar que `provideKhatarsisLocale` sigue exportado; (2) chequeo de cascada `.hidden` vs `.sm\:flex` en el CSS compilado; (3) riesgos R1 (`z` del desplegable del select dentro del panel) y R2 (scroll de fondo con Lenis activo) siguen sin disparador visual.
- **Decisiones:** ADR-007 y ADR-008 registrados y confirmados con el mismo cierre (ver `.agents/decisions/`).

### Nota posterior (2026-09-15 16:50)

Ese mismo dia, durante la ejecucion del plan `portfolio-agents-refresh-vicecity-easter-egg`, `khatarsis` volvio a resolver `khatarsis/style.css`, ESLint dejo de abortar y `lint:check` corrio por primera vez sobre este plan: encontro **un** error en `src/components/layout/NavControls.vue` (`vue/attributes-order`: `:for` debia ir antes de `class` en el `<label>`), que la verificacion de este plan no pudo ver porque el linter no llegaba al archivo. Se corrigio en una linea, sin cambio de comportamiento. Con eso `bun run lint:check` queda en 0 problemas y `bun run format:check` en verde para los archivos de este plan; el unico pendiente real sigue siendo `bun run build` (TS7016, `khatarsis` sin `dist/public/types/`).
