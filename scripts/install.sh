#!/usr/bin/env bash
#
# Instala o sincroniza el harness .agents en un repositorio destino.
#
# Prefiere scripts/setup.mjs (Node >= 18) que hace todo: nucleo + perfil + capa
# de compatibilidad raiz + autoskills. Sin Node, usa una copia bash basica.
#
# Uso:
#   bash scripts/install.sh <repo-destino> [--skills] [--dry-run]
#
# Nota: para actualizar un repo ya instalado (traer cambios del harness) usar:
#   node scripts/setup.mjs <repo> update
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Preferir setup.mjs cuando hay Node >= 18.
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  if [[ "$NODE_MAJOR" -ge 18 ]]; then
    exec node "$HARNESS_DIR/scripts/setup.mjs" install "$@"
  fi
fi

# -----------------------------------------------------------------------------
# Fallback bash (sin Node >= 18): copia basica del nucleo + per-repo.
# -----------------------------------------------------------------------------
TARGET=""
RUN_SKILLS=0
AUTOSKILLS_FLAGS="--dry-run"

for arg in "$@"; do
  case "$arg" in
    --skills) RUN_SKILLS=1 ;;
    --dry-run) AUTOSKILLS_FLAGS="--dry-run" ;;
    *) TARGET="$arg" ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo "Uso: bash scripts/install.sh <repo-destino> [--skills] [--dry-run]"
  exit 1
fi
if [[ ! -d "$TARGET" ]]; then
  echo "Error: el destino no existe: $TARGET"
  exit 1
fi

CORE="$HARNESS_DIR/.agents"
TARGET_AGENTS="$TARGET/.agents"
mkdir -p "$TARGET_AGENTS/orchestrator" \
         "$TARGET_AGENTS/subagents" \
         "$TARGET_AGENTS/skills" \
         "$TARGET_AGENTS/plans" \
         "$TARGET_AGENTS/decisions" \
         "$TARGET_AGENTS/templates" \
         "$TARGET_AGENTS/bootstrap"

echo ""
echo "==> Instalando harness (fallback bash, sin Node) en: $TARGET"
echo ""

# Nucleo: se sobrescribe siempre.
for f in AGENTS.md WORKFLOW.md RULES.md PLANS.md; do
  cp "$CORE/$f" "$TARGET_AGENTS/$f"
  echo "Copiado: .agents/$f"
done
cp "$CORE/orchestrator/instructions.md" "$TARGET_AGENTS/orchestrator/instructions.md"
echo "Copiado: .agents/orchestrator/instructions.md"
for f in enrichment-process.md executor.md reviewer.md; do
  cp "$CORE/subagents/$f" "$TARGET_AGENTS/subagents/$f"
  echo "Copiado: .agents/subagents/$f"
done
cp "$CORE/skills/README.md" "$TARGET_AGENTS/skills/README.md"
echo "Copiado: .agents/skills/README.md"
cp "$CORE/plans/README.md" "$TARGET_AGENTS/plans/README.md"
echo "Copiado: .agents/plans/README.md"
cp "$CORE/decisions/README.md" "$TARGET_AGENTS/decisions/README.md"
echo "Copiado: .agents/decisions/README.md"
cp "$CORE/bootstrap/INSTALL.md" "$TARGET_AGENTS/bootstrap/INSTALL.md"
echo "Copiado: .agents/bootstrap/INSTALL.md"
for f in plan.md adr.md; do
  cp "$CORE/templates/$f" "$TARGET_AGENTS/templates/$f"
  echo "Copiado: .agents/templates/$f"
done
cp "$CORE/manifest.json" "$TARGET_AGENTS/manifest.json"
echo "Copiado: .agents/manifest.json"
mkdir -p "$TARGET/scripts"
cp "$HARNESS_DIR/scripts/setup.mjs" "$TARGET/scripts/setup.mjs"
cp "$HARNESS_DIR/scripts/verify.mjs" "$TARGET/scripts/verify.mjs"
echo "Copiado: scripts/setup.mjs, scripts/verify.mjs"

# Por-repo: solo si no existen (no pisar adaptaciones locales).
for f in CODING_STANDARDS.md DESIGN.md; do
  if [[ -f "$TARGET_AGENTS/$f" ]]; then
    echo "Conservado (ya existe, no se pisa): .agents/$f"
  else
    cp "$CORE/$f" "$TARGET_AGENTS/$f"
    echo "Creado (adaptar al stack): .agents/$f"
  fi
done

echo ""
echo "Harness instalado en: $TARGET_AGENTS"
echo "Pendiente por el usuario:"
echo "  - Completar .agents/AGENTS.md (Perfil del proyecto: stack, estructura, scripts reales)"
echo "  - Adaptar .agents/CODING_STANDARDS.md y .agents/DESIGN.md al stack"
echo "  - Nota: la capa de compatibilidad raiz (AGENTS.md, CLAUDE.md, .cursorrules) y el"
echo "    relleno automatico del perfil requieren Node >= 18: correr 'node scripts/setup.mjs'"

# autoskills: preview por defecto (read-only); instala solo con --skills.
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  if [[ "$NODE_MAJOR" -lt 22 ]]; then
    echo ""
    echo "Advertencia: autoskills requiere Node >= 22 (actual: $(node -v))."
    exit 0
  fi
  echo ""
  if [[ "$RUN_SKILLS" -eq 1 ]]; then
    echo "Ejecutando autoskills en $TARGET ..."
    (cd "$TARGET" && npx --yes autoskills -y)
  else
    echo "Preview de autoskills (no instala nada):"
    (cd "$TARGET" && npx --yes autoskills "$AUTOSKILLS_FLAGS")
    echo ""
    echo "Para instalar las skills detectadas:"
    echo "  cd $TARGET && npx autoskills -y"
  fi
else
  echo ""
  echo "Node no encontrado: saltando autoskills."
fi
