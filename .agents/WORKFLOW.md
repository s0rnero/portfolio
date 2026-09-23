---
name: workflow-automation
description: Flujo vigente del sistema de agentes. No depende de automatizaciones eliminadas.
project: [NOMBRE DEL PROYECTO] - harness generico
---

# Workflow Del Sistema De Agentes

Este documento describe el flujo real que debe seguir el orquestador dentro de la sesion actual. El sistema no usa atajos conversacionales, watchers automaticos ni fases de historial automaticas. Este flujo es identico en todos los repositorios que usan este harness.

## Principio Base

El orquestador no debe simular automatizaciones que no existen. Si una tarea requiere codigo, el agente lee contexto, prepara el alcance, implementa y reporta. Si una tarea requiere una verificacion que las reglas bloquea, pide permiso o lo deja explicitamente reportado.

## Flujo Principal

```text
1. Recibir solicitud del usuario
2. Clasificar: pregunta, bug, feature, refactor, mantenimiento o investigacion
3. Leer contexto minimo:
   - .agents/AGENTS.md
   - .agents/RULES.md
   - .agents/CODING_STANDARDS.md
   - archivos fuente afectados
   - skill relevante, si aplica
4. Clasificar alcance:
   - Pregunta -> responder sin cambiar estados ni archivos
   - Simple (1-2 cambios) -> ejecutar solo si el usuario pide implementar explicitamente
   - Amplio (multiples cambios/archivos) -> crear plan en PENDING y detenerse
5. Enriquecer unicamente con la frase explicita: "enriquece el plan"
6. Ejecutar unicamente con la frase explicita: "ejecuta el plan", despues de revisar/aprobar el plan
7. Verificar con comandos permitidos o autorizados
8. Aplicar la revision de cierre (`.agents/subagents/reviewer.md`) y cumplir el DoD antes de `CLOSED`
9. Reportar resultado final
```

## Compuertas Explicitas De Transicion

Estas compuertas son obligatorias para trabajos que usan `.agents/plans/`:

- Crear o actualizar un plan inicial deja el plan en `PENDING`; no inicia enrichment ni ejecucion. Para solicitudes amplias el plan persistido es obligatorio.
- Investigar, leer archivos, consultar documentacion o recrear un problema no cambia el estado del plan.
- La frase **"enriquece el plan"** es la autorizacion para pasar de `PENDING` a `ENRICHED` e invocar Enrichment. Variaciones ambiguas como "investiga", "continua" o "procede" no sustituyen esta autorizacion.
- Tras `ENRICHED`, el orquestador debe revisar el contenido y explicar cualquier decision importante. No se marca `READY` automaticamente.
- La frase **"ejecuta el plan"** es la autorizacion para pasar de `READY` a ejecucion e invocar Executor. Variaciones ambiguas no sustituyen esta autorizacion.
- Executor no puede ser invocado desde un plan `PENDING` o `ENRICHED`.
- Si el usuario pide primero investigar, responder o ajustar el plan, el flujo permanece en su estado actual y no se editan archivos de aplicacion.
- Los scripts bloqueados por `RULES.md` siguen requiriendo autorizacion independiente aunque exista autorizacion para ejecutar el plan.
- `CLOSED` no se autoriza por frase: se alcanza solo cuando el DoD esta cumplido y la entrada de memoria esta escrita.

El orquestador debe confirmar en su respuesta que compuerta esta atendiendo y detenerse cuando no exista la frase requerida.

Si una skill contradice `.agents/CODING_STANDARDS.md`, el flujo debe seguir `.agents/CODING_STANDARDS.md`. Las skills solo complementan el criterio local.

## Flujo Simple (1-2 cambios)

Para solicitudes reducidas y claras:

```text
1. Leer contexto minimo (reglas, standards, archivos)
2. Implementar cambio directamente
3. Verificar inline: RULES.md, CODING_STANDARDS.md, DESIGN.md
4. Reportar resultado
```

No se crea plan MD. No se invocan subagentes. El orquestador asume todas las verificaciones.

## Flujo Completo con Plan (Solicitud Amplia)

Para solicitudes con multiples pasos o que tocan multiples archivos:

```text
1. Crear plan MD en .agents/plans/
   - Frontmatter: name, status (PENDING), type, created
   - Contenido: objetivo, alcance, archivos, restricciones, pasos, verificacion
2. Esperar la frase explicita "enriquece el plan" e invocar Enrichment
   - Pasar plan MD + contexto (reglas, standards, archivos fuente)
   - Enrichment convierte el plan en pasos tecnicos detallados
3. Revision critica del orquestador (OBLIGATORIO)
   - Verificar que cumple exactamente lo pedido
   - Verificar que no inventa cambios no solicitados
   - Verificar que respeta RULES.md, CODING_STANDARDS.md, DESIGN.md
   - Verificar que no introduce anti-patrones del stack (ver CODING_STANDARDS.md)
   - Si no cumple: rechazar, corregir o re-enriquecer
4. Si aprueba: marcar READY y esperar la frase explicita "ejecuta el plan"
5. Tras esa frase, invocar Executor para implementar los cambios
6. Registrar `EXECUTED` cuando la implementacion termino (la verificacion puede quedar pendiente)
7. Aplicar la revision de cierre (checklist en `.agents/subagents/reviewer.md`) y cumplir la **Definition of Done** antes de `CLOSED`
```

## Uso De Planes

`.agents/plans/` es obligatorio para solicitudes amplias.

### Cuando crear plan MD

- La solicitud tiene 3+ pasos o toca multiples archivos/areas.
- El usuario pide plan explicito.
- El cambio es suficientemente complejo que necesita enriquecimiento tecnico.
- La tarea puede retomarse despues.

### Cuando NO crear plan MD

- Es un cambio simple de 1-2 pasos (1-2 archivos, fix puntual).
- Es una pregunta informativa.
- Crear el plan agregaria ruido sin valor.

### Formato De Plan

Usar `.agents/templates/plan.md` como base (incluye la entrada de cierre como memoria persistente).

```markdown
---
name: nombre-del-plan
status: PENDING
type: feature|bugfix|refactor|maintenance|research
created: YYYY-MM-DD HH:mm
---

# Plan: [Nombre]

## Objetivo
- [Resultado esperado]

## Alcance
- [Archivos o modulos afectados]

## Restricciones
- [Que no hacer]

## Pasos
1. [Paso ejecutable]

## Verificacion
- [Comando permitido/autorizado o revision manual]
```

### Estados Del Plan (Lifecycle)

- **PENDING:** Pendiente a enriquecer.
- **ENRICHED:** Enriquecido por el subagente, esperando revision del orquestador.
- **READY:** Revisado y aprobado por el orquestador, listo para ejecutar.
- **EXECUTED:** Implementado; la verificacion puede estar pendiente.
- **CLOSED:** Finalizado cumpliendo la **Definition of Done** (seccion siguiente) y con el resultado de verificacion documentado: aprobado, no necesario o pendiente aceptado explicitamente por el usuario. La entrada de cierre queda como memoria persistente.

**Ciclo:** `PENDING` -> `ENRICHED` -> (Orquestador revisa) -> `READY` -> `EXECUTED` -> (Revision de cierre + DoD) -> `CLOSED`

## Definition Of Done (DoD)

Ningun plan pasa a `CLOSED` sin cumplir el DoD. Checklist obligatorio:

- [ ] El codigo implementado coincide con el plan aprobado: sin cambios no solicitados ni alcance extra.
- [ ] La verificacion real del repo se ejecuto con comando autorizado, o quedo reportada como pendiente por regla 0.4 con el motivo exacto.
- [ ] No se introdujeron secretos, logs de debug, codigo muerto ni duplicacion.
- [ ] Los archivos tocados respetan `.agents/CODING_STANDARDS.md` y `.agents/DESIGN.md`.
- [ ] El plan quedo actualizado con los cambios reales y el resultado de la verificacion.
- [ ] La entrada de cierre del plan quedo escrita como memoria persistente (ver `.agents/PLANS.md`): que cambio, como se verifico, resultado y pendientes.

`CLOSED` sin DoD es una violacion de regla. El orquestador aplica el checklist de `.agents/subagents/reviewer.md` antes de cerrar.

## Enrichment

Usar `.agents/subagents/enrichment-process.md` como guia cuando la solicitud sea amplia. Esta fase solo puede comenzar despues de que el usuario escriba explicitamente **"enriquece el plan"**. Enrichment analiza, investiga y detalla; no implementa codigo ni ejecuta scripts.

Entrada:

- Plan MD + contexto adicional.

Salida:

- Plan tecnico enriquecido con archivos, acciones, restricciones y verificacion.

El orquestador DEBE revisar criticamente el output antes de aprobar.

## Executor

Usar `.agents/subagents/executor.md` como guia para implementar. Esta fase solo puede comenzar despues de que el plan este en `READY` y el usuario escriba explicitamente **"ejecuta el plan"**. Executor implementa y verifica dentro del alcance aprobado; no redefine el plan.

Responsabilidades:

- Leer archivos antes de editarlos.
- Tocar solo el alcance necesario.
- Seguir `.agents/RULES.md` y `.agents/CODING_STANDARDS.md`.
- Pasar el quality-gate de reglas del stack antes de reportar.
- Ejecutar la verificacion real del repo (listada en `.agents/AGENTS.md`) solo si el usuario autorizo el comando correspondiente.
- Reportar cambios.

## Verificacion

Los scripts reales del proyecto se listan en `.agents/AGENTS.md` (seccion "Scripts Reales Del Proyecto"). Regla vigente: no ejecutar scripts de build/dev/test/preview automaticamente. Si la verificacion es necesaria, pedir permiso al usuario o reportar que quedo pendiente por restriccion.

Comandos de inspeccion seguros como lectura de archivos, busqueda, listados y revision puntual pueden usarse para contextualizar el trabajo.

## Reporte Final

El reporte final debe incluir:

- Que se cambio.
- Archivos modificados.
- Verificacion ejecutada o razon por la que no se ejecuto.
- Riesgos o pendientes, si existen.

No incluir referencias a automatizaciones, archivos o atajos que no existan en el arbol actual de `.agents`.

## Flujo Resumido

```text
Usuario -> Orquestador -> Contexto
  -> [Simple?] -> Ejecutar directo -> Verificar inline -> Reporte
  -> [Amplio?] -> Plan MD -> Enrichment -> Revision orquestador
                                  -> Executor -> Revision de cierre + DoD -> CLOSED -> Reporte
```

**Ultima actualizacion:** Agosto 2026
**Version:** 1.1 (harness generico)
