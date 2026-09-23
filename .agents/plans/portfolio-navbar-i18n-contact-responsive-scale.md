---
name: portfolio-navbar-i18n-contact-responsive-scale
status: CLOSED
type: feature
domain: portfolio
owner_rules: .agents
created: 2026-09-13 12:00
---

# Plan Técnico: Navbar i18n + Contact responsive + Escala FaultyTerminal + Limpieza de locales

> Estados: PENDING -> ENRICHED -> READY -> EXECUTED -> CLOSED (ver `.agents/WORKFLOW.md`).
> Enriquecido: 2026-09-13. Revisado y aprobado por el orquestador: 2026-09-13 (verificación de alcance, `SocialLinks.vue:7,13` confirma 2.º consumidor del href, API k-select verificada en fuente, sin cambios inventados). Estado actual: **READY** (espera frase explícita "ejecuta el plan").

### Análisis

- Objetivo:
  1. Corregir SOLO ortografía de `src/i18n/locales/es.ts` (tildes, puntuación mínima, mayúsculas; sin reescritura, sin cambiar tono/significado).
  2. Selector de idioma es/en en el navbar con `k-select` de khatarsis, endónimos fijos (`Español`/`English`), junto al toggle de tema, persistido en localStorage, locale por defecto `es`.
  3. Contact responsive: 4 cols en `lg`, 2 en `md`, 1 en `sm`.
  4. Escala responsive SOLO de `FaultyTerminalBackground`: `lg = 2.5` (actual), `md = 1`, `sm = 0.5`. `TvStaticBackground.vue` NO se toca.
  5. Inglés pendiente + eliminar claves huérfanas (incluidos bloques `experience` e `interests` de `en.ts`).
- Scope: 7 archivos con edit, 1 archivo creado, 3 archivos solo read (ver tabla de Cambios). Sin rutas nuevas, sin dependencias nuevas, sin cambios de paleta/tipografía.
- Archivos (detalle en Cambios): `src/i18n/locales/es.ts`, `src/i18n/locales/en.ts`, `src/i18n/index.ts`, `src/components/layout/Navbar.vue`, `src/components/contact/ContactImages.vue`, `src/data/portfolio.ts`, `src/composables/useSocialLinks.ts` (create), `src/components/common/SocialLinks.vue`, `src/components/about/MapCard.vue`, `src/components/background/FaultyTerminalBackground.vue`. Solo-read (verificado, sin cambios): `ContactSection.vue`, `App.vue`, `TvStaticBackground.vue`.
- Decisiones del usuario (fijadas, NO reabrir): lg conserva `2.5`; md=`1`, sm=`0.5`; TV noise fuera de alcance; selector=`k-select` con endónimos fijos junto al toggle + localStorage; eliminar todos los huérfanos incl. `experience`/`interests`; solo ortografía en es.ts; locale por defecto `es`.
- Riesgos: ver sección Riesgos (R1–R9). Bloqueador: ninguno para redactar el plan; la verificación con comandos queda pendiente de autorización (regla 0.4).

#### Auditoría ortográfica de `es.ts` (solo ortografía, sin reescritura)

| # | Línea | Antes | Después | Tipo |
|---|-------|-------|---------|------|
| O1 | 28 `about.subtitle` | `Quien soy, en que he trabajado y de donde vengo` | `Quién soy, en qué he trabajado y de dónde vengo` | tildes interrogativas indirectas |
| O2 | 31 `about.body[0]` | `...César Andrés Ríos tengo 23 años...` | `...César Andrés Ríos, tengo 23 años...` | coma entre oraciones yuxtapuestas |
| O3 | 31 `about.body[0]` final | `...puesta en producción` (sin punto) | `...puesta en producción.` | punto final de párrafo |
| O4 | 32 `about.body[1]` | `uno de los mas conocidos` | `uno de los más conocidos` | tilde diacrítica |
| O5 | 32 | `servicios publicos necesita` | `servicios públicos necesita` | tilde |
| O6 | 32 | `servicios publicos mas grandes del pais, También` | `servicios públicos más grandes del país, también` | tildes + minúscula tras coma |
| O7 | 32 | `via el recibo` | `vía el recibo` | tilde |
| O8 | 32 | `tambien funcionando` | `también funcionando` | tilde |
| O9 | 32 | `las gaseras mas grandes del pais. Ademas` | `las gaseras más grandes del país. Además` | tildes |
| O10 | 32 | `comercios electronicos en Mexico` | `comercios electrónicos en México` | tildes |
| O11 | 32 | `como Softii un sistema POS` | `como Softii, un sistema POS` | coma de aposición explicativa |
| O12 | 33 `about.body[2]` | `la creacion, desarrollo` | `la creación, desarrollo` | tilde |
| O13 | 33 | `khatarsis y alytos ambas librerias` | `Khatarsis y Alytos ambas librerías` | mayúscula nombre propio + tilde |
| O14 | 33 | `encapsulan  gran parte` (doble espacio) | `encapsulan gran parte` | errata espaciado |
| O15 | 33 final | `en tiempo record` (sin punto) | `en tiempo récord.` | tilde + punto final |
| O16 | 34 `about.body[3]` | `Fuera del ambito` | `Fuera del ámbito` | tilde |
| O17 | 34 | `nuevos lugares, tambien me gusta` | `nuevos lugares, también me gusta` | tilde |
| O18 | 34 | `la naturaleza y la tecnologia` | `la naturaleza y la tecnología` | tilde |
| O19 | 34 | `de mi te puedo contar poco mas el resto lo puedes descubrir tu...  ¡asi que` | `de mí te puedo contar poco más el resto lo puedes descubrir tú... ¡así que` | tildes pronombres (`mí`, `tú`), `más`, `así` + espacio simple |
| O20 | 44 `skills.areas.databases` | `Bases de Datos` | `Bases de datos` | minúscula ortotipográfica (sustantivo común) |
- Verificado SIN errores: `nav.*`, `hero.*` (incl. `e impacto` correcto), `social.*`, `projects.*`, `contact.*`. Coma ante `o` en `contact.subtitle` (`..., o simplemente...`) es opcional RAE: NO se toca (estilo).
- Frases largas yuxtapuestas con coma (body[1]–[3]) NO se reestructuran: sería reescritura, fuera de alcance.

#### Auditoría de huérfanos (grep en `src/`, incl. usos dinámicos)

Usos dinámicos verificados como VIVOS (no huérfanos): `t(section.labelKey)` → `nav.about/projects/contact` (router + Navbar + Footer); `t(link.ariaKey)` → `social.*` (ContactImages + SocialLinks); `tm('about.body')` (AboutSection, ambos locales); `` t(`projects.items.${descriptionKey}.description`) `` → los 5 `descriptionKey` existen en ambos locales (ProjectCard); `` t(`skills.areas.${group.area}`) `` → las 5 áreas existen en ambos (AboutSection); `t('projects.openProject'|'projects.techTooltip')`, `projects.title/subtitle`, `contact.title/subtitle/footer.rights`, `about.kicker/subtitle/stackTitle/photoAlt/mapTitle/mapRecenter/timeAria`, `hero.*`, `nav.*` → todos vivos en ambos locales.

| Clave | es | en | Uso en `src/` | Veredicto |
|-------|----|----|---------------|-----------|
| `about.title` | sí | sí | ninguno (AboutSection usa `about.kicker`) | ELIMINAR en ambos |
| `projects.kicker` | sí | sí | ninguno (ProjectsSection usa `title`+`subtitle`) | ELIMINAR en ambos |
| `contact.kicker` | sí | sí | ninguno (ContactSection usa `title`+`subtitle`) | ELIMINAR en ambos |
| `projects.status` (bloque, `.inDevelopment`) | sí | sí | ninguno (`statusKey` declarado en interfaz `Project` pero ningún proyecto lo define ni `ProjectCard` lo renderiza) | ELIMINAR bloque en ambos + campo muerto `statusKey?` de la interfaz |
| `experience` (bloque completo) | no | sí | ninguno (no existe componente Experience) | ELIMINAR bloque de `en.ts` |
| `interests` (bloque completo) | no | sí | ninguno (no existe componente Interests) | ELIMINAR bloque de `en.ts` |

#### Auditoría de español pendiente de traducir (qué se traduce y dónde vive)

| Copy | Dónde vive hoy | Visible/render | Veredicto |
|------|----------------|----------------|-----------|
| Prefill WhatsApp en español (`Hola César, vi tu portafolio...`) | `portfolio.ts` → `contact.whatsappUrl` → `socialLinks[].href` | SÍ (ContactImages + SocialLinks) | LOCALIZAR: nueva clave `social.whatsappMessage` (es/en) + helper puro `buildWhatsappUrl(message)` en `portfolio.ts` + composable `useSocialLinks()` que devuelve links con href localizado |
| Formato de hora `Intl 'es-CO'` | `MapCard.vue` `timeFormatter` | SÍ | LOCALIZAR: `computed` que elige `es-CO`/`en-US` según `locale` de `useI18n` (`hourFormatter 'en-GB'` es numérico neutro: se queda) |
| `title: 'Cali'`, `contact.location 'Cali, Colombia'` | `MapCard.vue`, `portfolio.ts` | SÍ | NO traducir: nombres propios (excepción RULES 0.13, documentada en código) |
| `education`, `languages`, `periods` de `experiences`, `profile.age` | `portfolio.ts` (exports) | NO (cero imports fuera de `portfolio.ts`; grep verificado) | NO traducir: crear claves i18n para copy sin render generaría huérfanos nuevos (contradice este plan). Deuda documentada para plan futuro |
| `en about.body` (3 párr.) vs `es about.body` (4 párr.) | ambos locales, ambos render vía `tm` | SÍ | NO reescribir (decisión: sin reescritura). Asimetría de contenido documentada como seguimiento, no se toca |
| Nuevas claves necesarias | — | — | `nav.selectLanguage` (es `Seleccionar idioma` / en `Select language`, para el label a11y del selector); `social.whatsappMessage` (traducción fiel del prefill actual) |

#### API real de `k-select` (verificada en fuente, NO inferida)

- Existe y está registrado globalmente como `k-select` → `Select.vue` (`khatarsis/src/components/index.ts`), disponible vía el plugin ya instalado en `main.ts`. Sin imports locales. **Riesgo de inexistencia: DESCARTADO.**
- Props a usar: `options: object[]`, `option-label="label"`, `option-value="value"`, `value-only` (el `v-model` es el valor plano `'es'|'en'`, no el objeto), `modelValue` + emits `update:modelValue`/`change` (compatible con `v-model`), `:clearable="false"` (evita `null` que rompería el locale), `:filterable="false"`, `displayMode` por defecto `'text'` (muestra el endónimo), `size="sm"`, `dropdown` con chevron por defecto, `id` → llega al `<input role="combobox">`.
- Teclado interno: ArrowUp/Down + Enter + Escape (verificado líneas 777–803 de `Select.vue`). Operable por teclado sin trabajo extra.
- A11y: el componente NO tiene passthrough de `aria-label` al input → se mitiga con `id="navbar-language-select"` + `<label class="sr-only" for="...">` con `t('nav.selectLanguage')` (`sr-only` es utilidad Tailwind estándar, no valor arbitrario).
- Endónimos fijos `[{ label: 'Español', value: 'es' }, { label: 'English', value: 'en' }]` definidos en el script del Navbar: excepción documentada a RULES 0.13 (son idénticos en ambos locales por definición; traducirlos los haría derivar).

#### Escala FaultyTerminal (análisis previo)

- No existe composable de breakpoints ni helper compartido en `src/composables/` (grep: solo `matchMedia` para `prefers-color-scheme` en `useTheme` y `prefers-reduced-motion` en `useReveal`/local del componente). Un único consumidor → implementación local en el componente (crear un composable/archivo nuevo violaría RULES 0.3 sin necesidad técnica; regla 0.6 solo justifica extraer si hay ≥2 consumidores).
- Punto de inyección: uniforme `uScale` (inicializado con `props.scale`, línea 426; shader lo usa en `p = uv * uScale` y `mouseWorld`, auto-consistente). Patrón a reutilizar: `applyThemeUniforms()` + `program.setUniform` + re-render estático si `!running` (líneas 328–334).
- Breakpoints = Tailwind por defecto (coherentes con el grid de contact): `sm <768px → 0.5`, `md 768–1023px → 1`, `lg ≥1024px → 2.5` (= prop `scale`, que se conserva como default y valor lg → `App.vue` NO se toca).
- `prefersReducedMotion()` local y `pause` se respetan: el cambio de escala re-renderiza un frame estático si el loop no corre (mismo patrón que `applyThemeUniforms`).
- Nota sin acción: el componente define su propio `prefersReducedMotion()` (líneas 268–272) duplicando el de `useReveal` (importado en `App.vue`/`HeroSection`). Preexistente, fuera de alcance: NO refactorizar en este plan (seguimiento).

### Cambios

- `src/i18n/locales/es.ts` — **edit**: aplicar O1–O20; eliminar `about.title`, `projects.kicker`, `contact.kicker`, bloque `projects.status`; añadir `nav.selectLanguage: 'Seleccionar idioma'`, `social.whatsappMessage: 'Hola César, vi tu portafolio y me gustaría hablar contigo.'`.
- `src/i18n/locales/en.ts` — **edit**: eliminar `about.title`, `projects.kicker`, `contact.kicker`, bloque `projects.status`, bloque `experience` completo (líneas 49–94), bloque `interests` completo (líneas 127–146); añadir `nav.selectLanguage: 'Select language'`, `social.whatsappMessage: 'Hi César, I saw your portfolio and I would like to talk to you.'`. NO tocar `about.body` (asimetría documentada, sin reescritura).
- `src/i18n/index.ts` — **edit**: exportar `LOCALE_STORAGE_KEY = 'portfolio-locale'` + tipo `AppLocale = 'es' | 'en'`; `locale` inicial = stored validado (`'es'|'en'`, fallback `'es'`); `fallbackLocale: 'es'` se mantiene. Acceso a `localStorage` en este módulo es seguro (solo se importa desde el entry de cliente `main.ts`; precedente: `initTheme()`).
- `src/components/layout/Navbar.vue` — **edit**: `const { t, locale } = useI18n()` (`locale` es `WritableComputedRef` con `legacy: false`); `interface LocaleOption { label: string; value: AppLocale }`; `localeOptions` fijo con endónimos; `selectedLocale = ref<AppLocale>(locale.value as AppLocale)`; `watch(selectedLocale, ...)` → `locale.value = v` + `localStorage.setItem(LOCALE_STORAGE_KEY, v)`; `<k-select v-model="selectedLocale" :options="localeOptions" option-label="label" option-value="value" value-only :clearable="false" :filterable="false" size="sm" id="navbar-language-select" />` + `<label class="sr-only" for="navbar-language-select">{{ t('nav.selectLanguage') }}</label>`, ubicados en el `div.flex.items-center.gap-4` junto al toggle de tema. Identificadores en inglés (`selectedLocale`, `localeOptions`, `handleLocaleChange` si se usa `@change` en vez de `watch`; elegir UNA vía, no ambas).
- `src/components/contact/ContactImages.vue` — **edit**: raíz `flex flex-1 gap-4` → `grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4` (tokens estándar, sin `[...]`); quitar `flex-1` de los 4 wrappers con `v-effect` (sin efecto en grid; evita mezcla flex/grid §7.2); `k-card` conserva `flex size-full` (stretch iguala alturas por fila; en 1 col altura por contenido). Consumir `socialExternalLinks` del nuevo composable en vez del `filter` local.
- `src/components/contact/ContactSection.vue` — **read** (sin cambios: su wrapper `flex flex-1 gap-4` de un solo hijo sigue válido).
- `src/components/background/FaultyTerminalBackground.vue` — **edit**: añadir `resolveScale(): number` (`lg→props.scale`, `md→1`, `sm→0.5` con `window.matchMedia('(min-width: 1024px)'|'(min-width: 768px)')`, guardia `typeof window === 'undefined' → props.scale`); `responsiveScale = ref(resolveScale())`; uniformes iniciales `uScale: responsiveScale.value`; en `onMounted`, listeners `change` (NO `addListener` deprecated) en ambos `MediaQueryList` → `handleScaleChange` = `responsiveScale.value = resolveScale()` + `program.setUniform('uScale', ...)` + re-render estático si `!running` (patrón `applyThemeUniforms`); remover listeners en `onBeforeUnmount`. Prop `scale` (default `2.5`) se conserva como contrato público y valor lg.
- `src/App.vue` — **read** (sin cambios: `<faulty-terminal-background />` sin props sigue válido; TV noise intacto).
- `src/components/background/TvStaticBackground.vue` — **no tocar** (fuera de alcance).
- `src/data/portfolio.ts` — **edit**: interfaz `Contact`: sustituir `whatsappUrl: string` por `whatsappNumber: string` (`'573054501829'`); href de WhatsApp en `socialLinks` → `` `https://wa.me/${contact.whatsappNumber}` `` (base sin texto; el texto lo compone el composable); añadir helper puro `buildWhatsappUrl(message: string): string` (concatena base + `?text=${encodeURIComponent(message)}`; capa data sin dependencia de i18n); eliminar campo muerto `statusKey?` de la interfaz `Project` (ligado al bloque `projects.status` eliminado; ningún proyecto lo define — grep verificado). Resto de exports muertos (`experiences`, `interests`, `education`, `languages`) NO se tocan (deuda follow-up).
- `src/composables/useSocialLinks.ts` — **create** (justificación RULES 0.3+0.6: 2 consumidores necesitan el mismo href localizado; evita duplicar el `map` en `ContactImages` y `SocialLinks`): `useSocialLinks()` devuelve `socialExternalLinks = computed(...)` = `socialLinks` sin `email`, con entrada `whatsapp` reescrita a `{ ...link, href: buildWhatsappUrl(t('social.whatsappMessage')) }` (reactivo al cambio de `locale`). Todo en inglés, sin estilos.
- `src/components/common/SocialLinks.vue` — **edit**: sustituir `socialLinks.filter(...)` por `socialExternalLinks` del composable (template intacto).
- `src/components/about/MapCard.vue` — **edit**: `const { t, locale } = useI18n()`; `timeFormatter = computed(() => new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'es-CO', { timeZone: 'America/Bogota', hour/minute/second 2-digit, hour12: false }))`; `localTime` usa `timeFormatter.value`. `hourFormatter`, `title: 'Cali'`, `contact.location` intactos (excepción nombre propio, documentar con comentario en inglés en su primer uso).

### Restricciones

- RULES: sin Git; sin borrar archivos; sin ejecutar `bun run dev/build/preview` sin autorización explícita (verificación manual + comandos pendientes); un componente principal por requerimiento (el composable nuevo se justifica por cero-duplicación entre 2 consumidores); sin secretos (no aplica); skills subordinadas (ninguna skill aporta más allá del estándar local + fuente real de khatarsis verificada; CODING_STANDARDS prevalece).
- CODING_STANDARDS §7 Tailwind: cero `m-*` (flex+gap+padding); no `grow/shrink` con `width/height` fijos (se elimina `flex-1` de items del grid); sin `[...]` (tokens `grid-cols-1/md:grid-cols-2/lg:grid-cols-4`, `gap-4`, `sr-only`, `size="sm"` del k-select); sin cambios de `leading/tracking/text-*`; CSS nativo solo el existente del shader WebGL (imposible con Tailwind, excepción §7.6 ya vigente, no requiere justificación nueva).
- CODING_STANDARDS §2.1 + RULES 0.13 English-Only: identificadores/handlers/comentarios en inglés (`handleLocaleChange`, `resolveScale`, `responsiveScale`, `buildWhatsappUrl`, `socialExternalLinks`, `LOCALE_STORAGE_KEY`); endónimos fijos y `Cali` como excepciones documentadas (términos sin variación entre locales / nombre propio).
- DESIGN: sin capas nuevas relevantes (data no importa i18n; el composable compone); sin cambios de API pública salvo campo muerto `statusKey?` (sin productores ni consumidores) y `Contact.whatsappUrl→whatsappNumber` (uso interno al repo, un solo consumidor `socialLinks`); orden de imports CSS intacto; GSAP/Lenis no afectados.
- i18n: todo copy visible vía `vue-i18n`; claves simétricas es/en tras el cambio (verificación por diff); locale default `es`; a11y del selector (label + teclado nativo del k-select).
- Alcance congelado: no Experience/Interests como secciones, no paletas/tipografías, no rutas/dependencias, no refactor del `prefersReducedMotion` duplicado, no traducción de exports muertos, no reescritura de `about.body`.

### Riesgos

- R1 (CERRADO): `k-select` existe y está global (`khatarsis/src/components/index.ts` → `Select.vue`; plugin en `main.ts`). Riesgo residual bajo: primer uso en el portfolio → verificar visualmente ancho en navbar y dark mode (revisión manual).
- R2: `Select.vue` no acepta `aria-label` → mitigado con `id` + `<label class="sr-only">` (paso 4).
- R3: `v-model` sin `value-only` entregaría el objeto opción y rompería `locale` → mitigado con `value-only` + `:clearable="false"` (paso 4).
- R4: asimetría `about.body` (es 4 párr. / en 3 párr., la EN es resumen, no traducción) → NO se toca por decisión de no-reescritura; seguimiento futuro.
- R5: exports muertos con español (`experiences`, `education`, `languages`, `interests`, `phone`) → NO se traducen (evita crear huérfanos); seguimiento futuro (eliminar o cablear con i18n).
- R6: `Bases de Datos → Bases de datos` (O20) es el único cambio con leve criterio editorial (ortotipografía RAE); si el orquestador lo rechaza, se revierte solo O20 sin afectar el resto.
- R7: listeners `matchMedia` — usar `addEventListener('change')` + cleanup (evita API deprecated y fugas); guardia SSR coherente con el archivo.
- R8: verificación de build/tipos (`bun run build` = `vue-tsc -b && vite build`) pendiente de autorización regla 0.4 → el plan NO se puede dar por verificado automáticamente; queda manual + pendiente explícito.

### Steps

1. `src/i18n/locales/es.ts` (**edit**): aplicar O1–O20 exactas de la tabla; eliminar `title` de `about`, `kicker` de `projects` y `contact`, bloque `status` de `projects`; añadir `nav.selectLanguage` y `social.whatsappMessage` (textos de la tabla de Cambios). No tocar ninguna otra línea.
2. `src/i18n/locales/en.ts` (**edit**): eliminar `about.title`, `projects.kicker`, `contact.kicker`, bloque `projects.status`, bloque `experience` (líneas 49–94), bloque `interests` (líneas 127–146); añadir `nav.selectLanguage` y `social.whatsappMessage` en inglés. No tocar `about.body`.
3. `src/i18n/index.ts` (**edit**): añadir `LOCALE_STORAGE_KEY`/`AppLocale`/`resolveInitialLocale` y usarlo como `locale` inicial; mantener `legacy: false`, `fallbackLocale: 'es'`, `messages { en, es }`.
4. `src/components/layout/Navbar.vue` (**edit**): cablear `locale` de `useI18n` + `selectedLocale`/`localeOptions` (endónimos fijos) + persistencia (una sola vía: `watch` o `handleLocaleChange` en `@change`); insertar `<label sr-only>` + `<k-select ... id="navbar-language-select">` en el contenedor junto al toggle de tema. Sin `m-*`, sin anchos arbitrarios.
5. `src/data/portfolio.ts` (**edit**): `Contact.whatsappUrl→whatsappNumber`, href base en `socialLinks`, helper `buildWhatsappUrl`, eliminar `statusKey?` de `Project`. Resto intacto.
6. `src/composables/useSocialLinks.ts` (**create**): `useSocialLinks()` → `socialExternalLinks` computado con href de WhatsApp localizado (única fuente para los 2 consumidores).
7. `src/components/contact/ContactImages.vue` (**edit**): raíz a `grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4`; quitar `flex-1` de los 4 wrappers; consumir `socialExternalLinks` (resto del template intacto).
8. `src/components/common/SocialLinks.vue` (**edit**): consumir `socialExternalLinks` del composable (template intacto).
9. `src/components/about/MapCard.vue` (**edit**): `timeFormatter` computado por `locale` (`es-CO`/`en-US`); resto intacto + comentario en inglés para la excepción `Cali`.
10. `src/components/background/FaultyTerminalBackground.vue` (**edit**): `resolveScale` + `responsiveScale` + `uScale` inicial + listeners `change` con cleanup + `handleScaleChange` con re-render estático si `!running`. Prop `scale` intacta (valor lg). `pause`/`prefers-reduced-motion`/resto intactos.
11. Verificación manual (**read** + inspección): `ContactSection.vue` y `App.vue` sin cambios; `TvStaticBackground.vue` intacto; diff final de claves es/en simétricas (salvo bloques eliminados a propósito); `grep` de huérfanos en `src/` a cero; revisión visual pendiente (selector es/en en navbar/hero/about/projects/contact con opciones siempre `Español`/`English`; contact 4/2/1; escala lg 2.5/md 1/sm 0.5; TV noise intacto).
12. Reportar `bun run dev` / `bun run build` como PENDIENTES de autorización (regla 0.4); no ejecutarlos en Executor sin permiso explícito.

### Verificacion

- Manual: selector cambia es/en en navbar + hero + about + projects + contact (opciones siempre `Español`/`English`); persistencia tras recarga (localStorage `portfolio-locale`); contact 4/2/1 columnas (redimensionar: ≥1024 / 768–1023 / <768); FaultyTerminal escala por viewport (lg 2.5 / md 1 / sm 0.5) y TV noise intacto; enlace WhatsApp abre con texto en el idioma activo; hora de MapCard con formato según idioma.
- Estática sin ejecución: `grep` en `src/` sin referencias a `about.title`, `projects.kicker`, `contact.kicker`, `projects.status`, `experience.`, `interests.`, `statusKey`, `whatsappUrl`; diff de claves es/en simétricas (+ solo `nav.selectLanguage`, `social.whatsappMessage` en ambos); sin `m-*` ni `[...]` nuevos; identificadores/handlers en inglés.
- Comandos reales (`bun run dev`, `bun run build` con `vue-tsc -b`) SOLO con autorización explícita del usuario (regla 0.4); si no se autorizan, quedan reportados como pendientes en el cierre.

## Cierre (memoria persistente)

> Completar al cerrar el plan. Sin esto, el plan no pasa a CLOSED (DoD).

- Que cambio (ejecutado 2026-09-13, Steps 1–10 al pie de la letra):
  - `src/i18n/locales/es.ts`: O1–O20 aplicadas; eliminados `about.title`, `projects.kicker`, `contact.kicker`, bloque `projects.status`; añadidos `nav.selectLanguage` (`Seleccionar idioma`) y `social.whatsappMessage` (prefill ES original). Corrección adicional del orquestador en revisión de cierre (O21): `mi pais → mi país` (`about.body[1]`, instancia omitida en la tabla de auditoría; mismo requisito de cero faltas, sin reescritura).
  - `src/i18n/locales/en.ts`: eliminados `about.title`, `projects.kicker`, `contact.kicker`, bloque `projects.status`, bloque `experience` completo, bloque `interests` completo; añadidos `nav.selectLanguage` (`Select language`) y `social.whatsappMessage` (traducción fiel). `about.body` intacto.
  - `src/i18n/index.ts`: añadidos `LOCALE_STORAGE_KEY = 'portfolio-locale'`, `AppLocale`, `resolveInitialLocale()` (stored validado, fallback `es`); `legacy: false` y `fallbackLocale: 'es'` intactos.
  - `src/components/layout/Navbar.vue`: `locale` de `useI18n` + `LocaleOption`/`localeOptions` (endónimos fijos, excepción documentada) + `selectedLocale` + UNA vía de sincronización (`watch` → `locale.value` + `localStorage`); `<label class="sr-only" for="navbar-language-select">` + `<k-select value-only :clearable="false" :filterable="false" size="sm" id="navbar-language-select">` junto al toggle de tema.
  - `src/data/portfolio.ts`: `Contact.whatsappUrl → whatsappNumber` (`573054501829`), href base sin texto en `socialLinks`, helper puro `buildWhatsappUrl(message)`, eliminado `statusKey?` de `Project`. Resto (incl. `experiences`, `education`, `languages`, `interests`) intacto.
  - `src/composables/useSocialLinks.ts` (creado): `useSocialLinks()` → `socialExternalLinks` computado con href de WhatsApp localizado vía `t('social.whatsappMessage')`.
  - `src/components/contact/ContactImages.vue`: raíz a `grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4`; `flex-1` eliminado de los 4 wrappers; consume `socialExternalLinks`.
  - `src/components/common/SocialLinks.vue`: consume `socialExternalLinks` del composable; template intacto.
  - `src/components/about/MapCard.vue`: `timeFormatter` computado por `locale` (`es-CO`/`en-US`); `hourFormatter`, `title: 'Cali'` y `contact.location` intactos + comentario en inglés de la excepción nombre propio.
  - `src/components/background/FaultyTerminalBackground.vue`: `resolveScale()` (guardia SSR, lg→`props.scale`, md→`1`, sm→`0.5`), `responsiveScale`, `uScale` inicial desde `responsiveScale`, listeners `change` con `addEventListener` + cleanup en `onBeforeUnmount`, `handleScaleChange` con re-render estático si `!running`. Prop `scale` (default `2.5`) intacta. `prefersReducedMotion` duplicado NO tocado.
  - NO tocados: `ContactSection.vue`, `App.vue`, `TvStaticBackground.vue` (solo-read), `about.body` en en.ts, exports muertos, duplicado `prefersReducedMotion`. Ningún otro archivo creado/modificado.
- Verificacion (solo inspección, sin ejecutar nada — regla 0.4):
  - `grep` en `src/` para `about.title|projects.kicker|contact.kicker|projects.status|statusKey|whatsappUrl`: 0 resultados.
  - `grep` en `src/` para `experience.|interests.`: 0 resultados.
  - `grep` de `class="..."` con `m-*` en `src/components`: 0 resultados; sin `[...]` nuevos en archivos editados (único `[...]` hallado es `min-h-[70vh]` preexistente en `ContactSection.vue`, archivo no tocado).
  - Simetría es/en revisada por lectura completa: claves idénticas salvo asimetría preexistente y documentada de `about.body` (es 4 párr. / en 3 párr.); únicas claves nuevas en ambos: `nav.selectLanguage`, `social.whatsappMessage`.
  - Identificadores/handlers/comentarios en inglés verificados (`selectedLocale`, `localeOptions`, `resolveScale`, `responsiveScale`, `buildWhatsappUrl`, `socialExternalLinks`, `LOCALE_STORAGE_KEY`, `AppLocale`); `TvStaticBackground.vue` intacto (nunca editado).
- Resultado: pendiente aceptado explicitamente por el usuario (2026-09-13: el usuario conocía por reporte del orquestador que `bun run dev`/`bun run build` nunca se autorizaron por regla 0.4, e instruyó marcar el plan CLOSED en ese estado).
- Pendientes: `bun run dev` y `bun run build` — aceptados como no ejecutados. Seguimientos detectados tras el cierre (duda `min-xs`, scroll-to-0 en reload, flash de blur en cards de contact, iconos en navbar) se mueven al plan `portfolio-navbar-icons-scroll-blur-xs`.
- Pendientes de comandos: ninguno abierto (verificación por comandos aceptada como no ejecutada, ver Resultado).
