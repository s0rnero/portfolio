<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { quality } from '@/composables/useQuality'

interface GradualBlurProps {
  position?: 'top' | 'bottom'
  height?: string
  strength?: number
  divCount?: number
  curve?: 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out'
  opacity?: number
  zIndex?: number
  fixed?: boolean
}

const props = withDefaults(defineProps<GradualBlurProps>(), {
  position: 'top',
  height: '65px',
  strength: 2,
  divCount: 3,
  curve: 'ease-out',
  opacity: 1,
  zIndex: 0,
  fixed: false,
})

type BlurCurve = NonNullable<GradualBlurProps['curve']>

const curveFunctions: Record<BlurCurve, (progress: number) => number> = {
  linear: progress => progress,
  bezier: progress => progress * progress * (3 - 2 * progress),
  'ease-in': progress => progress * progress,
  'ease-out': progress => 1 - (1 - progress) * (1 - progress),
  'ease-in-out': progress =>
    progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2,
}

const layers = computed<CSSProperties[]>(() => {
  const count = Math.max(1, Math.floor(props.divCount))
  const applyCurve = curveFunctions[props.curve]
  const step = 100 / count
  const direction = props.position === 'bottom' ? 'to bottom' : 'to top'
  const result: CSSProperties[] = []

  for (let index = 1; index <= count; index += 1) {
    const progress = applyCurve(index / count)
    const blurRem = 0.0625 * (progress * count + 1) * props.strength
    const start = Math.round((step * index - step) * 10) / 10
    const startFull = Math.round(step * index * 10) / 10
    const endFull = Math.round((step * index + step) * 10) / 10
    const end = Math.round((step * index + step * 2) * 10) / 10
    let gradient = `transparent ${start}%, black ${startFull}%`
    if (endFull <= 100) gradient += `, black ${endFull}%`
    if (end <= 100) gradient += `, transparent ${end}%`
    const maskImage = `linear-gradient(${direction}, ${gradient})`
    result.push({
      backdropFilter: `blur(${blurRem}rem)`,
      WebkitBackdropFilter: `blur(${blurRem}rem)`,
      maskImage,
      WebkitMaskImage: maskImage,
    })
  }

  return result
})

const usesBackdrop = computed(() => quality.backdropBlur)

const solidStyle = computed<CSSProperties>(() => ({
  background: `linear-gradient(${
    props.position === 'bottom' ? 'to top' : 'to bottom'
  }, var(--color-glitch-backdrop) 45%, transparent)`,
}))

const containerClass = computed(() => [
  'gradual-blur',
  props.fixed ? 'gradual-blur--fixed' : 'gradual-blur--absolute',
  props.position === 'bottom' ? 'gradual-blur--bottom' : 'gradual-blur--top',
])

const containerStyle = computed<CSSProperties>(() => ({
  height: props.height,
  opacity: props.opacity,
  zIndex: props.zIndex,
}))
</script>

<template>
  <div :class="containerClass" :style="containerStyle" aria-hidden="true">
    <div v-if="!usesBackdrop" :style="solidStyle" class="h-full w-full" />
    <div v-else class="gradual-blur-inner relative h-full w-full">
      <div v-for="(layer, index) in layers" :style="layer" :key="index" class="absolute inset-0" />
    </div>
  </div>
</template>
