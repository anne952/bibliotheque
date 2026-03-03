import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// URL du backend
const API_URL = process.env.VITE_API_URL || 'https://bibliotheque-backend-1.onrender.com'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@mui/material'],
          utils: ['html2canvas', 'jspdf']
        }
      }
    }
  }
})