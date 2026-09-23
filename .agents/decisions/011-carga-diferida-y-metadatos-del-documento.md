---
name: 011-carga-diferida-y-metadatos-del-documento
status: proposed
date: 2026-09-18
domain: portfolio
supersedes: []
---

# ADR-011: Lo que no es la entrada entra por import dinamico, y el idioma del documento lo posee el punto de composicion

## Contexto

Dos sintomas medidos el 2026-09-18 sobre `dist/` del build del 2026-09-16:

- **Un solo chunk de 1.038.068 B (337.267 B gzip) y cero `import()` dinamicos en `src/`**: el
  arranque pagaba el parseo de todo el sitio — las 4 secciones, **Leaflet** (que solo se ve en el
  mapa de About, muy debajo del fold) y la vista del huevo de pascua (`/vicecity`, fuera de
  `NAV_SECTIONS` segun ADR-009) con su trailer.
- **El documento declaraba un idioma que el usuario no estaba leyendo**: `index.html` es
  `<html lang="es" ...>` y nada lo actualizaba. Con el sitio en ingles, `<html lang>`, `<title>` y la
  meta description seguian en español (el unico lugar que tocaba `document.documentElement` era
  `useTheme.ts`, para la clase `dark`).

En el mismo analisis se verifico en fuente de la libreria que **no se puede** quitar
`app.use(khatarsis)` para tree-shakearla: `generateVariantStyles` es lo unico que define los tokens
`--variant-*` (los inyecta en un `<style data-variant-tokens>` en runtime; el CSS publicado no los
contiene) y esa funcion no esta en el entry publico. Ese hallazgo no cambia la decision de este ADR,
pero queda registrado porque es el motivo por el que el bundle no baja mas.

## Decision

- **Carga diferida por defecto para lo que no es la entrada.** La ruta del truco
  (`/vicecity` en `src/router/index.ts`) entra por `() => import('@/views/ViceCityView.vue')`, y las
  dependencias de una seccion que no se ve al arrancar entran por `import()` **dentro de su ciclo de
  vida**: Leaflet y su CSS se importan y se esperan en el `onMounted` de `MapCard.vue` (import de
  tipos aparte, `import type { Map as LeafletMap }`), siempre **antes** de crear el mapa, para que no
  exista un frame sin estilos. `MainView` y las 4 secciones siguen eager: son la entrada.
- **El idioma del documento y el `<title>` los posee el punto de composicion.** En `src/main.ts`,
  junto a los demas puentes de i18n del host (ADR-008), un `watch` sobre `i18n.global.locale` con
  `{ immediate: true }` aplica `document.documentElement.lang` y `document.title` desde la clave
  nueva `meta.title` (es/en). No se crea composable ni componente: el host ya es el dueno de los
  puentes de idioma.
- **La meta description no se toca desde aca.** Vive en `index.html` y su dueno es el plan de SEO
  (`portfolio-seo-metadata.md`), para no tener dos fuentes del mismo metadato. Mientras el idioma sea
  estado de cliente, tampoco se declara `hreflang` (coherente con D3 de ese plan); lo que si se
  garantiza siempre es que el `lang` del documento sea el correcto.
- **A1 (quitar `app.use(khatarsis)`) queda fuera y pasa a la libreria**: no es una decision de este
  repo mientras los tokens de variante dependan del plugin.

## Consecuencias

- **Positivas:** el chunk de entrada baja de 1.038.068 B a 698.791 B crudo (−33 %, −112.933 B gzip)
  y el arranque completo (JS + CSS) de 1.440.522 B a 1.086.253 B (−24,6 % crudo, −30,8 % gzip);
  Leaflet (148.731 B + 15.095 B de CSS) y la vista del truco dejan de competir con la primera
  pintura; el `<html lang>` y el `<title>` acompañan al idioma real, lo que mejora accesibilidad y
  SEO internacional sin tocar un solo pixel del layout.
- **Negativas / trade-offs:** aparecen dos requests mas en el arranque real (el chunk de Leaflet se
  pide apenas monta About, porque la seccion se monta con la vista y no al entrar en viewport), asi
  que la ganancia es de **camino critico**, no de bytes totales; el mapa pasa a depender de que su
  CSS llegue antes de crearse (si en el futuro se lo desacopla del `await`, vuelve el frame sin
  estilos); el idioma del documento agrega estado reactivo en el punto de composicion, con el mismo
  riesgo que ADR-008 documenta para el puente de la libreria.
- `dist/` sigue pesando 253 MB: lo domina el trailer de 250 MB, que no se toca aca.

## Alternativas Consideradas

- **Mantener todo en el chunk de entrada:** es lo que habia; obliga a descargar y parsear codigo que
  la primera pintura no necesita; descartado tras medirlo.
- **Montar el mapa solo cuando entra en viewport (`IntersectionObserver` + componente asincrono):**
  baja tambien los bytes totales del arranque, pero cambia **cuando** aparece el mapa (y con ello la
  percepcion al saltar a About), justo lo que el usuario prohibio en este corte; queda como
  iteracion futura si se acepta ese cambio de comportamiento.
- **Bundlear los sets de iconos para cortar la dependencia de la API de Iconify:** el JSON completo
  de un set pesa ordenes de magnitud mas que los ~15 iconos que el sitio pide on-demand y cachea; se
  descarto y se agrego solo un `preconnect` a `https://api.iconify.design`.
- **Actualizar `lang`/`title` desde `index.html` (estatico):** no puede seguir al locale, que es
  estado de cliente; descartado.
- **Reescribir los tokens `--variant-*` en `src/style.css` para poder quitar el plugin:** duplica
  internos de la libreria (RULES 0.6) y `DESIGN.md` §5 prohibe parchear su fallo desde el repo;
  descartado (el pedido va a la libreria).

## Estado

`proposed` (creado durante la ejecucion del plan `portfolio-rendimiento-bundle-higiene-idioma`).
Pasara a `accepted` cuando la revision visual del usuario confirme que el sitio se ve igual que antes
del corte (mapa, secciones, truco y cambio de idioma).
