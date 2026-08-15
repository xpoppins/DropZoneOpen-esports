import { useCallback, useEffect, useRef, useState } from 'react';

type Kind = 'image' | 'video' | 'audio' | 'click';
type Meta = { kind: Kind; contentType: string; size: number; updatedAt: string };

const SLOTS: Array<{
  kind: Kind;
  title: string;
  accept: string;
  limitMb: number;
  hint: string;
  shipped: string;
}> = [
  {
    kind: 'image',
    title: 'Background image',
    accept: 'image/*',
    limitMb: 6,
    hint: 'Shown behind every section, blurred and darkened. A wide screenshot (1600×900 or bigger) works best — sharpness does not matter, colour does.',
    shipped: 'the shipped placeholder artwork',
  },
  {
    kind: 'video',
    title: 'Background video',
    accept: 'video/*',
    limitMb: 12,
    hint: 'Optional. Plays only on desktop, and never on phones, metered connections, or reduced-motion devices — those keep the image. Keep it 6–12 seconds and silent.',
    shipped: 'no video (the image is used)',
  },
  {
    kind: 'audio',
    title: 'Background sound',
    accept: 'audio/*',
    limitMb: 6,
    hint: 'The ambient loop behind the site. Only ever plays after a visitor presses the sound button.',
    shipped: 'the shipped ambient placeholder',
  },
  {
    kind: 'click',
    title: 'Click sound',
    accept: 'audio/*',
    limitMb: 2,
    hint: 'The short tick when a button is pressed. Under half a second.',
    shipped: 'the shipped tick placeholder',
  },
];

const kb = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

type Props = {
  onMessage: (msg: { kind: 'ok' | 'err'; text: string } | null) => void;
  /** The session went away mid-upload — hand the page back to the sign-in. */
  onSignedOut: () => void;
};

/**
 * Swap the backdrop and the sounds without touching the code — the point being
 * that next season is a few uploads, not a redeploy. Files are stored by the
 * API (in MongoDB when it is configured), so they survive a restart.
 */
export function MediaPanel({ onMessage, onSignedOut }: Props) {
  const [media, setMedia] = useState<Record<string, Meta>>({});
  const [busy, setBusy] = useState<Kind | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/media');
      const payload = (await res.json()) as { media: Meta[] };
      setMedia(Object.fromEntries(payload.media.map((m) => [m.kind, m])));
    } catch {
      /* the list is a nicety; uploading still works */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (kind: Kind, file: File) => {
    setBusy(kind);
    onMessage(null);
    try {
      const res = await fetch(`/api/media/${kind}`, {
        method: 'PUT',
        headers: { 'content-type': file.type || 'application/octet-stream' },
        body: file,
      });
      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onSignedOut();
        throw new Error('Signed out. Enter the password again.');
      }
      if (!res.ok) throw new Error(payload.error ?? `Upload failed (${res.status})`);
      onMessage({ kind: 'ok', text: `${file.name} is live. Reload the site to see it.` });
      await load();
    } catch (err) {
      onMessage({ kind: 'err', text: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setBusy(null);
      const input = inputs.current[kind];
      if (input) input.value = '';
    }
  };

  const remove = async (kind: Kind) => {
    setBusy(kind);
    try {
      const res = await fetch(`/api/media/${kind}`, { method: 'DELETE' });
      if (res.status === 401) {
        onSignedOut();
        throw new Error('Signed out. Enter the password again.');
      }
      if (!res.ok && res.status !== 204) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Could not remove it');
      }
      onMessage({ kind: 'ok', text: 'Removed — back to the shipped default.' });
      await load();
    } catch (err) {
      onMessage({ kind: 'err', text: err instanceof Error ? err.message : 'Could not remove it' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="admin-card">
      <h2>Look and sound</h2>
      <p className="admin-note admin-note--top">
        Swap these between tournaments. Nothing here needs a redeploy — upload, then reload the public site.
      </p>

      <div className="media-grid">
        {SLOTS.map((slot) => {
          const current = media[slot.kind];
          const url = current ? `/api/media/${slot.kind}?v=${Date.parse(current.updatedAt) || 0}` : null;

          return (
            <div key={slot.kind} className="media-slot">
              <div className="media-preview">
                {url && slot.kind === 'image' && <img src={url} alt="" />}
                {url && slot.kind === 'video' && <video src={url} muted loop autoPlay playsInline />}
                {url && (slot.kind === 'audio' || slot.kind === 'click') && <audio src={url} controls preload="none" />}
                {!url && <span className="media-empty">Using {slot.shipped}</span>}
              </div>

              <h3>{slot.title}</h3>
              <p className="media-hint">{slot.hint}</p>

              <p className="media-state">
                {current ? (
                  <>
                    <b>Custom file in use</b> · {kb(current.size)} · uploaded{' '}
                    {new Date(current.updatedAt).toLocaleDateString()}
                  </>
                ) : (
                  <>Max {slot.limitMb} MB</>
                )}
              </p>

              <div className="media-actions">
                <input
                  ref={(el) => {
                    inputs.current[slot.kind] = el;
                  }}
                  type="file"
                  accept={slot.accept}
                  disabled={busy === slot.kind}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(slot.kind, file);
                  }}
                />
                {current && (
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    disabled={busy === slot.kind}
                    onClick={() => void remove(slot.kind)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
