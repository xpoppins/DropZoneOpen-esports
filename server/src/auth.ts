import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { env } from './env.js';

const COOKIE = 'dz_admin';
const SESSION_MS = 8 * 60 * 60 * 1000; // a match night, then log in again

/** Brute-force policy: this many bad passwords buys a cool-off. */
const MAX_FAILS = 8;
const LOCK_MS = 15 * 60 * 1000;
const FAIL_WINDOW_MS = 15 * 60 * 1000;

/** In memory on purpose: a restart logs admins out, which is the safe default.
 *  It also means sessions do not survive across multiple instances — fine for
 *  the single-instance deploy this ships for. */
const sessions = new Map<string, number>();
const attempts = new Map<string, { fails: number; first: number; until: number }>();

function sweep(): void {
  const now = Date.now();
  for (const [id, expires] of sessions) if (expires <= now) sessions.delete(id);
  for (const [ip, record] of attempts) if (record.until <= now && now - record.first > FAIL_WINDOW_MS) attempts.delete(ip);
}

setInterval(sweep, 10 * 60 * 1000).unref();

/** Compares without leaking, through timing, how much of the token matched. */
export function tokenMatches(candidate: string | undefined): boolean {
  if (!env.adminToken || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(env.adminToken);
  // timingSafeEqual throws on a length mismatch, so equalise first — the hash
  // keeps both sides the same size without revealing the real length.
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function clientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

export function lockedFor(ip: string): number {
  const record = attempts.get(ip);
  if (!record) return 0;
  return Math.max(0, record.until - Date.now());
}

export function recordFailure(ip: string): void {
  const now = Date.now();
  const record = attempts.get(ip) ?? { fails: 0, first: now, until: 0 };
  if (now - record.first > FAIL_WINDOW_MS) {
    record.fails = 0;
    record.first = now;
  }
  record.fails += 1;
  if (record.fails >= MAX_FAILS) {
    record.until = now + LOCK_MS;
    record.fails = 0;
    record.first = now;
  }
  attempts.set(ip, record);
}

export function recordSuccess(ip: string): void {
  attempts.delete(ip);
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

export function hasValidSession(req: Request): boolean {
  const id = parseCookies(req.get('cookie'))[COOKIE];
  if (!id) return false;
  const expires = sessions.get(id);
  if (!expires) return false;
  if (expires <= Date.now()) {
    sessions.delete(id);
    return false;
  }
  return true;
}

export function startSession(res: Response): void {
  const id = crypto.randomBytes(32).toString('hex');
  sessions.set(id, Date.now() + SESSION_MS);

  res.cookie(COOKIE, id, {
    httpOnly: true, // never readable from JavaScript, so XSS cannot steal it
    sameSite: 'strict', // and no other site can ride along on it
    secure: env.isProduction,
    path: '/',
    maxAge: SESSION_MS,
  });
}

export function endSession(req: Request, res: Response): void {
  const id = parseCookies(req.get('cookie'))[COOKIE];
  if (id) sessions.delete(id);
  res.clearCookie(COOKIE, { path: '/' });
}
