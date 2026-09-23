import { ref } from 'vue'

// Window contract used by the game runtime to report its first frame.
declare global {
  interface Window {
    __vcFrame?: () => void
  }
}

// Shared state: the trick trigger, the experience shell and the reveal gate
// read the same signals (module state, same pattern as useStaticFlash).
const isExperienceVisible = ref(false)
const isVideoVisible = ref(false)
const isVideoFaded = ref(false)
const isVideoHidden = ref(false)
const isGameReady = ref(false)

const FADE_HIDE_DELAY_MS = 750

let hideTimer: number | undefined

const openExperience = () => {
  if (isExperienceVisible.value) return
  isExperienceVisible.value = true
  isVideoVisible.value = false
  isVideoFaded.value = false
  isVideoHidden.value = false
  isGameReady.value = false
}

const markVideoStarted = () => {
  isVideoVisible.value = true
}

const markGameReady = () => {
  isGameReady.value = true
}

const fadeVideoOut = (): boolean => {
  if (!isVideoVisible.value || isVideoFaded.value) return false
  isVideoFaded.value = true
  window.clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => {
    isVideoHidden.value = true
  }, FADE_HIDE_DELAY_MS)
  return true
}

const revealGame = (): boolean => {
  if (!isGameReady.value) return false
  return fadeVideoOut()
}

const dismissVideoOnEnd = (): void => {
  fadeVideoOut()
}

export function useVCGame() {
  return {
    isExperienceVisible,
    isVideoVisible,
    isVideoFaded,
    isVideoHidden,
    isGameReady,
    openExperience,
    markVideoStarted,
    markGameReady,
    revealGame,
    dismissVideoOnEnd,
  }
}

export {
  dismissVideoOnEnd,
  isExperienceVisible,
  isGameReady,
  isVideoFaded,
  isVideoHidden,
  isVideoVisible,
  markGameReady,
  markVideoStarted,
  openExperience,
  revealGame,
}
