<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/composables/useReveal'

interface GlitchTextProps {
  text: string
  hoverOnly?: boolean
}

const props = withDefaults(defineProps<GlitchTextProps>(), {
  hoverOnly: false,
})

const emit = defineEmits<{
  hoverStart: []
  hoverEnd: []
}>()

const ACTIVE_MS = 4000
const PAUSE_MS = 8000

const isGlitching = ref(false)
const isVisible = ref(true)
const root = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let cycleTimer: number | null = null

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

const handlePointerEnter = () => {
  emit('hoverStart')
  if (props.hoverOnly) {
    isGlitching.value = true
    return
  }
  clearCycle()
  isGlitching.value = true
}

const handlePointerLeave = () => {
  emit('hoverEnd')
  if (props.hoverOnly) {
    isGlitching.value = false
    return
  }
  clearCycle()
  isGlitching.value = false
  schedulePause()
}

onMounted(() => {
  observer = new IntersectionObserver(
    entries => {
      isVisible.value = entries.some(entry => entry.isIntersecting)
    },
    { threshold: 0 },
  )
  if (root.value) observer.observe(root.value)
  if (prefersReducedMotion() || props.hoverOnly) return
  startActivePhase()
})

onBeforeUnmount(() => {
  clearCycle()
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <span
    ref="root"
    :class="{ 'glitch-text--active': isGlitching && isVisible }"
    :data-text="props.text"
    class="glitch-text relative inline-block whitespace-nowrap"
    @pointerenter="handlePointerEnter()"
    @pointerleave="handlePointerLeave()"
  >
    {{ props.text }}
  </span>
</template>

<style scoped>
.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: inherit;
  overflow: hidden;
  background: var(--color-glitch-backdrop);
  opacity: 0;
  pointer-events: none;
  user-select: none;
}

.glitch-text--active::before {
  left: 3px;
  text-shadow: -2px 0 var(--color-glitch-shadow);
  opacity: 1;
  animation: glitch-animation-1 3s linear infinite;
}

.glitch-text--active::after {
  left: -3px;
  text-shadow: -2px 0 var(--color-glitch-shadow);
  opacity: 1;
  animation: glitch-animation-2 3s linear infinite;
}

@keyframes glitch-animation-1 {
  0% {
    clip: rect(1.5em, 100em, 1.07em, 0);
  }

  5% {
    clip: rect(0.59em, 100em, 0.53em, 0);
  }

  10% {
    clip: rect(1.35em, 100em, 0.36em, 0);
  }

  15% {
    clip: rect(1.41em, 100em, 1.47em, 0);
  }

  20% {
    clip: rect(1.22em, 100em, 0.55em, 0);
  }

  25% {
    clip: rect(0.91em, 100em, 0.07em, 0);
  }

  30% {
    clip: rect(1.05em, 100em, 1.43em, 0);
  }

  35% {
    clip: rect(0.14em, 100em, 0.73em, 0);
  }

  40% {
    clip: rect(0.68em, 100em, 0.79em, 0);
  }

  45% {
    clip: rect(1.27em, 100em, 0.5em, 0);
  }

  50% {
    clip: rect(1.11em, 100em, 0.64em, 0);
  }

  55% {
    clip: rect(1.46em, 100em, 1.12em, 0);
  }

  60% {
    clip: rect(1.08em, 100em, 1.05em, 0);
  }

  65% {
    clip: rect(0.59em, 100em, 0.08em, 0);
  }

  70% {
    clip: rect(0.51em, 100em, 1.46em, 0);
  }

  75% {
    clip: rect(0.23em, 100em, 0.34em, 0);
  }

  80% {
    clip: rect(0.71em, 100em, 1.4em, 0);
  }

  85% {
    clip: rect(0.26em, 100em, 0.8em, 0);
  }

  90% {
    clip: rect(0.73em, 100em, 0.98em, 0);
  }

  95% {
    clip: rect(0.06em, 100em, 1em, 0);
  }

  100% {
    clip: rect(0.27em, 100em, 0.17em, 0);
  }
}

@keyframes glitch-animation-2 {
  0% {
    clip: rect(0.63em, 100em, 0.12em, 0);
  }

  5% {
    clip: rect(0.66em, 100em, 1.11em, 0);
  }

  10% {
    clip: rect(0.35em, 100em, 0.05em, 0);
  }

  15% {
    clip: rect(0.98em, 100em, 0.56em, 0);
  }

  20% {
    clip: rect(0.28em, 100em, 0.63em, 0);
  }

  25% {
    clip: rect(1.16em, 100em, 1.14em, 0);
  }

  30% {
    clip: rect(0.08em, 100em, 0.45em, 0);
  }

  35% {
    clip: rect(0.22em, 100em, 0.95em, 0);
  }

  40% {
    clip: rect(0.83em, 100em, 0.58em, 0);
  }

  45% {
    clip: rect(1.44em, 100em, 0.11em, 0);
  }

  50% {
    clip: rect(0.73em, 100em, 0.22em, 0);
  }

  55% {
    clip: rect(0.33em, 100em, 0.76em, 0);
  }

  60% {
    clip: rect(0.13em, 100em, 0.9em, 0);
  }

  65% {
    clip: rect(1.47em, 100em, 1.27em, 0);
  }

  70% {
    clip: rect(0.64em, 100em, 1.1em, 0);
  }

  75% {
    clip: rect(0.44em, 100em, 0.46em, 0);
  }

  80% {
    clip: rect(0.93em, 100em, 1.27em, 0);
  }

  85% {
    clip: rect(0.5em, 100em, 0.97em, 0);
  }

  90% {
    clip: rect(0.03em, 100em, 1.1em, 0);
  }

  95% {
    clip: rect(0.91em, 100em, 1.14em, 0);
  }

  100% {
    clip: rect(0.73em, 100em, 0.53em, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .glitch-text::before,
  .glitch-text::after,
  .glitch-text--active::before,
  .glitch-text--active::after {
    animation: none;
    content: none;
  }
}
</style>
