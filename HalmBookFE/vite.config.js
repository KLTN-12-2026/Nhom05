import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [
    react(),
    mkcert() 
  ],
  server: {
    host: 'localhost', 
    port: 5173,
    https: true,       // Lệnh bắt buộc để Vite chuyển sang giao thức HTTPS
    headers: {         
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    }
  }
})