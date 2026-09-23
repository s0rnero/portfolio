<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { isFlashVisible } from '@/composables/useStaticFlash'
import { useTheme } from '@/composables/useTheme'
import {
  createFullscreenTriangle,
  createMesh,
  createProgram,
  createRenderer,
  renderScene,
} from 'khatarsis'
import { prefersReducedMotion } from '@/composables/useReveal'

interface TvStaticBackgroundProps {
  grainScale?: number
  grainSpeed?: number
  density?: number
  contrast?: number
  brightness?: number
  lightContrast?: number
  lightBrightness?: number
  curvature?: number
  lineJitter?: number
  rgbShift?: number
  scanlineStrength?: number
  scanlineFrequency?: number
  vignette?: number
  flicker?: number
  tint?: string
  interlace?: boolean
  mouseReact?: boolean
  mouseStrength?: number
  pause?: boolean
  overlay?: boolean
  active?: boolean
  fps?: number
  dpr?: number
}

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShader = `
precision mediump float;

varying vec2 vUv;

uniform float iTime;
uniform vec3  iResolution;
uniform float uGrainScale;
uniform float uGrainSpeed;
uniform float uDensity;
uniform float uContrast;
uniform float uBrightness;
uniform float uCurvature;
uniform float uLineJitter;
uniform float uRgbShift;
uniform float uScanlineStrength;
uniform float uScanlineFrequency;
uniform float uVignette;
uniform float uFlicker;
uniform vec3  uTint;
uniform float uInterlace;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;

const float PI = 3.141592653589793;

float hash21(vec2 p){
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float snow(vec2 uv){
  vec2 q = uv * vec2(iResolution.z, 1.0);
  vec2 cell = floor(q * uGrainScale);

  float seed = floor(iTime * uGrainSpeed);
  if (uInterlace > 0.5) seed += mod(cell.y, 2.0) * 0.5;

  float g = hash21(cell + vec2(seed * 0.618, seed * 0.382));
  float c01 = (g - 0.5) * 2.0;
  float dead = 1.0 - uDensity;
  float s = sign(c01) * max(0.0, (abs(c01) - dead) / max(uDensity, 0.0001));
  float v = 0.5 + s * uContrast * 0.5;

  if (uUseMouse > 0.5) {
    vec2 m = uMouse * vec2(iResolution.z, 1.0);
    float distToMouse = distance(q, m);
    v += exp(-distToMouse * 6.0) * uMouseStrength * 0.35;
  }

  return clamp(v, 0.0, 1.0);
}

void main(){
  vec2 uv = vUv;

  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + uCurvature * r2;
  vec2 cuv = c * 0.5 + 0.5;

  float seedH = floor(iTime * uGrainSpeed);
  float lineIdx = floor(cuv.y * uScanlineFrequency);
  cuv.x += (hash21(vec2(lineIdx, seedH)) - 0.5) * 2.0 * uLineJitter;

  float sR = snow(cuv + vec2(uRgbShift, 0.0));
  float sG = snow(cuv);
  float sB = snow(cuv - vec2(uRgbShift, 0.0));
  vec3 col = vec3(sR, sG, sB);

  col *= 1.0 - uScanlineStrength * (0.5 + 0.5 * cos(cuv.y * PI * uScanlineFrequency));

  float edge = 1.0 - dot(uv - 0.5, uv - 0.5) * 2.5;
  col *= mix(1.0, smoothstep(0.0, 1.0, clamp(edge, 0.0, 1.0)), uVignette);

  float fl = 1.0 - uFlicker * (0.5 + 0.5 * sin(iTime * 8.0 + sin(iTime * 1.7) * 3.0));
  col *= fl * uBrightness;

  col *= uTint;

  gl_FragColor = vec4(col, 1.0);
}
`

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim()
  if (h.length === 3)
    h = h
      .split('')
      .map(c => c + c)
      .join('')
  const num = parseInt(h, 16)
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255]
}

const props = withDefaults(defineProps<TvStaticBackgroundProps>(), {
  grainScale: 420,
  grainSpeed: 15,
  density: 0.75,
  contrast: 0.5,
  brightness: 0.5,
  lightContrast: 1,
  lightBrightness: 1.5,
  curvature: 0.25,
  lineJitter: 0.0025,
  rgbShift: 0.0012,
  scanlineStrength: 0.15,
  scanlineFrequency: 400,
  vignette: 0.35,
  flicker: 0.06,
  tint: '#ffffff',
  interlace: true,
  mouseReact: false,
  mouseStrength: 0.3,
  pause: false,
  overlay: false,
  active: true,
  fps: 20,
  dpr: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2),
})

const { theme } = useTheme()

const layerClass = computed(() => {
  if (props.overlay) return 'z-50'
  return isFlashVisible.value ? '-z-10' : '-z-30'
})

const container = ref<HTMLElement | null>(null)

let rafId = 0
let running = false
let lastFrame = 0
let resizeObserver: ResizeObserver | null = null
let renderer: ReturnType<typeof createRenderer> | null = null
let program: ReturnType<typeof createProgram> | null = null
let mesh: ReturnType<typeof createMesh> | null = null
let frozenTime = 0
let timeOffset = Math.random() * 100
const mouse = { x: 0.5, y: 0.5 }
const smoothMouse = { x: 0.5, y: 0.5 }
const mouseArray = new Float32Array([0.5, 0.5])

const noiseUniforms = () => {
  const isLight = theme.value === 'light'
  return {
    uContrast: isLight ? props.lightContrast : props.contrast,
    uBrightness: isLight ? props.lightBrightness : props.brightness,
  }
}

const applyThemeUniforms = () => {
  if (!program) return
  const { uContrast, uBrightness } = noiseUniforms()
  program.setUniform('uContrast', uContrast)
  program.setUniform('uBrightness', uBrightness)
  if (!running && renderer && mesh) renderScene(renderer.gl, mesh)
}

watch(theme, applyThemeUniforms)

function handleMouseMove(e: PointerEvent) {
  const ctn = container.value
  if (!ctn) return
  const rect = ctn.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return
  mouse.x = (e.clientX - rect.left) / rect.width
  mouse.y = 1 - (e.clientY - rect.top) / rect.height
}

function handleVisibility() {
  if (!renderer || !program || !mesh) return
  if (document.hidden || !props.active) {
    running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
  } else if (!prefersReducedMotion() && !props.pause) {
    startLoop()
  }
}

watch(
  () => props.active,
  value => {
    if (!value) {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
      return
    }
    if (!prefersReducedMotion() && !props.pause) startLoop()
    else if (renderer && mesh) renderScene(renderer.gl, mesh)
  },
)

function resize() {
  const ctn = container.value
  if (!ctn || !renderer || !program) return
  if (!ctn.offsetWidth || !ctn.offsetHeight) return
  renderer.setSize(ctn.offsetWidth, ctn.offsetHeight)
  const { canvas } = renderer
  program.setUniform(
    'iResolution',
    new Float32Array([canvas.width, canvas.height, canvas.width / Math.max(1, canvas.height)]),
  )
}

function frame(t: number) {
  if (!running || !props.active || !renderer || !program || !mesh) return
  rafId = requestAnimationFrame(frame)

  if (t - lastFrame < 1000 / Math.max(1, props.fps)) return
  lastFrame = t

  if (props.pause) {
    program.setUniform('iTime', frozenTime)
  } else {
    const elapsed = t * 0.001 + timeOffset
    program.setUniform('iTime', elapsed)
    frozenTime = elapsed
  }

  if (props.mouseReact) {
    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08
    mouseArray[0] = smoothMouse.x
    mouseArray[1] = smoothMouse.y
    program.setUniform('uMouse', mouseArray)
  }

  renderScene(renderer.gl, mesh)
}

function startLoop() {
  if (running) return
  running = true
  rafId = requestAnimationFrame(frame)
}

onMounted(() => {
  const ctn = container.value
  if (!ctn) return

  try {
    renderer = createRenderer({ dpr: props.dpr })
    const { gl, canvas } = renderer
    const tint = hexToRgb(props.tint)

    program = createProgram(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: 0,
        iResolution: new Float32Array([canvas.width, canvas.height, 1]),
        uGrainScale: props.grainScale,
        uGrainSpeed: props.grainSpeed,
        uDensity: props.density,
        ...noiseUniforms(),
        uCurvature: props.curvature,
        uLineJitter: props.lineJitter,
        uRgbShift: props.rgbShift,
        uScanlineStrength: props.scanlineStrength,
        uScanlineFrequency: props.scanlineFrequency,
        uVignette: props.vignette,
        uFlicker: props.flicker,
        uTint: new Float32Array(tint),
        uInterlace: props.interlace ? 1 : 0,
        uMouse: mouseArray,
        uMouseStrength: props.mouseStrength,
        uUseMouse: props.mouseReact ? 1 : 0,
      },
    })

    mesh = createMesh(gl, { geometry: createFullscreenTriangle(gl), program })
    ctn.appendChild(canvas)

    resizeObserver = new ResizeObserver(() => resize())
    resizeObserver.observe(ctn)
    resize()

    if (props.mouseReact) window.addEventListener('pointermove', handleMouseMove, { passive: true })
    document.addEventListener('visibilitychange', handleVisibility)

    if (prefersReducedMotion() || props.pause) {
      program.setUniform('iTime', 0)
      renderScene(gl, mesh)
    } else {
      startLoop()
    }
  } catch {
    renderer = null
    program = null
    mesh = null
  }
})

onBeforeUnmount(() => {
  running = false
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('pointermove', handleMouseMove)
  document.removeEventListener('visibilitychange', handleVisibility)
  if (renderer) {
    if (renderer.canvas.parentElement === container.value)
      container.value?.removeChild(renderer.canvas)
    renderer.loseContext()
  }
  renderer = null
  program = null
  mesh = null
  lastFrame = 0
  timeOffset = Math.random() * 100
})
</script>

<template>
  <div
    :class="layerClass"
    ref="container"
    class="pointer-events-none fixed inset-0"
    aria-hidden="true"
  />
</template>
