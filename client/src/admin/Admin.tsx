import { useCallback, useEffect, useState } from 'react';
import { STAGE_ORDER, type Results, type StageKey, type StageStatus, type TeamRow } from '../lib/api';
import { MediaPanel } from './MediaPanel';
import { Login } from './Login';

const STATUSES: StageStatus[] = ['pending', 'live', 'complete'];

const emptyRow = (): TeamRow => ({ tag: '', name: '', matches: 0, placementPts: 0, killPts: 0 });

type Slots = { total: number; filled: number; registrationOpen: boolean };
type Auth = { checked: boolean; authenticated: boolean; enabled: boolean };

/**
 * The score-entry page for admins, at /admin. Deliberately plain: this is a tool
 * used at 1 a.m. between matches, so every field is a normal input and the only
 * feedback that matters is whether the save landed.
 *
 * Nothing below the sign-in renders until the server confirms a session. The
 * password itself is never held in the page — it is exchanged once for an
 * httpOnly cookie that JavaScript cannot read.
 */
export default function Admin() {
  const [auth, setAuth] = useState<Auth>({ checked: false, authenticated: false, enabled: true });
  const [results, setResults] = useState<Results | null>(null);
  const [slots, setSlots] = useState<Slots | null>(null);
  const [stage, setStage] = useState<StageKey>('qualifiers_A');
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/session', { headers: { accept: 'application/json' } });
      const payload = (await res.json()) as { authenticated: boolean; enabled: boolean };
      setAuth({ checked: true, authenticated: payload.authenticated, enabled: payload.enabled });
    } catch {
      setAuth({ checked: true, authenticated: false, enabled: true });
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const signOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
    setResults(null);
    setSlots(null);
    setMessage(null);
    setAuth((prev) => ({ ...prev, authenticated: false }));
  };

  const load = useCallback(async () => {
    try {
      const [standings, live] = await Promise.all([
        fetch('/api/standings').then((r) => r.json()),
        fetch('/api/tournament').then((r) => r.json()),
      ]);
      setResults(standings as Results);
      setSlots({ ...(live.slots as { total: number; filled: number }), registrationOpen: live.registrationOpen });
    } catch {
      setMessage({ kind: 'err', text: 'Could not reach the API. Is the server running?' });
    }
  }, []);

  useEffect(() => {
    if (auth.authenticated) void load();
  }, [auth.authenticated, load]);

  const current = results?.stages[stage];

  const patchStage = (changes: Partial<{ status: StageStatus; note: string; teams: TeamRow[] }>) => {
    setResults((prev) =>
      prev ? { ...prev, stages: { ...prev.stages, [stage]: { ...prev.stages[stage], ...changes } } } : prev,
    );
  };

  const patchTeam = (index: number, changes: Partial<TeamRow>) => {
    if (!current) return;
    patchStage({ teams: current.teams.map((t, i) => (i === index ? { ...t, ...changes } : t)) });
  };

  const send = async (path: string, method: 'PUT' | 'PATCH', body: unknown, okText: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      // The session expired or was revoked — drop straight back to sign-in.
      if (res.status === 401) {
        setAuth((prev) => ({ ...prev, authenticated: false }));
        throw new Error('Signed out. Enter the password again.');
      }
      if (!res.ok) throw new Error(payload.error ?? `Save failed (${res.status})`);
      setMessage({ kind: 'ok', text: okText });
      await load();
    } catch (err) {
      setMessage({ kind: 'err', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setBusy(false);
    }
  };

  const saveStage = () => {
    if (!current) return;
    const teams = current.teams.filter((t) => t.tag.trim() && t.name.trim());
    void send(
      `/api/standings/${stage}`,
      'PUT',
      { status: current.status, note: current.note, teams },
      `${current.label} saved — ${teams.length} squad${teams.length === 1 ? '' : 's'} live on the site.`,
    );
  };

  const saveSlots = () => {
    if (!slots) return;
    void send(
      '/api/tournament',
      'PATCH',
      { slots: { total: slots.total, filled: slots.filled }, registrationOpen: slots.registrationOpen },
      'Slot count saved.',
    );
  };

  // Nothing about the tool exists until the server has vouched for this browser.
  if (!auth.checked) return null;
  if (!auth.authenticated)
    return <Login enabled={auth.enabled} onSignedIn={() => setAuth((prev) => ({ ...prev, authenticated: true }))} />;

  return (
    <div className="admin">
      <header className="admin-head">
        <h1>Admin · score entry</h1>
        <div className="admin-head-actions">
          <a href="/" className="admin-link">
            ← back to the site
          </a>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      {message && <p className={`admin-msg admin-msg--${message.kind}`}>{message.text}</p>}

      {!results || !slots ? (
        <p className="admin-note">Loading…</p>
      ) : (
        <>
          <section className="admin-card">
            <h2>Slots</h2>
            <div className="admin-row">
              <label className="admin-field">
                <span>Filled</span>
                <input
                  type="number"
                  min={0}
                  value={slots.filled}
                  onChange={(e) => setSlots({ ...slots, filled: Number(e.target.value) })}
                />
              </label>
              <label className="admin-field">
                <span>Total</span>
                <input
                  type="number"
                  min={1}
                  value={slots.total}
                  onChange={(e) => setSlots({ ...slots, total: Number(e.target.value) })}
                />
              </label>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={slots.registrationOpen}
                  onChange={(e) => setSlots({ ...slots, registrationOpen: e.target.checked })}
                />
                <span>Registration open</span>
              </label>
              <button type="button" className="admin-btn" onClick={saveSlots} disabled={busy}>
                Save slots
              </button>
            </div>
          </section>

          <MediaPanel onMessage={setMessage} onSignedOut={() => setAuth((prev) => ({ ...prev, authenticated: false }))} />

          <section className="admin-card">
            <div className="admin-tabs">
              {STAGE_ORDER.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`admin-tab ${key === stage ? 'is-on' : ''}`}
                  onClick={() => setStage(key)}
                >
                  {results.stages[key].label}
                </button>
              ))}
            </div>

            {current && (
              <>
                <div className="admin-row">
                  <label className="admin-field">
                    <span>Status</span>
                    <select
                      value={current.status}
                      onChange={(e) => patchStage({ status: e.target.value as StageStatus })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-field admin-field--wide">
                    <span>Note shown under the board</span>
                    <input
                      type="text"
                      value={current.note}
                      placeholder="Group A of 16. Top 4 advance."
                      onChange={(e) => patchStage({ note: e.target.value })}
                    />
                  </label>
                </div>

                <div className="admin-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tag</th>
                        <th>Squad name</th>
                        <th>Matches</th>
                        <th>Placement pts</th>
                        <th>Kill pts</th>
                        <th>Total</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {current.teams.map((team, i) => (
                        <tr key={i}>
                          <td>
                            <input
                              value={team.tag}
                              maxLength={5}
                              placeholder="PHX"
                              onChange={(e) => patchTeam(i, { tag: e.target.value.toUpperCase() })}
                            />
                          </td>
                          <td>
                            <input
                              value={team.name}
                              placeholder="Phoenix Rising"
                              onChange={(e) => patchTeam(i, { name: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              value={team.matches}
                              onChange={(e) => patchTeam(i, { matches: Number(e.target.value) })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              value={team.placementPts}
                              onChange={(e) => patchTeam(i, { placementPts: Number(e.target.value) })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              value={team.killPts}
                              onChange={(e) => patchTeam(i, { killPts: Number(e.target.value) })}
                            />
                          </td>
                          <td className="admin-total">{team.placementPts + team.killPts}</td>
                          <td>
                            <button
                              type="button"
                              className="admin-x"
                              title="Remove this squad"
                              onClick={() => patchStage({ teams: current.teams.filter((_, x) => x !== i) })}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-row">
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => patchStage({ teams: [...current.teams, emptyRow()] })}
                  >
                    + Add squad
                  </button>
                  <button type="button" className="admin-btn" onClick={saveStage} disabled={busy}>
                    {busy ? 'Saving…' : `Save ${current.label}`}
                  </button>
                </div>

                <p className="admin-note">
                  Rank and total are worked out from these numbers — you never type them. Rows without a tag and a name
                  are dropped on save.
                </p>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
