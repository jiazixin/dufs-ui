import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/__ASSETS_PREFIX__/' : '/',
  plugins: [
    vue(),
    {
      name: 'dufs-assets-prefix',
      enforce: 'post',
      transformIndexHtml(html) {
        return html.replaceAll('/__ASSETS_PREFIX__/', '__ASSETS_PREFIX__')
      },
    },
  ],
  build: {
    target: ['es2022', 'chrome110', 'safari16', 'firefox115'],
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: 'chunk-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.names.some((n) => n.endsWith('.css'))) {
            return 'index.css'
          }
          return '[name][extname]'
        },
      },
    },
  },
}))
