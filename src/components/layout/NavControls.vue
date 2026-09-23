<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import { LOCALE_STORAGE_KEY, type AppLocale } from '@/i18n'

interface NavControlsProps {
  selectId: string
}

interface LocaleOption {
  label: string
  value: AppLocale
}

defineProps<NavControlsProps>()

const { t, locale } = useI18n()
const { theme, toggleTheme } = useTheme()

const isDark = computed(() => theme.value === 'dark')

const themeTooltip = computed(() => (isDark.value ? t('nav.themeDark') : t('nav.themeLight')))

const localeOptions: LocaleOption[] = [
  { label: 'Español', value: 'es' },
  { label: 'English', value: 'en' },
]

const selectedLocale = computed<AppLocale>({
  get: () => locale.value as AppLocale,
  set: value => {
    locale.value = value
    localStorage.setItem(LOCALE_STORAGE_KEY, value)
  },
})
</script>

<template>
  <label :for="selectId" class="sr-only">{{ t('nav.selectLanguage') }}</label>
  <k-select
    v-model="selectedLocale"
    :clearable="false"
    :filterable="false"
    :options="localeOptions"
    :id="selectId"
    option-label="label"
    option-value="value"
    size="sm"
    value-only
  />
  <k-tooltip :content="themeTooltip" placement="bottom">
    <k-button
      :aria-label="t('nav.toggleTheme')"
      :icon="isDark ? 'mdi:weather-night' : 'mdi:white-balance-sunny'"
      hover
      icon-only
      text
      @click="toggleTheme"
    />
  </k-tooltip>
</template>
