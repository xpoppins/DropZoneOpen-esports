import { CONFIG, feeCopy } from '../config/tournament';
import type { EventSettings } from '../lib/api';
import { Section } from '../components/ui/Section';
import { RegisterCta } from '../components/ui/RegisterCta';
import { ConsentCheckbox } from '../components/ui/ConsentCheckbox';
import { formatIST, formatNumber, pad } from '../lib/format';
import { useCountdown } from '../lib/useCountdown';

type Props = { slots: { total: number; filled: number }; event: EventSettings };

const AFTER = [
  {
    title: 'Confirmation email, same day',
    body: 'It carries your squad ID and the group you have been drawn into. If it has not arrived in 24 hours, check spam, then mail us — a missing confirmation means the form did not save.',
  },
  {
    title: 'WhatsApp group, 48 hours before',
    body: 'Captains only. This is where room IDs, delays and admin calls go out. One captain per squad, no substitutes in the group.',
  },
  {
    title: 'Room ID, 15 minutes before each match',
    body: 'Sent to the captain and posted in Discord announcements at the same time. Be in the lobby within 10 minutes of it landing.',
  },
];

export function Register({ slots, event }: Props) {
  const closesAt = event.schedule.registration.endsAt || event.schedule.registration.startsAt;
  const countdown = useCountdown(closesAt);
  const remaining = Math.max(0, slots.total - slots.filled);
  const fill = slots.total > 0 ? slots.filled / slots.total : 0;
  const urgent = !countdown.expired && countdown.totalMs < CONFIG.urgentThresholdHours * 3600_000;

  return (
    <Section
      id="register"
      title="Get your squad on the plane"
      intro="Registration runs on a Google Form — one submission per squad, filled in by the captain. It takes about four minutes if you have the details below ready."
    >
      <div className="grid grid-cols-12 gap-x-6 gap-y-14">
        <div className="col-span-12 rail:col-span-7">
          <div className="label mb-6">What happens after you submit</div>

          <ol className="grid gap-8">
            {AFTER.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[auto_1fr] gap-5" data-reveal>
                <span className="num text-zone text-[12px] pt-1">{pad(i + 1)}</span>
                <div>
                  <h3 className="text-[clamp(1rem,3.2vw,1.25rem)]">{step.title}</h3>
                  <p className="mt-2 max-w-prose text-dust/80">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="label mt-14 mb-5">Have this ready before you open the form</div>
          <ul className="grid gap-0 border-t border-rule">
            {CONFIG.registrationChecklist.map((item) => (
              <li key={item} className="flex gap-4 py-4 border-b border-rule text-dust/85" data-reveal>
                <span className="num text-zone text-[12px] pt-1" aria-hidden="true">
                  ▸
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-12 rail:col-span-5 rail:pl-8">
          <div className="panel panel-pad rail:sticky rail:top-8" data-reveal>
            <div className="label">Slots</div>

            <div className="flex items-baseline gap-3 mt-3">
              <span className="display text-[clamp(2.6rem,9vw,4.4rem)] leading-none text-[#f2ede1]">
                {formatNumber(slots.filled)}
              </span>
              <span className="num text-dust/70 text-[clamp(1rem,3vw,1.4rem)]">/ {slots.total}</span>
            </div>

            <div className="meter mt-5" aria-hidden="true">
              <i style={{ transform: `scaleX(${fill})` }} />
            </div>
            <p className="label mt-3 text-zone">{formatNumber(remaining)} slots open</p>

            <hr className="my-7 border-0 border-t border-rule" />

            <div className="label">Registration closes</div>
            <p className="num mt-2 text-[15px] text-[#ece6d8]">{formatIST(closesAt)}</p>
            <p className={`num mt-1 text-[13px] ${urgent ? 'urgent' : 'text-dust/75'}`}>
              {countdown.expired
                ? 'Closed'
                : `${countdown.days}d ${pad(countdown.hours)}h ${pad(countdown.minutes)}m left`}
            </p>

            <div className="mt-8 grid gap-4">
              <ConsentCheckbox />
              <RegisterCta label="Open the registration form" className="w-full" />
              <p className="text-[13px] text-dust/75 leading-relaxed">
                Opens Google Forms in a new tab. {feeCopy(event.entryFee).note}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
