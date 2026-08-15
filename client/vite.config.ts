import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API runs on :4000 in dev; in production the Express server serves this build
// from the same origin, so every fetch in the app uses a relative /api path.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Bind to the LAN as well, so the dev server prints a Network address you
    // can open on a phone on the same WiFi. Testing on a real phone is the
    // only way to know this site works.
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2019',
    cssTarget: 'chrome80',
    assetsInlineLimit: 2048,
  },
});
