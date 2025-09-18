import { defineConfig } from 'vite'

export default defineConfig({
  // Base public path when served in development or production
  base: './',
  
  // Build options
  build: {
    // Output directory for build command
    outDir: 'dist',
    
    // Generate source maps for production builds
    sourcemap: true,
    
    // Minify with esbuild for better compatibility and speed
    minify: 'esbuild',
    
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          'pdf-lib': ['pdfjs-dist'],
          'jspdf': ['jspdf']
        }
      }
    },
    
    // Build target
    target: 'es2015',
    
    // Assets inline limit
    assetsInlineLimit: 4096
  },
  
  // Development server options
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true
  },
  
  // Preview server options
  preview: {
    port: 4173,
    host: true,
    open: true
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  
  // CSS options
  css: {
    devSourcemap: true
  },
  
  // Optimizations
  optimizeDeps: {
    include: ['pdfjs-dist/build/pdf.js', 'jspdf'],
    exclude: ['pdfjs-dist/build/pdf.worker.entry']
  }
})
