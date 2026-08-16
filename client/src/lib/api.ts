import localResults from '../data/results.json';

export type StageKey = 'qualifiers_a' | 'qualifiers_b' | 'finals';
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

export type ScheduleKey = 'registration' | StageKey;
export const SCHEDULE_ORDER: ScheduleKey[] = ['registration', 'qualifiers_a', 'qualifiers_b', 'finals'];

/** A calendar entry. `endsAt` is '' for anything that happens on one night. */
export type DateWindow = { startsAt: string; endsAt: string };

/**
 * A prize is either cash (a number of rupees) or anything else being handed out
 * ('Certificate', 'Gaming mouse'). Only cash gets a bar on the page.
 */
export type Prize = number | string;

export type PrizePool = {
  total: number;
  first: Prize;
  second: Prize;
  third: Prize;
  mvp: Prize;
  mostKills: Prize;
  participationNote: string;
};

/** Fee, dates and prizes — edited in /admin, so they arrive with the live state. */
export type EventSettings = {
  entryFee: number;
  schedule: Record<ScheduleKey, DateWindow>;
  prizePool: PrizePool;
};

export type LiveState = {
  slots: { total: number; filled: number };
  registrationOpen: boolean;
  event: EventSettings;
  updatedAt: string;
};

export const STAGE_ORDER: StageKey[] = ['qualifiers_a', 'qualifiers_b', 'finals'];

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
    if (!data?.stages?.qualifiers_a) throw new Error('malformed standings payload');
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
