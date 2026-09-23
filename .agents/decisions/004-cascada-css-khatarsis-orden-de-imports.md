---
name: 004-cascada-css-khatarsis-orden-de-imports
status: proposed
date: 2026-09-11
domain: portfolio
supersedes: []
---

# ADR-004: El CSS de terceros se importa antes del propio, para que las utilidades del app ganen los empates

## Contexto

`src/style.css` importaba `tailwindcss` y despues `khatarsis/style.css`. Ese segundo archivo es un **build completo de Tailwind** (la libreria lo publica dentro de su `dist`): declara las mismas capas (`properties`, `theme`, `base`, `components`, `utilities`) y trae copias de las utilidades base. Como las dos hojas emiten en la misma capa `utilities`, con igual especificidad y sin `!important`, el empate lo decide el orden del documento, y ganaba la copia de la libreria: sus `.flex-col`, `.absolute`, `.hidden`, `.bg-white`, `.grid-cols-1` y `.backdrop-blur-sm` quedaban **despues** de las utilidades del app.

Medido en el build del repo (`index-*.css`): `.lg\:flex-row` del app en el byte 65.733 y el `.flex-col` de la libreria en el 80.043, dentro de una unica capa `utilities` (50.030-104.898). Consecuencia observable: los estilos con `sm:` / `md:` / `lg:` o con `dark:` aparecian tachados en DevTools y no surtian efecto (DevTools no los compara contra el `flex-col` del app, que si perderia, sino contra el de la libreria, que esta mas al final). El sintoma se habia atribuido a "falta de `!important`", pero no habia ni un `!` en las clases del app.

Agravante estructural del mismo origen, registrado aqui porque se diagnostico junto: el CSS **scoped** de los componentes de khatarsis esta **sin capa**. Una regla sin capa gana siempre a cualquier regla dentro de una capa, por mas especifica que sea la utilidad. Caso medido: `.button[data-v-69b6f085]{z-index:10}` (byte 118.561, sin capa) anulaba el `z-[1000]` del boton de recentrado del mapa, que quedaba invisible detras de los panes de Leaflet.

## Decision

- El CSS de terceros se importa **antes** que el propio: `@import 'khatarsis/style.css';` y despues `@import 'tailwindcss';` en `src/style.css`.
- Se descarta compensar con `!important` en el app: tapa el sintoma, ensucia cada clase y no arregla el orden.
- Cuando la libreria publique su CSS sin utilidades (o dentro de `@layer components`), este reordenamiento deja de ser necesario y se puede revertir; el ADR se marcaria `superseded`.
- Las reglas del app que no son expresables como utilidad (regla de viuda del grid de proyectos, cadena de altura del `.content` del `k-card`, apilado del boton del mapa) siguen **sin capa** en `style.css`: es la via que gana siempre, y se conserva a proposito.

## Consecuencias

- Positivas: los breakpoints y las variantes `dark:` del app vuelven a funcionar sin `!important`; el arreglo es un diff de dos lineas y no mueve ninguna capa, porque los dos archivos declaran las mismas y en el mismo orden; el app recupera la ultima palabra sobre las utilidades que comparte con la libreria.
- Negativas / trade-offs: el arreglo cambia quien gana **todos** los empates de utilidades del sitio, no solo los de los breakpoints, asi que cualquier lugar que se hubiera acomodado al ganador viejo puede moverse; exige una revision visual completa. Ademas, en las capas `theme` y `base` el que gana los empates pasa a ser el app: la libreria se construyo con Tailwind 4.2.4 y el app tiene `^4.3.3`, asi que si un token por defecto o el preflight cambian de valor entre versiones, ahora se vera el del app.
- La causa raiz sigue en la libreria: publicar un build completo de Tailwind en el `dist` repite el problema en cualquier otro consumidor. Este ADR solo resuelve el lado del portafolio.

## Alternativas Consideradas

- **`!important` en las clases afectadas:** gana siempre, pero convierte cada utilidad en una excepcion, exige mantener la lista a mano y no arregla el orden subyacente; descartado.
- **Importar `khatarsis/style.css` con `layer(components)`:** por capas es determinista (todo lo de la libreria queda por debajo de `utilities`), pero mueve tambien sus tokens de tema y su preflight a la capa `components`, con mucha mas superficie de cambio; queda como plan B documentado si el reordenamiento no alcanza.
- **Arreglar la libreria (no publicar utilidades en su `dist`):** es la solucion correcta de fondo, pero obliga a reconstruir y republicar un paquete externo antes de poder tocar el portafolio; queda propuesto como hilo aparte.
- **Seguir escribiendo reglas sin capa en `style.css` para cada sintoma:** es lo que se venia haciendo (mapa, grid, blur, scrollbar) y sigue vigente para lo que no es expresable como utilidad, pero como estrategia general convierte el estilo del sitio en una lista de parches; descartado como enfoque.
- **Cambiar la libreria a CSS-in-JS o a utilidades propias:** reescritura completa sin relacion con el sintoma; descartado.

## Estado

`proposed` (creado durante la ejecucion del plan `portfolio-cascada-breakpoints-footer-blur-boton-mapa`). Pasara a `accepted` cuando la verificacion confirme que los breakpoints y las variantes `dark:` del app funcionan sin `!important`.
