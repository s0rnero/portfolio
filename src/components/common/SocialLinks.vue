<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSocialLinks } from '@/composables/useSocialLinks'

const { t } = useI18n()
const { socialExternalLinks: links } = useSocialLinks()
</script>

<template>
  <k-button
    v-for="link in links"
    :href="link.href"
    :aria-label="t(link.ariaKey)"
    :icon="link.icon"
    :key="link.key"
    target="_blank"
    rel="noopener"
    relief
    hover
  >
    {{ link.label }}
  </k-button>
</template>
