<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'khatarsis'
import { isTrickActive } from '@/composables/useVCCode'
import {
  dismissVideoOnEnd,
  isGameReady,
  isVideoFaded,
  isVideoHidden,
  markGameReady,
  markVideoStarted,
} from '@/composables/useVCGame'
import { startGame, VERSION } from '@/vendor/gtavc-web/index.js'

const gameHost = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const hasVideoStarted = ref(false)
const hasGameStarted = ref(false)
const isPreloading = ref(false)
const isVideoPlaying = ref(false)
// One single bar for the whole preparation: the engine download takes the first
// fifth and the full game data the rest, and it does not finish until the game is
// about to run.
const BUILD_BAR_SHARE = 20
const buildPct = ref(0)
const prefetchPct = ref(0)
const prefetchStarted = ref(false)
const loadPct = computed(() =>
  prefetchStarted.value
    ? Math.round(BUILD_BAR_SHARE + (prefetchPct.value * (100 - BUILD_BAR_SHARE)) / 100)
    : Math.round((buildPct.value * BUILD_BAR_SHARE) / 100),
)

const { t } = useI18n()

const BUILD_FILES = ['reVC.wasm', 'reVC.data']
// Versioned with the engine: bumping the vendor tag invalidates the cache.
const BUILD_CACHE = `vc-build-${VERSION}`
const TOAST_VISIBLE_MS = 8000
const VOLUME_FADE_MS = 3000
const VOLUME_STEP_MS = 100

let volumeTimer: number | undefined
const ESC_HOLD_MS = 3000

let escTimer: number | undefined

const readGameUrl = (key: string, fallback: string): string => {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

// Served outside git (dev: public/game, deploy: R2 via env): never bundled.
const trailerUrl = readGameUrl('VITE_VC_TRAILER_URL', '/game/trailers/vc.mp4')

const handleStartVideo = () => {
  const element = video.value
  if (!element || hasVideoStarted.value) return
  hasVideoStarted.value = true
  markVideoStarted()
  element.muted = false
  element.volume = 0
  void element
    .play()
    .then(() => {
      // Initial fade: raise the volume from silence once actually playing.
      const steps = VOLUME_FADE_MS / VOLUME_STEP_MS
      let step = 0
      window.clearInterval(volumeTimer)
      volumeTimer = window.setInterval(() => {
        step += 1
        element.volume = Math.min(1, step / steps)
        if (step >= steps) {
          window.clearInterval(volumeTimer)
          volumeTimer = undefined
        }
      }, VOLUME_STEP_MS)
    })
    .catch(() => {
      // Autoplay can be rejected after the deferred activation: the trailer stays paused,
      // the failure is reported in the visual review and it is never muted silently.
    })
}

const handleVideoPlaying = () => {
  isVideoPlaying.value = true
}

const withTrailingSlash = (url: string): string => (url.endsWith('/') ? url : `${url}/`)

const fileSize = async (url: string): Promise<number> => {
  // Cache hit carries its own content-length: no HEAD request needed.
  if (typeof caches !== 'undefined') {
    try {
      const hit = await (await caches.open(BUILD_CACHE)).match(url)
      if (hit) return Number(hit.headers.get('content-length') ?? 0)
    } catch {
      // Cache miss: fall through to HEAD.
    }
  }
  const head = await fetch(url, { method: 'HEAD' })
  return Number(head.headers.get('content-length') ?? 0)
}

const cachedFetch = async (url: string): Promise<Response> => {
  let cache: Cache | null = null
  if (typeof caches !== 'undefined') {
    try {
      cache = await caches.open(BUILD_CACHE)
      const hit = await cache.match(url)
      if (hit) return hit
    } catch {
      cache = null
    }
  }
  const response = await fetch(url)
  if (cache && response.ok) {
    try {
      await cache.put(url, response.clone())
    } catch {
      // Quota exceeded: fall back to the network copy.
    }
  }
  return response
}

const purgeOldBuildCaches = async (): Promise<void> => {
  try {
    if (typeof caches === 'undefined') return
    const names = await caches.keys()
    await Promise.all(
      names
        .filter(name => name.startsWith('vc-build-') && name !== BUILD_CACHE)
        .map(name => caches.delete(name)),
    )
  } catch {
    // Cache cleanup is best-effort.
  }
}

const preloadBuildFile = async (
  url: string,
  finishedBytes: number,
  totalBytes: number,
): Promise<number> => {
  const response = await cachedFetch(url)
  if (!response.ok || !response.body) throw new Error(`preload failed: ${url}`)
  const reader = response.body.getReader()
  let loadedBytes = 0
  while (true) {
    const chunk = await reader.read()
    if (chunk.done) break
    loadedBytes += chunk.value.byteLength
    if (totalBytes > 0) {
      buildPct.value = Math.min(100, Math.round((100 * (finishedBytes + loadedBytes)) / totalBytes))
    }
  }
  return loadedBytes
}

// The data download runs before the game starts (`prefetch`), so the bar never
// disappears in between: it only ends when the engine reports it is done.
const handleGameProgress = (info: { phase: string; pct: number | null; busy: boolean }): void => {
  if (info.phase !== 'prefetch') return
  prefetchStarted.value = true
  if (info.pct !== null && info.pct !== undefined) prefetchPct.value = Math.round(info.pct * 100)
  if (info.busy !== true) {
    prefetchPct.value = 100
    isPreloading.value = false
  }
}

const handleStartGame = async (): Promise<void> => {
  const host = gameHost.value
  if (!host || hasGameStarted.value) return
  hasGameStarted.value = true
  await purgeOldBuildCaches()
  const base = withTrailingSlash(readGameUrl('VITE_VC_BUILD_URL', '/game/build/'))
  isPreloading.value = true
  buildPct.value = 0
  prefetchStarted.value = false
  prefetchPct.value = 0
  try {
    let totalBytes = 0
    for (const file of BUILD_FILES) totalBytes += await fileSize(base + file)
    let finishedBytes = 0
    for (const file of BUILD_FILES) {
      finishedBytes += await preloadBuildFile(base + file, finishedBytes, totalBytes)
    }
    buildPct.value = 100
  } catch {
    // Best-effort preload: the engine fetch below reports failures itself.
  }
  // The bar stays up on purpose: the engine now mounts the runtime and downloads
  // the whole game data, and only then does the game start.
  const previousFrame = window.__vcFrame
  startGame({
    el: host,
    fill: 'parent',
    title: false,
    traceUrl: null,
    buildUrl: readGameUrl('VITE_VC_BUILD_URL', '/game/build/'),
    streamedUrl: readGameUrl('VITE_VC_STREAMED_URL', '/streamed/'),
    manifestUrl: readGameUrl('VITE_VC_MANIFEST_URL', '/game/manifest.json'),
    // The streamed data is 1,34 GB: the 900 MB default cap made the cache evict
    // (and re-download) data mid-game. No cap = what was fetched stays.
    idbCapMB: 0,
    // Eager preload budget per boot. It only pays off when the host is slow:
    // now every file is already in IndexedDB and reads are instant, so a big
    // budget is pure RAM (256 MB were being pulled into memory for nothing).
    warmMB: 64,
    // On-demand was the whole problem: txd/dff arrived mid-play, straight from
    // the host, so the game ran at whatever the bucket answered. This walks the
    // manifest once and the game does not start until it is all local.
    prefetch: true,
    prefetchConcurrency: 6,
    // One single request for the whole game data (tar.gz, unpacked straight to
    // the engine cache). Empty = fall back to walking the manifest file by file.
    archiveUrl: readGameUrl('VITE_VC_ARCHIVE_URL', ''),
    onProgress: handleGameProgress,
  })
  window.__vcFrame = () => {
    markGameReady()
    // First frame: the game owns the screen and the bar has done its job.
    isPreloading.value = false
    previousFrame?.()
  }
}

const handleTrickEnd = () => {
  handleStartVideo()
  handleStartGame()
}

const handleVideoEnd = () => {
  dismissVideoOnEnd()
}

const cancelEscHold = () => {
  if (escTimer !== undefined) {
    window.clearTimeout(escTimer)
    escTimer = undefined
  }
}

const handleEscDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || escTimer !== undefined) return
  if (!isVideoHidden.value) return
  escTimer = window.setTimeout(() => {
    escTimer = undefined
    if (document.pointerLockElement) document.exitPointerLock()
  }, ESC_HOLD_MS)
}

const handleEscUp = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  cancelEscHold()
}

onMounted(() => {
  window.addEventListener('keydown', handleEscDown)
  window.addEventListener('keyup', handleEscUp)
  if (!isTrickActive.value) handleTrickEnd()
})

watch(isTrickActive, active => {
  if (!active) handleTrickEnd()
})

watch([isVideoHidden, isGameReady], ([hidden, ready]) => {
  if (hidden && ready) {
    toast({
      description: t('game.setupHint'),
      position: 'top-center',
      duration: TOAST_VISIBLE_MS,
      class: 'k-toast-full-text',
    })
  }
  if (hidden) video.value?.pause()
})

watch(isVideoFaded, faded => {
  if (!faded) return
  // The revealing Enter still counts as a user gesture: take pointer lock like
  // a canvas click does, so mouse look works without an extra click.
  const canvas = gameHost.value?.querySelector('canvas')
  if (!canvas) return
  try {
    const lock = canvas.requestPointerLock() as unknown as Promise<void> | undefined
    lock?.catch(() => {
      // No gesture (the video ended on its own): the first click locks instead.
    })
  } catch {
    // Older browsers throw synchronously when lock is unavailable.
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscDown)
  window.removeEventListener('keyup', handleEscUp)
  cancelEscHold()
  window.clearInterval(volumeTimer)
  volumeTimer = undefined
  // The wasm module cannot be freed inside a page: the shell mounts once
  // per page load, so the live game instance intentionally outlives this view.
})
</script>

<template>
  <div class="fixed inset-0 z-40 bg-black">
    <div ref="gameHost" class="absolute inset-0" />
    <k-toast />
    <div v-if="!isVideoHidden" class="absolute inset-0 z-50 bg-black" aria-hidden="true">
      <video
        :src="trailerUrl"
        :class="isVideoFaded || !isVideoPlaying ? 'opacity-0' : 'opacity-100'"
        crossorigin="anonymous"
        ref="video"
        class="size-full object-cover transition-opacity duration-700"
        preload="metadata"
        playsinline
        @ended="handleVideoEnd"
        @playing="handleVideoPlaying"
      />
    </div>
    <div v-if="isPreloading" class="absolute inset-x-0 top-0 z-50" aria-hidden="true">
      <div class="h-1 w-full bg-white/20">
        <div
          :style="{ width: `${loadPct}%` }"
          class="h-1 bg-pink-500 transition-all duration-150"
        />
      </div>
    </div>
  </div>
</template>
