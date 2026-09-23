// Local typings for the vendored `gtavc-web` Vite plugin.
// The upstream package maps `./vite` to `index.d.ts`; this file wires the same
// contract for the relative copy under `src/vendor/gtavc-web/`.
import type { VcWebPluginOptions } from './index.js'

export interface ViceCityVitePlugin {
  name: string
  configureServer: (server: unknown) => void
  configurePreviewServer: (server: unknown) => void
}

export declare function vcWeb(options?: VcWebPluginOptions): ViceCityVitePlugin

export default vcWeb
