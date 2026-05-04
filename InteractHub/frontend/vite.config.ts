import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy tất cả /api/* đến backend .NET
      '/api': {
        target: 'http://localhost:5073',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
