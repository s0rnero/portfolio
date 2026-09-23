---
name: portfolio-glitch-text-sass-transpilado
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-08 12:00
enriched: 2026-09-08 12:00
executed: 2026-09-08
---

# Plan: GlitchText desde SASS transpilado con herramienta real

> El port manual no es fiel: al quitar el recorte lateral de la referencia las bandas quedaron de ancho completo y el efecto lee como "escaneo" en vez de glitch. Este plan transpila el SASS original con dart-sass (herramienta oficial) y vuelca el resultado mecánicamente al componente.

## Objetivo

- Keyframes `glitch-animation-1/2` auténticos (21 pasos con `rect()` aleatorios generados por el `@for`/`random()` del SASS original), escalados mecánicamente a `em` (÷100, la fuente de referencia es 100px), con recorte lateral restaurado (el "chunk" desplazado es el corazón del glitch).

## Alcance

- `src/components/GlitchText.vue` (edit, solo keyframes; resto intacto, duración 3s intacta).
- `bun add -d sass` temporal para transpilar y `bun remove sass` después (huella cero en `package.json`/`bun.lock`).
- Archivos temporales de trabajo fuera del repo (`Temp/opencode`), nunca en `src/`.

## Restricciones

- Herramienta real: paquete npm `sass` (dart-sass JS, sin binarios). El `.sass` indentado se detecta por extensión; `random()`/`percentage()` se evalúan en compilación como en CodePen.
- Conversión px→em estrictamente mecánica (÷100, 4 valores del `rect()` por paso); propiedad `clip: rect()` verbatim (deprecada pero funcional en navegadores); sin re-aleatorizar a mano ni retocar valores.
- Una sola compilación = una variante auténtica (como CodePen al guardar). No compilar dos veces mezclando pasos.
- Resto del componente intacto (capas opacas, sombra blanca, offsets ±3px, 3s, hover, reduced-motion). `HeroSection.vue` sin cambios. Standards §7.
- No dev/build sin autorización (regla 0.4).

## Especificación técnica (enrichment)

### Fuente SASS exacta (guardar tal cual en temporal)

El SASS compartido por el usuario en chat (sintaxis indentada `.sass`, con `content: "Cesar Rios"` — el texto solo afecta al `content`, irrelevante para los keyframes; se guarda verbatim). Ruta temporal fuera del repo: `C:\Users\s0rno\AppData\Local\Temp\opencode\glitch-ref.sass`.

### Comandos (gestor bun, huella cero)

1. `bun add -d sass` (dart-sass JS puro, sin binarios; detecta `.sass` indentado por extensión — verificado en docs oficiales sass-lang.com).
2. `bunx sass glitch-ref.sass glitch-ref.css` (one-to-one; sin output → imprime a terminal; preferir archivo para extraer). Warnings de `random()` global deprecado, si aparecen, no invalidan el CSS.
3. Leer `glitch-ref.css`, extraer íntegros los dos `@keyframes` (21 `clip:` cada uno; contar para validar).
4. `bun remove sass`; verificar en `package.json`/`bun.lock` que no queda rastro.
5. Borrar temporales.

Nota: `random(150)` se evalúa en compilación → una compilación = una variante auténtica (igual que CodePen al guardar). No recompilar mezclando pasos.

### Conversión mecánica px→em (única transformación permitida)

Regla: dividir los 4 valores entre 100 (fuente de referencia: 100px). Propiedad `clip: rect()` verbatim (deprecada pero funcional).
Ejemplo: `clip: rect(42px, 350px, 87px, 30px)` → `clip: rect(0.42em, 3.5em, 0.87em, 0.3em)`.
Así se restauran el recorte lateral (chunk desplazado ±3px visible) y la escala proporcional a `text-6xl`.

### Edit en `GlitchText.vue`

- Sustituir únicamente los dos bloques `@keyframes glitch-animation-1/2` por los transpilados+convertidos.
- Intacto: capas, offsets, sombra, duración 3s, hover, reduced-motion, plantilla, props.
- Añadir comentario de crédito al autor del pen en la cabecera del `<style>` (los pens públicos de CodePen son MIT por defecto).

## Revisión del orquestador — pendiente de aprobación a READY

- Alcance mínimo (solo keyframes), herramienta oficial, huella cero verificable, conversión mecánica sin criterio manual.
- Riesgo: necesita red para `bun add sass`; si falla, se reporta y se frena (sin inventar valores).
- No marco READY automático: espero tu visto bueno.

## Pasos

1. `bun add -d sass`; guardar el SASS original del usuario tal cual en temporal (`ref.sass`).
2. `bunx sass ref.sass ref.css` (o `bun run` equivalente); extraer los dos `@keyframes` completos del CSS resultante.
3. Convertir cada `clip: rect(Tpx, 350px, Bpx, 30px)` → `clip: rect(Tem, 3.5em, Bem, 0.3em)` (÷100); verificar 21 pasos por animación.
4. **edit** `GlitchText.vue`: sustituir solo los dos bloques `@keyframes` por los transpilados.
5. `bun remove sass`; `bun run lint:check` + `bun run format:check`.
6. Verificación visual en `dev` (autorización aparte).

## Verificacion

- `lint:check` + `format:check` exit 0; `package.json` sin rastro de `sass`.
- `dev` (autorización aparte): chunks desplazados ±3px con recorte lateral (no bandas completas), ritmo 3s, comparar con el pen.
- `build` (autorización aparte).

## Cierre (memoria persistente)

- Que cambio: Keyframes de `GlitchText.vue` sustituidos por los 42 `clip: rect()` auténticos del SASS original transpilado con dart-sass 1.104.0 (`bun add -d sass` → `bunx sass` → conversión mecánica ÷100 a em, propiedad `rect()` verbatim con recorte lateral restaurado) + crédito al autor. Resto intacto (capas, 3s, hover, reduced-motion).
- Huella cero: `bun remove sass` + `bun install`, eliminado `node_modules/sass`, shims `.bin`, entrada huérfana de `bun.lock` y temporales. Verificado: `package.json` limpio, `node_modules/sass` ausente, en `bun.lock` solo quedan los `peer` opcionales stock de vite.
- Verificacion: `lint:check` exit 0; `format:check` exit 0. Pendiente por regla 0.4: `bun run build` y `bun run dev` (comparativa visual con el pen).
- Resultado: pendiente — no pasa a CLOSED hasta validar build + visual (o aceptación explícita del pendiente) según DoD.
- Pendientes: autorizar `bun run build` y/o `bun run dev`.
- Fix post-ejecución (ancho completo, 2026-09-08): a petición del usuario, recorte lateral a 0 (bandas a ancho completo del texto); se conservan los top/bottom auténticos transpilados. Nota: el chunk parcial de la referencia desaparece; si vuelve el efecto "escaneo", la alternativa es restaurar recorte parcial.
- Corrección del fix (2026-09-08): `rect(top, 0, bottom, 0)` es región vacía (derecha e izquierda en 0 = nada visible). Ancho completo real: `rect(top, 100em, bottom, 0)` — derecha amplia que cubre cualquier ancho, izquierda en 0.
