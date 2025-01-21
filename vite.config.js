import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://109.199.100.136:6060', 
        changeOrigin: true, 
        rewrite: (path) => {
          console.log(`Rewriting path: ${path}`); 
          return path.replace(/^\/api/, '/api'); 
        },
        secure: false, 
        logLevel: 'debug', 
      },
    },
  },
})
