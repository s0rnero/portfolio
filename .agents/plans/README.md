# Plans

Directorio de planes del proyecto. Cada solicitud amplia debe tener un plan MD persistido aqui segun `.agents/WORKFLOW.md`.

`.agents/plans/` es la memoria persistente del proyecto: los planes nunca se eliminan, ni se vacia su contenido, ni se archivan fuera del repo. Todo cambio o modificacion debe documentarse en un plan antes de ejecutarse. Un plan cerrado queda como historial permanente.

Formato de frontmatter obligatorio:

```markdown
---
name: nombre-del-plan
status: PENDING
type: feature|bugfix|refactor|maintenance|research
domain: <dominio-del-proyecto>
created: YYYY-MM-DD HH:mm
---
```

Plantilla completa (con cuerpo obligatorio y entrada de cierre como memoria persistente): `.agents/templates/plan.md`.

Estados: `PENDING` -> `ENRICHED` -> (Orquestador revisa) -> `READY` -> `EXECUTED` -> (Revision de cierre + DoD) -> `CLOSED`.

Ningun plan pasa a `CLOSED` sin cumplir la Definition of Done (`.agents/WORKFLOW.md`) y sin su entrada de memoria. Las decisiones de arquitectura se registran aparte en `.agents/decisions/` (regla 0.12 de `.agents/RULES.md`).

Ver `.agents/PLANS.md` para ownership y `.agents/WORKFLOW.md` para el flujo y las compuertas.
