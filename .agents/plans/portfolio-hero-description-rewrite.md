---
name: portfolio-hero-description-rewrite
status: EXECUTED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-10
enriched: 2026-09-10
---

## Plan Tecnico: Reescritura de la descripcion del hero (ES + EN, tono organico)

> Solicitud del usuario (2026-09-10): rehacer su descripcion del hero mezclando el texto actual con un texto nuevo que aporta, con sustituciones puntuales (Softii, Brilla) y tono organico. El usuario ajustara el borrador despues.

### Analisis

- Objetivo: Reescribir `profile.description` en ES con tono orgánico en primera persona, fusionando el texto actual con el texto aportado por el usuario, aplicando sustituciones exactas, y reflejarlo fielmente en EN. El usuario ajustará el borrador después.
- Scope: SOLO 2 strings: `profile.description` en `src/i18n/locales/es.ts` + `profile.description` en `src/i18n/locales/en.ts`. Nada más.
- Archivos:
  - `src/components/hero/HeroSection.vue` — solo lectura: renderiza `t('profile.description')` en `<p class="max-w-2xl ...">` (no se edita).
  - `src/i18n/locales/es.ts:27-28` — `profile.description` actual ES (único string ES a cambiar).
  - `src/i18n/locales/en.ts:27-28` — `profile.description` actual EN (único string EN a cambiar).
- Riesgos:
  - Longitud hero: el borrador condensa 7 requisitos en 2 frases compactas (~límite +15%). Si el usuario añade palabras al ajustar, puede requerir recorte.
  - Sustituciones exactas: el nuevo `description` no debe reintroducir `en producción` / `producción` / `production`, ni `ecommerce SaaS multiempresa` / `multi-tenant SaaS ecommerce`, ni `Cencosud / Olímpica / Éxito` (siguen existiendo en líneas fuera de alcance que no se tocan).
- Pendientes del usuario (no inventar):
  - Naturaleza exacta de su contribución a Softii (borrador dice solo que trabajó en Softii como administración ERP/POS, sin rol/fechas/alcance).
  - Naturaleza exacta de su contribución a Brilla (portal autogestión + crédito en factura del gas, sin rol/integraciones).
  - Redacción aceptable de "suites de servicios públicos que usan funcionarios" (sin entidad/fechas/métricas).

### Cambios

- `src/i18n/locales/es.ts` — reemplazar SOLO el valor de `profile.description` por el FINAL ES. No tocar `es.ts:58` ni `es.ts:82` ni bio/role/estilos.
- `src/i18n/locales/en.ts` — reemplazar SOLO el valor de `profile.description` por el FINAL EN (espejo fiel). No tocar `en.ts:57` ni `en.ts:80`.

FINAL ES v3 — ajustes finales del usuario 2026-09-10 (texto final):

```text
Llevo más de 4 años construyendo aplicaciones web full stack, desde suites de servicios públicos hasta aplicaciones empresariales para administrar negocios como ventas, inventario y facturación, también portales de financiamiento por facturas de servicios públicos. Trabajo las tres capas de una aplicación desde la idea hasta la puesta en marcha. Ver que el código que escribo ayuda a los demás en su día a día es lo que me mueve, me gusta escribir código que lleve al límite la optimización y el rendimiento que generan valor e impacto real. Actualmente estoy construyendo dos librerías propias, una de interfaz y otra de backend, orientadas a crear apps mucho más rápido.
```

FINAL EN v3 (faithful mirror):

```text
I've spent over 4 years building full stack web applications, from public-utility suites to business apps for running companies like sales, inventory and billing, plus financing portals billed through utility bills. I work across all three layers of an application from idea to launch. Seeing that the code I write helps others in their daily lives is what drives me, I enjoy writing code that pushes optimization and performance to the limit, creating real value and impact. I'm currently building two libraries of my own, one for UI and one for backend, aimed at shipping apps much faster.
```

FINAL ES v2 — correcciones del usuario 2026-09-10 (conversado, sin nombres de empresas, sin parentesis, sin dos puntos):

```text
Llevo más de 4 años construyendo aplicaciones web full stack, desde suites de servicios públicos hasta aplicaciones empresariales para administrar negocios como ventas, inventario y facturación, y portales de financiamiento. Trabajo las tres capas de una aplicación desde la idea hasta la puesta en marcha, y me mueve la optimización y el rendimiento para entregar productos que generan valor e impacto real. Actualmente estoy construyendo dos librerías propias, una de interfaz y otra de backend, orientadas a crear apps mucho más rápido.
```

FINAL EN v2 (faithful mirror):

```text
I've spent over 4 years building full stack web applications, from public-utility suites to business apps for running companies like sales, inventory and billing, and financing portals. I work across all three layers of an application from idea to launch, and I'm driven by optimization and performance to deliver products with real value and impact. I'm currently building two libraries of my own, one for UI and one for backend, aimed at shipping apps much faster.
```

FINAL ES v1 (descartado por el usuario — tenia nombres, parentesis y dos puntos, tono robot):

```text
Llevo más de 4 años construyendo software full stack desde Cali, Colombia: suites de servicios públicos que usan funcionarios, Softii para administrar negocios (ERP/POS: ventas, inventario y facturación) y el portal de autogestión Brilla, crédito que se paga en la factura del gas. Trabajo las tres capas desde la idea hasta la puesta en marcha, me mueve la optimización y el rendimiento, y hoy busco nuevos desafíos mientras construyo dos librerías propias, una de interfaz y otra de backend.
```

FINAL EN (verbatim, faithful mirror):

```text
I've spent over 4 years building full stack software from Cali, Colombia: public-sector suites used by government staff, Softii for running businesses (ERP/POS: sales, inventory and billing) and the Brilla self-service portal, credit paid through the gas bill. I work across all three layers from idea to launch, I'm driven by optimization and performance, and I'm currently looking for new challenges while building two libraries of my own, one for UI and one for backend.
```

### Restricciones

- Solo 2 strings (`es.ts` + `en.ts` `profile.description`). No bio, no role, no componentes, no estilos.
- No tocar líneas parecidas fuera de alcance: `es.ts:58`, `es.ts:82`, `en.ts:57`, `en.ts:80`.
- En el nuevo `description` prohibido: `producción` / `production`, `ecommerce`, `multiempresa` / `multi-tenant`, `Cencosud`, `Olímpica`, `Éxito`.
- ES en `es.ts`, EN en `en.ts` (RULES 0.3, 0.13). Solo strings, sin clases (§7). Sin scripts (RULES 0.4).
- No inventar empleos/fechas/empresas/métricas. EN espejo fiel del ES. Longitud hero compacta.

### Steps

1. `src/i18n/locales/es.ts` — `read` — confirmar texto actual ES 27-28 y que 58/82 quedan como contexto intacto. Solo lectura.
2. `src/i18n/locales/en.ts` — `read` — confirmar texto actual EN 27-28 y que 57/80 quedan intactas. Solo lectura.
3. `src/i18n/locales/es.ts` — `edit` — reemplazar únicamente el valor de `profile.description` por el FINAL ES, conservando formato del objeto. Prohibiciones de arriba aplican.
4. `src/i18n/locales/en.ts` — `edit` — reemplazar únicamente el valor por el FINAL EN como espejo fiel. Prohibiciones aplican.

### Verificacion

- Releer `es.ts:27-28` y `en.ts:27-28`: contienen exactamente los strings finales.
- `es.ts:58`, `es.ts:82`, `en.ts:57`, `en.ts:80` idénticos (sin diff).
- Ausencia en nuevos `description` (v3): `producción`, `production`, `ecommerce`, `multiempresa`, `multi-tenant`, `Cencosud`, `Olímpica`, `Éxito`, `Softii`, `Brilla`, `Cali`, `Colombia`, `funcionarios`, `government staff`, `:`, `(`, `que que` (doble que). Presencia ES: `aplicaciones web full stack`, `servicios públicos`, `empresariales`, `administrar negocios`, `ventas`, `inventario`, `facturación`, `portales de financiamiento por facturas de servicios públicos`, `tres capas`, `ayuda a los demás`, `optimización`, `rendimiento`, `valor`, `impacto real`, `dos librerías`, `interfaz`, `backend`, `rápido`. Presencia EN espejo: `full stack web applications`, `suites`, `business`, `sales`, `inventory`, `billing`, `financing portals billed through utility bills`, `three layers`, `helps others`, `optimization`, `performance`, `value`, `impact`, `two libraries`, `UI`, `backend`, `faster`.

## Compuerta

- Plan en estado **`ENRICHED`**. Borrador ES+EN verificado por el orquestador (sustituciones exactas, espejo fiel, sin hechos inventados, longitud hero).
- Siguiente: revision del usuario para marcar `READY` (incluye validar los pendientes: naturaleza de contribuciones Softii/Brilla), luego la frase **"ejecuta el plan"** autoriza `READY -> EXECUTED`. No avanzo por inferencia.

## Cierre (memoria persistente)

> Completar al cerrar el plan (DoD de `.agents/WORKFLOW.md`). Sin esto no pasa a CLOSED.

- Que cambio: `profile.description` en `src/i18n/locales/es.ts:27-28` y `src/i18n/locales/en.ts:27-28` reemplazados por el FINAL ES/EN v3 (texto final del usuario 2026-09-10). Sin tocar bio, role, componentes ni estilos.
- Verificacion: relectura de `es.ts:26-29` y `en.ts:26-29` (strings exactos v3); `git diff` confirma cambio de 1 sola linea por archivo en `description`; lineas fuera de alcance (`es.ts:58`, `es.ts:82`, `en.ts:57`, `en.ts:80`) intactas. Prohibiciones v3 verificadas: sin `produccion`, `ecommerce`, `multiempresa`, `Cencosud`, `Olimpica`, `Exito`, `Softii`, `Brilla`, `Cali`, `Colombia`, `funcionarios`, `:`, `(`. `bun run build` (typecheck) pendiente de ejecucion: requiere permiso explicito del usuario (RULES 0.4).
- Resultado: aprobado por el usuario ("ejecuta el plan", 2026-09-10).
- Pendientes: validacion visual opcional con `bun run dev`; typecheck/build no ejecutado por regla de scripts.
