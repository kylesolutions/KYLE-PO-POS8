import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://109.199.100.136:6060',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Remove Expect header to prevent 417 errors
            proxyReq.removeHeader('Expect');
          });
          proxy.on('error', (err) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`Proxied request: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
          });
        },
      },
    },
  },
});