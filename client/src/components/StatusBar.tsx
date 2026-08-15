import { CONFIG } from '../config/tournament';
import { pad } from '../lib/format';
import { useCountdown } from '../lib/useCountdown';
import { RegisterCta } from './ui/RegisterCta';
import { AudioToggle } from './ui/AudioToggle';

type Props = { slots: { total: number; filled: number } };

/**
 * One fixed bar carrying the two numbers that decide whether someone registers
 * — time left and slots left — plus the button itself. It replaces the old
 * scroll-tracking rail: same job, a tenth of the moving parts.
 *
 * Both readings have a short form for narrow screens. The numbers never drop,
 * only the words around them.
 */
export function StatusBar({ slots }: Props) {
  const countdown = useCountdown(CONFIG.registrationClosesAt);
  const remaining = Math.max(0, slots.total - slots.filled);
  const urgent = !countdown.expired && countdown.totalMs < CONFIG.urgentThresholdHours * 3600_000;

  const closed = countdown.expired;
  const clockShort = closed ? 'Closed' : `${countdown.days}d ${pad(countdown.hours)}h`;
  const clockFull = closed
    ? 'Registration closed'
    : `${countdown.days}d ${pad(countdown.hours)}h ${pad(countdown.minutes)}m left`;

  return (
    <div className="statusbar">
      <span className="statusbar-name">{CONFIG.tournamentName}</span>

      <span className={`num statusbar-clock ${urgent ? 'urgent' : ''}`}>
        <span className="wide-only">{clockFull}</span>
        <span className="narrow-only">{clockShort}</span>
      </span>

      <span className="statusbar-sep" aria-hidden="true">
        ·
      </span>

      <span className="num statusbar-slots">
        {remaining}
        <span className="wide-only"> slots open</span>
        <span className="narrow-only"> slots</span>
      </span>

      <div className="ml-auto flex items-center gap-2">
        <AudioToggle />
        <RegisterCta className="cta--small" label="Register" fullLabel="Register your squad" />
      </div>
    </div>
  );
}
