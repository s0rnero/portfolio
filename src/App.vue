<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { initSmoothScroll } from '@/composables/useSmoothScroll'
import TrickOverlay from '@/components/common/TrickOverlay.vue'
import FooterSection from '@/components/layout/FooterSection.vue'
import Navbar from '@/components/layout/Navbar.vue'
import GradualBlur from '@/components/layout/GradualBlur.vue'
import GlitchCursor from '@/components/cursor/GlitchCursor.vue'
import TvStaticBackground from '@/components/background/TvStaticBackground.vue'
import FaultyTerminalBackground from '@/components/background/FaultyTerminalBackground.vue'
import Crt from '@/components/crt/Crt.vue'
import { markCrtDone } from '@/composables/useCrtIntro'
import { flashOnNavigate, isFlashVisible } from '@/composables/useStaticFlash'
import { quality } from '@/composables/useQuality'
import { wasSpyNav } from '@/composables/useSectionSpy'
import { prefersReducedMotion } from '@/composables/useReveal'
import { useVCCode } from '@/composables/useVCCode'
import { isExperienceVisible } from '@/composables/useVCGame'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import router from '@/router'
import MainView from '@/views/MainView.vue'
import type { RouteLocationNormalized } from 'vue-router'

const showCrt = ref(!prefersReducedMotion())
if (!showCrt.value) {
  markCrtDone()
}

const { isTrickActive } = useVCCode()
useDocumentTitle()

const ViceCityExperience = defineAsyncComponent(() => import('@/components/vc/VCExperience.vue'))

const prefetchExperience = () => {
  void import('@/components/vc/VCExperience.vue')
}
if (typeof window.requestIdleCallback === 'function') {
  window.requestIdleCallback(prefetchExperience)
} else {
  window.setTimeout(prefetchExperience, 2000)
}

const isPortfolioVisible = computed(() => !isExperienceVisible.value || isTrickActive.value)

const noiseVisible = computed(() => isFlashVisible.value || isTrickActive.value)

let crtFailsafe: number | null = null

const handleCrtDone = () => {
  if (crtFailsafe !== null) {
    window.clearTimeout(crtFailsafe)
    crtFailsafe = null
  }
  showCrt.value = false
  markCrtDone()
}

if (showCrt.value) {
  crtFailsafe = window.setTimeout(handleCrtDone, 4000)
}

let stopSmoothScroll: (() => void) | null = null
let removeAfterEach: (() => void) | null = null

function isIntraMainViewSectionNav(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): boolean {
  if (!from.name) return false
  const resolvesMainView = to.matched.some(record => record.components?.default === MainView)
  if (!resolvesMainView) return false
  return to.meta.section !== from.meta.section || (to.path === from.path && to.hash !== from.hash)
}

onMounted(() => {
  stopSmoothScroll = initSmoothScroll()
  removeAfterEach = router.afterEach((to, from) => {
    if (wasSpyNav()) return
    if (isIntraMainViewSectionNav(to, from)) flashOnNavigate()
  })
})

onBeforeUnmount(() => {
  if (crtFailsafe !== null) {
    window.clearTimeout(crtFailsafe)
    crtFailsafe = null
  }
  removeAfterEach?.()
  removeAfterEach = null
  stopSmoothScroll?.()
  stopSmoothScroll = null
})
</script>

<template>
  <main class="relative isolate min-h-screen">
    <template v-if="isPortfolioVisible">
      <navbar />
      <gradual-blur :z-index="30" position="top" fixed />
      <glitch-cursor />
      <tv-static-background
        v-if="quality.tvStatic || isTrickActive"
        v-show="noiseVisible"
        :overlay="isTrickActive"
        :active="noiseVisible"
      />
      <faulty-terminal-background
        :active="!showCrt && !isTrickActive"
        :draw-scale="quality.terminalScale"
        :fps="quality.terminalFps"
      />
      <router-view />
      <crt v-if="showCrt" @done="handleCrtDone" />
      <footer-section />
      <trick-overlay v-if="isTrickActive" />
    </template>
    <vice-city-experience v-if="isExperienceVisible" />
  </main>
</template>
