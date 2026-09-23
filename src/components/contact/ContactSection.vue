<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReveal } from '@/composables/useReveal'
import ContactImages from '@/components/contact/ContactImages.vue'

const { t } = useI18n()

const root = ref<HTMLElement | null>(null)

useReveal(root)
</script>

<template>
  <section id="contact" ref="root" class="relative flex min-h-[40vh] w-full flex-col">
    <div class="flex flex-1 flex-col gap-6">
      <header class="flex flex-col gap-2" data-reveal>
        <h2 class="text-4xl font-black xs:text-5xl">{{ t('contact.title') }}</h2>
        <p class="text-base text-neutral-700 xs:text-lg dark:text-neutral-300">
          {{ t('contact.subtitle') }}
        </p>
      </header>
      <div class="flex flex-1 gap-4">
        <contact-images />
      </div>
    </div>
  </section>
</template>
