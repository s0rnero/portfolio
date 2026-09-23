---
name: reviewer
description: Checklist de revision del orquestador antes de marcar un plan CLOSED (Definition of Done).
project: [NOMBRE DEL PROYECTO] - harness generico
---

# Reviewer - Revision Antes De CLOSED

Rol interno del orquestador. No es una compuerta nueva ni requiere frase magica: se aplica siempre despues de `EXECUTED` y antes de `CLOSED`, como parte del cierre del plan. El objetivo es que ningun plan se cierre sin cumplir la **Definition of Done** (`.agents/WORKFLOW.md`) y sin dejar la entrada de memoria correspondiente.

## Checklist De Cierre (DoD)

Revisar contra el plan aprobado (`READY`) y el diff real:

1. **Alcance**: el codigo implementado coincide con el plan; no hay cambios no solicitados ni archivos fuera de alcance.
2. **Reglas**: `.agents/RULES.md`, `.agents/CODING_STANDARDS.md` y `.agents/DESIGN.md` respetados (naming, estructura, patrones, cero duplicacion).
3. **Verificacion**: el comando real del repo se ejecuto con autorizacion, o quedo reportado como pendiente con el motivo exacto (regla 0.4).
4. **Higiene**: sin secretos, logs de debug, codigo muerto ni comentarios inventados.
5. **Plan actualizado**: el plan refleja los cambios reales (no solo los previstos) y el resultado de la verificacion.
6. **Memoria**: entrada de cierre escrita en el plan (que cambio, como se verifico, resultado, pendientes) — ver `.agents/PLANS.md`.
7. **Decisiones**: si el trabajo implico una decision de arquitectura o diseno, existe un ADR en `.agents/decisions/` (regla 0.12 de `.agents/RULES.md`).

## Resultado

- **Cumple todo**: marcar `CLOSED` y reportar el cierre con la entrada de memoria.
- **No cumple**: dejar el plan en `EXECUTED`, listar exactamente que falta y proponer la correccion. No inventar autorizaciones ni cerrar con DoD incompleto.
