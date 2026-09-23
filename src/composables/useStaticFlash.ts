import { computed, ref } from 'vue'

const isHovering = ref(false)
const isNavigating = ref(false)
const isThemeFlash = ref(false)

let navTimer: number | undefined = undefined
let themeTimer: number | undefined = undefined

export const isFlashVisible = computed(
  () => isHovering.value || isNavigating.value || isThemeFlash.value,
)

export function setHover(value: boolean): void {
  isHovering.value = value
}

export function flashOnNavigate(durationMs = 800): void {
  isNavigating.value = true
  window.clearTimeout(navTimer)
  navTimer = window.setTimeout(() => {
    isNavigating.value = false
  }, durationMs)
}

export function flashOnThemeToggle(durationMs = 800): void {
  isThemeFlash.value = true
  window.clearTimeout(themeTimer)
  themeTimer = window.setTimeout(() => {
    isThemeFlash.value = false
  }, durationMs)
}
