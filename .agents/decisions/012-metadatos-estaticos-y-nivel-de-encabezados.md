---
name: 012-metadatos-estaticos-y-nivel-de-encabezados
status: proposed
date: 2026-09-18
domain: portfolio
supersedes: []
---

# ADR-012: La metadata del documento es estatica salvo lo que depende del origen, y ningun encabezado visible empieza en h3

## Contexto

Primera medicion real de Lighthouse (13.5.0, perfil movil) sobre el artefacto de produccion, el
2026-09-18: **Performance 30 · Accesibilidad 98 · Buenas practicas 100 · SEO 92**. Dos de los
cuatro fallos no eran de rendimiento:

- **SEO 92 por un unico fallo**: `robots-txt` "22 errors found". No era que faltara el archivo —
  `public/robots.txt` existia — sino que el `dist/` medido era anterior a el y el servidor
  devolvia `index.html` en `/robots.txt`, que el parser contaba como 22 lineas invalidas.
- **Accesibilidad 98 por un unico fallo**: `heading-order`, con el nodo culpable literal
  `<h3 class="font-bold">`. `useReveal` (ADR-006) oculta con `autoAlpha` — es decir `opacity: 0` +
  `visibility: hidden` — todo lo marcado con `[data-reveal]`, y **los tres `h2` de seccion viven
  dentro de esos contenedores**. En el arbol accesible del momento auditado solo quedaban los
  `h3`: titulos de tarjeta de proyecto, "Stack que uso dia a dia" y el titulo del mapa. La
  secuencia empezaba en `h3`.

Al mismo tiempo, la auditoria de la metadata del plan de SEO seguia bloqueada por una decision de
negocio sin resolver: **el dominio de produccion no esta declarado en el repo** (ni `README`,
ni `package.json`, ni `vite.config.ts`, ni un `CNAME`). `canonical`, `og:url`, `og:image`
absoluta, el `<loc>` del sitemap y el `Sitemap:` de `robots.txt` necesitan ese dominio.

## Decision

1. **La metadata se parte en dos por su dependencia del origen**:
   - **Estatica en `index.html`** (no necesita host): `description` en el rango 150-160 caracteres,
     `author`, `robots`, `theme-color` para claro y oscuro, Open Graph sin URL
     (`og:type`, `og:site_name`, `og:title`, `og:description`, `og:locale`, `og:locale:alternate`),
     Twitter Card (`summary_large_image` + titulo y descripcion) y un unico `<script type=
     "application/ld+json">` con `@graph` de `Person` + `WebSite` (`jobTitle`, `address`,
     `knowsAbout` con los 23 skills reales, `sameAs` de GitHub y LinkedIn, email).
     `url` e `image` se **omiten a proposito**: deben ser absolutas y no hay dominio.
   - **Derivada del origen en runtime**: el `canonical`. `main.ts` mantiene un unico
     `<link rel="canonical">` con `window.location.origin + ruta` y lo reescribe en cada cambio de
     ruta. Es autorreferencial, correcto en cualquier host (incluido `localhost`) y **no exige
     reemplazar nada a mano al publicar**.
   - `public/robots.txt` se queda **sin linea `Sitemap:`** a proposito: un `robots.txt` valido y
     sin mentiras vale mas que uno con una URL inventada. `public/manifest.webmanifest` se agrega
     para que el sitio quede presentable al instalarlo.
2. **Los encabezados que pueden quedar visibles mientras las secciones estan ocultas por el
   reveal son `h2`, no `h3`**: `ProjectCard.vue`, `AboutSection.vue` (`about.stackTitle`) y
   `MapCard.vue`. El documento queda con `h1` (hero) y `h2`, sin saltos de nivel en ningun
   momento del ciclo de vida.

## Alternativas descartadas

- **Poner el dominio como placeholder** (`https://example.com`) y reemplazarlo al publicar, que era
  la opcion (a) del plan de SEO: se descarta. Un `canonical` que apunta a otro host desindexa, y
  un `og:image` relativo no lo resuelve ningun crawler social. Peor que no tenerlo.
- **Publicar `canonical` estatico con una URL relativa**: el spec exige absoluta.
- **Cambiar `useReveal` a solo opacidad** para que los `h2` sigan en el arbol accesible mientras
  estan invisibles: arreglaria el `heading-order` sin tocar los tags, pero deja todo lo oculto
  enfocable y clicable (los `k-card` de proyectos tienen enlaces dentro), que es peor problema del
  que resuelve. `autoAlpha` existe justamente por eso.
- **Sacar el `data-reveal` de los titulos de seccion**: es un cambio visual (perderian el fundido).
- **Dejar los `h3` y esperar a que el reveal los revele**: el fallo no es de timing, es estable: la
  auditoria ocurre con las secciones bajo el fold todavia sin revelar.
- **Generar `og-image.png` de 1200x630 ahora**: solo tiene sentido junto con un dominio real.

## Consecuencias

- **`robots.txt` deja de ser un fallo y SEO pasa a 100** una vez reconstruido el artefacto. El plan
  de SEO queda cumplido en todo lo que no necesita dominio; `sitemap.xml` y `og:image` siguen
  pendientes de esa decision, y este ADR los deja explicitamente fuera.
- **Accesibilidad pasa a 98 -> 100.** La neutralidad visual del cambio de tag es verificable, no
  opinable: el unico uso de `h2`/`h3` en el CSS compilado es el reset del preflight
  (`font-size: inherit; font-weight: inherit`), `src/style.css` no tiene ninguna regla por tag, y
  un `h3` inyectado con las mismas clases computa **estilos identicos** al `h2` en el navegador.
- **La jerarquia semantica se aplana**: los titulos de tarjeta son hermanos del titulo de seccion
  en lugar de hijos. Es el precio de que el `h2` de seccion sea invisible al cargar por decision
  de diseño (ADR-006); el orden de encabezados es valido en todo momento, que es lo que exige la
  auditoria.
- Queda un pendiente real de accesibilidad que **no** puntua y por eso no se toca aca: el efecto
  glitch duplica el texto con `::before`/`::after` y `content: attr(data-text)`, asi que algunos
  lectores lo leen tres veces. El arreglo (capas de texto con `aria-hidden`) cambia la estructura
  del efecto, y no entra sin verificacion visual.
