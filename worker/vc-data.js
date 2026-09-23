// Public read-only front door for the Vice City data bucket (ADR-015).
//
// It replaces the `r2.dev` URL, which Cloudflare marks as rate-limited and
// unsuitable for production and which cannot set headers. This Worker is free,
// needs no custom domain and lets us control cache, CORS and range requests.
//
// Routes: `https://<worker>/<key>` -> R2 object `<key>`, so the same paths the
// site already uses (`build/reVC.js`, `manifest.json`, `streamed/...`,
// `trailers/vc.mp4`, `vc-streamed.tar.gz`) keep working unchanged.

const CACHE_SECONDS = 86400

function baseHeaders() {
  return {
    // The site fetches cross-origin (Netlify -> this Worker) and runs with
    // COEP `require-corp`, so the response must be a valid CORS one.
    'access-control-allow-origin': '*',
    'access-control-expose-headers': 'content-length, content-range, accept-ranges, etag',
    'accept-ranges': 'bytes',
  }
}

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: baseHeaders() })
    }

    const url = new URL(request.url)
    let key = ''
    try {
      key = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    } catch (error) {
      key = ''
    }
    if (!key) return new Response('Not found', { status: 404, headers: baseHeaders() })

    // `range` is what the trailer video and the engine's on-demand loader use.
    // The binding returns range info even for a full get, so the 206 is decided
    // by the request, not by the object.
    const wantsRange = request.headers.has('range')
    let object = null
    try {
      object = await env.VC.get(key, wantsRange ? { range: request.headers } : undefined)
    } catch (error) {
      // Unsatisfiable range: 416 without guessing the total size.
      return new Response(null, { status: 416, headers: baseHeaders() })
    }
    if (!object) return new Response('Not found', { status: 404, headers: baseHeaders() })

    const headers = new Headers(baseHeaders())
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    headers.set('cache-control', `public, max-age=${CACHE_SECONDS}`)

    let status = 200
    const range = wantsRange ? object.range : null
    if (range && typeof range.offset === 'number') {
      const length = typeof range.length === 'number' ? range.length : object.size - range.offset
      headers.set(
        'content-range',
        `bytes ${range.offset}-${range.offset + length - 1}/${object.size}`,
      )
      headers.set('content-length', String(length))
      status = 206
    } else if (range && typeof range.suffix === 'number') {
      const length = Math.min(range.suffix, object.size)
      headers.set(
        'content-range',
        `bytes ${object.size - length}-${object.size - 1}/${object.size}`,
      )
      headers.set('content-length', String(length))
      status = 206
    } else {
      headers.set('content-length', String(object.size))
    }

    return new Response(request.method === 'HEAD' ? null : object.body, { status, headers })
  },
}
