import { useEffect, useRef, useState } from 'react';

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  expired: boolean;
};

function diff(target: number): Countdown {
  const totalMs = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
    expired: totalMs <= 0,
  };
}

/**
 * One shared interval per mount, cleared on unmount. Recomputes from Date.now()
 * every tick rather than decrementing, so a backgrounded tab stays accurate.
 */
export function useCountdown(isoTarget: string): Countdown {
  const target = useRef(new Date(isoTarget).getTime());
  target.current = new Date(isoTarget).getTime();

  const [state, setState] = useState<Countdown>(() => diff(target.current));

  useEffect(() => {
    const tick = () => setState(diff(new Date(isoTarget).getTime()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isoTarget]);

  return state;
}
