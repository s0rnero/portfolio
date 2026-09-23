---
name: enrichment-process
description: Guia de enrichment para convertir solicitudes generales en planes tecnicos ejecutables.
project: [NOMBRE DEL PROYECTO] - harness generico
---

# Enrichment Process

Enrichment es el rol/subagente encargado de la fase de analisis. Su objetivo es transformar un plan en estado `PENDING` en un plan tecnico suficientemente claro, actualizando su estado a `ENRICHED` al terminar.

## Input

Un plan MD creado por el orquestador:

```markdown
---
name: nombre-del-plan
status: PENDING
type: feature
created: YYYY-MM-DD HH:mm
---

# Plan: [Nombre]

## Objetivo

- [Que quiere lograr el usuario]

## Alcance

- [Archivos afectados]

## Restricciones

- [Que no hacer]

## Pasos

1. [Paso general]

## Verificacion

- [Como verificar]
```

## Output

Un plan tecnico enriquecido:

```markdown
---
name: nombre-del-plan
status: ENRICHED
type: feature
created: YYYY-MM-DD HH:mm
---

## Plan Tecnico: [Nombre]

### Analisis

- Objetivo:
- Scope:
- Archivos:
- Riesgos:

### Cambios

- [Cambio concreto por archivo]

### Restricciones

- [Que evitar]

### Steps

1. [Paso ejecutable con archivo exacto, accion y detalle tecnico]

### Verificacion

- [Comando autorizado o revision manual]
```

## Proceso

### 1. Leer el plan MD proporcionado

Leer el plan completo incluyendo:

- Objetivo claro del usuario.
- Alcance definido (archivos, modulos).
- Restricciones explicitas.
- Pasos generales.

### 2. Investigar Contexto Adicional

Leer como minimo:

| Que buscar        | Donde                                          |
| ----------------- | ---------------------------------------------- |
| Reglas            | `.agents/RULES.md`                             |
| Standards         | `.agents/CODING_STANDARDS.md`                  |
| Arquitectura      | `.agents/DESIGN.md`                            |
| Perfil del repo   | `.agents/AGENTS.md` (stack, estructura, scripts)|
| Planes existentes | `.agents/plans/`                               |
| Codigo afectado   | Archivos fuente mencionados en el plan         |
| Skills relevantes | `.agents/skills/` (ver README)                 |

### 3. Analizar y Detallar

- Identificar objetivo exacto del usuario.
- Determinar archivos afectados y dependencias.
- Revisar patrones existentes antes de proponer cambios.
- Marcar riesgos o posibles breaking changes.
- Mantener estrictamente el scope del plan original.

Cada paso debe tener:

- Archivo exacto.
- Accion: `read`, `edit`, `create`.
- Detalle tecnico concreto.
- Restricciones aplicables.

### 4. Validar plan contra lineamientos

Antes de dar el plan como salida, verificar:

| Lineamiento      | Que validar                                                                                                                                              | Referencia                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Arquitectura     | Los cambios respetan las capas, modulos y patrones declarados                                                                                            | `.agents/DESIGN.md`       |
| Coding standards | Estructura, naming, contratos y orden de codigo segun el stack                                                                                           | `.agents/CODING_STANDARDS.md` |
| Rules            | No git, no scripts bloqueados, alcance por requerimiento, secretos por entorno, skills subordinadas                                                      | `.agents/RULES.md`        |
| Skills           | Si el plan toca el stack del repo, cargar la skill relevante de `.agents/skills/` y verificar que el plan no contradiga sus recomendaciones, salvo que contradigan `.agents/CODING_STANDARDS.md` | `.agents/skills/` |

Si el plan viola algun lineamiento, corregirlo antes de emitirlo. No pasar planes que no pasen esta validacion.

Prioridad: `.agents/CODING_STANDARDS.md` prevalece sobre cualquier skill. Las skills amplian contexto, pero no reemplazan el estandar local.

### 5. Marcar como ENRICHED

Actualizar el frontmatter del plan con `status: ENRICHED` y devolver el resultado al orquestador.

## Reglas

### Siempre

- Leer el plan MD completo antes de enriquecer.
- Consultar `.agents/RULES.md`.
- Consultar `.agents/CODING_STANDARDS.md`.
- Consultar `.agents/DESIGN.md`.
- Leer archivos existentes antes de proponer edits.
- Usar skills solo si aportan contexto.
- Ser detallista sin inflar el alcance.
- Incluir verificacion esperada.
- Mantener estrictamente el scope del plan original (no agregar cambios no solicitados).

### Nunca

- Ejecutar codigo durante enrichment.
- Inventar archivos o comandos.
- Referenciar automatizaciones eliminadas.
- Proponer atajos conversacionales inexistentes.
- Salirse del scope del usuario.
- Agregar features o cambios no pedidos en el plan original.

## Checklist

- [ ] Lei el plan MD completo.
- [ ] Lei reglas, standards y design.
- [ ] Lei el perfil del repo en `.agents/AGENTS.md`.
- [ ] Lei archivos afectados.
- [ ] Revise skills relevantes.
- [ ] Mantuve el scope exacto del plan original.
- [ ] Liste pasos ejecutables con archivos exactos.
- [ ] Inclui restricciones.
- [ ] Inclui verificacion.
- [ ] Valide contra `.agents/DESIGN.md`
- [ ] Valide contra `.agents/CODING_STANDARDS.md`
- [ ] Valide contra skills aplicables
- [ ] Marque estado como `ENRICHED`

**Ultima actualizacion:** Agosto 2026
**Version:** 1.0 (harness generico)
