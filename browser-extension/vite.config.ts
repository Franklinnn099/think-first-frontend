import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './public/manifest.json'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    {
      name: 'build-content-script',
      async writeBundle() {
        const esbuild = await import('esbuild')
        await esbuild.build({
          entryPoints: ['src/content/index.ts'],
          bundle: true,
          outfile: 'dist/content.js',
          format: 'iife',
          minify: true,
          target: 'chrome110',
        })
        console.log('✓ content.js bundled')
      },
    },
  ],
})
