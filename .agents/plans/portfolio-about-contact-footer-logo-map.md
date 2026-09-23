---
name: portfolio-about-contact-footer-logo-map
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-10 21:45
---

# Plan: About me + Contacto + Footer + logo/favicon + cards clickeables + mapa de Cali

> Solicitud del usuario (2026-09-10): "despues crea los planes para hacer 2 secciones mas 1 de about me / otra de contacto"; la de About con una descripcion personal (~"soy un desarrollador web con 23 años, me gusta programar y jugar videojuegos en mis tiempos libres, me gusta crear cosas locas y ambiciosas, tengo 2 perros que me acompañan siempre mientras programo"), con el About me de Jason Cameron como referencia de estilo. "tienes permiso de inspeccionar por fuera de este proyecto uno que se llama cv, busca en templates mi hoja de vida que es un html" y "hay mas informacion tecnica en context.md pero para mostrar opta por la info de la hoja de vida que tiene una lectura mas organica". Layout pedido: "habra un image a la izquierda con minimo 200 px de ancho y el texto a la derecha", foto a reemplazar por una stock temporal; "debajo de la imagen y el texto habra una card donde muestre con chips todas las tecnologias"; "a la derecha de esta card que ocupara un 70% aprox del ancho disponible el otro espacio sera una card de un mapa (busca en internet algo para renderizar un mapa, una libreria o dependencia pequeña ligera que muestre el mapa y un punto de ubicacion) este componente ubicara en cali", "debajo del mapa mostrar la hora con la zone horaria de cali"; "debajo de todo esto estara la seccion de contacto donde estara un titulo de contacto y habran los botones que aparecen en el hero igual"; "debajo de todo esto debera crear un footer que tenga todos los links del navbar, pero con un blur en el fondo del footer", "debera añadir el footer el logo de mi portafolio", "tambien debes cambiar el ico y cambiar el cesar rios del navbar por el logo". Ademas: "las cards de los proyectos no son clickeables y no llevan a ningun sitio cuando en un plan (buscalo, adjunte los link de adonde debe ir cada una)". Instruccion final: **un solo mega plan**.

## Objetivo

1. Seccion **About me** (`#about`) con foto a la izquierda (min. 200 px), texto a la derecha, card de chips de tecnologias (~70% del ancho) y card de mapa de Cali con la hora local.
2. Seccion **Contacto** (`#contact`) con titulo y los mismos botones del hero.
3. **Footer** con los links del navbar, fondo con blur y el logo del portafolio.
4. **Logo** del portafolio en el navbar (reemplaza el texto "César Ríos") y **favicon** nuevo.
5. **Cards de proyectos clickeables** hacia la URL real de cada proyecto y con **descripciones reescritas**: las actuales son pobres; se toman los resumenes de las 3 experiencias del CV, resumidos y sin jerga tecnica (pedido del usuario 2026-09-11).
6. Navbar y footer con los links de las secciones que existen (`about`, `projects`, `contact`), sin anclas muertas.

## Contexto y fuentes (verificado, 2026-09-10)

### Fuera del repo (permiso explicito del usuario, solo lectura)

- `../cv/.agents/templates/cv/index.html` (**294 lineas**) — la hoja de vida HTML: perfil profesional organico, 3 experiencias con logros, **5 grupos de skills** (Frontend: Vue.js, Angular, React, TypeScript, Quasar, Tailwind CSS, Microfrontends; Backend: Java, Spring Boot, Spring WebFlux, Node.js, NestJS, REST API, Microservicios; Bases de Datos: PL/SQL, SQL Server, MySQL, MongoDB, PostgreSQL; DevOps & Cloud: Docker, Kubernetes, CI/CD, Azure, AWS, OCI, Linux; Herramientas: Git, Vite), 2 proyectos (Khatarsis, Alytos), educacion (SENA - CEAI, Cali, Ene 2021 - Ene 2022) e idiomas (Español nativo, Inglés B1). **Fuente elegida para el copy visible** (lectura organica, por pedido del usuario).
- `../cv/.agents/CONTEXT.md` (118 lineas) — datos duros: nacido 17/07/2003 (**23 años** hoy), residencia **Yumbo (Valle del Cauca), zona metropolitana de Cali**, telefonos 3206560259 / 3054501829, rol buscado, detalle tecnico por proyecto. Se usa como referencia; **no** se copia su redaccion cruda (el usuario prefiere el CV).
- `../cv/career-ops/cv.md` (103 lineas) y `../cv/github-profile-README.md` (61) — versiones mas antiguas/resumidas del mismo contenido.

### Assets adjuntos (fuera del repo, se copian al proyecto)

- `C:\Users\s0rno\Documents\Codex\2026-09-10\crea-una-imagen-de-2\outputs\logo-firma-script-v4.ico` — icono multi-tamano (16, 24, 32, 48, 64, 128, 256).
- `...\logo-firma-script-v4-favicon.png` — 1024x1024 **RGBA con fondo transparente VERIFICADO** (sondeo de pixeles 2026-09-11: esquina y borde `(0,0,0,0)` con alpha 0, marca central `(153,92,208,255)` = `#995CD0`). **Es exactamente el "logo sin fondo" que pidio el usuario**: sirve tal cual en navbar y footer sobre ambos temas, sin variantes por tema ni trabajo de diseño.
- `...\logo-firma-script-v4-preview.png` — 2048x2048 **RGB sin alfa** (fondo `#100A18`), solo previsualizacion.
- `...\logo-firma-script-v4.png` — master (no listado con `file`, revisar antes de usar).
- `...\logo-firma-script-v4-manifest.json` — paleta declarada: marca `#995CD0`, fondo de preview `#100A18`; descripcion: "C mayuscula caligrafica violeta con una estrella de cinco puntas centrada opticamente".
- Hermano vectorial de referencia: `...\logo-firma-glitch.svg` (2729 B) es un **SVG real de la misma marca** (la `C` dibujada como `path` con `stroke="#995CD0" stroke-width="100"` + estrella), pero de la variante "glitch" (trae cortes deliberados). **No existe SVG del v4**: el usuario pidio generarlo del PNG y el metodo ya quedo verificado (ver E2).
- Mocks adjuntos: (a) card de mapa con pin + "Actualmente radicado en" + mapa oscuro + fila `Ciudad · icono luna · 22:12:12`; (b) About me con foto a la izquierda y parrafos a la derecha con enlaces subrayados.

### Estado real del repo (leido)

- `src/views/MainView.vue`: monta `<hero-section />` + `<projects-section />` y hace `ScrollTrigger.refresh()` + `scrollTo(route.hash)` en `onMounted`.
- `src/router/index.ts`: `NAV_SECTIONS` quedo con **una** entrada (`projects`) tras el plan `portfolio-navbar-cards-scrollbar-flash`; `routesMap` conserva `/profile`, `/experience`, `/interests`, `/contact` como deep links; `scrollBehavior` resuelve `to.hash` y hace fallback por `NAV_SECTIONS`.
- `src/components/layout/Navbar.vue`: logo de texto (`<button>` con `<span class="italic">César Ríos</span>`), links desde `NAV_SECTIONS` con `GlitchText` + `k-tooltip`/`k-button` de tema.
- `src/components/hero/HeroSection.vue`: `handleGoToProfile` hace `router.push('/profile')`. El plan lo renombra a `handleGoToAbout` y lo apunta a `#about` (decision del usuario, 2026-09-11); `/profile` queda como deep link sin seccion destino.
- `src/components/projects/ProjectCard.vue`: ya usa `k-card` (plan anterior) pero **no es clickeable**; `src/data/portfolio.ts` ya tiene `url` por proyecto (`https://softii.business/login`, `https://portal2.brilla.com.co/#/login/ally`, `https://ms-prd.saas.arqbs.com/login`, `https://github.com/s0rnero/khatarsis`, `https://github.com/s0rnero/alytos`) y la clave i18n `projects.viewOnGitHub` sin consumidor.
- `src/data/portfolio.ts`: `profile.age: 22` (**desactualizado**, hoy 23), `skills` con 5 grupos mas pobres que el CV, `experiences` sin consumidor de UI, `contact` completo (location 'Cali, Colombia', email, linkedin, github, whatsapp).
- i18n: ya existen `nav.*`, `hero.*`, `profile.kicker/title/subtitle/stackTitle/role/description/bio`, `skills.areas.*`, `contact.kicker/title/subtitle/footer.rights/footer.ariaNavigation/footer.home|profile|experience|projects`, `projects.*`. **Se reutilizan** (RULES 0.6). El plan agrega las claves nuevas y, como el ancla elegida es `#about`, renombra `profile.kicker|title|subtitle|stackTitle|bio` a `about.*` (esas cinco no tienen consumidor hoy).
- `index.html`: `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`; `public/favicon.svg` es un placeholder (cuadrado violeta con `< >`).
- No existe ningun componente de mapa en khatarsis (verificado: `components/` = animations, base, blocks, charts, forms, miscellaneous, overlays, tabs) ni en el proyecto.
- Estado del build: rojo **solo** por `src/components/cursor/GlitchCursor.vue` (flujo concurrente ajeno); los archivos de este plan deben quedar limpios.

### Investigacion del mapa (web, 2026-09-10)

- **Leaflet 1.9.4** (npm `latest`, BSD-2-Clause, ~42 KB de JS, sin dependencias, API `import L from 'leaflet'`) es la opcion mas liviana y encaja con "dependencia pequeña ligera". MapLibre GL JS es WebGL/vectorial y pesa ~5x.
- **CARTO basemaps ya NO son keyless**: desde 2026 exigen API key (`dark_all`/`light_all` con `?key=`), tier free no comercial de 5M tiles/mes con atribucion. Es la via para tiles oscuros "de fabrica" si se acepta la key.
- **OSM estandar** (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) es keyless pero su Tile Usage Policy exige atribucion visible, Referer valido y no admite uso pesado (un mapa chico en un portafolio personal entra, pero no es para produccion de alto trafico).
- **OpenFreeMap** es gratis, sin registro/keys/cookies y sin limite declarado, pero es **vectorial** → obliga a MapLibre GL (bundle mas grande).
- Conclusion preliminar: Leaflet + tiles raster keyless, con filtro CSS para el tema oscuro y atribucion visible; proveedor exacto a confirmar en enrichment (decision D2).

## Alcance

> **Rutas, anclas y componentes actualizados (2026-09-11):** el About es `src/components/about/AboutSection.vue` sobre el ancla nueva `#about` (eleccion explicita del usuario), y los botones sociales salen de `src/components/common/SocialLinks.vue` (hero + Contacto + footer). Lo que sigue en este bloque refleja esa version.

- **create** `src/components/about/AboutSection.vue` — seccion `#about`: intro (foto + texto), card de chips y card de mapa.
- **create** `src/components/about/CaliMapCard.vue` — mapa de Cali + hora local (subcomponente justificado: ciclo de vida DOM/Leaflet con cleanup propio, RULES 0.3).
- **create** `src/components/common/SocialLinks.vue` — los 3 botones sociales, compartidos por hero, Contacto y footer (RULES 0.6).
- **create** `src/components/contact/ContactSection.vue` — seccion `#contact` (titulo + botones del hero).
- **create** `src/components/layout/Footer.vue` — footer con blur, logo y links de `NAV_SECTIONS`.
- **create** `src/assets/logo/logo-script-v4.png` + `public/favicon.ico` + `public/apple-touch-icon.png` (copiados desde los adjuntos con `cp`).
- **edit** `src/views/MainView.vue` (monta las secciones nuevas + el footer), `src/router/index.ts` (`NAV_SECTIONS` = `about`, `projects`, `contact`; `routesMap` y `RouteName` pierden `profile`, `experience` e `interests`), `src/components/layout/Navbar.vue` (logo en lugar del texto), `src/components/hero/HeroSection.vue` (`handleGoToAbout` + reutiliza `SocialLinks`), `src/components/projects/ProjectCard.vue` (card clickeable), `src/data/portfolio.ts` (`skills` del CV, `profile.age` 23), `src/i18n/locales/es.ts` + `en.ts` (copy nuevo con paridad), `index.html` (favicon), `package.json`/`bun.lock` (solo via `bun add leaflet`).
- **Fuera de alcance:** no se crean las secciones de perfil/experiencia/intereses (solo se eliminan sus rutas y su copy muerto), no se toca CRT/fondos/cursor/scrollbar, no se elimina `public/favicon.svg` (RULES 0.2: se reescribe su contenido), no se toca khatarsis, no se tocan los planes de otros flujos (`GlitchCursor.vue`), nada de Git.

## Restricciones

- RULES 0.2 (no borrar archivos), 0.3 (solo los 2 subcomponentes justificados), 0.4 (`bun add leaflet` + `build`/`dev` requieren autorizacion aparte), 0.6 (reusar claves i18n y `NAV_SECTIONS`), 0.8 (si se usa una API key de tiles, es clave publica de frontend via `VITE_*` documentada, nunca en Git), 0.13 + §2.1 (codigo en ingles; copy en i18n).
- §7.1-§7.3, §7.5: sin margenes (flex + gap + padding), sin valores `[...]`; el "70%" se resuelve con fracciones estandar (`lg:basis-2/3` / `lg:basis-1/3`) y el minimo de 200 px con `w-52` (208 px) en la escala de Tailwind.
- §7.4: no se alteran tamanos de fuente heredados mas alla de lo que ya define cada componente (`k-card` con su `size`), sin pedirlo.
- §7.6: CSS nativo solo donde es inevitable y documentado — `filter` del mapa por tema, estilos de Leaflet (`leaflet/dist/leaflet.css` externo) y el `backdrop-filter` del footer si no se resuelve con utilidades.
- `prefers-reduced-motion`: el reloj y el mapa no animan; el intro/reveals siguen el patron de `useReveal`.
- Sin secretos (RULES 0.8). El mapa debe mostrar atribucion (licencia OSM/CARTO).
- Las cards de proyectos quedan con `target="_blank"` + `rel="noopener"` y `aria-label` real (accesibilidad); una de las URLs (`softii`, `brilla`, `arqbs`) son logins de producto: se usan tal cual porque son las URLs que el usuario definio en `portfolio.ts` y en el plan `portfolio-projects-section.md`.

## Cambios propuestos (a detallar en enrichment)

### A. Seccion About (`#about`) — `src/components/about/AboutSection.vue` (create)

- Estructura: `section#about` con `useReveal` + `data-reveal` (patron del repo), header con el texto de `about.kicker/title/subtitle`.
- Fila 1: `div.flex.flex-col.gap-* sm:flex-row` con la **foto** (`w-52` = 208 px, `h-auto`, `rounded-*`, `object-cover`, `alt` real) y el **texto** (`flex-1`, parrafos con acentos/enlaces subrayados al estilo del mock, pero con la tipografia del portafolio).
- Fila 2: card de **chips** (~70%: `lg:basis-2/3`) + card de **mapa** (`lg:basis-1/3`), ambas `k-card` (`bordered rounded`), con `foto` arriba en mobile (`flex-col` → `lg:flex-row`).
- Chips: `k-chip size="sm"` agrupados por las 5 areas del CV con los labels de `skills.areas.*` (claves existentes) desde `skills` de `portfolio.ts`.
- Copy del About: aprobado (D5); la version final esta en el Enrichment tecnico, seccion "Copy del About". El borrador de abajo queda solo como referencia historica:
  > "¡Hola! Soy César Ríos, desarrollador web de 23 años radicado en Cali, Colombia. Llevo mas de 4 años creando, manteniendo y mejorando aplicaciones SaaS en produccion: frontend con Vue y Angular, backend con Spring Boot y Node.js, bases de datos SQL y NoSQL e infraestructura con Docker y Kubernetes. Me mueve la optimizacion y el rendimiento: ver que el codigo que escribo le sirve a alguien en su dia a dia es lo que me empuja, y me gusta crear cosas locas y ambiciosas que lleven el rendimiento al limite. Hoy construyo dos librerias propias, Khatarsis (interfaz) y Alytos (backend). Fuera del trabajo sigo programando por gusto, juego videojuegos en mis tiempos libres y trabajo acompañado de mis dos perros, que se acuestan a mi lado mientras programo."
- Enlaces del texto: **descartados** en el copy aprobado (Khatarsis y Alytos quedan como texto plano); sus URLs siguen usandose en las cards de proyectos.

### B. Mapa de Cali + hora — `src/components/about/CaliMapCard.vue` (create)

- `k-card` con: fila de encabezado (`k-icon` `mdi:map-marker`/pin + texto `about.mapTitle` = "Actualmente radicado en", segun el mock), el contenedor del mapa (`h-48` aprox., `overflow-hidden rounded-*`, `k-image`/`div` como soporte), y debajo la fila `Cali, Colombia` (de `contact.location`) + `k-icon` `mdi:weather-night`/`mdi:white-balance-sunny` + la **hora** `HH:MM:SS`.
- Leaflet 1.9.4: `import L from 'leaflet'` + `import 'leaflet/dist/leaflet.css'`; `L.map(el, { center: [-3.4516, -76.532], zoom: 13, zoomControl: false, attributionControl: true, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, tap: false })` + `L.tileLayer(...)` + un punto de ubicacion (el mock muestra un pin; alternativa `L.circleMarker` con los tokens del tema para no depender de las imagenes del icono por defecto de Leaflet — decision D2).
- Un solo `onMounted`/`onBeforeUnmount`: crear mapa + `map.remove()` en el cleanup (no dejar listeners ni instancias). Sin re-render por tema: el cambio de tema solo altera el `filter` CSS (D2).
- Reloj: `Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })` + `setInterval` de 1000 ms limpiado en `onBeforeUnmount` (Bogota es UTC-5 todo el año, sin DST). Sin dependencias nuevas para la hora.
- Atribucion visible (licencia de tiles) en el propio mapa.

### C. Seccion Contacto (`#contact`) — `src/components/contact/ContactSection.vue` (create)

- `section#contact` con `useReveal`, header (`contact.kicker`/`contact.title`/`contact.subtitle`, claves existentes) y la misma fila de botones del hero: `k-button` `relief hover` con `icon` `mdi:github` / `mdi:linkedin` / `mdi:whatsapp` y sus `href`/`aria-label` desde `contact` (`githubUrl`, `linkedinUrl`, `whatsappUrl`).
- D7 resuelta: **no** se agrega boton de email; la seccion monta `<social-links />`, los mismos 3 botones del hero desde una sola fuente.

### D. Footer — `src/components/layout/Footer.vue` (create) + `MainView.vue` (edit)

- `footer` con blur (`backdrop-blur-md` + fondo translucido `bg-white/70 dark:bg-black/60`) y `k-separator` opcional; contenido: logo (a `#hero`/`/` con el mismo handler del navbar), lista de links generada de `NAV_SECTIONS` (nav + footer comparten la fuente), `<social-links />` (en vez de una fila de contacto nueva) y la linea de copyright `contact.footer.rights` (clave existente).
- Se monta en `MainView.vue` despues de `<contact-section />` (no en `App.vue`: depende de las anclas de la pagina y debe vivir dentro del flujo de scroll que manejan Lenis/ScrollTrigger).
- Orden final de secciones: ver D1 (por defecto `hero → projects → about → contact → footer`).

### E. Logo en navbar + favicon

- Copiar assets: `cp` del `.ico` → `public/favicon.ico`; del favicon 1024 RGBA → `public/apple-touch-icon.png` y `src/assets/logo/logo-script-v4.png` (Vite sirve `public/` en la raiz y resuelve `src/assets` con hash al importar).
- `index.html`: reemplazar el `<link rel="icon" ... href="/favicon.svg">` por `<link rel="icon" href="/favicon.ico" sizes="any">` + `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`. `public/favicon.svg` **no se elimina** (RULES 0.2).
- `Navbar.vue`: el `<button>` del logo mantiene `aria-label="nav.ariaHome"`, `handleLogoClick` y sus clases de layout, pero adentro va `<img :src="logo" alt="" class="h-8 w-auto">` (alt vacio: el nombre accesible lo da el `aria-label` del boton) en lugar del `<span>César Ríos</span>`.
- Tema: **resuelto**. El PNG del favicon es transparente (verificado) y la marca `#995CD0` lee bien sobre blanco y sobre `#100A18`, asi que se usa **una sola imagen** en navbar y footer; se descarta el par por tema. El `.ico` multi-tamano (16→256, RGBA) va a `public/favicon.ico` y el 1024 a `public/apple-touch-icon.png` + `src/assets/logo/logo-script-v4.png`.

### E2. Generacion del SVG del logo (metodo verificado en dry-run, 2026-09-11)

- **Que se genera:** `src/assets/logo/logo-script-v4.svg` — viewBox `0 0 1024 1024`, un unico `<path>` con los dos subcontornos de la marca rellenos con `fill="#995CD0"`, sin fondo (transparente por construccion).
- **Como (verificado, sin instalar nada):** el PNG transparente del favicon tiene **2 contornos exteriores y 0 agujeros** (la `C` como trazo grueso y la estrella), asi que se traza con `cv2.findContours(mask, RETR_CCOMP, CHAIN_APPROX_NONE)` + `cv2.approxPolyDP` y se emite el `d` resultante. Medicion real del trazado contra el raster original (IoU, y pixeles distintos sobre el total):

| `approxPolyDP` eps | Puntos | IoU | Pixeles distintos |
| --- | --- | --- | --- |
| 0.4 px | 1557 | 0.99991 | 0.009% |
| 0.6 px | 653 | 0.99749 | 0.251% |
| 0.8 px | 217 | 0.99661 | 0.339% |
| 1.2 px | 127 | 0.99512 | 0.490% |

- **Eleccion:** `eps = 0.6` (IoU 99.75%, el resto es antialiasing del borde). Si se quiere un archivo mas liviano, `eps = 0.8` da 217 puntos con la misma apariencia a los tamanos de uso (navbar `h-8`, footer chico).
- **Alternativa registrada:** convertir el poligono a cubicas (Catmull-Rom -> Bezier) para curvas mas suaves con menos nodos; no es necesaria a los tamanos de despliegue y agrega riesgo de overshoot en los extremos de la `C`.
- **Cruce de veracid:** el hermano `logo-firma-glitch.svg` prueba que la marca esta construida como `C` caligrafica + estrella, lo que coincide con los 2 contornos trazados.
- **Uso:** el SVG va al navbar y al footer (nitido a cualquier tamano); el PNG transparente se conserva como respaldo y para `apple-touch-icon`, y el `.ico` multi-tamano sigue siendo el favicon.

### F. Cards de proyectos clickeables — `ProjectCard.vue` (edit)

- `<k-card as="a" :href="props.project.url" target="_blank" rel="noopener">` (Vue pasa `href`/`target`/`rel` al root `<a>` del componente; se mantiene `v-effect="'spotlight'"` + los slots actuales).
- Nueva clave i18n `projects.openProject` ("Abrir {name}" / "Open {name}") para el `aria-label` (el texto de la card es descriptivo pero no accionable). `projects.viewOnGitHub` queda sin uso (no se borra el copy).
- Verificar que el `<a>` no rompa el layout de la card (el root `<a>` es `flex flex-col` por la clase `.card`) ni el `h-full` del grid; `cursor-pointer` viene del elemento por defecto.

### G. Navbar, router y hero coherentes con las secciones nuevas

- `router/index.ts`: `NAV_SECTIONS` = `about` (`hash: '#about'`, `labelKey: 'nav.about'`), `projects` (sin cambios) y `contact` (`hash: '#contact'`, `labelKey: 'nav.contact'` — clave existente). `routesMap` intacto.
- i18n: nueva clave `nav.about` ('Sobre mí' / 'About').
- `HeroSection.vue`: `handleGoToProfile` se renombra a `handleGoToAbout` (RULES 0.13) y pasa a `router.push({ path: '/', hash: '#about' })`; el label `hero.knowMe` ('Conóceme') queda igual.
- **Barrido completo de rutas y copy muerto** (instruccion del usuario, 2026-09-11): se eliminan `profile`, `experience` e `interests` de `routesMap`, de `RouteName` y del arreglo de rutas (quedan `main`, `projects` y `contact`), junto con las claves `nav.profile|experience|interests`, `contact.footer.home|profile|experience|projects|ariaNavigation` y `projects.viewOnGitHub`. `routesMap` apunta unicamente a secciones reales y no queda rastro de secciones que no existen ni van a existir.

### H. i18n (nuevas claves, paridad es/en)

- `nav.about` ('Sobre mí' / 'About').
- `about.kicker`, `about.title`, `about.subtitle`, `about.stackTitle` — **renombradas** desde `profile.kicker|title|subtitle|stackTitle` con los mismos valores (hoy sin consumidor, verificado por grep), para que ancla, componente y claves digan lo mismo.
- `about.body: string[]` (2 parrafos, copy aprobado), `about.photoAlt`, `about.mapTitle`, `about.timeAria`.
- `social.ariaGitHub|ariaLinkedIn|ariaWhatsApp` (movidas desde `hero.aria*`, mismos valores).
- `projects.openProject` ('Abrir {name}' / 'Open {name}') para el `aria-label` de la card.
- `projects.items.<key>.description` **reescritas** (5) en `es` y `en`, con paridad exacta (F2).
- Reutilizadas sin duplicar: `skills.areas.*`, `nav.projects/contact`, `nav.ariaNavigation`, `contact.kicker/title/subtitle/location`, `contact.footer.rights`, `projects.techTooltip`.
- `profile.role|description` se **renombran** a `hero.role|description` (su unico consumidor es el hero), de modo que en i18n no queda ninguna clave llamada `profile.*`.
- **Eliminadas** en este plan (rutas y copy de secciones inexistentes): `nav.profile|experience|interests`, `contact.footer.home|profile|experience|projects|ariaNavigation`, `projects.viewOnGitHub` y `profile.bio` (sin consumidor y reemplazado por el copy aprobado `about.body`).
- Conservadas sin ruta ni consumidor, por ser contenido del CV reutilizable: `experience.*` e `interests.*`. El plan no las usa ni las borra.

## Decisiones resueltas por el usuario (2026-09-11)

| # | Decision | Eleccion del usuario |
| --- | --- | --- |
| D1 | Orden de secciones | `hero → projects → about → contact → footer` |
| D3 | Foto del About | Stock externa provisoria, documentada como tal; se reemplaza cuando comparta su foto |
| D4 | Logo | El PNG del favicon **ya es transparente** (verificado): una sola imagen, sin variantes por tema. Quiere tambien SVG "si se puede": ver D4-abierta |
| D5 | Copy del About | **Se usa el borrador de la Seccion A tal cual** |
| D7 | Botones de Contacto | Los 3 del hero (GitHub, LinkedIn, WhatsApp), sin email extra |
| D8 | `public/favicon.svg` | Se conserva (RULES 0.2); el `link` de `index.html` pasa al `.ico` nuevo |
| Alcance | Seccion de Experiencia | **No entra como seccion.** El texto de las 3 experiencias del CV se resume y se usa para enriquecer las **descripciones de las cards de proyectos** (F2) |

## Decisiones abiertas (se resuelven en enrichment)

- **D1.** Resuelta (orden fijado arriba).
- **D2. Mapa: DECIDIDO Leaflet + tiles OSM keyless.** El usuario pidio "una liviana que sea opensource" y no distinguia las cuatro opciones: **Leaflet 1.9.4** (BSD-2-Clause, ~42 KB, cero dependencias) es la mas liviana y open source de las cuatro, asi que la eleccion recae ahi. Descartadas con motivo: CARTO exige API key y su tier free es no comercial; MapLibre + OpenFreeMap pesa ~5x; el iframe de OSM no permite oscurecer el mapa con el tema. Pin con `circleMarker`/CSS sobre los tokens del tema (sin las imagenes por defecto del icono de Leaflet), `filter` en dark y atribucion visible. **Autorizado por el usuario el 2026-09-11**: `bun add leaflet` (+ `@types/leaflet` si TS lo pide) queda permitido como unico cambio de dependencias.
- **D3.** Resuelta: stock externa provisoria, con el reemplazo por `src/assets/about/portrait.*` (local) cuando comparta la suya.
- **D4.** Resuelta: el PNG de 1024 **ya tiene fondo transparente** (verificado) y el usuario pidio ademas el **SVG generado por nosotros** a partir de ese PNG. Metodo validado en dry-run (2026-09-11, ver E2): `opencv-python` + `numpy` estan disponibles en el Python del entorno (`PIL 12.3.0`, `numpy 2.4.6`, `scipy 1.17.1`, `cv2 5.0.0`; **no** hay `skimage`, `potrace`, `magick` ni `identify`).
- **D5.** Resuelta: se usa el borrador de la Seccion A tal cual (es y en).
- **D6. Footer y blur.** Si el `backdrop-blur` del footer interactua mal con el canvas del terminal (el blur afecta lo que hay detras), confirmar en la revision visual; alternativa `bg-*/80` sin blur.
- **D7.** Resuelta: 3 sociales, igual que el hero.
- **D8.** Resuelta y ampliada: `public/favicon.svg` **conserva el archivo** pero cambia de contenido —pasa a ser la `C` trazada y el placeholder violeta con `<>` desaparece—, y el `.ico` nuevo queda como respaldo junto al `apple-touch-icon`.

### F2. Descripciones de las cards de proyectos (pedido del usuario 2026-09-11)

- Problema reportado: las descripciones actuales de las cards son pobres frente al CV. La seccion de Experiencia **no** se crea; su contenido se resume en las cards.
- Se reescriben las 5 claves `projects.items.<key>.description` (`softii`, `brilla`, `businessSuite`, `khatarsis`, `alytos`) en `es.ts` y `en.ts`, con el texto de las 3 experiencias del CV **resumido y sin jerga tecnica** (el stack ya lo muestran los chips de cada card):

| Card | Fuente en el CV | Hilo del texto |
| --- | --- | --- |
| Softii | Experiencia Softii (Feb 2024 - Abr 2025, remoto) | E-commerce SaaS para tiendas locales de Mexico: modulo de comandas de punta a punta, productos con inventario/precios/categorias/etiquetas y rediseno del punto de venta y de la gestion de usuarios |
| Brilla | Experiencia AD Soluciones (May 2025 - Feb 2026) | Plataforma de financiacion: pagos integrados con Cencosud, Olimpica y Exito, modulo de ventas con comisiones y descuentos, usuarios con roles y permisos y validacion de sesion unica |
| Business Suite | Experiencia ArquitecSOFT (Ene 2022 - Feb 2024) | Suite de servicios publicos (acueducto, gas, energia y aseo) sobre microservicios y microfrontends: migracion a la version 5.0, creador visual de flujos por nodos y generador de reportes dinamicos |
| Khatarsis | Seccion Proyectos del CV | Libreria de componentes Vue y entorno para construir interfaces con contexto, velocidad y consistencia |
| Alytos | Seccion Proyectos del CV | Libreria backend Java plug-n-play por modulos con auto-configuracion: la base lista para solo anadir la logica de negocio |

- Restricciones: **nada de metricas ni logros inventados** (solo lo que dice el CV), 1-2 frases por card, sin repetir el stack que ya esta en los chips, y paridad exacta es/en.
- **Textos aprobados por el usuario (2026-09-11) tal cual estan redactados en el Enrichment tecnico**, junto con las correcciones de las 2 afirmaciones sin respaldo en el CV.
- No se toca `k-card` ni el layout: es contenido i18n sobre el `descriptionKey` que ya existe en `portfolio.ts`.

## Pasos

1. **read** todos los archivos del alcance + `../cv/.agents/templates/cv/index.html` (fuente del copy) antes de tocar nada; confirmar que el estado del repo sigue igual (hay ediciones concurrentes).
2. **autorizacion aparte (RULES 0.4):** `bun add leaflet` (+ `bun add -d @types/leaflet` si TS lo requiere) — unico cambio de dependencias. **Sin este OK no se ejecuta la Seccion B**: el usuario ya eligio Leaflet, pero el comando sigue bloqueado por regla.
3. **assets:** `cp` del `.ico` y del PNG transparente a `public/` y `src/assets/logo/`; generar `src/assets/logo/logo-script-v4.svg` con el metodo de E2 (dry-run ya validado) y editar `index.html`.
4. **i18n:** agregar las claves nuevas en `es.ts` y `en.ts` con paridad exacta (H), incluida la reescritura de `projects.items.<key>.description` (F2) a partir del CV.
5. **data:** actualizar `skills` de `portfolio.ts` al CV (5 grupos) y `profile.age` a 23. `experiences` no se toca: sigue sin consumidor de UI porque la seccion de Experiencia queda fuera de alcance.
6. **create** `AboutSection.vue` (A) y `CaliMapCard.vue` (B).
7. **create** `ContactSection.vue` (C) y `Footer.vue` (D).
8. **edit** `MainView.vue` (montaje + orden D1), `router/index.ts` (G), `HeroSection.vue` (G), `Navbar.vue` (E), `ProjectCard.vue` (F).
9. **verificacion estatica:** paridad de claves i18n es/en; cero `[...]`/margenes nuevos; anclas `#about`, `#projects` y `#contact` con `id` real en el DOM; `NAV_SECTIONS` sin entradas muertas; las 5 URLs de proyectos usadas; sin imports muertos.
10. **verificacion real** (autorizacion aparte): `bun run lint:check`, `bun run format:check`, `bun run build`; `bun run dev` para la revision visual (foto/texto, chips, mapa + hora de Cali, contacto, footer con blur, logo en navbar/favicon, cards abriendo su URL, light y dark).
11. **reviewer + DoD** antes de `CLOSED`.

## Verificacion

- Estatica: las de Step 9; ademas `leaflet` en `package.json` solo si fue autorizado y `leaflet/dist/leaflet.css` importado una sola vez.
- Runtime: mapa montado una sola vez (sin duplicar canvas/tiles al navegar entre rutas), `map.remove()` ejecutado (sin listeners colgados al desmontar), hora de Cali actualizada cada segundo y correcta contra `America/Bogota`, atribucion visible, y las cards abriendo `project.url` en pestaña nueva.
- Comandos: `bun run lint:check` + `bun run format:check` + `bun run build` (autorizacion aparte); el build comparte el rojo ajeno de `GlitchCursor.vue` hasta que su flujo lo resuelva.

## Riesgos

1. **Dependencia nueva** (Leaflet + tipos): `bun add` modifica `package.json`/`bun.lock` y requiere autorizacion explicita; sin ella, el plan no puede ejecutar la seccion B.
2. **Tiles externos:** terceros pueden cambiar limites/licencias (CARTO ya paso a exigir key); dejar el proveedor aislado en una constante del componente para poder cambiarlo sin tocar el resto.
3. **Leaflet + CSS:** `leaflet/dist/leaflet.css` es global; sus `.leaflet-*` traen `z-index` altos que pueden tapar el navbar (`z-40`) → encapsular con `isolation`/`z-0` en el contenedor y verificar visualmente.
4. **Blur del footer sobre canvas WebGL:** puede costar rendimiento o verse distinto segun el navegador (D6).
5. **Ediciones concurrentes:** `GlitchCursor.vue` y otros archivos cambian durante la sesion; releer antes de editar.
6. **Copy personal:** el borrador del About debe pasar por el usuario antes de darlo por bueno (D5); nada de inventar datos personales (solo lo dictado + el CV).
7. **`profile.age`**: el portfolio dice 22 y hoy tiene 23 (segun `CONTEXT.md`); se actualiza a 23 y queda escrito de donde sale el dato.

## Enrichment tecnico (2026-09-11)

### Analisis

- **Objetivo:** entregar About + Contacto + footer + logo/favicon + cards clickeables con descripciones ricas, sin agregar nada no pedido. Todas las decisiones estan cerradas (D1-D8 + Leaflet autorizado + SVG a generar por nosotros).
- **Archivos finales:** 1 SVG generado + 3 assets copiados + 6 archivos nuevos (`common/SocialLinks.vue`, `profile/ProfileSection.vue`, `profile/CaliMapCard.vue`, `contact/ContactSection.vue`, `layout/Footer.vue`) + 1 edicion de contenido (`public/favicon.svg`) + 8 editados (`index.html`, `i18n/locales/es.ts`, `i18n/locales/en.ts`, `data/portfolio.ts`, `views/MainView.vue`, `router/index.ts`, `layout/Navbar.vue`, `projects/ProjectCard.vue`, `hero/HeroSection.vue`, `style.css`).
- **Correcciones al plan inicial detectadas al leer el codigo (obligatorias):**
  1. La ruta real de las descripciones es **`projects.items.<key>.description`** (no `projects.descriptions.*`, que no existe). Todo el plan queda corregido a esa ruta.
  2. **`#profile` ya existe** (`routesMap.profile`, la clave `nav.profile` y el boton "Conoceme" del hero). El enrichment propuso reutilizarla; **el usuario eligio crear `#about`** (2026-09-11), asi que el plan compensa el costo: `handleGoToProfile` → `handleGoToAbout`, `nav.about` nueva y renombre de las claves de copy `profile.*` → `about.*` (hoy sin consumidor). Ademas, todo rastro de las secciones inexistentes **se elimina** (`/profile`, `/experience`, `/interests`; `RouteName`; `nav.profile|experience|interests`; `contact.footer.home|profile|experience|projects|ariaNavigation`; `projects.viewOnGitHub`). Ver decision 1.
  3. Las descripciones actuales no son solo pobres: **dos afirman cosas que el CV no dice** ("2 anos de desarrollo activo" en Khatarsis; "seguridad JWT, CRUD y contratos de API" en Alytos). La reescritura corrige veracidad, no solo estilo.
  4. Los 3 botones sociales del hero son **markup inline** y los necesitan Contacto y el footer → se extraen a un componente compartido (RULES 0.6). Ver decision 2.
  5. Claves i18n **hoy sin consumidor** que este plan revive o reutiliza: `contact.kicker|title|subtitle`, `contact.footer.rights`, `skills.areas.*`. Las 5 claves de copy del About (`profile.kicker|title|subtitle|stackTitle|bio`) se **renombran** a `about.*` en vez de reutilizarse, y `nav.profile|experience|interests` se **eliminan** (igual que el resto del copy de secciones inexistentes) porque apuntan a lo que no existe; el navbar usa la nueva `nav.about`. (Verificado por grep: su unico uso actual es su declaracion en los locales.)

### Cambios por archivo

| # | Archivo | Accion | Detalle |
| --- | --- | --- | --- |
| 1 | `src/assets/logo/logo-script-v4.svg` | create | Trazado E2 del PNG transparente: 2 subcontornos, `approxPolyDP` eps 0.6 (653 nodos), `fill="#995CD0"`; `viewBox="93 99 838 825"` (bbox real 117,123,790,777 + 24 px de aire) para que el icono no herede el padding del raster. Decorativo: sin `<title>`, con `aria-hidden` en el `<img>` (el nombre accesible lo da el boton). ~8-10 KB contra los 78 KB del PNG. |
| 2 | `public/favicon.svg` | edit (contenido) | Hoy es un placeholder (cuadrado `#8b5cf6` con `<>`). Se reemplaza por el mismo trazado de la C. No se elimina el archivo (RULES 0.2): se reescribe su contenido. |
| 3 | `public/favicon.ico`, `public/apple-touch-icon.png`, `src/assets/logo/logo-script-v4.png` | create (cp) | Copia de `logo-firma-script-v4.ico` (multi-tamano 16→256) y del PNG transparente de 1024 (respaldo + apple-touch-icon). |
| 4 | `index.html` | edit | Se conserva `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` (nitido a cualquier tamano) y se agregan `<link rel="icon" href="/favicon.ico" sizes="any">` y `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`. |
| 5 | `src/i18n/locales/es.ts` + `en.ts` | edit | `nav.about` nueva; renombre de `profile.kicker\|title\|subtitle\|stackTitle` a `about.*` (mismos valores) y borrado de `profile.bio`; nuevas `about.body: string[]` (2 parrafos, copy aprobado), `about.photoAlt`, `about.mapTitle`, `about.timeAria`, `social.ariaGitHub\|ariaLinkedIn\|ariaWhatsApp` (movidas desde `hero.aria*`, que se eliminan) y `projects.openProject` ('Abrir {name}'); mas las 5 descripciones reescritas. Se **eliminan** `nav.profile|experience|interests`, `contact.footer.home|profile|experience|projects|ariaNavigation` y `projects.viewOnGitHub`, y se **renombran** `profile.role|description` a `hero.role|description`. Paridad exacta es/en. |
| 6 | `src/data/portfolio.ts` | edit | `skills` con los 5 grupos completos del CV (incluye Quasar, Tailwind, Microfrontends, NestJS, REST API, Microservices, SQL Server, PostgreSQL, CI/CD, Linux, Vite) y `profile.age: 23`. `experiences` no se toca. |
| 7 | `src/components/common/SocialLinks.vue` | create | Los 3 `k-button` (`relief hover`, `icon`, `target="_blank"`, `rel="noopener"`, `:aria-label`) desde `contact` de `portfolio.ts`, en `div.flex.flex-wrap.items-center.gap-4`. Tres consumidores: hero, Contacto, footer. |
| 8 | `src/components/about/AboutSection.vue` | create | `section#about` + `useReveal`; header con `about.kicker/title/subtitle`; fila foto (left) + texto (`about.body`); fila chips (`lg:basis-2/3`, `#title` = `about.stackTitle`, `k-chip size="sm"` por area con labels `skills.areas.*`) + `CaliMapCard` (`lg:basis-1/3`). |
| 9 | `src/components/about/CaliMapCard.vue` | create | Subcomponente justificado (RULES 0.3): ciclo de vida DOM de Leaflet con cleanup propio. `k-card bordered rounded`, header (`k-icon` pin + `about.mapTitle`), mapa `h-48` con `relative isolate z-0 overflow-hidden`, y fila inferior `contact.location` + icono dia/noche + hora de Cali. |
| 10 | `src/components/contact/ContactSection.vue` | create | `section#contact` + `useReveal`; header `contact.kicker/title/subtitle` + `<social-links />`. |
| 11 | `src/components/layout/Footer.vue` | create | `footer` con `backdrop-blur-md` + `bg-white/70 dark:bg-black/60`; logo (SVG) que vuelve al inicio con `handleLogoClick` equivalente, links generados de `NAV_SECTIONS` (misma fuente que el navbar), `<social-links />` y `contact.footer.rights`. |
| 12 | `src/views/MainView.vue` | edit | Monta en orden `hero → projects → profile → contact → footer`; se mantiene el `ScrollTrigger.refresh()` + `scrollTo(route.hash)`. |
| 13 | `src/router/index.ts` | edit | `NAV_SECTIONS` = `about`, `projects`, `contact` con `labelKey` `nav.about` (nueva), `nav.projects` y `nav.contact` (existentes). Ademas se eliminan `profile`, `experience` e `interests` de `routesMap`, de `RouteName` y del array generado de rutas, de modo que `/profile`, `/experience` e `/interests` dejan de existir. Se eliminan tambien los tipos exportados `NavSection` y `SectionId`, sin consumidores fuera del propio router (verificado por grep). |
| 14 | `src/components/layout/Navbar.vue` | edit | El `<span class="italic">César Ríos</span>` pasa a `<img :src="logo" alt="" class="h-8 w-auto">` (import del SVG); se conservan `aria-label="nav.ariaHome"`, `handleLogoClick` y las clases del boton. |
| 15 | `src/components/projects/ProjectCard.vue` | edit | `as="a"` + `:href="project.url"` + `target="_blank"` + `rel="noopener"` + `:aria-label="t('projects.openProject', { name: project.name })"`. Los slots, el `v-effect` y el `h-full` no cambian. |
| 16 | `src/components/hero/HeroSection.vue` | edit | Reemplaza los 3 `k-button` sociales por `<social-links />`; `handleGoToProfile` pasa a `handleGoToAbout` con `router.push({ path: '/', hash: '#about' })` y el label "Conoceme" no cambia; `t('profile.role')` y `t('profile.description')` pasan a `t('hero.role')` y `t('hero.description')`. |
| 17 | `src/style.css` | edit | Reglas del mapa con `@apply` sobre el DOM que genera Leaflet (no alcanzable desde el template): `.dark .cali-map-tiles { @apply invert hue-rotate-180 brightness-90 contrast-125 }` y `.cali-map .leaflet-control-attribution { @apply bg-white/70 text-neutral-600 dark:bg-black/60 dark:text-zinc-400 }`. Sin `font-size` (la tipografia del control la fija Leaflet, §7.4). |

### Mapa: detalle tecnico cerrado

- `import L from 'leaflet'` + `import 'leaflet/dist/leaflet.css'` (una sola vez en todo el proyecto). Tipos: `bun add -d @types/leaflet` (Leaflet 1.9 no trae tipos).
- `L.map(el, { center: [3.4516, -76.532], zoom: 13, zoomControl: false, attributionControl: true, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false })` — interacciones apagadas a proposito: un mapa arrastrable dentro de una pagina con Lenis se roba el scroll del usuario.
- Tiles: `L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, className: 'cali-map-tiles', attribution: '&copy; OpenStreetMap' })`. La `className` es la que habilita el filtro oscuro sin invertir el pin ni la atribucion.
- Pin: `L.circleMarker([3.4516, -76.532], { radius: 7, color: '#995CD0', weight: 3, fillColor: '#995CD0', fillOpacity: 1 })` — sin las imagenes del icono por defecto de Leaflet (romperian con el build y con el tema).
- Cleanup: un solo `onMounted` y `onBeforeUnmount(() => map.remove())`; sin re-render por tema (el cambio de tema solo cambia el filtro CSS).
- Reloj: `Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })`, `setInterval` de 1000 ms guardado y limpiado en `onBeforeUnmount`; el icono dia/noche sale de la hora (18:00-06:00 → `mdi:weather-night`).
- Atribucion visible (obligatoria por la licencia de OSM) y `z-0 isolate` en el contenedor para que los `z-index` 400-700 de Leaflet no tapen el navbar (`z-40`).

### Copy del About (aprobado, se implementa tal cual)

- `about.body[0]`: "¡Hola! Soy César Ríos, desarrollador web de 23 años radicado en Cali, Colombia. Llevo más de 4 años creando, manteniendo y mejorando aplicaciones SaaS en producción: frontend con Vue y Angular, backend con Spring Boot y Node.js, bases de datos SQL y NoSQL e infraestructura con Docker y Kubernetes."
- `about.body[1]`: "Me mueve la optimización y el rendimiento: ver que el código que escribo le sirve a alguien en su día a día es lo que me empuja, y me gusta crear cosas locas y ambiciosas que lleven el rendimiento al límite. Hoy construyo dos librerías propias, Khatarsis (interfaz) y Alytos (backend). Fuera del trabajo sigo programando por gusto, juego videojuegos en mis tiempos libres y trabajo acompañado de mis dos perros, que se acuestan a mi lado mientras programo."

### Descripciones nuevas de las cards (APROBADAS por el usuario el 2026-09-11, `projects.items.<key>.description`)

- **softii:** "Comercio electrónico SaaS multiempresa para tiendas locales de México. Construí desde cero el módulo de comandas, rehice el de productos para integrar inventario, precios, categorías y etiquetas, y rediseñé el punto de venta y la configuración de usuarios. El resto del tiempo lo dedicaba a resolver lo que reportaban los usuarios, así que conozco el producto por dentro y por fuera."
- **brilla:** "Plataforma de financiación de servicios públicos sobre microservicios. Integré los pagos con Cencosud, Olímpica y Éxito, construí todo el módulo de ventas con su sistema de comisiones y descuentos, y refactoricé el de usuarios con las reglas, permisos y roles de cada negocio, además de la validación de sesiones simultáneas en el login."
- **businessSuite:** "Suite de servicios públicos (acueducto, gas, energía y aseo) sobre microservicios y microfrontends, en producción. Participé en la migración a la versión 5.0 desarrollando vistas y sus servicios, diseñé un creador visual de flujos por nodos con su visor de atención, construí un generador de reportes dinámicos y creé la librería interna de componentes reutilizables que sigue vigente en la suite."
- **khatarsis:** "Librería de componentes y entorno para construir interfaces Vue con contexto, velocidad y consistencia. Es la base visual de este portafolio y el taller donde pruebo lo que después aplico en productos reales."
- **alytos:** "Librería backend en Java, plug-n-play y por módulos con auto-configuración: la base de un servicio lista para agregar solo la lógica de negocio. En construcción sobre Spring Boot y WebFlux."
- En ingles: traduccion fiel palabra por palabra, misma longitud y mismo tono (paridad 1:1 de claves).
- Fuera de las descripciones se eliminan las 2 afirmaciones sin respaldo en el CV que hoy existen (`2 años de desarrollo activo`, `seguridad JWT, CRUD y contratos de API`).

### Restricciones

- RULES 0.2 (no borrar archivos: `public/favicon.svg` se reescribe, no se elimina), 0.3 (los 2 subcomponentes con causa tecnica explicada: el mapa por ciclo de vida DOM; `SocialLinks` por RULES 0.6), 0.5 (las skills cargadas son referencia; manda el estandar local), 0.6 (una sola fuente para los links: `NAV_SECTIONS`), 0.9/0.13 (identificadores y comentarios en ingles; copy visible en i18n), 0.12 (ADR si se consolida la decision del favicon/logo vectorial).
- §7.1 cero margenes: separacion con `flex` + `gap` + padding. §7.2 sin `width`/`height` fijos en elementos flexibles (la foto es fija `w-52` = 208 px ≥ 200 px pedidos, y el texto es `flex-1`: son elementos distintos). §7.4 sin tocar tipografia heredada. §7.5 sin valores `[...]` (`lg:basis-2/3` / `lg:basis-1/3` resuelven el 70/30). §7.6 Tailwind-first: las reglas del mapa usan `@apply` sobre clases que Leaflet agrega a su propio DOM.
- Sin secretos (RULES 0.8): los tiles de OSM son keyless. Sin scripts de dev/build/test sin autorizacion: `bun add leaflet` **ya esta autorizado** (2026-09-11); `lint:check`, `format:check` y `build` fueron autorizados por el usuario en esta sesion.
- Fuera de alcance: khatarsis, los planes de otros flujos (`GlitchCursor.vue`), `profile.bio`, las claves i18n muertas (`nav.experience|interests`, `contact.footer.home|profile|experience|projects|ariaNavigation`, `projects.viewOnGitHub`), y Git.

### Steps

1. **read** los 17 archivos del alcance (hecho en el enrichment) y re-verificar que no cambiaron por ediciones concurrentes antes de tocar.
2. **dependencia (autorizada):** `bun add leaflet` + `bun add -d @types/leaflet`.
3. **assets:** `cp` del `.ico` y del PNG transparente; generar `src/assets/logo/logo-script-v4.svg` (metodo E2, eps 0.6) y reemplazar el contenido de `public/favicon.svg` por el mismo trazado; editar los 3 `<link>` de `index.html`.
4. **i18n:** en `es.ts` y `en.ts`, agregar `nav.about`, renombrar `profile.kicker|title|subtitle|stackTitle` a `about.*` y borrar `profile.bio`, agregar `about.body|photoAlt|mapTitle|timeAria`, mover `hero.aria*` a `social.aria*`, agregar `projects.openProject`, reescribir las 5 descripciones, renombrar `profile.role|description` a `hero.role|description` y eliminar `nav.profile|experience|interests` + `contact.footer.home|profile|experience|projects|ariaNavigation` + `projects.viewOnGitHub`. Paridad exacta.
5. **data:** `skills` con los 5 grupos del CV y `profile.age: 23`.
6. **create** `common/SocialLinks.vue`.
7. **create** `about/AboutSection.vue` y `about/CaliMapCard.vue`.
8. **create** `contact/ContactSection.vue` y `layout/Footer.vue`.
9. **edit** `views/MainView.vue`, `router/index.ts`, `layout/Navbar.vue`, `projects/ProjectCard.vue`, `hero/HeroSection.vue`.
10. **edit** `style.css` (reglas del mapa con `@apply`).
11. **verificacion estatica:** paridad de claves es/en (arboles identicos), 3 anclas con `id` real (`#about`, `#projects`, `#contact`), `NAV_SECTIONS` sin entradas muertas y sin claves i18n inexistentes, 0 claves `hero.aria*` restantes, 0 `[...]`, 0 `m-*`, `leaflet` importado una sola vez, `map.remove()` y `clearInterval` presentes, `project.url` usada en el `href` de la card; 0 referencias a `profile`, `experience` o `interests` como rutas o claves en `src/router/` y en los locales.
12. **verificacion real (autorizada):** `bun run lint:check`, `bun run format:check`, `bun run build`; `bun run dev` para la revision visual en light y dark (About con foto/texto/chips/mapa/hora, Contacto, footer con blur, logo en navbar, favicon, cards abriendo la URL).
13. **revision de cierre** (`subagents/reviewer.md`) + DoD; ADR si corresponde.
14. **status** `EXECUTED` y, con DoD cumplido, entrada de memoria + `CLOSED`.

### Verificacion

- **Comandos:** `bun run lint:check`, `bun run format:check`, `bun run build` (autorizados en esta sesion). El build comparte el rojo ajeno de `GlitchCursor.vue` si su flujo no lo resolvio antes.
- **Runtime (dev server + preview):** una sola instancia de mapa (sin tiles duplicados al navegar entre rutas), `map.remove()` al desmontar (sin listeners colgados), reloj actualizado cada segundo contra `America/Bogota`, atribucion visible, filtro oscuro solo sobre los tiles, navbar por encima del mapa, y las 5 cards abriendo `project.url` en pestana nueva.
- **Manual:** el blur del footer sobre el canvas WebGL (D6) y el aire interno de las cards (`k-card size="md"` = `p-2` nativo de khatarsis, 8 px).

### Riesgos

1. **Leaflet CSS global** con `z-index` 400-700: mitigado con `isolate` + `z-0` en el contenedor y verificacion visual del navbar.
2. **Tiles de terceros:** OSM exige atribucion y no admite trafico alto; queda aislado en una constante del componente para poder cambiar de proveedor sin tocar nada mas.
3. **Bundle:** `bun add leaflet` suma ~42 KB + el CSS del mapa; es el unico peso nuevo y estaba acotado por el pedido de "dependencia ligera".
4. **Claves i18n movidas** (`hero.aria*` → `social.aria*`): si algun consumidor quedara sin actualizar, `format:check`/`lint:check` no lo detectan; lo cubre el grep del paso 11.
5. **Ediciones concurrentes** de otros flujos: releer antes de editar.

### Decisiones de enrichment que necesitan tu OK

1. **RESUELTA por eleccion del usuario (2026-09-11): ancla nueva `#about`** con `src/components/about/AboutSection.vue` + `CaliMapCard.vue`, navbar con `nav.about` ('Sobre mí') y el boton del hero renombrado a `handleGoToAbout`. Decidido despues (2026-09-11): `/profile` **se elimina** junto con el resto de rutas y claves muertas — ninguna ruta apunta a una seccion que no existe. Las 5 claves de copy del About se renombraron de `profile.*` a `about.*` (hoy sin consumidor) para que ancla, componente y claves coincidan.
2. **`SocialLinks.vue` compartido** (hero, Contacto, footer) moviendo `hero.ariaGitHub|ariaLinkedIn|ariaWhatsApp` a `social.aria*`: cero duplicacion de los 3 botones a cambio de tocar 3 lineas del hero.
3. **Favicon:** `favicon.svg` pasa a ser la C trazada (los navegadores modernos lo prefieren) y el `.ico` queda como respaldo + `apple-touch-icon`. El placeholder violeta con `<>` desaparece.

## Ejecucion (2026-09-11)

Executor. 12 pasos ejecutados. **16 archivos** tocados: 1 boundary de closure por edicion concurrente detectada en el paso 1 del enrichment y re-verificada antes de escribir.

| # | Archivo | Accion |
| --- | --- | --- |
| 1 | `package.json` / `bun.lock` | edit: `leaflet@1.9.4` + `@types/leaflet` (autorizado) |
| 2 | `public/favicon.ico`, `public/apple-touch-icon.png`, `src/assets/logo/logo-script-v4.{png,svg}` | create (copy) + SVG trazado (eps 0.6, 653 nodos, 5.3 KB vs 78 KB del PNG) |
| 3 | `public/favicon.svg` | edit: el placeholder violeta con `<>` pasa a ser la C trazada |
| 4 | `index.html` | edit: 3 `<link>` (svg + ico + apple-touch-icon) |
| 5 | `src/i18n/locales/es.ts`, `en.ts` | edit: `nav.about`, renombre `profile.*` → `about.*`, `hero.role|description`, `social.aria*`, `about.body|photoAlt|mapTitle|timeAria`, `projects.openProject`, 5 descripciones nuevas; borradas las claves y rutas muertas |
| 6 | `src/data/portfolio.ts` | edit: `skills` con los 5 grupos del CV, `profile.age: 23` |
| 7 | `src/components/common/SocialLinks.vue` | create |
| 8 | `src/components/about/AboutSection.vue`, `CaliMapCard.vue`, `src/assets/about/portrait.svg` | create |
| 9 | `src/components/contact/ContactSection.vue`, `src/components/layout/SiteFooter.vue` | create |
| 10 | `src/views/MainView.vue`, `src/router/index.ts`, `src/components/layout/Navbar.vue`, `src/components/projects/ProjectCard.vue`, `src/components/hero/HeroSection.vue` | edit |
| 11 | `src/style.css` | edit: reglas del mapa (filtro oscuro sobre los tiles, fondo y atribucion) |

Salidas del paso 11 y 12 (verificacion) abajo. **Sin Git:** nada stageado ni commiteado (RULES 0.9).

### Hallazgos de ejecucion (medidos, no asumidos)

1. **La foto externa no servia.** Un stock por URL no carga en el webview y, al medirla, el ancho real era **182 px**, por debajo del minimo de 200 px del pedido. Se reemplazo por un placeholder local (`src/assets/about/portrait.svg`, 6.2 KB, renderiza offline) y `w-60` deja el ancho medido en **210 px**. El import queda documentado en el componente para el swap por la foto real.
2. **`Footer.vue` → `SiteFooter.vue`.** Se renombro el archivo para no colisionar con el nombre reservado del componente de khatarsis.
3. **El rojo del `build` es ajeno.** Las 3 unicas lineas de error son de `src/components/cursor/GlitchCursor.vue` (otro flujo, plan `portfolio-glitch-cursor-pointer-hand`, `EXECUTED` sin cierre); los 16 archivos de este plan pasan `vue-tsc` sin un error.

## Cierre (memoria persistente)

- **Que cambio:** el portafolio deja de ser una landing y pasa a ser una pagina con 4 secciones reales (`#hero`, `#projects`, `#about`, `#contact`) mas footer. Se creo la seccion **About** (foto + bio + card de stack con los 5 grupos de skills del CV + card de mapa de Cali con hora local `America/Bogota` en vivo), la seccion **Contacto** (titulo + los 3 botones sociales ahora extraidos a `common/SocialLinks.vue`, compartidos con hero y footer) y el **footer** (logo, los enlaces del navbar desde `NAV_SECTIONS`, los 3 sociales y el copyright, con `backdrop-blur`). Se reemplazo el **logo/favicon** placeholder violeta por la `C` vectorial trazada del asset del usuario (PNG transparente → SVG de 653 nodos), aplicado en navbar, footer, `favicon.svg`, `favicon.ico` y `apple-touch-icon`. Las **5 cards de proyectos** pasaron de `article` a `a` con `project.url` (Softii, Brilla, ArquitecSOFT, Khatarsis, Alytos) y sus descripciones se reescribieron desde el CV (dos decian cosas que no estaban en la hoja de vida). Se **elimino `/profile`** y el resto de las rutas y claves i18n muertas (`nav.profile|experience|interests`, `contact.footer.home|profile|experience|projects|ariaNavigation`, `projects.viewOnGitHub`): hoy solo existen rutas hacia secciones que existen. El navbar quedo con `Proyectos · Sobre mí · Contacto`.
- **Verificacion:** `bun run lint:check` verde (0 hallazgos) y `bun run format:check` verde ("All matched files use Prettier code style!"). `bun run build` rojo **solo** por `GlitchCursor.vue` (3 errores de otro flujo; `grep` sobre las lineas `error TS` confirma `3 src/components/cursor/GlitchCursor.vue` y ningun archivo de este plan). Estatica: paridad exacta de i18n (54 claves en `es.ts` = 54 en `en.ts`, 0 diferencias por `comm`), 0 referencias a `profile.*`/`hero.aria*`/`viewOnGitHub` fuera del modelo de datos `profile` de `portfolio.ts`, 3 anclas con `id` real, 5 cards con `href` correcto. Runtime contra el dev server del 5173: secciones `hero/projects/about/contact` montadas; About con foto medida en 210 px, 28 chips, reloj `12:17:07` con `America/Bogota` y `sr-only` de aria; mapa con 3 tiles + `circleMarker` `#995CD0` + atribucion de OSM y filtro `invert` aplicado **solo** a `.cali-map-tiles` (en dark) con el pin y la atribucion intactos; navbar con los 3 enlaces a anclas reales; footer con `backdrop-filter: blur(12px)`, fondo `oklab(0 0 0 / 0.6)` y los 6 enlaces; tema probado en claro y oscuro sin regresion (nav claro `oklch(0.439 0 0)`, body negro sobre blanco; en dark cuerpo blanco y About `zinc-300`).
- **Resultado:** `EXECUTED`. Falta la revision del `reviewer` sobre el diff para autorizar `CLOSED`. Pendientes menores anotados: el aire interno de `k-card` (`size="md"` = `p-2`, 8 px nativo) y la lectura del texto del About sobre el canvas WebGL (mismo lenguaje visual que el resto del sitio, sin panel de fondo).
- Pendientes: [pendiente]
