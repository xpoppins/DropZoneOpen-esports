import { CONFIG, feeCopy } from '../config/tournament';
import { RegisterCta } from '../components/ui/RegisterCta';
import { formatIST, formatISTDate, formatISTTime, pad } from '../lib/format';
import { useCountdown } from '../lib/useCountdown';
import { useDuckHandlers } from '../lib/audio';
import type { EventSettings } from '../lib/api';

type Props = { slots: { total: number; filled: number }; event: EventSettings };

export function Hero({ slots, event }: Props) {
  const closesAt = event.schedule.registration.endsAt || event.schedule.registration.startsAt;
  const countdown = useCountdown(closesAt);
  const fee = feeCopy(event.entryFee);
  const duck = useDuckHandlers();
  const urgent = !countdown.expired && countdown.totalMs < CONFIG.urgentThresholdHours * 3600_000;

  const cells = [
    { v: countdown.days, l: 'days' },
    { v: countdown.hours, l: 'hrs' },
    { v: countdown.minutes, l: 'min' },
    { v: countdown.seconds, l: 'sec' },
  ];

  const manifest = [
    { k: 'Edition', v: CONFIG.edition },
    { k: 'Mode', v: CONFIG.mode },
    { k: 'Maps', v: CONFIG.maps.join(' / ') },
    { k: 'Drops', v: formatIST(event.schedule.qualifiers_a.startsAt) },
    // Slots are deliberately absent — the status bar carries that number at all
    // times, and printing it twice on one screen weakens both.
    { k: 'Entry', v: fee.stat },
  ];

  return (
    <header id="hero" className="section section--hero bay flex flex-col justify-center gap-9">
      {/* the headline owns the full width and is cropped by the viewport */}
      <h1>
        <span className="num block text-zone text-[clamp(11px,2.4vw,13px)] tracking-[0.2em] mb-5">
          {CONFIG.tournamentName} · {CONFIG.edition}
        </span>

        <span className="crop bleed-right">
          <span className="crop-line display display--hero">No second</span>
        </span>
        <span className="crop bleed-right">
          <span className="crop-line display display--hero display--hollow">Circle</span>
        </span>
      </h1>

      <div className="grid grid-cols-12 gap-x-6 gap-y-10 items-end">
        <div className="col-span-12 rail:col-span-7">
          <p className="max-w-[46ch] text-dust/80">
            32 squads drop, one walks out. {fee.short}, {CONFIG.mode}, room IDs on WhatsApp, and standings
            you can actually check.
          </p>

          <div className="label mt-8 mb-3">
            {countdown.expired ? 'Registration closed' : 'Registration closes in'}
          </div>

          {countdown.expired ? (
            <div className="display text-[clamp(2rem,7vw,3.4rem)] text-blood">Doors shut</div>
          ) : (
            <div className="flex gap-4 rail:gap-7" role="timer">
              {cells.map((cell) => (
                <div key={cell.l}>
                  <div
                    className={`num text-[clamp(1.9rem,6vw,3.2rem)] leading-none tracking-tight ${
                      urgent ? 'urgent' : 'text-dust'
                    }`}
                  >
                    {pad(cell.v)}
                  </div>
                  <div className="label mt-2">{cell.l}</div>
                </div>
              ))}
            </div>
          )}

          <p className="label mt-4">
            Closes {formatISTDate(closesAt)} · {formatISTTime(closesAt)} IST ·{' '}
            {Math.max(0, slots.total - slots.filled)} slots open
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <RegisterCta />
            <a
              href="#standings"
              className="cta-ghost"
              onMouseEnter={duck.onMouseEnter}
              onMouseLeave={duck.onMouseLeave}
              onClick={duck.onClick}
            >
              View standings
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <aside className="col-span-12 rail:col-span-4 rail:col-start-9 panel panel-pad" aria-label="Tournament details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[13px]">
            {manifest.map((row) => (
              <div key={row.k} className="contents">
                <dt className="label pt-[2px]">{row.k}</dt>
                <dd className="num text-dust text-right">{row.v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </header>
  );
}
