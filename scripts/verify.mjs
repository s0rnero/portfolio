#!/usr/bin/env node
/**
 * verify.mjs - Health check del harness instalado en un repositorio.
 *
 * Valida:
 *   - manifest.json presente y con version/origen
 *   - archivos del nucleo (core) presentes
 *   - archivos por-repo presentes (aviso si faltan: hay que adaptarlos)
 *   - planes: frontmatter valido, status en el lifecycle, fecha created
 *   - decisiones (ADR): frontmatter y status valido
 *   - capa de compatibilidad raiz generada
 *   - skills instaladas (skills-lock.json)
 *
 * Uso:
 *   node scripts/verify.mjs <repo>    # exit 0 si no hay errores, 1 si los hay
 *   node scripts/verify.mjs           # usa el directorio actual
 */
import fs from 'node:fs'
import path from 'node:path'

const target = path.resolve(process.argv[2] || process.cwd())
const agentsDir = path.join(target, '.agents')
const errors = []
const warnings = []
const infos = []

function parseFrontmatter(p) {
  const c = fs.readFileSync(p, 'utf8')
  const m = c.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return null
  const out = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i === -1) continue
    const k = line.slice(0, i).trim()
    const v = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (k) out[k] = v
  }
  return out
}

// ---------------------------------------------------------------------------
const manifestPath = path.join(agentsDir, 'manifest.json')
let manifest = null
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
} catch {
  manifest = null
}

if (!manifest) {
  errors.push('No hay harness instalado: falta .agents/manifest.json (correr scripts/setup.mjs)')
} else {
  infos.push(`Harness: ${manifest.name || '?'} v${manifest.version || '?'}`)
  if (manifest.origin) infos.push(`Origen: ${manifest.origin}`)

  for (const rel of manifest.core || []) {
    if (!fs.existsSync(path.join(target, rel))) errors.push(`Nucleo faltante: ${rel}`)
  }
  for (const rel of manifest.perRepo || []) {
    if (!fs.existsSync(path.join(target, rel)))
      warnings.push(`Por-repo faltante (crear/adaptar): ${rel}`)
  }

  const ALLOWED = ['PENDING', 'ENRICHED', 'READY', 'EXECUTED', 'CLOSED']
  const plansDir = path.join(agentsDir, 'plans')
  if (fs.existsSync(plansDir)) {
    const plans = fs.readdirSync(plansDir).filter(f => f.endsWith('.md') && f !== 'README.md')
    if (plans.length === 0) infos.push('Planes: sin planes creados todavia')
    for (const f of plans) {
      const fm = parseFrontmatter(path.join(plansDir, f))
      if (!fm) {
        errors.push(`Plan sin frontmatter valido: plans/${f}`)
        continue
      }
      if (!fm.name) warnings.push(`Plan sin name: plans/${f}`)
      if (!fm.status) errors.push(`Plan sin status: plans/${f}`)
      else if (!ALLOWED.includes(fm.status))
        errors.push(`Plan con status invalido (${fm.status}): plans/${f}`)
      if (fm.created && !/^\d{4}-\d{2}-\d{2}/.test(fm.created))
        warnings.push(`Plan con created invalido: plans/${f}`)
    }
  } else {
    warnings.push('Directorio .agents/plans/ ausente')
  }

  const decisionsDir = path.join(agentsDir, 'decisions')
  if (fs.existsSync(decisionsDir)) {
    for (const f of fs.readdirSync(decisionsDir)) {
      if (!f.endsWith('.md') || f === 'README.md') continue
      const fm = parseFrontmatter(path.join(decisionsDir, f))
      if (!fm) {
        warnings.push(`ADR sin frontmatter valido: decisions/${f}`)
        continue
      }
      if (fm.status && !['proposed', 'accepted', 'superseded'].includes(fm.status)) {
        warnings.push(`ADR con status invalido (${fm.status}): decisions/${f}`)
      }
    }
  } else {
    warnings.push('Directorio .agents/decisions/ ausente (opcional)')
  }

  for (const rel of manifest.generated || []) {
    if (!fs.existsSync(path.join(target, rel)))
      warnings.push(`Compat raiz faltante: ${rel} (regenerar con setup update)`)
  }

  const lock = path.join(agentsDir, 'skills', 'skills-lock.json')
  if (fs.existsSync(lock)) infos.push('Skills: instaladas (skills-lock.json presente)')
  else infos.push('Skills: sin skills-lock.json (correr npx autoskills -y)')
}

// ---------------------------------------------------------------------------
console.log(`\n==> Verify harness en: ${target}\n`)
for (const i of infos) console.log(`  [info]  ${i}`)
for (const w of warnings) console.log(`  [warn]  ${w}`)
for (const e of errors) console.log(`  [error] ${e}`)
console.log(`\n  ${errors.length} errores, ${warnings.length} advertencias, ${infos.length} infos`)
process.exit(errors.length ? 1 : 0)
