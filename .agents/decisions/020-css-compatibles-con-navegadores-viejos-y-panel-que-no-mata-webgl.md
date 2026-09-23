---
name: 020-css-compatibles-con-navegadores-viejos-y-panel-que-no-mata-webgl
status: accepted
date: 2026-09-23
domain: portfolio
---

# ADR-020: CSS con sintaxis clasica para navegadores viejos y panel de diagnostico que no mata WebGL

## Contexto

Dos fallos reportados desde el iPhone 6s (iOS 15.8):

1. **El logo del navbar y del footer se veia centrado solo en ese iPhone.** Causa confirmada en el CSS construido: Tailwind v4 emite las media queries en **sintaxis de rango** (`@media (width>=40rem)`). Safari <= 16.3 no la soporta y **descarta la regla `@media` completa** al no poder parsearla: con ella se iban los 46 breakpoints (`sm:flex`, `sm:hidden`, `xs:px-6`...), el flex del navbar perdia su reparto y el logo acababa centrado. En navegadores modernos todo funcionaba, por eso "solo pasaba en el iPhone".

2. **Con `?perf=1`, el canvas del fondo moria a los pocos segundos.** Causa confirmada en el panel: `capabilities()` sondeaba `WebGL2` y `WebGL1` creando **dos contextos WebGL nuevos en cada refresco** (cada 400 ms). iOS Safari tiene un tope duro de contextos WebGL vivos por pagina (~16); al superarlo, el navegador destruye el contexto mas antiguo, que era justamente el del `FaultyTerminalBackground`. Como los componentes no escuchan `webglcontextlost`, la capa quedaba negra sin recuperacion.

## Decision

1. **Plugin `legacy-media-queries` en `vite.config.ts`.** En el `closeBundle` del build, reescribe el CSS de `dist/assets/*.css` con Lightning CSS fijando `targets: { safari/ios_saf: 15, chrome/firefox/edge: 90 }`, lo que baja la sintaxis de rango a la clasica (`min-width` / `max-width`), que funciona en todos los navegadores. Es **determinista**: cada `bun run build` sale ya convertido, sin parches manuales sobre `dist`. Sin expandir el bundle cliente: es un paso de build.
2. **El panel de diagnostico sondea las capacidades UNA vez y las cachea** (`capsCache`), y el contexto de prueba se **libera al instante** con `WEBGL_lose_context` para no consumir el tope de contextos de la pagina.

## Consecuencias

- El layout de breakpoints (`sm:`, `xs:`, `max-xs:`...) funciona en iOS 15 y cualquier navegador >= ~2021.
- La medida con `?perf=1` ya no destruye el fondo que se pretende medir.
- Si Tailwind cambia su salida, el plugin sigue siendo correcto: opera sobre el CSS final, no sobre la salida de Tailwind.
- Los targets del plugin (safari 15) son el suelo de soporte declarado; subirlos es una linea.
- `oklch()` y `@property` siguen sin resolverse en iOS 15 (Tailwind v4 los requiere): es fidelidad de color, pendiente como decision propia.
- El plugin anade una pasada de Lightning CSS al build (~decenas de ms por archivo).

## Alternativas Consideradas

- **Parchear `dist` a mano tras cada build:** no reproducible y se olvida en el siguiente deploy. Descartada.
- **Bajar el suelo de Tailwind a v3 o usar su plugin de compatibilidad legacy:** Tailwind v4 no trae conmutador para range syntax y el downgrade es invasivo para un problema de una pasada de build.
- **Dejar sin soporte iOS 15:** legitimo, pero el propietario del sitio usa ese dispositivo como banco de pruebas y el arreglo cuesta una pasada de build.
- **Que el panel sondee con canvas de otra pagina/iframe:** complejiza el panel; cachear + liberar el contexto resuelve con tres lineas.

## Estado

`accepted`
