<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { scrollTo } from '@/composables/useSmoothScroll'
import logo from '@/assets/logo/logo-script-v4.svg'
import GradualBlur from '@/components/layout/GradualBlur.vue'

const { t } = useI18n()
const router = useRouter()

const handleLogoClick = () => {
  router.push('/')
  scrollTo(0)
}
</script>

<template>
  <footer class="relative isolate w-full">
    <gradual-blur :z-index="-10" height="90px" position="bottom" />
    <div class="relative z-10 flex w-full items-center justify-between gap-6 p-8">
      <div class="flex items-center justify-between gap-6">
        <button
          :aria-label="t('nav.ariaHome')"
          type="button"
          class="flex items-center"
          @click="handleLogoClick"
        >
          <!-- Explicit width prop: the grid `figure` gets a fixed box, so iOS 15
               never falls back to the SVG default size (logo looked centered). -->
          <k-image
            :src="logo"
            :lazy="false"
            :width="32"
            alt="logo"
            fit="contain"
            hover="none"
            class="h-8"
          />
        </button>
      </div>

      <p class="text-neutral-500 dark:text-zinc-500">{{ t('contact.footer.rights') }}</p>
    </div>
  </footer>
</template>
