import { CONFIG } from '../config/tournament';
import { Section } from '../components/ui/Section';
import { formatWindow, pad } from '../lib/format';
import type { EventSettings, Results, ScheduleKey } from '../lib/api';

type Props = { event: EventSettings; results: Results };

type StepState = 'done' | 'now' | 'ahead';

/**
 * How far the tournament has actually got, per row.
 *
 * The board is the authority once a stage exists on it — an admin marking a
 * group complete is a deliberate act, and it should beat the clock. Dates are
 * the fallback for rows nobody has touched yet, and for the registration
 * window, which has no standings of its own.
 */
function stateOf(key: ScheduleKey, event: EventSettings, results: Results, now: number): StepState {
  if (key !== 'registration') {
    const status = results.stages[key]?.status;
    if (status === 'complete') return 'done';
    if (status === 'live') return 'now';
  }

  const { startsAt, endsAt } = event.schedule[key];
  const start = Date.parse(startsAt);
  const end = endsAt ? Date.parse(endsAt) : start;

  if (Number.isNaN(start)) return 'ahead';
  if (now > (Number.isNaN(end) ? start : end)) return 'done';
  if (now >= start) return 'now';
  return 'ahead';
}

export function Format({ event, results }: Props) {
  const now = Date.now();

  const steps = CONFIG.schedule.map((step) => {
    const win = event.schedule[step.id];
    return {
      ...step,
      // Registration spans weeks, so the clock time on it is noise; a match
      // night is the opposite — the time is the whole point.
      window: formatWindow(win.startsAt, win.endsAt, step.id !== 'registration'),
      state: stateOf(step.id, event, results, now),
    };
  });

  return (
    <Section
      id="format"
      title="Four weekends to the final circle"
      intro="Points carry within a stage, never across one. Every stage starts everybody at zero, so a bad qualifier night is not a season."
    >
      <div className="grid grid-cols-12 gap-x-6 gap-y-14">
        {/* The schedule is a real sequence, so it gets real ordering markers. */}
        <ol className="col-span-12 rail:col-span-7">
          {steps.map((step, i) => (
            <li key={step.id} className="relative pl-10 rail:pl-14 pb-10 last:pb-0" data-reveal>
              {/* The rail only lights up as far as the tournament has got, so
                  the line itself reads as progress rather than decoration.

                  It runs from the bottom edge of this marker (6px top + 12px
                  box = 18px) to the top edge of the next one, which sits 6px
                  into the following row — hence the negative bottom. Stopping
                  at bottom-0 leaves a visible break at every junction. */}
              <span
                className={`absolute left-[6px] top-[18px] bottom-[-6px] w-px ${
                  step.state === 'done' ? 'bg-zone' : 'bg-rule'
                }`}
                aria-hidden="true"
                style={{ display: i === steps.length - 1 ? 'none' : undefined }}
              />
              <span
                className={`absolute left-0 top-[6px] w-3 h-3 border border-zone ${
                  step.state === 'now' ? 'stage-marker--live' : ''
                }`}
                aria-hidden="true"
                style={{ background: step.state === 'ahead' ? 'transparent' : 'var(--zone)' }}
              />

              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="num text-zone text-[12px]">{pad(i + 1)}</span>
                <h3 className="text-[clamp(1.1rem,3.6vw,1.5rem)]">{step.label}</h3>
                {step.state === 'now' && (
                  <span className="label text-zone" aria-label="in progress">
                    · now
                  </span>
                )}
                <span className="num text-[12px] text-dust/75 ml-auto">{step.window}</span>
              </div>

              <p className="mt-3 max-w-prose text-dust/80">{step.detail}</p>

              {(step.maps.length > 0 || step.matches) && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {step.maps.map((map, mi) => (
                    <span key={`${map}-${mi}`} className="stamp">
                      {map}
                    </span>
                  ))}
                  {step.matches && <span className="label ml-1">{step.matches}</span>}
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="col-span-12 rail:col-span-5 rail:pl-8" data-reveal>
          <div className="label mb-5">Points system</div>

          <table className="w-full text-[13px]">
            <caption className="sr-only">Placement points awarded per match</caption>
            <thead>
              <tr>
                <th scope="col" className="label text-left pb-3 border-b border-rule">
                  Finish
                </th>
                <th scope="col" className="label text-right pb-3 border-b border-rule">
                  Placement pts
                </th>
              </tr>
            </thead>
            <tbody>
              {CONFIG.points.placement.map((row) => (
                <tr key={row.rank}>
                  <th scope="row" className="num text-left font-normal py-[10px] border-b border-rule text-dust/80">
                    {row.rank}
                  </th>
                  <td className="num text-right py-[10px] border-b border-rule text-[#ece6d8]">{row.pts}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="text-left py-[10px] text-zone font-normal">
                  Every kill
                </th>
                <td className="num text-right py-[10px] text-zone">+{CONFIG.points.perKill}</td>
              </tr>
            </tbody>
          </table>

          <p className="mt-6 text-[13px] text-dust/75 max-w-prose">
            Ties break on total kills first, then the better single-match finish, then a coin flip on stream — which
            has happened once and we would rather it did not happen again.
          </p>
        </div>
      </div>
    </Section>
  );
}
