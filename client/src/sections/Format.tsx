import { CONFIG } from '../config/tournament';
import { Section } from '../components/ui/Section';
import { pad } from '../lib/format';

export function Format() {
  return (
    <Section
      id="format"
      title="Four weekends to the final circle"
      intro="Points carry within a stage, never across one. Every stage starts everybody at zero, so a bad qualifier night is not a season."
    >
      <div className="grid grid-cols-12 gap-x-6 gap-y-14">
        {/* The schedule is a real sequence, so it gets real ordering markers. */}
        <ol className="col-span-12 rail:col-span-7">
          {CONFIG.schedule.map((step, i) => (
            <li key={step.id} className="relative pl-10 rail:pl-14 pb-10 last:pb-0" data-reveal>
              <span
                className="absolute left-[6px] top-[22px] bottom-0 w-px bg-rule last:hidden"
                aria-hidden="true"
                style={{ display: i === CONFIG.schedule.length - 1 ? 'none' : undefined }}
              />
              <span
                className="absolute left-0 top-[6px] w-3 h-3 border border-zone"
                aria-hidden="true"
                style={{ background: i === 0 ? 'var(--zone)' : 'transparent' }}
              />

              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="num text-zone text-[12px]">{pad(i + 1)}</span>
                <h3 className="text-[clamp(1.1rem,3.6vw,1.5rem)]">{step.label}</h3>
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
