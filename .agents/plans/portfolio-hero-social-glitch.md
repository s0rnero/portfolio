---
name: portfolio-hero-social-glitch
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-09 20:01
enriched: 2026-09-09 20:05
executed: 2026-09-09
---

# Plan Técnico: Hero — descripción estilo jasoncameron.dev, botones GitHub/LinkedIn/WhatsApp, scrollbar morada y GlitchText cíclico

> Solicitud del usuario (2026-09-09): descripción tipo jasoncameron.dev; botones de GitHub, LinkedIn y WhatsApp (enviar mensaje); scrollbar (thumb y flechas) del color morado `#995CD0` del faulty terminal; GlitchText automático (efecto 4s cada 5s) con hover inmediato que reinicia el conteo. Respuestas a decisiones: redacción a cargo del agente (el usuario la ajustará después, hay que mejorar la actual); WhatsApp al número nuevo `+57 305 450 1829` con mensaje precargado; se conserva el botón "Conóceme".

## Analisis

- **Objetivo:** hero con descripción en primera persona directa y con logros (estructura de texto de jasoncameron.dev: quién soy, qué he construido, a qué me dedico), fila social completa, scrollbar morada coherente con el fondo y glitch cíclico con hover.
- **Scope:** 1 edit de datos, 3 edits de vista/estilo. Sin dependencias nuevas, sin componentes nuevos, sin tocar secciones/router/fondo/CRT.
- **Archivos:**
  - `src/data/portfolio.ts` — fuente única de datos (cero duplicación). `tagline` solo lo consume `HeroSection.vue` (verificado por grep, 1 uso).
  - `src/components/hero/HeroSection.vue` — descripción + fila de botones (`k-button`).
  - `src/components/hero/GlitchText.vue` — mecánica de activación; keyframes de 42 pasos transpilados intactos.
  - `src/style.css` — scrollbar global (este repo ya sobrescribe tokens/estilos globales aquí).
- **Verificaciones de contexto (enrichment, solo lectura 2026-09-09):**
  - `k-button` en el dist de khatarsis soporta `variant`/`size`/`outlined`/`rounded`/`icon`/`icon-left`/`icon-right`/`href`/`target`/`rel` (misma firma que el GitHub button actual, que ya funciona).
  - Iconos vía `@iconify/vue`: el set mdi resuelve en runtime; `mdi:linkedin` y `mdi:whatsapp` existen en el set mdi (sin bundle previo: se cargan on-demand igual que `mdi:github`).
  - `prefersReducedMotion()` ya existe en `src/composables/useReveal.ts` → reutilizar (cero duplicación, RULES 0.6).
  - Lenis corre en modo ventana: el scrollbar nativo sigue visible → el styling de scrollbar aplica tal cual.
- **Riesgos:**
  1. `::-webkit-scrollbar-button` (flechas) requiere SVG inline por dirección (up/down/left/right); soportado en Chromium/WebKit, Firefox usa `scrollbar-color` sin flechas (aceptado: Firefox no pinta flechas nativas). Riesgo bajo, fallback elegante.
  2. Renombrar `tagline` → `description` toca contrato `Profile` + data + 1 uso: verificado que no hay otros consumidores (grep). Diff mínimo y naming honesto.
  3. El glitch automático corre un timer en un componente siempre montado: obligatorio cleanup en `onBeforeUnmount` (vue-debug-guides: cleanup-side-effects).
  4. La intro GSAP del hero anima `[data-hero]` con `autoAlpha`: el nuevo texto y botones mantienen `data-hero` en sus bloques (no añadir `data-hero` a elementos nuevos independientes ni quitarlo de los existentes).

## Cambios

### 1. `src/data/portfolio.ts` (edit)

- Contrato `Profile`: renombrar `tagline: string` → `description: string` (comentario: descripción del hero en primera persona).
- Valor nuevo (borrador de mejora; el usuario lo ajustará): primera persona, directo, con logros reales — 4+ años construyendo software full stack en Cali, Colombia; suites de servicios públicos usadas por funcionarios en producción, ecommerce SaaS multiempresa, portal de financiación con integraciones de pago (Cencosud, Olímpica, Éxito); mentalidad de entender el porqué de cada solución, no solo el cómo. 2–3 oraciones, tono Jason Cameron sin arrogance forzada.
- Contrato `Contact`: añadir `whatsappUrl: string`; valor `https://wa.me/573054501829?text=Hola%20C%C3%A9sar%2C%20vi%20tu%20portafolio%20y%20me%20gustar%C3%ADa%20hablar%20contigo.` (mensaje precargado URL-encoded).
- `contact.phone` → `'+57 305 450 1829'` (el usuario confirmó que el número cambió).

### 2. `src/components/hero/HeroSection.vue` (edit)

- `{{ profile.tagline }}` → `{{ profile.description }}` (mismo `<p class="max-w-2xl text-lg leading-relaxed text-zinc-400" data-hero>`; tipografía intacta §7).
- Fila `data-hero` existente (`flex flex-wrap items-center gap-4`), orden final:
  1. `k-button` "Conóceme" — sin cambios (primary, `mdi:chevron-down`, scroll a `#perfil`).
  2. `k-button` GitHub — sin cambios (`contact.githubUrl`, `mdi:github`).
  3. **nuevo** `k-button` LinkedIn: clonar firma del GitHub button (`variant="base" size="lg" outlined rounded icon-left`), `:href="contact.linkedinUrl"`, `icon="mdi:linkedin"`, `target="_blank" rel="noopener"`, `aria-label="LinkedIn de César Ríos"`.
  4. **nuevo** `k-button` WhatsApp: misma firma, `:href="contact.whatsappUrl"`, `icon="mdi:whatsapp"`, `target="_blank" rel="noopener"`, `aria-label="Enviar mensaje por WhatsApp a César Ríos"`.

### 3. `src/components/hero/GlitchText.vue` (edit)

- **Props:** eliminar `enableOnHover` (consumidor único sin pasarla; el hover pasa a comportamiento base pedido por el usuario). Queda solo `text: string`.
- **Estado y ciclo:** `const isGlitching = ref(true)`; constantes `ACTIVE_MS = 4000`, `PAUSE_MS = 1000`; un único timer recursivo `scheduleCycle()` que alterna el estado (4s activo → 1s pausa → loop). En `onMounted`: si `prefersReducedMotion()` → no montar ciclo y dejar `isGlitching = false` (texto estático); si no, arrancar ciclo.
- **Hover:** `@pointerenter="restartCycle(true)"` en el `<span>` → activa el efecto al instante y reinicia el conteo (clear del timer + estado activo + próxima alternancia en 4s). Tras el hover, el ciclo automático sigue contando desde cero (comportamiento pedido).
- **Cleanup:** `onBeforeUnmount` limpia el timer (cero fugas).
- **CSS:** capas `::before`/`::after` conservan geometría (`top/left/width/height/padding/overflow/background/pointer-events/user-select`, offsets `±3px`, sombras blancas) y los 42 keyframes intactos; cambia solo la activación:
  - Base: `opacity: 0; animation: none;` (capas ocultas).
  - `.glitch-text--active::before` → `opacity: 1; animation: glitch-animation-1 3s linear infinite;`
  - `.glitch-text--active::after` → `opacity: 1; animation: glitch-animation-2 3s linear infinite;`
  - Eliminar la variante `.glitch-text--hover` y su bloque en `prefers-reduced-motion` (el base ya no anima; reduced-motion solo necesita `content: none`/`animation: none` en las capas base + la clase activa nunca se aplica).
- **Template:** `:class="{ 'glitch-text--active': isGlitching }"` + `:data-text="text"` + `@pointerenter` intacto el render del texto (no se recrea el elemento: sin re-render del nombre).

### 4. `src/style.css` (edit)

- Bloque scrollbar global (después de `::selection`), color `#995CD0` (tinte exacto del faulty terminal):
  - Firefox: `html { scrollbar-width: thin; scrollbar-color: #995CD0 transparent; }`
  - WebKit: `::-webkit-scrollbar { width: 12px; height: 12px; }`; `::-webkit-scrollbar-track { background: transparent; }`; `::-webkit-scrollbar-thumb { background-color: #995CD0; border-radius: 9999px; border: 3px solid transparent; background-clip: content-box; }` (thumb con padding óptico).
  - Flechas: `::-webkit-scrollbar-button:single-button` con `background-color: transparent`, `background-repeat: no-repeat`, `background-position: center`, tamaño `12px`, y 4 reglas direccionales (`:vertical:decrement`, `:vertical:increment`, `:horizontal:decrement`, `:horizontal:increment`) con SVG data-URI chevron `stroke='#995CD0'` rotado por dirección. Hover de thumb/flechas: `#B27FE3` (variante más clara del mismo morado).
  - Todo en CSS plano del archivo (sin valores arbitrarios Tailwind `[...]`; §7 no aplica a CSS custom de este archivo, que ya sobrescribe estilos globales).

## Restricciones

- RULES 0.3: las tres piezas pedidas explícitamente (hero+datos, glitch, scrollbar); sin subcomponentes nuevos.
- RULES 0.4: sin `dev`/`build`/`preview` ni `bun add` sin autorización aparte; gestor bun; no ejecutar Git; no eliminar archivos.
- CODING_STANDARDS §7: cero márgenes (separación con `gap`/`padding`), cero `[...]` en clases Tailwind, sin alterar tipografía heredada (`leading-relaxed`/`text-lg` del párrafo se mantienen).
- RULES 0.6: `prefersReducedMotion()` reutilizado del composable existente, sin duplicarlo.
- ADR-001: nada de `scroll-behavior: smooth`; el styling del scrollbar no interfiere con Lenis (modo ventana).
- Keyframes del glitch (42 pasos) intocados: solo cambia la mecánica de activación.
- Skills subordinadas (vue-best-practices: cleanup de listeners/timers; accessibility: `aria-label` + reduced-motion + contraste del thumb): referencias; prevalece el estándar local.
- Licencia: jasoncameron.dev solo inspira la estructura del texto (primera persona + logros); no se copia markup ni CSS.

## Steps

1. **edit** `src/data/portfolio.ts`: renombrar `tagline` → `description` en la interfaz `Profile` + nuevo valor redactado; añadir `whatsappUrl` a `Contact` con URL wa.me + texto precargado; actualizar `phone` a `+57 305 450 1829`.
2. **edit** `src/components/hero/HeroSection.vue`: `profile.description` en el párrafo; añadir botones LinkedIn y WhatsApp tras el GitHub existente (firma clonada del GitHub button, con `aria-label`).
3. **edit** `src/components/hero/GlitchText.vue`: quitar prop `enableOnHover`; añadir estado `isGlitching` + ciclo `4s/1s` con timer único + `restartCycle(true)` en `pointerenter` + reduced-motion vía `prefersReducedMotion()` + cleanup; CSS: base oculta, activación por `.glitch-text--active`, eliminar `--hover`; keyframes intactos.
4. **edit** `src/style.css`: bloque scrollbar (Firefox + WebKit + flechas SVG moradas + hover).
5. **verificar** `bun run lint:check` + `bun run format:check` (inspección segura); `build`/`dev` requieren autorización aparte.

## Verificacion

- `bun run lint:check` exit 0 + `bun run format:check` exit 0.
- `bun run build` (autorización aparte): sin errores nuevos en los 4 archivos del plan (persisten los 10 preexistentes documentados en `portfolio-estructura-router-vistas`).
- `bun run dev` (autorización aparte): descripción en primera persona visible; 4 botones funcionales (WhatsApp abre chat con mensaje precargado al +57 305 450 1829); glitch visible 4s cada 5s, hover lo activa al instante y reinicia el conteo; scrollbar morada (thumb + flechas) al hacer scroll; reduced-motion: texto estático sin ciclo y scrollbar sin animación; consola limpia.
- Manual: verificar wrap del nombre con las capas activas/inactivas (el glitch no desplaza layout); verificar que la intro GSAP del hero sigue funcionando con los nuevos bloques `data-hero`.

## Revisión del orquestador — pendiente de aprobación a READY

- Cumple exactamente lo pedido: descripción primera persona (estructura jasoncameron.dev), GitHub+LinkedIn+WhatsApp con mensaje precargado (Conóceme conservado), scrollbar morada `#995CD0` (thumb+flechas), glitch 4s/5s con hover inmediato que reinicia.
- No inventa cambios: el rename `tagline`→`description` y la retirada de `enableOnHover` son consecuencias directas y documentadas de lo pedido (1 consumidor cada uno, verificado por grep).
- Respeta RULES (0.3/0.4/0.6), CODING_STANDARDS §7, ADR-001; keyframes del glitch intactos; `prefersReducedMotion()` reutilizado; cleanup del timer.
- APIs verificadas contra el código real de khatarsis (`outlined`/`icon` + set mdi vía @iconify/vue) y del repo (`useReveal.ts`).
- Decisiones a validar por el usuario: borrador de descripción se redacta en ejecución desde la bio (el usuario la ajustará después); texto precargado de WhatsApp es borrador editable.
- No marco READY automático: espero tu visto bueno.
- **READY otorgado (2026-09-09):** el usuario respondió con la frase exacta "ejecuta el plan" tras la revisión anterior comunicada → visto bueno del enriquecido + autorización de ejecución. Executor invocado con plan READY.

## Cierre (memoria persistente)

- Que cambio (ejecutado 2026-09-09, alcance del plan sin redefinir):
  - EDIT `src/data/portfolio.ts`: contrato `Profile.tagline` → `Profile.description` (comentario de intención); nueva descripción en primera persona con logros reales (suites de servicios públicos, ecommerce SaaS, integraciones Cencosud/Olímpica/Éxito, mentalidad de entender el porqué); contrato `Contact` + `whatsappUrl` (`https://wa.me/573054501829?text=...` con mensaje precargado); `phone` actualizado a `+57 305 450 1829`.
  - EDIT `src/components/hero/HeroSection.vue`: párrafo del hero renderiza `profile.description` (clases y `data-hero` intactos); botones LinkedIn (`mdi:linkedin`, `contact.linkedinUrl`) y WhatsApp (`mdi:whatsapp`, `contact.whatsappUrl`) clonando la firma del GitHub button, con `aria-label`, `target="_blank" rel="noopener"`; orden final Conóceme · GitHub · LinkedIn · WhatsApp.
  - EDIT `src/components/hero/GlitchText.vue`: fuera la prop `enableOnHover`; ciclo automático con timer único recursivo (`ACTIVE_MS = 4000` activo → `PAUSE_MS = 1000` pausa), arranca en `onMounted` salvo `prefersReducedMotion()`; `@pointerenter="restartCycle()"` activa al instante y reinicia el conteo; cleanup `onBeforeUnmount(clearCycle)`; CSS: capas base `opacity: 0` (geometría fusionada en un solo bloque, sin duplicación), activación por `.glitch-text--active`, variante `--hover` eliminada; los 42 keyframes transpilados intactos.
  - EDIT `src/style.css`: scrollbar global — Firefox `scrollbar-width: thin; scrollbar-color: #995cd0 transparent`; WebKit: track transparente, thumb `#995cd0` redondeado con `background-clip: content-box` y borde transparente de 3px, hover `#b27fe3`; `::-webkit-scrollbar-button:single-button` con chevrons SVG data-URI (`fill='%23995CD0'`) por dirección (vertical/horizontal × decrement/increment) y equivalentes al hover en `#B27FE3`.
- Verificacion: `bun run lint:check` exit 0 y `bun run format:check` exit 0 ("All matched files use Prettier code style!"). Fix intra-ejecución: 2 errores `vue/attributes-order` (aria-label antes de icon-left) corregidos y re-verificados en verde. Pendiente por regla 0.4: `bun run build` y `bun run dev` (requieren autorización aparte).
- Resultado: pendiente — no pasa a CLOSED hasta validar build + visual (o aceptación explícita del pendiente) según DoD.
- Pendientes: autorizar `bun run build` (persisten los 10 errores `vue-tsc` preexistentes documentados en `portfolio-estructura-router-vistas`, ajenos a este plan) y `bun run dev` (prueba visual: descripción, 4 botones con WhatsApp al +57 305 450 1829, glitch 4s/5s + hover con reinicio, scrollbar morada, reduced-motion). Ajuste posterior de la descripción a cargo del usuario (decisión registrada).
