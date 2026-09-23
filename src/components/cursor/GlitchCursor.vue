<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/composables/useReveal'
import { useTheme } from '@/composables/useTheme'

const position = ref({ x: -100, y: -100 })
// Direct DOM handle: high-frequency pointer updates bypass Vue reactivity.
const cursorElement = ref<HTMLElement | null>(null)

const ACTIVE_MS = 3000
const PAUSE_MS = 8000
const EDGE_MARGIN_PX = 24

const isGlitching = ref(false)
const isOutside = ref(false)
const isPointer = ref(false)
const supportsCursor = ref(false)
const POINTER_SELECTOR =
  'a, button, input, select, textarea, label, summary, [role="button"], [role="link"], [data-cursor="pointer"]'
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'
let nearEdge = false
let cycleTimer: number | null = null
let isAttached = false
let pointerQuery: MediaQueryList | null = null
const isReducedMotion = prefersReducedMotion()
const { theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
let lastEvent: MouseEvent | null = null
let rafId: number | null = null

const clearCycle = () => {
  if (cycleTimer !== null) {
    window.clearTimeout(cycleTimer)
    cycleTimer = null
  }
}

const startActivePhase = () => {
  isGlitching.value = true
  cycleTimer = window.setTimeout(() => {
    cycleTimer = null
    isGlitching.value = false
    schedulePause()
  }, ACTIVE_MS)
}

const schedulePause = () => {
  cycleTimer = window.setTimeout(() => {
    cycleTimer = null
    startActivePhase()
  }, PAUSE_MS)
}

const setEdgeMode = (active: boolean) => {
  if (active === nearEdge) return
  nearEdge = active
  if (active) {
    clearCycle()
    isGlitching.value = true
  } else if (!isOutside.value) {
    clearCycle()
    startActivePhase()
  }
}

const checkEdge = (x: number, y: number) => {
  setEdgeMode(
    x <= EDGE_MARGIN_PX ||
      y <= EDGE_MARGIN_PX ||
      x >= window.innerWidth - EDGE_MARGIN_PX ||
      y >= window.innerHeight - EDGE_MARGIN_PX,
  )
}

const handlePointerLeave = () => {
  nearEdge = false
  clearCycle()
  isOutside.value = true
}

const handlePointerEnter = (event: MouseEvent) => {
  clearCycle()
  lastEvent = event
  isOutside.value = false
  applyPointerPosition()
  checkEdge(event.clientX, event.clientY)
  if (!nearEdge) startActivePhase()
}

const handlePointerOver = (event: PointerEvent) => {
  const target = event.target as Element | null
  if (!target || typeof target.closest !== 'function') return
  if (target.closest('[disabled], [aria-disabled="true"]')) return
  if (target.closest(POINTER_SELECTOR)) isPointer.value = true
}

const handlePointerOut = (event: PointerEvent) => {
  const related = event.relatedTarget as Element | null
  if (related && typeof related.closest === 'function' && related.closest(POINTER_SELECTOR)) return
  isPointer.value = false
}

const writeTransform = (x: number, y: number) => {
  cursorElement.value?.style.setProperty('transform', `translate3d(${x}px, ${y}px, 0)`)
}

const applyPointerPosition = () => {
  rafId = null
  if (!lastEvent) return
  // Single computation per frame: the DOM write paints immediately while the
  // ref keeps the declarative fallback in sync with the same value.
  const x = lastEvent.clientX - (isPointer.value ? 11 : 5.5)
  const y = lastEvent.clientY - (isPointer.value ? 3 : 1)
  writeTransform(x, y)
  position.value = { x, y }
  checkEdge(lastEvent.clientX, lastEvent.clientY)
}

const handlePointerMove = (event: PointerEvent) => {
  lastEvent = event
  if (rafId === null) {
    rafId = requestAnimationFrame(applyPointerPosition)
  }
}

const attachCursor = () => {
  if (isAttached) return
  isAttached = true
  supportsCursor.value = true
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerover', handlePointerOver, { passive: true })
  window.addEventListener('pointerout', handlePointerOut, { passive: true })
  document.documentElement.addEventListener('mouseleave', handlePointerLeave)
  document.documentElement.addEventListener('mouseenter', handlePointerEnter)
  document.documentElement.classList.add('glitch-cursor-active')
  startActivePhase()
}

const detachCursor = () => {
  if (!isAttached) return
  isAttached = false
  supportsCursor.value = false
  isOutside.value = false
  isPointer.value = false
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerover', handlePointerOver)
  window.removeEventListener('pointerout', handlePointerOut)
  document.documentElement.removeEventListener('mouseleave', handlePointerLeave)
  document.documentElement.removeEventListener('mouseenter', handlePointerEnter)
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  clearCycle()
  document.documentElement.classList.remove('glitch-cursor-active')
}

const handlePointerCapabilityChange = (event: MediaQueryListEvent) => {
  if (event.matches) attachCursor()
  else detachCursor()
}

onMounted(() => {
  pointerQuery = window.matchMedia(FINE_POINTER_QUERY)
  pointerQuery.addEventListener('change', handlePointerCapabilityChange)
  if (!isReducedMotion && pointerQuery.matches) attachCursor()
})

onBeforeUnmount(() => {
  pointerQuery?.removeEventListener('change', handlePointerCapabilityChange)
  pointerQuery = null
  detachCursor()
})
</script>

<template>
  <teleport to="body">
    <div
      ref="cursorElement"
      v-if="supportsCursor"
      v-show="!isOutside"
      :class="{
        'glitch-cursor--active': isGlitching,
        'glitch-cursor--dark': isDark,
        'glitch-cursor--pointer': isPointer,
      }"
      :style="{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }"
      class="glitch-cursor"
      aria-hidden="true"
    >
      <svg
        class="glitch-cursor__layer glitch-cursor__layer--split glitch-cursor__layer--a glitch-cursor__layer--arrow"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M5.5 1 L5.5 19.8 L10.1 15.1 L13.1 23 L16.2 21.5 L13.2 13.7 L18.6 13.7 Z" />
      </svg>
      <svg
        class="glitch-cursor__layer glitch-cursor__layer--split glitch-cursor__layer--b glitch-cursor__layer--arrow"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M5.5 1 L5.5 19.8 L10.1 15.1 L13.1 23 L16.2 21.5 L13.2 13.7 L18.6 13.7 Z" />
      </svg>
      <svg
        class="glitch-cursor__layer glitch-cursor__layer--base glitch-cursor__layer--arrow"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M5.5 1 L5.5 19.8 L10.1 15.1 L13.1 23 L16.2 21.5 L13.2 13.7 L18.6 13.7 Z" />
      </svg>
      <!-- Pointing-hand silhouette from Google Material Symbols touch_app (Apache License 2.0): https://raw.githubusercontent.com/google/material-design-icons/master/src/action/touch_app/materialicons/24px.svg -->
      <svg
        class="glitch-cursor__layer glitch-cursor__layer--split glitch-cursor__layer--a glitch-cursor__layer--hand"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M9,11.24V7.5C9,6.12,10.12,5,11.5,5S14,6.12,14,7.5v3.74c1.21-0.81,2-2.18,2-3.74C16,5.01,13.99,3,11.5,3S7,5.01,7,7.5 C7,9.06,7.79,10.43,9,11.24z M18.84,15.87l-4.54-2.26c-0.17-0.07-0.35-0.11-0.54-0.11H13v-6C13,6.67,12.33,6,11.5,6 S10,6.67,10,7.5v10.74c-3.6-0.76-3.54-0.75-3.67-0.75c-0.31,0-0.59,0.13-0.79,0.33l-0.79,0.8l4.94,4.94 C9.96,23.83,10.34,24,10.75,24h6.79c0.75,0,1.33-0.55,1.44-1.28l0.75-5.27c0.01-0.07,0.02-0.14,0.02-0.2 C19.75,16.63,19.37,16.09,18.84,15.87z"
        />
      </svg>
      <svg
        class="glitch-cursor__layer glitch-cursor__layer--split glitch-cursor__layer--b glitch-cursor__layer--hand"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M9,11.24V7.5C9,6.12,10.12,5,11.5,5S14,6.12,14,7.5v3.74c1.21-0.81,2-2.18,2-3.74C16,5.01,13.99,3,11.5,3S7,5.01,7,7.5 C7,9.06,7.79,10.43,9,11.24z M18.84,15.87l-4.54-2.26c-0.17-0.07-0.35-0.11-0.54-0.11H13v-6C13,6.67,12.33,6,11.5,6 S10,6.67,10,7.5v10.74c-3.6-0.76-3.54-0.75-3.67-0.75c-0.31,0-0.59,0.13-0.79,0.33l-0.79,0.8l4.94,4.94 C9.96,23.83,10.34,24,10.75,24h6.79c0.75,0,1.33-0.55,1.44-1.28l0.75-5.27c0.01-0.07,0.02-0.14,0.02-0.2 C19.75,16.63,19.37,16.09,18.84,15.87z"
        />
      </svg>
      <svg
        class="glitch-cursor__layer glitch-cursor__layer--base glitch-cursor__layer--hand"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M9,11.24V7.5C9,6.12,10.12,5,11.5,5S14,6.12,14,7.5v3.74c1.21-0.81,2-2.18,2-3.74C16,5.01,13.99,3,11.5,3S7,5.01,7,7.5 C7,9.06,7.79,10.43,9,11.24z M18.84,15.87l-4.54-2.26c-0.17-0.07-0.35-0.11-0.54-0.11H13v-6C13,6.67,12.33,6,11.5,6 S10,6.67,10,7.5v10.74c-3.6-0.76-3.54-0.75-3.67-0.75c-0.31,0-0.59,0.13-0.79,0.33l-0.79,0.8l4.94,4.94 C9.96,23.83,10.34,24,10.75,24h6.79c0.75,0,1.33-0.55,1.44-1.28l0.75-5.27c0.01-0.07,0.02-0.14,0.02-0.2 C19.75,16.63,19.37,16.09,18.84,15.87z"
        />
      </svg>
      <span class="glitch-cursor__slice glitch-cursor__slice--top"></span>
      <span class="glitch-cursor__slice glitch-cursor__slice--bottom"></span>
    </div>
  </teleport>
</template>

<style scoped>
:global(html.glitch-cursor-active),
:global(html.glitch-cursor-active *) {
  cursor: none !important;
}

.glitch-cursor {
  position: fixed;
  top: 0;
  left: 0;
  /* Above every in-page layer (drawers, toasts, scroll containers): it is the mouse. */
  z-index: 2147483647;
  width: 26px;
  height: 26px;
  pointer-events: none;
  will-change: transform;
  animation: none;
  --cursor-fill: #000;
  --cursor-stroke: #fff;
}

.glitch-cursor--dark {
  --cursor-fill: #fff;
  --cursor-stroke: #000;
}

.glitch-cursor--active {
  animation: glitch-cursor-jitter 2.4s steps(1) infinite;
}

.glitch-cursor__layer {
  position: absolute;
  inset: 0;
  width: 26px;
  height: 26px;
}

.glitch-cursor__layer--base path {
  fill: var(--cursor-fill);
  stroke: var(--cursor-stroke);
  stroke-width: 1px;
  stroke-linejoin: round;
}

.glitch-cursor__layer--split {
  mix-blend-mode: screen;
  opacity: 0;
  animation: none;
}

.glitch-cursor__layer--split path {
  stroke: none;
  fill: var(--cursor-fill);
}

.glitch-cursor--active .glitch-cursor__layer--a {
  animation: glitch-cursor-split-a 2.4s steps(1) infinite;
}

.glitch-cursor--active .glitch-cursor__layer--b {
  animation: glitch-cursor-split-b 2.4s steps(1) infinite;
}

.glitch-cursor__layer--hand {
  display: none;
}

.glitch-cursor--pointer .glitch-cursor__layer--arrow {
  display: none;
}

.glitch-cursor--pointer .glitch-cursor__layer--hand {
  display: block;
}

.glitch-cursor__slice {
  position: absolute;
  left: 2px;
  width: 22px;
  height: 2px;
  background: var(--cursor-fill);
  mix-blend-mode: screen;
  opacity: 0;
  animation: none;
}

.glitch-cursor__slice--top {
  top: 8px;
}

.glitch-cursor__slice--bottom {
  top: 15px;
}

.glitch-cursor--active .glitch-cursor__slice--top {
  animation: glitch-cursor-slice-top 2.4s steps(1) infinite;
}

.glitch-cursor--active .glitch-cursor__slice--bottom {
  animation: glitch-cursor-slice-bottom 2.4s steps(1) infinite;
}

@keyframes glitch-cursor-jitter {
  0%,
  10%,
  14%,
  45%,
  50%,
  81%,
  86%,
  100% {
    margin-left: 0;
  }
  11% {
    margin-left: 2px;
  }
  12% {
    margin-left: -2px;
  }
  13% {
    margin-left: 1px;
  }
  46% {
    margin-left: -2px;
  }
  48% {
    margin-left: 2px;
  }
  82% {
    margin-left: 2px;
  }
  84% {
    margin-left: -1px;
  }
}

@keyframes glitch-cursor-split-a {
  0%,
  10%,
  14%,
  45%,
  50%,
  81%,
  86%,
  100% {
    opacity: 0;
    transform: translate(0, 0);
  }
  11%,
  12% {
    opacity: 0.85;
    transform: translate(2px, 0);
  }
  46%,
  48% {
    opacity: 0.85;
    transform: translate(1px, 0);
  }
  82%,
  84% {
    opacity: 0.85;
    transform: translate(2px, 0);
  }
}

@keyframes glitch-cursor-split-b {
  0%,
  10%,
  14%,
  45%,
  50%,
  81%,
  86%,
  100% {
    opacity: 0;
    transform: translate(0, 0);
  }
  11%,
  12% {
    opacity: 0.85;
    transform: translate(-2px, 0);
  }
  46%,
  48% {
    opacity: 0.85;
    transform: translate(-1px, 0);
  }
  82%,
  84% {
    opacity: 0.85;
    transform: translate(-2px, 0);
  }
}

@keyframes glitch-cursor-slice-top {
  0%,
  10%,
  13%,
  45%,
  49%,
  81%,
  85%,
  100% {
    opacity: 0;
    transform: translateX(0);
  }
  11%,
  12% {
    opacity: 0.9;
    transform: translateX(-3px);
  }
  46%,
  48% {
    opacity: 0.9;
    transform: translateX(3px);
  }
  82%,
  84% {
    opacity: 0.9;
    transform: translateX(-2px);
  }
}

@keyframes glitch-cursor-slice-bottom {
  0%,
  11%,
  14%,
  46%,
  50%,
  82%,
  86%,
  100% {
    opacity: 0;
    transform: translateX(0);
  }
  12%,
  13% {
    opacity: 0.9;
    transform: translateX(3px);
  }
  47%,
  49% {
    opacity: 0.9;
    transform: translateX(-3px);
  }
  83%,
  85% {
    opacity: 0.9;
    transform: translateX(2px);
  }
}

@media (prefers-reduced-motion: reduce), (hover: none), (pointer: coarse) {
  .glitch-cursor {
    display: none;
  }
}
</style>
