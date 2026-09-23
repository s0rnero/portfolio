import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

export function initSmoothScroll() {
  lenis?.destroy()
  lenis = new Lenis({
    duration: 1.2,
    smoothWheel: true,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  })

  lenis.on('scroll', ScrollTrigger.update)

  const raf = (time: number) => {
    lenis?.raf(time * 1000)
  }
  gsap.ticker.lagSmoothing(0)
  gsap.ticker.add(raf)

  return () => {
    gsap.ticker.remove(raf)
    lenis?.destroy()
    lenis = null
  }
}

export function scrollTo(target: string | number, offset = -80, immediate = false) {
  if (lenis) {
    lenis.scrollTo(target, { offset, immediate })
  } else if (typeof target === 'string') {
    document.querySelector(target)?.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' })
  } else {
    window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' })
  }
}
