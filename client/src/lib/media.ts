export type MediaKind = 'image' | 'video' | 'audio' | 'click';

type MediaMeta = { kind: MediaKind; contentType: string; size: number; updatedAt: string };

/**
 * What the organiser has uploaded from /admin, as ready-to-use URLs. The
 * ?v=<timestamp> means a new upload is a new URL, so a replaced background
 * shows up immediately instead of being served from cache for a week.
 *
 * An unreachable API is normal (the site works without one) and returns {}.
 */
export async function fetchMediaMap(): Promise<Partial<Record<MediaKind, string>>> {
  try {
    const res = await fetch('/api/media', { headers: { accept: 'application/json' } });
    if (!res.ok) return {};
    const payload = (await res.json()) as { media?: MediaMeta[] };
    const entries = (payload.media ?? []).map(
      (m) => [m.kind, `/api/media/${m.kind}?v=${Date.parse(m.updatedAt) || 0}`] as const,
    );
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

/** True when the file exists and is not the dev server's index.html. */
export async function exists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) return false;
    return !(res.headers.get('content-type') ?? '').includes('text/html');
  } catch {
    return false;
  }
}

/** First URL in the list that actually exists. */
export async function firstAvailable(urls: Array<string | undefined>): Promise<string | null> {
  for (const url of urls) {
    if (!url) continue;
    if (await exists(url)) return url;
  }
  return null;
}
