import { useEffect } from 'react';
import { buildStructuredData } from '../config/seo';
import type { EventSettings, Results } from './api';

const SCRIPT_ID = 'dz-structured-data';

type Args = {
  event: EventSettings;
  results: Results;
  slots: { total: number; filled: number };
  registrationOpen: boolean;
};

/**
 * Keeps the JSON-LD in the document in step with the live tournament.
 *
 * index.html ships a static copy of this graph built from the config defaults,
 * which is what a crawler that does not run JavaScript reads. Google, Bing and
 * the AI crawlers all render the page, and they get this version — the one with
 * the fee, dates, prize pool and remaining slots as they actually stand right
 * now. Change the entry fee in /admin and the structured data changes with it.
 *
 * A `<script type="application/ld+json">` is a data block, not executable code:
 * the browser never runs it, so the site's `script-src 'self'` CSP does not
 * apply and no inline-script exception is needed.
 */
export function useStructuredData({ event, results, slots, registrationOpen }: Args): void {
  useEffect(() => {
    const graph = buildStructuredData({ event, results, slots, registrationOpen });

    let el = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.id = SCRIPT_ID;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }

    el.textContent = JSON.stringify(graph);

    // The baseline block from index.html would otherwise sit alongside this one
    // and describe the same @ids with stale numbers.
    document.getElementById('dz-structured-data-baseline')?.remove();
  }, [event, results, slots, registrationOpen]);
}
