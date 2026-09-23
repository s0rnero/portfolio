<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import vcTrailer from '@/assets/trailers/vc.mp4'
import { isTrickActive } from '@/composables/useViceCityCode'

const video = ref<HTMLVideoElement | null>(null)
const hasStarted = ref(false)

const handleStart = () => {
  const element = video.value
  if (!element || hasStarted.value) return

  hasStarted.value = true
  void element.play().catch(() => {
    // Autoplay can be rejected after the deferred activation: the trailer stays silent,
    // the failure is reported in the visual review and it is never muted silently.
  })
}

onMounted(() => {
  if (!isTrickActive.value) handleStart()
})

watch(isTrickActive, active => {
  if (!active) handleStart()
})
</script>

<template>
  <video
    :src="vcTrailer"
    ref="video"
    class="fixed inset-0 size-full object-cover"
    preload="metadata"
    playsinline
  />
</template>
