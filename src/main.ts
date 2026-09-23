import khatarsis from 'khatarsis'
import { provideKhatarsisLocale } from 'khatarsis'
import { createApp, watch } from 'vue'
import App from './App.vue'
import { initTheme } from './composables/useTheme'
import { initQuality } from './composables/useQuality'
import i18n from './i18n'
import router from './router'
import './style.css'

// Lenis drives every scroll: the native restoration would fight it on reload.
history.scrollRestoration = 'manual'

const app = createApp(App)

initTheme()
initQuality()

app.use(khatarsis)
app.use(i18n)

// khatarsis keeps its own locale state; this bridges it with the app locale in
// both directions (initial value here, changes through the watcher below).
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

// The canonical link points at the document that is actually being read, built from the
// origin the site is served from: a self referencing canonical that is correct on any
// host, including localhost, and never a domain that has to be replaced by hand.
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
