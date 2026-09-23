import { createI18n } from 'vue-i18n'
import en from './locales/en'
import es from './locales/es'

export const LOCALE_STORAGE_KEY = 'portfolio-locale'

export type AppLocale = 'es' | 'en'

const resolveInitialLocale = (): AppLocale => {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  return stored === 'es' || stored === 'en' ? stored : 'es'
}

const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: 'es',
  messages: {
    en,
    es,
  },
})

export default i18n
