---
name: portfolio-vicecity-sound-trailer-gating
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-16 19:24
enriched: 2026-09-16 19:35
ready: 2026-09-16 19:37
executed: 2026-09-16 20:10
---

# Plan Tecnico: Sonido del panel del truco + arranque diferido del trailer

> Enriquecido el 2026-09-16 19:35 sobre la compuerta **"enriquece el plan"**. Todo lo de este
> documento esta verificado leyendo el repo y midiendo assets el 2026-09-16; las anclas de linea
> corresponden a ese estado. El enrichment **no** implementa codigo: los pasos quedan listos para la
> compuerta **"ejecuta el plan"**.
>
> **Revision del orquestador (obligatoria) + aprobacion del usuario:** el 2026-09-16 19:37 el usuario
> aprobo el enriquecimiento ("Aprobar y marcar READY"), asi que el plan paso `ENRICHED -> READY`. La
> implementacion **no** empieza hasta la frase explicita "ejecuta el plan".

## Registro De Ejecucion (2026-09-16 20:10)

> Ejecutado sobre la orden explicita del usuario: "retoma el plan que habias enriquecido y ejecutalo"
> (una sola instruccion que identifica el plan y ordena ejecutarlo; satisface la compuerta
> `READY -> EXECUTED` de `.agents/WORKFLOW.md`, que exige orden explicita de ejecucion, no la frase
> literal).

### Archivos tocados (4 codigo + 2 documentos; ningun archivo nuevo de codigo)

| Archivo | Cambio real |
| --- | --- |
| `src/composables/useViceCityCode.ts` | `isTrickActive` y `timer` subieron al modulo con comentario en ingles; `activate()` y `handleKeydown()` escriben/leen la senal de modulo; `useRouter()` queda dentro de la funcion; el retorno pasa a `{ isTrickActive }` y se agrega `export { isTrickActive }` |
| `src/App.vue` | 1 linea: `const { isTrickActive } = useViceCityCode()`. La plantilla quedo intacta |
| `src/components/common/TrickOverlay.vue` | `import unlockSound from '@/assets/c/unlocksomething.m4a'` + `<audio :src="unlockSound" autoplay />` como primer hijo de la raiz (antes del panel) |
| `src/views/ViceCityView.vue` | `autoplay` fuera; `video` y `hasStarted` como refs; `handleStart()` con guarda de un solo disparo y `play().catch()` documentado; `onMounted` arranca si el truco **no** esta activo y `watch(isTrickActive)` arranca cuando pasa a `false` |
| `.agents/DESIGN.md` | §1: `useViceCityCode` pasa al estado de modulo y se aclara que hoy no hay ningun composable con estado local; el rango de ADR vigentes sube a `ADR-001 a ADR-010` |
| `.agents/decisions/010-truco-vicecity-sonido-y-arranque-del-trailer.md` | **Nuevo**, `proposed`, con contexto, decision, consecuencias, 6 alternativas descartadas y estado |

### Desvios respecto del plan enriquecido

1. **Orden de atributos del `<video>`:** el plan decia conservar el orden de hoy (`:src` primero) y el
   primer intento puso `ref` antes de `:src`; `vue/attributes-order` lo rechazo
   ("Attribute `:src` should go before `ref`"), asi que quedo `:src`, `ref`, `class`, `playsinline`.
   El plan ya pedia ese orden; solo se corrige el intento fallido, sin cambio de alcance.
2. **DESIGN.md, una linea extra:** ademas del parrafo de estado transversal hubo que subir el rango
   "ADR-001 a ADR-009" a "ADR-001 a ADR-010". Es la misma seccion §1 y evita que el documento quede
   desactualizado al agregar el ADR-010.
3. **`bunx vite build` se ejecuto** (estaba marcado opcional): dejo `dist/` regenerado con el trailer
   de 250 MB. Es artefacto ignorado por Git; no se versiona.

### Verificacion real

- `bun run lint:check` -> exit 0, sin hallazgos (primer intento: 1 error de `vue/attributes-order`,
  corregido y revalidado).
- `bun run format:check` -> "All matched files use Prettier code style!".
- `bunx vue-tsc -b` -> 4 errores, **todos** de la libreria externa `khatarsis`
  (`TS7016: Could not find a declaration file for module 'khatarsis'` en `FaultyTerminalBackground.vue`,
  `TvStaticBackground.vue`, `Navbar.vue` y `main.ts`). Ninguno en los archivos de este plan. Es el fallo
  externo ya reportado: `bun run build` sigue bloqueado por el `dist/public/types/` que la libreria
  declara y no publica.
- `bunx vite build` -> exit 0, 117 modulos, 2,46 s. El sonido entra al bundle:
  `dist/assets/unlocksomething-5N3-cdW1.m4a` 11,40 kB; `dist/assets/vc-BIYZeEd3.mp4` 262.477,13 kB;
  `index-D7RiIPdE.js` 1.038,06 kB y `index-DUtKPETW.css` 402,45 kB.
- **Revision funcional en el navegador** (Vite dev en `localhost:5199`, servidor apagado al terminar):

| Caso probado | Evidencia medida | Resultado |
| --- | --- | --- |
| Truco normal (`vicecity` + `Enter` desde `/`) | t=0,1 s: `<audio src="/src/assets/c/unlocksomething.m4a">` con `paused: false`, `currentTime: 0,043`; `video` con `paused: true`, `currentTime: 0` | El m4a suena en el mismo instante del panel y el trailer **no** arranca |
| Ruido en curso (t=1,0 s / 2,1 s / 2,8 s) | audio ya terminado (`currentTime: 0,405`, `paused: true`); panel `Truco activado` montado; `video` con `paused: true`, `currentTime: 0` | Cero trailer durante los 3 s de ruido; el m4a (0,379 s) no se corta ni se solapa |
| Fin del ruido (t=3,7 s / 4,4 s) | elemento `<audio>` desmontado; `video` con `paused: false`, `currentTime: 0,66` -> `1,37` | El trailer arranca en el instante en que desaparecen panel y ruido, y sigue avanzando |
| Deep-link `/vicecity` recargado | `video` con `paused: false`, `currentTime: 3,62`, `muted: false`, `volume: 1`, sin atributo `autoplay`, sin `<audio>` y sin panel | El caso directo arranca solo, sin panel, sin ruido y sin m4a |
| Segundo truco con el video ya arrancado | panel remontado con texto `Truco activado` y `<audio>` sonando de nuevo; `video` paso de `6,11` a `9,89` sin reiniciarse (`restarted: false`) | El video no se reinicia (`hasStarted`) |

- **No verificado por mi:** el sonido audible real (no puedo oir la salida de audio del navegador; si
  `audio.paused` es `false` y el `volume` es `1`, la reproduccion la acepto el navegador) y el aspecto
  visual del panel sobre el portafolio. La revision en pantalla sigue siendo del usuario.

## Analisis

- **Objetivo:** (A) `src/assets/c/unlocksomething.m4a` suena en el mismo instante en que aparece
  `TrickOverlay.vue`; (B) `vc.mp4` no empieza al entrar a `/vicecity` sino cuando el ruido de TV del
  truco desaparece (~3 s despues), que es cuando se desmontan el panel y el modo `overlay` del ruido.
- **Scope:** 4 archivos de codigo (3 editados + 1 linea en `App.vue`), 1 documento de arquitectura
  (`.agents/DESIGN.md` §1), 1 ADR nuevo. Ningun archivo nuevo de codigo, ninguna dependencia nueva.
- **El nudo tecnico:** el estado del truco (`isActive`) es hoy un `ref` **local** creado dentro de
  `useViceCityCode()` (`src/composables/useViceCityCode.ts:18`) y solo `App.vue` lo consume
  (`src/App.vue:28`). El Frente B necesita que **dos** consumidores distintos —`App.vue` (ruido) y
  `ViceCityView.vue` (trailer)— lean la misma senal, y que esa senal exista **fuera** del arbol de
  `App.vue`, porque la vista del video se monta con el router. Sin compartir el estado, la vista no
  tiene forma de saber que el ruido termino.
- **Patron del repo para eso:** estado de modulo. `src/composables/useStaticFlash.ts` (refs de modulo
  + funciones exportadas) y `src/composables/useCrtIntro.ts` (`const isCrtDone = ref(false)` +
  `export { isCrtDone }`) son los dos precedentes exactos; `.agents/DESIGN.md` §1 declara ese patron
  como el vigente para estado compartido entre componentes. Hoy `useViceCityCode` figura en ese
  mismo parrafo como el ejemplo de estado **local**; deja de serlo con este cambio.
- **Datos medidos de los dos assets** (los dos estan tipados por `vite/client`: `declare module
  '*.m4a'` en `node_modules/vite/client.d.ts:154` y `'*.mp4'` en la 118, import por defecto `string`):

| Asset | Tamano | Duracion | Notas |
| --- | --- | --- | --- |
| `src/assets/c/unlocksomething.m4a` | 11.404 B (11 KB) | **0,379 s** | `ISO Media, MP4 Base Media v1`, 240,7 kbps. Termina mucho antes del fin del ruido (3 s), asi que no se corta ni se solapa con el trailer |
| `src/assets/trailers/vc.mp4` | 262.477.133 B (250 MB) | 101,58 s | 20,7 Mbps. Es el activo mas pesado del repo |

- **Riesgos altos de la fase:** (1) el `play()` del trailer ocurre ~3 s despues del `Enter`, y si el
  navegador ya no considera valida la activacion del usuario el video puede quedar sin sonido o sin
  arrancar; (2) el estado de modulo no debe quedar en "activo" si la secuencia se interrumpe.

## Cambios

### 1. `src/composables/useViceCityCode.ts` — estado de modulo (edit)

Mover la senal del truco de ref local a nivel de modulo y exportarla, sin tocar el disparador:

- `const isTrickActive = ref(false)` en el modulo (sobre `isTypingTarget`, junto a `CODE` y
  `TRICK_DURATION_MS`), con un comentario en ingles que explique que la comparten el panel, el ruido y
  la vista del trailer.
- `timer` sube tambien al modulo (hoy es `let timer` dentro de la funcion, linea 19-20), porque el
  `setTimeout` de `activate()` escribe el estado de modulo.
- `export { isTrickActive }` para consumidores que solo necesitan leer la senal sin instalar el
  listener global (eso es exactamente lo que necesita `ViceCityView.vue`; llamar al composable desde
  la vista montaria un **segundo** `keydown` en `window`).
- `useViceCityCode()` conserva su papel: instala el listener y navega. `useRouter()` debe quedarse
  **dentro** de la funcion (necesita contexto de componente) y el retorno pasa a `{ isTrickActive }`.
- No se toca: `CODE`, `TRICK_DURATION_MS`, `isTypingTarget`, la guarda `if (isTrickActive.value) return`,
  el buffer de 8 letras, la limpieza de `onBeforeUnmount` ni el `router.push({ name: 'vicecity' })`.

### 2. `src/App.vue` — adaptar el destructure (edit, 1 linea)

- Linea 28: `const { isActive: isTrickActive } = useViceCityCode()` pasa a
  `const { isTrickActive } = useViceCityCode()` (la senal cambia de nombre pero el identificador local
  ya se llamaba `isTrickActive`, asi que la plantilla no se toca).
- Lineas 70 (`:overlay="isTrickActive"`) y 75 (`v-if="isTrickActive"`) quedan **identicas**.

### 3. `src/components/common/TrickOverlay.vue` — el sonido del panel (edit)

- Importar el audio: `import unlockSound from '@/assets/c/unlocksomething.m4a'`.
- Reproducirlo con el camino **declarativo**: `<audio :src="unlockSound" autoplay />` como primer hijo
  de la raiz `pointer-events-none fixed inset-0 z-50` (antes del panel). El elemento se crea al montar
  el componente —el mismo instante en que aparece el panel, con la activacion del usuario todavia
  fresca— y desaparece con el, asi que no hace falta ni `onMounted`, ni `new Audio()`, ni limpieza, ni
  estado nuevo.
- No se toca el panel (`absolute top-4 left-4 flex h-10.5 w-85.25 items-center bg-black px-2
  text-2xl font-black text-neutral-300` y `t('trick.unlocked')`) ni su `<script setup>`.
- Alternativa descartada en esta iteracion: `new Audio()`/`ref` + `onMounted` + `audio.play().catch()`.
  Su unica ventaja es poder registrar el rechazo del `play()`; el audio es un efecto decorativo, y
  `.agents/CODING_STANDARDS.md` §4 admite degradacion silenciosa documentada en efectos decorativos
  (precedente citado: el `catch` de WebGL en `TvStaticBackground.vue`). Si el usuario prefiere el
  rechazo observado, se cambia a esa forma sin salir del alcance.

### 4. `src/views/ViceCityView.vue` — el trailer arranca cuando termina el ruido (edit)

Forma objetivo (mecanismo, no implementacion literal):

- Quitar `autoplay` del `<video>` y conservar `playsinline` **sin `muted`** (el sonido entra al arrancar).
- `const video = ref<HTMLVideoElement | null>(null)` enganchado al elemento (`ref="video"`) y
  `const hasStarted = ref(false)` como guarda de un solo arranque.
- Un unico `handleStart()` local que: sale si `video` es nulo o `hasStarted` ya es `true`; marca
  `hasStarted`; y llama `void element.play().catch(...)` con un comentario en ingles que documente la
  degradacion (nunca `muted` en silencio, ADR-009 R2).
- Dos disparadores, ambos contra la senal compartida `isTrickActive` importada del composable:
  1. `onMounted`: si `!isTrickActive.value`, arranca de inmediato → cubre el deep-link directo
     (`/vicecity` tecleado o recargado, sin truco).
  2. `watch(isTrickActive, active => { if (!active) handleStart() })`: arranca cuando el ruido se apaga.
- El orden de atributos del `<video>` se mantiene como hoy (`:src`, `class`, booleano), que es lo que
  `vue/attributes-order` valida hoy con 0 problemas.

### 5. `.agents/DESIGN.md` §1 — estado compartido del truco (edit)

- Mover `useViceCityCode` del ejemplo de estado **local** al ejemplo de estado **de modulo** en el
  parrafo "Estado transversal" (la clausula "estado local cuando hay un solo consumidor" queda sin
  ejemplo concreto: hoy no hay otro composable con estado de un solo consumidor; `useSmoothScroll`
  devuelve una funcion de limpieza, no estado).
- No se toca ninguna otra seccion.

### 6. `.agents/decisions/010-truco-vicecity-sonido-y-arranque-del-trailer.md` — ADR nuevo (create)

Sigue `.agents/templates/adr.md`, en estado `proposed`, `domain: portfolio`, `supersedes: []`, con la
decision: (a) el estado del truco es de modulo y `useViceCityCode` exporta `isTrickActive`;
(b) el sonido del panel lo posee `TrickOverlay.vue` como `<audio autoplay>`; (c) el arranque del
trailer lo gobierna el fin del ruido, es de un solo disparo y no se reinicia. Debe incluir contexto,
consecuencias (positivas y negativas), alternativas consideradas (audio en el composable, prop
inyectada por `router-view`/`provide-inject`, `autoplay` conservado) y la seccion de estado.
**ADR-009 no se edita** (regla 0.12): este ADR lo referencia como decision previa que sigue vigente.

## Restricciones

- `.agents/RULES.md` 0.1 Git sin solicitud, 0.2 no eliminar archivos, 0.3 un componente principal por
  requerimiento (no se crean componentes nuevos), 0.6 cero duplicacion (una sola senal y un solo
  `handleStart`), 0.8 sin secretos, 0.13 **codigo 100 % en ingles** (identificadores, comentarios,
  nombres de archivo; los textos visibles ya viven en i18n).
- `.agents/CODING_STANDARDS.md` §1 (orden de bloques del SFC), §2 (naming: booleano `hasStarted`,
  handlers `handle*`), §3 (contratos tipados; nada de textos en codigo), §4 (prohibido `console.log` de
  debug; los fallos de APIs del navegador se manejan de forma explicita y documentada), §5 (la
  verificacion del repo es `lint:check` + `format:check` + `build` + revision en pantalla; no hay
  suite de tests y no se inventa una), §7 (Tailwind-first; no se tocan clases ni tipografia).
- `.agents/DESIGN.md` §1 (una instancia por fondo WebGL: el ruido **no** se duplica) y §3 (el video es
  el activo mas pesado: no se agrega copia ni se recomprime en este plan).
- No se crean archivos nuevos fuera de `src/`: el unico archivo nuevo es el ADR.
- No se cambian APIs publicas de componentes: `TrickOverlay` sigue sin props ni emits y `ViceCityView`
  sigue sin props.

## Steps

1. **read** `src/composables/useViceCityCode.ts`, `src/App.vue`, `src/components/common/TrickOverlay.vue`,
   `src/views/ViceCityView.vue` y `.agents/DESIGN.md` §1 antes de editar (los tres primeros ya estan
   leidos en este enrichment; confirmar que no cambiaron).
2. **edit** `src/composables/useViceCityCode.ts`: subir `isTrickActive` y `timer` al modulo, agregar el
   comentario en ingles, `export { isTrickActive }` y cambiar el retorno a `{ isTrickActive }`.
3. **edit** `src/App.vue` linea 28: `const { isTrickActive } = useViceCityCode()`.
4. **edit** `src/components/common/TrickOverlay.vue`: import del `m4a` + `<audio :src="unlockSound" autoplay />`.
5. **edit** `src/views/ViceCityView.vue`: import de `isTrickActive`, `video`/`hasStarted`,
   `handleStart()`, `onMounted` + `watch`, y quitar `autoplay` del `<video>`.
6. **edit** `.agents/DESIGN.md` §1: mover `useViceCityCode` al estado de modulo.
7. **create** `.agents/decisions/010-truco-vicecity-sonido-y-arranque-del-trailer.md` (`proposed`).
8. **Verificacion** (seccion siguiente). Con el resultado: `status: EXECUTED` + registro de ejecucion
   real (archivos tocados, desvios, cifras) y, si el usuario confirma la revision visual, `CLOSED` con
   la entrada de memoria.

## Casos borde obligatorios

| Caso | Comportamiento esperado |
| --- | --- |
| Truco normal desde el portafolio | t=0 panel + m4a (0,379 s) + ruido + navegacion; el trailer **no** reproduce; a los 3 s arranca el trailer con sonido |
| Deep-link o recarga en `/vicecity` | Sin truco activo: el trailer arranca al montar, sin panel, sin ruido y sin m4a |
| Segundo disparo despues de la ventana de 3 s, estando ya en `/vicecity` | El panel y el ruido se repiten; el trailer **no** se reinicia (`hasStarted`) |
| Segundo disparo durante la ventana (`isTrickActive === true`) | La guarda existente lo ignora: nada se reinicia |
| Recarga o desmontaje a mitad de la secuencia | `onBeforeUnmount` limpia el listener y el `setTimeout`; el trailer arranca al montar la vista (senal en `false`) |
| `play()` del trailer rechazado por el navegador | Sin `muted` silencioso: se reporta como hallazgo de la revision visual; el arranque no se reintenta |
| Audio del panel bloqueado por el navegador | Degradacion silenciosa documentada (efecto decorativo); se anota en la revision visual |

## Verificacion

> El usuario ya autorizo explicitamente los scripts ("tienes autorizacion para test y demas"), pero la
> autorizacion de scripts **no** sustituye la compuerta `READY -> EXECUTED` de `.agents/WORKFLOW.md`.

- **Baseline medido el 2026-09-16 (antes de ejecutar):** `bun run lint:check` -> exit 0 sin salida;
  `bun run format:check` -> "All matched files use Prettier code style!".
- **Tras ejecutar:** repetir `bun run lint:check` y `bun run format:check`, ambos en verde.
- **`bun run build`:** sigue bloqueado por la libreria `khatarsis` (su `package.json` declara
  `types: ./dist/public/types/public.d.ts` y ese directorio no se publico). Se reporta como fallo
  externo, sin tocar configuracion del repo (reglas 0.4 y 0.9).
- **`bunx vite build` (bundle sin typecheck), opcional:** confirma que los tres archivos compilan y que
  el audio entra al bundle. Efecto lateral: regenera `dist/` copiando el trailer de 250 MB.
- **Manual (navegador, criterio de aceptacion del usuario):**
  1. `vicecity` + `Enter`: el m4a suena en el mismo instante en que aparece el panel.
  2. Durante los ~3 s de ruido el trailer no reproduce (ni imagen ni sonido del trailer).
  3. En el instante en que desaparecen panel y ruido, arranca `vc.mp4` con sonido.
  4. `/vicecity` directo: arranca solo, sin panel, sin ruido y sin m4a.
  5. Segundo truco con el video ya arrancado: el video no se reinicia.
  6. El navbar, el resto del sitio y el truco no cambian en lo demas.

## Riesgos

- **R1 — Autoplay del trailer diferido ~3 s:** si el navegador ya no considera valida la activacion del
  usuario, el `play()` puede quedar mudo o rechazarse. Se reporta; **no** se mutea en silencio.
- **R2 — Dos audios en la misma secuencia:** el m4a (0,379 s) termina antes de que el trailer arranque,
  asi que en la practica no se solapan; si el usuario quisiera solaparlos, es otro pedido.
- **R3 — Peso del trailer (250 MB):** sin `autoplay` el navegador no tiene la misma urgencia de
  precarga, asi que con red lenta el trailer puede arrancar en negro. No se toca empaquetado ni
  `preload` en este plan.
- **R4 — Estado de modulo:** un `ref` de modulo sobrevive a la vista; la limpieza del `setTimeout` en
  `onBeforeUnmount` de `App.vue` evita que quede "activo" si la app se desmonta a mitad de secuencia.
- **R5 — Acoplamiento nuevo:** `ViceCityView` pasa a depender del composable del truco (antes no lo
  conocia). Queda documentado en el ADR-010 como el costo de tener una sola fuente de verdad.

## Relacion con planes y ADR previos

- Extiende el huevo de pascua del plan `portfolio-agents-refresh-vicecity-easter-egg` (hoy `EXECUTED`,
  esperando su propia revision visual). Ese plan no se reescribe: este es el que posee el sonido del
  panel y el arranque diferido del trailer.
- ADR-009 (`proposed`) siguio vigente: disparador, panel, reuso del ruido y ruta propia no se tocan.
  Lo nuevo (senal compartida, dueno del audio, arranque gobernado por el fin del ruido) va al ADR-010.

## Ya ejecutado fuera de este plan (flujo simple, pedido explicito del usuario)

- `.agents/DESIGN.md` §3: se corrigio el peso del trailer (decia 128 MB; hoy `src/assets/trailers/vc.mp4`
  pesa 262.477.133 B = 250 MB, 101,58 s, 20,7 Mbps) y las cifras del presupuesto quedaron con su fuente
  y fecha reales (`dist/` del build del 2026-09-15: `index-*.js` 1.037.836 B, `index-*.css` 402.365 B,
  `logo_khatarsis-*.svg` 578.351 B, `dist/` total 131 MB). Fue un cambio de 1 archivo pedido
  explicitamente ("corrije el peso"), asi que se ejecuto por el flujo simple de `.agents/WORKFLOW.md`
  y no cambia el estado de este plan.

## Cierre (memoria persistente)

> Parcial. El plan pasa a `EXECUTED` con la verificacion automatica y funcional ya hecha; falta la
> revision visual del usuario (DoD de `.agents/WORKFLOW.md`) para autorizar `CLOSED`.

- **Que cambio:** el truco `vicecity` ahora tiene sonido propio (`unlocksomething.m4a`, propiedad de
  `TrickOverlay.vue` como `<audio autoplay>`) y el trailer `vc.mp4` dejo de arrancar al montar la vista:
  arranca cuando el estado compartido del truco (`isTrickActive`, estado de modulo en
  `useViceCityCode.ts`) pasa a `false`, es decir en el instante en que desaparecen el panel y el ruido.
  Detalle en "Registro De Ejecucion" (arriba) y en el ADR-010.
- **Verificacion:** `lint:check` exit 0; `format:check` en verde; `vue-tsc -b` solo con los 4 errores
  externos de `khatarsis`; `vite build` exit 0 con el m4a en el bundle; y revision funcional en el
  navegador con los 5 casos de la tabla (sonido inmediato, silencio durante el ruido, arranque al
  desaparecer el ruido, deep-link directo y segundo truco sin reinicio).
- **Resultado:** los dos pedidos del usuario quedaron implementados y medidos, no supuestos.
- **Pendientes:** (1) revision visual/auditiva del usuario en pantalla, que es la que autoriza el paso a
  `CLOSED`; (2) `bun run build` sigue bloqueado por `khatarsis` (`dist/public/types/` no publicado), fallo
  externo a este repo; (3) ADR-010 y ADR-009 quedan en `proposed` hasta esa confirmacion visual;
  (4) sigue abierto, sin relacion con este plan, el `EXECUTED` de
  `portfolio-agents-refresh-vicecity-easter-egg` esperando su propia revision visual.
