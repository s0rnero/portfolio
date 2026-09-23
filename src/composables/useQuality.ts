import { reactive } from 'vue'

export interface QualityState {
  lite: boolean
  tvStatic: boolean
  terminalScale: number
  terminalFps: number
  backdropBlur: boolean
}

const TOUCH_QUERY = '(hover: none), (pointer: coarse)'
const isTouchDevice = typeof window !== 'undefined' && window.matchMedia(TOUCH_QUERY).matches

function derived(lite: boolean): Omit<QualityState, 'lite'> {
  if (lite) {
    return { tvStatic: false, terminalScale: 0.5, terminalFps: 30, backdropBlur: false }
  }
  return {
    tvStatic: true,
    terminalScale: isTouchDevice ? 0.25 : 1,
    terminalFps: 0,
    backdropBlur: true,
  }
}

function initial(): QualityState {
  return { lite: false, ...derived(false) }
}

export const quality = reactive<QualityState>(initial())
