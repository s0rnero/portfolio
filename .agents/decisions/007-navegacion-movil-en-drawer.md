---
name: 007-navegacion-movil-en-drawer
status: accepted
date: 2026-09-15
domain: portfolio
supersedes: []
---

# ADR-007: Por debajo de `sm` la navegación vive en un drawer de khatarsis y el navbar queda con logo + trigger

## Contexto

El navbar resolvía el ancho reducido con parches por breakpoint: los textos de los 3 items se ocultaban por debajo de `sm` con un wrapper `<span class="hidden sm:inline-flex">` (que además obligaba a poner un `aria-label` en el `router-link` para que el link no quedara sin nombre accesible) y el bloque de idioma/tema pasaba a `flex-col-reverse` con `xs:flex-row`. El resultado era un navbar apretado, con dos layouts alternándose dentro del mismo bloque de marcado y con clases que dependían del orden de emisión de utilidades de Tailwind (una variante solo puede ganar en o por encima de su breakpoint, nunca por debajo).

La librería `khatarsis` expone `Drawer` con un contrato que resuelve ese patrón completo: el slot `trigger` **solo se renderiza** por debajo del prop `breakpoint`, el panel solo se monta ahí mismo, y al superar el breakpoint la librería emite `update:modelValue false` y cierra. También provee slots `default` y `footer`, que separan naturalmente el contenido de navegación de los controles de preferencias.

## Decisión

- Por debajo de `sm` (640px) el navbar renderiza **solo** el logo del portafolio a la izquierda y el trigger del drawer a la derecha; los 3 items de `NAV_SECTIONS` van en el slot `default` del drawer y el cambio de idioma y de tema en su slot `footer`.
- De 640px para arriba el navbar conserva el layout completo (items con texto, selector de idioma y botón de tema) y el trigger **no existe**, porque la visibilidad la gobierna el prop `breakpoint` de la librería, no clases propias.
- El portafolio no reimplementa el comportamiento responsive del drawer: `:breakpoint="640"` se pasa con una constante local (`drawerBreakpoint`) documentada como espejo del breakpoint `sm` de Tailwind, y el cierre por resize queda del lado de la librería.
- El cierre por interacción sí es del portafolio: cambio de tema, cambio de idioma y click en un item de sección cierran el drawer desde `Navbar.vue`.
- Los controles de idioma y tema se extraen a `NavControls.vue` (raíz múltiple, prop `selectId`) porque deben renderizarse en dos contenedores distintos: navbar (>=640px) y pie del drawer (<640px). Se evita la duplicación literal del bloque (RULES 0.6).
- El idioma del control es un `computed` escribible sobre el `locale` de `vue-i18n`, no un `ref` local con `watch`: con dos instancias, un `ref` local queda obsoleto cuando el idioma cambia en la otra instancia.
- El panel recibe `:aria-label` propio con la clave `nav.ariaNavigation`, para no depender de la etiqueta interna de la librería.

## Consecuencias

- Positivas: el navbar pasa a tener un modo claro por breakpoint en lugar de dos layouts parcheados dentro del mismo marcado; desaparecen el wrapper de ocultado, el `aria-label` redundante del link y el `flex-col-reverse`; el drawer aporta overlay, `Esc`, foco atrapado y cierre por resize gratis; la lista de items del navbar deja de depender de una variante que no podía ganar por debajo de su breakpoint.
- Negativas / trade-offs: la navegación móvil cambia de superficie (drawer en vez de links inline) y aparece una dependencia explícita del navbar hacia un componente de overlay de khatarsis; el estado de apertura vive en `Navbar.vue` y hay un segundo lugar donde se renderizan los accesos de sección (el slot del drawer), así que cualquier item nuevo debe seguir saliendo de `NAV_SECTIONS` para no duplicarse; `drawerBreakpoint` y el breakpoint `sm` de Tailwind son dos fuentes del mismo número y hay que moverlas juntas.

## Alternativas Consideradas

- **Mantener el ocultado de textos y arreglar el `flex-col-reverse`:** es lo que había; no arregla el navbar apretado en móvil y sigue dependiendo del orden de utilidades; descartado.
- **Boton de trigger propio con `v-model` en lugar del slot `trigger`:** obligaría a duplicar la lógica del breakpoint con `hidden`/`sm:hidden` y a mantener el cierre por resize a mano; descartado.
- **Duplicar el bloque de controles en el navbar y en el pie del drawer:** viola RULES 0.6; descartado.
- **Un `ref` local con `watch` para el idioma en la pieza compartida:** queda desincronizado entre las dos instancias; descartado.
- **Usar `<k-drawer>` global sin importar el componente:** no lo valida `vue-tsc` (el paquete no declara `GlobalComponents`); descartado.

## Estado

`accepted` (2026-09-15 16:20). Creado durante la ejecución del plan `portfolio-navbar-drawer-sm-i18n`; confirmado por verificación manual del usuario ("el drawer del navbar ya funciona"), que es la condición de aceptación declarada al crearlo. El cierre del plan documenta el único punto que queda pendiente: el typecheck automatizado, bloqueado por el build de la librería.
