<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import unlockSound from '@/assets/c/unlocksomething.m4a'

const { t } = useI18n()
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-50" aria-hidden="true">
    <audio :src="unlockSound" autoplay />
    <div
      class="absolute top-4 left-4 flex h-10.5 w-85.25 items-center bg-black px-2 text-2xl font-black text-neutral-300"
    >
      {{ t('trick.unlocked') }}
    </div>
  </div>
</template>
