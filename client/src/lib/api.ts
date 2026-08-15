import localResults from '../data/results.json';

export type StageKey = 'qualifiers_A' | 'qualifiers B' | 'finals';
export type StageStatus = 'pending' | 'live' | 'complete';

export type TeamRow = {
  tag: string;
  name: string;
  matches: number;
  placementPts: number;
  killPts: number;
};

export type Stage = {
  label: string;
  status: StageStatus;
  note: string;
  teams: TeamRow[];
};

export type Results = {
  updatedAt: string;
  stages: Record<StageKey, Stage>;
};

export type LiveState = {
  slots: { total: number; filled: number };
  registrationOpen: boolean;
  updatedAt: string;
};

export const STAGE_ORDER: StageKey[] = ['qualifiers_A', 'qualifiers B', 'finals'];

/** Bundled copy of results.json — used when the API is unreachable. */
export const FALLBACK_RESULTS = localResults as Results;

async function getJSON<T>(path: string, timeoutMs = 3500): Promise<T> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(path, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchResults(): Promise<{ data: Results; live: boolean }> {
  try {
    const data = await getJSON<Results>('/api/standings');
    if (!data?.stages?.qualifiers_A) throw new Error('malformed standings payload');
    return { data, live: true };
  } catch {
    return { data: FALLBACK_RESULTS, live: false };
  }
}

export async function fetchLiveState(): Promise<LiveState | null> {
  try {
    return await getJSON<LiveState>('/api/tournament');
  } catch {
    return null;
  }
}

/** Fire-and-forget: tells the organiser how many squads opened the form. */
export function recordFormOpen(): void {
  try {
    const body = JSON.stringify({ at: new Date().toISOString() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/registrations/intent', new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch('/api/registrations/intent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* analytics must never break the button */
  }
}

export function withTotals(teams: TeamRow[]) {
  return teams
    .map((t) => ({ ...t, total: t.placementPts + t.killPts }))
    .sort((a, b) => b.total - a.total || b.placementPts - a.placementPts || a.name.localeCompare(b.name))
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

export type RankedTeam = ReturnType<typeof withTotals>[number];
