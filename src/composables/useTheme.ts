import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'portfolio-theme'

const theme = ref<Theme | null>(null)

const resolveSystemTheme = (): Theme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const applyTheme = (value: Theme) => {
  document.documentElement.classList.toggle('dark', value === 'dark')
}

export function initTheme() {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  theme.value = stored === 'light' || stored === 'dark' ? stored : resolveSystemTheme()
  applyTheme(theme.value)

  watch(theme, value => {
    if (value === null) return
    applyTheme(value)
    localStorage.setItem(STORAGE_KEY, value)
  })
}

export function useTheme() {
  const toggleTheme = () => {
    if (theme.value === null) return
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggleTheme }
}
