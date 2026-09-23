---
name: portfolio-logo-kimage-ios15
status: EXECUTED
type: bugfix
domain: portfolio
owner_rules: .agents
created: 2026-09-23 17:30
updated: 2026-09-23 18:10
---

# Plan: Logo con k-image correctamente dimensionado en iOS 15

## Contexto y analisis

- El logo del navbar y footer usa `k-image` de khatarsis. En el iPhone 6s (iOS 15.8) el glifo se ve centrado en un hueco mas ancho que el logo, en vez de pegado a la izquierda.
- Investigacion hecha en esta sesion (huellas reales, no suposiciones):
  - `k-image` renderiza `figure.image.single` con `display: grid` (regla `.image.single[data-v-7566e6e7]{display:grid;grid-template-rows:minmax(0,1fr) auto}` en `khatarsis.css`) y **fuerza su `img` interior a `width:100%;height:100%`** (regla `:is(.image.single,...) img`).
  - El wrapper exterior recibia clases `h-8 w-auto`: en un contenedor grid con ancho `auto`, el ancho de la columna se resuelve por el tamano intrinseco del hijo; **en iOS 15 esa resolucion circular (columna auto -> img 100% -> columna auto) cae al ancho por defecto del SVG** (~300px o el viewport disponible), y con `fit="contain"` el glifo queda **centrado** dentro de esa caja demasiado ancha. Los navegadores modernos resuelven la circularidad con el aspect-ratio del SVG (838x825 ahora que tiene width/height nativos) y por eso solo falla en el 6s.
  - El SVG ya tiene `width="838" height="825"` nativos (fix anterior), lo que no basta solo: la caja grid sigue sin ancho explicito en iOS 15.
- Decision del propietario: **mantener `k-image`** (no volver al `<img>` plano que aplique antes y ya reverti). El componente se queda; hay que darle lo que le falta para dimensionar bien.

## Objetivo

- Que el logo se vea a la izquierda y con su tamano real usando `k-image` en navbar y footer, en iOS 15 y en el resto de navegadores, sin tocar la libreria.

## Alcance

- `src/components/layout/Navbar.vue` (boton del logo: volver a `k-image` con props/clases correctas).
- `src/components/layout/FooterSection.vue` (igual).
- Si la investigacion lo justifica: uso del prop `width`/`height` de `k-image` o clases de caja explicita (`h-8 w-8`) en lugar de `w-auto`; `fit="contain"` se conserva.
- Fuera de alcance: khatarsis (su CSS compilado no se toca), el resto de usos de `k-image` (About, proyectos), y el cursor/scrollbar (solo investigacion; si el usuario quiere custom scrollbar sera otro plan).

## Hipotesis a validar (orden de barato a caro)

1. **Caja explicita en el figure**: `h-8 w-8` (el logo es casi cuadrado, 838x825) en vez de `h-8 w-auto`. Elimina la resolucion circular: la columna deja de ser `auto` y `contain` centra el glifo en una caja 32x32 correcta. Verificar en iOS 15 que el hueco desaparece.
2. **Props nativos de k-image**: `:width="32"` (el componente aplica `style.width: 32px` al figure, visto en su codigo minificado) + `class="h-8"`. Mismo efecto pasando por la API del componente, sin pelear con Tailwind sobre el grid.
3. Si ninguna funciona: probar `size="xs"` (32x32 fijo por la libreria) y documentar por que; ultima opcion `:ui` para redefinir la clase del grid si khatarsis lo expone.

## Restricciones

- RULES 0.1-0.13; sin Git; sin borrar; sin tocar khatarsis.
- No repetir el error anterior: no sustituir `k-image` por `<img>`; la solucion pasa por usarlo bien.
- Verificar visual en el iPhone 6s (el usuario es el banco de pruebas iOS 15).
- Las clases nuevas no deben alterar el layout del nav (flex entre logo y menu/drawer).

## Pasos

1. Investigar el CSS de `khatarsis.css` para `.image.single` y tamaños (`size`, `width` prop) y confirmar cual via no depende de la resolucion circular de grid (hecho parcialmente en esta sesion; cerrar la verificacion de props `width`/`height` en el codigo minificado).
2. Aplicar la via elegida en `Navbar.vue` y `FooterSection.vue` (mismo cambio en ambos).
3. Verificacion local: `lint:check`, `format:check`, `build` (con autorizacion), inspeccion del CSS construido (el figure del logo debe quedar con ancho explicito).
4. Desplegar (con autorizacion) y revision visual del usuario en el iPhone 6s.

## Verificacion

- Comandos con autorizacion: `bun run lint:check`, `bun run format:check`, `bun run build`, deploy Netlify (patron ya usado en la sesion).
- Revision manual del usuario: logo a la izquierda en navbar y footer en iOS 15 y en escritorio; sin salto de layout.

## Preguntas abiertas al usuario

- ¿Incluimos en este plan la scrollbar custom (para que el cursor glitch pueda pasar por encima) o queda para otro plan?

## Registro de ejecucion (2026-09-23 18:10)

- El usuario eligio la **via 2 (prop nativo `width`)** y cerro la pregunta de la scrollbar: **"no hay nada que hacer, dejemoslo asi"**.
- `Navbar.vue` y `FooterSection.vue`: de vuelta a `k-image` con `:width="32"`, `fit="contain"`, `:lazy="false"` y `class="h-8"` (sin `w-auto`: el ancho lo da el prop como estilo inline del figure). Comentario en el codigo explicando por que.
- Verificacion: `vue-tsc`, `lint:check`, `format:check`, `build` en verde; desplegado en produccion.
- Pendiente: revision visual del usuario en el iPhone 6s (si el figure con ancho fijo elimina el hueco). Si no bastara, la via 3 del plan es `size="xs"`.
- Scrollbar: descartada por decision del propietario; el cursor no podra pasar sobre ella (limitacion del modelo de capas del navegador, documentada en la conversacion).
