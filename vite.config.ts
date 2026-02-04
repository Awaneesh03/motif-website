import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// Custom plugin to ensure SPA fallback works correctly
function spaFallbackPlugin(): PluginOption {
  return {
    name: 'spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url || ''
        // Skip API routes, static assets, and files with extensions
        if (
          url.startsWith('/api') ||
          url.startsWith('/assets') ||
          url.startsWith('/@') ||
          url.startsWith('/node_modules') ||
          url.includes('.')
        ) {
          return next()
        }
        // Rewrite all other routes to index.html for SPA routing
        req.url = '/index.html'
        next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  appType: 'spa',
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 700, // Adjusted for app size (main bundle ~680KB)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-accordion',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select',
          ],
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts'],
          motion: ['motion'],
        },
      },
    },
  },
})
