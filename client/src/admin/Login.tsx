import { useState } from 'react';

type Props = {
  /** False when ADMIN_TOKEN is not set on the server — nothing can sign in. */
  enabled: boolean;
  onSignedIn: () => void;
};

/**
 * The only thing rendered until the server says this browser has a session.
 * The password is posted once and exchanged for an httpOnly cookie: it is
 * never stored in the page, so nothing on the client can read it back.
 */
export function Login({ enabled, onSignedIn }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? 'Could not sign in.');
      setPassword('');
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin admin--login">
      <form className="login-card" onSubmit={submit}>
        <h1>Admin</h1>
        <p className="admin-note">Score entry for {document.title.split('—')[0].trim()}.</p>

        {enabled ? (
          <>
            <label className="admin-field">
              <span>Admin password</span>
              <input
                type="password"
                value={password}
                autoFocus
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && <p className="admin-msg admin-msg--err">{error}</p>}

            <button type="submit" className="admin-btn" disabled={busy || password.length === 0}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
          </>
        ) : (
          <p className="admin-msg admin-msg--err">
            Admin is switched off: no ADMIN_TOKEN is set on the server. Add it to server/.env (or the environment
            variables on your host) and restart.
          </p>
        )}

        <p className="admin-note login-foot">
          <a href="/" className="admin-link">
            ← back to the site
          </a>
        </p>
      </form>
    </div>
  );
}
