# Ownership De Planes

`.agents/plans/` es la unica ubicacion de planes del proyecto. Todos los planes pertenecen a este repositorio y se rigen por `.agents/WORKFLOW.md`.

## Los Planes Son La Memoria Persistente Del Proyecto

- `.agents/plans/` es la unica memoria persistente del proyecto: registra decisiones, contexto, progreso y resultado de cada cambio.
- El workflow siempre debe completarse: un plan no se abandona ni se descarta. Si deja de ser viable, se cierra (`CLOSED`) documentando el motivo.
- NUNCA eliminar planes: no borrar el archivo, no vaciar su contenido y no archivarlo fuera del repo. Un plan cerrado queda como historial permanente.
- Todo cambio o modificacion del proyecto (codigo, configuracion, estructura, reglas) debe quedar documentado en un plan ANTES de ejecutarse: primero se crea/actualiza el plan y recien despues se ejecuta con la compuerta "ejecuta el plan".
- Si un cambio ya tiene plan, ninguna modificacion se ejecuta por fuera de ese plan ni de sus compuertas.

## Formato

- Los planes nuevos deben declarar en su frontmatter el dominio y las reglas que los gobiernan:

```yaml
domain: <dominio-del-proyecto>
owner_rules: .agents
```

- Al crear un plan, revisar primero `.agents/plans/` para no duplicar planes existentes.
- No se eliminan copias historicas sin inventariar referencias y aprobacion explicita.
- Las compuertas y estados siguen `.agents/WORKFLOW.md`:

`PENDING` -> `ENRICHED` -> (Orquestador revisa) -> `READY` -> `EXECUTED` -> `CLOSED`

- Las transiciones solo se autorizan con las frases explicitas **"enriquece el plan"** y **"ejecuta el plan"**.
