import { useEffect, useState } from 'react';
import { SCHEDULE_ORDER, type EventSettings, type Prize, type ScheduleKey } from '../lib/api';

type Props = {
  event: EventSettings;
  busy: boolean;
  onSave: (next: EventSettings) => void;
};

const ROW_LABELS: Record<ScheduleKey, string> = {
  registration: 'Registration window',
  qualifiers_a: 'Qualifiers Group A',
  qualifiers_b: 'Qualifiers Group B',
  finals: 'Grand finals',
};

const ROW_HINTS: Record<ScheduleKey, string> = {
  registration: 'The end of this window is what the countdown on the front page counts down to.',
  qualifiers_a: 'The start of this night is the "Drops" time shown in the hero panel.',
  qualifiers_b: 'Leave the end blank for a single night.',
  finals: 'Leave the end blank for a single night.',
};

/**
 * Everything is entered and shown as IST, because the tournament runs on IST
 * and so does everyone typing here. The value is stored with an explicit
 * +05:30 offset, so a visitor in another timezone still sees the right local
 * countdown.
 */
const IST_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** ISO → the "YYYY-MM-DDTHH:mm" that <input type="datetime-local"> wants. */
function toInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = Object.fromEntries(IST_PARTS.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** …and back, pinned to IST. */
const fromInput = (value: string): string => (value ? `${value}:00+05:30` : '');

type PrizeKey = 'first' | 'second' | 'third' | 'mvp' | 'mostKills';

const PRIZE_ROWS: Array<{ key: PrizeKey; label: string }> = [
  { key: 'first', label: '#1 Champion squad' },
  { key: 'second', label: '#2 Runner-up' },
  { key: 'third', label: '#3 Third place' },
  { key: 'mvp', label: 'Tournament MVP' },
  { key: 'mostKills', label: 'Most kills, whole event' },
];

const asCash = (value: Prize): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

function describePrize(value: Prize): string {
  if (value === '' || value === undefined) return 'Nothing shown for this line.';
  return typeof value === 'number' ? `Cash — ₹${value.toLocaleString('en-IN')}, with a bar.` : 'Wording, no bar.';
}

export function EventPanel({ event, busy, onSave }: Props) {
  const [draft, setDraft] = useState<EventSettings>(event);

  // After a save the page reloads the state, and the server may have tidied
  // what was typed (a bad date falls back). Show what was actually stored.
  useEffect(() => setDraft(event), [event]);

  const setWindow = (key: ScheduleKey, field: 'startsAt' | 'endsAt', value: string) =>
    setDraft((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [key]: { ...prev.schedule[key], [field]: fromInput(value) } },
    }));

  // Digits mean rupees, anything else is a label. Same rule the server applies
  // on the way in, so what is typed here is what gets stored.
  const setPrize = (key: PrizeKey, raw: string) => {
    const text = raw.trim();
    const value: Prize = /^\d+$/.test(text) ? Number(text) : raw;
    setDraft((prev) => ({ ...prev, prizePool: { ...prev.prizePool, [key]: value } }));
  };

  const cashSum = PRIZE_ROWS.reduce((sum, row) => sum + asCash(draft.prizePool[row.key]), 0);

  const badOrder = SCHEDULE_ORDER.filter((key) => {
    const { startsAt, endsAt } = draft.schedule[key];
    return endsAt && Date.parse(endsAt) < Date.parse(startsAt);
  });

  return (
    <section className="admin-card">
      <h2>Event settings</h2>
      <p className="admin-note">
        The fee and these dates drive the whole front page — the countdown, the “Drops” line, the schedule and every
        sentence about money. Nothing here needs a redeploy.
      </p>

      <div className="admin-row">
        <label className="admin-field">
          <span>Entry fee (₹ per squad)</span>
          <input
            type="number"
            min={0}
            step={10}
            value={draft.entryFee}
            onChange={(e) => setDraft({ ...draft, entryFee: Math.max(0, Number(e.target.value)) })}
          />
        </label>
        <p className="admin-note admin-note--inline">
          {draft.entryFee <= 0
            ? 'Zero — the site will describe a free event everywhere, including the terms.'
            : `The site will say ₹${draft.entryFee} per squad everywhere, including the terms.`}
        </p>
      </div>

      <div className="admin-dates">
        {SCHEDULE_ORDER.map((key) => (
          <div key={key} className="admin-dates-row">
            <div className="admin-dates-name">
              <strong>{ROW_LABELS[key]}</strong>
              <span className="admin-note">{ROW_HINTS[key]}</span>
            </div>

            <label className="admin-field">
              <span>Starts (IST)</span>
              <input
                type="datetime-local"
                value={toInput(draft.schedule[key].startsAt)}
                onChange={(e) => setWindow(key, 'startsAt', e.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Ends (IST)</span>
              <input
                type="datetime-local"
                value={toInput(draft.schedule[key].endsAt)}
                onChange={(e) => setWindow(key, 'endsAt', e.target.value)}
              />
            </label>
          </div>
        ))}
      </div>

      <h3 className="admin-subhead">Prize pool</h3>
      <p className="admin-note">
        Type a number for cash, or words for anything that is not money — “Certificate”, “Gaming mouse”. Cash prizes
        get a bar on the page; wording does not.
      </p>

      <div className="admin-dates">
        {PRIZE_ROWS.map(({ key, label }) => (
          <label key={key} className="admin-prize-row">
            <span className="admin-prize-name">{label}</span>
            <input
              type="text"
              inputMode="text"
              value={String(draft.prizePool[key] ?? '')}
              placeholder="1000 or Certificate"
              onChange={(e) => setPrize(key, e.target.value)}
            />
            <span className="admin-note">{describePrize(draft.prizePool[key])}</span>
          </label>
        ))}

        <label className="admin-prize-row">
          <span className="admin-prize-name">Participation line</span>
          <input
            type="text"
            value={draft.prizePool.participationNote}
            placeholder="Leave blank to hide that box"
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, prizePool: { ...prev.prizePool, participationNote: e.target.value } }))
            }
          />
          <span className="admin-note">
            {draft.prizePool.participationNote ? 'Shown under the five prizes.' : 'Hidden.'}
          </span>
        </label>
      </div>

      <div className="admin-row">
        <label className="admin-field">
          <span>Total pool shown (₹)</span>
          <input
            type="number"
            min={0}
            value={draft.prizePool.total}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                prizePool: { ...prev.prizePool, total: Math.max(0, Number(e.target.value)) },
              }))
            }
          />
        </label>

        {draft.prizePool.total === cashSum ? (
          <p className="admin-note admin-note--inline">Matches the cash prizes above.</p>
        ) : (
          <p className="admin-note admin-note--inline">
            The cash prizes add up to ₹{cashSum.toLocaleString('en-IN')}, but the headline says ₹
            {draft.prizePool.total.toLocaleString('en-IN')} — the page will contradict itself.{' '}
            <button
              type="button"
              className="admin-linkish"
              onClick={() =>
                setDraft((prev) => ({ ...prev, prizePool: { ...prev.prizePool, total: cashSum } }))
              }
            >
              Use ₹{cashSum.toLocaleString('en-IN')}
            </button>
          </p>
        )}
      </div>

      {badOrder.length > 0 && (
        <p className="admin-msg admin-msg--err">
          {badOrder.map((k) => ROW_LABELS[k]).join(', ')} ends before it starts. Fix the dates, or clear the end to make
          it a single night.
        </p>
      )}

      <div className="admin-row">
        <button
          type="button"
          className="admin-btn"
          onClick={() => onSave(draft)}
          disabled={busy || badOrder.length > 0}
        >
          {busy ? 'Saving…' : 'Save event settings'}
        </button>
      </div>
    </section>
  );
}
