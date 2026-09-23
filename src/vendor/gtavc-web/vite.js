// Plugin de Vite para servir lo que la librería pide por HTTP:
//   /streamed/*  datos sueltos on-demand (fuera del root de Vite)
//   /vc/*        copia legal original (solo la mira la página si falta streamed)
//   /odtrace     trazas de depuración (POST) -> fichero
//   /streamed-status, /assets-status   estado sin 404s en consola
// Además añade COOP/COEP (SharedArrayBuffer = pthreads del motor).
//
// Lo usa la página de desarrollo de este repo y sirve tal cual para un host
// Vue:  import { vcWeb } from '@re3/gtavc-web/vite';  plugins: [vcWeb({...})]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const norm = (u, d) => {
  const s = u === undefined || u === null || u === '' ? d : String(u);
  return s.endsWith('/') ? s : s + '/';
};

export function vcWeb(options = {}) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const webRoot = path.resolve(here, '..');                        // gta_vc_browser/web
  const streamedDir = path.resolve(options.streamedDir || path.join(webRoot, '..', 'streamed'));
  const assetsDir = path.resolve(options.assetsDir || path.join(webRoot, '..', 'assets'));
  const publicDir = path.resolve(options.publicDir || path.join(webRoot, 'public'));
  const streamedUrl = norm(options.streamedUrl, '/streamed/');
  const assetsUrl = norm(options.assetsUrl, '/vc/');
  const traceUrl = norm(options.traceUrl, '/odtrace');
  const traceFile = path.resolve(options.traceFile || 'odtrace.log');
  const logs = options.logs === true;                              // *.log al lado del cwd
  const isolated = options.crossOriginIsolated !== false;

  // Un fichero = una respuesta. `notFound` decide si se registra el 404.
  function serveDir(prefix, dir, tag) {
    return (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const abs = path.normalize(path.join(dir, rel));
      if (!abs.startsWith(dir)) { res.statusCode = 403; res.end(); return; }
      fs.stat(abs, (err, st) => {
        if (err || !st.isFile()) {
          if (logs) fs.appendFile(tag + '-404.log', new Date().toISOString() + ' 404 ' + rel + '\n', () => {});
          res.statusCode = 404; res.end('not found');
          return;
        }
        if (logs) fs.appendFile(tag + '-access.log', new Date().toISOString() + ' ' + st.size + ' ' + rel + '\n', () => {});
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', st.size);
        // Sin caché: al regenerar datos (p.ej. sfx.SDT conserva tamaño) el
        // navegador seguía sirviendo la copia vieja durante 24 h.
        res.setHeader('Cache-Control', 'no-store');
        if (req.method === 'HEAD') { res.end(); return; }
        fs.createReadStream(abs).pipe(res);
      });
    };
  }

  // Estado en JSON (siempre 200): la página evita fetches fallidos en consola.
  function statusRoutes() {
    return (req, res, next) => {
      if (req.url === '/streamed-status') {
        const need = ['models/gta3.dir', 'Audio/sfx.SDT', 'data/main.scm', 'TEXT/spanish.gxt'];
        const missing = need.filter((f) => !fs.existsSync(path.join(streamedDir, f)));
        let manifest = false;
        try { manifest = fs.statSync(path.join(publicDir, 'manifest.json')).size > 1000; } catch (e) {}
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: missing.length === 0 && manifest, missing }));
        return;
      }
      if (req.url === '/assets-status') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: fs.existsSync(path.join(assetsDir, 'gta-vc.exe')) }));
        return;
      }
      next();
    };
  }

  // Trazas del motor: POST por lotes. El primer lote de una página nueva
  // (JS build=...) rota el fichero, así la sesión actual siempre está completa.
  function traceRoute() {
    let lines = 0;
    let capped = false;
    const CAP = 200000;
    return (req, res, next) => {
      if (req.url.split('?')[0] !== traceUrl.replace(/\/$/, '')) return next();
      if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        const ts = new Date().toISOString() + ' ';
        const inLines = body.split('\n');
        if (inLines.some((ln) => ln.startsWith('JS build='))) {
          lines = 0; capped = false;
          try { fs.writeFileSync(traceFile, ts + 'rotado: sesion nueva\n'); } catch (e) {}
        }
        let out = '';
        for (const ln of inLines) {
          if (!ln) continue;
          if (lines >= CAP) {
            if (!capped) { capped = true; out += ts + 'ODCAP drop (cap ' + CAP + ')\n'; }
            continue;
          }
          lines++;
          out += ts + ln + '\n';
        }
        if (out) fs.appendFile(traceFile, out, () => {});
        res.end('ok');
      });
    };
  }

  const install = (server) => {
    server.middlewares.use(streamedUrl, serveDir(streamedUrl, streamedDir, 'streamed'));
    server.middlewares.use(assetsUrl, serveDir(assetsUrl, assetsDir, 'assets'));
    server.middlewares.use(statusRoutes());
    server.middlewares.use(traceRoute());
  };

  return {
    name: 'gtavc-web',
    config() {
      if (!isolated) return {};
      // SharedArrayBuffer (pthreads) sólo existe con la página aislada.
      return {
        server: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
        preview: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
      };
    },
    configureServer(server) { install(server); },
    configurePreviewServer(server) { install(server); },   // vite preview también sirve los datos
  };
}

export default vcWeb;
