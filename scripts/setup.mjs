#!/usr/bin/env node
/**
 * setup.mjs - Instala o actualiza el harness de agentes en un repositorio.
 *
 * Comandos:
 *   install (default)  -> copia el nucleo, crea los archivos por-repo, genera la
 *                         capa de compatibilidad raiz y ejecuta autoskills.
 *   update             -> sincroniza el nucleo desde el origen registrado (o --from)
 *                         sin tocar planes, decisiones, skills ni adaptaciones locales.
 *
 * Uso (Node >= 18; autoskills requiere >= 22):
 *   node scripts/setup.mjs <repo>                      # instalar desde este repo
 *   node scripts/setup.mjs <repo> --from <ruta|url-git># instalar desde otro origen
 *   node scripts/setup.mjs <repo> update               # traer cambios del harness
 *   node scripts/setup.mjs <repo> update --from <url>  # actualizar desde otra fuente
 *   node scripts/setup.mjs <repo> --dry-run            # mostrar que haria sin escribir
 *   node scripts/setup.mjs <repo> --skip-skills        # omitir autoskills
 *   node scripts/setup.mjs <repo> --skills             # instalar skills (no solo preview)
 *   node scripts/setup.mjs <repo> --no-fill            # no tocar .agents/AGENTS.md
 *   node scripts/setup.mjs <repo> --no-compat          # no generar archivos raiz
 *   node scripts/setup.mjs                             # usa el directorio actual
 *
 * Entorno: AGENTS_SETUP_SKIP_SKILLS=1 omite autoskills (CI/tests).
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HARNESS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SKIP_SKILLS_ENV = process.env.AGENTS_SETUP_SKIP_SKILLS === '1'

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
const flags = new Set(args.filter(a => a.startsWith('--')))
const positional = args.filter(a => !a.startsWith('--'))

let cmd = 'install'
const rest = []
for (const a of positional) {
  if (a === 'install' || a === 'update') cmd = a
  else rest.push(a)
}
const TARGET = path.resolve(rest[0] || process.cwd())

const DRY_RUN = flags.has('--dry-run')
const NO_FILL = flags.has('--no-fill')
const NO_COMPAT = flags.has('--no-compat')
const SKIP_SKILLS = flags.has('--skip-skills')
const SKILLS = flags.has('--skills')
const FROM = flagValue('--from')

function flagValue(name) {
  const i = args.indexOf(name)
  if (i === -1) return null
  const v = args[i + 1]
  return v && !v.startsWith('--') ? v : null
}

if (!fs.existsSync(TARGET) || !fs.statSync(TARGET).isDirectory()) {
  console.error(`Error: el destino no existe o no es un directorio: ${TARGET}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}
function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n')
}
function sameFile(a, b) {
  if (!fs.existsSync(a) || !fs.existsSync(b)) return false
  return fs.readFileSync(a).equals(fs.readFileSync(b))
}
function gitRemote(dir) {
  const r = spawnSync('git', ['-C', dir, 'remote', 'get-url', 'origin'], { encoding: 'utf8' })
  return r.status === 0 && r.stdout.trim() ? r.stdout.trim() : null
}
function isGitUrl(s) {
  return /^(https?|git|ssh):\/\/|^git@/.test(s)
}

let cleanupDir = null
function resolveSource(from) {
  if (from) {
    if (fs.existsSync(from) && fs.statSync(from).isDirectory()) {
      return { dir: path.resolve(from), origin: path.resolve(from) }
    }
    if (isGitUrl(from)) {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-src-'))
      console.log(`  (clonando origen: ${from})`)
      const r = spawnSync('git', ['clone', '--depth', '1', '--quiet', from, tmp], {
        encoding: 'utf8',
      })
      if (r.status !== 0) {
        fs.rmSync(tmp, { recursive: true, force: true })
        console.error(`Error: no se pudo clonar ${from}`)
        if (r.stderr) console.error(r.stderr.trim())
        process.exit(1)
      }
      cleanupDir = tmp
      return { dir: tmp, origin: from }
    }
    console.error(`Error: --from debe ser un directorio local o una URL git: ${from}`)
    process.exit(1)
  }
  // Sin --from: origen local (este repo, o el paquete instalado via npx/bunx).
  // Si no hay .git (paquete), usar el defaultOrigin del manifest (URL git del harness).
  const dir = HARNESS_DIR
  const localRemote = gitRemote(dir)
  const pkgDefault = readJson(path.join(dir, '.agents', 'manifest.json'))?.defaultOrigin || null
  const origin = localRemote || pkgDefault || dir
  return { dir, origin }
}

// ---------------------------------------------------------------------------
// Sincronizacion segun el manifest
// ---------------------------------------------------------------------------
function syncCore(srcDir, targetDir, manifest, dry) {
  const changed = [],
    same = []
  for (const rel of manifest.core || []) {
    const s = path.join(srcDir, rel)
    const d = path.join(targetDir, rel)
    if (!fs.existsSync(s)) {
      console.warn(`  ! falta en el origen: ${rel}`)
      continue
    }
    if (fs.existsSync(d) && sameFile(s, d)) {
      same.push(rel)
      continue
    }
    changed.push(rel)
    if (!dry) {
      fs.mkdirSync(path.dirname(d), { recursive: true })
      fs.copyFileSync(s, d)
    }
  }
  return { changed, same }
}

function syncPerRepo(srcDir, targetDir, manifest, dry) {
  const created = [],
    kept = []
  for (const rel of manifest.perRepo || []) {
    const s = path.join(srcDir, rel)
    const d = path.join(targetDir, rel)
    if (fs.existsSync(d)) {
      kept.push(rel)
      continue
    }
    created.push(rel)
    if (!dry && fs.existsSync(s)) {
      fs.mkdirSync(path.dirname(d), { recursive: true })
      fs.copyFileSync(s, d)
    }
  }
  return { created, kept }
}

// Capa de compatibilidad raiz: archivos delgados que apuntan a .agents/.
// Se regeneran en install y update para que el harness funcione en cualquier agente
// (Codex, Copilot, Cursor, Claude Code, etc.).
function rootAgentsContent() {
  return `# AGENTS.md

> Generado automaticamente por el harness (.agents). No editar a mano: se regenera
> con \`node scripts/setup.mjs <repo> update\`. Toda la normativa vive en \`.agents/\`.

Este proyecto usa el harness generico de agentes. Punto de entrada para cualquier agente:

- Indice central y perfil del proyecto: \`.agents/AGENTS.md\`
- Flujo y compuertas: \`.agents/WORKFLOW.md\`
- Reglas operativas: \`.agents/RULES.md\`
- Convenciones de codigo: \`.agents/CODING_STANDARDS.md\`
- Arquitectura y diseno: \`.agents/DESIGN.md\`
- Planes (memoria persistente): \`.agents/plans/\`
- Decisiones de arquitectura: \`.agents/decisions/\`

Los comandos reales (build/test/dev/preview) estan listados en la seccion
"Scripts Reales Del Proyecto" de \`.agents/AGENTS.md\`.
`
}

function pointerContent(name) {
  return `# ${name}

> Archivo generado por el harness (.agents). No editar a mano: se regenera con
> \`node scripts/setup.mjs <repo> update\`.

Este proyecto usa el harness generico de agentes. Leer primero \`.agents/AGENTS.md\`
(indice central y perfil), luego \`.agents/WORKFLOW.md\` (flujo y compuertas) y
\`.agents/RULES.md\` (reglas operativas).
`
}

function syncGenerated(targetDir, dry) {
  const files = [
    ['AGENTS.md', rootAgentsContent()],
    ['CLAUDE.md', pointerContent('CLAUDE.md')],
    ['.cursorrules', pointerContent('.cursorrules')],
    ['.github/copilot-instructions.md', pointerContent('GitHub Copilot Instructions')],
  ]
  const written = []
  for (const [rel, content] of files) {
    const d = path.join(targetDir, rel)
    const same = fs.existsSync(d) && fs.readFileSync(d, 'utf8') === content
    if (same) continue
    written.push(rel)
    if (!dry) {
      fs.mkdirSync(path.dirname(d), { recursive: true })
      fs.writeFileSync(d, content)
    }
  }
  return written
}

function writeTargetManifest(targetDir, srcManifest, origin) {
  const m = { ...srcManifest, origin }
  writeJson(path.join(targetDir, '.agents', 'manifest.json'), m)
}

// ---------------------------------------------------------------------------
// Deteccion del stack + relleno del perfil
// ---------------------------------------------------------------------------
function detectStackAndFill(targetDir, dry) {
  const packageJsonPath = path.join(targetDir, 'package.json')
  let pkg = null
  if (fs.existsSync(packageJsonPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    } catch {
      pkg = null
    }
  }

  const STACK_MAP = [
    [/^vue$/, 'Vue 3 (Composition API)'],
    [/^@vue\//, 'Vue 3 (Composition API)'],
    [/^nuxt/, 'Nuxt'],
    [/^react$|^react-dom$/, 'React'],
    [/^next$/, 'Next.js'],
    [/^svelte$/, 'Svelte'],
    [/^astro$/, 'Astro'],
    [/^solid-js$/, 'SolidJS'],
    [/^tailwindcss$/, 'Tailwind CSS'],
    [/^vite$/, 'Vite'],
    [/^typescript$/, 'TypeScript'],
    [/^bun$|^bun-types$/, 'Bun'],
    [/^vitest$/, 'Vitest'],
    [/^playwright/, 'Playwright'],
    [/^jest$/, 'Jest'],
    [/^express$/, 'Express'],
    [/^fastify$/, 'Fastify'],
    [/^hono$/, 'Hono'],
    [/^@nestjs\//, 'NestJS'],
    [/^prisma$/, 'Prisma'],
    [/^drizzle-orm$/, 'Drizzle ORM'],
    [/^zod$/, 'Zod'],
    [/^supabase/, 'Supabase'],
    [/^electron$/, 'Electron'],
    [/^tauri$/, 'Tauri'],
    [/^expo$/, 'Expo'],
    [/^react-native$/, 'React Native'],
    [/^three$/, 'Three.js'],
    [/^gsap$/, 'GSAP'],
    [/^@tanstack\/query/, 'TanStack Query'],
    [/^@tanstack\/table/, 'TanStack Table'],
    [/^pino$/, 'Pino'],
  ]

  const stack = new Set()
  const scripts = []

  if (pkg) {
    const deps = Object.keys({
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
      ...(pkg.peerDependencies || {}),
    })
    for (const [re, label] of STACK_MAP) if (deps.some(d => re.test(d))) stack.add(label)
    const locks = [
      ['bun.lock', 'bun'],
      ['bun.lockb', 'bun'],
      ['pnpm-lock.yaml', 'pnpm'],
      ['yarn.lock', 'yarn'],
      ['package-lock.json', 'npm'],
    ]
    const mgr = pkg.packageManager
      ? pkg.packageManager.split('@')[0]
      : locks.find(([l]) => fs.existsSync(path.join(targetDir, l)))?.[1]
    if (mgr) stack.add(`Gestor de paquetes: ${mgr}`)
    if (pkg.engines?.node) stack.add(`Node ${pkg.engines.node}`)
    for (const [name, cmd] of Object.entries(pkg.scripts || {})) scripts.push({ name, cmd })
  } else {
    const gradleFiles = ['settings.gradle.kts', 'build.gradle.kts', 'build.gradle']
    const hasGradle = gradleFiles.some(f => fs.existsSync(path.join(targetDir, f)))
    const hasMaven = fs.existsSync(path.join(targetDir, 'pom.xml'))
    if (hasGradle || hasMaven) {
      stack.add('Java')
      stack.add(hasGradle ? 'Gradle' : 'Maven')
      for (const f of [...gradleFiles, 'pom.xml']) {
        const p = path.join(targetDir, f)
        if (!fs.existsSync(p)) continue
        const c = fs.readFileSync(p, 'utf8')
        if (/org\.springframework\.boot|spring-boot/.test(c)) stack.add('Spring Boot')
        if (/webflux|spring-boot-starter-webflux/.test(c)) stack.add('Spring WebFlux')
      }
    }
    if (fs.existsSync(path.join(targetDir, 'go.mod'))) stack.add('Go')
    if (fs.existsSync(path.join(targetDir, 'Cargo.toml'))) stack.add('Rust')
    if (
      fs.existsSync(path.join(targetDir, 'pyproject.toml')) ||
      fs.existsSync(path.join(targetDir, 'requirements.txt'))
    )
      stack.add('Python')
  }

  const SCRIPT_LABELS = {
    dev: 'Dev server',
    serve: 'Dev server',
    start: 'Start',
    preview: 'Preview',
    build: 'Build',
    'build:packages': 'Build libreria',
    'build:apps': 'Build apps',
    test: 'Tests',
    'test:ui': 'Tests UI',
    'test:debug': 'Tests debug',
    lint: 'Lint',
    typecheck: 'Typecheck',
    'type-check': 'Typecheck',
    publish: 'Publicar',
    release: 'Release',
    check: 'Checks',
  }

  const agentsPath = path.join(targetDir, '.agents', 'AGENTS.md')
  if (dry || !fs.existsSync(agentsPath)) return { stack, scripts }
  let content = fs.readFileSync(agentsPath, 'utf8')
  const today = new Date().toISOString().slice(0, 10)
  const repoName = pkg?.name || path.basename(targetDir)
  const changed = []

  const replaceOnce = (from, to, label) => {
    if (!content.includes(from)) return false
    content = content.replace(from, to)
    changed.push(label)
    return true
  }

  replaceOnce(
    'project: [NOMBRE DEL PROYECTO] - harness generico de agentes',
    `project: ${repoName} - harness generico de agentes`,
    'frontmatter (project)',
  )
  replaceOnce(
    '> [STACK] Completar por repo. Describir el proyecto, su stack real y su estructura. Ejemplo de tabla de stack:',
    `> Perfil generado automaticamente el ${today}. Verificar y completar lo que falte. Ejemplo de tabla de stack:`,
    'nota del perfil',
  )
  if (stack.size > 0) {
    replaceOnce(
      '- [Completar: lenguajes, frameworks, gestor de paquetes, herramientas de build/test]',
      [...stack].map(t => `- ${t}`).join('\n'),
      'stack detectado',
    )
  }
  if (scripts.length > 0) {
    const rows = scripts
      .slice(0, 10)
      .map(({ name, cmd }) => `| ${SCRIPT_LABELS[name] || name} | \`${cmd}\` |`)
      .join('\n')
    replaceOnce(
      `> [STACK] Listar los scripts reales de build/dev/test/preview. No inventar comandos que no existan.\n\n| Proposito | Comando |\n| --- | --- |\n| [Build] | [comando real] |\n| [Test] | [comando real] |\n| [Dev/Preview] | [comando real] |`,
      `> Scripts detectados automaticamente desde package.json el ${today}. Verificar contra el repo.\n\n| Proposito | Comando |\n| --- | --- |\n${rows}`,
      'tabla de scripts',
    )
  }

  fs.writeFileSync(agentsPath, content)
  console.log(
    changed.length
      ? `\nAGENTS.md actualizado: ${changed.join(', ')}`
      : '\nAGENTS.md ya estaba adaptado o no habia placeholders que rellenar.',
  )
  return { stack, scripts }
}

// ---------------------------------------------------------------------------
// autoskills
// ---------------------------------------------------------------------------
function runAutoskills(dir, mode) {
  const install = SKILLS
  const bin = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const cmdArgs = install ? ['--yes', 'autoskills', '-y'] : ['--yes', 'autoskills', '--dry-run']
  console.log(
    `\n==> autoskills (${install ? 'instala las skills del stack' : 'preview, no instala nada'}) en ${dir} ...\n`,
  )
  const res = spawnSync(bin, cmdArgs, {
    cwd: dir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (res.error) {
    console.error(`\nNo se pudo ejecutar autoskills: ${res.error.message}`)
    console.error(
      'Asegurate de tener Node >= 22 y ejecuta manualmente: cd <repo> && npx autoskills',
    )
  } else if (res.status !== 0) {
    console.error(
      `\nautoskills termino con codigo ${res.status}. Revisar el error e intentar manualmente: cd <repo> && npx autoskills`,
    )
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const targetManifest = readJson(path.join(TARGET, '.agents', 'manifest.json'))

// Resolver el origen: --from gana; en update se usa el origen registrado.
let from = FROM
if (cmd === 'update' && !from && targetManifest?.origin) from = targetManifest.origin

console.log(`\n==> Harness ${cmd} en: ${TARGET}`)
if (DRY_RUN) console.log('    (--dry-run: solo muestro lo que haria, no escribo nada)')

const src = resolveSource(from)
try {
  const srcManifest = readJson(path.join(src.dir, '.agents', 'manifest.json'))
  if (!srcManifest) {
    console.error(`Error: el origen ${src.dir} no tiene .agents/manifest.json (no es el harness).`)
    process.exit(1)
  }

  const oldVer = targetManifest?.version || null
  const newVer = srcManifest.version || '?'
  console.log(`    Origen: ${src.origin}`)
  console.log(
    oldVer && oldVer !== newVer ? `    Version: ${oldVer} -> ${newVer}` : `    Version: ${newVer}`,
  )

  const core = syncCore(src.dir, TARGET, srcManifest, DRY_RUN)
  const per = syncPerRepo(src.dir, TARGET, srcManifest, DRY_RUN)
  const generated = NO_COMPAT ? [] : syncGenerated(TARGET, DRY_RUN)

  if (!DRY_RUN) writeTargetManifest(TARGET, srcManifest, src.origin)

  const { stack } = detectStackAndFill(TARGET, DRY_RUN || NO_FILL)

  // autoskills: install -> preview (o --skills); update -> solo con --skills.
  let skillsSkipped = ''
  if (DRY_RUN) {
    skillsSkipped = ' (omitido por --dry-run)'
  } else if (SKIP_SKILLS_ENV || SKIP_SKILLS) {
    skillsSkipped = ' (omitido por flag/env)'
  } else if (cmd === 'update' && !SKILLS) {
    skillsSkipped = ' (update: no se reinstalan skills; usar --skills)'
  } else {
    runAutoskills(TARGET, cmd)
  }
  if (skillsSkipped) console.log(`\n==> autoskills ${skillsSkipped.trim()}`)

  console.log('\n==> Resumen')
  console.log(`    Nucleo: ${core.changed.length} actualizados, ${core.same.length} sin cambios`)
  for (const f of core.changed) console.log(`      + ${f}`)
  console.log(`    Por repo: ${per.created.length} creados, ${per.kept.length} conservados`)
  if (!NO_COMPAT)
    console.log(
      `    Compat raiz: ${generated.length} generados${generated.length ? ' (' + generated.join(', ') + ')' : ''}`,
    )
  console.log(
    '    Preservado siempre: .agents/plans/, .agents/decisions/, .agents/skills/ y todo archivo no listado en el manifest.',
  )
  console.log(
    `    Stack detectado: ${stack.size ? [...stack].join(', ') : '(sin deteccion, completar a mano)'}`,
  )
  if (cmd === 'update') {
    console.log(
      '\nActualizacion lista. El nucleo quedo en sync con el origen; tus planes, decisiones, skills y adaptaciones locales no se tocaron.',
    )
  } else {
    console.log('\nListo. Para traer cambios del harness mas adelante:')
    console.log(`  node scripts/setup.mjs ${TARGET} update`)
    console.log('Para verificar la integridad:')
    console.log(`  node scripts/verify.mjs ${TARGET}`)
  }
} finally {
  if (cleanupDir) fs.rmSync(cleanupDir, { recursive: true, force: true })
}
