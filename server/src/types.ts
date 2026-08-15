export type StageKey = 'qualifiers' | 'semis' | 'finals';
export type StageStatus = 'pending' | 'live' | 'complete';

export const STAGE_KEYS: StageKey[] = ['qualifiers', 'semis', 'finals'];

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

export type TournamentState = {
  slots: { total: number; filled: number };
  registrationOpen: boolean;
  updatedAt: string;
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function num(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

export function parseTeams(input: unknown): TeamRow[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(isRecord)
    .map((row) => ({
      tag: String(row.tag ?? '')
        .slice(0, 6)
        .toUpperCase(),
      name: String(row.name ?? 'Unnamed squad').slice(0, 48),
      matches: num(row.matches),
      placementPts: num(row.placementPts),
      killPts: num(row.killPts),
    }))
    .filter((row) => row.tag.length > 0);
}

export function parseStage(input: unknown, fallbackLabel: string): Stage {
  const raw = isRecord(input) ? input : {};
  const status = raw.status === 'live' || raw.status === 'complete' ? raw.status : 'pending';
  return {
    label: String(raw.label ?? fallbackLabel).slice(0, 40),
    status,
    note: String(raw.note ?? '').slice(0, 240),
    teams: parseTeams(raw.teams),
  };
}

const DEFAULT_LABELS: Record<StageKey, string> = {
  qualifiers: 'Qualifiers',
  semis: 'Semi-finals',
  finals: 'Grand finals',
};

/** Anything that reaches the client has been through here first. */
export function parseResults(input: unknown): Results {
  const raw = isRecord(input) ? input : {};
  const stages = isRecord(raw.stages) ? raw.stages : {};
  return {
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    stages: {
      qualifiers: parseStage(stages.qualifiers, DEFAULT_LABELS.qualifiers),
      semis: parseStage(stages.semis, DEFAULT_LABELS.semis),
      finals: parseStage(stages.finals, DEFAULT_LABELS.finals),
    },
  };
}

export function parseState(input: unknown, fallback: TournamentState): TournamentState {
  const raw = isRecord(input) ? input : {};
  const slots = isRecord(raw.slots) ? raw.slots : {};
  const total = num(slots.total, fallback.slots.total);
  return {
    slots: { total, filled: Math.min(total, num(slots.filled, fallback.slots.filled)) },
    registrationOpen:
      typeof raw.registrationOpen === 'boolean' ? raw.registrationOpen : fallback.registrationOpen,
    updatedAt: new Date().toISOString(),
  };
}

export const DEFAULT_STATE: TournamentState = {
  slots: { total: 256, filled: 147 },
  registrationOpen: true,
  updatedAt: new Date().toISOString(),
};
