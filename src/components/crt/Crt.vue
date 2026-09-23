<script setup lang="ts">
import gsap from 'gsap'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/composables/useReveal'

interface CrtProps {
  blackHoldMs?: number
  durationMs?: number
  lineHeightPx?: number
}

const props = withDefaults(defineProps<CrtProps>(), {
  blackHoldMs: 300,
  durationMs: 1400,
  lineHeightPx: 2,
})

const emit = defineEmits<{ done: [] }>()

const root = ref<HTMLElement | null>(null)
const stretch = ref<HTMLElement | null>(null)
const line = ref<HTMLElement | null>(null)
const core = ref<HTMLElement | null>(null)
const flash = ref<HTMLElement | null>(null)
const visible = ref(true)

let timeline: gsap.core.Timeline | null = null
let finished = false

const finish = () => {
  if (finished) return
  finished = true
  visible.value = false
  emit('done')
}

onMounted(async () => {
  if (prefersReducedMotion()) {
    await nextTick()
    finish()
    return
  }
  if (document.scrollingElement && document.scrollingElement.scrollTop > 0) {
    finish()
    return
  }
  await nextTick()
  if (!root.value || !stretch.value || !line.value || !core.value || !flash.value) {
    finish()
    return
  }
  const blackHold = props.blackHoldMs / 1000
  timeline = gsap.timeline({ onComplete: finish })
  timeline.timeScale(1380 / props.durationMs)
  timeline.set(root.value, { opacity: 1 })
  timeline.set(stretch.value, { scaleY: 0.004, transformOrigin: '50% 50%' })
  timeline.set(line.value, { scaleX: 0, transformOrigin: '50% 50%' })
  timeline.set(core.value, { opacity: 0 })
  timeline.set(flash.value, { opacity: 0 })
  timeline.to(line.value, { scaleX: 1, duration: 0.22, ease: 'power2.out' }, blackHold)
  timeline.to(core.value, { opacity: 1, duration: 0.15, ease: 'power1.out' }, blackHold + 0.03)
  timeline.to(core.value, { opacity: 0.55, duration: 0.05 }, blackHold + 0.12)
  timeline.to(core.value, { opacity: 1, duration: 0.07 }, blackHold + 0.17)
  timeline.to(stretch.value, { scaleY: 1, duration: 0.45, ease: 'power2.inOut' }, blackHold + 0.2)
  timeline.to(flash.value, { opacity: 1, duration: 0.1, ease: 'power1.in' }, blackHold + 0.65)
  timeline.to(root.value, { opacity: 0, duration: 0.35, ease: 'power2.out' }, blackHold + 0.73)
})

onBeforeUnmount(() => {
  timeline?.kill()
  timeline = null
})
</script>

<template>
  <div
    v-if="visible"
    ref="root"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black"
    aria-hidden="true"
  >
    <div ref="stretch" class="crt-stretch">
      <div ref="core" class="crt-core" />
      <div :style="{ height: `${lineHeightPx}px` }" ref="line" class="crt-line" />
    </div>
    <div ref="flash" class="crt-flash" />
  </div>
</template>

<style scoped>
.crt-stretch {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  will-change: transform;
}

.crt-core {
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 34vh;
  transform: translateY(-50%);
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0.6) 16%,
    rgba(255, 255, 255, 0.22) 34%,
    rgba(255, 255, 255, 0) 62%
  );
  pointer-events: none;
  will-change: opacity;
}

.crt-line {
  width: 100%;
  background: #fff;
  box-shadow:
    0 0 18px 6px rgba(255, 255, 255, 0.95),
    0 0 70px 26px rgba(255, 255, 255, 0.5),
    0 0 180px 70px rgba(255, 255, 255, 0.22);
  pointer-events: none;
  will-change: transform;
}

.crt-flash {
  position: absolute;
  inset: 0;
  background: #fff;
  pointer-events: none;
  will-change: opacity;
}
</style>
