import khatarsis from 'khatarsis'
import { provideKhatarsisLocale } from 'khatarsis'
import { createApp, watch } from 'vue'
import App from './App.vue'
import { initTheme } from './composables/useTheme'
import i18n from './i18n'
import router from './router'
import './style.css'

history.scrollRestoration = 'manual'

const app = createApp(App)

initTheme()

app.use(khatarsis)
app.use(i18n)

const khatarsisLocale = provideKhatarsisLocale(app, {
  locale: i18n.global.locale.value,
  fallbackLocale: 'en',
})

watch(
  i18n.global.locale,
  value => {
    khatarsisLocale.setLocale(value)
    document.documentElement.lang = value
  },
  { immediate: true },
)

app.use(router)

const syncCanonical = (path: string) => {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }

  link.href = `${window.location.origin}${path}`
}

watch(() => router.currentRoute.value.path, syncCanonical, { immediate: true })

app.mount('#app')
