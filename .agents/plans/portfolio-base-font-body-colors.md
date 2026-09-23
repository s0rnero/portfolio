---
name: portfolio-base-font-body-colors
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-11 12:00
enriched: 2026-09-11 12:30
updated: 2026-09-11 12:30
---

# Plan Tecnico: Base font 14px + body theme colors + regla Tailwind-first (@apply)

## Analisis

- **Objetivo:** (1) Base tipográfica global de 14px vía Tailwind `@apply` sin sintaxis arbitraria; (2) `body` con `text-black` en light y `text-white` en dark (clase `.dark` en `<html>` gestionada por `useTheme`) vía `@apply`; (3) Asentar regla permanente Tailwind-first con `@apply` en `.agents/CODING_STANDARDS.md` §7; (4) Auditoría completa de `src/` para justificar excepciones CSS nativas.
- **Scope:** 2 edits, 0 creates, 0 deletes. Archivos a editar: `src/style.css` + `.agents/CODING_STANDARDS.md`. Todo `src/` auditado (25 archivos); fuera de alcance: componentes, vistas, router, composables, datos, i18n, `BlackWallAnimation.vue` conservado, dependencias, tipografía tracking/leading.
- **Archivos verificados 2026-09-11 (lectura real):**
  - `src/style.css:1-100` — `@import 'tailwindcss'`, `@custom-variant dark`, `:root --kt-*`, `body {font-family, -webkit-font-smoothing, -moz-osx-font-smoothing}`, `::selection`, `html {scrollbar-width/color}`, `::-webkit-scrollbar*` con `background-image: url(data:svg)` — baseline confirmado.
  - `src/App.vue` — `main class="relative min-h-screen bg-white text-black dark:bg-neutral-900 dark:text-white"` — ya dark-aware, complementario a `body`.
  - `.agents/CODING_STANDARDS.md` — §7 reglas 1-5 vigentes, §8 Quick Reference sin fila Tailwind, versión 1.1.
  - `vite.config.ts` — `@tailwindcss/vite` activo, alias `@` correcto — `@apply` compila sin config extra.
  - Todos los `.vue`/`.ts` auditados — sin `font-size:` nativo fuera de `style.css`.
- **Riesgos:**
  1. `@apply text-sm` en `html` no resuelva a 14px → mitigado: `text-sm` = `0.875rem`; sobre `html` (root) `0.875 × 16px = 14px` exactos, sin `[...]` (cumple §7 regla 5). Verificado en docs Tailwind 4 + `@tailwindcss/vite`.
  2. `antialiased` no cubra `-moz-osx-font-smoothing` → mitigado: utilidad Tailwind la incluye (genera ambas).
  3. Regresión visual por nuevo `html { @apply text-sm }` afectando escalas `rem` → mitigado: es el cambio buscado; todos los tokens `rem` escalan proporcionalmente (0.875×); ningún componente fija `font-size` en `px` que lo rompa (auditoría confirma).

## Cambios

### 1. `.agents/CODING_STANDARDS.md` (edit)

**Ubicación:** §7 después del item 5, y §8 Quick Reference.

**Diff exacto §7 — añadir regla 6:**

```markdown
6. **Tailwind-first obligatorio con `@apply`**: todo estilo visual se resuelve con Tailwind CSS. En archivos `.css` y `<style>` se usan utilidades via `@apply` (ej. `body { @apply text-black dark:text-white; }`) en lugar de CSS nativo directo (`color: #000`). Solo se permite CSS nativo cuando (a) el usuario lo solicite explícitamente o (b) el requerimiento sea imposible con Tailwind (ej.: `scrollbar-color`, `scrollbar-width`, `background-image` con SVG data-uri para flechas, `@keyframes`/`clip`/`mix-blend-mode`, `backdrop-filter` con máscaras dinámicas, `radial-gradient` complejos, variables de librería como `--kt-*`). Cada excepción debe quedar documentada en el plan.
```

**Diff §8 — añadir fila:**

```markdown
| Tailwind | `@apply` + utilidades; CSS nativo solo si es imposible o usuario lo pide | Escribir `color:`, `background:`, `font-size:` nativos pudiendo usar `@apply` |
```

Bump footer: `Ultima actualizacion: Septiembre 2026` (ya está) / `Version: 1.2 (Tailwind-first + base 14px)`.

### 2. `src/style.css` (edit)

**Estado actual líneas 1-20 (confirmado):**

```css
@import 'tailwindcss';
@import 'khatarsis/style.css';

/* Class-based dark mode for Tailwind 4: `.dark` on <html> toggled by useTheme. */
@custom-variant dark (&:where(.dark, .dark *));

/* Khatarsis primary accent → violet ... */
:root { --kt-* }

body {
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**Diff a aplicar (reemplaza la propuesta nativa anterior `font-size:14px` / `color:#000`):**

```diff
 @import 'tailwindcss';
 @import 'khatarsis/style.css';

 /* Class-based dark mode for Tailwind 4: `.dark` on <html> toggled by useTheme. */
 @custom-variant dark (&:where(.dark, .dark *));

+html {
+  @apply text-sm;
+}
+
 /* Khatarsis primary accent ... */
 :root { ... }

 body {
+  @apply text-black antialiased dark:text-white;
   font-family:
     ui-sans-serif,
     system-ui,
     -apple-system,
     'Segoe UI',
     Roboto,
     sans-serif;
-  -webkit-font-smoothing: antialiased;
-  -moz-osx-font-smoothing: grayscale;
 }
```

- `html { @apply text-sm; }` = 14px base, sin `[...]`, sin `font-size:` nativo.
- `body { @apply text-black antialiased dark:text-white; }` = light negro, dark blanco vía `@custom-variant dark`; `antialiased` sustituye `-webkit/moz-*`.
- `font-family` se mantiene nativo (excepción documentada: stack explícito sin token 1:1).

### 3. Auditoria — justificación excepciones nativas (sin cambios)

| Archivo | CSS nativo | Motivo imposible con Tailwind | Acción |
|---|---|---|---|
| `src/style.css` `:root --kt-*`, `::selection`, `scrollbar-*`, `::-webkit-scrollbar-button` SVG | tokens librería, scrollbars, flechas data-uri | sin utilidades | mantener, documentado |
| `TopGradualBlur.vue` `backdropFilter/maskImage` dinámicos | cálculo por `computed` | no estático | mantener |
| `GlitchCursor.vue` 5 `@keyframes`, `mix-blend-mode`, `cursor:none` | animación clip/jitter | sin utilidades | mantener |
| `GlitchText.vue` `attr(data-text)`, `clip:rect()`, 2 `@keyframes` | clip 21 pasos | sin utilidades | mantener |
| `Crt.vue` `radial-gradient`, `box-shadow` multicapa, `will-change` | efecto artístico | sin utilidades | mantener |

Ningún archivo migrará su CSS nativo en este plan; la nueva regla los ampara.

## Restricciones

- `.agents/RULES.md` 0.3 (cambios acotados, sin subcomponentes), 0.4 (no `bun run dev/build/preview/lint` sin autorización), 0.13 + §2.1 English-Only (código/comentarios en inglés).
- `.agents/CODING_STANDARDS.md` §7 reglas 1-5 intactas; nueva 6 no contradice ninguna skill; `tailwind-css-patterns` subordinada al estándar local.
- No deps nuevas, no `width/height` fijos con flex, `min-w-0` solo justificado, cero márgenes salvo pedido.
- Mantener `@custom-variant dark` y `main` existente en `App.vue`.

## Steps

1. **read** `src/style.css`, `.agents/CODING_STANDARDS.md`, `.agents/RULES.md`, `.agents/DESIGN.md` — confirmar baseline sin cambios desde 2026-09-11 12:15.
2. **edit** `.agents/CODING_STANDARDS.md`: insertar regla 6 Tailwind-first en §7 tras item 5; añadir fila Tailwind en §8 Quick Reference; bump `Version: 1.2`.
3. **edit** `src/style.css`: añadir bloque `html { @apply text-sm; }` tras `@custom-variant`; editar bloque `body` para añadir `@apply text-black antialiased dark:text-white;` al inicio y retirar `-webkit-font-smoothing` / `-moz-osx-font-smoothing` (reemplazados por `antialiased`).
4. **read/review** diffs: verificar 0 `font-size:`, `color:`, `-webkit-font-smoothing` nativos nuevos fuera de excepciones documentadas; `html` no usa `[...]`.
5. **verificar** (requiere autorización): `bun run build` debe compilar `@apply` sin errores nuevos; `bun run dev` debe mostrar `getComputedStyle(document.documentElement).fontSize === '14px'` y `body` alterna `rgb(0,0,0)`/`rgb(255,255,255)` al togglear `.dark`.
6. **reviewer** aplicar `.agents/subagents/reviewer.md` + DoD antes de `CLOSED`; escribir memoria de cierre.

## Verificacion

- **Inspección estática (sin permiso):** `src/style.css` contiene `html { @apply text-sm; }` y `body { @apply text-black antialiased dark:text-white; }`; 0 `font-size: 14px` / `color: #` nativos en esos bloques; `.agents/CODING_STANDARDS.md` contiene regla 6 y fila Quick Reference.
- **Scripts reales (con autorización explícita):**
  - `bun run build` (`vue-tsc -b && vite build`) — debe pasar sin errores NUEVOS en estos 2 archivos (deuda preexistente de `khatarsis` ya documentada en planes anteriores se separa).
  - `bun run dev` — visual: `14px` computado y contraste body correcto en light/dark.
- **Criterios visuales:** recargar `/`, togglear tema (sol/luna), body hereda negro/blanco; secciones siguen Tailwind y `antialiased`; scrollbar morada y efectos glitch/crt intactos.

## Revision del orquestador — pendiente de aprobacion a READY

- Cumple lo pedido: 14px + body colors ahora vía `@apply` (corrige propuesta nativa previa).
- Auditoría completa (25 archivos) con excepciones justificadas para nueva regla Tailwind-first.
- Sin alcance extra: solo 2 edits, sin tocar componentes ni crear archivos.
- Respeta RULES / CODING_STANDARDS §7 / DESIGN; `tailwind-css-patterns` validada y subordinada.
- Pasos ejecutables con archivos y diffs exactos; verificación separada con autorización.

## Cierre (memoria persistente)

- Que cambio: Editado `src/style.css` — añadido `html { @apply text-sm; }` tras `@custom-variant dark` (14px base, 0.875rem sin `[...]`) y `body { @apply text-black antialiased dark:text-white; }` al inicio del bloque `body`, retirando `-webkit-font-smoothing`/`-moz-osx-font-smoothing` (reemplazados por `antialiased`). `font-family` intacto. Editado `.agents/CODING_STANDARDS.md` §7 regla 6 Tailwind-first con `@apply` + fila Tailwind en §8 Quick Reference + bump a v1.2. Auditoría de 25 archivos verificada: 20 sin CSS nativo, 5 con excepción nativa documentada/imposible con Tailwind (scrollbars/SVG, `@keyframes`/`clip`/`mix-blend-mode`, `backdrop-filter` dinámico, `radial-gradient`/`box-shadow`).
- Verificacion: Inspección estática 2026-09-11 — `src/style.css` contiene `html { @apply text-sm; }` y `body { @apply text-black antialiased dark:text-white; }`; 0 `font-size: 14px`/`color: #`/ `-webkit-font-smoothing` nativos nuevos fuera de excepciones; `@custom-variant dark` intacto. Build/dev no ejecutados por RULES 0.4 (requieren autorización explícita); quedan pendientes.
- Resultado: pendiente — plan permanece EXECUTED hasta validar `bun run build` y `bun run dev` visual (14px computado + body alterna `rgb(0,0,0)`/`rgb(255,255,255)` con `.dark`) o aceptación explícita del pendiente según DoD.
- Pendientes: autorizar `bun run build` (`vue-tsc -b && vite build` debe compilar `@apply` sin errores nuevos) y `bun run dev` (verificación visual 14px + contraste body + scrollbar/glitch/CRT intactos).
