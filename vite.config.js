import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
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
    target: 'esnext',
    minify: 'esbuild',
    // Enhanced build optimizations for React 19
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    },
    // Enable source maps for production debugging
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true
  },
  server: {
    port: 3000,
    open: true
  },
  // Performance optimizations
  esbuild: {
    // Drop console and debugger in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})