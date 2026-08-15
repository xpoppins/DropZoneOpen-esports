import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG } from '../config/tournament';
import { FALLBACK_RESULTS, fetchLiveState, fetchResults, type Results } from './api';

const POLL_MS = 60_000;

type State = {
  results: Results;
  live: boolean;
  slots: { total: number; filled: number };
  registrationOpen: boolean;
};

/**
 * Config is the source of truth for everything static; the API only overrides
 * the two things that move — slots filled and standings. When it is unreachable
 * the site runs on the bundled copy and says so rather than showing nothing.
 */
export function useTournamentData(): State {
  const [state, setState] = useState<State>({
    results: FALLBACK_RESULTS,
    live: false,
    slots: { total: CONFIG.slots.total, filled: CONFIG.slots.filled },
    registrationOpen: CONFIG.registrationOpen,
  });

  const mounted = useRef(true);

  const load = useCallback(async () => {
    const [{ data, live }, liveState] = await Promise.all([fetchResults(), fetchLiveState()]);
    if (!mounted.current) return;
    setState({
      results: data,
      live,
      slots: liveState?.slots ?? { total: CONFIG.slots.total, filled: CONFIG.slots.filled },
      registrationOpen: liveState?.registrationOpen ?? CONFIG.registrationOpen,
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();

    const id = window.setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS);

    const onVisible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      mounted.current = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  return state;
}
