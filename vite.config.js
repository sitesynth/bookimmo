import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Local dev has no serverless functions: forward API calls to production.
    proxy: {
      '/api': { target: 'https://book.immo', changeOrigin: true },
    },
  },
})
