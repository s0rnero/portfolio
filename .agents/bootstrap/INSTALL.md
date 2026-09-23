# Instalacion Del Harness En Un Repositorio

Este harness permite arrancar el mismo workflow de agentes en cualquier repositorio sin copiar/pegar ni clonar. El nucleo (workflow, roles, compuertas, ciclo de planes, skills, DoD) es identico en todos los repos; lo que se adapta por repo es el perfil, los standards y el diseno.

## Requisitos

- **Node >= 18** para `scripts/setup.mjs` (autoskills requiere >= 22).
- Git para instalar desde una URL remota.

## Instalar con un comando corto (npx/bunx)

El harness tambien es un paquete npm con binario. Cuando este publicado:

```bash
npx agents-setup-sorno ../nombre-del-repo
bunx agents-setup-sorno ../nombre-del-repo
```

Antes de publicarlo, se puede activar el comando localmente (una sola vez, desde este repo):

```bash
npm link     # luego 'agents-setup-sorno <repo>' funciona desde cualquier carpeta
# o con bun:
bun link
```

Sin publicar ni linkear, se usa el script directo del repo:

```bash
node scripts/setup.mjs ../nombre-del-repo
```

Todas las opciones son las mismas en cualquier via de ejecucion (ver abajo).

## Instalar

Desde este repositorio (la fuente del harness):

```bash
node scripts/setup.mjs ../nombre-del-repo
```

Desde otro origen (una URL git del harness, o una copia local):

```bash
node scripts/setup.mjs ../nombre-del-repo --from https://github.com/<usuario>/<repo-harness>.git
node scripts/setup.mjs ../nombre-del-repo --from /ruta/al/harness
```

Opciones utiles:

```bash
node scripts/setup.mjs ../repo --dry-run     # muestra que haria, no escribe nada
node scripts/setup.mjs ../repo --skip-skills # no ejecuta autoskills
node scripts/setup.mjs ../repo --skills      # instala skills (por defecto solo preview)
node scripts/setup.mjs ../repo --no-fill     # no toca .agents/AGENTS.md
node scripts/setup.mjs ../repo --no-compat   # no genera la capa raiz de compatibilidad
```

Lo que hace `install`:

1. Copia el **nucleo** del harness a `.agents/` (workflow, reglas, roles, subagentes, plantillas, manifest, scripts).
2. Crea los archivos **por-repo** solo si no existen: `AGENTS.md`, `CODING_STANDARDS.md`, `DESIGN.md`.
3. **Rellena el perfil** en `AGENTS.md`: stack detectado (`package.json`, Gradle/Maven, Go, Rust, Python) y tabla de scripts reales.
4. Genera la **capa de compatibilidad raiz**: `AGENTS.md`, `CLAUDE.md`, `.cursorrules` y `.github/copilot-instructions.md` (archivos delgados que apuntan a `.agents/`), para que el harness funcione con Codex, Copilot, Cursor, Claude Code, etc.
5. Ejecuta `npx autoskills` (preview por defecto; `--skills` para instalar) y registra el **origen** en `.agents/manifest.json`.

## Actualizar (traer cambios del harness)

Como la instalacion registra el origen, traer las novedades del harness es un comando:

```bash
node scripts/setup.mjs ../nombre-del-repo update              # usa el origen registrado
node scripts/setup.mjs ../nombre-del-repo update --from <url> # actualizar desde otra fuente
```

Lo que hace `update`:

- Compara versiones (`.agents/manifest.json`) y reporta el delta.
- Sobrescribe solo el **nucleo** (workflow, reglas, roles, subagentes, plantillas, scripts).
- Crea los archivos por-repo solo si faltan; **nunca pisa** `AGENTS.md`, `CODING_STANDARDS.md` ni `DESIGN.md` ya adaptados.
- Regenera la capa raiz de compatibilidad.
- **Nunca toca**: `.agents/plans/`, `.agents/decisions/`, `.agents/skills/` (incluido `skills-lock.json`) ni ningún archivo que no este listado en el manifest.
- No reinstala skills salvo `--skills`.

### Que se sobrescribe y que se preserva

| Tipo | Archivos | Comportamiento |
| --- | --- | --- |
| Nucleo | `.agents/WORKFLOW.md`, `RULES.md`, `PLANS.md`, `plans/README.md`, `orchestrator/`, `subagents/`, `skills/README.md`, `bootstrap/INSTALL.md`, `decisions/README.md`, `templates/`, `manifest.json`, `scripts/setup.mjs`, `scripts/verify.mjs`, `scripts/install.sh` | Se sobrescriben en cada install/update |
| Por repo | `.agents/AGENTS.md`, `CODING_STANDARDS.md`, `DESIGN.md` | Se crean solo si faltan; nunca se pisan |
| Generados | raiz: `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` | Se regeneran en install/update |
| Preservados | `.agents/plans/`, `.agents/decisions/`, `.agents/skills/`, y todo archivo no listado en el manifest | Nunca se tocan |

## Verificar la instalacion

```bash
node scripts/verify.mjs ../nombre-del-repo   # health check del harness
node scripts/verify.mjs                      # directorio actual
```

Valida manifest y version, nucleo presente, planes con frontmatter/status validos, ADRs, capa de compatibilidad y skills. Exit 0 si no hay errores.

## Instalacion ligera

`scripts/install.sh` es un wrapper que usa `setup.mjs` cuando hay Node; sin Node hace una copia bash basica del nucleo (sin perfil ni capa de compatibilidad raiz).

```bash
bash scripts/install.sh ../nombre-del-repo          # copia nucleo + preview de autoskills
bash scripts/install.sh ../nombre-del-repo --skills # ademas instala las skills detectadas
```

## Checklist De Adaptacion Por Repo

1. **`.agents/AGENTS.md`** — revisar la seccion "Perfil Del Proyecto" (con setup.mjs ya queda rellenada): stack real, estructura del repo y scripts reales de build/dev/test/preview.
2. **`.agents/CODING_STANDARDS.md`** — adaptar al stack: estructura de archivos, naming, contratos, testing.
3. **`.agents/DESIGN.md`** — adaptar al stack: arquitectura por capas, contratos, rendimiento, seguridad.
4. **Skills** — revisar el preview de autoskills, ejecutar `npx autoskills -y` y registrar las skills en `.agents/skills/README.md`.
5. `node scripts/verify.mjs <repo>` para confirmar que el harness quedo sano.
6. Commit inicial del harness en el repo destino.

## Reglas Del Harness

- El flujo, las compuertas, el DoD y el ciclo de planes son los mismos en todos los repos (ver `.agents/WORKFLOW.md`).
- Los planes son la memoria persistente del proyecto: nunca se eliminan y todo cambio se documenta en el plan antes de ejecutarse (ver `.agents/PLANS.md`).
- Las decisiones de arquitectura se registran como ADR en `.agents/decisions/` (ver `.agents/RULES.md` 0.12).
- Ninguna skill prevalece sobre `.agents/RULES.md`, `.agents/CODING_STANDARDS.md` ni `.agents/DESIGN.md`.
