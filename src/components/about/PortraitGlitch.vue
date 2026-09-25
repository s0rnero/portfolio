<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { pets, type PetKey } from '@/data/portfolio'
import { prefersReducedMotion } from '@/composables/useReveal'

const GLITCH_INTERVAL_MS = 600

interface PortraitGlitchProps {
  alt?: string
  activePet?: PetKey | null
}

const props = withDefaults(defineProps<PortraitGlitchProps>(), {
  alt: 'Portrait',
  activePet: null,
})

const { t } = useI18n()

const root = ref<HTMLElement | null>(null)

const tappedPet = ref<PetKey | null>(null)

const displayedPet = computed<PetKey | null>(() => props.activePet ?? tappedPet.value)

const TAP_CYCLE: ReadonlyArray<PetKey | null> = [null, 'rocco', 'rugal']

function handlePortraitTap() {
  const next = (TAP_CYCLE.indexOf(tappedPet.value) + 1) % TAP_CYCLE.length
  tappedPet.value = TAP_CYCLE[next]
}

type UrlModule = { default?: string }

const portraitModules = import.meta.glob('@/assets/me/portrait_*.webp', { eager: true })
const portraitMasterModule = import.meta.glob('@/assets/me/portrait_master.jpg', { eager: true })

const toUrl = (mod: unknown): string => (mod as UrlModule)?.default ?? ''

const portraitVariants = Object.values(portraitModules)
  .map(toUrl)
  .map(url => {
    const match = /_(\d+)w/.exec(url)
    return match ? { url, width: Number(match[1]) } : null
  })
  .filter((entry): entry is { url: string; width: number } => entry !== null)
  .sort((a, b) => a.width - b.width)

const portraitSrc =
  portraitVariants[portraitVariants.length - 1]?.url ||
  toUrl(Object.values(portraitMasterModule)[0])
const portraitSrcset = portraitVariants.map(item => `${item.url} ${item.width}w`).join(', ')
const portraitSizes = '(min-width: 768px) 288px, calc(100vw - 4rem)'

const petPhotos = ref<Partial<Record<PetKey, string>>>({})

const activePetAlt = computed(() => {
  const pet = pets.find(item => item.key === displayedPet.value)
  return pet ? t(pet.photoAltKey) : ''
})

function resolvePetPhoto(pet: PetKey): void {
  if (petPhotos.value[pet]) return
  const entry = pets.find(item => item.key === pet)
  if (!entry) return
  void entry.loadPhoto().then(module => {
    petPhotos.value[pet] = module.default
  })
}

watch(
  () => displayedPet.value,
  pet => {
    if (pet) resolvePetPhoto(pet)
  },
  { immediate: true },
)

let idleId: number | null = null

onMounted(() => {
  const prefetch = () => {
    resolvePetPhoto('rocco')
    resolvePetPhoto('rugal')
  }
  if (typeof window.requestIdleCallback === 'function') {
    idleId = window.requestIdleCallback(prefetch, { timeout: 3000 })
  } else {
    idleId = window.setTimeout(prefetch, 1500)
  }
})

onBeforeUnmount(() => {
  if (idleId !== null) {
    if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId)
    else window.clearTimeout(idleId)
    idleId = null
  }
})

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const glitchLayers = (kind: 'a' | 'b'): HTMLElement[] =>
  root.value ? Array.from(root.value.querySelectorAll(`[data-glitch="${kind}"]`)) : []

const randomClip = () =>
  `inset(${rand(0, 100)}% ${rand(0, 100)}% ${rand(0, 100)}% ${rand(0, 100)}%)`

let glitchRunning = false
let isVisible = true
let observer: IntersectionObserver | null = null
let timerA: number | undefined
let timerB: number | undefined

const clearTimers = () => {
  if (timerA !== undefined) window.clearTimeout(timerA)
  if (timerB !== undefined) window.clearTimeout(timerB)
  timerA = undefined
  timerB = undefined
}

function tickA() {
  if (!glitchRunning || !isVisible || document.hidden) return
  const clip = randomClip()
  const transform = `translate3d(${rand(-8, 8)}px, ${rand(-3, 3)}px, 0)`
  for (const layer of glitchLayers('a')) {
    layer.style.clipPath = clip
    layer.style.transform = transform
  }
  timerA = window.setTimeout(tickA, GLITCH_INTERVAL_MS)
}

function tickB() {
  if (!glitchRunning || !isVisible || document.hidden) return
  const clip = randomClip()
  const scale = 1 + rand(0, 4) / 100
  const transform = `translate3d(${rand(-12, 12)}px, ${rand(-6, 6)}px, 0) scale(${scale})`
  const filter = `hue-rotate(${rand(0, 60)}deg)`
  for (const layer of glitchLayers('b')) {
    layer.style.clipPath = clip
    layer.style.transform = transform
    layer.style.filter = filter
  }
  timerB = window.setTimeout(tickB, GLITCH_INTERVAL_MS)
}

const startGlitch = () => {
  if (prefersReducedMotion()) return
  glitchRunning = true
  clearTimers()
  timerA = window.setTimeout(tickA, GLITCH_INTERVAL_MS)
  timerB = window.setTimeout(tickB, GLITCH_INTERVAL_MS)
}

const stopGlitch = () => {
  glitchRunning = false
  clearTimers()
}

const handleVisibilityChange = () => {
  if (document.hidden) {
    clearTimers()
  } else if (isVisible) {
    startGlitch()
  }
}

onMounted(() => {
  observer = new IntersectionObserver(
    entries => {
      isVisible = entries.some(entry => entry.isIntersecting)
      if (isVisible && !document.hidden) startGlitch()
      else clearTimers()
    },
    { threshold: 0.05 },
  )
  if (root.value) observer.observe(root.value)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  startGlitch()
})

onBeforeUnmount(() => {
  stopGlitch()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div
    :aria-label="props.alt"
    ref="root"
    role="button"
    tabindex="0"
    class="relative w-full cursor-pointer overflow-hidden rounded-2xl contain-layout contain-paint md:w-72"
    @click="handlePortraitTap"
    @keydown.enter.prevent="handlePortraitTap"
    @keydown.space.prevent="handlePortraitTap"
  >
    <k-image
      :src="portraitSrc"
      :srcset="portraitSrcset"
      :sizes="portraitSizes"
      :alt="props.alt"
      :lazy="false"
      fit="cover"
      hover="none"
      class="size-full object-cover"
    />

    <img
      :src="portraitSrc"
      :srcset="portraitSrcset"
      :sizes="portraitSizes"
      alt=""
      aria-hidden="true"
      data-glitch="a"
      class="portrait-glitch pointer-events-none absolute inset-0 size-full object-cover"
    />
    <img
      :src="portraitSrc"
      :srcset="portraitSrcset"
      :sizes="portraitSizes"
      alt=""
      aria-hidden="true"
      data-glitch="b"
      class="portrait-glitch portrait-glitch--blend pointer-events-none absolute inset-0 size-full object-cover"
    />

    <div
      v-for="pet in pets"
      :class="displayedPet === pet.key ? 'opacity-100' : 'opacity-0'"
      :aria-hidden="displayedPet === pet.key ? undefined : 'true'"
      :key="pet.key"
      class="pointer-events-none absolute inset-0 transition-opacity duration-500"
    >
      <k-image
        v-if="petPhotos[pet.key]"
        :src="petPhotos[pet.key]"
        :alt="displayedPet === pet.key ? activePetAlt : ''"
        :lazy="false"
        fit="cover"
        hover="none"
        class="size-full"
        rounded
      />
      <template v-if="petPhotos[pet.key]">
        <img
          :src="petPhotos[pet.key]"
          alt=""
          aria-hidden="true"
          data-glitch="a"
          class="portrait-glitch pointer-events-none absolute inset-0 size-full object-cover"
        />
        <img
          :src="petPhotos[pet.key]"
          alt=""
          aria-hidden="true"
          data-glitch="b"
          class="portrait-glitch portrait-glitch--blend pointer-events-none absolute inset-0 size-full object-cover"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.portrait-glitch {
  will-change: clip-path, transform;
}

.portrait-glitch--blend {
  mix-blend-mode: hue;
}

@media (prefers-reduced-motion: reduce) {
  .portrait-glitch {
    display: none;
  }
}
</style>
