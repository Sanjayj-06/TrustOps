import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for TrustPatch frontend
// - Runs dev server on port 5173
// - Proxies /api/* requests to the Docker backend on port 8000
// - This avoids CORS issues during development
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all API calls to the FastAPI backend
      '/upload': 'http://localhost:8000',
      '/baseline': 'http://localhost:8000',
      '/trustpatch': 'http://localhost:8000',
      '/history': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    }
  }
})
