---
name: agents-system-index
description: Indice central del sistema de agentes y contexto operativo del proyecto.
project: portfolio - harness generico de agentes
---

# Sistema de Agentes - Indice Central

Este archivo es el punto de entrada para cualquier IA que trabaje en este proyecto. Define el contexto del codebase, el flujo vigente y las reglas que deben respetarse antes de tocar codigo.

> **Nota de bootstrap:** este es el harness generico compartido por todos los repositorios. El nucleo (workflow, roles, compuertas, ciclo de planes, skills) es identico en todos los repos. Lo unico que se adapta por repo es este perfil, `.agents/CODING_STANDARDS.md` y `.agents/DESIGN.md`. Ver `.agents/bootstrap/INSTALL.md`.

## 1. Perfil Del Proyecto

> Verificado el 2026-09-15 contra `package.json`, `tsconfig*.json`, `eslint.config.mjs`, `.prettierrc` y el arbol real de `src/`.

### Stack

| Tecnologia | Uso |
| --- | --- |
| Vue 3 (Composition API, `<script setup lang="ts">`) | Framework de UI de la SPA |
| TypeScript 5 + `vue-tsc` | Tipado de componentes, composables y datos; corre dentro del build |
| Vite 8 | Dev server, build y manejo de assets |
| Tailwind CSS 4 | Todos los estilos; tokens y variantes en `src/style.css` |
| vue-router 4 | Rutas `/`, `/projects`, `/contact` (resuelven `MainView`) y `/vicecity` |
| vue-i18n 11 | `legacy: false`; `es` es la fuente y `en` la traduccion |
| GSAP + Lenis | Animaciones (reveal, intro CRT) y scroll suave |
| khatarsis (dependencia `file:`) | Libreria local de componentes `k-*`; expone tipos publicos |
| ESLint 9 + Prettier 3 | `lint:check` / `format:check` |
| Gestor de paquetes | **bun** (no usar npm) |

### Estructura Del Proyecto

```text
src/
|-- App.vue                 # Raiz de composicion (navbar, fondos, router-view, footer)
|-- main.ts                 # Entry point (plugins, i18n, router, montaje)
|-- style.css               # Tailwind: @theme, tokens, variante dark, scrollbar
|-- assets/                 # about/, brands/, logo/, trailers/
|-- components/
|   `-- about/ background/ common/ contact/ crt/ cursor/ hero/ layout/ projects/
|-- composables/            # useSmoothScroll, useSectionSpy, useReveal, useTheme, useCrtIntro...
|-- data/                   # portfolio.ts (datos tipados del sitio)
|-- i18n/
|   |-- index.ts
|   `-- locales/            # es.ts (fuente), en.ts (traduccion)
|-- router/index.ts         # Rutas + NAV_SECTIONS
`-- views/                  # MainView.vue y vistas fuera de la navegacion
vite.config.ts              # Raiz del proyecto (Vite + vue + tailwindcss)
```

Nota `khatarsis`: dependencia local (`file:`, symlink a `../khatarsis/packages/khatarsis`), prefijo `k-*`. **Expone tipos publicos** (`"types": "./dist/public/types/public.d.ts"` en su `package.json`), asi que el shim `src/khatarsis.d.ts` se elimino: los componentes se consumen con import nombrado (ej. `import { Drawer } from 'khatarsis'`) y `vue-tsc` valida props y slots. El paquete **no** declara `GlobalComponents`, asi que en plantilla un componente de la libreria se escribe en kebab-case.

### Scripts Reales Del Proyecto

> Declarados en `package.json`. Gestor: **bun**. No existe script de test ni suite de tests.

| Proposito | Comando |
| --- | --- |
| Dev server | `bun run dev` |
| Build (typecheck + bundle) | `bun run build` (`vue-tsc -b && vite build`) |
| Preview del build | `bun run preview` |
| Lint (reporta) | `bun run lint:check` (`eslint .`) |
| Lint (aplica fixes) | `bun run lint` (`eslint . --fix`) |
| Formato (reporta) | `bun run format:check` (`prettier --check .`) |
| Formato (aplica) | `bun run format` (`prettier --write .`) |

## 2. Objetivo Del Sistema De Agentes

Mantener una forma de trabajo consistente en todos los repos: entender primero, planear lo justo, implementar con alcance claro y reportar cambios sin inventar procesos externos.

## 3. Estructura De `.agents`

```text
.agents/
|-- AGENTS.md                      # Indice central (este archivo)
|-- RULES.md                       # Reglas operativas genericas del proyecto
|-- CODING_STANDARDS.md            # Convenciones de codigo del stack
|-- DESIGN.md                      # Arquitectura y diseno del stack
|-- WORKFLOW.md                    # Flujo vigente + compuertas + Definition of Done
|-- PLANS.md                       # Ownership de planes (memoria persistente)
|-- manifest.json                  # Version y listas del harness (install/update)
|-- plans/                         # Planes del proyecto (estados segun WORKFLOW.md)
|-- decisions/                     # Decisiones de arquitectura (ADR, permanentes)
|-- templates/                     # Plantillas: plan.md y adr.md
|-- orchestrator/
|   `-- instructions.md            # Rol del orquestador
|-- subagents/
|   |-- enrichment-process.md      # Guia para convertir una solicitud en plan tecnico
|   |-- executor.md                # Guia para implementar un plan tecnico
|   `-- reviewer.md                # Checklist de cierre (DoD) antes de CLOSED
|-- skills/                        # Skills registradas (autoskills + manuales)
|   `-- README.md                  # Registro y proceso de incorporacion
`-- bootstrap/
    `-- INSTALL.md                 # Como instalar/actualizar este harness en un repo
```

Notas importantes:

- No hay archivo de comandos operativos; no se deben inventar atajos conversacionales.
- No hay fase automatica de historial; no se deben crear registros historicos salvo que el usuario vuelva a pedir ese sistema.
- `.agents/plans/` conserva los planes; las solicitudes amplias deben tener un plan persistido segun `.agents/WORKFLOW.md`.

## 4. Roles Vigentes

| Rol            | Archivo                                   | Funcion                                                                           |
| -------------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| Orquestador    | `.agents/orchestrator/instructions.md`    | Recibe la solicitud, decide el flujo, coordina contexto, implementacion y reporte |
| Enrichment     | `.agents/subagents/enrichment-process.md` | Convierte una solicitud amplia en plan tecnico ejecutable                         |
| Executor       | `.agents/subagents/executor.md`           | Ejecuta cambios concretos siguiendo un plan o alcance definido                    |
| Revision       | `.agents/subagents/reviewer.md`           | Checklist de cierre (DoD) antes de `CLOSED`                                       |
| Rules globales | `.agents/RULES.md`                        | Restricciones operativas compartidas                                              |
| Skills         | `.agents/skills/README.md`                | Skills locales y comunitarias registradas                                         |

## 5. Flujo Vigente

```text
Usuario
  -> Orquestador contextualiza la solicitud
  -> Lee reglas, skills y archivos relevantes
  -> Clasifica alcance:
     - Pregunta -> Responde sin cambiar estados
     - Simple sin plan -> Implementa solo si el usuario lo pide explicitamente
     - Amplio -> Crea plan MD en PENDING y se detiene
  -> "enriquece el plan" -> Enrichment -> ENRICHED
  -> Revision/aprobacion del orquestador -> READY
  -> "ejecuta el plan" -> Executor -> EXECUTED
  -> Revision de cierre (reviewer.md) + DoD -> CLOSED
  -> Reporta cambios, archivos tocados y verificaciones
```

### Compuertas De Autorizacion

Para cualquier solicitud amplia con plan:

- **"enriquece el plan"** autoriza exclusivamente la transicion `PENDING -> ENRICHED`.
- **"ejecuta el plan"** autoriza exclusivamente la transicion `READY -> EXECUTED` mediante Executor.
- "Investiga", "contextualizate", "continua", "procede" o "haz un plan" no autorizan por si solas ninguna de esas transiciones.
- La investigacion puede actualizar el analisis del plan sin cambiar su estado.
- El orquestador debe mostrar en cada respuesta si esta en `PENDING`, `ENRICHED`, `READY`, `EXECUTED` o `CLOSED`.
- `CLOSED` se alcanza cumpliendo la Definition of Done (`.agents/WORKFLOW.md`); no se autoriza por frase.

El flujo es conversacional y ejecutable en la sesion actual. No depende de watchers, atajos conversacionales, scripts ocultos ni subagentes inexistentes.

## 6. Reglas Absolutas

Estas reglas resumen `.agents/RULES.md`; si hay duda, manda `.agents/RULES.md`.

- No usar Git salvo solicitud explicita del usuario.
- No eliminar archivos o carpetas sin aprobacion explicita.
- Mantener el alcance de una tarea en un componente principal por requerimiento, salvo instruccion contraria.
- No ejecutar scripts de desarrollo, build, preview o test sin permiso del usuario (la lista real de scripts vive en la seccion 1).
- No inventar comandos, archivos, atajos conversacionales ni subagentes inexistentes.
- No poner secretos en Git, logs, respuestas ni imagenes.
- Cero duplicacion: si una pieza se necesita en varios lugares, extraer helper/composable/patron compartido.
- Usar la documentacion oficial vigente; evitar APIs deprecated.
- Las skills son referencia subordinada: una skill nunca prevalece sobre `.agents/RULES.md`, `.agents/CODING_STANDARDS.md` ni `.agents/DESIGN.md`.
- Ningun plan pasa a `CLOSED` sin cumplir la Definition of Done (`.agents/WORKFLOW.md`) y sin su entrada de memoria.
- Cualquier regla especifica del stack (lenguaje, framework, estilos, testing) se define en `.agents/CODING_STANDARDS.md` y `.agents/DESIGN.md`, no se inventa por inferencia.

## 7. Skills Disponibles

Las skills se resuelven por stack via **autoskills** (`npx autoskills`): escanea el repo, detecta las tecnologias y instala las skills curadas del registro auditado en `.agents/skills/`. Ver `.agents/skills/README.md`.

| Como | Comando |
| --- | --- |
| Preview sin instalar | `npx autoskills --dry-run` |
| Instalar las detectadas | `npx autoskills -y` |
| Agregar una skill manual | `npx skills find <query>` / `npx skills add <owner/repo> --list` |

Las skills pueden contener ejemplos genericos de sus fuentes originales (con `npm`, `npx`, `pnpm`, `yarn` u otros scripts que no existen en este repo). En este proyecto, adaptar siempre esos ejemplos a los scripts reales declarados en la seccion 1 y a las convenciones de `.agents/CODING_STANDARDS.md`.

Prioridad de lineamientos: una skill nunca prevalece sobre `.agents/RULES.md`, `.agents/CODING_STANDARDS.md` ni `.agents/DESIGN.md`. Las skills son referencia especializada, no autoridad superior al estandar local.

## 8. Checklist Del Orquestador

Antes de actuar:

- Entender la solicitud exacta del usuario.
- Leer `.agents/RULES.md` y los archivos relevantes.
- Aplicar `.agents/CODING_STANDARDS.md` por encima de cualquier recomendacion de skills.
- Verificar si la tarea es pregunta, bug, feature, refactor o mantenimiento.
- Revisar los planes existentes en `.agents/plans/` antes de crear uno nuevo.
- Cargar skills aplicables solo cuando aporten al trabajo (ver `.agents/skills/README.md`).
- Hacer cambios acotados y consistentes con el codebase.
- Reportar archivos modificados y pruebas/comandos ejecutados o no ejecutados.

## 9. Quick Reference

| Para...                  | Consultar                                  |
| ------------------------ | ------------------------------------------ |
| Entender el sistema      | `.agents/AGENTS.md`                        |
| Seguir el flujo vigente  | `.agents/WORKFLOW.md`                      |
| Actuar como orquestador  | `.agents/orchestrator/instructions.md`     |
| Aplicar reglas tecnicas  | `.agents/RULES.md`                         |
| Escribir codigo          | `.agents/CODING_STANDARDS.md`              |
| Arquitectura y diseno    | `.agents/DESIGN.md`                        |
| Preparar un plan tecnico | `.agents/subagents/enrichment-process.md`  |
| Ejecutar un plan         | `.agents/subagents/executor.md`            |
| Revisar antes de CLOSED  | `.agents/subagents/reviewer.md`            |
| Definition of Done       | `.agents/WORKFLOW.md`                      |
| Decisiones de arquitectura | `.agents/decisions/`                     |
| Plantillas plan/ADR      | `.agents/templates/`                       |
| Skills del stack         | `.agents/skills/README.md`                 |
| Instalar/actualizar      | `.agents/bootstrap/INSTALL.md`             |

**Ultima actualizacion:** Agosto 2026
**Version del sistema:** 1.1 (harness generico)
