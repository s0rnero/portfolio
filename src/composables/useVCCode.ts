import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isExperienceVisible, openExperience, revealGame } from './useViceCityGame'

const CODE = 'vicecity'
const TRICK_DURATION_MS = 3000

// Shared state: the TV noise, the trick panel and the game experience read the same signal.
const isTrickActive = ref(false)
let timer: number | undefined

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

export function useViceCityCode() {
  const route = useRoute()
  const router = useRouter()

  let buffer = ''

  const activate = () => {
    if (isExperienceVisible.value) return
    isTrickActive.value = true
    openExperience()
    if (route.path !== '/' || route.hash !== '') {
      void router.replace('/').catch(() => {
        // Same-location or aborted replaces are not errors for the trick.
      })
    }
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      isTrickActive.value = false
    }, TRICK_DURATION_MS)
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (isTrickActive.value) return
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (isTypingTarget(event.target)) return

    if (isExperienceVisible.value) {
      if (event.key === 'Enter' && revealGame()) {
        // Consumed by the shell: the running game must not hear this Enter.
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
      }
      return
    }

    if (event.key === 'Enter') {
      if (buffer === CODE) activate()
      buffer = ''
      return
    }

    buffer = /^[a-z]$/i.test(event.key)
      ? (buffer + event.key.toLowerCase()).slice(-CODE.length)
      : ''
  }

  // Capture phase: this listener runs before the game engine listeners, so a
  // consumed Enter never reaches the running game.
  onMounted(() => window.addEventListener('keydown', handleKeydown, true))

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown, true)
    window.clearTimeout(timer)
  })

  return { isTrickActive }
}

export { isTrickActive }
