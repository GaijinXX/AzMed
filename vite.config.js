import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  
  return {
    // GitHub Pages deployment configuration
    base: mode === 'production' ? '/AzMed/' : '/',
    plugins: [
      react({
        babel: {
          plugins: [
            ['babel-plugin-react-compiler', { 
              target: '19',
              // Enable React Compiler optimizations
              compilationMode: 'annotation',
              panicThreshold: 'all_errors'
            }]
          ]
        }
      })
    ],
    optimizeDeps: {
      include: ['react', 'react-dom', '@supabase/supabase-js'],
      // Force pre-bundling for better performance
      force: true
    },
    build: {
      target: isProduction ? 'esnext' : 'modules',
      minify: isProduction ? 'esbuild' : false,
      // Enhanced build optimizations for React 19
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor'
              }
              if (id.includes('@supabase')) {
                return 'supabase'
              }
              return 'vendor'
            }
          },
          // Optimize asset naming for better caching
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`
            }
            if (/css/i.test(ext)) {
              return `assets/css/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js'
        }
      },
      // Enable source maps for production debugging (can be disabled for smaller builds)
      sourcemap: isProduction ? false : true,
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Additional production optimizations
      reportCompressedSize: isProduction
    },
    server: {
      port: 3000,
      open: true,
      host: true // Allow external connections for development
    },
    preview: {
      port: 4173,
      host: true
    },
    // Performance optimizations
    esbuild: {
      // Drop console and debugger in production
      drop: isProduction ? ['console', 'debugger'] : [],
      // Enable JSX automatic runtime for React 19
      jsx: 'automatic',
      // Optimize for production
      minifyIdentifiers: isProduction,
      minifySyntax: isProduction,
      minifyWhitespace: isProduction
    },
    // Define global constants
    define: {
      __DEV__: !isProduction,
      __PROD__: isProduction
    }
  }
})