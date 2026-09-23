<script setup lang="ts">
import gsap from 'gsap'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { profile } from '@/data/portfolio'
import { prefersReducedMotion } from '@/composables/useReveal'
import { isCrtDone } from '@/composables/useCrtIntro'
import GlitchText from './GlitchText.vue'
import SocialLinks from '@/components/common/SocialLinks.vue'
import { setHover } from '@/composables/useStaticFlash'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const root = ref<HTMLElement | null>(null)
let heroTimeline: gsap.core.Timeline | null = null
let fallbackTimer: number | null = null

onMounted(() => {
  const el = root.value
  if (!el || prefersReducedMotion()) return

  const items = Array.from(el.querySelectorAll<HTMLElement>('[data-hero]'))
  gsap.set(items, { y: 40, autoAlpha: 0, filter: 'blur(12px)' })
  const play = () => {
    heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } }).to(
      items,
      {
        y: 0,
        autoAlpha: 1,
        filter: 'blur(0px)',
        duration: 0.8,
        stagger: 0.16,
        clearProps: 'filter,opacity,visibility,transform',
      },
      0,
    )
  }
  if (isCrtDone.value) {
    play()
    return
  }
  const stop = watch(isCrtDone, done => {
    if (done) {
      stop()
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer)
        fallbackTimer = null
      }
      play()
    }
  })
  fallbackTimer = window.setTimeout(() => {
    if (!isCrtDone.value) {
      stop()
      play()
    }
    fallbackTimer = null
  }, 3000)
})

onBeforeUnmount(() => {
  if (fallbackTimer !== null) {
    window.clearTimeout(fallbackTimer)
    fallbackTimer = null
  }
  heroTimeline?.kill()
  heroTimeline = null
})

const handleGoToAbout = () => {
  router.push({ path: '/', hash: '#about' })
}
</script>

<template>
  <section
    id="hero"
    ref="root"
    class="relative flex min-h-screen items-center overflow-hidden pt-16 md:pt-0"
  >
    <div class="relative z-10 flex w-full flex-col items-center gap-4">
      <p class="text-center text-5xl font-black tracking-tight xs:text-6xl" data-hero>
        <span class="text-4xl xs:text-5xl"> {{ `${t('hero.greeting')} ` }} </span>
        <glitch-text
          :text="`${profile.firstName} ${profile.lastName}`"
          @mouseenter="setHover(true)"
          @mouseleave="setHover(false)"
        />
      </p>
      <h1
        class="text-center text-4xl font-black text-violet-600 xs:text-5xl dark:text-violet-300"
        data-hero
      >
        {{ t('hero.role') }}
      </h1>
      <p class="max-w-2xl text-justify leading-relaxed" data-hero>
        {{ t('hero.description') }}
      </p>
      <div class="flex flex-wrap items-center justify-center gap-4" data-hero>
        <social-links />
        <k-button icon-right="mdi:chevron-down" outlined hover @click="handleGoToAbout">
          {{ t('hero.knowMe') }}
        </k-button>
      </div>
    </div>
  </section>
</template>
