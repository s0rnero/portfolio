---
name: coding-standards
description: Convenciones de escritura de codigo del proyecto.
project: [NOMBRE DEL PROYECTO] - harness generico
---

# Coding Standards

> Convenciones de escritura de codigo. Este archivo es la plantilla generica del harness: adaptar cada seccion al stack real del repo antes de usarlo. Lo que no se adapte aqui no debe inventarse por inferencia; preguntar o proponer escribirlo.

## 1. Estructura De Archivos

Orden de bloques dentro de un SFC (`.vue`):

1. `<script setup lang="ts">`: imports, tipos (`interface XProps`), `defineProps` + `withDefaults` y `defineEmits`, estado (`ref`), derivados (`computed`), efectos (`watch`, `onMounted`, `onBeforeUnmount`), handlers (`handle*`).
2. `<template>`: componentes siempre en kebab-case, importados incluidos.
3. `<style scoped>` solo cuando Tailwind no alcance, documentando la excepcion.

Layout de carpetas:

- `src/components/<dominio>/`: un archivo por componente; el dominio es la seccion o el tipo de pieza (`layout`, `common`, `background`).
- `src/composables/`: comportamiento reutilizable; un archivo por composable, prefijo `use`.
- `src/data/`: datos tipados del sitio.
- `src/views/`: lo que monta el router.

Reglas:

- Una responsabilidad por archivo.
- PascalCase para archivos de componente, `useCamelCase.ts` para composables.

## 2. Naming Conventions

| Contexto | Convencion | Ejemplo |
| --- | --- | --- |
| Archivos de componente | PascalCase | `ContactImages.vue`, `TrickOverlay.vue` |
| Composables | `use` + PascalCase en el archivo | `useViceCityCode.ts` |
| Vistas | PascalCase + `View` | `MainView.vue`, `ViceCityView.vue` |
| Variables y funciones | camelCase | `initialHash`, `handleCrtDone` |
| Tipos, interfaces, props | PascalCase con sufijo | `XProps`, `RouteName`, `AppLocale` |
| Booleanos | prefijo `is`, `has`, `can` | `isActive`, `isTrailerView`, `showCrt` |
| Handlers | `handle` + accion; `on` en los eventos | `handleKeydown`, `@click="handleToggleTheme"` |
| Constantes de modulo | UPPER_SNAKE_CASE | `CODE`, `TRICK_DURATION_MS`, `NAV_SECTIONS` |
| Claves i18n | camelCase jerarquico por dominio | `nav.openMenu`, `trick.unlocked` |
| Clases/ids del DOM | kebab-case | `navbar-language-select` |

### 2.1 Idioma Del Codigo — English-Only (Obligatorio)

- Idioma unicamente en ingles para TODO el codigo: identificadores, funciones, props, eventos, ids/anchors del DOM, claves de contratos y datos de codigo.
- Spanglish prohibido y sancionado: `goToPerfil` es invalido; lo correcto es `goToProfile` (o `handleGoToProfile` para handlers).
- Comentarios y docstrings en ingles: `// unique data source` valido, `// fuente unica de datos` invalido.
- Contenido visible de la UI (copy en espanol/ingles) NO es codigo: vive en la capa i18n (`vue-i18n`), no en identificadores ni nombres de variables.
- Excepcion: nombres propios y terminos sin traduccion razonable, documentados en su primer uso.
## 3. Contratos Y Datos

- Todo componente declara `interface XProps` y `withDefaults(defineProps<XProps>(), {...})`; los eventos, `defineEmits<{ done: [] }>()`.
- Los datos del sitio viven en `src/data/` tipados; las listas de navegacion (`NAV_SECTIONS`) son `as const` y exportan sus tipos (`RouteName`).
- Los textos visibles no son datos: viven en `src/i18n/locales/`. El español es la fuente y el ingles traduce lo que ya existe.
- No duplicar contratos ni listas: si una pieza se comparte, se extrae a `src/composables/` o a `src/components/common/`.

## 4. Errores Y Fallos

- No hay API propia ni backend: no aplican codigos de error de servicio ni correlation IDs.
- Prohibido dejar `console.log` de debug en el codigo entregado.
- Los fallos de APIs del navegador o de librerias externas se manejan de forma explicita: `try/catch` con degradacion silenciosa cuando el efecto es decorativo (ver el `catch` de WebGL en `TvStaticBackground.vue`), y reporte al usuario cuando afecta funcionalidad.

## 5. Testing Y Verificacion

- El repo **no tiene** script `test` ni suite de tests: no inventar frameworks de test ni archivos de prueba.
- La verificacion real es `bun run lint:check`, `bun run format:check` y `bun run build` (`vue-tsc -b` + `vite build`), mas revision visual en el navegador.
- Ninguno se ejecuta sin autorizacion explicita del usuario (regla 0.4 de `.agents/RULES.md`).
- Los cambios visuales se validan en pantalla: el DoD no se cumple con "deberia funcionar".

## 6. Verificacion Y Scripts

- Los scripts reales del repo estan en `.agents/AGENTS.md`; no ejecutar ninguno sin autorizacion.
- Antes de cerrar una tarea, revisar que el codigo nuevo cumple estas convenciones y no introduce anti-patrones del stack declarados en `.agents/DESIGN.md`.

## 7. Reglas De Estilos (Tailwind) - Obligatorias

Reglas de este repo para layout y estilos. Ninguna skill ni IA puede saltarselas; aplican a todo componente y vista.

1. **Cero margenes**: no se usan margenes (`m-*`, `mx-*`, `my-*`, `mt/mb/ml/mr-*`, `ms/me-*`) salvo solicitud explicita del usuario. La separacion y acomodacion se hace con **flex + gap** y **padding**.
2. **Respetar el sistema de tamanos**: si un elemento usa medidas flexibles (`grow`, `shrink`, `flex-*`), NO definir `width`/`height` fijos: entran en conflicto con el sistema de tamanos.
3. **`min-w-0` solo con causa justa**: no anadirlo por defecto; unicamente cuando exista una razon tecnica real (p. ej. truncado dentro de un contenedor flex) y explicada.
4. **No alterar tipografia heredada**: no cambiar `leading-*`, `tracking-*` ni tamanos de fuente (`text-*` como tamano) salvo solicitud explicita del usuario.
5. **Sin valores arbitrarios**: prohibido usar la sintaxis `[...]` para medidas custom de Tailwind salvo que el usuario lo pida explicitamente; usar la escala/tokens estandar.
6. **Tailwind-first obligatorio con `@apply`**: todo estilo visual se resuelve con Tailwind CSS. En archivos `.css` y `<style>` se usan utilidades via `@apply` (ej. `body { @apply text-black dark:text-white; }`) en lugar de CSS nativo directo (`color: #000`). Solo se permite CSS nativo cuando (a) el usuario lo solicite explícitamente o (b) el requerimiento sea imposible con Tailwind (ej.: `scrollbar-color`, `scrollbar-width`, `background-image` con SVG data-uri para flechas, `@keyframes`/`clip`/`mix-blend-mode`, `backdrop-filter` con máscaras dinámicas, `radial-gradient` complejos, variables de librería como `--kt-*`). Cada excepción debe quedar documentada en el plan.

## 8. Visibilidad De Componentes (v-if / v-show / active)

Tres formas de que algo no se pinte, y cada una sirve para una cosa distinta. Elegir mal se paga en frames.

1. **`v-if` — montar y desmontar.** Cuando estar vivo cuesta de verdad y al volver no hace falta su estado: contextos WebGL (`TvStaticBackground`, `FaultyTerminalBackground`), el hilo wasm del juego, un `<audio>` que suena (`TrickOverlay`), o un timeline que corre una sola vez (el intro del CRT, que ademas **debe** desmontarse al terminar). Un `v-if` libera el contexto y para los bucles; un `v-show` deja los dos gastando memoria.
2. **`v-show` — ocultar con CSS.** Cuando desmontar es caro (se perderia el programa de shader ya compilado) y solo hay que dejar de pintarlo. Ejemplo: el ruido de TV, que solo se ve durante el flash de hover/navegacion.
3. **Prop `active` — parar el bucle sin desmontar.** La aceptan los fondos que dibujan con `requestAnimationFrame`: con `false` dejan de pedir frames y conservan el ultimo fotograma pintado, asi que reactivarlos no cuesta compilar ni provoca un salto a negro.

Reglas:

- **Ocultar no es parar.** Un canvas en `display: none` sigue gastando frame si su bucle corre: `v-show` (o dejar la capa detras de otra opaca) **exige** `active: false` para ahorrar algo.
- Se pueden combinar `v-if` y `v-show` en el mismo elemento: `v-if` decide si existe, `v-show` si se ve.
- Todo componente que dibuja **tiene** que ser inerte cuando nada lo ve. Si su capa queda detras de otra opaca (el ruido de TV tras el terminal) o bajo un intro a pantalla completa, no debe pedir frames.
- La red de seguridad de un montaje condicional (un intro que puede no avisar, un estado que puede quedar colgado) se anota en el codigo con su temporizador de respaldo, como el del intro del CRT en `App.vue`.
- Antes de decidir, medir: un `v-if` de mas paga compilar en el peor momento (justo cuando el usuario mira) y un `v-show` de mas paga frames para nadie.

## 9. Quick Reference

| Regla       | Hacer                                | Evitar                              |
| ----------- | ------------------------------------ | ----------------------------------- |
| Contratos   | Props/slots/emits tipados; datos en `src/data`; textos en i18n | Duplicar listas o textos en el codigo |
| Errores     | Manejo explicito con degradacion documentada | `console.log` de debug o fallos silenciosos no documentados |
| Duplicacion | Extraer helper/patron compartido     | Copiar bloques                      |
| Scripts     | Pedir permiso para verificacion      | Ejecutar scripts bloqueados         |
| Verificacion | `lint:check` + `format:check` + `build` + revision en pantalla | Inventar tests o dar por bueno sin mirar |
| Stack       | Seguir las secciones adaptadas arriba| Inventar convenciones por inferencia|
| Margenes    | flex + gap + padding                 | Usar margenes sin solicitud explicita |
| Medidas     | grow/shrink sin width/height fijos; `min-w-0` solo justificado; sin valores `[ ]` | Mezclar medidas flex con width/height o inventar valores arbitrarios |
| Tailwind | `@apply` + utilidades; CSS nativo solo si es imposible o usuario lo pide | Escribir `color:`, `background:`, `font-size:` nativos pudiendo usar `@apply` |
| Visibilidad | `v-if` si estar vivo cuesta; `v-show` para ocultar; `active` para parar el bucle | Dejar un shader pidiendo frames tapado o en `display: none` |

**Ultima actualizacion:** Septiembre 2026
**Version:** 1.3 (perfil real del stack Vue/TS/Tailwind + verificacion sin suite de tests)
