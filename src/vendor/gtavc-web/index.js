// GTA Vice City (reVC) en el navegador, como librería.
//
// Uso mínimo (Vue, React, TS o HTML suelto):
//
//   import { startGame } from '@re3/gtavc-web';
//   const game = startGame({ el: document.getElementById('vc') });
//
// La función monta el juego DENTRO del div que le pases: crea el canvas, la
// barra de progreso rosa pegada al top del viewport, y arranca el motor sin
// pedir clic (el audio se desbloquea solo con el primer gesto del usuario).
//
// El motor (wasm) y los datos NO van en el paquete: se sirven por HTTP y aquí
// solo se apunta dónde están (buildUrl / streamedUrl / manifestUrl / assetsUrl).
import { CSS, STYLE_ID } from './styles.js';

// Tag de esta ronda: sale en la consola, en el título y en las trazas.
// Sirve para saber QUÉ código corre (adiós confusión de cachés).
export const VERSION = '2026-09-19-orig1';

const DEFAULTS = {
  el: null,                 // div destino (elemento o selector). Obligatorio.
  // --- De dónde salen las cosas ---
  buildUrl: '/build/',      // reVC.js + reVC.wasm + reVC.data
  streamedUrl: '/streamed/',// datos sueltos on-demand
  manifestUrl: '/manifest.json', // índice de streamed/ (claves en minúsculas)
  assetsUrl: '/vc/',        // copia legal original, SOLO se mira si falta streamed/
  // --- Comportamiento ---
  fill: 'viewport',         // 'viewport' (toda la pantalla) | 'parent' (la caja del div)
  title: true,              // poner el título de la pestaña con el tag de build
  audio: true,              // desbloquear audio con el primer gesto (sin botones)
  pointerLock: true,        // capturar el ratón al hacer clic en el canvas
  guardUnload: true,        // pedir confirmación al cerrar/recargar en partida
  fullscreenKey: true,      // F11 = pantalla completa del juego
  showFps: false,           // contador de FPS del motor (esquina superior izq.)
  idbCapMB: 900,            // techo de la caché de datos en IndexedDB (0 = sin techo)
  warmMB: 64,               // MB de "arranque en caliente" durante la carga (0 = off)
  prefetch: false,          // dejar TODO streamed/ en local antes de que el juego arranque
  prefetchConcurrency: 4,   // peticiones simultaneas si se recorre el manifiesto
  archiveUrl: '',           // tar (o tar.gz) con TODO el streamed/: 1 sola peticion al host
  worker: true,             // cargar ficheros en un hilo aparte (false = como antes)
  traceUrl: null,           // p.ej. '/odtrace' en desarrollo; null = sin envíos
  console: true,            // espejo a la consola del navegador
  noInitialRun: false,      // cargar runtime+FS sin arrancar el juego (diagnóstico)
  requireBuild: true,       // si falta el build, no arrancar y avisar
  requireData: true,        // si faltan los datos, no arrancar y avisar
  // --- Ganchos ---
  onProgress: null,         // ({ phase, pct, label, busy })
  onLog: null,              // (line)
  onError: null,            // (error)  -> también por consola
  onReady: null,            // ()  runtime wasm listo
  onAudio: null,            // (active:boolean)
  onFullscreen: null,       // (active:boolean)
};

// El motor emscripten es global (Module, FS, OD): una instancia por página.
let current = null;

const ODPRI = /^(loadtick|webload|BART|ASYNC|RETUNE|RADIOTRACK|FPSLOG|ENGAP|PERF|ODCAP|GEAR|initstep|od-trace|FPHASE|ODLOAD|ODSFXDEFER|ODSFXSTAT|ODSFXBUDGET)/;
const NOISY = /took \d+ ?ms|\[DBG\]: (Request|Remove) Ped|\.txd took |REMOVE_SOUND - Sound doesn't exist/;

function base(url, fallback) {
  if (url === null || url === undefined || url === '') return fallback;
  return String(url).endsWith('/') ? String(url) : String(url) + '/';
}

// HEAD con guardia de content-type: un dev server tipo Vite responde su
// index.html (200 text/html) a rutas inexistentes, así que "ok" no basta.
async function exists(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    if (!r.ok) return false;
    const ct = (r.headers.get('content-type') || '').toLowerCase();
    return !ct.includes('text/html');
  } catch (e) {
    return false;
  }
}

function injectStyles(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const s = doc.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  (doc.head || doc.documentElement).appendChild(s);
}

function markup(root, fill) {
  root.dataset.fill = fill;
  root.innerHTML = `
    <canvas class="vc-canvas" tabindex="0"></canvas>
    <div class="vc-bar" aria-hidden="true"><i></i></div>
    <div class="vc-load" hidden>
      <div class="vc-load-title">VICE CITY</div>
      <div class="vc-load-sub">Cargando… no cierres la pestaña</div>
      <div class="vc-load-bar"><i></i></div>
      <div class="vc-load-label"></div>
    </div>
    <div class="vc-msg" hidden></div>`;
}

// ---------------------------------------------------------------------------
// startGame: única función que necesita el host.
// ---------------------------------------------------------------------------
export function startGame(options = {}) {
  const opts = Object.assign({}, DEFAULTS, options);
  const doc = opts.doc || (typeof document !== 'undefined' ? document : null);
  if (!doc) throw new Error('gtavc-web: hace falta un documento (navegador).');

  if (current) {
    current.log('[lib] ya hay un juego arrancado; se devuelve la instancia viva');
    return current;
  }

  const el = typeof opts.el === 'string' ? doc.querySelector(opts.el) : opts.el;
  if (!el) throw new Error('gtavc-web: falta { el } (el div donde montar el juego).');

  const buildUrl = base(opts.buildUrl, '/build/');
  const streamedUrl = base(opts.streamedUrl, '/streamed/');
  const manifestUrl = opts.manifestUrl || '/manifest.json';
  const assetsUrl = opts.assetsUrl === null ? null : base(opts.assetsUrl, '/vc/');
  const traceUrl = opts.traceUrl || null;

  // El motor (WebDrawFps en main.cpp) lee este global en cada frame: así el
  // contador de FPS se enciende por API, sin parámetros en la URL.
  globalThis.__vcShowFps = !!opts.showFps;

  injectStyles(doc);
  el.classList.add('vc-root');
  markup(el, opts.fill === 'parent' ? 'parent' : 'viewport');

  const canvas = el.querySelector('.vc-canvas');
  const barEl = el.querySelector('.vc-bar');
  const barFill = barEl.querySelector('i');
  const loadEl = el.querySelector('.vc-load');
  const loadBar = loadEl.querySelector('.vc-load-bar > i');
  const loadLabel = loadEl.querySelector('.vc-load-label');
  const msgEl = el.querySelector('.vc-msg');

  const logLines = [];
  const listeners = { progress: [], log: [], error: [], ready: [], audio: [], fullscreen: [], booted: [] };
  const timers = [];
  let destroyed = false;
  let runtimeReady = false;
  let audioUnlocked = false;
  let idleTimer = 0;
  let lastProgress = { phase: null, pct: 0, label: '', busy: false };

  // Los eventos salen por dos vías: la API (game.on) y el propio div
  // (CustomEvent 'vc-progress', 'vc-ready', 'vc-error', 'vc-booted', ...).
  // Así un index.html cualquiera puede escuchar sin importar la librería.
  const emit = (evt, arg) => {
    for (const fn of listeners[evt] || []) { try { fn(arg); } catch (e) {} }
    try { el.dispatchEvent(new CustomEvent('vc-' + evt, { detail: arg })); } catch (e) {}
  };

  // ---- log --------------------------------------------------------------
  let logBuf = [];
  let logTimer = 0;
  function writeLogDom(lines) {
    const g = doc.getElementById('gamelog');           // opcional: host o página dev
    if (!g) return;
    try {
      const t = performance.now();
      g.textContent += lines.join('\n') + '\n';
      if (window.__jankM) { window.__jankM.domN++; window.__jankM.domMs += performance.now() - t; }
      if (g.textContent.length > 300000) g.textContent = g.textContent.slice(-200000);
      g.scrollTop = g.scrollHeight;
    } catch (e) {}
  }
  function log(t) {
    const s = String(t);
    logLines.push(s);
    if (logLines.length > 4000) logLines.splice(0, 2000);
    emit('log', s);
    logBuf.push(s);
    if (!logTimer) {
      logTimer = setTimeout(() => { logTimer = 0; writeLogDom(logBuf); logBuf = []; }, 500);
      timers.push(logTimer);
    }
    if (opts.console && (/^\[err\]|\[REJECT\]|\[FATAL\]/.test(s) || !NOISY.test(s))) console.log('[game]', s);
    return s;
  }
  function fail(text, detail) {
    log('[err] ' + text);
    if (msgEl) msgEl.hidden = false;
    if (msgEl) msgEl.innerHTML = '<h3>El juego no puede arrancar</h3><p>' + text + '</p>' + (detail || '');
    const err = new Error(text);
    emit('error', err);
    if (opts.onError) opts.onError(err);
  }

  // ---- barra de progreso (rosa, top del viewport) ------------------------
  // Cubre SOLO la preparación previa al motor:
  //   'probe' → comprobación de ficheros (build y datos)
  //   'build' → descarga y arranque del motor (reVC.js/wasm/data)
  // El fin es determinista: el motor avisa por window.__vcFrame la primera vez
  // que presenta un frame (glfw.cpp, EmscriptenTick). Ahí la barra se retira y
  // NO vuelve nunca: a partir de ese momento manda la pantalla del juego (menú,
  // splash de carga de partida). __loadProgress (fases del init) solo llega al
  // inicializar el mundo, así que no sirve como señal de "ya hay juego".
  const BAR_PHASES = { probe: 1, build: 1 };
  let engineUp = false;
  let lastReportKey = '';
  // La descarga pregunta el estado cientos de veces por segundo: la barra se
  // pinta como mucho una vez por frame. Sin esto eran miles de escrituras de
  // DOM por segundo y la barra parpadeaba.
  let barQueued = false;
  let barPending = null;     // { indet: true } | { indet: false, pct }
  function barTrace(msg) {
    try { (window.__odq = window.__odq || []).push('BART ' + msg); } catch (e) {}
  }
  function applyBar() {
    barQueued = false;
    const p = barPending;
    barPending = null;
    if (!p || engineUp) return;
    // Ojo: el atributo vale '' (falso), así que hay que comparar con undefined:
    // si no, se reescribe en cada frame sin necesidad.
    if (barEl.dataset.on === undefined) barEl.dataset.on = '';
    if (p.indet) {
      if (barEl.dataset.indet === undefined) barEl.dataset.indet = '';
      // Sin ancho inline: si queda el '100%' de una fase anterior, gana al 32%
      // del CSS y el barrido se ve como una barra llena que destella.
      barFill.style.width = '';
    } else {
      if (barEl.dataset.indet !== undefined) delete barEl.dataset.indet;
      barFill.style.width = (100 * Math.max(0, Math.min(1, p.pct))).toFixed(1) + '%';
    }
  }
  function queueBar(p) {
    barPending = p;
    if (barQueued) return;
    barQueued = true;
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(applyBar);
    else setTimeout(applyBar, 16);
  }
  function showBar() { if (!engineUp) queueBar({ indet: false, pct: 1 }); }
  function hideBar() { delete barEl.dataset.on; delete barEl.dataset.indet; }
  function report(phase, pct, label, busy) {
    lastProgress = { phase, pct, label: label || '', busy: !!busy };
    // Mismo estado repetido (la descarga lo reporta cientos de veces por
    // segundo): no se dispara otro evento.
    const key = phase + '|' + (pct === null || pct === undefined ? 'x' : (+pct).toFixed(2)) + '|' + lastProgress.label + '|' + lastProgress.busy;
    if (key === lastReportKey) return;
    lastReportKey = key;
    emit('progress', lastProgress);
    if (opts.onProgress) opts.onProgress(lastProgress);
  }
  // El motor ya es dueño de la pantalla: la barra del top se apaga y ninguna
  // fuente vuelve a encenderla. 'reason' queda en las trazas.
  function engineOwnsScreen(reason) {
    if (engineUp) return;
    engineUp = true;
    barPending = null;
    clearTimeout(idleTimer);
    hideBar();
    barTrace('off reason=' + (reason || '?'));
  }
  function progress(phase, pct, label, busy) {
    const unknown = pct === null || pct === undefined;
    report(phase, pct, label, unknown ? true : (busy === undefined ? pct < 1 : !!busy));
    if (engineUp || !BAR_PHASES[phase]) return;
    queueBar(unknown ? { indet: true } : { indet: false, pct });
    // Red de seguridad: si el motor no llegara a avisar (build antigua), la
    // barra se retira sola un poco después de tener el runtime listo.
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (runtimeReady) engineOwnsScreen('idle-timeout'); }, 6000);
  }
  // Cierre de la fase de preparación (100% y fuera).
  function done() {
    if (engineUp) return;
    barPending = null;
    barEl.dataset.on = '';
    delete barEl.dataset.indet;
    barFill.style.width = '100%';
    barTrace('on pct=100 (done)');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => engineOwnsScreen('done-timeout'), 400);
  }

  // ---- cola de trazas (lo que manda el motor C++) ------------------------
  // window.__odq lo llenan EM_ASM del motor y el pre-js. Aquí se envía por
  // lotes async (nunca XHR síncrono en el hilo del juego) y se acota para que
  // una tormenta de líneas no se coma la memoria.
  const odq = (window.__odq = window.__odq || []);
  function flush(sync) {
    try {
      const q = window.__odq;
      if (!q || !q.length) return;
      if (q.length > 30000) {
        let drop = q.length - 30000;
        for (let i = 0; i < q.length && drop > 0; i++) if (!ODPRI.test(q[i])) { q.splice(i, 1); i--; drop--; }
        if (drop > 0) q.splice(0, drop);
      }
      const batch = q.splice(0, 3000);
      if (!traceUrl) {
        // Sin endpoint de trazas: se guardan acotadas (para diagnóstico desde
        // la consola) sin inundar ni la consola ni la memoria.
        logLines.push(...batch);
        if (logLines.length > 4000) logLines.splice(0, logLines.length - 4000);
        return;
      }
      batch.sort((a, b) => (ODPRI.test(b) ? 1 : 0) - (ODPRI.test(a) ? 1 : 0));
      const body = batch.join('\n');
      if (sync) { const x = new XMLHttpRequest(); x.open('POST', traceUrl, false); x.send(body); }
      else fetch(traceUrl, { method: 'POST', body, keepalive: true }).catch(() => {});
    } catch (e) {}
  }
  timers.push(setInterval(() => flush(false), 1000));
  const onPageHide = () => flush(false);
  const onAnyError = () => flush(true);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('error', onAnyError);
  window.addEventListener('unhandledrejection', onAnyError);
  window.addEventListener('error', (e) => {
    console.log('[FATAL] ' + String(e?.error?.stack || e?.message || e).slice(0, 2000));
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.log('[REJECT] ' + String(e?.reason?.stack || e?.reason || e).slice(0, 500));
  });

  // ---- contrato con el motor (globals que llama el C++) ------------------
  // El motor avisa aquí la PRIMERA vez que presenta un frame (glfw.cpp,
  // EmscriptenTick). Es la señal buena de "ya hay juego en pantalla".
  window.__vcFrame = () => {
    barTrace('on motivo=motor-primer-frame');
    log('[lib] el motor está pintando: se retira la barra de preparación.');
    engineOwnsScreen('motor-primer-frame');
  };
  window.__loadProgress = (step, total) => {           // CGame::InitialiseStep
    // El motor está inicializando el mundo (empezar o cargar partida): se
    // acabó la preparación previa -> barra del top fuera.
    engineOwnsScreen('init-step');
    report('engine', total ? step / total : null, `Fase ${step}/${total}`, total ? step < total : true);
  };
  // Portada DOM de carga de partida: reserva para hosts donde el splash GL no
  // se ve (hoy el motor la pinta él mismo y esta no se usa). No toca la barra
  // del top: si aparece, ya es pantalla del motor.
  window.__loadOverlay = (show, pct, label) => {
    engineOwnsScreen('load-overlay');
    loadEl.hidden = !show;
    if (show) {
      loadBar.style.width = Math.max(0, Math.min(100, pct)).toFixed(1) + '%';
      if (label) loadLabel.textContent = label;
      report('engine', pct / 100, label, pct < 100);
    }
  };
  window.__vcLog = logLines;

  // ---- audio: sin botón, se abre con el primer gesto ---------------------
  async function unlockAudio() {
    let ok = false, note = 'sin contexto aún';
    try {
      const ctxs = [];
      if (typeof Module !== 'undefined' && Module?.SDL2?.audioContext) ctxs.push(Module.SDL2.audioContext);
      if (typeof AL !== 'undefined' && AL.currentCtx?.audioCtx) ctxs.push(AL.currentCtx.audioCtx);
      for (const ctx of ctxs) {
        if (ctx.state === 'suspended') await ctx.resume();
        if (ctx.state === 'running') ok = true;
      }
      note = ctxs.length ? ctxs.map((c) => c.state).join(',') : note;
    } catch (e) { note = String(e).slice(0, 80); }
    if (ok !== audioUnlocked) {
      audioUnlocked = ok;
      emit('audio', ok);
      if (opts.onAudio) opts.onAudio(ok);
    }
    return ok ? true : note;
  }
  const gestureEvents = ['pointerdown', 'keydown', 'touchstart'];
  const onGesture = async () => {
    if (!opts.audio || audioUnlocked) return;
    if (await unlockAudio() === true) for (const ev of gestureEvents) window.removeEventListener(ev, onGesture, true);
  };
  if (opts.audio) for (const ev of gestureEvents) window.addEventListener(ev, onGesture, true);

  // ---- pantalla completa (F11 y método público) --------------------------
  async function enterFullscreen() {
    try { await el.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { log('[lib] pantalla completa: ' + e); }
    try { if (navigator.keyboard?.lock) await navigator.keyboard.lock(['Escape', 'KeyW', 'KeyA', 'KeyS', 'KeyD']); } catch (e) {}
  }
  async function exitFullscreen() { try { if (doc.fullscreenElement) await doc.exitFullscreen(); } catch (e) {} }
  function isFullscreen() { return doc.fullscreenElement === el; }
  function toggleFullscreen() { return isFullscreen() ? exitFullscreen() : enterFullscreen(); }
  const onFsChange = () => {
    const on = isFullscreen();
    emit('fullscreen', on);
    if (opts.onFullscreen) opts.onFullscreen(on);
    if (on) hideBar();
  };
  doc.addEventListener('fullscreenchange', onFsChange);

  // Esc corto = nada; mantener Esc 3 s = salir de pantalla completa (Esc sigue
  // sirviendo al juego). SIN aviso en pantalla a propósito: no queremos un
  // cartel ni una barra encima del juego.
  const HOLD_MS = 3000;
  let escTimer = 0;
  const onKeyDown = (e) => {
    if (opts.fullscreenKey && (e.code === 'F11' || e.key === 'F11')) {
      e.preventDefault();
      toggleFullscreen();
      return;
    }
    if (e.key !== 'Escape' || escTimer) return;
    escTimer = setTimeout(() => { escTimer = 0; exitFullscreen(); }, HOLD_MS);
  };
  const onKeyUp = (e) => {
    if (e.key !== 'Escape') return;
    if (escTimer) { clearTimeout(escTimer); escTimer = 0; }
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // ---- ratón (solo al hacer clic en el juego) ----------------------------
  const onCanvasClick = async () => {
    if (opts.audio) await unlockAudio();
    if (!opts.pointerLock) return;
    try { await canvas.requestPointerLock(); } catch (e) { log('pointer lock: ' + e); }
  };
  canvas.addEventListener('click', onCanvasClick);
  const onPointerLockChange = () => {
    canvas.style.cursor = doc.pointerLockElement === canvas ? 'none' : 'default';
  };
  doc.addEventListener('pointerlockchange', onPointerLockChange);

  // ---- protecciones e IDBFS ---------------------------------------------
  const onBeforeUnload = (e) => {
    try { if (typeof OD !== 'undefined') OD.syncUserfiles(); else if (typeof FS !== 'undefined') FS.syncfs(false, () => {}); } catch (err) {}
    if (opts.guardUnload && window.__gameBooted && !window.__quitting) e.preventDefault();
  };
  const onVisibility = () => {
    if (!doc.hidden) return;
    try { if (typeof OD !== 'undefined') OD.syncUserfiles(); } catch (err) {}
  };
  window.addEventListener('beforeunload', onBeforeUnload);
  doc.addEventListener('visibilitychange', onVisibility);

  // ---- jank probe: peor frame de cada segundo a las trazas (F4c/FPSLOG) --
  function jankProbe() {
    if (!traceUrl) return;
    try {
      window.__jankM = { xhrN: 0, xhrMs: 0, domN: 0, domMs: 0 };
      let t0 = performance.now(), maxd = 0, idx = 0, n = 0, over17 = 0, heap0 = 0, minHeap = 0;
      const ivs = [];
      let x0 = { n: 0, ms: 0 }, d0 = { n: 0, ms: 0 };
      const tick = (now) => {
        const d = now - t0; t0 = now; idx++;
        n++; if (d > 17.5) over17++;
        ivs.push(d); if (d > maxd) maxd = d;
        const used = performance.memory ? performance.memory.usedJSHeapSize : 0;
        if (idx === 1) { heap0 = used; minHeap = used; }
        if (used && used < minHeap) minHeap = used;
        if (idx >= 60) {
          const s = ivs.slice().sort((a, b) => a - b);
          const med = s[Math.floor(s.length / 2)];
          const xr2 = (window.__jankM.xhrN - x0.n), xm2 = (window.__jankM.xhrMs - x0.ms);
          const dn = (window.__jankM.domN - d0.n), dm = (window.__jankM.domMs - d0.ms);
          window.__odq.push('FPSLOG frames=' + n + ' over17=' + over17 + ' maxdelta=' + Math.max(0, Math.round(maxd)) +
            ' med=' + Math.round(med) + ' heap0=' + Math.round(heap0 / 1048576) + 'MB freed=' + Math.round((heap0 - minHeap) / 1048576) + 'MB' +
            ' xhr=' + xr2 + '/' + Math.round(xm2 * 10) / 10 + 'ms@' + xr2 + ' dom=' + dn + '/' + Math.round(dm * 10) / 10 + 'ms');
          t0 = now; maxd = 0; idx = 0; n = 0; over17 = 0; ivs.length = 0;
          heap0 = used; minHeap = used;
          x0 = { n: window.__jankM.xhrN, ms: window.__jankM.xhrMs };
          d0 = { n: window.__jankM.domN, ms: window.__jankM.domMs };
        }
        if (!destroyed) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch (e) {}
  }

  // ---- ¿están el build y los datos? --------------------------------------
  async function probeBuild() {
    const [js, wasm, data] = await Promise.all([
      exists(buildUrl + 'reVC.js'), exists(buildUrl + 'reVC.wasm'), exists(buildUrl + 'reVC.data'),
    ]);
    return { js, wasm, data, ok: js && wasm };
  }

  // Los datos se comprueban contra el manifiesto (1 petición, sin 404s):
  // si trae los ficheros centinela, NO se toca assetsUrl para nada.
  async function probeData() {
    const need = ['models/gta3.dir', 'audio/sfx.sdt', 'data/main.scm', 'text/spanish.gxt'];
    let manifest = null;
    try {
      const r = await fetch(manifestUrl, { cache: 'no-store' });
      if (r.ok) manifest = await r.json();
    } catch (e) {}
    if (manifest) {
      const missing = need.filter((k) => !manifest[k]);
      if (!missing.length) return { ok: true, manifest, missing: [] };
      return { ok: false, manifest, missing, reason: 'streamed-incompleto', assets: assetsUrl ? await exists(assetsUrl + 'data/main.scm') : false };
    }
    return {
      ok: false, manifest: null, missing: need, reason: 'sin-manifiesto',
      assets: assetsUrl ? await exists(assetsUrl + 'data/main.scm') : false,
    };
  }

  // ---- arranque ----------------------------------------------------------
  // ---- full prefetch (optional) ------------------------------------------
  // The engine pulls streamed files on demand: an area's txd/dff only arrive
  // when the game asks for them, so play waits on the host. With `prefetch:
  // true` every manifest entry is fetched once, in priority order (what the
  // engine learned to need first), through OD.ensure() -- the very path the
  // engine uses from C -- so the files land in its own cache (MEMFS +
  // IndexedDB) and, while playing, nothing depends on the host any more.
  const PREFETCH_TICK_MS = 250;
  const prefetchState = {
    active: false, finished: false, reused: false,
    done: 0, total: 0, files: 0, failed: 0, bytes: 0, totalBytes: 0,
  };

  // Every manifest entry is prefetched, whatever its size: the engine's fetch
  // worker checks IndexedDB before the network and stores whatever it pulls (the
  // 8 MB limit only existed on the old main-thread path), while the engine's
  // 360 MB RAM cache evicts by LRU without touching that copy. So in play every
  // file -- textures, models, audio sfx, radio streams and the cutscene file --
  // is served locally.
  function prefetchable(manifest, key) {
    const entry = manifest[key];
    return !!(entry && entry.p);
  }

  // Ordered plan + total size. The learned list goes first: it is what previous
  // sessions showed the engine needs early.
  function prefetchPlan() {
    const od = typeof OD !== 'undefined' ? OD : null;
    if (!od || !od.manifest || typeof od.ensure !== 'function') return null;
    const manifest = od.manifest;
    const keys = Object.keys(manifest);
    if (!keys.length) return null;
    const seen = new Set();
    const order = [];
    let totalBytes = 0;
    let tarBytes = 0;
    const push = (key) => {
      if (seen.has(key) || !prefetchable(manifest, key)) return;
      seen.add(key);
      order.push(key);
      const size = Number(manifest[key].s) || 0;
      totalBytes += size;
      // Tamano esperado del tar: cabecera de 512 B + contenido con relleno a 512.
      tarBytes += 512 + (size ? Math.ceil(size / 512) * 512 : 0);
    };
    let learned = [];
    try { learned = typeof od.warmLoad === 'function' ? od.warmLoad() : []; } catch (e) {}
    for (const raw of learned || []) {
      push(typeof od.norm === 'function' ? od.norm(raw) : String(raw).toLowerCase());
    }
    for (const key of keys) push(key);
    if (!order.length) return null;
    return { order, totalBytes, tarBytes };
  }

  function prefetchLabel() {
    if (!prefetchState.total) return 'Preparando datos…';
    return 'Preparando datos: ' + Math.round((100 * prefetchState.done) / prefetchState.total) + '%';
  }

  // ---- packed archive: one single request to the data host ----------------
  // Prefetching file by file means one HTTP request per file (17.399 of them).
  // The archive is fetched once, streamed, and every entry is written straight
  // into the engine's IndexedDB cache -- the very place its fetch worker looks
  // before the network.
  // ---- reutilizacion: si ya esta TODO en disco, no se pide nada al host ----
  // La primera visita baja el archivo y lo escribe en la cache del motor; en las
  // siguientes NO hay que volver a bajarlo (antes se repetia el tgz entero,
  // ~815 MB, en cada recarga). Antes de pedir nada se miran las CLAVES de la
  // cache -- un fichero presente esta completo, IndexedDB escribe cada registro
  // de forma atomica -- y una marca en localStorage con la identidad del archivo.
  const REUSE_MARK = 'vc_archive1';
  function markRead() {
    try { return localStorage.getItem(REUSE_MARK) || ''; } catch (e) { return ''; }
  }
  function markWrite(tag) {
    try { localStorage.setItem(REUSE_MARK, tag); } catch (e) {}
  }
  function markClear() {
    try { localStorage.removeItem(REUSE_MARK); } catch (e) {}
  }
  // Identidad del archivo y de los datos que contiene: URL, tag de datos del
  // motor (que purga la cache cuando cambia), numero de entradas y tamano
  // esperado del tar. Si cualquiera cambia, la marca no vale y se vuelve a bajar.
  function archiveTag(od, plan) {
    return [opts.archiveUrl, (od && od.dataTag) || '', plan.order.length, plan.tarBytes].join('|');
  }
  function idbKeys(od) {
    return new Promise((res) => {
      try {
        const q = od.db.transaction(['files'], 'readonly').objectStore('files').getAllKeys();
        q.onsuccess = (e) => res(e.target.result || []);
        q.onerror = () => res(null);
      } catch (e) { res(null); }
    });
  }
  // true si la cache del motor tiene ya todas las rutas del plan. La clave es
  // '/' + p del manifiesto: la ruta canonica que pide el motor (y la que escribe
  // el archivo), no la clave en minusculas del manifiesto.
  async function cacheHoldsPlan(od, plan) {
    let keys = null;
    try { keys = await idbKeys(od); } catch (e) { keys = null; }
    if (!keys || keys.length < plan.order.length) return false;
    const have = new Set(keys);
    let missing = 0;
    for (const key of plan.order) {
      const entry = od.manifest[key];
      if (entry && !have.has('/' + entry.p)) missing++;
    }
    if (missing) {
      log('[lib] cache local incompleta (' + missing + ' de ' + plan.order.length + '): se vuelve a bajar el archivo');
      return false;
    }
    return true;
  }
  // Muestra de tamanos: unos pocos ficheros pequenos (los mas baratos de leer)
  // para confirmar que los bytes guardados son los del archivo actual. Solo se
  // usa cuando no hay marca previa (primera vez que corre esta version).
  async function sampleMatches(od, plan) {
    const small = [];
    for (const key of plan.order) {
      const entry = od.manifest[key];
      const size = Number(entry && entry.s) || 0;
      if (size >= 1024 && size <= 65536) small.push([key, size]);
    }
    if (small.length < 4) return false;
    const step = Math.max(1, Math.floor(small.length / 12));
    let checked = 0;
    for (let i = 0; i < small.length && checked < 12; i += step) {
      const [key, size] = small[i];
      checked++;
      let back = null;
      try { back = await od.idbGet('/' + od.manifest[key].p); } catch (e) { back = null; }
      if (!(back instanceof ArrayBuffer) || back.byteLength !== size) return false;
    }
    log('[lib] muestra de la cache: ' + checked + ' ficheros, tamanos correctos');
    return true;
  }
  // ¿Se puede jugar ya con lo que hay en disco, sin pedirle nada al host?
  // Hace falta la cache COMPLETA (claves del plan) y que sea del archivo actual:
  // la marca recuerda con cual se lleno. Si no hay marca (primera vez que corre
  // esta version) se adopta lo que ya este en disco, pero solo si los tamanos de
  // la muestra cuadran con el manifiesto.
  async function canReuse(od, plan) {
    if (!opts.archiveUrl) return false;
    if (!(await cacheHoldsPlan(od, plan))) return false;
    const tag = archiveTag(od, plan);
    const marked = markRead();
    if (marked === tag) return true;
    if (marked) {
      log('[lib] el archivo de datos cambio desde la ultima visita: se baja de nuevo');
      return false;
    }
    // Sin marca solo se adopta si el motor considera la cache de la version de
    // datos actual: es su propio registro de version ('__datatag__'), el que usa
    // para purgar cuando los datos se regeneran.
    let dataTag = null;
    try { dataTag = await od.idbGet('__datatag__'); } catch (e) { dataTag = null; }
    if (!od.dataTag || dataTag !== od.dataTag) return false;
    if (!(await sampleMatches(od, plan))) return false;
    markWrite(tag);
    return true;
  }
  // La cache son ~1 GB: sin almacenamiento persistente el navegador puede
  // desalojarla y habria que bajarlo todo otra vez. Peticion silenciosa, no
  // bloquea nada (si la deniega, todo sigue funcionando igual).
  let persistAsked = false;
  function askPersistence() {
    if (persistAsked) return;
    persistAsked = true;
    try {
      if (!navigator.storage || !navigator.storage.persist) return;
      navigator.storage
        .persisted()
        .then((p) => (p ? true : navigator.storage.persist()))
        .then((ok) => {
          log('[lib] almacenamiento persistente: ' + (ok ? 'concedido' : 'no concedido (el navegador puede vaciar la cache)'));
        })
        .catch(() => {});
    } catch (e) {}
  }

  const TAR_BLOCK = 512;
  function tarText(bytes) {
    let end = bytes.length;
    for (let i = 0; i < bytes.length; i++) if (bytes[i] === 0) { end = i; break; }
    return new TextDecoder().decode(bytes.subarray(0, end));
  }
  function tarPaxPath(text) {
    let out = '';
    let pos = 0;
    while (pos < text.length) {
      const sp = text.indexOf(' ', pos);
      if (sp < 0) break;
      const len = parseInt(text.slice(pos, sp), 10);
      if (!len) break;
      const rec = text.slice(sp + 1, pos + len).replace(/\n$/, '');
      pos += len;
      if (rec.slice(0, 5) === 'path=') out = rec.slice(5);
    }
    return out;
  }

  async function unpackArchive(od, url, expectedBytes) {
    const res = await fetch(url);
    if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);
    let src = res.body;
    // Si el host ya manda Content-Encoding: gzip, el navegador descomprime solo
    // y volver a hacerlo aqui romperia el tar. En ese caso no se toca.
    const encoding = (res.headers.get('content-encoding') || '').toLowerCase();
    if (/\.gz(\?|#|$)/i.test(url) && encoding.indexOf('gzip') < 0) {
      if (typeof DecompressionStream !== 'function') throw new Error('este navegador no descomprime gzip en streaming');
      src = src.pipeThrough(new DecompressionStream('gzip'));
    }
    const reader = src.getReader();
    const chunks = [];
    let avail = 0;
    let drained = false;
    const pull = async () => {
      const r = await reader.read();
      if (r.done) { drained = true; return false; }
      chunks.push(r.value);
      avail += r.value.length;
      return true;
    };
    const take = async (n) => {
      while (avail < n && !drained) await pull();
      if (avail < n) return null;
      const out = new Uint8Array(n);
      let off = 0;
      while (off < n) {
        const c = chunks[0];
        const room = n - off;
        if (c.length <= room) { out.set(c, off); off += c.length; chunks.shift(); avail -= c.length; }
        else { out.set(c.subarray(0, room), off); chunks[0] = c.subarray(room); off += room; avail -= room; }
      }
      return out;
    };
    const written = new Set();
    let consumed = 0;
    let pending = '';
    let entries = 0;
    let lastTick = 0;
    for (;;) {
      const head = await take(TAR_BLOCK);
      if (!head) throw new Error('archivo truncado (cabecera)');
      consumed += TAR_BLOCK;
      let empty = true;
      for (const b of head) if (b !== 0) { empty = false; break; }
      if (empty) break;                                   // fin del archivo
      const type = String.fromCharCode(head[156]);
      const size = parseInt(tarText(head.subarray(124, 136)).trim() || '0', 8) || 0;
      const data = size > 0 ? await take(size) : new Uint8Array(0);
      if (size > 0 && !data) throw new Error('archivo truncado (contenido)');
      consumed += size;
      const pad = (TAR_BLOCK - (size % TAR_BLOCK)) % TAR_BLOCK;
      if (pad > 0) {
        if (!(await take(pad))) throw new Error('archivo truncado (relleno)');
        consumed += pad;
      }
      if (type === 'L') { pending = tarText(data); continue; }          // nombre largo (GNU)
      if (type === 'x' || type === 'g') { pending = tarPaxPath(new TextDecoder().decode(data)) || pending; continue; }
      if (type !== '0' && type !== '\u0000') continue;                   // no es un fichero
      let name = pending || tarText(head.subarray(0, 100));
      pending = '';
      if (!name) continue;
      const key = '/' + name.replace(/^\.\//, '').replace(/^\/+/, '');
      // ArrayBuffer exacto, NO la vista Uint8Array: el worker del motor transfiere
      // este buffer al hilo del juego (postMessage(buf, [buf])) y una vista no es
      // transferible -> DataCloneError en CADA peticion, que dejaba al motor sin
      // ningun fichero en partida (lag, audio ausente, error de lectura de DVD).
      // El motor guarda ArrayBuffers; se escribe lo mismo y `data` tiene su propio
      // buffer del tamano exacto (take() siempre hace new Uint8Array(n)).
      await od.idbPut(key, data.buffer);
      if (entries === 0) {
        // Ida y vuelta UNA vez: si la cache no devolviera un ArrayBuffer, el
        // worker fallaria en cada peticion (ver arriba) y hay que saberlo ya,
        // no en partida. Es un solo fichero, coste despreciable.
        try {
          const back = await od.idbGet(key);
          if (!(back instanceof ArrayBuffer) || back.byteLength !== data.byteLength) {
            log(
              '[err] la cache del motor devuelve ' +
                Object.prototype.toString.call(back) +
                ' en vez del ArrayBuffer escrito: el worker no podra entregar ficheros',
            );
          }
        } catch (e) {}
      }
      written.add(key);
      entries++;
      const now = Date.now();
      if (now - lastTick >= PREFETCH_TICK_MS) {
        lastTick = now;
        progress('prefetch', expectedBytes ? Math.min(1, consumed / expectedBytes) : null, prefetchLabel(), true);
      }
    }
    try { reader.cancel(); } catch (e) {}
    log('[lib] archivo desempaquetado: ' + entries + ' ficheros a la cache');
    return written;
  }

  // Trae TODOS los datos antes de que el juego arranque: el host mantiene su
  // barra de carga hasta que esto termina y solo entonces se llama a main().
  // Devuelve cuando esta todo; nunca lanza (si no puede, el juego sale
  // on-demand como antes).
  async function runPrefetch() {
    const od = typeof OD !== 'undefined' ? OD : null;
    // El manifiesto lo trae el motor en su init: se espera sin bloquear nada.
    let plan = null;
    for (let i = 0; i < 120 && !plan; i++) {
      plan = prefetchPlan();
      if (!plan) await new Promise((r) => setTimeout(r, 500));
    }
    if (!plan) { log('[lib] precarga omitida: sin manifiesto (el juego pedira on-demand)'); return; }
    prefetchState.active = true;
    prefetchState.finished = false;
    prefetchState.done = 0;
    prefetchState.files = 0;
    prefetchState.failed = 0;
    prefetchState.bytes = 0;
    prefetchState.total = plan.order.length;
    prefetchState.totalBytes = plan.totalBytes;
    // Visita repetida: si la cache del motor ya tiene todas las rutas del plan,
    // no hay NADA que pedir al host: se termina al instante.
    askPersistence();
    if (await canReuse(od, plan)) {
      prefetchState.active = false;
      prefetchState.finished = true;
      prefetchState.reused = true;
      prefetchState.done = prefetchState.total;
      prefetchState.files = plan.order.length;
      prefetchState.bytes = plan.totalBytes;
      hideBar();
      progress('prefetch', 1, 'Datos listos', false);
      log('[lib] datos ya en local: ' + plan.order.length + ' ficheros, sin descargar nada');
      return;
    }

    // La barra la lleva el host (fase 'prefetch'): la del motor se apaga para no
    // dejar dos barras superpuestas durante la descarga de datos.
    hideBar();
    log('[lib] precarga: ' + plan.order.length + ' ficheros (' + Math.round(plan.totalBytes / 1048576) + ' MB)');
    progress('prefetch', 0, prefetchLabel(), true);
    // 1) Con archivo: UNA peticion al host. Es el camino preferido.
    let archived = false;
    if (opts.archiveUrl) {
      log('[lib] precarga desde archivo: ' + opts.archiveUrl);
      try {
        const written = await unpackArchive(od, opts.archiveUrl, plan.tarBytes);
        await repairMissing(od, plan, written);
        // Solo se marca si de verdad quedo todo en local: el motor puede purgar
        // la cache por version de datos en paralelo, y una marca mentirosa haria
        // que la proxima carga no bajara lo que falta.
        if (!prefetchState.failed && (await cacheHoldsPlan(od, plan))) {
          markWrite(archiveTag(od, plan));
        } else {
          markClear();
        }
        archived = true;
      } catch (e) {
        log('[err] archivo no utilizable (' + (e && e.message || e) + '): se recorre el manifiesto');
        markClear();
      }
    }
    // 2) Sin archivo (o si fallo): un fichero por peticion, como antes.
    if (!archived) {
      await walkManifest(od, plan);
      // Sin archivo, quien deja la cache completa es el recorrido del manifiesto:
      // si no fallo nada, la proxima carga tampoco pedira ficheros al host.
      if (!prefetchState.failed && opts.archiveUrl && (await cacheHoldsPlan(od, plan))) {
        markWrite(archiveTag(od, plan));
      }
    }
    prefetchState.active = false;
    prefetchState.finished = true;
    progress('prefetch', 1, 'Datos listos', false);
    log('[lib] precarga completa: ' + prefetchState.files + ' ficheros, ' + prefetchState.failed + ' fallos');
  }

  // Reparacion: lo que el archivo no traiga se pide suelto (pocos ficheros, no 17.399).
  async function repairMissing(od, plan, written) {
    prefetchState.done = prefetchState.total;
    prefetchState.bytes = plan.totalBytes;
    prefetchState.files = written.size;
    const missing = [];
    for (const key of plan.order) {
      const entry = od.manifest[key];
      if (entry && !written.has('/' + entry.p)) missing.push(key);
    }
    if (!missing.length) { log('[lib] archivo completo: ' + written.size + ' ficheros en local'); return; }
    log('[lib] el archivo no traia ' + missing.length + ' ficheros: se piden al host');
    for (const key of missing) {
      try { await od.ensure('/' + key); prefetchState.files++; } catch (e) { prefetchState.failed++; }
    }
  }

  // Camino de siempre: una peticion por fichero del manifiesto.
  async function walkManifest(od, plan) {
    const lanes = Math.max(1, Number(opts.prefetchConcurrency) || 4);
    let next = 0;
    let lastTick = 0;
    const lane = async () => {
      for (;;) {
        const i = next++;
        if (i >= plan.order.length) return;
        const key = plan.order[i];
        try {
          await od.ensure('/' + key);
          prefetchState.files++;
          prefetchState.bytes += Number(od.manifest[key] && od.manifest[key].s) || 0;
        } catch (e) {
          prefetchState.failed++;
        }
        prefetchState.done++;
        const now = Date.now();
        if (now - lastTick >= PREFETCH_TICK_MS) {
          lastTick = now;
          progress('prefetch', prefetchState.done / prefetchState.total, prefetchLabel(), true);
        }
      }
    };
    await Promise.all(Array.from({ length: lanes }, lane));
  }

  // Arranca main() a mano: con `prefetch` el runtime se carga con
  // `noInitialRun` justo para que el juego no empiece hasta tener los datos.
  function startEngine() {
    const mod = typeof Module !== 'undefined' ? Module : null;
    // El motor avisa por __vcFrame en cuanto presenta su primer frame (unos
    // cientos de ms). Este plazo es solo la red por si esa señal no llegara.
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => engineOwnsScreen('runtime-timeout'), 2500);
    jankProbe();
    try {
      if (mod && typeof mod.callMain === 'function') { mod.callMain([]); return true; }
      if (mod && typeof mod._main === 'function') { mod._main(); return true; }
    } catch (e) {
      log('[err] arranque del motor: ' + (e && e.message || e));
    }
    fail('No se pudo arrancar el motor despues de preparar los datos.', '<p>Recarga la pagina; si sigue igual, borra los datos del sitio.</p>');
    return false;
  }

  function boot() {
    canvas.hidden = false;
    window.__gameBooted = true;
    emit('booted', true);

    window.Module = {
      canvas,
      // Con `prefetch` el runtime se monta sin arrancar main(): el juego empieza
      // cuando los datos ya estan en local (ver onRuntimeInitialized).
      noInitialRun: !!opts.noInitialRun || !!opts.prefetch,
      // El build vive en buildUrl, la página en otro sitio: sin esto el .data
      // se pediría a la raíz.
      locateFile: (path) => buildUrl + path,
      print: (t) => log(t),
      printErr: (t) => log('[err] ' + t),
      // Guardados persistentes: /userfiles vive en IndexedDB (IDBFS). El resto
      // de assets va en MEMFS (lectura síncrona del motor).
      preRun: [() => {
        try {
          FS.mkdir('/userfiles');
          FS.mount(IDBFS, {}, '/userfiles');
          // El juego NO espera solo: sin la dependencia leía MEMFS vacío
          // antes de que bajara IDB (carrera de lectura).
          if (typeof addRunDependency !== 'undefined') addRunDependency('idbfs-populate');
          FS.syncfs(true, (err) => {
            log(err ? '[err] IDBFS load: ' + err : 'IDBFS listo (guardados persistentes).');
            try { if (typeof removeRunDependency !== 'undefined') removeRunDependency('idbfs-populate'); } catch (e) {}
          });
          setTimeout(() => { try { if (typeof removeRunDependency !== 'undefined') removeRunDependency('idbfs-populate'); } catch (e) {} }, 15000);
        } catch (e) { log('[err] IDBFS: ' + e); }
      }],
      // El loader reporta "Downloading data... (123/456)": va a la barra.
      setStatus: (t) => {
        if (!t || engineUp) return;
        const m = t.match(/\((\d+)\s*\/\s*(\d+)\)/);
        // Con varios ficheros el contador es un progreso real. Con uno solo
        // (reVC.data) un "0%" clavado durante toda la descarga sería mentira:
        // la barra pasa a "trabajando" hasta que el motor arranque.
        if (m && +m[2] > 1) {
          progress('build', +m[1] / +m[2], `Descargando datos: ${Math.round(100 * m[1] / m[2])}%`);
        } else if (m) {
          progress('build', null, 'Descargando datos del juego…');
        } else {
          progress('build', null, t);
          if (!/Downloading data/.test(t)) log('[status] ' + t);
        }
      },
      onRuntimeInitialized: () => {
        runtimeReady = true;
        if (opts.prefetch) {
          // Arranque en dos tiempos: primero el runtime (OD y FS montados) y la
          // descarga COMPLETA de los datos, y solo entonces main(). El juego no
          // empieza hasta estar todo en local.
          log('Runtime WASM listo; descargando los datos del juego…');
          runPrefetch()
            .catch((e) => log('[err] precarga: ' + (e && e.message || e)))
            .then(() => {
              startEngine();
              emit('ready', true);
              if (opts.onReady) opts.onReady();
            });
          return;
        }
        log('Runtime WASM listo, arrancando juego…');
        startEngine();
        emit('ready', true);
        if (opts.onReady) opts.onReady();
      },
    };

    const s = doc.createElement('script');
    // CORS mode, not a plain no-cors load: in production the build is served from its own
    // origin (ADR-013) and the page is COEP `require-corp`, so a classic script without
    // CORS or `Cross-Origin-Resource-Policy` is blocked. The data host allows the origin
    // (B2 CORS `*`), and same-origin dev is unaffected by the attribute.
    s.crossOrigin = 'anonymous';
    s.src = buildUrl + 'reVC.js';
    s.async = true;
    s.onerror = () => fail(`No se pudo cargar <code>${buildUrl}reVC.js</code>.`);
    el.appendChild(s);
    log('Descargando datos del juego… (' + buildUrl + ')');
  }

  const handle = {
    ok: true,
    version: VERSION,
    el, root: el, canvas, config: { buildUrl, streamedUrl, manifestUrl, assetsUrl, fill: opts.fill, traceUrl },
    get module() { return typeof Module !== 'undefined' ? Module : null; },
    get progress() { return lastProgress; },
    get logs() { return logLines; },
    log,
    // showBar explícito del host manda (la política automática solo la
    // enciende en la preparación previa al motor).
    showBar: () => { if (!engineUp) { barEl.dataset.on = ''; barTrace('on (host)'); } },
    hideBar, setProgress: progress, done,
    // Caché de datos del navegador (IndexedDB 'vcod2'): la llena el propio
    // juego. Cuánto ocupa y cómo vaciarla sin tocar DevTools.
    // Estado de la precarga de datos (ficheros/bytes hechos), para diagnostico.
    prefetchInfo: () => ({ ...prefetchState }),
    cacheInfo() {
      const od = typeof OD !== 'undefined' ? OD : null;
      return { capMB: od?.cfg?.idbCapMB ?? null, warmMB: od?.cfg?.warmMB ?? null, trimmed: od?.trimmed || 0 };
    },
    // Vacía la caché de datos (los ficheros se re-descargan cuando hagan falta)
    // y olvida la lista de arranque en caliente. Los guardados NO se tocan:
    // viven en /userfiles (IDBFS de Emscripten), no en esta caché.
    async clearDataCache() {
      const od = typeof OD !== 'undefined' ? OD : null;
      if (!od) return false;
      try { od.warmSeen = null; od.warmList = null; localStorage.removeItem(od.warmKey); } catch (e) {}
      markClear();
      await od.idbClear();
      log('[lib] caché de datos vaciada (se re-descargará lo que el juego pida)');
      return true;
    },
    // Contador de FPS del motor, en caliente (sin recargar).
    showFps(on = true) { globalThis.__vcShowFps = !!on; return !!on; },
    fpsVisible: () => !!globalThis.__vcShowFps,
    isFullscreen,
    enterFullscreen, exitFullscreen, toggleFullscreen,
    unlockAudio,
    audioActive: () => audioUnlocked,
    on(evt, fn) {
      if (!listeners[evt]) throw new Error('gtavc-web: evento desconocido ' + evt);
      listeners[evt].push(fn);
      return () => { const i = listeners[evt].indexOf(fn); if (i >= 0) listeners[evt].splice(i, 1); };
    },
    // Diagnóstico del FS virtual (con noInitialRun:true, sin arrancar el juego).
    fsProbe() {
      const out = (t) => log('[probe] ' + t);
      try {
        for (const e of performance.getEntriesByType('resource')) {
          if (/reVC\.(data|wasm|js)/.test(e.name)) {
            out(`${e.name.split('/').pop()} transfer=${e.transferSize} encoded=${e.encodedBodySize} decoded=${e.decodedBodySize} dur=${Math.round(e.duration)}ms`);
          }
        }
        out('cwd=' + FS.cwd());
        out('root=' + JSON.stringify(FS.readdir('/').slice(0, 20)));
        out('TEXT=' + JSON.stringify(FS.readdir('/TEXT')));
        out('spanish.gxt size=' + FS.stat('/TEXT/spanish.gxt').size);
        FS.chdir('/TEXT');
        const fd = FS.open('spanish.gxt', 'r');
        const buf = new Uint8Array(12);
        const n = FS.read(fd, buf, 0, 12, 0);
        out(`lower open+read -> n=${n} magic=${String.fromCharCode(...buf.slice(0, 4))}`);
        FS.close(fd);
      } catch (e) { out('FAIL: ' + (e && e.message || e)); }
      out('probe done');
    },
    // Descarga best-effort: el módulo wasm no se puede liberar de verdad en
    // una página, así que se para el bucle y se limpia lo nuestro.
    destroy() {
      if (destroyed) return;
      destroyed = true;
      try { Module?.pauseMainLoop?.(); } catch (e) {}
      for (const t of timers) { clearTimeout(t); clearInterval(t); }
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('error', onAnyError);
      window.removeEventListener('unhandledrejection', onAnyError);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      for (const ev of gestureEvents) window.removeEventListener(ev, onGesture, true);
      doc.removeEventListener('visibilitychange', onVisibility);
      doc.removeEventListener('fullscreenchange', onFsChange);
      doc.removeEventListener('pointerlockchange', onPointerLockChange);
      el.innerHTML = '';
      el.classList.remove('vc-root');
      window.__gameBooted = false;
      current = null;
    },
  };
  current = handle;
  try { el.__vcGame = handle; } catch (e) {}

  // ---- puesta en marcha (ARRANCA SOLO, sin botones ni gestos) ------------
  (async () => {
    log('[lib] ' + VERSION + ' · build=' + buildUrl + ' streamed=' + streamedUrl);
    if (typeof location !== 'undefined') {
      log('buildTag ' + VERSION + ' (si no ves este tag, recarga con Ctrl+Shift+R)');
      if (opts.title) { try { doc.title = '[vc ' + VERSION + '] GTA Vice City'; } catch (e) {} }
    }
    if (!window.crossOriginIsolated) {
      log('[err] crossOriginIsolated=false: hacen falta COOP/COEP (same-origin + require-corp) para los pthreads del motor.');
    }
    progress('probe', null, 'Comprobando build…');

    const b = await probeBuild();
    if (!b.ok) {
      handle.ok = false;
      if (opts.requireBuild) {
        return fail(
          `Falta el build de WebAssembly en <code>${buildUrl}</code> (reVC.js / reVC.wasm / reVC.data).`,
          '<ul><li>Compílalo: <code>gta_vc_browser\\build.bat</code> + <code>emmake ninja -C gta_vc_browser\\build\\web</code>.</li>' +
          '<li>O apunta <code>buildUrl</code> a donde lo tengas servido.</li></ul>');
      }
      log('[lib] build incompleto: se arranca igual (requireBuild:false)');
    }

    const d = await probeData();
    if (!d.ok) {
      handle.ok = false;
      const list = '<ul>' + d.missing.map((k) => `<li><code>${k}</code></li>`).join('') + '</ul>';
      if (opts.requireData) {
        if (d.reason === 'sin-manifiesto') {
          if (d.assets) return fail(`No se encontró <code>${manifestUrl}</code>: sin ese índice no se pueden pedir los datos sueltos.`,
            '<ul><li>Genera los datos y su manifiesto (pipeline del README, pasos 2-7).</li></ul>');
          return fail('Faltan los datos del juego (ni <code>' + manifestUrl + '</code> ni la copia original en <code>' + assetsUrl + '</code>).',
            '<ul><li>Coloca tu copia legal del juego en <code>' + assetsUrl + '</code> y corre el pipeline de datos (README).</li></ul>');
        }
        if (d.assets) return fail('Los datos sueltos están incompletos en <code>' + streamedUrl + '</code>.', list +
          '<ul><li>Corre el pipeline de datos (README, pasos 2-7).</li></ul>');
        return fail('No hay datos servidos: falta <code>' + streamedUrl + '</code> y no hay copia original en <code>' + assetsUrl + '</code>.', list);
      }
      log('[lib] datos incompletos: se arranca igual (requireData:false)');
    }

    // El pre-js (ondemand.js) lee esta config al cargarse: de aquí salen las
    // rutas de streamed/ y del manifiesto para el motor.
    globalThis.__VC_CFG = {
      streamedUrl, manifestUrl, odtraceUrl: traceUrl, version: VERSION,
      idbCapMB: opts.idbCapMB, warmMB: opts.warmMB, worker: opts.worker !== false,
    };

    progress('build', 0, 'Cargando motor…');
    boot();
  })();

  return handle;
}

export function getGame() { return current; }
export function isRunning() { return !!current && !!current.ok; }

export default startGame;
