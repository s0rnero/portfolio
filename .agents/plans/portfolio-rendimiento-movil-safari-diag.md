---
name: portfolio-rendimiento-movil-safari-diag
status: EXECUTED
type: maintenance
domain: portfolio
owner_rules: .agents
created: 2026-09-22 20:00
updated: 2026-09-23 15:10
---

# Plan: rendimiento en movil (Safari / iOS 15)

## HANDOFF — leer esto primero

**Que se esta haciendo:** el portafolio es inutilizable en un iPhone 6s (iOS 15.8). Medido en el dispositivo: **26,9 fps, picos de 109 ms**. No esta roto, no llega. Se instrumento el dispositivo, se aplico un **modo ligero automatico** y se corrigieron dos capas que gastaban frames para nada.

**Estado por pieza**

| Pieza | Estado | Nota |
| --- | --- | --- |
| Panel de diagnostico `public/diag.js` (`?perf=1`) | Hecho y desplegado | **DOM estatico**: los botones ya no mueren con el repintado (ver ADR-019) |
| Medida en el iPhone (26,9 fps) | Hecha | Al 8 % de bateria: es un suelo, no la medida limpia |
| Medida en el iPhone cargado, modo ligero | Hecha | **56 fps, peor frame 58 ms** |
| Modo ligero (`useQuality.ts`) | Hecho y desplegado | **Ya no es automatico**: la vista completa es el defecto en todos los dispositivos (decision del usuario, ADR-019) |
| Ruido de TV invisible que dibujaba | Corregido | `v-if` + `v-show` + `active` |
| Terminal dibujando bajo el intro del CRT y bajo el ruido del truco | Corregido | `active` |
| Pila de `backdrop-filter` en movil | Corregida | Degradado al color del tema en modo ligero |
| Escala de dibujo del terminal cambiable en caliente | Hecha y desplegada | Prop `drawScale` (backing store menor, CSS lo estira); khatarsis fija su `dpr` al crear y no se puede cambiar vivo |
| Botones A/B del panel (escala 1/0.75/0.5/0.25, fps libre/30) | Hechos y desplegados | Para cazar los 60 fps en el 6s con vista completa |
| **Medida del modo completo en el iPhone con el panel arreglado** | **Hecha** | Vista completa + escala 0.25 del terminal: **~60 fps** (muestra 5 s, 1 frame lento). Decision del usuario: **0.25 por defecto en tactil** (hecho, con deteccion `(hover: none), (pointer: coarse)` una vez) |
| **Logo centrado en iOS 15** | **Corregido** | El SVG del logo no tenia `width`/`height`: iOS 15 le da su tamano por defecto (~300x150) y centra el glifo. Atributos nativos anadidos al SVG |
| **Media queries de rango matando el layout en iOS 15** | **Corregido y desplegado** | Tailwind v4 emite `width>=40rem`; Safari <=16.3 descarta la regla `@media` completa -> navbar/footer sin layout solo en iOS 15. Plugin `legacy-media-queries` en `vite.config.ts` baja todo a `min-width/max-width` clasica en cada build (42 MQ convertidas) |
| **Panel diag matando el canvas del terminal con `?perf=1`** | **Corregido y desplegado** | `capabilities()` sondeaba 2 contextos WebGL nuevos en cada refresco (400 ms): iOS tiene tope duro de contextos y mataba el mas antiguo (el terminal). Ahora se sondea una vez y se cachea, y el contexto de prueba se libera con `WEBGL_lose_context` |
| Colores del tema en iOS 15 (`oklch()` / `@property`) | **PENDIENTE** | Problema de fidelidad, no de rendimiento |

**Lo siguiente, en orden**

1. **Medir el modo completo en el iPhone** (ya por defecto, sin `?q=`): `?perf=1` -> "medir ahora". Despues A/B del terminal en caliente: escala 0.75 -> medir, 0.5 -> medir. Con eso se sabe que recorte (si alguno) hace falta para 60 fps, conservando la vista completa.
2. Si ni a escala 0.25 llega: es el compositor/scroll (Lenis + ScrollTrigger) o el pintado de texto, no los canvas. Usar "sin backdrop-filter", "sin animaciones", "sin sombras" para acotar.
3. **Vistazo de escritorio.** El modo completo no se ha visto en un navegador desde los ultimos cambios (el `dpr` del terminal ahora es el del dispositivo, cap 2: en dpr 1 se dibuja a 1x, antes 2x de gratis). Si algo se ve mal, rollback desde Netlify.
4. **Decidir los colores de iOS 15:** `@property` y `oklch()` no existen antes de Safari 16.4 y el proyecto usa Tailwind v4 (que los da por hechos). Hay que decidir si se anaden valores de respaldo o si se acepta como navegador no soportado.

**Preguntas abiertas al usuario**

- Cuanto recorte visual acepta en movil (el modo ligero ya cambia el cristal del navbar por un degradado).
- Si quiere que la precarga del juego tambien funcione en iOS 15 (`DecompressionStream` no existe ahi; sin el, cae al recorrido del manifiesto de 17.399 peticiones).

**Trampas encontradas (no repetirlas)**

- **No lanzar navegadores sin permiso.** El usuario corto los tests con Chrome headless por consumo de CPU. Nada de `chrome --headless` por iniciativa propia; para verificar despliegues, peticiones HTTP con `node` (patron usado abajo) y el panel en el dispositivo.
- **El headless no mide rendimiento.** Con `--disable-gpu` renderiza por software: sus FPS no significan nada. Solo vale para comprobar que una plantilla monta.
- **Los volcados de headless salen vacios a veces** (0 bytes, y el DOM "sin canvas" que confundio un diagnostico). Si un volcado sale raro, comprobar `wc -c` antes de sacar conclusiones.
- **El propio instrumento mintio dos veces** (y se corrigio): `CSS.supports` de una sola cadena es condicion de `@supports`; cada contexto WebGL exige un canvas nuevo; y `measure()` recortaba un buffer circular y devolvia 0,0 fps.
- **`pause` en los fondos no para el bucle**, solo congela el tiempo. Para ahorrar frames hay que usar `active` (o desmontar).

**Archivos tocados en esta tarea**

`public/diag.js` (nuevo), `index.html`, `src/composables/useQuality.ts` (nuevo), `src/main.ts`, `src/App.vue`, `src/components/background/TvStaticBackground.vue`, `src/components/background/FaultyTerminalBackground.vue`, `src/components/layout/GradualBlur.vue`, `.agents/CODING_STANDARDS.md` (§8 nueva), ADR-017 y ADR-018.

**Contexto relacionado de la misma sesion** (otro plan, no tocar aqui): los datos del juego ya no se sirven desde `r2.dev` sino desde un **Worker** de Cloudflare delante del bucket R2, con un **archivo unico** `vc-streamed.tar.gz` (815 MB) que el loader cachea en IndexedDB — ver `.agents/plans/portfolio-vicecity-precarga-datos.md` y ADR-015. Pendiente alli: `Cache-Control` en los objetos de R2 (requiere dominio propio) y recordar que **si se regeneran los datos del juego hay que regenerar y volver a subir el archivo**.

## Objetivo

- Que el portafolio sea usable en un telefono modesto sin cambiar el diseno en escritorio.

## Alcance

- Instrumento de medida en el dispositivo, calidad adaptada, y las capas de fondo (`TvStaticBackground`, `FaultyTerminalBackground`, `GradualBlur`).
- Fuera de alcance: el juego embebido (Vice City), la precarga del juego, y los colores del tema (pendiente propio).

## Restricciones

- Sin Mac no hay depuracion remota de Safari: la verdad sale del dispositivo, con el panel.
- El repo no tiene suite de tests: la verificacion es `lint:check` + `format:check` + `build` + revision en pantalla.
- Toda decision de diseno se registra como ADR (regla 0.12).

## Analisis

- **Medicion en el dispositivo** (375x548, dpr 2, 4 nucleos, iOS 15.8.8): **26,9 fps**, peor frame **109 ms**, **943 frames lentos**; Vue monta en 2.597 ms y hay 2 canvas. Bateria al 8 % (iOS estrangula ahi).
- **Sin soporte:** `@property`, `oklch()`, `DecompressionStream`. Con soporte: `:has()`, `ResizeObserver`, `structuredClone`, WebGL1/2.
- **Sospechosos, en orden de peso:**
  1. **`TvStaticBackground` dibujaba estando invisible.** Su capa es `-z-30` (o `-z-10` solo en el flash) y el terminal esta en `-z-20`; los dos canvas son **opacos** (`gl_FragColor = vec4(col, 1.0)`), asi que el ruido de TV queda tapado y aun asi renderiza. Su prop `pause` no lo detiene: congela `iTime` y sigue llamando a `renderScene`.
  2. **`GradualBlur`: 5 capas apiladas de `backdrop-filter: blur()`, `position: fixed`**, encima de un canvas que cambia en cada frame.
  3. **`FaultyTerminalBackground`**: `getColor()` **3 veces por pixel**. La escala del patron baja en movil, la resolucion no (`dpr` 2 = 750x1096).
- **Descartado:** depuracion remota (requiere macOS) y Playwright WebKit / Chrome headless como fuente de verdad (no reproducen un A9; el headless con `--disable-gpu` renderiza por software).

## Cambios

### 1. `public/diag.js` (nuevo)

Panel autonomo, JS nativo, **fuera del bundle** (funciona aunque Vue no monte). Incluye: captura de `error`/`unhandledrejection` desde el primer instante; informe de entorno (iOS, viewport, dpr, puntero, nucleos, si Vue monto y en cuanto, cuantos canvas); medidor de FPS sobre `requestAnimationFrame` con **"medir 5 s"** y acumulador propio; **modo de calidad** (botones que emiten `vc-quality`); **A/B por capa** (canvas a 1px e inyeccion de CSS para `backdrop-filter`, animaciones, `mix-blend-mode` y sombras); capacidades del navegador; e informe copiable.

### 2. `index.html` (edit)

Script inline minimo que inyecta `/diag.js` **solo con `?perf=1`**. Sin el parametro no se descarga nada.

### 3. `src/composables/useQuality.ts` (nuevo, revisado en ADR-019)

Estado reactivo con **interruptor maestro (`lite`)** y todo lo demas derivado:

| | Completo (defecto) | Ligero (manual) |
| --- | --- | --- |
| Ruido de TV | montado, dibuja solo en el flash | no se monta |
| Escala de dibujo del terminal | 1 (nativo) | 0.5 |
| fps del terminal | sin limite | 30 |
| `backdrop-filter` | 5 capas | degradado al color del tema |

**Cambio de politica (ADR-019):** la deteccion automatica **se quito**. El defecto es la vista completa en todos los dispositivos; el modo ligero queda como eleccion manual (`?q=lite`, panel). Motivo: en el 6s cargado el modo ligero dio 56 fps y el usuario quiere perseguir los 60 con la vista completa intacta; solo `prefers-reduced-motion` congela (que cada componente ya hace por su cuenta). Tambén cambio la forma de escalar: el `dpr` de khatarsis se fija al crear el renderer y no se puede cambiar vivo, asi que el recorte fino va por **`drawScale`** (backing store menor que el CSS estira, aplicado en `resize()`), cambiable en caliente desde el panel.

Original (ADR-018): deteccion por puntero grueso o hardware modesto (`hardwareConcurrency <= 4` **y** `deviceMemory <= 4`). Preferencia guardada en `localStorage` (`portfolio-quality`), forzado por `?q=lite` / `?q=full`, y puente por evento `vc-quality` con el panel. La persistencia y el forzado por URL siguen vivos.

### 4. Visibilidad de las capas (nuevo criterio, ver CODING_STANDARDS §8)

| Capa | Que se aplico | Por que |
| --- | --- | --- |
| `TvStaticBackground` | `v-if` (existe: modo completo o truco) + `v-show` (se ve: flash o truco) + `active` (para el bucle) | `v-if` decide si se crea el contexto WebGL (en modo ligero no); `v-show` evita pintarlo; `active` impide que pida frames tapado |
| `FaultyTerminalBackground` | `active="!showCrt && !isTrickActive"` | Deja de dibujar mientras el intro del CRT o el ruido del truco lo tapan |
| `Crt` | `v-if` (ya estaba) | Timeline de una sola vez: al terminar **debe** desmontarse |
| `TrickOverlay` | `v-if` (ya estaba) | Monta un `<audio>`: con `v-show` seguiria sonando |
| `ViceCityExperience` | `v-if` (ya estaba) | Hilo wasm |

Detalles de implementacion: `active` en los dos fondos para el bucle conservando el ultimo fotograma (reactivar no cuesta compilar ni provoca un salto a negro); `resize()` del ruido de TV ignora tamanos 0 (con `v-show` el contenedor mide 0x0); y **red de seguridad del intro del CRT** en `App.vue` (si el timeline no avisa en 4 s, se cierra igual) porque el terminal se activa con ese aviso.

### 5. `FaultyTerminalBackground.vue` (edit)

- Prop `fps` (0 = sin limite) con el throttle que ya usaba el ruido de TV.
- Prop `active` (montado y dibujando no son lo mismo): al montar pinta **un** fotograma siempre, y arranca el bucle solo si esta activo.

### 6. `GradualBlur.vue` (edit)

- En modo ligero, degradado a `var(--color-glitch-backdrop)` (token de tema ya existente) en vez de la pila de `backdrop-filter`.

## Verificacion

- `lint:check`, `format:check` y `build` (`vue-tsc -b`, que valida props y plantillas) en verde tras cada tanda de cambios.
- HTTP contra produccion (sin navegador): `index.html` sirve el cargador condicional, `diag.js` responde 200, y el bundle contiene el estado persistido, el puente `vc-quality`, las opciones de calidad y el token del degradado en el CSS.
- Chrome headless **solo** para verificar montaje de plantillas (modo ligero: 1 canvas y 2 degradados). **No se uso como medida de rendimiento.**
- **No verificado:** el render del modo **completo** en un navegador desde el ultimo cambio, ni la medida despues del cambio en el dispositivo.

## Pendientes

1. Medir el modo completo en el iPhone con el panel arreglado y A/B de escala en caliente (la medida previa de 56 fps fue modo ligero).
2. Vistazo de escritorio al modo completo (el `dpr` del terminal ahora es el del dispositivo, cap 2).
3. Colores de iOS 15 (`oklch()` / `@property`): decidir respaldos o asumir navegador no soportado.
4. Si el modo completo no llega a 60 fps ni con escala 0.25: mirar compositor/scroll (Lenis + ScrollTrigger) y los `box-shadow` del intro del CRT (se pagan en la fase de carga, que es donde el usuario vio "5 fps").
