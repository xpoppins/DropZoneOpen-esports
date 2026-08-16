/** Indian digit grouping — 1,00,000 not 100,000. Numbers here are read by Indians. */
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function formatMoney(value: number, currency = 'INR'): string {
  const symbol = currency === 'INR' ? '₹' : '';
  return `${symbol}${inr.format(value)}`;
}

export function formatNumber(value: number): string {
  return inr.format(value);
}

export function pad(value: number, size = 2): string {
  return String(Math.max(0, Math.floor(value))).padStart(size, '0');
}

const IST_DATE = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

const IST_TIME = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

/** Always shown in IST — the tournament runs on IST regardless of who is reading. */
export function formatIST(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${IST_DATE.format(d)} · ${IST_TIME.format(d)} IST`;
}

export function formatISTDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return IST_DATE.format(d);
}

/** Just the clock time, for lines that already say the date. */
export function formatISTTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return IST_TIME.format(d);
}

const IST_DAY = new Intl.DateTimeFormat('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' });
const IST_MONTH = new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' });

const valid = (iso: string): Date | null => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * A schedule line built from the calendar in /admin — "20 – 21 Sep · 6:00 pm
 * IST", or "25 Aug – 15 Sep" for a window where the clock does not matter.
 * A window with no end date is a single night.
 */
export function formatWindow(startsAt: string, endsAt: string, withTime = true): string {
  const start = valid(startsAt);
  if (!start) return '—';

  const time = withTime ? ` · ${IST_TIME.format(start)} IST` : '';
  const end = endsAt ? valid(endsAt) : null;

  if (!end) return `${IST_DAY.format(start)} ${IST_MONTH.format(start)}${time}`;

  const sameMonth = IST_MONTH.format(start) === IST_MONTH.format(end);
  const sameDay = sameMonth && IST_DAY.format(start) === IST_DAY.format(end);

  if (sameDay) return `${IST_DAY.format(start)} ${IST_MONTH.format(start)}${time}`;
  if (sameMonth) return `${IST_DAY.format(start)} – ${IST_DAY.format(end)} ${IST_MONTH.format(start)}${time}`;
  return `${IST_DAY.format(start)} ${IST_MONTH.format(start)} – ${IST_DAY.format(end)} ${IST_MONTH.format(end)}${time}`;
}
