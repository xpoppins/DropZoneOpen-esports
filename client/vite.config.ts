import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The public address of the site, used for canonical, og:image, the JSON-LD
 * graph and the sitemap. Order: a real environment variable (set one in the
 * Render dashboard and it wins), then client/.env, then this default.
 *
 * The fallback matters: if index.html shipped with an unreplaced
 * `%VITE_SITE_URL%` in its canonical tag, every crawler would see a broken
 * URL, which is worse than having no canonical at all.
 */
const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://dropzoneopen-esports.onrender.com').replace(/\/+$/, '');

/** Fills %VITE_SITE_URL% in index.html even when no .env file is present. */
const siteUrlHtml = () => ({
  name: 'dz-site-url-html',
  transformIndexHtml: (html: string) => html.split('%VITE_SITE_URL%').join(SITE_URL),
});

// The API runs on :4000 in dev; in production the Express server serves this build
// from the same origin, so every fetch in the app uses a relative /api path.
export default defineConfig({
  plugins: [react(), siteUrlHtml()],
  define: {
    // Keep the TypeScript side reading the same value as the HTML side.
    'import.meta.env.VITE_SITE_URL': JSON.stringify(SITE_URL),
  },
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
