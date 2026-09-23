# Portafolio

Mi portafolio personal: SPA construida con **Vue 3 + Vite + TypeScript + Tailwind CSS**, con i18n ES/EN, animaciones GSAP y un huevo de pascua jugable (Vice City embebido vía reVC/WASM).

## Stack

- [Vue 3](https://vuejs.org/) con `<script setup>` y TypeScript (`vue-tsc` en el build)
- [Vite](https://vite.dev/) como dev server y build
- [Tailwind CSS v4](https://tailwindcss.com/) (vía plugin `@tailwindcss/vite`)
- [vue-router](https://router.vuejs.org/) en modo history (`/`, `/projects`, `/contact`)
- [vue-i18n](https://vue-i18n.intlify.dev/) (`legacy: false`; `es` es la fuente, `en` traduce)
- GSAP + Lenis (animaciones, reveal e intro CRT con scroll suave)
- [khatarsis](https://github.com/s0rnero/khatarsis) como librería local de componentes (`k-*`)
- ESLint 9 + Prettier 3

> Gestor de paquetes: **bun** (`bun.lock`). No usar npm.

## Scripts

```bash
bun install              # instalar dependencias
bun run dev              # servidor de desarrollo
bun run build            # typecheck (vue-tsc) + build de producción
bun run preview          # previsualizar el build
bun run lint:check       # eslint (reporta)
bun run lint             # eslint (aplica fixes)
bun run format:check     # prettier (reporta)
bun run format           # prettier (aplica)
```

No hay suite de tests: la verificación es `lint:check` + `format:check` + `build` y revisión visual.

## Personalizar

Textos visibles (ES fuente, EN traducción) y datos, cada uno en su lugar:

| Archivo                  | Qué contiene                                        |
| ------------------------ | --------------------------------------------------- |
| `src/data/portfolio.ts`  | Datos: perfil, skills, redes, proyectos, contacto   |
| `src/i18n/locales/es.ts` | Copy en español (fuente)                            |
| `src/i18n/locales/en.ts` | Traducción al inglés de lo que ya existe en `es.ts` |
| `src/router/index.ts`    | Rutas y `NAV_SECTIONS` (fuente única de navegación) |

Estructura (resumen):

```
src/
├── App.vue               # composición por capas (navbar, fondos, router-view, footer)
├── main.ts               # entry (plugins, i18n, router, canonical, montaje)
├── style.css             # Tailwind: @theme, tokens, variante dark
├── components/<dominio>/ # about/ background/ common/ contact/ crt/ cursor/
│                         # hero/ layout/ projects/ vicecity/
├── composables/          # use* (scroll, spy, reveal, theme, quality, juego…)
├── views/                # MainView (lo que monta el router)
└── vendor/gtavc-web/     # loader del juego (vendored, no tocar a mano)
```

## Juego embebido

El portafolio incluye el juego completo servido fuera del bundle y fuera de Git:

- Los datos (~1 GB) **no se commitean**: en dev los sirve el plugin `vcWeb` desde un checkout local, en producción desde un bucket R2 vía Worker (`worker/vc-data.js`).
- Configuración local (nunca commitear valores propios): `VC_STREAMED_DIR` y `VC_ASSETS_DIR` (ver `.env.example`).
- URLs públicas de producción: `.env.production` (`VITE_VC_*`, sin secretos).
- Decisiones de arquitectura del juego: `.agents/decisions/013-*.md`, `014-*.md`, `015-*.md`.

## Deploy

Build de Netlify (`netlify.toml` corre `bun run build` y publica `dist/`). Cabeceras COOP/COEP y fallback SPA viajan en `public/_headers` y `public/_redirects`.

> `dist/game/` (datos locales de desarrollo) no se sube al hosting: producción usa el Worker/R2.

## Agentes

El flujo de trabajo con IA vive en [`.agents/`](.agents/AGENTS.md) (roles, compuertas, planes y decisiones).
