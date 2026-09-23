# Skills registradas

Las skills son referencias subordinadas a `.agents/WORKFLOW.md`, `.agents/RULES.md` y `.agents/CODING_STANDARDS.md`. Una skill nunca prevalece sobre el estandar local del repo.

## Dependencia principal: autoskills

**autoskills** (`midudev/autoskills`) escanea el repositorio, detecta el stack real y resuelve automaticamente las mejores skills del registro auditado. Es la via principal para que cada repo tenga las skills correctas sin configuracion manual.

| Aspecto | Detalle |
| --- | --- |
| Comando | `npx autoskills` (en la raiz del repo) |
| Requisito | Node >= 22 |
| Deteccion | Escanea `package.json`, archivos Gradle y configs para detectar tecnologias |
| Preview sin instalar | `npx autoskills --dry-run` |
| Saltar confirmacion | `npx autoskills -y` |
| Destino | `.agents/skills/` (fallback universal) o `.claude/skills/` (si se detecta Claude Code). En este harness el layout canonico es `.agents/skills/` |
| Registro | Instala solo skills del registro curado por los maintainers; verifica cada archivo contra un manifest con SHA-256 |
| Lockfile | Escribe `skills-lock.json` en la raiz del repo con la fuente instalada y el hash del bundle |

### Flujo recomendado

1. `npx autoskills --dry-run` para revisar que skills detecta para el stack del repo.
2. `npx autoskills -y` para instalar.
3. Verificar `skills-lock.json` y listar las skills en la tabla de abajo (fuente y fecha).
4. Validar en cada tarea que la skill es compatible con el stack real y el estandar local.

### Reglas de uso

- Los ejemplos genericos de las skills (npm/npx/pnpm/yarn, frameworks de otras versiones) se adaptan siempre al baseline declarado en `.agents/AGENTS.md` y a las convenciones de `.agents/CODING_STANDARDS.md`.
- Si una skill contradice `.agents/RULES.md`, `.agents/CODING_STANDARDS.md` o `.agents/DESIGN.md`, prevalece el estandar local.
- No instalar skills que asuman stacks, versiones o herramientas que no existen en el repo.

## Adiciones manuales (opcional)

Skills no cubiertas por el registro de autoskills se agregan con el CLI oficial de skills (`skills.sh` / `npx skills`):

1. `npx skills find <query>`
2. `npx skills add <owner/repo> --list`
3. Leer `SKILL.md` y scripts.
4. Auditar comandos, red, filesystem y secretos.
5. Pedir aprobacion antes de instalar.
6. Registrar fuente y fecha.

## Skills registradas

| Skill | Fuente | Uso | Fecha |
| --- | --- | --- | --- |
| [generadas por autoskills segun el stack del repo] | [registro autoskills] | [stack detectado] | [fecha] |
| [skills manuales] | [owner/repo] | [uso] | [fecha] |

## Proceso de incorporacion

1. `npx autoskills --dry-run` (o `npx skills find <query>` para busquedas manuales).
2. Revisar la lista detectada contra el stack real del repo.
3. Instalar con `npx autoskills -y` (o `npx skills add <owner/repo> --list` para manuales).
4. Leer `SKILL.md` y auditar scripts (comandos, red, filesystem, secretos).
5. Pedir aprobacion del usuario antes de instalar.
6. Registrar fuente y fecha en la tabla.
