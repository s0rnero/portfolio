import path from 'node:path'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { transform } from 'lightningcss'
import { khatarsisAutoRegister } from 'khatarsis/vite'
import { vcWeb } from './src/vendor/gtavc-web/vite.js'

function legacyMediaQueries(): Plugin {
  return {
    name: 'legacy-media-queries',
    closeBundle() {
      const dir = path.resolve(import.meta.dirname, 'dist/assets')
      let files: string[] = []
      try {
        files = readdirSync(dir)
          .filter(f => f.endsWith('.css'))
          .map(f => path.join(dir, f))
      } catch {
        return
      }
      const targets = {
        safari: 15 << 16,
        ios_saf: 15 << 16,
        chrome: 90 << 16,
        firefox: 90 << 16,
        edge: 90 << 16,
      }
      for (const file of files) {
        const original = readFileSync(file, 'utf8')
        const { code } = transform({
          filename: file,
          code: Buffer.from(original),
          minify: false,
          errorRecovery: true,
          targets,
        })
        writeFileSync(file, code)
        const before = (original.match(/width\s*[<>]/g) || []).length
        const after = (code.toString().match(/width\s*[<>]/g) || []).length
        if (before !== after)
          console.log(
            `legacy-media-queries: ${path.basename(file)}: ${before - after} MQ convertidas`,
          )
      }
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    legacyMediaQueries(),
    khatarsisAutoRegister({ include: ['k-dialog'] }),
    vcWeb({
      streamedDir: process.env.VC_STREAMED_DIR,
      assetsDir: process.env.VC_ASSETS_DIR,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
})
