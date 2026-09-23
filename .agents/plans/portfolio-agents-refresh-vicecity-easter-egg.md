---
name: portfolio-agents-refresh-vicecity-easter-egg
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-15 16:25
enriched: 2026-09-15 16:35
---

# Plan: Actualizacion de `.agents` (perfil y convenciones) + huevo de pascua "vicecity"

> Enriquecido el 2026-09-15 16:35 sobre la compuerta **"enriquece el plan"**. Todo lo de este documento esta verificado leyendo el repo el 2026-09-15; las anclas de linea corresponden a ese estado. El enriquecimiento no ejecuto codigo ni scripts.

## Objetivo

- **Frente A:** dejar `.agents/` sin texto desactualizado: perfil real (stack, estructura, scripts), convenciones reales del stack Vue/TS/Tailwind y arquitectura real del sitio, reemplazando los placeholders de la plantilla del harness. Solo en los 3 archivos `perRepo`.
- **Frente B:** al escribir `vicecity` y presionar `Enter` en cualquier parte de la pagina: aparece el panel "Truco activado" (`absolute`, `top-4 left-4`, mismas medidas/colores/tipografia que la referencia), el fondo de noise TV pasa a tapar todo el contenido, y en el mismo instante se navega a una vista nueva que reproduce `vc.mp4` a pantalla completa, sin controles y con sonido. A los ~3 s desaparecen panel y ruido; queda el video. Al terminar el video no pasa nada (acordado).

## Anclas verificadas (2026-09-15)

| Archivo | Ancla |
| --- | --- |
| `src/App.vue` | imports 1-16; estado 20-24; `onMounted` 38-46; plantilla 58-69 (`navbar` 60, `gradual-blur` 61, `glitch-cursor` 62, `tv-static-background` 63, `faulty-terminal-background` 64, `router-view` 65, `crt` 66, `footer-section` 67) |
| `src/router/index.ts` | `RouteName` 6; `NAV_SECTIONS` 8-30; `routesMap` 32-36; `router` 38-70; `routes: [` 58 |
| `src/components/background/TvStaticBackground.vue` | props 15-35 (`pause` 32, `fps` 33, `dpr` 34); `withDefaults` 156-179; imports de Vue 1 (`onBeforeUnmount, onMounted, ref, watch`); plantilla 345-351 con `:class="isFlashVisible ? '-z-10' : '-z-30'"` en 347 |
| `src/i18n/locales/es.ts` | bloque `contact` 80-86; cierre del objeto 87 |
| `src/i18n/locales/en.ts` | 87 lineas; bloque `contact` con el mismo cierre; el bloque nuevo va en la misma posicion que en `es.ts` |
| `src/style.css` | `@theme` 165-172 (`--breakpoint-xs` 166) |
| `src/components/common/` | `SocialLinks.vue` es el unico archivo; marca el patron de componentes compartidos |
| `.agents/AGENTS.md` | §1 completo: lineas 13-52 |
| `.agents/CODING_STANDARDS.md` | §1 11-22, §2 24-37 (§2.1 38-44 se conserva), §3 45-51, §4 52-57, §5 58-67; §6 68-72 y §7 73-83 se conservan; §8 84-95 |
| `.agents/DESIGN.md` | §1 11-22, §2 23-29, §3 30-37, §4 38-46, §5 47-53, §6 54-fin |

### Hechos que condicionan el codigo (leidos en archivo, no inferidos)

- `tsconfig.app.json` declara `"types": ["vite/client"]` → los imports de assets (`.mp4` incluido) estan tipados por Vite; no hace falta `.d.ts` nuevo (el repo no tiene ninguno).
- `eslint.config.mjs` ignora `.agents/**`, `dist/**`, `node_modules/**` y `scripts/**`; la variante `dark` es `@custom-variant dark (&:where(.dark, .dark *))`; `vue/component-name-in-template-casing` es kebab-case tambien para componentes importados; `vue/attributes-order` exige `ATTR_DYNAMIC` **antes** del grupo `[GLOBAL, UNIQUE, ATTR_STATIC]`.
- `.prettierignore` incluye `.agents` → los documentos del Frente A **no** pasan por `format:check` (no hay riesgo de formato por ese lado).
- `eslint-plugin-better-tailwindcss` valida los nombres de clase contra `src/style.css`: una utilidad con token inexistente falla `lint:check`. Es lo que obliga a declarar los tokens del panel en `@theme` (no hay valores arbitrarios permitidos, regla §7.5).
- No existe ningun listener de teclado en `src/` (verificado con `grep`): el disparador es codigo nuevo.
- `vc.mp4` = 134.100.316 bytes en `src/assets/trailers/`. El `dist/` actual (2026-09-13 21:18) pesa 2.3 MB en total: `index-*.js` 1.03 MB, `index-*.css` 437 kB, `logo_khatarsis-*.svg` 578 kB.
- El build sigue bloqueado por la libreria (explicado en "Verificacion").

### Referencia visual medida (PNG `paste-1789506183861-20280.png`, 341x42, decodificado con Node/zlib)

| Aspecto | Medido | Clase/token |
| --- | --- | --- |
| Panel | 341x42 px | `w-85 h-11` (340x44; ver R4) |
| Borde | ~4 px, cian claro (nucleo #8dfdfa) | `border-4 border-trick-frame` |
| Fondo | solido #183135 (variacion +-4) | `bg-trick-panel` |
| Texto | tinta de 16 px de alto, 156 px de ancho; color mas claro #afbdbc, nucleo #9bafae | `text-2xl font-black text-trick-text` |
| Padding horizontal | tinta arranca en x=11 con borde de 4 px → ~7 px | `px-2` |
| Tipografia | proporcional (avances 13/10/12/9/24/13/10/10/6/12/13/13 px: en monospace serian iguales), trazo 2-3 px → peso alto sin serifa | `font-black` con la familia heredada del sitio |
| Posicion | pedido del usuario | `absolute top-4 left-4` |

El overlay CRT estaba desmontado en la captura (se desmonta al terminar la intro), asi que los colores medidos son los reales en pantalla. Unica decision discutible: el tamano de fuente; `text-2xl` reproduce el ancho de tinta medido (156 px) mucho mejor que `text-xl` (~134 px).

## Alcance

### Frente A (documentacion; solo archivos `perRepo`)

`.agents/AGENTS.md` (§1), `.agents/CODING_STANDARDS.md` (§1, §2, §3, §4, §5, §8 y version), `.agents/DESIGN.md` (§1 a §6 y version).

### Frente B (codigo)

| Archivo | Accion |
| --- | --- |
| `src/composables/useViceCityCode.ts` | create |
| `src/components/common/TrickOverlay.vue` | create |
| `src/views/ViceCityView.vue` | create |
| `src/router/index.ts` | edit |
| `src/App.vue` | edit |
| `src/components/background/TvStaticBackground.vue` | edit |
| `src/i18n/locales/es.ts`, `src/i18n/locales/en.ts` | edit |
| `.agents/decisions/009-easter-egg-vicecity.md` | create (al ejecutar) |

`src/style.css` **no se toca**: el usuario autorizo explicitamente los valores literales (2026-09-15), asi que el panel usa `[...]` en lugar de tokens.

### Fuera de alcance (explicito)

- Archivos **core** del harness (`.agents/WORKFLOW.md`, `RULES.md`, `PLANS.md`, `plans/README.md`, `orchestrator/`, `subagents/`, `templates/`, `manifest.json`, `bootstrap/INSTALL.md`, `skills/README.md`): `manifest.json` los declara `core` y `setup.mjs update` los sobrescribe.
- La capa raiz generada (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`): se regeneran; no se editan a mano.
- La libreria `khatarsis`, Lenis/`useSmoothScroll`, `useSectionSpy`, `useReveal`, `useTheme`, `useCrtIntro`, `useStaticFlash`, navbar/drawer, las 4 secciones, `MainView`.
- `vc.mp4`: no se mueve, no se recomprime, no se toca su calidad.
- El "despues" del video: sin definir por el usuario; no se inventa salida.

## Restricciones

- `RULES.md` 0.2 (no borrar), 0.3 (un componente principal por requerimiento), 0.4 (scripts con autorizacion), 0.6 (cero duplicacion), 0.10/0.11 (plan antes de ejecutar, DoD), 0.12 (ADR), 0.13 (codigo en ingles; la documentacion de `.agents/` sigue en español como el resto).
- `CODING_STANDARDS.md` §7: cero margenes; sin `width`/`height` fijos en piezas `flex-*`; `min-w-0` solo justificado; **sin valores arbitrarios `[...]`**; Tailwind-first (`@apply` en CSS); CSS nativo solo si es imposible con Tailwind, documentado.
- `vue/attributes-order` (dinamicos antes de estaticos) y kebab-case en plantilla para todo componente, importado o no.
- Textos visibles: solo por i18n. **El español es la fuente**; el ingles traduce lo que ya existe.
- No tocar Git, no eliminar archivos, no instalar/actualizar dependencias, no cambiar el orden de imports de CSS (ADR-004).

## Decisiones

- **E1 — Disparador en un composable (`useViceCityCode`), no en un componente:** es comportamiento global, no presentacion (mismo criterio que `useStaticFlash` / `useTheme`, que viven en `src/composables/`). Alternativa descartada: componente invisible que monte el listener.
- **E2 — La navegacion la hace el composable** con `useRouter()` (se invoca desde `App.vue`, dentro del contexto del router). El truco es una sola secuencia y partirla obligaria a sincronizar estado entre dos lugares. Registrado en ADR-009.
- **E3 — Se reutiliza la instancia unica de `TvStaticBackground`** con una prop nueva `overlay?: boolean` que cambia la clase de z a `z-50`, en lugar de montar una segunda instancia: evita un segundo contexto WebGL y un segundo loop rAF, y garantiza que el ruido sea el mismo fondo del sitio. La instancia **no** se desmonta en la vista del video.
- **E4 — El panel vive en `TrickOverlay.vue` montado en `App.vue`**, no en la vista nueva: tiene que verse sobre el portafolio y sobrevivir al cambio de ruta, que ocurre en el mismo instante del disparo.
- **E5 — La vista del video es una ruta propia (`/vicecity`)**: unica forma de montarla sin tocar `MainView`. `RouteName` se amplia; `NAV_SECTIONS` y `useSectionSpy` no se tocan (no es una seccion de navegacion).
- **E6 — En la vista del video se ocultan navbar, gradual-blur, glitch-cursor y footer** con `v-if` sobre la ruta. Los dos fondos WebGL y el CRT **no** se tocan: los fondos quedan detras del video (opaco `fixed inset-0`) y el CRT ya esta desmontado cuando el truco se puede disparar, asi que remontarlos solo costaria contextos WebGL.
- **E7 — Valores literales del panel, autorizados por el usuario (2026-09-15):** "te estoy pidiendo explicitamente algo con valores literales, mi palabra esta por encima de cualquier rule". Se usa la sintaxis `[...]` con las medidas y colores exactos de la referencia (`w-[341px] h-[42px]`, `border-[#8ffaf6]`, `bg-[#183135]`, `text-[#afbdbc]`) en lugar de tokens en `@theme`. Es la excepcion que la propia regla §7.5 contempla ("salvo que el usuario lo pida explicitamente") y queda documentada aca y en ADR-009. Consecuencia: `src/style.css` **no** se toca. Los valores son fijos, sin variante dark: el panel solo se ve sobre el ruido.
- **E8 — Cierre del truco:** a los 3 s se apaga `isActive`; panel y ruido desaparecen y el video sigue. Sin `loop`, sin `controls`, sin salida improvisada (respuesta del usuario: la continuacion se conectara despues).
- **E9 — El buffer de teclas ignora lo que nace en un campo de texto** (`input`/`textarea`/`select`/`contenteditable`) y los eventos con `ctrl`/`meta`/`alt`. Cualquier tecla que no sea letra ni `Enter` limpia el buffer.
- **E10 — El panel y el video llevan `aria-hidden`** (o no aportan nombre accesible): son un efecto decorativo, igual que `Crt.vue` y `TvStaticBackground.vue`.
- **E11 — Frente A limitado a los archivos `perRepo`**, con texto en español y terminos tecnicos en ingles (regla 0.13 aplica al codigo, no a la documentacion del harness).

## Cambios por archivo (codigo final propuesto)

### 1. `src/composables/useViceCityCode.ts` (create)

```ts
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const CODE = 'vicecity'
const TRICK_DURATION_MS = 3000

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

export function useViceCityCode() {
  const router = useRouter()
  const isActive = ref(false)

  let buffer = ''
  let timer: number | undefined

  const activate = () => {
    isActive.value = true
    void router.push({ name: 'vicecity' })
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      isActive.value = false
    }, TRICK_DURATION_MS)
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (isActive.value) return
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (isTypingTarget(event.target)) return

    if (event.key === 'Enter') {
      if (buffer === CODE) activate()
      buffer = ''
      return
    }

    buffer = /^[a-z]$/i.test(event.key) ? (buffer + event.key.toLowerCase()).slice(-CODE.length) : ''
  }

  onMounted(() => window.addEventListener('keydown', handleKeydown))

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
    window.clearTimeout(timer)
  })

  return { isActive }
}
```

Notas: el buffer se recorta a `CODE.length`, asi que funciona sin importar que se haya escrito antes; `Enter` limpia el buffer siempre (evita re-disparos accidentales); la guarda `isActive` impide reiniciar la secuencia mientras esta activa. Identificadores y comentarios en ingles (regla 0.13); no lleva comentarios internos porque los nombres alcanzan.

### 2. `src/components/common/TrickOverlay.vue` (create)

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-50" aria-hidden="true">
    <div
      class="absolute top-4 left-4 flex h-[42px] w-[341px] items-center border-4 border-[#8ffaf6] bg-[#183135] px-2 text-2xl font-black text-[#afbdbc]"
    >
      {{ t('trick.unlocked') }}
    </div>
  </div>
</template>
```

Raiz `fixed inset-0 z-50` + panel `absolute` ⇒ el panel queda anclado al viewport (con `top-4 left-4` pedidos) y no al documento. El orden de clases queda en manos de `prettier-plugin-tailwindcss` en `format:check`/`format`.

### 3. `src/views/ViceCityView.vue` (create)

```vue
<script setup lang="ts">
import vcTrailer from '@/assets/trailers/vc.mp4'
</script>

<template>
  <video :src="vcTrailer" autoplay playsinline class="fixed inset-0 size-full object-cover" />
</template>
```

Sin `controls`, sin `loop`, sin `muted` (el sonido es pedido explicito). `autoplay` con sonido es legal porque el gesto del usuario (`keydown`) precede al montaje de la vista. El import de `.mp4` esta tipado por `vite/client` (`tsconfig.app.json` linea 4).

### 4. `src/router/index.ts` (edit)

- Linea 6: `export type RouteName = 'main' | 'projects' | 'contact' | 'vicecity'`.
- Import nuevo junto a los existentes: `import ViceCityView from '@/views/ViceCityView.vue'`.
- En `routes` (linea 58), despues del spread de `projects`/`contact`:

```ts
    {
      path: '/vicecity',
      name: 'vicecity',
      component: ViceCityView,
    },
```

`routesMap` no se toca (es el mapa de secciones con `section`, y el truco no es una seccion).

### 5. `src/components/background/TvStaticBackground.vue` (edit)

- Linea 1: agregar `computed` al import de Vue.
- En `TvStaticBackgroundProps` (junto a `pause`), agregar `overlay?: boolean`.
- En `withDefaults`, agregar `overlay: false`.
- Antes de `onMounted`, agregar el derivado:

```ts
const layerClass = computed(() =>
  props.overlay ? 'z-50' : isFlashVisible.value ? '-z-10' : '-z-30',
)
```

- Linea 347: `:class="isFlashVisible ? '-z-10' : '-z-30'"` → `:class="layerClass"`.

El resto del componente (WebGL, `fps`, `dpr`, `prefersReducedMotion`, limpieza) queda intacto.

### 6. `src/App.vue` (edit)

- Imports: `computed` desde `vue` (linea 2), `useRoute` desde `vue-router`, `TrickOverlay from '@/components/common/TrickOverlay.vue'` y `useViceCityCode from '@/composables/useViceCityCode'`.
- Estado (despues de `showCrt`, lineas 20-24):

```ts
const route = useRoute()
const { isActive: isTrickActive } = useViceCityCode()
const isTrailerView = computed(() => route.name === 'vicecity')
```

- Plantilla 58-69:

```vue
<template>
  <main class="relative isolate min-h-screen">
    <navbar v-if="!isTrailerView" />
    <gradual-blur v-if="!isTrailerView" :z-index="30" position="top" fixed />
    <glitch-cursor v-if="!isTrailerView" />
    <tv-static-background :overlay="isTrickActive" />
    <faulty-terminal-background />
    <router-view />
    <crt v-if="showCrt" @done="handleCrtDone" />
    <footer-section v-if="!isTrailerView" />
    <trick-overlay v-if="isTrickActive" />
  </main>
</template>
```

Posicion critica: `<trick-overlay>` va **despues** de `<tv-static-background>` y de `<router-view>`; como ambos son `z-50` en el mismo contexto de apilamiento (`main isolate`), el que va despues en el DOM pinta encima. Asi el ruido tapa navbar (`z-40`), blur (`z-30`) y video, y el panel tapa el ruido.

### 7. `src/i18n/locales/es.ts` y `en.ts` (edit)

Despues del bloque `contact` (linea 86 en `es.ts`), en los dos archivos y en la misma posicion:

```ts
  trick: {
    unlocked: 'Truco activado',
  },
```

```ts
  trick: {
    unlocked: 'Cheat activated',
  },
```

No hace falta tipar los mensajes (el `createI18n` de `src/i18n/index.ts` no liga `en` contra `es`), pero **los dos archivos deben quedar con la misma forma** o la clave caeria al locale de respaldo.

### 8. `src/style.css` — **NO se toca**

Los colores del panel van como valores literales dentro del componente (§2), autorizados explicitamente por el usuario. Los tokens `@theme` (lineas 165-172) quedan como estan.

### 9. `.agents/decisions/009-easter-egg-vicecity.md` (create, al ejecutar)

Titulo: *Los huevos de pascua se disparan desde un composable global y reutilizan los fondos existentes*. Contexto: la secuencia `vicecity` + `Enter` necesita un listener global, un fondo que tape el contenido y una ruta que no pertenece a la navegacion. Decision: el disparador vive en `useViceCityCode` (que tambien navega), el ruido reutiliza la instancia unica de `TvStaticBackground` en modo `overlay` y la vista del video es una ruta propia sin chrome. Consecuencias: `App.vue` pasa a conocer la ruta activa; el ruido entra en un segundo rol (portada, no solo fondo); los huevos de pascua futuros tienen un patron (composable + overlay en `common/` + ruta propia). Estado `proposed` hasta la verificacion visual.

## Cambios por archivo (documentacion)

### 10. `.agents/AGENTS.md` §1 (reemplazar lineas 13-52)

````markdown
## 1. Perfil Del Proyecto

> Verificado el 2026-09-15 contra `package.json`, `tsconfig*.json`, `eslint.config.mjs` y el arbol real de `src/`.

### Stack

| Tecnologia | Uso |
| --- | --- |
| Vue 3 (Composition API, `<script setup lang="ts">`) | Framework de UI de la SPA |
| TypeScript 5 + `vue-tsc` | Tipado de componentes, composables y datos; corre dentro del build |
| Vite 8 | Dev server, build y manejo de assets |
| Tailwind CSS 4 | Todos los estilos; tokens y variantes en `src/style.css` |
| vue-router 4 | Rutas `/`, `/projects`, `/contact` (resuelven `MainView`) y `/vicecity` |
| vue-i18n 11 | `legacy: false`; `es` es la fuente y `en` la traduccion |
| GSAP + Lenis | Animaciones (reveal, intro CRT) y scroll suave |
| khatarsis (dependencia `file:`) | Libreria local de componentes `k-*`; expone tipos publicos |
| ESLint 9 + Prettier 3 | `lint:check` / `format:check` |
| Gestor de paquetes | **bun** (no usar npm) |

### Estructura Del Proyecto

```text
src/
|-- App.vue                 # Raiz de composicion (navbar, fondos, router-view, footer)
|-- main.ts                 # Entry point (plugins, i18n, router, montaje)
|-- style.css               # Tailwind: @theme, tokens, variante dark, scrollbar
|-- assets/                 # about/, brands/, logo/, trailers/
|-- components/
|   `-- about/ background/ common/ contact/ crt/ cursor/ hero/ layout/ projects/
|-- composables/            # useSmoothScroll, useSectionSpy, useReveal, useTheme, useCrtIntro...
|-- data/                   # portfolio.ts (datos tipados del sitio)
|-- i18n/
|   |-- index.ts
|   `-- locales/            # es.ts (fuente), en.ts (traduccion)
|-- router/index.ts         # Rutas + NAV_SECTIONS
`-- views/                  # MainView.vue y vistas fuera de la navegacion
vite.config.ts              # Raiz del proyecto (Vite + vue + tailwindcss)
```

Nota `khatarsis`: dependencia local (`file:`, symlink a `../khatarsis/packages/khatarsis`), prefijo `k-*`. **Expone tipos publicos** (`"types": "./dist/public/types/public.d.ts"` en su `package.json`), asi que el shim `src/khatarsis.d.ts` se elimino: los componentes se consumen con import nombrado (ej. `import { Drawer } from 'khatarsis'`) y `vue-tsc` valida props y slots. El paquete **no** declara `GlobalComponents`, asi que en plantilla un componente de la libreria se escribe en kebab-case.

### Scripts Reales Del Proyecto

> Declarados en `package.json`. Gestor: **bun**. No existe script de test ni suite de tests.

| Proposito | Comando |
| --- | --- |
| Dev server | `bun run dev` |
| Build (typecheck + bundle) | `bun run build` (`vue-tsc -b && vite build`) |
| Preview del build | `bun run preview` |
| Lint (reporta) | `bun run lint:check` (`eslint .`) |
| Lint (aplica fixes) | `bun run lint` (`eslint . --fix`) |
| Formato (reporta) | `bun run format:check` (`prettier --check .`) |
| Formato (aplica) | `bun run format` (`prettier --write .`) |
````

### 11. `.agents/CODING_STANDARDS.md`

- **§1 (11-22)** → orden real de bloques de un SFC y layout de carpetas:

````markdown
## 1. Estructura De Archivos

Orden de bloques dentro de un SFC (`.vue`):

1. `<script setup lang="ts">`: imports → tipos (`interface XProps`) → `defineProps` + `withDefaults` y `defineEmits` → estado (`ref`) → derivados (`computed`) → efectos (`watch`, `onMounted`, `onBeforeUnmount`) → handlers (`handle*`).
2. `<template>`: componentes siempre en kebab-case (importados incluidos).
3. `<style scoped>` solo cuando Tailwind no alcance, documentando la excepcion.

Layout de carpetas:

- `src/components/<dominio>/` — un archivo por componente; el dominio es la seccion o el tipo de pieza (`layout`, `common`, `background`).
- `src/composables/` — comportamiento reutilizable; un archivo por composable, prefijo `use`.
- `src/data/` — datos tipados del sitio.
- `src/views/` — lo que monta el router.

Reglas:

- Una responsabilidad por archivo.
- PascalCase para archivos de componente, `useCamelCase.ts` para composables.
````

- **§2 (24-37)** → tabla con la convencion real (archivos en PascalCase/`useX.ts`, hooks `use*`, keys i18n en camelCase jerarquico, constantes `UPPER_SNAKE`, booleanos `is/has/can`, handlers `handle*`).
- **§3 (45-51)** → contratos del frontend:

````markdown
## 3. Contratos Y Datos

- Todo componente declara `interface XProps` y `withDefaults(defineProps<XProps>(), {...})`; los eventos, `defineEmits<{ done: [] }>()`.
- Los datos del sitio viven en `src/data/` tipados; las listas de navegacion (`NAV_SECTIONS`) son `as const` y exportan sus tipos.
- Los textos visibles no son datos: viven en `src/i18n/locales/`. El español es la fuente y el ingles traduce lo que ya existe.
- No duplicar contratos ni listas: si una pieza se comparte, se extrae a `src/composables/` o `src/components/common/`.
````

- **§4 (52-57)** → "Errores y fallos" del frontend (sin API propia: no aplican codigos de error de servicio; prohibido `console.log` de debug; los fallos de APIs del navegador o de librerias se manejan con `try/catch` y degradacion explicita, como el `catch` de WebGL de `TvStaticBackground.vue`).
- **§5 (58-67)** → testing real: no hay script `test` ni suite; la verificacion es `lint:check`, `format:check`, `build` (con autorizacion, regla 0.4) y revision visual en pantalla; el DoD no se cumple con "deberia funcionar".
- **§8 (84-95)** → agregar la fila de verificacion/testing y actualizar el pie: `**Ultima actualizacion:** Septiembre 2026` / `**Version:** 1.3 (perfil real + verificacion sin suite)`.

### 12. `.agents/DESIGN.md`

- **§1 (11-22)** → arquitectura real:

````markdown
## 1. Arquitectura

SPA Vue 3 sin backend: el sitio es un bundle estatico.

```text
index.html
`-- src/main.ts        # createApp: icono global, plugin khatarsis, i18n, router, tema, montaje
    `-- src/App.vue    # raiz de composicion por capas (z-index):
        navbar (z-40) → gradual-blur (z-30) → glitch-cursor → fondos WebGL (-z-30)
        → router-view → crt (intro) → footer → overlays (z-50)
```

- **Rutas:** `/`, `/projects` y `/contact` resuelven `MainView` (composicion de las 4 secciones); la navegacion por secciones usa `NAV_SECTIONS` (`src/router/index.ts`) con scroll suave propio (Lenis + GSAP, ADR-001). Las vistas fuera de la navegacion (ej. `/vicecity`) no entran en `NAV_SECTIONS`.
- **Estado transversal:** composables, con estado de modulo cuando lo comparten varios componentes (`useStaticFlash`, `useTheme`, `useSectionSpy`, `useReveal`, `useCrtIntro`) y estado local cuando hay un solo consumidor.
- **Presentacion:** componentes por dominio en `src/components/<dominio>/`, compartidos en `common/`, fondos animados en `background/`.
- **Contenido:** `src/data/` para datos, `src/i18n/locales/` para textos (ES fuente, EN traduccion).
- **UI:** `khatarsis` aporta los `k-*`; el portafolio es responsable de los puentes que la libreria no cubre (ADR-004 y ADR-008).
- Las decisiones vigentes estan en `.agents/decisions/` (ADR-001…009) y son la referencia obligada antes de proponer cambios de arquitectura.
````

- **§2 (23-29)** → contratos de componentes (props/slots/emits, i18n, tipado de assets con `vite/client`).
- **§3 (30-37)** → rendimiento real: fondos WebGL con `fps` y `dpr` acotados (`prefersReducedMotion` respetado en `TvStaticBackground`); bundle medido el 2026-09-13 (`index-*.js` 1.03 MB, `index-*.css` 437 kB, `logo_khatarsis-*.svg` 578 kB, `dist/` total 2.3 MB) y el video de 128 MB de `src/assets/trailers/vc.mp4` como el activo mas pesado; medir antes de optimizar y no copiar numeros sin benchmark.
- **§4 (38-46)** → seguridad en frontend: sin secretos en el bundle ni en el repo (se elimino `opencode.json` el 2026-09-15); nada de claves en el codigo; no hay entrada de usuario que validar hoy; los enlaces externos usan `rel="noopener"`.
- **§5 (47-53)** → entornos reales: `dev` (Vite), `build`/`preview` con bun; no hay backend, staging ni migraciones en este repo; la verificacion no usa scripts automaticos (regla 0.4).
- **§6 (54-fin)** → decisiones: `.agents/plans/` registra la ejecucion, `.agents/decisions/` registra el porque; pie actualizado a Septiembre 2026 / version 1.1 (arquitectura real del portafolio).

## Steps

1. **read** `src/App.vue`, `src/router/index.ts`, `src/components/background/TvStaticBackground.vue`, `src/i18n/locales/es.ts`, `src/i18n/locales/en.ts` y `src/style.css` (confirmar que las anclas de este plan siguen vigentes antes de editar).
2. **create** `src/composables/useViceCityCode.ts` (§1).
3. **create** `src/components/common/TrickOverlay.vue` (§2).
4. **create** `src/views/ViceCityView.vue` (§3).
5. **edit** `src/router/index.ts`: `RouteName`, import de la vista y la ruta nueva (§4).
6. **edit** `src/components/background/TvStaticBackground.vue`: prop `overlay`, `computed` y clase (§5).
7. **edit** `src/App.vue`: imports, estado, plantilla (§6).
8. **edit** `src/i18n/locales/es.ts` y `en.ts`: bloque `trick` (§7).
9. ~~edit `src/style.css`~~ — descartado: el panel usa valores literales (§8).
10. **create** `.agents/decisions/009-easter-egg-vicecity.md` (§9).
11. **edit** `.agents/AGENTS.md` §1 (§10).
12. **edit** `.agents/CODING_STANDARDS.md` §1-§5, §8 y pie (§11).
13. **edit** `.agents/DESIGN.md` §1-§6 y pie (§12).
14. **Verificacion** (seccion siguiente) y, con el resultado, `status: EXECUTED` + registro de ejecucion.

## Verificacion

- **Autorizacion requerida (regla 0.4):** `bun run lint:check`, `bun run format:check`, `bun run build`. Nada se ejecuta sin que el usuario lo autorice.
- **`build` hoy esta bloqueado por la libreria:** `khatarsis` regenero su build publico el 2026-09-15 15:26 **sin** `dist/public/types/`, mientras su `package.json` declara `"types": "./dist/public/types/public.d.ts"`. Consecuencia esperada si no cambia: `TS2307: Cannot find module 'khatarsis'` en `main.ts`, `Navbar.vue`, `TvStaticBackground.vue` y `FaultyTerminalBackground.vue` (los dos ultimos no se tocan en este plan). Se reporta con esa causa exacta y **no** se toca ninguna config para sortearlo.
- **`lint:check`:** debe quedar en 0 problemas. Puntos a vigilar: kebab-case en plantilla (`<trick-overlay>`), orden de atributos en `<video>` (dinamicos antes de estaticos) y las clases nuevas con valores literales (`[...]`) contra `eslint-plugin-better-tailwindcss`. Si ese plugin rechazara `[...]`, se reporta (la autorizacion del usuario prima y no se cambia a tokens sin pedir OK).
- **`format:check`:** `.agents` esta en `.prettierignore`, asi que los documentos del Frente A no entran; los 8 archivos de codigo si, con el orden de clases que impone `prettier-plugin-tailwindcss`. Si algo queda desordenado, se ajusta a mano (los fixers requieren autorizacion aparte).
- **`node scripts/verify.mjs`** (opcional, autorizacion aparte): health check del harness tras tocar `.agents/`; valida frontmatter/estados de planes y ADR. No edita nada.
- **Manual (navegador):**
  1. Escribir `vicecity` + `Enter` con la pagina en ES y en EN: panel con el texto en el idioma correcto y ruido cubriendo todo el contenido.
  2. El panel respeta `top-4 left-4` y las medidas/colores de la referencia.
  3. La vista del video carga en el mismo instante: ocupa el viewport, sin controles y **con sonido**; no se ve navbar, footer, blur ni cursor.
  4. A los ~3 s desaparecen panel y ruido; el video sigue solo.
  5. Al terminar el video no pasa nada.
  6. Secuencia mal tipeada, sin `Enter`, o con `ctrl`/`meta`/`alt` presionado: no dispara nada.
  7. Antes/despues del truco, el navbar y el resto del sitio siguen funcionando igual.

## Riesgos

- **R1 — `z` del ruido vs drawer de khatarsis:** `z-50` empata con el drawer (teleportado al `body`, posterior en el DOM). Con el drawer abierto al disparar el truco, podria pintar por encima del ruido. Sin mitigacion en este plan; se documenta en ADR-009.
- **R2 — Autoplay con sonido:** el navegador podria rechazarlo pese al gesto previo. Escalada (requiere OK del usuario): reintentar `play()` y reportar; **no** mutear en silencio.
- **R3 — Peso del video:** 128 MB en `src/assets` se copian a `dist/` en cada build y viven en el repo. Con red lenta, los 3 s de ruido pueden terminar antes de que el video tenga datos (quedaria un frame negro). Fuera de alcance: moverlo a `public/`, recomprimir, bajar resolucion.
- **R4 — Medidas del panel: resuelto por autorizacion explicita del usuario.** Se usan los valores literales medidos (`w-[341px] h-[42px]`, colores hex exactos), asi que no hay margen entre la referencia y el resultado. Si `eslint-plugin-better-tailwindcss` o el formateador rechazaran la sintaxis `[...]`, se reporta en la verificacion (no se cambia a tokens sin pedir OK).
- **R5 — Sin salida de la vista del video:** hoy no hay forma de volver salvo la URL. Es el comportamiento acordado (la continuacion se conecta despues); queda como pendiente consciente.
- **R6 — Ediciones que el harness pisaria:** todo el Frente A se limita a los 3 archivos `perRepo`; un archivo `core` editado a mano se pierde en el proximo `update`.
- **R7 — `prefers-reduced-motion`:** los fondos WebGL lo respetan, pero la secuencia del truco y el video no lo consultan (pedido explicito del usuario). Queda documentado como decision consciente en ADR-009.
- **R8 — Re-disparo:** la guarda `isActive` evita reiniciar la secuencia durante los 3 s; fuera de esa ventana, escribirla de nuevo vuelve a dispararla (incluido estando ya en `/vicecity`, donde el `push` a la misma ruta es un no-op).

## Pendientes y observaciones reportadas (fuera de alcance)

- **Build bloqueado por `khatarsis`** (falta `dist/public/types/`): ningun plan de este repo puede validar tipos hasta que la libreria lo publique.
- **Tailwind escanea `.agents/**`:** el bundle ya emitido contiene clases muertas que solo existen en los planes (ej. `.xs\:relative`). Se acota con `@source`/`@source not` en `src/style.css`; cambio aparte.
- **`--breakpoint-xs` vale `28rem` (448px)**, no los `20rem` que quedo escrito en un plan anterior.
- **Dos planes anteriores siguen en `EXECUTED`** esperando revision visual (`portfolio-navbar-icons-scroll-blur-xs`, `portfolio-vite-navbar-xs-blur-i18n`), con ADR-003/004/005/006 en `proposed`.
- **`app.use(khatarsis)`** en `main.ts` no aporta configuracion (objeto vacio); limpieza aparte.

## Registro de ejecucion (2026-09-15 16:50)

Ejecutado con la compuerta **"ejecuta el plan"** del usuario, que ademas autorizo explicitamente los valores literales ("te estoy pidiendo explicitamente algo con valores literales, mi palabra esta por encima de cualquier rule"), asi que el plan paso `ENRICHED -> READY -> EXECUTED` con el panel en `w-[341px] h-[42px]` y colores hex.

### Archivos tocados

| Archivo | Cambio real |
| --- | --- |
| `src/composables/useViceCityCode.ts` | **nuevo**: listener global de `keydown`, buffer de 8 letras con `Enter`, guarda contra campos de texto y modificadores, `router.push` + ventana de 3 s, limpieza en `onBeforeUnmount` |
| `src/components/common/TrickOverlay.vue` | **nuevo**: raiz `fixed inset-0 z-50 pointer-events-none` + panel `absolute top-4 left-4 h-[42px] w-[341px] border-4 border-[#8ffaf6] bg-[#183135] px-2 text-2xl font-black text-[#afbdbc]` |
| `src/views/ViceCityView.vue` | **nuevo**: `<video>` `fixed inset-0 size-full object-cover` con `autoplay playsinline`, sin controles ni loop, con el `.mp4` importado |
| `src/router/index.ts` | `RouteName` + `'vicecity'`, import de la vista y ruta `/vicecity` |
| `src/components/background/TvStaticBackground.vue` | prop `overlay` (default `false`) + `computed layerClass` (`z-50` / `-z-10` / `-z-30`); template usa `:class="layerClass"` |
| `src/App.vue` | `useRoute`, `useViceCityCode`, `isTrailerView`; navbar, gradual-blur, glitch-cursor y footer con `v-if="!isTrailerView"`; `:overlay="isTrickActive"` en el ruido; `<trick-overlay v-if="isTrickActive" />` al final del `main` |
| `src/i18n/locales/es.ts` / `en.ts` | bloque `trick.unlocked` ('Truco activado' / 'Cheat activated') |
| `.agents/decisions/009-easter-egg-vicecity.md` | **nuevo**, `proposed` |
| `.agents/AGENTS.md` | §1 reescrito: tabla de stack real, estructura real (incluye `views/` y `vite.config.ts` en la raiz), los 7 scripts, nota de `khatarsis` con tipos publicos |
| `.agents/CODING_STANDARDS.md` | §1-§5 adaptados al stack real, §8 con fila de verificacion, version 1.3 |
| `.agents/DESIGN.md` | §1-§6 con la arquitectura real (capas de `App.vue`, rutas, composables, i18n, khatarsis, ADR-001…009), version 1.1 |

`src/style.css` **no** se toco, como quedo en el plan tras la autorizacion de valores literales.

### Desvios y correcciones durante la ejecucion

- No hubo desvios de alcance. Tres correcciones de forma necesarias para que la verificacion fuera util:
  - `useViceCityCode.ts`: reflow de una linea larga que `prettier` rechazaba (>100 columnas).
  - `ViceCityView.vue`: `class` antes de `autoplay playsinline` (`vue/attributes-order` clasifica los booleanos como `ATTR_SHORTHAND_BOOL`, que va despues de los estaticos).
  - `NavControls.vue` (archivo del plan `portfolio-navbar-drawer-sm-i18n`): `:for` antes de `class` en el `<label>`. **Era un error preexistente que nunca se habia detectado** porque en la verificacion de aquel plan ESLint abortaba antes de llegar al archivo (el plugin de Tailwind no resolvia `khatarsis/style.css`). Ahora que resuelve, salio a la luz con el resto del lint. Una linea, sin cambio de comportamiento.

### Verificacion

- **`bun run lint:check` -> 0 problemas.** Incluye las dos correcciones anteriores.
- **`bun run format:check` -> "All matched files use Prettier code style!"**
- **`bun run build` -> BLOQUEADO por la libreria (fallo externo, ajeno a este plan).** `vue-tsc -b` falla con 4 veces `TS7016: Could not find a declaration file for module 'khatarsis'` en `main.ts(1,74)`, `Navbar.vue(5,24)`, `TvStaticBackground.vue(11,8)` y `FaultyTerminalBackground.vue(16,8)`. Los cuatro son imports de la libreria; **ninguno** es de los archivos nuevos/creados en este plan. Causa: el build publico de `khatarsis` (2026-09-15 15:26) no incluye `dist/public/types/`, mientras su `package.json` declara `"types": "./dist/public/types/public.d.ts"`. No se toco ninguna configuracion para sortearlo.
- **`bunx vite build` (bundle sin typecheck) -> OK.** 116 modulos transformados (antes 108), el video emitido como `dist/assets/vc-CD-C-Suf.mp4` (134.100,31 kB), `index-*.js` 1.037,83 kB y `index-*.css` 402,36 kB. Prueba que el codigo nuevo compila y que el asset del video entra al bundle.
- **Revision visual: PENDIENTE (usuario).** No se autorizo `bun run dev`; la secuencia completa del truco solo se puede confirmar en pantalla.

### Revision pendiente

- Escribir `vicecity` + `Enter` en ES y EN, tapado del contenido por el ruido, salto al video con sonido, apagado a los 3 s, y que la vista del video no muestre chrome.
- Cuando `khatarsis` publique `dist/public/types/`, re-ejecutar `bun run build` para cerrar el typecheck completo (incluidos los archivos nuevos de este plan).

## Cierre (memoria persistente)

> Pendiente. Se completa al cerrar el plan (DoD de `.agents/WORKFLOW.md`); hoy falta la revision visual del truco y el typecheck bloqueado por la libreria.

- Que cambio: Frente A = `.agents/AGENTS.md` §1, `CODING_STANDARDS.md` (§1-§5, §8) y `DESIGN.md` (§1-§6) reescritos con el stack, la estructura, los scripts y la arquitectura reales. Frente B = huevo de pascua `vicecity`: composable de teclado (`useViceCityCode`), panel (`TrickOverlay.vue`), vista con el video (`ViceCityView.vue`), ruta `/vicecity`, prop `overlay` en `TvStaticBackground`, composicion en `App.vue`, claves `trick.unlocked` y ADR-009.
- Verificacion: `lint:check` 0 problemas; `format:check` OK; `bun run build` bloqueado por `khatarsis` (TS7016 en 4 archivos preexistentes); `vite build` OK con el video en el bundle; revision visual pendiente del usuario.
- Resultado: pendiente (esperando revision visual).
- Pendientes: revision visual del truco; re-ejecutar `build` cuando la libreria publique tipos; `z-50` del ruido vs drawer abierto (R1); autoplay con sonido (R2); peso del video (R3); sin salida de la vista del video (R5).
