# Portafolio

Mi portafolio personal, construido con **Vue 3 + Vite + TypeScript + Tailwind CSS**.

## Stack

- [Vue 3](https://vuejs.org/) con `<script setup>` y TypeScript
- [Vite](https://vite.dev/) como build tool
- [Tailwind CSS v4](https://tailwindcss.com/) (vía plugin `@tailwindcss/vite`)
- [vue-tsc](https://github.com/vuejs/language-tools) para typecheck

> Gestor de paquetes: **bun** (bun.lock). No usar npm.

## Scripts

```bash
bun install              # instalar dependencias
bun run dev              # servidor de desarrollo
bun run build            # typecheck + build de producción
bun run preview          # previsualizar el build
```

## Personalizar

Todos los datos del sitio (nombre, rol, bio, habilidades, redes y proyectos)
se editan en un solo lugar:

| Archivo                 | Qué contiene                                              |
| ----------------------- | --------------------------------------------------------- |
| `src/data/portfolio.ts` | Datos personales: nombre, rol, descripción, skills, redes |
| `src/data/projects.ts`  | Lista de proyectos (título, descripción, tags, links)     |

La estructura de componentes está en `src/components/`:

```
src/
├── data/            # datos del sitio (editá acá)
├── components/
│   ├── AppHeader.vue       # navbar fija con menú móvil
│   ├── HeroSection.vue     # sección de presentación
│   ├── AboutSection.vue    # sobre mí + tecnologías
│   ├── ProjectsSection.vue # grilla de proyectos
│   ├── ProjectCard.vue     # tarjeta individual de proyecto
│   ├── ContactSection.vue  # contacto + redes
│   ├── AppFooter.vue       # footer
│   └── BaseIcon.vue        # iconos SVG reutilizables
└── App.vue          # composición de todas las secciones
```

## Deploy

El build genera los archivos estáticos en `dist/`, listos para desplegar en
cualquier hosting estático (Vercel, Netlify, GitHub Pages, etc.).
