import { reactive } from 'vue'

/**
 * Calidad de dibujo.
 *
 * Politica (ADR-019): la vista **completa es el defecto en todos los
 * dispositivos**. El modo ligero ya no se detecta solo: es una eleccion manual
 * (URL, panel de diagnostico) para medir o para quien prefiera ahorrar bateria.
 * `prefers-reduced-motion` no pasa por aqui: cada componente ya congela sus
 * animaciones con esa consulta, que es lo unico automatico que queda.
 *
 * El modo ligero no cambia el diseno: recorta lo que se paga en pixeles y en
 * composicion, sin quitar ninguna capa visible.
 */
export interface QualityState {
  /** Recorte general. Es el interruptor maestro. Por defecto, `false`. */
  lite: boolean
  /** Montar el fondo de ruido de TV. Su capa queda tapada salvo en el flash. */
  tvStatic: boolean
  /**
   * Escala de dibujo del terminal: 1 = nativo, 0.5 = un cuarto de pixeles. Se
   * aplica dando al canvas un backing store menor que el CSS lo estira, asi que
   * **cambia en caliente** sin recrear el contexto WebGL (el `dpr` de
   * khatarsis se fija al crear el renderer y no hay forma de alterarlo vivo).
   */
  terminalScale: number
  /** Limite de fotogramas del terminal (0 = sin limite). */
  terminalFps: number
  /** Pila de `backdrop-filter` del navbar. */
  backdropBlur: boolean
}

// v2: la eleccion del panel experimental v1 no debe sobrevivir al cambio de
// politica (el telefono del propietario se quedo con "ligero" de una prueba).
const STORAGE_KEY = 'portfolio-quality-v2'

/**
 * Pantalla tactil. Medido en el iPhone 6s: la vista completa a escala 0.25 del
 * terminal da 60 fps (muestra de 5 s, 1 frame lento), asi que en movil el
 * defecto de la vista completa dibuja el shader a 0.25; en escritorio, a 1.
 * Se mide una vez: el dispositivo no cambia de tipo de pantalla en caliente.
 */
const TOUCH_QUERY = '(hover: none), (pointer: coarse)'
const isTouchDevice = typeof window !== 'undefined' && window.matchMedia(TOUCH_QUERY).matches

/** Estado derivado del modo: una sola decision (`lite`) manda sobre el resto. */
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

/**
 * Preferencia guardada. Gana sobre el defecto, para que una eleccion hecha en
 * el panel de diagnostico sobreviva a la recarga (si no, no se podria medir el
 * mismo dispositivo dos veces con ajustes distintos).
 */
function storedLite(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (value === null) return null
    return JSON.parse(value) === true
  } catch {
    return null
  }
}

/** `?q=lite` / `?q=full` fuerzan el modo una vez, sin tocar lo guardado. */
function urlLite(): boolean | null {
  if (typeof window === 'undefined') return null
  const mode = new URLSearchParams(window.location.search).get('q')
  if (mode === 'lite') return true
  if (mode === 'full') return false
  return null
}

function initial(): QualityState {
  const lite = urlLite() ?? storedLite() ?? false
  return { lite, ...derived(lite) }
}

export const quality = reactive<QualityState>(initial())

function persist(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quality.lite))
  } catch {
    // Modo privado o almacenamiento lleno: la eleccion simplemente no persiste.
  }
}

/** Cambio de modo completo: derivados incluidos. Es lo que usa el panel. */
export function setLite(lite: boolean): void {
  Object.assign(quality, { lite }, derived(lite))
  persist()
}

/**
 * Ajuste suelto de una sola capa, para medir su coste por separado (p. ej.
 * `terminalScale` a 0.75 sin salir del modo completo). Un cambio de modo
 * posterior sobreescribe estos valores con los derivados.
 */
export function patchQuality(patch: Partial<Omit<QualityState, 'lite'>>): void {
  Object.assign(quality, patch)
}

/**
 * El panel de diagnostico (`public/diag.js`) vive fuera del bundle y no puede
 * tocar el estado reactivo: se comunican por evento.
 */
export function initQuality(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('vc-quality', event => {
    const detail = (event as CustomEvent<Partial<QualityState>>).detail
    if (!detail) return
    if (typeof detail.lite === 'boolean') setLite(detail.lite)
    patchQuality(detail)
  })
}
