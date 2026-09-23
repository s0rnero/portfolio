# Decisiones De Arquitectura (ADR)

Registro permanente de decisiones de arquitectura y diseno del proyecto. Complementa a `.agents/plans/`:

- **Los planes** registran como se ejecuto una tarea (contexto, pasos, verificacion) y son la memoria operativa del proyecto.
- **Los ADR** registran por que la arquitectura es como es (decision, contexto, consecuencias) y son memoria permanente de diseno.

## Reglas

- Toda decision que afecte la arquitectura o el diseno del proyecto se registra como ADR (template en `.agents/templates/adr.md`).
- Los ADR son **permanentes**: nunca se eliminan ni se editan retroactivamente. Un cambio de decision se registra como ADR nuevo que marca al anterior como `superseded`.
- Formato de archivo: `<numero>-<slug>.md` (ej: `001-usar-bun.md`).
- Estado: `proposed` -> `accepted` -> `superseded`.

## Flujo

1. Durante un plan (o por decision directa del usuario) se detecta una decision de arquitectura.
2. Se crea el ADR en estado `proposed` con la decision y sus consecuencias.
3. Al confirmarse, pasa a `accepted`.
4. Si el tiempo la invalida, un ADR nuevo la marca como `superseded` con la referencia cruzada.
