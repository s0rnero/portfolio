<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroSection from '@/components/hero/HeroSection.vue'
import ProjectsSection from '@/components/projects/ProjectsSection.vue'
import AboutSection from '@/components/about/AboutSection.vue'
import ContactSection from '@/components/contact/ContactSection.vue'
import { NAV_SECTIONS } from '@/router'
import { scrollTo } from '@/composables/useSmoothScroll'
import { useSectionSpy } from '@/composables/useSectionSpy'

gsap.registerPlugin(ScrollTrigger)

const route = useRoute()
const section = route.meta.section as string | null
const restoreTarget = route.hash || (section ? `#${section}` : '')

useSectionSpy(NAV_SECTIONS)

onMounted(async () => {
  await nextTick()
  requestAnimationFrame(() => ScrollTrigger.refresh())
  // Fresh loads (reload or shared URL) must land on their section: the router
  // guard scrolls before this view exists, so restore here once mounted.
  // Immediate (no animation): an animated restore clears the spy guard
  // mid-flight and the URL gets "corrected" back to /.
  if (restoreTarget) {
    setTimeout(() => scrollTo(restoreTarget, -80, true), 150)
  }
})
</script>

<template>
  <div class="relative z-10 flex h-full flex-col gap-14 p-4 md:px-10 md:py-8">
    <hero-section />
    <projects-section />
    <about-section />
    <contact-section />
  </div>
</template>
