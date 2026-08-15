import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { env } from './env.js';
import { createRouter } from './routes.js';
import { createStore } from './store.js';

async function main() {
  const store = await createStore();
  const app = express();

  app.disable('x-powered-by');
  // Behind Render/Railway/a reverse proxy, so req.ip is the visitor and not the
  // proxy — the login rate limit counts per real address.
  app.set('trust proxy', 1);

  /**
   * No CORS by default. The site and the API are the same origin in production,
   * and in development Vite proxies /api, so the browser never makes a
   * cross-origin call. Opening it up would let any page on the internet talk to
   * this API from a visitor's browser. Set ALLOWED_ORIGIN only if you split the
   * two across domains.
   */
  if (env.allowedOrigin) {
    app.use(cors({ origin: env.allowedOrigin, credentials: true }));
  }

  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Content-Security-Policy': [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        // Inline style attributes are used for the backdrop and the meters.
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self'",
        "img-src 'self' data: blob:",
        "media-src 'self' blob:",
        // Vite inlines any font under 4KB as a data: URI. Fonts cannot execute.
        "font-src 'self' data:",
        "connect-src 'self'",
      ].join('; '),
    });
    next();
  });

  app.use(express.json({ limit: '256kb' }));

  app.use('/api', createRouter(store));

  // In production this server also serves the built site, so the client's
  // relative /api calls need no configuration at all.
  const indexHtml = path.join(env.clientDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(env.clientDist, { maxAge: '1h', index: false }));
    app.get('*', (req, res) => {
      // Keep the score-entry page out of search results.
      if (req.path.replace(/\/+$/, '') === '/admin') res.set('X-Robots-Tag', 'noindex, nofollow');
      res.sendFile(indexHtml);
    });
  } else {
    app.get('/', (_req, res) => {
      res.type('text/plain').send('API is up. Run `npm run dev` for the site, or `npm run build` first.');
    });
  }

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[api]', error.message);
    res.status(500).json({ error: 'Something broke on our side. Try again in a moment.' });
  });

  const server = app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port} · store: ${store.describe}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[api] ${signal} — shutting down`);
    server.close();
    await store.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('[api] failed to start:', error);
  process.exit(1);
});
