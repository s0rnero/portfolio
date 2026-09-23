---
name: agent-rules
description: Reglas estrictas y protocolos de operacion para agentes del proyecto.
project: [NOMBRE DEL PROYECTO] - harness generico
---

# Rules & Standards - Agentes Del Proyecto

Estas reglas aplican a cualquier agente que trabaje en el codebase. Son la parte generica y compartida del harness: no dependen del stack. Las reglas especificas del stack (lenguaje, framework, estilos, testing, arquitectura) viven en `.agents/CODING_STANDARDS.md` y `.agents/DESIGN.md`, que cada repo adapta.

## 0. Reglas Absolutas

### 0.1 Git

- No interactuar con Git salvo solicitud explicita del usuario.
- Si el usuario pide una operacion destructiva de Git, confirmar antes de proceder.

### 0.2 Eliminacion De Archivos

- No eliminar archivos o carpetas sin aprobacion explicita.
- Si un archivo parece obsoleto, reportarlo y esperar instruccion.

### 0.3 Alcance Por Requerimiento

- Mantener un componente principal por requerimiento.
- No crear subcomponentes, modulos o clases extra salvo solicitud explicita o necesidad tecnica clara explicada al usuario.
- No ampliar el alcance con cambios no solicitados.

### 0.4 Scripts De Verificacion

- No ejecutar automaticamente scripts de desarrollo, build, preview o test del proyecto.
- Los scripts reales estan listados en `.agents/AGENTS.md` (seccion "Scripts Reales Del Proyecto"); no inventar comandos que no existan.
- Si hace falta ejecutar alguno, pedir permiso o reportar que la verificacion quedo pendiente por regla del proyecto.

### 0.5 Skills Subordinadas

- Las skills son referencia especializada, no autoridad superior al estandar local.
- Si una skill contradice `.agents/RULES.md`, `.agents/CODING_STANDARDS.md` o `.agents/DESIGN.md`, prevalece el estandar local.
- Adaptar siempre los ejemplos genericos de las skills (npm/npx/pnpm/yarn) a los scripts y convenciones reales del repo.

### 0.6 Cero Duplicacion

- No duplicar bloques de codigo.
- Si una pieza se necesita en varios lugares, extraer helper, composable, utilidad o patron compartido cuando el alcance lo permita.

### 0.7 Codigo Actual

- Usar documentacion oficial vigente cuando haya duda.
- Evitar APIs deprecated.

### 0.8 Secretos

- Secretos solo por entorno/secret manager; nunca en Git, imagen, logs, respuestas ni frontend.

### 0.9 Verificacion Del Stack

- Antes de sugerir APIs o patrones, verificar el baseline del repo (version de lenguaje, framework, gestor de paquetes) declarado en `.agents/AGENTS.md`.
- No introducir versiones mayores no planificadas por inferencia; requieren plan de migracion y aprobacion.
- No reintroducir normativa de stacks que no pertenecen al repo.

### 0.10 Planes Como Memoria Persistente

- Los planes de `.agents/plans/` son la memoria persistente del proyecto: registran decisiones, contexto, progreso y resultado de cada cambio.
- Completar siempre el workflow: un plan no se abandona ni se descarta; si deja de ser viable, cerrarlo (`CLOSED`) documentando el motivo.
- Nunca eliminar planes: no borrar el archivo, no vaciar su contenido y no archivarlo fuera del repo. Un plan cerrado queda como historial permanente.
- Todo cambio o modificacion del proyecto debe documentarse en el plan correspondiente ANTES de ejecutarse. Sin plan previo, no se modifica nada que requiera plan.

### 0.11 Definition Of Done

- Ningun plan pasa a `CLOSED` sin cumplir el DoD de `.agents/WORKFLOW.md` (seccion "Definition Of Done").
- El DoD se verifica con el checklist de `.agents/subagents/reviewer.md` antes de cerrar.
- Si el DoD no se cumple, el plan permanece `EXECUTED` con el motivo documentado; no se cierra por presion ni por inferencia.

### 0.12 Decisiones De Arquitectura (ADR)

- Toda decision que afecte la arquitectura o el diseno del proyecto se registra como ADR en `.agents/decisions/` (template en `.agents/templates/adr.md`).
- Los planes registran la ejecucion de una tarea; los ADR registran el por que de una decision y son permanentes: nunca se eliminan ni se editan retroactivamente; un cambio de decision se registra como ADR nuevo que marca al anterior como `superseded`.
- Una decision de arquitectura tomada durante un plan genera un ADR ademas del cierre del plan.

### 0.13 Idioma Del Codigo (English-Only)

- Todo el codigo se escribe en ingles: identificadores (variables, funciones, clases, props, eventos, ids/anchors), comentarios, nombres de archivos, mensajes de log y documentacion tecnica inline.
- Spanglish prohibido: nada de identificadores mezclados como `goToPerfil`; lo correcto es `goToProfile` o `handleGoToProfile` (handlers con prefijo `handle`).
- Los textos visibles de la interfaz no son codigo: se gestionan via i18n (locale files), no en identificadores ni constantes hardcodeadas cuando exista capa i18n.
- Excepcion: terminos de dominio sin traduccion razonable (nombres propios, marcas), documentados en su primer uso.
- El codigo preexistente se corrige al tocarlo (migracion incremental); no requiere big-bang.

## 1. Workflow De Agentes

El flujo vigente es:

1. Analizar solicitud y contexto.
2. Leer reglas, `.agents/CODING_STANDARDS.md`, skills relevantes y archivos afectados.
3. Para trabajo amplio, crear un plan MD en estado `PENDING` y detenerse.
4. Pasar a Enrichment unicamente cuando el usuario escriba explicitamente **"enriquece el plan"**.
5. Revisar criticamente el plan enriquecido; no marcar `READY` de forma automatica.
6. Pasar a Executor unicamente cuando el usuario escriba explicitamente **"ejecuta el plan"** y el plan este aprobado/en `READY`.
7. Verificar solo con comandos permitidos o autorizados.
8. Aplicar la revision de cierre (`.agents/subagents/reviewer.md`) y cumplir la Definition of Done antes de marcar `CLOSED`.
9. Reportar resultado final.

**REGLA CRITICA DE FLUJO:**

- NUNCA ejecutes `Enrichment` o `Executor` automaticamente.
- Las frases **"enriquece el plan"** y **"ejecuta el plan"** son compuertas explicitas y no deben inferirse de "continua", "procede", "investiga" o frases similares.
- Investigar, contextualizar, responder preguntas o ajustar un plan no cambia su estado ni autoriza la siguiente fase.
- El usuario debe revisar/aprobar el resultado de Enrichment antes de que el orquestador lo marque `READY`.
- Executor no puede recibir un plan `PENDING` o `ENRICHED`.
- Los comandos de build, dev, preview y test siguen necesitando autorizacion independiente segun la regla 0.4.
- Una tarea simple de 1-2 cambios que no usa plan puede ejecutarse directamente solo cuando el usuario haya pedido implementar ese cambio concreto; no debe convertirse silenciosamente en un flujo de plan.
- `CLOSED` requiere DoD cumplido (regla 0.11); no se cierra un plan sin la entrada de memoria escrita.

No hay fase automatica de historial. No crear registros historicos salvo solicitud explicita del usuario.

## 2. Stack & Estructura

- El stack, la estructura del repo y los scripts reales se declaran en `.agents/AGENTS.md` (seccion "Perfil Del Proyecto").
- Las convenciones de codigo se declaran en `.agents/CODING_STANDARDS.md`.
- La arquitectura y el diseno se declaran en `.agents/DESIGN.md`.
- No inventar reglas de stack por inferencia: si no estan escritas, preguntar o proponer escribirlas.

## 3. Verificacion

- Usar solo comandos de inspeccion seguros sin permiso: lectura de archivos, busqueda, listados y revision puntual.
- Los scripts bloqueados requieren autorizacion explicita del usuario.
- Si una verificacion no se ejecuta por regla, reportarlo explicitamente en el cierre.

## 4. Quick Reference

| Regla            | Hacer                                        | Evitar                                          |
| ---------------- | -------------------------------------------- | ----------------------------------------------- |
| Git              | Esperar solicitud explicita                  | Interactuar sin permiso                         |
| Archivos         | Reportar antes de eliminar                   | Borrar sin aprobacion                           |
| Alcance          | Cambios acotados al requerimiento            | Subcomponentes/modulos extra                    |
| Scripts          | Pedir permiso para verificacion              | Ejecutar scripts bloqueados automaticamente     |
| Skills           | Adaptar al stack y al estandar local         | Dejar que prevalezcan sobre RULES/STANDARDS     |
| Stack            | Seguir CODING_STANDARDS.md y DESIGN.md       | Inventar reglas por inferencia                  |
| Secretos         | Entorno/secret manager, redaccion en logs    | En Git, imagen, logs, respuestas                |
| Planes           | Documentar el cambio en el plan antes de ejecutar; completar el workflow y cerrar | Eliminar, vaciar o abandonar planes sin registro |
| DoD              | Cumplir el checklist antes de CLOSED          | Cerrar un plan sin DoD o sin entrada de memoria  |
| Decisiones       | ADR en `.agents/decisions/` (permanente)      | Dejar la decision solo en el plan                |
| Idioma           | Codigo 100% en ingles (RULES 0.13)            | Spanglish (`goToPerfil`, comentarios en espanol) |

**Ultima actualizacion:** Septiembre 2026
**Version:** 1.2 (regla 0.13 idioma del codigo)
