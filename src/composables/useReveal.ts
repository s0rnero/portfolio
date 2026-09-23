import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Ref } from 'vue'
import { onMounted, onBeforeUnmount } from 'vue'

gsap.registerPlugin(ScrollTrigger)

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function useReveal(containerRef: Ref<HTMLElement | null>, opts: { start?: string } = {}) {
  const { start = 'top 82%' } = opts
  let trigger: ScrollTrigger | null = null
  let cleanupFns: Array<() => void> = []

  onMounted(() => {
    const el = containerRef.value
    if (!el || prefersReducedMotion()) return

    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!items.length) return

    items.forEach(i => gsap.set(i, { autoAlpha: 0, y: 40 }))

    const tween = gsap.to(items, {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: el,
        start,
        once: true,
        onLeave: () => trigger?.disable(),
      },
    })

    trigger = tween.scrollTrigger ?? null
    cleanupFns = [() => tween?.scrollTrigger?.kill(), () => tween?.kill()]
  })

  onBeforeUnmount(() => {
    cleanupFns.forEach(fn => fn())
  })
}
