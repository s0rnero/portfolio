---
name: 005-deep-link-hash-restore
status: proposed
date: 2026-09-13
domain: portfolio
supersedes: []
---

# ADR-005: Conservación del hash en deep-links durante el arranque (spy vs restauración)

## Contexto

Al recargar el navegador con una URL que apunta a una sección (p. ej. `/#about`), la página saltaba al inicio y la URL perdía el hash.

Secuencia verificada: `useSectionSpy` ejecuta `schedule()` en `onMounted`; el primer `requestAnimationFrame` corre con `scrollY === 0`, porque la restauración de posición del navegador todavía no ocurrió. Con la página arriba, `activeHash()` devuelve `''`, así que el spy hace `router.replace({ path: '/' })` y **borra el hash de la URL**. Cuando `MainView` intenta restaurar 150 ms después (`scrollTo(route.hash)`), ya lee un hash vacío y no desplaza a ninguna sección.

El contrato implícito hasta ahora era: el spy es el único que escribe el hash de la URL y puede limpiarlo cuando la sección activa es el inicio. Ese contrato choca con la restauración de un deep-link entrante, que necesita que el hash sobreviva los primeros frames.

## Decision

- El spy no descarta un hash de deep-link mientras la posición inicial no esté resuelta: en `useSectionSpy.ts` se añade un flag `isDeepLinkPending` inicializado con `route.hash !== ''`. Mientras esté activo y la página siga arriba (`scrollY === 0`) con un hash activo distinto, `sync()` retorna sin tocar la URL. El flag se limpia cuando la página dejó de estar arriba (la restauración ocurrió) o cuando el hash activo ya coincide con el de la URL; desde ahí el spy recupera su comportamiento normal, incluido limpiar el hash al volver al inicio.
- `MainView.vue` fija el hash objetivo en un snapshot de `setup()` (`initialHash`) y restaura ese valor, para que el destino no dependa de que la URL sobreviva a los primeros frames.
- `scrollBehavior` (que devuelve `false` en todas sus ramas) y Lenis como único motor de scroll quedan intactos: sin `scroll-behavior: smooth` y sin restauración con scroll nativo.

## Consecuencias

- Positivas: recargar en `/#projects`, `/#about` o `/#contact` conserva la posición y el hash; el spy mantiene su comportamiento en navegación normal; el cambio es local (dos archivos) y no introduce un segundo motor de scroll.
- Negativas / trade-offs: el spy pasa a tener estado de arranque (`isDeepLinkPending`), es decir, su comportamiento depende de si el arranque fue en un deep-link o en el inicio; el flag debe limpiarse correctamente para no congelar el hash. La restauración sigue siendo asíncrona (`setTimeout` de 150 ms, más el de 80 ms de `scrollBehavior`), así que un usuario que scrollee en ese lapso puede ver un salto.

## Alternativas Consideradas

- **Restaurar con scroll nativo (`history.scrollRestoration` + ancla del navegador):** descartado; ADR-001 prohíbe introducir un segundo motor de scroll junto a Lenis.
- **Mover la restauración a un guard de router o a `scrollBehavior`:** descartado en esta iteración; `scrollBehavior` ya devuelve `false` por diseño (ADR-002) y depende de `scrollTo`, que necesita el DOM montado.
- **No escribir el hash desde el spy durante todo el arranque:** descartado; cambiaría el comportamiento del spy al volver arriba con la página recién cargada (el hash quedaría pegado).

## Estado

`proposed` -> `accepted` (cuando se confirme la verificación manual del frente 2: recarga en `/#about` y `/#contact`, y navegación normal por el navbar).
