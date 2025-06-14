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
  server: {
    proxy: {
      '/proxy/': 'http://localhost:8081',
      '/uploads/': 'http://localhost:8081',
      '/admin/conf/': 'http://localhost:8081',
      '/files/': 'http://localhost:8081',
    },
  },
  build: {
    chunkSizeWarningLimit: 80,
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
