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
import { useViceCityCode } from '@/composables/useViceCityCode'
import { isExperienceVisible } from '@/composables/useViceCityGame'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import router from '@/router'
import MainView from '@/views/MainView.vue'
import type { RouteLocationNormalized } from 'vue-router'

const showCrt = ref(!prefersReducedMotion())
if (!showCrt.value) {
  markCrtDone()
}

const { isTrickActive } = useViceCityCode()
useDocumentTitle()

const ViceCityExperience = defineAsyncComponent(
  () => import('@/components/vicecity/ViceCityExperience.vue'),
)

// Warm the game shell chunk while idle so the trick mounts it instantly:
// no blank frame between the panel and the video.
const prefetchExperience = () => {
  void import('@/components/vicecity/ViceCityExperience.vue')
}
if (typeof window.requestIdleCallback === 'function') {
  window.requestIdleCallback(prefetchExperience)
} else {
  window.setTimeout(prefetchExperience, 2000)
}

// While the game shell owns the screen the portfolio leaves the DOM entirely:
// no scrollbar behind, no WebGL backgrounds burning frames. During the 3 s of
// TV noise the portfolio stays (the noise covers it) with the shell behind.
const isPortfolioVisible = computed(() => !isExperienceVisible.value || isTrickActive.value)

// `v-if` decide si el ruido existe (crear un contexto WebGL cuesta memoria) y
// `v-show` si se pinta: su capa queda tapada por el terminal salvo en el flash.
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

// Red de seguridad: el fondo del terminal se activa cuando el intro avisa de que
// termino. Si el timeline no llegara a avisar, la capa se quedaria detras de un
// negro permanente; el intro dura ~1,9 s, asi que a los 4 s se cierra igual.
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
      <!-- Regla de visibilidad de las capas de fondo:
             v-if   montar/desmontar. Cuando estar vivo cuesta (contexto WebGL,
                    hilo wasm, un audio que suena) y al volver no hace falta su
                    estado. El intro del CRT tambien: su timeline corre una vez.
             v-show ocultar con CSS. Cuando desmontar es caro (se perderia el
                    shader ya compilado) y solo hay que dejar de pintarlo.
             active (prop) detener el bucle de dibujo sin desmontar. Ocultar no
                    es lo mismo que parar: un canvas en `display: none` sigue
                    gastando frame si su bucle corre. -->
      <tv-static-background
        v-if="quality.tvStatic || isTrickActive"
        v-show="noiseVisible"
        :overlay="isTrickActive"
        :active="noiseVisible"
      />
      <!-- El terminal es el fondo de todo: no se oculta nunca, pero deja de
           dibujar mientras algo opaco lo tapa (intro del CRT, ruido del truco). -->
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
