<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Project } from '@/data/portfolio'

const props = defineProps<{ project: Project }>()

const { t } = useI18n()

const description = computed(() => t(`projects.items.${props.project.descriptionKey}.description`))
const initials = computed(() =>
  props.project.name
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)
</script>

<template>
  <div v-effect="'skew'" class="h-full">
    <k-card
      v-effect="{ type: 'spotlight', size: 77 }"
      :aria-label="t('projects.openProject', { name: props.project.name })"
      :href="props.project.url"
      as="a"
      class="h-full backdrop-blur-sm"
      target="_blank"
      rel="noopener"
      variant="transparent"
    >
      <template #media>
        <div class="flex h-48 w-full items-center justify-center overflow-hidden p-6">
          <k-image
            v-if="props.project.image"
            :src="props.project.image"
            :alt="props.project.name"
            :class="{ 'project-logo-light-ink': props.project.lightInkLogo }"
            fit="contain"
            hover="none"
            class="max-h-full max-w-full"
            lazy
          />
          <span v-else class="text-5xl font-black text-black dark:text-white" aria-hidden="true">
            {{ initials }}
          </span>
        </div>
      </template>
      <template #title>
        <!-- h2 and not h3: the reveal keeps the section headings out of the
             accessibility tree until they scroll into view, so the card titles are
             the first headings a screen reader meets. -->
        <h2 class="font-bold">
          {{ props.project.name }}
        </h2>
      </template>
      <p class="text-neutral-700 dark:text-neutral-300">
        {{ description }}
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <k-tooltip :content="t('projects.techTooltip')">
          <k-icon :aria-label="t('projects.techTooltip')" name="mdi:information" />
        </k-tooltip>
        <k-chip v-for="tech in props.project.tech" :label="tech" :key="tech" size="sm" />
      </div>
    </k-card>
  </div>
</template>
