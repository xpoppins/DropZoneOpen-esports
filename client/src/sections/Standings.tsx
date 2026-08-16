import { useEffect, useRef, useState } from 'react';
import { Section } from '../components/ui/Section';
import { RegisterCta } from '../components/ui/RegisterCta';
import { STAGE_ORDER, withTotals, type Results, type StageKey } from '../lib/api';
import { formatIST } from '../lib/format';
import { useDuckHandlers } from '../lib/audio';

type Props = { results: Results; live: boolean };

const STATUS_LABEL: Record<string, string> = {
  pending: 'Not started',
  live: 'Live now',
  complete: 'Final',
};

export function Standings({ results, live }: Props) {
  const [stageKey, setStageKey] = useState<StageKey>('qualifiers_a');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const duck = useDuckHandlers();

  const stage = results.stages[stageKey];
  const rows = withTotals(stage?.teams ?? []);

  // Only show the swipe hint when the table genuinely does not fit.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 4);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [stageKey, rows.length]);

  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + STAGE_ORDER.length) % STAGE_ORDER.length;
    setStageKey(STAGE_ORDER[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <Section
      id="standings"
      title="Standings"
      intro="Updated by the admins after every match. Points shown are for the selected stage only."
    >
      {/* the board stops short of the right edge rather than filling the width */}
      <div className="rail:w-[88%]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div role="tablist" aria-label="Tournament stage" className="flex gap-1 overflow-x-auto max-w-full">
          {STAGE_ORDER.map((key, i) => {
            const selected = key === stageKey;
            return (
              <button
                key={key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`tab-${key}`}
                aria-selected={selected}
                aria-controls={`panel-${key}`}
                tabIndex={selected ? 0 : -1}
                className="tab shrink-0"
                onKeyDown={(e) => onTabKey(e, i)}
                onClick={() => {
                  duck.onClick();
                  setStageKey(key);
                }}
                onMouseEnter={duck.onMouseEnter}
                onMouseLeave={duck.onMouseLeave}
              >
                {results.stages[key]?.label ?? key}
              </button>
            );
          })}
        </div>

        <span className={`stamp ${stage?.status === 'live' ? 'stamp--live' : ''}`}>
          {stage?.status === 'live' && <i className="dot" aria-hidden="true" />}
          {STATUS_LABEL[stage?.status ?? 'pending']}
        </span>
      </div>

      <div
        role="tabpanel"
        id={`panel-${stageKey}`}
        aria-labelledby={`tab-${stageKey}`}
        tabIndex={0}
        className="panel"
      >
        {rows.length === 0 ? (
          <div className="p-8 rail:p-12">
            <p className="display text-[clamp(1.5rem,5vw,2.6rem)] text-[#ece6d8] max-w-[18ch]">
              This board fills the night qualifiers start
            </p>
            <p className="mt-5 max-w-prose text-dust/80">
              {stage?.note} Rank, kills, placement points and totals appear here after every match, and the tab you
              are on updates without a refresh. Get your squad in while the slots are open — the first names on this
              board are the ones registered right now.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <RegisterCta label="Register your squad" />
              <a
                href="#format"
                className="cta-ghost"
                onMouseEnter={duck.onMouseEnter}
                onMouseLeave={duck.onMouseLeave}
                onClick={duck.onClick}
              >
                See the format
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="scroller max-h-[70vh] overflow-y-auto" ref={scrollerRef}>
              <table className="board">
                <caption className="sr-only">
                  {stage.label} standings — rank, squad, matches played, placement points, kill points and total
                </caption>
                <thead>
                  {/* Total sits before the breakdown so it survives a 360px screen. */}
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Tag</th>
                    <th scope="col">Squad</th>
                    <th scope="col">Total</th>
                    <th scope="col" className="col-matches">
                      M
                    </th>
                    <th scope="col">Plc</th>
                    <th scope="col">Kill</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((team) => (
                    <tr key={`${team.tag}-${team.name}`} data-podium={team.rank <= 3}>
                      <td>{String(team.rank).padStart(2, '0')}</td>
                      <td>{team.tag}</td>
                      <td className="squad">{team.name}</td>
                      <td className="total">{team.total}</td>
                      <td className="col-matches">{team.matches}</td>
                      <td>{team.placementPts}</td>
                      <td>{team.killPts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {overflowing && (
              <p className="label px-4 py-3 border-t border-rule text-dust/70">
                <span aria-hidden="true">◂ </span>swipe for the points breakdown
                <span aria-hidden="true"> ▸</span>
              </p>
            )}
          </>
        )}
      </div>

      <p className="label mt-5 text-dust/70">
        {stage?.note && rows.length > 0 ? `${stage.note} · ` : ''}
        Last updated {formatIST(results.updatedAt)} · {live ? 'live feed' : 'saved copy'}
      </p>
      </div>
    </Section>
  );
}
