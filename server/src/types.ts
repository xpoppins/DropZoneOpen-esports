export type StageKey = 'qualifiers_a' | 'qualifiers_b' | 'finals';
export type StageStatus = 'pending' | 'live' | 'complete';

export const STAGE_KEYS: StageKey[] = ['qualifiers_a', 'qualifiers_b', 'finals'];

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

/** The four rows of the schedule: sign-ups, then the three stages. */
export type ScheduleKey = 'registration' | StageKey;
export const SCHEDULE_KEYS: ScheduleKey[] = ['registration', 'qualifiers_a', 'qualifiers_b', 'finals'];

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

/**
 * Everything the organiser can change mid-season without a redeploy. The dates
 * here drive the countdown, the "Drops" line and the schedule section, so
 * moving a night in /admin moves it everywhere at once.
 */
export type EventSettings = {
  entryFee: number;
  schedule: Record<ScheduleKey, DateWindow>;
  prizePool: PrizePool;
};

export type TournamentState = {
  slots: { total: number; filled: number };
  registrationOpen: boolean;
  event: EventSettings;
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

export const DEFAULT_LABELS: Record<StageKey, string> = {
  qualifiers_a: 'Qualifiers Group A',
  qualifiers_b: 'Qualifiers Group B',
  finals: 'Grand finals',
};

/** Anything that reaches the client has been through here first. */
export function parseResults(input: unknown): Results {
  const raw = isRecord(input) ? input : {};
  const stages = isRecord(raw.stages) ? raw.stages : {};
  return {
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    stages: {
      qualifiers_a: parseStage(stages.qualifiers_a, DEFAULT_LABELS.qualifiers_a),
      qualifiers_b: parseStage(stages.qualifiers_b, DEFAULT_LABELS.qualifiers_b),
      finals: parseStage(stages.finals, DEFAULT_LABELS.finals),
    },
  };
}

/** An ISO timestamp, or the fallback when it is missing or unparseable. */
function iso(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (trimmed === '') return '';
  return Number.isNaN(Date.parse(trimmed)) ? fallback : trimmed;
}

function parseWindow(input: unknown, fallback: DateWindow): DateWindow {
  const raw = isRecord(input) ? input : {};
  const startsAt = iso(raw.startsAt, fallback.startsAt) || fallback.startsAt;
  const endsAt = iso(raw.endsAt, fallback.endsAt);
  // A window that ends before it starts is a typo, not an instruction.
  if (endsAt && Date.parse(endsAt) < Date.parse(startsAt)) return { startsAt, endsAt: '' };
  return { startsAt, endsAt };
}

/**
 * Cash or wording. A field typed as "500" in an admin text box is meant as
 * money, so digits become a number; anything else is kept as the label it is.
 */
function parsePrize(value: unknown, fallback: Prize): Prize {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, Math.round(value)) : fallback;
  if (typeof value !== 'string') return fallback;

  const text = value.trim();
  if (text === '') return '';
  if (/^\d+$/.test(text)) return Math.max(0, Number(text));
  return text.slice(0, 40);
}

function parsePrizePool(input: unknown, fallback: PrizePool): PrizePool {
  const raw = isRecord(input) ? input : {};
  return {
    total: num(raw.total, fallback.total),
    first: parsePrize(raw.first, fallback.first),
    second: parsePrize(raw.second, fallback.second),
    third: parsePrize(raw.third, fallback.third),
    mvp: parsePrize(raw.mvp, fallback.mvp),
    mostKills: parsePrize(raw.mostKills, fallback.mostKills),
    participationNote:
      typeof raw.participationNote === 'string'
        ? raw.participationNote.slice(0, 160)
        : fallback.participationNote,
  };
}

export function parseEvent(input: unknown, fallback: EventSettings): EventSettings {
  const raw = isRecord(input) ? input : {};
  const schedule = isRecord(raw.schedule) ? raw.schedule : {};
  return {
    entryFee: num(raw.entryFee, fallback.entryFee),
    schedule: Object.fromEntries(
      SCHEDULE_KEYS.map((key) => [key, parseWindow(schedule[key], fallback.schedule[key])]),
    ) as Record<ScheduleKey, DateWindow>,
    prizePool: parsePrizePool(raw.prizePool, fallback.prizePool),
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
    event: parseEvent(raw.event, fallback.event),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * The calendar a brand-new database starts with. It mirrors the dates written
 * into client/src/config/tournament.ts, so the site reads the same before and
 * after the organiser first touches /admin.
 */
export const DEFAULT_EVENT: EventSettings = {
  entryFee: 200,
  schedule: {
    registration: { startsAt: '2026-08-25T00:00:00+05:30', endsAt: '2026-09-15T23:59:00+05:30' },
    qualifiers_a: { startsAt: '2026-09-20T18:00:00+05:30', endsAt: '2026-09-21T23:59:00+05:30' },
    qualifiers_b: { startsAt: '2026-09-27T18:00:00+05:30', endsAt: '' },
    finals: { startsAt: '2026-10-04T19:00:00+05:30', endsAt: '' },
  },
  prizePool: {
    total: 1300,
    first: 1000,
    second: 200,
    third: 100,
    mvp: 'Certificate',
    mostKills: 'Certificate',
    participationNote: 'Every other squad that plays a match gets a participation certificate.',
  },
};

export const DEFAULT_STATE: TournamentState = {
  slots: { total: 256, filled: 147 },
  registrationOpen: true,
  event: DEFAULT_EVENT,
  updatedAt: new Date().toISOString(),
};
