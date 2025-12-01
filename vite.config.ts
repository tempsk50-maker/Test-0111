import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // CRITICAL: base: './' allows the app to load assets when opened as a local file in Android WebView
  base: './', 
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['lucide-react'],
          utils: ['html2canvas', '@google/genai']
        }
      }
    }
  },
  server: {
    port: 3000
  }
});