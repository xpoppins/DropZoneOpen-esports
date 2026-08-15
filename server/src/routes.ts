import express, { Router, type NextFunction, type Request, type Response } from 'express';
import {
  clientIp,
  endSession,
  hasValidSession,
  lockedFor,
  recordFailure,
  recordSuccess,
  startSession,
  tokenMatches,
} from './auth.js';
import { env } from './env.js';
import { MEDIA_KINDS, type MediaKind, type Store } from './store.js';
import { STAGE_KEYS, type StageKey } from './types.js';

const isStageKey = (value: string): value is StageKey => (STAGE_KEYS as string[]).includes(value);
const isMediaKind = (value: string): value is MediaKind => (MEDIA_KINDS as readonly string[]).includes(value);

/** What each slot accepts, and how big it may get. A background video is the
 *  one thing a visitor on mobile data really pays for, so it is kept small. */
const EXPECTED_TYPE: Record<MediaKind, string> = {
  image: 'image/',
  video: 'video/',
  audio: 'audio/',
  click: 'audio/',
};

const KIND_LIMIT_MB: Record<MediaKind, number> = { image: 6, video: 12, audio: 6, click: 2 };
const MEDIA_LIMIT_MB = Math.max(...Object.values(KIND_LIMIT_MB));

const starts = (buf: Buffer, hex: string) => buf.subarray(0, hex.length / 2).equals(Buffer.from(hex, 'hex'));
const ascii = (buf: Buffer, text: string, at = 0) => buf.subarray(at, at + text.length).toString('latin1') === text;

/**
 * What the bytes actually are, regardless of what the upload claimed. An
 * allow-list of real container signatures, which is also what keeps SVG out:
 * an SVG is XML, it matches nothing here, and serving one from our own origin
 * would let it run scripts as us.
 */
function sniffFamily(buf: Buffer): 'image' | 'video' | 'audio' | null {
  if (buf.length < 12) return null;

  if (starts(buf, '89504e470d0a1a0a')) return 'image'; // PNG
  if (starts(buf, 'ffd8ff')) return 'image'; // JPEG
  if (ascii(buf, 'GIF8')) return 'image'; // GIF
  if (ascii(buf, 'RIFF') && ascii(buf, 'WEBP', 8)) return 'image';
  if (ascii(buf, 'RIFF') && ascii(buf, 'WAVE', 8)) return 'audio';

  if (ascii(buf, 'ftyp', 4)) {
    // MP4 family: M4A is audio, everything else here is video.
    const brand = buf.subarray(8, 12).toString('latin1');
    return brand.startsWith('M4A') ? 'audio' : 'video';
  }

  if (starts(buf, '1a45dfa3')) return 'video'; // Matroska / WebM
  if (ascii(buf, 'ID3')) return 'audio'; // MP3 with tags
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return 'audio'; // raw MP3 frame
  if (ascii(buf, 'OggS')) return 'audio';

  return null;
}

/**
 * Write endpoints stay shut until ADMIN_TOKEN is set — no token, no writes.
 * Two ways in: the session cookie the /admin page gets after logging in, or the
 * raw header for scripts and curl. Both are rate limited per IP.
 */
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!env.adminToken) {
    res.status(503).json({
      error: 'Admin API is off. Set ADMIN_TOKEN in server/.env and restart to enable score updates.',
    });
    return;
  }

  if (hasValidSession(req)) {
    next();
    return;
  }

  const ip = clientIp(req);
  const locked = lockedFor(ip);
  if (locked > 0) {
    res.status(429).json({ error: `Too many failed attempts. Try again in ${Math.ceil(locked / 60000)} minutes.` });
    return;
  }

  if (!tokenMatches(req.get('x-admin-token'))) {
    recordFailure(ip);
    res.status(401).json({ error: 'Not signed in. Open /admin and enter the admin password.' });
    return;
  }

  recordSuccess(ip);
  next();
}

const wrap =
  (handler: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };

export function createRouter(store: Store): Router {
  const api = Router();

  // The detail names a filesystem path, so it is for signed-in admins only.
  api.get('/health', (req, res) => {
    const admin = hasValidSession(req);
    res.json({ ok: true, store: store.mode, ...(admin ? { detail: store.describe } : {}) });
  });

  // ── admin session ───────────────────────────────────────────────────────
  api.get('/admin/session', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ authenticated: hasValidSession(req), enabled: Boolean(env.adminToken) });
  });

  api.post('/admin/login', (req, res) => {
    res.set('Cache-Control', 'no-store');

    if (!env.adminToken) {
      res.status(503).json({ error: 'Admin is off. Set ADMIN_TOKEN in server/.env and restart.' });
      return;
    }

    const ip = clientIp(req);
    const locked = lockedFor(ip);
    if (locked > 0) {
      res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(locked / 60000)} minutes.` });
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!tokenMatches(password)) {
      recordFailure(ip);
      // Deliberately slow, and deliberately vague about which part was wrong.
      setTimeout(() => res.status(401).json({ error: 'Wrong password.' }), 400);
      return;
    }

    recordSuccess(ip);
    startSession(res);
    res.json({ ok: true });
  });

  api.post('/admin/logout', (req, res) => {
    endSession(req, res);
    res.json({ ok: true });
  });

  // ── read ────────────────────────────────────────────────────────────────
  api.get(
    '/standings',
    wrap(async (_req, res) => {
      res.set('Cache-Control', 'public, max-age=15');
      res.json(await store.getResults());
    }),
  );

  api.get(
    '/standings/:stage',
    wrap(async (req, res) => {
      const key = req.params.stage;
      if (!isStageKey(key)) {
        res.status(404).json({ error: `Unknown stage "${key}". Use qualifiers, semis or finals.` });
        return;
      }
      const results = await store.getResults();
      res.set('Cache-Control', 'public, max-age=15');
      res.json(results.stages[key]);
    }),
  );

  api.get(
    '/tournament',
    wrap(async (_req, res) => {
      res.set('Cache-Control', 'public, max-age=15');
      res.json(await store.getState());
    }),
  );

  // ── write ───────────────────────────────────────────────────────────────
  api.put(
    '/standings/:stage',
    requireAdmin,
    wrap(async (req, res) => {
      const key = req.params.stage;
      if (!isStageKey(key)) {
        res.status(404).json({ error: `Unknown stage "${key}". Use qualifiers, semis or finals.` });
        return;
      }
      res.json(await store.putStage(key, req.body));
    }),
  );

  api.patch(
    '/tournament',
    requireAdmin,
    wrap(async (req, res) => {
      res.json(await store.patchState(req.body));
    }),
  );

  // ── how many squads opened the form ─────────────────────────────────────
  api.post(
    '/registrations/intent',
    wrap(async (req, res) => {
      await store.recordIntent(String(req.get('referer') ?? '').slice(0, 200));
      res.status(204).end();
    }),
  );

  api.get(
    '/registrations/intent/count',
    requireAdmin,
    wrap(async (_req, res) => {
      res.json({ count: await store.countIntents() });
    }),
  );

  // ── backdrop and sound, swapped from /admin ─────────────────────────────
  api.get(
    '/media',
    wrap(async (_req, res) => {
      res.set('Cache-Control', 'no-store');
      res.json({ media: await store.listMedia() });
    }),
  );

  api.get(
    '/media/:kind',
    wrap(async (req, res) => {
      const kind = req.params.kind;
      if (!isMediaKind(kind)) {
        res.status(404).json({ error: `Unknown media "${kind}".` });
        return;
      }

      const found = await store.getMedia(kind);
      if (!found) {
        res.status(404).json({ error: 'Nothing uploaded for this slot.' });
        return;
      }

      const etag = `"${kind}-${Date.parse(found.meta.updatedAt)}"`;
      if (req.get('if-none-match') === etag) {
        res.status(304).end();
        return;
      }

      // Long max-age is safe: the URL carries ?v=<updatedAt>, so a new upload
      // is a new URL. The ETag covers anyone who asks without it.
      res.set({
        'Content-Type': found.meta.contentType,
        'Cache-Control': 'public, max-age=604800',
        ETag: etag,
      });
      res.send(found.data);
    }),
  );

  api.put(
    '/media/:kind',
    requireAdmin,
    express.raw({ type: () => true, limit: MEDIA_LIMIT_MB * 1024 * 1024 }),
    wrap(async (req, res) => {
      const kind = req.params.kind;
      if (!isMediaKind(kind)) {
        res.status(404).json({ error: `Unknown media "${kind}".` });
        return;
      }

      const data = req.body;
      if (!Buffer.isBuffer(data) || data.length === 0) {
        res.status(400).json({ error: 'No file received.' });
        return;
      }

      const contentType = (req.get('content-type') ?? '').split(';')[0].trim();
      const expected = EXPECTED_TYPE[kind];
      if (!contentType.startsWith(expected)) {
        res.status(415).json({ error: `That slot needs ${expected}* — the file you picked is "${contentType}".` });
        return;
      }

      // Never trust the header: check the bytes agree with it.
      const family = sniffFamily(data);
      if (!family || `${family}/` !== expected) {
        res.status(415).json({
          error: `That file is not a real ${expected.replace('/', '')} file. Use PNG, JPEG, WebP, MP4, WebM, MP3, WAV or OGG.`,
        });
        return;
      }

      const limit = KIND_LIMIT_MB[kind];
      if (data.length > limit * 1024 * 1024) {
        res.status(413).json({
          error: `Too big: ${(data.length / 1024 / 1024).toFixed(1)} MB. Keep ${kind} under ${limit} MB.`,
        });
        return;
      }

      res.json(await store.putMedia(kind, contentType, data));
    }),
  );

  api.delete(
    '/media/:kind',
    requireAdmin,
    wrap(async (req, res) => {
      const kind = req.params.kind;
      if (!isMediaKind(kind)) {
        res.status(404).json({ error: `Unknown media "${kind}".` });
        return;
      }
      await store.deleteMedia(kind);
      res.status(204).end();
    }),
  );

  api.use((_req, res) => {
    res.status(404).json({ error: 'No such endpoint.' });
  });

  return api;
}
