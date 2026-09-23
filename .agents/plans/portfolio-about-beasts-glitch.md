---
name: portfolio-about-beasts-glitch
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-21 22:00
enriched: 2026-09-22 10:50
ready: 2026-09-22 11:05
executed: 2026-09-22 11:20
---

## Plan Tecnico: Rocco y Rugal en GlitchText + foto del About con glitch y fade

> Enriquecido el 2026-09-22 sobre la compuerta explicita **"enriquece el plan"**. El enrichment **no** implementa codigo: los pasos quedan listos para revision del orquestador (`READY`) y la compuerta **"ejecuta el plan"**.
> Alcance ampliado por el usuario en la misma orden: la imagen izquierda de About (hoy `portrait.svg`, "la imagen morada") se reemplaza por una foto de `src/assets/me/`, cuya eleccion queda **pendiente** (D1: `1.jpeg` o `2.jpeg`, el usuario decide al ejecutar).

### Analisis

- **Objetivo**: en el parrafo 4 de About (`about.body[3]`), los nombres `Rocco` y `Rugal` pasan a `GlitchText` con glitch al hover; mientras el hover esta activo, la imagen izquierda de About hace fade desde la foto base hacia la foto de ese perro (`beasts/rocco.jpg` / `beasts/rugal.jpg`); al salir, vuelve a la base. Las fotos de las bestias se ven **siempre** con glitch estilo `mgGlitch` (slices + desfase RGB + jitter + blend).
- **Scope**:
  - `src/components/about/AboutSection.vue` — parrafo 4 compuesto con los nombres + estado del hover + swap de la imagen izquierda.
  - `src/components/about/BeastImage.vue` — **nuevo componente principal** (RULES 0.3): base + capa bestia con fade + capas glitch.
  - `src/components/hero/GlitchText.vue` — **solo** se le agregan dos emits aditivos (senal de hover).
  - `src/data/portfolio.ts` — datos tipados de las mascotas (clave, loader diferido, clave i18n del `alt`).
  - `src/i18n/locales/es.ts` + `en.ts` — se parte el parrafo 4 en segmentos y se agregan los `alt`.
  - Assets: foto base elegida de `src/assets/me/`; bestias `src/assets/beasts/`.
- **Archivos y anclas verificadas el 2026-09-22**:
  - `AboutSection.vue:9` `import portrait from '@/assets/about/portrait.svg'`; `:11-13` `paragraphs = computed(() => tm('about.body') as string[])`; `:16` `useReveal(root)`; `:29` fila `data-reveal` que contiene la imagen + los parrafos; `:31-39` `k-image` izquierda (`:src="portrait"` `:alt="t('about.photoAlt')"` `fit="cover"` `hover="none"` `lazy`, clases `max-h-137.5 w-full overflow-hidden rounded-2xl md:max-h-none md:w-72`).
  - `GlitchText.vue:5-7` props `text` + `hoverOnly`; **sin `defineEmits`**; `:43-53` `handlePointerEnter`/`handlePointerLeave`; `:63` corte por `prefersReducedMotion()`; `:286-291` media `reduce` que ya apaga las animaciones.
  - Usos actuales de `GlitchText` (los emits deben ser **aditivos**): `Navbar.vue:9,65,96` (con `hover-only`) y `HeroSection.vue:8,85`.
  - `es.ts:32-41` / `en.ts:32-41`: `about.body` con **4 items** (el 4 inicia `Fuera del ambito de software...` / `Outside software...`) y `about.photoAlt`.
  - `src/data/portfolio.ts:1-4` ya **importa assets** de `src/assets/` (precedente para datos con imagen).
  - Assets reales: `src/assets/me/1.jpeg` **189.783 B**, `src/assets/me/2.jpeg` **151.981 B** (ambos JPEG progresivos, sin elegir); `src/assets/beasts/rocco.jpg` **878.556 B**, `rugal.jpg` **1.798.456 B** (este ultimo con EXIF `width=3264`: revisar orientacion al ejecutar); `src/assets/about/portrait.svg` 6.257 B (queda sin uso).
  - Herramientas locales: `ffmpeg` disponible, `cwebp`/`magick`/`sharp` **no** (`convert` de Git Bash no se usa: puede resolver al `convert.exe` de Windows).
- **Riesgos**:
  - R1: 2,8 MB de JPG (878 KB + 1,8 MB + 151-190 KB) si se importan estaticamente y About es parte de la entrada → golpe al arranque medido en `DESIGN.md` §3.
  - R2: glitch "aleatorio" con `setTimeout` de 10-300 ms (como `mgGlitch`) pone trabajo de main thread sobre una seccion siempre montada.
  - R3: `GlitchText` es compartido por `Navbar` y `Hero`: cualquier cambio de contrato puede romperlos.
  - R4: ADR-006 — nada con `backdrop-filter` puede animar `opacity`. La fila de la imagen tiene `data-reveal` (reveal por `opacity`), asi que las capas nuevas **no** deben usar `backdrop-filter` (no lo usan) y la regla queda escrita.
  - R5: partir el parrafo en segmentos puede romper el espaciado tipografico entre texto y nombres en ES/EN.
  - R6: `rugal.jpg` con EXIF: si la orientacion no es 1, la foto puede verse girada.
  - R7: CODING_STANDARDS §7 (cero margenes, sin `[...]`, sin `width/height` fijos mezclados con medidas flex): las clases de la imagen se conservan **identicas** a las de hoy para no mover el layout.
- **Decisiones abiertas**:
  - **D1 (bloquea 1 paso, la decide el usuario)**: cual foto de `src/assets/me/` es la base de About (`1.jpeg` 189.783 B o `2.jpeg` 151.981 B). El plan deja la importacion en una sola linea para que el cambio sea de un renglon.
  - **D2 (opcional, la decide el usuario)**: dejar los JPG originales o reconvertirlos a WebP (`ffmpeg` esta disponible; precedente en el repo: `src/assets/brands/arqbs-logo-color.webp`). Por defecto: **originales**, sin tocar los bytes que trajiste.
  - **D3 (requiere aprobacion 0.2)**: `src/assets/about/portrait.svg` quedaria sin uso. Por defecto: **conservar** (precedente: `BlackWallAnimation.vue` se conservo por RULES 0.2) y reportarlo.

### Cambios

- `src/i18n/locales/es.ts` / `en.ts` — **edit**: `about.body` pasa de 4 a **3** items (se retira el parrafo de los perros para no duplicar texto) y se agrega `about.pets = { lead, and, tail, roccoAlt, rugalAlt }`. `lead`/`tail` son el parrafo partido alrededor de la lista de nombres; `and` es el separador con su espacio (` y ` / ` and `); los `alt` describen cada foto. `about.photoAlt` se **reutiliza** para la foto base (ya existe, sigue siendo un retrato de César).
- `src/data/portfolio.ts` — **edit**: tipos y datos de las mascotas:
  ```
  export type PetKey = 'rocco' | 'rugal'
  export interface Pet {
    key: PetKey
    photoAltKey: 'about.pets.roccoAlt' | 'about.pets.rugalAlt'
    loadPhoto: () => Promise<{ default: string }>
  }
  export const pets: Pet[]
  ```
  `loadPhoto` es un `import()` **diferido** del JPG (ADR-011: lo que no es la entrada entra por import dinamico, precedente `MapCard.vue` con Leaflet). Los nombres `Rocco`/`Rugal` en la plantilla son **nombres propios** (excepcion documentada de RULES 0.13) y por eso no se duplican en los datos.
- `src/components/hero/GlitchText.vue` — **edit minimo**: `defineEmits<{ hoverStart: []; hoverEnd: [] }>()` y se emiten en `handlePointerEnter` / `handlePointerLeave` (en ambos modos; hoy nadie los escucha, asi que es aditivo y compatible con `Navbar`/`Hero`).
- `src/components/about/BeastImage.vue` — **create** (componente principal del requerimiento):
  - `interface BeastImageProps { photo: string; photoAlt: string; activePet: PetKey | null }` + `withDefaults`.
  - Capa base: la foto elegida de `src/assets/me/` con las **mismas clases** que la `k-image` de hoy (`fit="cover"` `hover="none"` `lazy`).
  - Capa bestia: `absolute inset-0` con `k-image` de la foto activa, `transition-opacity duration-700` (utilidades estandar), visible solo cuando `activePet` no es `null` y la foto ya resolvio. La base se mantiene visible hasta que el JPG diferido resuelve (sin frame en blanco).
  - Glitch permanente de las bestias: 2 capas extra con `clip-path: inset(...)`, `translate`/`scale` y `mix-blend-mode` (estetica `mgGlitch`). CSS nativo **solo** en `@keyframes`/`clip-path`/`mix-blend-mode` (excepcion de CODING_STANDARDS §7.6, documentada en el `<style scoped>`); el "aleatorio" se logra con `--glitch-delay-*` / `--glitch-duration-*` sorteadas **una vez** al montar (sin timers, sin trabajo de main thread).
  - `prefers-reduced-motion`: sin glitch y swap por opacidad simple (precedente `GlitchText.vue:286`).
- `src/components/about/AboutSection.vue` — **edit**: `import aboutPhoto from '@/assets/me/1.jpeg'` (linea unica sujeta a D1); `const hoveredPet = ref<PetKey | null>(null)` + `handlePetEnter(key)`/`handlePetLeave(key)`; el `v-for` de parrafos pasa a los 3 items de `about.body`; parrafo 4 compuesto por `about.pets.lead` + `glitch-text` (`hover-only`) de `Rocco` + `about.pets.and` + `glitch-text` de `Rugal` + `about.pets.tail`; la `k-image` izquierda se reemplaza por `<beast-image :photo="aboutPhoto" :photo-alt="t('about.photoAlt')" :active-pet="hoveredPet" />`.

### Restricciones

- RULES 0.1-0.13 (sin Git, sin borrar sin aprobacion, **un** componente principal, scripts solo con permiso, cero duplicacion, sin secretos, plan antes de ejecutar, DoD antes de CLOSED, ADR solo si hay decision de arquitectura, codigo 100% en ingles).
- CODING_STANDARDS: orden del SFC, `handle*`/`is*`, contratos tipados, sin `console.log`, Tailwind-first (`@apply`), cero margenes, sin `[...]` salvo que se pida, `<style>` solo para lo que Tailwind no alcanza.
- DESIGN: la entrada no crece con lo que no es la entrada (bestias por `import()` diferido); no empeorar el arranque medido; los assets se importan desde `src/assets/`; ADR-006 (nada de `opacity` sobre `backdrop-filter`); ADR-011 (diferido por defecto).
- i18n: el espanol es la fuente y el ingles traduce con la misma forma; los nombres propios no se traducen.
- Fuera de alcance: tocar `khatarsis`, otras secciones, `v-effect` (directiva sin registro en el build instalado), y cualquier cambio de layout fuera de la imagen del About.

### Steps

1. read `src/components/about/AboutSection.vue`, `src/components/hero/GlitchText.vue`, `src/i18n/locales/es.ts`, `src/i18n/locales/en.ts`, `src/data/portfolio.ts` (confirmar anclas antes de editar).
2. edit `src/i18n/locales/es.ts` y `src/i18n/locales/en.ts`: 3 items en `about.body` + bloque `about.pets` (`lead`, `and`, `tail`, `roccoAlt`, `rugalAlt`).
3. edit `src/data/portfolio.ts`: `PetKey`, `Pet` y `pets` con `loadPhoto` diferido.
4. edit `src/components/hero/GlitchText.vue`: emits `hoverStart`/`hoverEnd` aditivos.
5. create `src/components/about/BeastImage.vue`: base + capa bestia con fade + capas glitch (CSS-only, aleatorio al montar, respetando `prefers-reduced-motion`).
6. edit `src/components/about/AboutSection.vue`: import de la foto base (D1), estado `hoveredPet`, parrafo 4 compuesto y swap de la imagen.
7. **D1**: confirmar con el usuario `1.jpeg` o `2.jpeg` y dejar la linea definitiva (si cambia de opinion despues, es un renglon).
8. **D2/D3 (opcionales, requieren OK)**: reconvertir a WebP con `ffmpeg`, o borrar `portrait.svg` si queda sin uso.
9. Verificacion (seccion siguiente) con autorizacion de scripts; dejar el plan `EXECUTED` y cerrar con DoD + memoria.

### Alternativas consideradas

- **Importar las bestias de forma estatica**: mas simple, pero mete 2,7 MB en el grafo de la seccion que ya esta en la entrada (R1). Descartado a favor del `import()` diferido.
- **Prefetch en idle de las dos fotos** (patron de `App.vue` con el shell del juego): primer hover instantaneo, pero descarga 2,7 MB aunque nadie haga hover. Queda como ajuste de 3 lineas si el primer hover se siente lento.
- **Glitch con timers JS de 10-300 ms (cadencia exacta de `mgGlitch`)**: fiel al original, pero con timers de main thread en una seccion siempre montada (R2). Por defecto se usa CSS con aleatoriedad fijada al montar.
- **`v-html` con HTML incrustado en el texto i18n**: prohibido por la regla de no inyectar markup en datos y por accesibilidad; descartado.
- **Mover `GlitchText` a `common/`**: ya lo consumen `hero` y `layout`; moverlo no aporta y amplia el diff; descartado.
- **Componente nuevo para cada nombre**: dos componentes para dos spans; viola el espiritu de 0.3 y duplica; descartado.

### Verificacion

- Autorizada solo con permiso (0.4): `bun run lint:check`, `bun run format:check`, `bun run build` (`vue-tsc -b && vite build`). Sin permiso, reportar pendiente con el motivo exacto.
- Medir despues del build: peso del chunk de entrada y confirmar que `rocco.jpg`/`rugal.jpg` salen como **assets diferidos** (no en el grafo inicial).
- Manual en navegador (ES y EN): hover `Rocco` -> foto de Rocco con fade; hover `Rugal` -> foto de Rugal; sin hover -> foto base de `src/assets/me/`; glitch visible y continuo en las bestias; con `prefers-reduced-motion` no hay glitch; el resto de About queda intacto; sin salto de layout.
- Higiene: sin secretos, sin `console.log`, sin duplicacion, sin cambios fuera del plan, sin `[...]` nuevos.

### Apendice: plan original (PENDING, 2026-09-21 22:00)

> Se conserva como memoria del pedido inicial (RULES 0.10: los planes no se vacian).

- **Objetivo**: el texto `Rocco y Rugal` del parrafo 3 de About (`about.body[2]`) se vuelve `GlitchText` con glitch al hover; al hacer hover en cada nombre, la imagen izquierda (hoy `portrait.svg`) se reemplaza con la foto (`beasts/rocco.jpg` / `beasts/rugal.jpg`) con fade y al salir vuelve al portrait; las fotos de las bestias llevan siempre efecto glitch estilo `mgGlitch` (slices + desfase RGB + jitter de escala + blend, temporizado aleatorio), adaptado a Vue sin jQuery.
- **Alcance**: `AboutSection.vue`, `GlitchText.vue`, `es.ts`/`en.ts`, assets verificados (`beasts/rocco.jpg`, `rugal.jpg`, `about/portrait.svg`), nuevo componente principal `BeastImage.vue`. Referencia del usuario: `mgGlitch` (jQuery, `glitch-img`, `background-size: cover`, opciones `glitch/scale/blend hue`, tiempos aleatorios 10-300 ms): solo la estetica sirve de referencia, nada de jQuery ni URLs externas.
- **Nota de correccion del enrichment**: el pedido original decia "parrafo 3 (`about.body[2]`)"; el parrafo de los perros es el **cuarto** (`about.body[3]`, indice 3). El plan enriquecido apunta al correcto.

## Registro De Ejecucion (2026-09-22 11:35)

> Ejecutado sobre la orden explicita del usuario ("ve ejecutando lo del plan"), que aprueba el enriquecido y habilita `READY -> EXECUTED` / `ENRICHED -> READY`. Sin Git en ningun momento.

### Archivos tocados (4 editados + 1 nuevo)

| Archivo | Cambio real |
| --- | --- |
| `src/components/about/BeastImage.vue` | **Nuevo** (componente principal): base `k-image` + overlay con fade (`transition-opacity duration-700`) + 2 capas glitch (`clip-path` + `translate3d` + `mix-blend-mode: screen` + `hue-rotate`), `steps(1, end)` para el salto discreto estilo mgGlitch, aleatoriedad sorteada **una vez** al montar (sin timers), `prefers-reduced-motion` apaga el glitch; las fotos de las bestias entran por `import()` diferido |
| `src/components/about/AboutSection.vue` | `hoveredPet` + `handlePetEnter`/`handlePetLeave`; parrafo de los perros compuesto por segmentos i18n + 2 `GlitchText`; la `k-image` izquierda pasa a `<beast-image>` dentro de un wrapper `relative` que ahora posee `rounded-2xl`/`overflow-hidden` y el ancho |
| `src/components/hero/GlitchText.vue` | Emits **aditivos** `hoverStart`/`hoverEnd` (Navbar y Hero siguen intactos) |
| `src/data/portfolio.ts` | `PetKey`, `Pet` (`photoAltKey` + `loadPhoto` diferido) y `pets` |
| `src/i18n/locales/es.ts` / `en.ts` | `about.body` de 4 -> **3** items; nuevo `about.pets` (`lead`, `and`, `tail`, `roccoAlt`, `rugalAlt`) |

### Desvios respecto del enriquecido

1. **La foto base sigue siendo `portrait.svg`**: el usuario pidio dejar "lo ultimo de imagen al final", asi que el swap a `src/assets/me/` queda como **D1 abierto**; la linea a cambiar es una sola (`import portrait from '@/assets/about/portrait.svg'` en `AboutSection.vue`).
2. **Bug de espaciado detectado y corregido en la verificacion**: con los nodos en lineas separadas, Vue condensa el salto en un espacio y el cierre quedaba como `Rugal , desde…`. Se pego el segmento final al nombre (`/>{{ t('about.pets.tail') }}`). Verificado en el codigo compilado: `Ba(z(t('about.pets.tail')),1)` sin espacio previo, mientras `lead`/`and` conservan el espacio simple.
3. **`aria-hidden`**: las dos capas glitch van `aria-hidden="true"` con `alt=""`; la capa visible de la bestia lleva el `alt` del perro y la base conserva `about.photoAlt`. Queda como punto de revision manual.

### Verificacion real

- `bun run lint:check` **exit 0** (tras corregir `vue/attributes-order` en `BeastImage.vue`: `:class`/`:style` antes de `class`).
- `bun run format:check` **exit 0**.
- `bun run build` (`vue-tsc -b && vite build`) **exit 0**. Evidencia del diferido: `rocco-*.jpg` (878.550 B) y `rugal-*.jpg` (1.798.450 B) salen como assets aparte con cargadores de 0,05 kB, fuera del grafo inicial. El chunk de entrada pasa de 498.844 B a **501.211 B** (176,62 kB gzip) y aparece el aviso informativo de Vite de chunk > 500 kB.
- Espaciado del parrafo verificado sobre el render compilado: `lead` + ` ` + Rocco + ` ` + `y` + ` ` + Rugal + `, …`.
- Revision en navegador (hover, fade, glitch, ES/EN, `prefers-reduced-motion`): **pendiente**, a cargo del usuario con `bun run dev`.
- `dist/`: 4,1 MB (portfolio + 2,7 MB de fotos diferidas); se volvio a borrar `dist/game` (el build lo regenera) para que el dist siga siendo el del despliegue.
- Higiene: sin secretos, sin `console.log`, sin `[...]` nuevos, sin margenes.

### Pendientes

- **D1**: elegir la foto base (`src/assets/me/1.jpeg` o `2.jpeg`) y cambiar la linea del import.
- **D2**: (opcional) reconvertir las fotos de las bestias a WebP con `ffmpeg`.
- **D3**: `src/assets/about/portrait.svg` quedara sin uso tras D1: conservar (default) o borrar con aprobacion 0.2.
- Revision visual del usuario antes del cierre (DoD).

## Registro De Iteracion (2026-09-22, tarde)

> Orden del usuario: ajustar el glitch de la foto a la cadencia exacta de `mgGlitch` (el CSS por `@keyframes` se sentia demasiado rapido/impreciso) y restaurar el swap de la foto base al hacer hover en `Rocco`/`Rugal` con un fade pequeno.

### Cambios reales de esta iteracion

| Archivo | Cambio real |
| --- | --- |
| `src/components/about/PortraitGlitch.vue` | **Nuevo** (reemplaza a `BeastImage.vue`): foto base responsive (`src/assets/me/portrait_*.webp` con `srcset`/`sizes`, fallback master JPG); glitch **siempre activo** portado del algoritmo de `mgGlitch` en TS: 2 overlays con `clip-path: inset()` + `translate3d` + `scale` + `hue-rotate` sorteados en timers JS independientes (capa A: 10-100 ms, capa B: 10-300 ms, mezcla `mix-blend-mode: hue`, igual que las opciones de la referencia); overlay de mascotas con fade (`transition-opacity duration-500`) y sus propias capas glitch; `import()` diferido de las fotos de las bestias (ADR-011 conservado); timers anulados con `prefers-reduced-motion` |
| `src/components/about/AboutSection.vue` | Vuelve el estado `hoveredPet` + `handlePetEnter`/`handlePetLeave` conectados a los emits `hoverStart`/`hoverEnd` de `GlitchText`; la imagen pasa a `<portrait-glitch :alt="t('about.photoAlt')" :active-pet="hoveredPet" />` |
| `src/components/about/BeastImage.vue` | **Eliminado** (quedo sin uso tras el reemplazo; ver desvio 2) |

### Decisiones y desvios

1. **D1 cerrado**: la foto base ya no es `portrait.svg`; son los WebP responsivos de `src/assets/me/` elegidos por el usuario en esta orden. `portrait.svg` queda **sin uso** (D3: conservado por defecto).
2. **Eliminacion de `BeastImage.vue`**: fue reemplazado directamente por `PortraitGlitch.vue` (su logica de pets/fade/diferido vive ahora ahi). Si se quiere recuperar, su contenido esta intacto en el registro anterior.
3. **R2 revertido a proposito**: el plan original evitaba timers JS de 10-300 ms; el usuario pidio explicitamente la cadencia exacta de `mgGlitch`, asi que los timers vuelven acotados a esta seccion (2 `setTimeout` encadenados, limpieza en `onBeforeUnmount`, apagados con `prefers-reduced-motion`).
4. El glitch del retrato es **permanente** (no solo en las bestias), segun el pedido "debe aplicarse siempre".

### Verificacion real (iteracion)

- `bun run lint:check` / `bun run format:check` / `bun run build`: ver reporte de la sesion (se ejecutan tras estos cambios).
- Manual en navegador pendiente: hover `Rocco`/`Rugal` → fade a la foto del perro con glitch; salida → fade de vuelta al retrato; ritmo del glitch comparable a la demo de `mgGlitch`.

## Cierre (memoria persistente)

> Completar al cerrar el plan. Sin esto, no pasa a CLOSED (DoD).

- **Que cambio**: iteracion final (2026-09-23): la imagen del About tambien **cicla por tap/click**: base -> Rocco -> Rugal -> base. El hover sobre los nombres sigue mandando mientras este activo (`displayedPet = activePet ?? tappedPet`), el tap conserva su eleccion al salir el puntero, y la foto del perro entra con el mismo fade de 500 ms + glitch que ya tenia el overlay. Accesible: `role="button"`, `tabindex="0"`, Enter/Espacio. `PortraitGlitch.vue` solo; `AboutSection` intacto.
- **Verificacion**: `lint:check` / `format:check` / `build` en verde; en produccion el entry contiene el ciclo (`{key:'rocco'...},{key:'rugal'...}`) y las fotos siguen diferidas (`rocco-*.js` / `rugal-*.js` con webp aparte, entry sin URLs de bestias embebidas).
- **Resultado**: el usuario reporto (2026-09-23) que el fade "no siempre aplicaba": con una sola capa intercambiando `src`, pasar Rocco -> Rugal no transiciona (misma opacidad, solo cambia la foto). Corregido: **una capa por mascota** (`v-for` sobre `pets`, `v-show` hasta que la foto resuelve), el fade vive en el wrapper de cada foto y sus capas glitch se desvanecen con ella -> los cambios perro-perro hacen crossfade real y el glitch nunca parpadea.
- **Pendientes**: revision visual final del usuario (hover en nombres y ciclo por tap en el iPhone 6s).
