import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { visualizer } from 'rollup-plugin-visualizer'
import { NodePackageImporter } from 'sass-embedded'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    visualizer({
      open: true,
      gzipSize: true,
    }),
  ],
  build: {
    chunkSizeWarningLimit: 75,
  },
  preview: {
    port: 5173,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler', // or "modern", "legacy"
        importers: [
          new NodePackageImporter(),
        ],
      },
    },
  },
})
