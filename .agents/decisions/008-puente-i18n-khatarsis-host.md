---
name: 008-puente-i18n-khatarsis-host
status: accepted
date: 2026-09-15
domain: portfolio
supersedes: []
---

# ADR-008: El puente i18n entre khatarsis y `vue-i18n` es responsabilidad del host y va en las dos direcciones

## Contexto

Los componentes de khatarsis tienen textos internos propios (por ejemplo `khatarsis.drawer.closeLabel`, que en el bundled español es "Cerrar drawer"). Su estado de locale es independiente del `vue-i18n` de la aplicación y arranca en `en` con `fallbackLocale: 'en'`: `useKhatarsisLocale()` resuelve por `inject` y, si nadie proveyó nada, devuelve un api de fallback en inglés. Consecuencia observada: el botón de cerrar del drawer quedaba en inglés aunque la app estuviera en español.

La librería no crea su propia instancia de `vue-i18n` y ofrece dos piezas:

- `provideKhatarsisLocale(app, options)`: construye el estado con los mensajes bundled (`en` y `es` vienen dentro del paquete), hace `app.provide(...)` y devuelve el api.
- `syncVueI18nWithKhatarsis(api, i18n, options)`: mezcla los mensajes bundled en la instancia `vue-i18n` del host, sincroniza el locale del host hacia khatarsis **una vez** y devuelve `watch(api.locale -> host)`.

Ninguna de las dos escucha el cambio de idioma del host: el `watch` que expone la librería va en la dirección khatarsis → host, y la app cambia el idioma en la dirección contraria (el navbar escribe el `locale` de `vue-i18n`).

## Decisión

- El portafolio provee el estado de locale de la librería en `src/main.ts` con `provideKhatarsisLocale(app, { locale: i18n.global.locale.value, fallbackLocale: 'en' })`, y cierra la dirección que falta con `watch(i18n.global.locale, value => khatarsisLocale.setLocale(value))`.
- Se prefirió `provideKhatarsisLocale` a `createI18nKhatarsis` + `app.runWithContext(() => useKhatarsisLocale())` + `syncVueI18nWithKhatarsis(...)`: la segunda vía agrega los mensajes de la librería al `vue-i18n` del host (nada del portafolio consume claves `khatarsis.*`) y un `watch` en la dirección que ya está cubierta, así que el camino directo hace lo necesario con dos llamadas.
- Cuando un componente de la librería necesite una etiqueta accesible propia y no la del panel, el portafolio la pasa por prop (p. ej. `:aria-label`) en vez de depender del bundled traducido.
- El puente se mantiene en el host y no en la librería: el portafolio acepta mantener ese `watch` como parte de su capa i18n.

## Consecuencias

- Positivas: los textos internos de los componentes `k-*` siguen el idioma de la app y reaccionan en vivo a los cambios (el `locale` del api es un `Ref`, así que los componentes recalculan solos); no hay que replicar las traducciones de la librería; el arreglo son dos sentencias en el punto de composición de la app.
- Negativas / trade-offs: el portafolio conoce y mantiene un puente hacia el estado interno de la librería; el `fallbackLocale` de khatarsis queda en `en` mientras el de la app es `es`, así que una clave ausente en el bundled español se resolverá en inglés; si la librería cambiara su API de locale, este `watch` es el punto que se rompe.

## Alternativas Consideradas

- **No cablear nada (dejar el fallback en inglés):** deja textos visibles de la librería en el idioma equivocado; descartado por pedido explícito del usuario.
- **`createI18nKhatarsis` + `syncVueI18nWithKhatarsis`:** es la vía documentada, pero mezcla los mensajes de la librería en el `vue-i18n` del host y su `watch` cubre la dirección contraria a la que falta; queda como plan B si el portafolio empieza a consumir claves `khatarsis.*`.
- **Un `khatarsis` con `locale` propio manejado desde el navbar:** reparte el estado de idioma en dos fuentes de verdad; descartado.
- **Mantener el idioma solo en la librería y hacer que el host lea de ella:** invierte la dependencia del sitio entero (incluidos los mensajes de la app) hacia la librería de UI; descartado.

## Estado

`accepted` (2026-09-15 16:20). Creado durante la ejecución del plan `portfolio-navbar-drawer-sm-i18n` y confirmado junto con el cierre de ese plan (verificación manual del usuario, "el drawer del navbar ya funciona"). Si en algún momento una etiqueta interna de la librería vuelve a mostrarse en el idioma equivocado, el punto que se revisa es este `watch`.
