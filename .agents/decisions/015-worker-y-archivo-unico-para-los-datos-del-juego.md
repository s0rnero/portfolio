---
name: 015-worker-y-archivo-unico-para-los-datos-del-juego
status: accepted
date: 2026-09-22
domain: portfolio
---

# ADR-015: Datos del juego como un único archivo, servidos por un Worker propio

## Contexto

- Los 17.399 ficheros del juego (1.045,5 MB) se servían desde un bucket R2 con la URL pública `pub-….r2.dev`.
- Cloudflare advierte en el propio panel que `r2.dev` es **solo para pruebas**: va con **límite de tasa**, no admite Access ni Caching y no permite fijar cabeceras, así que los objetos salían sin `Cache-Control`.
- La precarga completa (ADR-014) pedía esos ficheros **uno a uno** (`OD.ensure`), es decir miles de peticiones HTTP pequeñas por visita: coste de CPU y de cola en el host, y exposición al límite de tasa de `r2.dev`.
- El `Cache-Control` ausente agravaba lo anterior: ni el motor (156 MB) ni una nueva visita tenían garantizada la reutilización.

## Decisión

- **Transporte en un único archivo**: `vc-streamed.tar.gz` (815 MB) que contiene los 17.399 ficheros del manifiesto. El loader lo descarga **en streaming**, lo descomprime con `DecompressionStream('gzip')` (nativo, sin dependencias) y escribe **cada entrada directamente en la caché del motor** (`OD.idbPut`), la misma que su worker consulta antes de ir a la red. Después hace una pasada de comprobación y pide sueltos solo los que faltaran. Si el archivo no existe o falla, **cae al recorrido del manifiesto** de ADR-014 (degradación, nunca rotura).
- **Un Worker propio delante del bucket** (`worker/vc-data.js` + `wrangler.toml`, desplegado como `https://vicecity-data.carv-portfolio.workers.dev`): la ruta `<worker>/<key>` devuelve el objeto `<key>` de R2, así que las rutas que usa el sitio (`build/`, `manifest.json`, `streamed/`, `trailers/vc.mp4`, `vc-streamed.tar.gz`) no cambian. El Worker añade CORS (`*`), `accept-ranges: bytes`, `cache-control: public, max-age=86400` y decide **200/206 según la petición** (no según la respuesta del binding, que devuelve rango aunque no se le pida).
- Se descarta `r2.dev` para producción. Se descarta el dominio propio por ahora (coste anual); el Worker cubre lo mismo sin dominio, sin tarjeta y con plan gratuito.

## Consecuencias

- Positivas: una visita al juego pasa de **17.399 peticiones a ~6**; el límite de tasa de `r2.dev` deja de ser un riesgo práctico (el plan gratis del Worker son 100.000 peticiones/día); los objetos ya viajan con `Cache-Control`, así que al repetir visita no se revalida; el bucket se sigue sirviendo con CORS y `Range` correctos.
- Negativas / trade-offs: el archivo obliga a **mantenerlo sincronizado** con el manifiesto cuando cambien los datos (regenerarlo y re-subirlo); el desempaquetado consume CPU en el visitante (una sola vez, en streaming); se añade una pieza de infraestructura propia (el Worker) a un sitio estático; el `Content-Type` que reporta R2 para el archivo es `application/x-gzip`, así que el loader no se apoya en él sino en el tipo explícito de `DecompressionStream` y en la ausencia de `Content-Encoding` (si Cloudflare lo sirviera ya descomprimido, el loader no vuelve a descomprimir).
- Verificado: el archivo se descargó íntegro a través del Worker (854.866.751 bytes, MD5 igual al local) a ~21 MB/s; `200` sin `Range` y `206` con `Range`; CORS `*`.

## Alternativas Consideradas

- **Seguir con `r2.dev` + manifiesto**: descartada por el propio aviso de Cloudflare y por las 17.399 peticiones.
- **Dominio propio conectado al bucket**: es la vía "oficial" y permite Cache Rules, pero exige comprar dominio y mover la zona a Cloudflare; aplazada, no descartada.
- **Servir el archivo desde Netlify** (dejarlo en `dist/`): descartada: son 815 MB contra el plan de Netlify y el `dist` pasaría de 2,3 MB a 815 MB en cada deploy.
- **Un `.zip` en vez de `.tar.gz`**: descartada: leer un zip exige el directorio central o parsear local headers; el tar es secuencial y encaja con streaming puro.

## Estado

`proposed` -> `accepted` (cuando se confirme) / `superseded` (solo mediante un ADR nuevo que lo reemplace)
