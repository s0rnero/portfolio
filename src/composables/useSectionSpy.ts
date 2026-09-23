import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export interface SpySection {
  sectionId: string
  hash: string
}

interface SectionSpyOptions {
  line?: number
}

let lastSpyNavAt = 0

export function wasSpyNav(maxAgeMs = 300): boolean {
  return Date.now() - lastSpyNavAt < maxAgeMs
}

const ACTIVE_LINE = 0.35
const MOUNT_GRACE_MS = 3000

export function useSectionSpy(
  sections: readonly SpySection[],
  { line = ACTIVE_LINE }: SectionSpyOptions = {},
): void {
  const router = useRouter()
  const route = useRoute()

  let frame = 0
  // The target is read live on every sync (never cached): on fresh loads the
  // route object can still hold the start location when this runs, and a stale
  // snapshot would wipe a deep link it never saw.
  const mountedAt = Date.now()

  const targetHash = (): string => {
    if (route.hash) return route.hash
    const meta = route.meta.section
    if (typeof meta === 'string' && meta !== '') {
      return sections.find(entry => entry.sectionId === meta)?.hash ?? ''
    }
    return ''
  }

  const activeHash = (): string => {
    const limit = window.innerHeight * line
    let hash = ''
    for (const section of sections) {
      const el = document.getElementById(section.sectionId)
      if (el && el.getBoundingClientRect().top <= limit) hash = section.hash
    }
    return hash
  }

  const sync = () => {
    frame = 0
    const hash = activeHash()
    const target = targetHash()
    // A deep link (/#about, /projects) that hasn't landed yet: while the page
    // is still at the top the active section is unknown, so the URL is never
    // touched. The grace period covers layout settling on fresh loads only.
    if (target !== '' && window.scrollY === 0 && Date.now() - mountedAt < MOUNT_GRACE_MS) return
    if (hash === route.hash) return
    lastSpyNavAt = Date.now()
    void router.replace(hash ? { path: '/', hash } : { path: '/' })
  }

  const schedule = () => {
    if (frame) return
    frame = window.requestAnimationFrame(sync)
  }

  onMounted(() => {
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    schedule()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    if (frame) window.cancelAnimationFrame(frame)
    frame = 0
  })
}
