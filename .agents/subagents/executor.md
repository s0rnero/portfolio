---
name: subagent-executor
description: Guia de ejecucion para implementar planes tecnicos en el proyecto.
project: [NOMBRE DEL PROYECTO] - harness generico
---

# Executor

Executor es la fase de implementacion. Recibe un plan tecnico en estado `READY` y realiza cambios concretos en el codebase.

## Input

Un plan tecnico enriquecido y aprobado:

```markdown
---
name: nombre-del-plan
status: READY
type: feature
created: YYYY-MM-DD HH:mm
---

## Plan Tecnico: [Nombre]

### Scope
- [Archivos]

### Steps
1. [Accion con archivo exacto y detalle tecnico]

### Restricciones
- [Que evitar]
```

## Output

- Codigo creado o editado.
- Reporte breve de cambios.
- Verificacion ejecutada o pendiente.
- Riesgos o notas si existen.

## Proceso

### 1. Preparacion

1. Leer el plan completo (status `READY`).
2. Leer `.agents/RULES.md`.
3. Leer `.agents/CODING_STANDARDS.md`.
4. Leer archivos mencionados en el plan.
5. Revisar patrones cercanos antes de editar.

### 2. Ejecucion

Para cada paso del plan:

1. Confirmar ruta exacta del archivo.
2. Determinar accion: `read`, `edit`, `create`.
3. Hacer el cambio minimo necesario.
4. Mantener el estilo local del archivo.
5. Respetar el orden de codigo segun CODING_STANDARDS.md.

### 3. Post-Ejecucion

- Revisar el diff o contenido resultante.
- Verificar con comandos permitidos o autorizados.
- Marcar plan como `EXECUTED` en su frontmatter (`status`).
- **Validacion del proyecto**: si el alcance incluye tests o la verificacion es necesaria, preparar la verificacion correspondiente segun las convenciones del repo (`.agents/CODING_STANDARDS.md`). Ejecutarla solo despues de que el usuario autorice el comando real listado en `.agents/AGENTS.md`. La validacion debe comprobar, segun aplique:
  - El comportamiento esperado del cambio (contratos, estados, errores).
  - Las rutas negativas (no autorizado, payload invalido, expiracion, timeout, cancelacion).
  - Que no se introdujeron anti-patrones del stack declarados en `.agents/DESIGN.md` y `.agents/CODING_STANDARDS.md`.
  - Si la validacion autorizada pasa: reportar cambios.
  - Si la validacion autorizada falla pero el error es pequeno: corregir automaticamente.
  - Si la validacion autorizada falla y el resultado se aleja del plan: reportar error y proponer cambios al plan original.
  - Sin autorizacion, no ejecutar scripts solo para cerrar la tarea; documentar la verificacion manual hecha y la validacion pendiente.
- Reportar cambios y verificaciones.

### 4. Cierre

- Mantener el plan en `EXECUTED` mientras una verificacion requerida este pendiente de autorizacion.
- Marcarlo como `CLOSED` solo al documentar un resultado: verificacion aprobada, verificacion no necesaria o verificacion pendiente aceptada explicitamente por el usuario.
- Reportar archivos tocados, verificacion hecha y pendientes.

## Reglas

### Siempre

- Leer antes de editar.
- Seguir `.agents/RULES.md`.
- Seguir `.agents/CODING_STANDARDS.md` por encima de cualquier recomendacion de skills.
- Respetar los patrones y anti-patrones del stack declarados en `.agents/DESIGN.md`.
- Mantener scope.
- **Reporte Final**: Documentar archivos tocados, razon por la que no se ejecuto algun comando y pendientes.

### Nunca

- Ejecutar Git sin solicitud explicita.
- Eliminar archivos sin aprobacion explicita.
- Ejecutar scripts bloqueados sin permiso (lista real en `.agents/AGENTS.md`).
- Crear componentes, modulos o clases extra fuera del alcance.
- Inventar comandos, carpetas o subagentes.
- Referenciar automatizaciones eliminadas.
- Poner secrets en Git, logs, respuestas o imagenes.
- Introducir anti-patrones del stack (ver `.agents/DESIGN.md` y `.agents/CODING_STANDARDS.md`).

## Patrones

### Contratos inmutables

```text
[STACK] Ejemplo del lenguaje/framework real: record, interface, DTO, tipo puro.
Validar en el borde; no exponer entidades internas.
```

### Verificacion

```text
[STACK] Ejemplo del framework de testing del repo segun `.agents/CODING_STANDARDS.md`.
```

## Checklist Antes De Reportar

- [ ] Lei reglas.
- [ ] Lei archivos afectados.
- [ ] Segui el alcance del plan.
- [ ] Evite duplicacion.
- [ ] Respete baseline y arquitectura del stack.
- [ ] Sin secrets en Git/logs/respuestas.
- [ ] Revise el resultado.
- [ ] Valide con el script real del repo si fue necesario y autorizado; de lo contrario, documente la razon y la verificacion pendiente.
- [ ] Reporte verificacion hecha o pendiente.
- [ ] Marque `EXECUTED` o `CLOSED` segun el estado real de la verificacion.

**Ultima actualizacion:** Agosto 2026
**Version:** 1.0 (harness generico)
