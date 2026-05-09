import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: './src',
  base: '/',
  server: {
    port: 5173,
    strictPort: true, // Add this line
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/hello': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: '../dist'
  }
})

