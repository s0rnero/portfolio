---
name: portfolio-liquid-ether-fondo
status: CLOSED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-08 12:00
closed: 2026-09-08
---

# Plan: Fondo global LiquidEther (vue-bits) en el portafolio

> Fuente: código `LiquidEther` aportado por el usuario en chat (origen vue-bits.dev/backgrounds/liquid-ether). BlackWall queda descartado: `src/components/BlackWallAnimation.vue` permanece en el repo SIN USAR (no eliminar).

## Objetivo

- Fondo global animado estilo LiquidEther (fluido WebGL reactivo al mouse + auto-demo) detrás de las 6 secciones, con paleta del portafolio (rojo dominante, azul, negro).

## Licencia (verificado 2026-09-08)

- **vue-bits: MIT + Commons Clause** (`DavidHDev/vue-bits`, LICENSE.md). Uso permitido: copiar, modificar y distribuir **como parte de una aplicación/website/producto** (el portafolio califica). Condiciones obligatorias:
  1. Incluir el copyright notice (`Copyright (c) 2025 David Haz`) + aviso de permiso en el archivo adaptado. Ya colocado además como comentario visible en `index.html` (inspeccionable, con mención de uso desde 2026).
  2. **Prohibido** vender, sublicenciar o redistribuir los componentes como tales (solos, en bundle, template o port).
- **`three`: MIT** → dependencia permitida; entra por `bun add`.

## Veredicto minimotor khatarsis (verificado solo dentro del repo, 2026-09-08)

- El `dist` instalado de khatarsis **no incluye three.js** (0 hits `three`/`REVISION`) y no hay `three` resoluble en `node_modules` (ni anidado en khatarsis). `useFluidSimulation` existe pero no es LiquidEther.
- **Conclusión: el código LiquidEther NO corre con el minimotor sin dependencias nuevas.** Necesita `three`.
- Si se quiere versión sin `three` (port del solver al minimotor `createRenderer/createProgram`), es cambio mayor en khatarsis → lo pide el usuario al agente de khatarsis. Vía recomendada aquí: `bun add three` y adaptar el componente aportado.

## Alcance

- `src/App.vue` (edit): retirar `<black-wall-animation>` + import; montar el nuevo fondo primero en `main`.
- `src/components/LiquidEtherBackground.vue` (create): adaptación del código aportado a fondo global.
- `package.json` / `bun.lock` (edit vía `bun add three`, + `@types/three` si el tipado lo exige).
- `BlackWallAnimation.vue`: no se toca, no se elimina.
- No se tocan secciones, datos ni hero.

## Restricciones

- Licencia: copyright notice de vue-bits obligatorio en el archivo; nada de redistribución como componente.
- `CODING_STANDARDS.md` §7: el código aportado usa `:class` con template literal + props `className`/`style` genéricas → adaptar a clases fijas (`fixed inset-0`, sin `[...]`) y props explícitas; cero márgenes.
- Un componente principal (regla 0.3); gestor bun; no dev/build/preview sin autorización (regla 0.4).
- WebGL con red: si falla el contexto, fallback silencioso a fondo liso (`bg-neutral-950` ya está en `main`), sin romper la página.
- A11y: `aria-hidden="true"`, `pointer-events-none` (el aportado escucha en su contenedor → el contenedor será `pointer-events-none` y los listeners pasan a `window`, o se deja el canvas sin capturar clics del contenido); `prefers-reduced-motion` → loop pausado/frame estático.
- Rendimiento: `resolution` ≤ 0.5, pixelRatio ≤ 2 (el código ya capa), pausa por visibilidad (ya trae IntersectionObserver + visibilitychange).

## Pasos

1. `bun add three` (+ `@types/three` si hace falta para `vue-tsc`).
2. **create** `src/components/LiquidEtherBackground.vue`: port del código aportado con paleta `['#ff1a1a', '#dc2626', '#1d4ed8', '#000000']`, contenedor `fixed inset-0 -z?/z-0 pointer-events-none` con `aria-hidden`, copyright vue-bits en cabecera, fallback si WebGL falla, reduced-motion.
3. **edit** `src/App.vue`: quitar BlackWall, montar `<liquid-ether-background />` primero en `main`.
4. `bun run lint:check` + `bun run format:check`.
5. Verificación final (sección siguiente; build/dev con autorización aparte).

## Verificacion

- `bun run lint:check` + `bun run format:check` exit 0.
- `bun run build` (autorización aparte): `vue-tsc` verde con `three`.
- `bun run dev` (autorización aparte): fluido visible detrás de las secciones, reactivo al mouse, auto-demo en reposo, fondo fijo al scroll, sin errores de consola, framerate estable; WebGL ausente → fondo liso sin roturas.

## Cierre (memoria persistente) — CLOSED por sustitución, 2026-09-08

- Motivo: el usuario sustituye LiquidEther por FaultyTerminal (este sí corre con el minimotor khatarsis sin dependencias nuevas). Continúa en `portfolio-faulty-terminal-fondo`.
- Estado final: nunca ejecutado; sin cambios en código por este plan (el comentario en `index.html` se añadió y revirtió en la misma sesión por falta de compuerta). Copyright vue-bits pasa al nuevo plan.
- Verificacion: no aplica (sin ejecución).
- Resultado: descartado por sustitución explícita del usuario.
