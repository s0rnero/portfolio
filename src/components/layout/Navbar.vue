<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Drawer } from 'khatarsis'
import { scrollTo } from '@/composables/useSmoothScroll'
import { useTheme } from '@/composables/useTheme'
import { NAV_SECTIONS } from '@/router'
import GlitchText from '@/components/hero/GlitchText.vue'
import NavControls from '@/components/layout/NavControls.vue'
import { flashOnThemeToggle } from '@/composables/useStaticFlash'
import logo from '@/assets/logo/logo-script-v4.svg'

const { t, locale } = useI18n()
const router = useRouter()
const { theme } = useTheme()

// Mirrors Tailwind's `sm` (40rem) breakpoint: both values must move together.
const drawerBreakpoint = 640

const isDrawerOpen = ref(false)

watch(locale, () => {
  isDrawerOpen.value = false
})

watch(theme, () => {
  flashOnThemeToggle()
  isDrawerOpen.value = false
})

const handleLogoClick = () => {
  router.push('/')
  scrollTo(0)
}

const handleSectionClick = () => {
  isDrawerOpen.value = false
}
</script>

<template>
  <header class="fixed top-0 z-40 w-full bg-transparent">
    <nav
      :aria-label="t('nav.ariaNavigation')"
      class="flex w-full flex-row items-center justify-between gap-6 self-center px-2 py-1 xs:px-6 xs:py-3"
    >
      <button
        :aria-label="t('nav.ariaHome')"
        type="button"
        class="flex items-center text-lg font-black tracking-tight text-black select-none dark:text-white"
        @click="handleLogoClick"
      >
        <!-- Explicit width prop: the grid `figure` gets a fixed box, so iOS 15
             never falls back to the SVG default size (logo looked centered). -->
        <k-image :src="logo" :lazy="false" :width="32" alt="" fit="contain" class="h-8" />
      </button>

      <div class="hidden items-center gap-6 sm:flex">
        <ul class="flex items-center gap-8">
          <li v-for="section in NAV_SECTIONS" :key="section.hash">
            <router-link
              :to="{ path: '/', hash: section.hash }"
              class="flex items-center gap-2 font-black"
            >
              <k-icon :name="section.icon" class="size-6" aria-hidden="true" />
              <glitch-text :text="t(section.labelKey)" hover-only />
            </router-link>
          </li>
        </ul>
      </div>

      <div class="hidden items-center gap-4 sm:flex">
        <nav-controls select-id="navbar-language-select" />
      </div>

      <drawer
        v-model="isDrawerOpen"
        :aria-label="t('nav.ariaNavigation')"
        :breakpoint="drawerBreakpoint"
        title="Menu"
        side="right"
        size="md"
      >
        <template #trigger="{ open }">
          <k-button :aria-label="t('nav.openMenu')" icon="mdi:menu" hover icon-only @click="open" />
        </template>

        <ul class="flex flex-col">
          <li v-for="section in NAV_SECTIONS" :key="section.hash">
            <router-link
              :to="{ path: '/', hash: section.hash }"
              class="w-full gap-3 font-black"
              @click="handleSectionClick"
            >
              <k-item :ui="{ '.content': 'flex gap-4' }" size="xl" hover>
                <k-icon :name="section.icon" class="size-6" aria-hidden="true" />
                <glitch-text :text="t(section.labelKey)" hover-only />
              </k-item>
            </router-link>
          </li>
        </ul>

        <template #footer>
          <div class="flex w-full items-center justify-between gap-4">
            <nav-controls select-id="drawer-language-select" />
          </div>
        </template>
      </drawer>
    </nav>
  </header>
</template>
