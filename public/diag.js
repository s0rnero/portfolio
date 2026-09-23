/**
 * Diagnóstico de rendimiento en dispositivo real.
 *
 * Se carga solo cuando la URL trae `?perf=1` (ver index.html). No depende del
 * bundle ni de Vue: funciona aunque la aplicación no llegue a montar, que es
 * justo el caso que hay que poder distinguir de "va lento".
 *
 * Qué responde:
 *   1. Si el navegador soporta lo que usa el sitio (Tailwind v4 exige Safari
 *      16.4 y un iPhone 6s se queda en iOS 15.8).
 *   2. Cuántos FPS da de verdad, medidos sobre requestAnimationFrame.
 *   3. Qué capa se come el presupuesto: cada interruptor apaga una y se vuelve
 *      a medir.
 *
 * Nativo y sin dependencias a propósito: en `public/` no pasa por el bundler,
 * así que tiene que ser JS que el propio móvil entienda tal cual.
 *
 * Lección del iPhone 6s (iOS 15): si el panel repinta su DOM con `innerHTML`
 * cada 400 ms, el `tap` de iOS cae a menudo en un nodo que acaba de ser
 * sustituido y el click no llega a nadie: los botones "no hacen nada". Por eso
 * aquí el DOM se construye **una vez** y el refresco solo toca `textContent` de
 * los valores vivos; los botones nacen y mueren con el panel.
 */
;(function () {
  'use strict'

  var params = new URLSearchParams(window.location.search)
  if (!params.has('perf')) return

  // ---------------------------------------------------------------- errores ---
  // Se instala antes que nada: si el bundle no parsea, el panel lo dice en vez
  // de quedarse en negro sin explicación.
  var errors = []
  var collectReport = null

  function pushError(message) {
    if (errors.length < 30) errors.push(message)
    scheduleSync()
  }

  window.addEventListener(
    'error',
    function (event) {
      var where = event.filename ? ' @ ' + event.filename.split('/').pop() + ':' + event.lineno : ''
      pushError('error: ' + (event.message || event.type) + where)
    },
    true,
  )

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason
    pushError('rejection: ' + (reason && reason.message ? reason.message : String(reason)))
  })

  // ------------------------------------------------------------- capacidades ---
  function supports(prop, value) {
    try {
      if (!window.CSS) return false
      // Una sola cadena es una condición de @supports; con valor, es prop+valor.
      return value === undefined ? CSS.supports(prop) : CSS.supports(prop, value)
    } catch (err) {
      return false
    }
  }

  function hasContext(name) {
    // Cada canvas admite un solo tipo de contexto: hay que usar uno nuevo por prueba.
    // Tras sondear se LIBERA el contexto al instante: en iOS los contextos
    // abandonados viven hasta el garbage collector y cuentan para el tope duro
    // de contextos por pagina (mataria el del fondo del terminal).
    try {
      var canvas = document.createElement('canvas')
      var gl = canvas.getContext(name)
      if (!gl) return false
      var lose = gl.getExtension('WEBGL_lose_context')
      if (lose) lose.loseContext()
      return true
    } catch (err) {
      return false
    }
  }

  function detectIos() {
    var match = /OS (\d+)[._](\d+)/.exec(navigator.userAgent)
    return match ? match[1] + '.' + match[2] : ''
  }

  var capsCache = null

  function capabilities() {
    // Se sondea UNA vez y se cachea. Cada llamada a hasContext('webgl*') crea un
    // contexto WebGL nuevo, e iOS Safari tiene un tope duro de contextos vivos
    // por pagina: al repetir el sondeo en cada refresco del panel mataba el
    // contexto mas antiguo, que es justamente el canvas del fondo del terminal.
    if (capsCache) return capsCache
    capsCache = [
      ['@property (Tailwind v4 lo exige)', 'registerProperty' in window.CSS],
      ['oklch()', supports('color', 'oklch(0 0 0)')],
      [':has()', supports('selector(:has(a))')],
      ['backdrop-filter', supports('backdrop-filter', 'blur(1px)')],
      ['ResizeObserver', 'ResizeObserver' in window],
      ['structuredClone', typeof window.structuredClone === 'function'],
      [
        'DecompressionStream (precarga del juego)',
        typeof window.DecompressionStream === 'function',
      ],
      ['WebGL2', hasContext('webgl2')],
      ['WebGL1', hasContext('webgl')],
    ]
    return capsCache
  }

  // ------------------------------------------------------------------- FPS ---
  var frameTimes = []
  var lastFrame = performance.now()
  var badFrames = 0
  // Acumulador de la muestra en curso. No se puede recortar `frameTimes` (es un
  // buffer circular): al principio contaba frames de una ventana ya solapada y
  // las muestras salian a 0,0 fps.
  var bucket = null

  function tick(now) {
    var delta = now - lastFrame
    lastFrame = now
    frameTimes.push(delta)
    if (frameTimes.length > 300) frameTimes.shift()
    if (delta > 33.4) badFrames += 1
    if (bucket) {
      bucket.count += 1
      bucket.total += delta
      bucket.slow += delta > 33.4 ? 1 : 0
      if (delta > bucket.worst) bucket.worst = delta
    }
    requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)

  function fpsWindow(count) {
    var slice = frameTimes.slice(-count)
    if (!slice.length) return { fps: 0, worst: 0, slow: 0 }
    var total = 0
    var worst = 0
    var slow = 0
    for (var i = 0; i < slice.length; i += 1) {
      total += slice[i]
      if (slice[i] > worst) worst = slice[i]
      if (slice[i] > 33.4) slow += 1
    }
    return { fps: 1000 / (total / slice.length), worst: worst, slow: slow }
  }

  // -------------------------------------------------------- interruptores ---
  var style = document.createElement('style')
  style.textContent = [
    'html.diag-no-blur * { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }',
    'html.diag-no-anim * { animation: none !important; }',
    'html.diag-no-blend * { mix-blend-mode: normal !important; }',
    'html.diag-no-shadow * { box-shadow: none !important; text-shadow: none !important; }',
  ].join('\n')
  document.head.appendChild(style)

  var targets = []

  function canvases() {
    return Array.prototype.slice.call(document.querySelectorAll('canvas'))
  }

  function shrinkOnly(index) {
    targets.forEach(function (canvas) {
      canvas.width = Number(canvas.dataset.diagWidth || canvas.width)
      canvas.height = Number(canvas.dataset.diagHeight || canvas.height)
    })
    var all = canvases()
    var canvas = all[index]
    if (!canvas) return
    canvas.dataset.diagWidth = String(canvas.width)
    canvas.dataset.diagHeight = String(canvas.height)
    canvas.width = 1
    canvas.height = 1
    targets = [canvas]
  }

  function restoreCanvases() {
    targets.forEach(function (canvas) {
      canvas.width = Number(canvas.dataset.diagWidth || canvas.width)
      canvas.height = Number(canvas.dataset.diagHeight || canvas.height)
    })
    targets = []
  }

  function toggleClass(name, button) {
    var on = document.documentElement.classList.toggle(name)
    button.dataset.on = on ? 'si' : 'no'
  }

  /** Manda un ajuste de calidad a la aplicación (la escucha `vc-quality`). */
  function sendQuality(detail) {
    window.dispatchEvent(new CustomEvent('vc-quality', { detail: detail }))
  }

  // ----------------------------------------------------------------- panel ---
  var mountTime = 0
  var root = document.createElement('div')
  root.id = 'diag-panel'
  root.setAttribute(
    'style',
    [
      'position:fixed',
      'left:0',
      'bottom:0',
      'z-index:2147483647',
      'max-height:52vh',
      'overflow:auto',
      'width:100%',
      'max-width:26rem',
      'box-sizing:border-box',
      'background:rgba(0,0,0,.92)',
      'color:#b7f0c2',
      'font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace',
      'padding:8px 10px',
      'border-top:1px solid #2f6b3c',
      'border-right:1px solid #2f6b3c',
      '-webkit-user-select:text',
      'user-select:text',
    ].join(';'),
  )

  function button(label, action) {
    var b = document.createElement('button')
    b.dataset.action = action
    b.textContent = label
    b.setAttribute(
      'style',
      'margin:2px 4px 2px 0;padding:5px 8px;background:#16301d;color:#b7f0c2;' +
        'border:1px solid #2f6b3c;border-radius:4px;font:inherit',
    )
    return b
  }

  function sectionTitle(text) {
    var el = document.createElement('div')
    el.textContent = text
    el.setAttribute('style', 'color:#fff;margin-top:6px;font-weight:bold')
    return el
  }

  function row(label) {
    var line = document.createElement('div')
    line.setAttribute('style', 'display:flex;gap:6px')
    var name = document.createElement('span')
    name.textContent = label
    name.setAttribute('style', 'flex:0 0 11rem;color:#7ec8a0')
    var value = document.createElement('span')
    value.setAttribute('style', 'flex:1;word-break:break-word')
    line.appendChild(name)
    line.appendChild(value)
    return { line: line, value: value }
  }

  /**
   * DOM estático: se construye una vez y los botones no vuelven a crearse
   * nunca. Solo los valores vivos cambian, y por `textContent`.
   */
  var live = {
    ios: row('iOS'),
    screen: row('Pantalla'),
    pointer: row('Puntero fino'),
    cores: row('Núcleos / memoria'),
    mounted: row('Vue montado'),
    canvas: row('Canvas WebGL'),
    fps: row('FPS'),
    worst: row('Peor frame'),
    slow: row('Frames lentos (>33 ms)'),
    samples: row('Muestras'),
    mode: row('Modo aplicado'),
    scale: row('Escala terminal'),
    fpsCap: row('Límite fps terminal'),
  }
  var samplesBox = null
  var errorsBox = null

  function buildPanel() {
    var add = function (el) {
      root.appendChild(el)
    }
    var addRow = function (r) {
      add(r.line)
    }

    var title = document.createElement('div')
    title.textContent = 'DIAGNÓSTICO · ?perf=1'
    title.setAttribute('style', 'color:#fff;font-weight:bold')
    add(title)
    ;[live.ios, live.screen, live.pointer, live.cores, live.mounted, live.canvas].forEach(addRow)

    add(sectionTitle('FPS (últimos 60 frames)'))
    ;[live.fps, live.worst, live.slow, live.samples].forEach(addRow)

    add(sectionTitle('Modo de calidad (aplicación)'))
    var modeButtons = document.createElement('div')
    modeButtons.appendChild(button('modo ligero', 'lite'))
    modeButtons.appendChild(button('modo completo', 'full'))
    add(modeButtons)
    addRow(live.mode)

    add(sectionTitle('A/B del terminal (en caliente)'))
    var abButtons = document.createElement('div')
    abButtons.appendChild(button('escala 1', 'scale1'))
    abButtons.appendChild(button('escala 0.75', 'scale75'))
    abButtons.appendChild(button('escala 0.5', 'scale50'))
    abButtons.appendChild(button('escala 0.25', 'scale25'))
    abButtons.appendChild(button('sin límite fps', 'fpsfree'))
    abButtons.appendChild(button('30 fps', 'fps30'))
    add(abButtons)
    addRow(live.scale)
    addRow(live.fpsCap)

    add(sectionTitle('Medir 5 s'))
    var measureButtons = document.createElement('div')
    measureButtons.appendChild(button('medir ahora', 'measure'))
    measureButtons.appendChild(button('copiar informe', 'copy'))
    measureButtons.appendChild(button('limpiar muestras', 'clear'))
    add(measureButtons)

    add(sectionTitle('A/B por capa (canvas/CSS)'))
    var layerButtons = document.createElement('div')
    layerButtons.appendChild(button('canvas 1 (TV) a 1px', 'canvas0'))
    layerButtons.appendChild(button('canvas 2 (terminal) a 1px', 'canvas1'))
    layerButtons.appendChild(button('canvas 3 a 1px', 'canvas2'))
    layerButtons.appendChild(button('restaurar canvas', 'restore'))
    layerButtons.appendChild(button('sin backdrop-filter', 'blur'))
    layerButtons.appendChild(button('sin animaciones CSS', 'anim'))
    layerButtons.appendChild(button('sin mix-blend-mode', 'blend'))
    layerButtons.appendChild(button('sin sombras', 'shadow'))
    add(layerButtons)

    add(sectionTitle('Capacidades'))
    capabilities().forEach(function (entry) {
      var r = row(entry[0])
      r.value.textContent = entry[1] ? 'OK' : 'NO (sin soporte)'
      r.value.setAttribute(
        'style',
        'flex:1;word-break:break-word;color:' + (entry[1] ? '#7ee787' : '#ff8a8a'),
      )
      add(r.line)
    })

    errorsBox = document.createElement('div')
    errorsBox.setAttribute(
      'style',
      'color:#ff8a8a;margin-top:6px;word-break:break-word;display:none',
    )
    add(errorsBox)

    var reportArea = document.createElement('textarea')
    reportArea.dataset.action = 'report'
    reportArea.readOnly = true
    reportArea.setAttribute(
      'style',
      'margin-top:6px;width:100%;height:5.5rem;background:#0d1a12;color:#b7f0c2;' +
        'border:1px solid #2f6b3c;font:10px/1.4 ui-monospace,monospace',
    )
    add(reportArea)
    live.reportArea = reportArea

    var collapseWrap = document.createElement('div')
    collapseWrap.setAttribute('style', 'margin-top:4px')
    collapseWrap.appendChild(button('ocultar panel', 'collapse'))
    add(collapseWrap)
  }

  /** Modo de calidad vigente: URL > guardado > defecto (completo). */
  function appliedMode() {
    var q = new URLSearchParams(window.location.search).get('q')
    if (q === 'lite') return 'ligero (por URL)'
    if (q === 'full') return 'completo (por URL)'
    try {
      var stored = window.localStorage.getItem('portfolio-quality')
      if (stored !== null)
        return JSON.parse(stored) === true ? 'ligero (guardado)' : 'completo (guardado)'
    } catch (err) {}
    return 'completo (por defecto)'
  }

  function sync() {
    if (!root.parentNode || root.dataset.collapsed === 'si') return
    var stats = fpsWindow(60)

    var app = document.getElementById('app')
    var mounted = !!(app && app.children.length > 0)
    if (mounted && !mountTime) mountTime = performance.now()

    live.ios.value.textContent = detectIos() || navigator.userAgent.slice(0, 60)
    live.screen.value.textContent =
      window.innerWidth +
      'x' +
      window.innerHeight +
      ' · dpr ' +
      window.devicePixelRatio +
      ' · ' +
      screen.width +
      'x' +
      screen.height
    live.pointer.value.textContent = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      ? 'sí'
      : 'no'
    live.cores.value.textContent =
      (navigator.hardwareConcurrency || '?') + ' / ' + (navigator.deviceMemory || 'n/d')
    live.mounted.value.textContent = mounted ? 'sí (' + Math.round(mountTime) + ' ms)' : 'NO'
    live.canvas.value.textContent = String(canvases().length)

    live.fps.value.textContent = stats.fps.toFixed(1) + ' fps'
    live.worst.value.textContent = stats.worst.toFixed(0) + ' ms'
    live.slow.value.textContent = String(badFrames)
    if (liveSamples.length) {
      live.samples.value.textContent = liveSamples.join(' | ')
    } else {
      live.samples.value.textContent = '—'
    }

    live.mode.value.textContent = appliedMode()
    // Lo que la app tiene aplicado se refleja vía los ajustes que este panel
    // mandó (la app no emite su estado; el informe lo deja anotado).
    live.scale.value.textContent = sentState.scale == null ? '—' : sentState.scale
    live.fpsCap.value.textContent = sentState.fps == null ? '—' : sentState.fps

    if (errorsBox) {
      if (errors.length) {
        errorsBox.style.display = 'block'
        errorsBox.textContent = 'Errores (' + errors.length + '): ' + errors.join(' · ')
      } else {
        errorsBox.style.display = 'none'
      }
    }
    if (live.reportArea) live.reportArea.value = collectReport ? collectReport() : ''
  }

  /** Últimos ajustes mandados al panel, para mostrarlos (la app no emite). */
  var sentState = { scale: null, fps: null }
  var liveSamples = []

  function scheduleSync() {
    if (scheduleSync.pending) return
    scheduleSync.pending = true
    requestAnimationFrame(function () {
      scheduleSync.pending = false
      sync()
    })
  }

  function report() {
    var stats = fpsWindow(60)
    var lines = []
    lines.push('diag ' + new Date().toISOString())
    lines.push('ua: ' + navigator.userAgent)
    lines.push(
      'viewport ' +
        window.innerWidth +
        'x' +
        window.innerHeight +
        ' dpr ' +
        window.devicePixelRatio +
        ' screen ' +
        screen.width +
        'x' +
        screen.height,
    )
    lines.push('canvas: ' + canvases().length)
    lines.push(
      'fps ' + stats.fps.toFixed(1) + ' peor ' + stats.worst.toFixed(0) + 'ms lentos ' + badFrames,
    )
    lines.push('modo: ' + appliedMode())
    if (sentState.scale != null) lines.push('escala terminal (mandada): ' + sentState.scale)
    if (sentState.fps != null) lines.push('limite fps (mandado): ' + sentState.fps)
    liveSamples.forEach(function (sample, index) {
      lines.push('muestra ' + (index + 1) + ': ' + sample)
    })
    capabilities().forEach(function (entry) {
      lines.push((entry[1] ? 'OK  ' : 'NO  ') + entry[0])
    })
    errors.forEach(function (message) {
      lines.push('!' + message)
    })
    return lines.join('\n')
  }

  collectReport = report

  function measure() {
    if (bucket) return
    bucket = { count: 0, total: 0, worst: 0, slow: 0 }
    var start = performance.now()
    setTimeout(function () {
      var result = bucket
      bucket = null
      if (!result) return
      var fps = result.count && result.total ? 1000 / (result.total / result.count) : 0
      var sample =
        fps.toFixed(1) +
        ' fps · peor ' +
        result.worst.toFixed(0) +
        ' ms · lentos ' +
        result.slow +
        ' de ' +
        result.count +
        ' · ' +
        Math.round(performance.now() - start) +
        ' ms'
      liveSamples.push(sample)
      if (liveSamples.length > 6) liveSamples.shift()
      scheduleSync()
    }, 5000)
  }

  root.addEventListener('click', function (event) {
    var target = event.target
    var action = target && target.dataset ? target.dataset.action : null
    if (!action) return
    if (action === 'measure') measure()
    else if (action === 'lite') {
      sendQuality({ lite: true })
      sentState.scale = '0.5 (ligero)'
      sentState.fps = '30 (ligero)'
    } else if (action === 'full') {
      sendQuality({ lite: false })
      sentState.scale = '1 (completo)'
      sentState.fps = 'sin límite'
    } else if (action === 'scale1') {
      sendQuality({ terminalScale: 1 })
      sentState.scale = '1'
    } else if (action === 'scale75') {
      sendQuality({ terminalScale: 0.75 })
      sentState.scale = '0.75'
    } else if (action === 'scale50') {
      sendQuality({ terminalScale: 0.5 })
      sentState.scale = '0.5'
    } else if (action === 'scale25') {
      sendQuality({ terminalScale: 0.25 })
      sentState.scale = '0.25'
    } else if (action === 'fpsfree') {
      sendQuality({ terminalFps: 0 })
      sentState.fps = 'sin límite'
    } else if (action === 'fps30') {
      sendQuality({ terminalFps: 30 })
      sentState.fps = '30'
    } else if (action === 'clear') liveSamples = []
    else if (action === 'copy') {
      if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(report())
    } else if (action === 'collapse') {
      root.dataset.collapsed = 'si'
      root.textContent = ''
      root.appendChild(button('PERF', 'expand'))
    } else if (action === 'expand') {
      root.dataset.collapsed = 'no'
      root.textContent = ''
      buildPanel()
      sync()
    } else if (action === 'canvas0') shrinkOnly(0)
    else if (action === 'canvas1') shrinkOnly(1)
    else if (action === 'canvas2') shrinkOnly(2)
    else if (action === 'restore') restoreCanvases()
    else if (action === 'blur' || action === 'anim' || action === 'blend' || action === 'shadow') {
      toggleClass('diag-no-' + action, target)
    }
    scheduleSync()
  })

  function boot() {
    buildPanel()
    document.body.appendChild(root)
    sync()
    // Refresco solo de texto; el DOM y los botones no se recrean nunca.
    setInterval(scheduleSync, 400)
  }

  if (document.body) boot()
  else document.addEventListener('DOMContentLoaded', boot)
})()
