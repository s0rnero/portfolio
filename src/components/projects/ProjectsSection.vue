<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { projects } from '@/data/portfolio'
import { useReveal } from '@/composables/useReveal'
import ProjectCard from './ProjectCard.vue'

const { t } = useI18n()
const root = ref<HTMLElement | null>(null)
useReveal(root)
</script>

<template>
  <section id="projects" ref="root" class="relative flex min-h-[70vh] w-full flex-col items-center">
    <div class="flex w-full flex-col items-center gap-10">
      <header class="flex w-full flex-col gap-2" data-reveal>
        <h2 class="text-4xl font-black xs:text-5xl">
          {{ t('projects.title') }}
        </h2>
        <p class="text-base text-neutral-700 xs:text-lg dark:text-neutral-300">
          {{ t('projects.subtitle') }}
        </p>
      </header>
      <div class="projects-grid w-full">
        <project-card v-for="project in projects" :project="project" :key="project.name" />
      </div>
    </div>
  </section>
</template>
