<!--
  Animated background based on "FaultyTerminal" from vue-bits by David Haz.
  Copyright (c) 2025 David Haz — MIT + Commons Clause License Condition v1.0.
  In use in this portfolio since 2026.
  Permission to use, copy and modify it as part of this website;
  selling or redistributing the component itself is not allowed.
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  createFullscreenTriangle,
  createMesh,
  createProgram,
  createRenderer,
  renderScene,
} from 'khatarsis'
import { useTheme } from '@/composables/useTheme'

type Vec2 = [number, number]

interface FaultyTerminalBackgroundProps {
  scale?: number
  gridMul?: Vec2
  digitSize?: number
  timeScale?: number
  pause?: boolean
  scanlineIntensity?: number
  glitchAmount?: number
  flickerAmount?: number
  noiseAmp?: number
  chromaticAberration?: number
  dither?: number
  curvature?: number
  tint?: string
  mouseReact?: boolean
  mouseStrength?: number
  active?: boolean
  fps?: number
  dpr?: number
  drawScale?: number
  pageLoadAnimation?: boolean
  brightness?: number
  lightBackground?: string
  lightInk?: string
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
uniform float uScale;

uniform vec2  uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3  uTint;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform float uBrightness;
uniform vec3  uBackground;
uniform vec3  uInk;

float time;

float hash21(vec2 p){
  p = fract(p * 234.56);
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float noise(vec2 p)
{
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2;
}

mat2 rotate(float angle)
{
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p)
{
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5 * uNoiseAmp;

  mat2 modify0 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify0 * p * 2.0;
  amp *= 0.454545;

  mat2 modify1 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify1 * p * 2.0;
  amp *= 0.454545;

  mat2 modify2 = rotate(time * 0.08);
  f += amp * noise(p);

  return f;
}

float pattern(vec2 p, out vec2 q, out vec2 r) {
  vec2 offset1 = vec2(1.0);
  vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * time);
  mat2 rot1 = rotate(0.1);

  q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
  r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
  return fbm(p + r);
}

float digit(vec2 p){
    vec2 grid = uGridMul * 15.0;
    vec2 s = floor(p * grid) / grid;
    p = p * grid;
    vec2 q, r;
    float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;

    if(uUseMouse > 0.5){
        vec2 mouseWorld = uMouse * uScale;
        float distToMouse = distance(s, mouseWorld);
        float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
        intensity += mouseInfluence;

        float ripple = sin(distToMouse * 20.0 - iTime * 5.0) * 0.1 * mouseInfluence;
        intensity += ripple;
    }

    if(uUsePageLoadAnimation > 0.5){
        float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
        float cellDelay = cellRandom * 0.8;
        float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);

        float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
        intensity *= fadeAlpha;
    }

    p = fract(p);
    p *= uDigitSize;

    float px5 = p.x * 5.0;
    float py5 = (1.0 - p.y) * 5.0;
    float x = fract(px5);
    float y = fract(py5);

    float i = floor(py5) - 2.0;
    float j = floor(px5) - 2.0;
    float n = i * i + j * j;
    float f = n * 0.0625;

    float isOn = step(0.1, intensity - f);
    float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);

    return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightness;
}

float onOff(float a, float b, float c)
{
  return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
}

float displace(vec2 look)
{
    float y = look.y - mod(iTime * 0.25, 1.0);
    float window = 1.0 / (1.0 + 50.0 * y * y);
    return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window;
}

vec3 getColor(vec2 p){

    float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
    bar *= uScanlineIntensity;

    float displacement = displace(p);
    p.x += displacement;

    if (uGlitchAmount != 1.0) {
      float extra = displacement * (uGlitchAmount - 1.0);
      p.x += extra;
    }

    float middle = digit(p);

    const float off = 0.002;
    float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
                digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));

    vec3 baseColor = vec3(0.9) * middle + sum * 0.1 * vec3(1.0) * bar;
    return baseColor;
}

vec2 barrel(vec2 uv){
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + uCurvature * r2;
  return c * 0.5 + 0.5;
}

void main() {
    time = iTime * 0.333333;
    vec2 uv = vUv;

    if(uCurvature != 0.0){
      uv = barrel(uv);
    }

    vec2 p = uv * uScale;
    vec3 col = getColor(p);

    if(uChromaticAberration != 0.0){
      vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
      col.r = getColor(p + ca).r;
      col.b = getColor(p - ca).b;
    }

    col *= uTint;
    col *= uBrightness;

    vec3 emission = uTint * uBrightness;
    float emissionMax = max(max(emission.r, emission.g), emission.b);
    float mask = clamp(max(max(col.r, col.g), col.b) / max(emissionMax, 0.0001), 0.0, 1.0);
    col = mix(uBackground, uInk, mask);

    if(uDither > 0.0){
      float rnd = hash21(gl_FragCoord.xy);
      col += (rnd - 0.5) * (uDither * 0.003922);
    }

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

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

const props = withDefaults(defineProps<FaultyTerminalBackgroundProps>(), {
  scale: 2.5,
  gridMul: () => [2, 1],
  digitSize: 1.5,
  timeScale: 0.3,
  pause: false,
  scanlineIntensity: 0.4,
  glitchAmount: 1.5,
  flickerAmount: 1,
  noiseAmp: 1,
  chromaticAberration: 0.7,
  dither: 0.7,
  curvature: 0.3,
  tint: '#995CD0',
  mouseReact: true,
  mouseStrength: 0.5,
  active: true,
  fps: 0,
  dpr: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2),
  drawScale: 1,
  pageLoadAnimation: true,
  brightness: 0.5,
  lightBackground: '#fff',
  lightInk: '#ddc4fd',
})

const { theme } = useTheme()

const DARK_BACKGROUND = '#000000'

const themeUniforms = () => {
  const isLight = theme.value === 'light'
  const background = hexToRgb(isLight ? props.lightBackground : DARK_BACKGROUND)
  const ink = isLight
    ? hexToRgb(props.lightInk)
    : hexToRgb(props.tint).map(c => c * props.brightness)
  return {
    uBackground: new Float32Array(background),
    uInk: new Float32Array(ink),
  }
}

const container = ref<HTMLElement | null>(null)

let rafId = 0
let running = false
let resizeObserver: ResizeObserver | null = null
let renderer: ReturnType<typeof createRenderer> | null = null
let program: ReturnType<typeof createProgram> | null = null
let mesh: ReturnType<typeof createMesh> | null = null
let frozenTime = 0
let loadAnimationStart = 0
let timeOffset = Math.random() * 100
const mouse = { x: 0.5, y: 0.5 }
const smoothMouse = { x: 0.5, y: 0.5 }
const mouseArray = new Float32Array([0.5, 0.5])

const resolveScale = (): number => {
  if (typeof window === 'undefined') return props.scale
  if (window.matchMedia('(min-width: 1024px)').matches) return props.scale
  if (window.matchMedia('(min-width: 768px)').matches) return 1
  return 0.5
}

const responsiveScale = ref(resolveScale())

let largeScreenQuery: MediaQueryList | null = null
let mediumScreenQuery: MediaQueryList | null = null

const applyThemeUniforms = () => {
  if (!program) return
  const { uBackground, uInk } = themeUniforms()
  program.setUniform('uBackground', uBackground)
  program.setUniform('uInk', uInk)
  if (!running && renderer && mesh) renderScene(renderer.gl, mesh)
}

const handleScaleChange = () => {
  responsiveScale.value = resolveScale()
  if (!program) return
  program.setUniform('uScale', responsiveScale.value)
  if (!running && renderer && mesh) renderScene(renderer.gl, mesh)
}

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

function resize() {
  const ctn = container.value
  if (!ctn || !renderer || !program || !mesh) return
  const w = Math.max(1, Math.floor(ctn.offsetWidth * props.drawScale))
  const h = Math.max(1, Math.floor(ctn.offsetHeight * props.drawScale))
  renderer.setSize(w, h)
  const { canvas } = renderer
  program.setUniform(
    'iResolution',
    new Float32Array([canvas.width, canvas.height, canvas.width / Math.max(1, canvas.height)]),
  )
  if (!running) renderScene(renderer.gl, mesh!)
}

function renderFrame(t: number) {
  if (!renderer || !program || !mesh) return

  if (props.pageLoadAnimation && loadAnimationStart === 0) loadAnimationStart = t

  if (!props.pause) {
    const elapsed = (t * 0.001 + timeOffset) * props.timeScale
    program.setUniform('iTime', elapsed)
    frozenTime = elapsed
  } else {
    program.setUniform('iTime', frozenTime)
  }

  if (props.pageLoadAnimation && loadAnimationStart > 0) {
    const progress = Math.min((t - loadAnimationStart) / 2000, 1)
    program.setUniform('uPageLoadProgress', progress)
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

let lastFrameTime = 0

function frame(t: number) {
  if (!running || !props.active || !renderer || !program || !mesh) return
  rafId = requestAnimationFrame(frame)

  if (props.fps > 0 && t - lastFrameTime < 1000 / props.fps) return
  lastFrameTime = t

  renderFrame(t)
}

function startLoop() {
  if (running) return
  running = true
  rafId = requestAnimationFrame(frame)
}

watch(
  () => props.drawScale,
  () => {
    if (renderer && program) resize()
  },
)

watch(theme, applyThemeUniforms)

watch(
  () => props.active,
  value => {
    if (!running && value && !prefersReducedMotion() && !props.pause) startLoop()
  },
)

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
        uScale: responsiveScale.value,
        uGridMul: new Float32Array(props.gridMul),
        uDigitSize: props.digitSize,
        uScanlineIntensity: props.scanlineIntensity,
        uGlitchAmount: props.glitchAmount,
        uFlickerAmount: props.flickerAmount,
        uNoiseAmp: props.noiseAmp,
        uChromaticAberration: props.chromaticAberration,
        uDither: props.dither,
        uCurvature: props.curvature,
        uTint: new Float32Array(tint),
        uMouse: mouseArray,
        uMouseStrength: props.mouseStrength,
        uUseMouse: props.mouseReact ? 1 : 0,
        uPageLoadProgress: props.pageLoadAnimation ? 0 : 1,
        uUsePageLoadAnimation: props.pageLoadAnimation ? 1 : 0,
        uBrightness: props.brightness,
        ...themeUniforms(),
      },
    })

    mesh = createMesh(gl, { geometry: createFullscreenTriangle(gl), program })
    ctn.appendChild(canvas)

    resizeObserver = new ResizeObserver(() => resize())
    resizeObserver.observe(ctn)
    resize()

    if (!prefersReducedMotion() && !props.pause) renderFrame(performance.now())

    if (props.mouseReact) window.addEventListener('pointermove', handleMouseMove, { passive: true })
    document.addEventListener('visibilitychange', handleVisibility)

    largeScreenQuery = window.matchMedia('(min-width: 1024px)')
    mediumScreenQuery = window.matchMedia('(min-width: 768px)')
    largeScreenQuery.addEventListener('change', handleScaleChange)
    mediumScreenQuery.addEventListener('change', handleScaleChange)

    if (prefersReducedMotion() || props.pause) {
      program.setUniform('iTime', 0)
      program.setUniform('uPageLoadProgress', 1)
      renderScene(gl, mesh)
    } else if (props.active) {
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
  largeScreenQuery?.removeEventListener('change', handleScaleChange)
  mediumScreenQuery?.removeEventListener('change', handleScaleChange)
  largeScreenQuery = null
  mediumScreenQuery = null
  if (renderer) {
    if (renderer.canvas.parentElement === container.value)
      container.value?.removeChild(renderer.canvas)
    renderer.loseContext()
  }
  renderer = null
  program = null
  mesh = null
  loadAnimationStart = 0
  lastFrameTime = 0
  timeOffset = Math.random() * 100
})
</script>

<template>
  <div ref="container" class="pointer-events-none fixed inset-0 -z-20" aria-hidden="true" />
</template>
