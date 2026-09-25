<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { skills, type PetKey } from '@/data/portfolio'
import { useReveal } from '@/composables/useReveal'
import GlitchText from '@/components/hero/GlitchText.vue'
import PortraitGlitch from './PortraitGlitch.vue'
import MapCard from './MapCard.vue'

const { t, tm } = useI18n()

const root = ref<HTMLElement | null>(null)

const paragraphs = computed(() => tm('about.body') as string[])

const hoveredPet = ref<PetKey | null>(null)

const handlePetEnter = (pet: PetKey) => {
  hoveredPet.value = pet
}

const handlePetLeave = (pet: PetKey) => {
  if (hoveredPet.value === pet) hoveredPet.value = null
}

useReveal(root)
</script>

<template>
  <section id="about" ref="root" class="relative min-h-[70vh] w-full">
    <div class="flex w-full flex-col gap-8">
      <header class="flex flex-col gap-2" data-reveal>
        <h2 class="text-3xl font-black md:text-5xl">
          {{ t('about.kicker') }}
        </h2>

        <p class="text-base text-neutral-700 md:text-lg dark:text-neutral-300">
          {{ t('about.subtitle') }}
        </p>
      </header>

      <div class="flex flex-col items-start gap-6 md:flex-row md:items-center" data-reveal>
        <portrait-glitch :alt="t('about.photoAlt')" :active-pet="hoveredPet" />
        <div class="flex flex-1 flex-col gap-4">
          <p
            v-for="(paragraph, index) in paragraphs"
            :key="index"
            class="text-justify leading-relaxed text-neutral-700 dark:text-neutral-300"
          >
            {{ paragraph }}
          </p>

          <p class="text-justify leading-relaxed text-neutral-700 dark:text-neutral-300">
            {{ t('about.pets.lead') }}
            <glitch-text
              text="Rocco"
              hover-only
              @hover-start="handlePetEnter('rocco')"
              @hover-end="handlePetLeave('rocco')"
            />
            {{ t('about.pets.and') }}
            <glitch-text
              text="Rugal"
              hover-only
              @hover-start="handlePetEnter('rugal')"
              @hover-end="handlePetLeave('rugal')"
            />{{ t('about.pets.tail') }}
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-6 lg:flex-row">
        <k-card
          v-effect="{ type: 'spotlight', size: 77 }"
          class="backdrop-blur-sm lg:basis-2/3"
          variant="transparent"
          rounded
        >
          <template #title>
            <h2 class="font-bold">{{ t('about.stackTitle') }}</h2>
          </template>
          <div class="flex flex-col gap-4">
            <div v-for="group in skills" :key="group.area" class="flex flex-col gap-2">
              <p class="font-medium text-neutral-700 dark:text-neutral-300">
                {{ t(`skills.areas.${group.area}`) }}
              </p>
              <div class="flex flex-wrap gap-2">
                <k-chip
                  v-for="skill in group.skills"
                  :label="skill"
                  :key="skill"
                  variant="primary"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </k-card>

        <map-card class="lg:basis-1/3" />
      </div>
    </div>
  </section>
</template>
