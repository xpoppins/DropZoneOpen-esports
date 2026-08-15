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
