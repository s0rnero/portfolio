---
name: portfolio-glitch-text-fidelidad
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-08 12:00
enriched: 2026-09-08 12:00
executed: 2026-09-08
---

# Plan: GlitchText fiel a la referencia fabiowallner/ozZoYo

> Referencia: `https://codepen.io/fabiowallner/pen/ozZoYo` (SASS aportado por el usuario en chat; inspección del pen confirmada). Estado actual: `src/components/GlitchText.vue` (reescritura con capas transparentes + `clip-path: inset()` en %) no es fiel al resultado final.

## Objetivo

- Replicar la mecánica visual exacta de la referencia sobre el nombre del hero: slices opacos con bandas `clip: rect()` aleatorias, sombras blancas y loop de 2s.

## Alcance

- `src/components/GlitchText.vue` (edit, solo `<style scoped>` y ajustes mínimos de plantilla si hacen falta).
- `src/components/HeroSection.vue`: sin cambios (sigue `<glitch-text :text="...">` dentro del `h1[data-hero]`; intro GSAP intacta).

## Diferencias detectadas (actual vs referencia)

1. **Capas transparentes vs opacas:** actual `background: transparent` (ghosting); referencia `background: black` en `::before/::after` (slices sólidos que tapan el texto base salvo la banda recortada). Es la diferencia dominante.
2. **Sombras:** actual sin sombra (decisión previa); referencia `text-shadow: -2px 0 white` en ambas capas.
3. **Recorte:** actual `clip-path: inset(t% 0 b% 0)` en %; referencia `clip: rect(random(150)px, 350px, random(150)px, 30px)` — px fijos con top/bottom aleatorios 0–150px. `clip` está deprecado → equivalente moderno `clip-path: inset()` con valores pre-generados al escribir el archivo.
4. **Alineación:** referencia repite `padding: 30px` en base y capas + `left: ±3px`, `width/height: 100%`; mantener la equivalencia actual (`padding: inherit`, capas del mismo tamaño que el texto) verificando que el wrap coincide.
5. **`animation-direction: reverse-alternate` es CSS inválido** (los navegadores lo ignoran → dirección normal efectiva); decidir en enrichment si se replica literal o se normaliza.

## Restricciones

- Fidelidad manda, pero con consecuencia visible: las bandas negras opacas taparán el fondo animado (faulty-terminal) en cada slice. Queda flagged para revisión del usuario en `ENRICHED → READY`.
- `CODING_STANDARDS.md` §7: sin valores arbitrarios `[...]` (todo va al `<style scoped>`), sin alterar tipografía heredada del `h1`, cero márgenes.
- Tipografía del hero intacta (la referencia usa `font-size: 100px` propio; aquí el tamaño lo manda el `h1`).
- `prefers-reduced-motion`: texto estático (ya existe, mantener).
- Variante `enableOnHover`: mantener comportamiento actual salvo que rompa fidelidad.
- No ejecutar dev/build sin autorización (regla 0.4). Un componente (regla 0.3).

## Pasos

1. Reescribir `<style scoped>` de `GlitchText.vue`: capas opacas negras, `text-shadow` blanca, keyframes `glitch-animation-1/2` de 21 pasos con bandas pre-generadas equivalentes al `rect()` aleatorio de la referencia, loop 2s linear.
2. Ajustar plantilla/props solo si la fidelidad lo exige (mínimo necesario).
3. `bun run lint:check` + `bun run format:check`.
4. Verificación visual en `dev` (autorización aparte, regla 0.4).

## Verificacion

- `bun run lint:check` + `bun run format:check` exit 0.
- `bun run dev` (autorización aparte): comparar con la referencia — slices negros opacos con bandas blancas, offsets ±3px, loop 2s, wrap idéntico base/capas, intro GSAP intacta, reduced-motion estático.
- `bun run build` (autorización aparte).

## Especificación técnica (enrichment)

Solo `src/components/GlitchText.vue`. Plantilla y props (`text`, `enableOnHover`) intactas; se reescribe `<style scoped>`:

```css
.glitch-text { position: relative; display: inline-block; }

.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: inherit;
  overflow: hidden;
  background: #000;
  pointer-events: none;
  user-select: none;
}
.glitch-text::before {
  left: 3px;
  text-shadow: -2px 0 #fff;
  animation: glitch-animation-1 2s linear infinite;
}
.glitch-text::after {
  left: -3px;
  text-shadow: -2px 0 #fff;
  animation: glitch-animation-2 2s linear infinite;
}
```

- Bandas: `clip-path: inset(top 0 bottom 0)` con top/bottom pseudo-aleatorios pre-generados en `em` (equivalente escalable al `rect()` aleatorio de la referencia a 100px: `÷100`). Los insets laterales fijos de la referencia (`right 350px / left 30px`) se omiten: en texto fluido multilínea recortaban permanentemente los costados (ver fix de cobertura abajo).
- `glitch-animation-1` (top/bottom por paso, cada 5%): `0% .32/.91 · 5% 1.12/.28 · 10% .05/1.33 · 15% .87/.44 · 20% 1.41/.09 · 25% .63/.72 · 30% .18/1.21 · 35% 1.05/.55 · 40% .47/.98 · 45% 1.28/.16 · 50% .74/.61 · 55% .09/1.44 · 60% 1.36/.37 · 65% .52/.83 · 70% .95/.26 · 75% 1.18/.68 · 80% .29/1.07 · 85% .81/.49 · 90% 1.47/.05 · 95% .58/1.15 · 100% .99/.33`
- `glitch-animation-2`: `0% 1.02/.41 · 5% .23/1.29 · 10% .78/.66 · 15% 1.35/.12 · 20% .44/.93 · 25% 1.19/.58 · 30% .07/1.38 · 35% .89/.34 · 40% 1.26/.71 · 45% .51/.19 · 50% 1.43/.88 · 55% .16/1.04 · 60% .93/.47 · 65% 1.31/.22 · 70% .62/.79 · 75% .35/1.22 · 80% 1.08/.53 · 85% .69/.97 · 90% 1.24/.08 · 95% .42/1.36 · 100% .86/.61`
- Timing `linear` (fiel; interpola entre bandas como la referencia). Dirección: la referencia declara `reverse-alternate` (CSS inválido, ignorado → `normal` efectivo); se escribe `normal` válido con nota en comentario.
- `.glitch-text--hover` y `@media (prefers-reduced-motion: reduce)` se mantienen tal cual están.
- Sin props nuevas, sin tocar `HeroSection.vue`, sin `[...]`, sin tipografía propia.

## Revisión del orquestador — pendiente de aprobación a READY

- Fiel a la referencia en mecánica (capas opacas, sombra blanca, bandas aleatorias, 2s linear) y escalable (em).
- Alcance mínimo (1 archivo, solo estilos). Standards §7 OK.
- Consecuencia asumida: slices negros opacos sobre el fondo faulty-terminal.
- No marco READY automático: espero tu visto bueno.

## Cierre (memoria persistente)

- Que cambio: Reescrito `<style scoped>` de `src/components/GlitchText.vue` fiel a fabiowallner/ozZoYo — capas opacas `#000`, `text-shadow: -2px 0 #fff`, offsets ±3px, keyframes de 21 pasos con bandas `clip-path: inset()` en em pre-generadas (equivalente escalable al `rect()` aleatorio), loop 2s linear, `reverse-alternate` normalizado a `normal` (inválido en CSS). Plantilla, props, variante hover y reduced-motion intactos; `HeroSection.vue` sin cambios.
- Verificacion: `lint:check` exit 0; `format:check` exit 0. Pendiente por regla 0.4: `bun run build` y `bun run dev` (comparativa visual con la referencia).
- Resultado: pendiente — no pasa a CLOSED hasta validar build + visual (o aceptación explícita del pendiente) según DoD.
- Pendientes: autorizar `bun run build` y/o `bun run dev`.
- Fix post-ejecución (cobertura, 2026-09-08): los insets laterales fijos de la referencia (`right 3.5em`) recortan permanentemente el lado derecho en un nombre largo multilínea → bandas a ancho completo (`right/left 0`), se conserva el aleatorio vertical. Desviación justificada de la referencia.
- Fix post-ejecución (reversión + ritmo, 2026-09-08): se revierten el default `enableOnHover: false` y la prop `speed` (no solicitados) → default `true` de nuevo, sin props nuevas; duración fija 3s directo en el CSS, como pide el usuario.

> Completar al cerrar (DoD de `.agents/WORKFLOW.md`).

- Que cambio: [resumen real]
- Verificacion: [comando ejecutado y resultado, o pendiente con motivo]
- Resultado: [aprobado / no necesario / pendiente aceptado explicitamente]
- Pendientes: [si existen]
