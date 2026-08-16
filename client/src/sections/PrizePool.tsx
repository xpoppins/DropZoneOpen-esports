import { CONFIG, feeCopy } from '../config/tournament';
import type { EventSettings, Prize } from '../lib/api';
import { Section } from '../components/ui/Section';
import { formatMoney } from '../lib/format';

/**
 * A prize is either cash (a number, in rupees) or something else you are handing
 * out (any text — "Certificates", "Gaming mouse", "Merch pack"). Text prizes get
 * no bar, because there is nothing to compare them against. Both come from the
 * prize pool set in /admin.
 */
const money = (v: number) => formatMoney(v, CONFIG.prizeCurrency);
const isCash = (value: Prize): value is number => typeof value === 'number' && Number.isFinite(value);

type Props = { event: EventSettings };

export function PrizePool({ event }: Props) {
  const p = event.prizePool;

  // Read as a supply-drop manifest: what is in the crate, and how big each share is.
  const lines: Array<{ code: string; label: string; amount: Prize; lead: boolean }> = [
    { code: '#1', label: 'Champion squad', amount: p.first, lead: true },
    { code: '#2', label: 'Runner-up', amount: p.second, lead: false },
    { code: '#3', label: 'Third place', amount: p.third, lead: false },
    { code: 'MVP', label: 'Tournament MVP', amount: p.mvp, lead: false },
    { code: 'KIL', label: 'Most kills, whole event', amount: p.mostKills, lead: false },
  ];

  // Only cash sets the scale of the bars — and never divide by zero.
  const largest = Math.max(...lines.map((l) => (isCash(l.amount) ? l.amount : 0)), 1);

  return (
    <Section
      id="prize"
      title="One crate, five ways"
      intro={`Every rupee is paid to the captain within 14 working days of the final, and split by the squad. Entry stays ${
        event.entryFee <= 0 ? 'free' : feeCopy(event.entryFee).stat
      }.`}
    >
      <div className="grid grid-cols-12 gap-y-12 gap-x-6">
        <div className="col-span-12 rail:col-span-5" data-reveal>
          <div className="label mb-4">Total pool</div>
          {/* Sized to its column — ₹1,00,000 is nine glyphs of expanded Archivo. */}
          <div className="display text-[clamp(2.6rem,8.5vw,5.5rem)] leading-[0.82] text-flare">{money(p.total)}</div>
          <p className="mt-5 max-w-[34ch] text-[13px] text-dust/75">
            Paid by UPI or bank transfer. PAN required for any single payout above ₹10,000.
          </p>
        </div>

        <div className="col-span-12 rail:col-span-7 rail:pl-8">
          <ul>
            {lines.map((line) => (
              <li key={line.code} className="border-t border-rule py-5 first:border-t-0" data-reveal>
                <div className="flex items-baseline gap-4">
                  <span className={`num text-[12px] w-10 shrink-0 ${line.lead ? 'text-flare' : 'text-zone'}`}>
                    {line.code}
                  </span>
                  <span className={`flex-1 ${line.lead ? 'text-[#ece6d8]' : 'text-dust/85'}`}>{line.label}</span>

                  {isCash(line.amount) ? (
                    <span
                      className={`num text-[clamp(1.1rem,3.4vw,1.6rem)] tracking-tight ${
                        line.lead ? 'text-flare' : 'text-[#ece6d8]'
                      }`}
                    >
                      {money(line.amount)}
                    </span>
                  ) : (
                    // A text prize sits at body size: "Certificates" at display
                    // size would tower over the cash line next to it.
                    <span className="text-[14px] text-[#ece6d8] text-right">{line.amount}</span>
                  )}
                </div>

                {isCash(line.amount) && (
                  <div className="meter mt-4 ml-14" aria-hidden="true">
                    <i
                      style={{
                        transform: `scaleX(${line.amount / largest})`,
                        background: line.lead ? 'var(--flare)' : 'var(--zone)',
                        opacity: line.lead ? 1 : 0.55,
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>

          {p.participationNote && (
            <div className="panel panel--flat mt-6 px-5 py-4" data-reveal>
              <div className="flex items-baseline gap-4">
                <span className="num text-[12px] w-10 shrink-0 text-zone">ALL</span>
                <span className="flex-1 text-dust/85">{p.participationNote}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
