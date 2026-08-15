import { useEffect } from 'react';
import { prefersReducedMotion } from './motion';

/** Reveal anything whose top has passed this far down the viewport. */
const THRESHOLD = 0.92;

/**
 * Everything marked [data-reveal] fades up once, the first time it is at or
 * above the fold. The check is positional rather than an IntersectionObserver:
 * an observer only fires on a *change* of intersection, so jumping straight to
 * the bottom of the page — an anchor link, a restored scroll position, a
 * find-in-page — leaves everything it skipped over invisible for good.
 * Comparing positions cannot miss an element that way.
 */
export function useReveal(deps: unknown[] = []): void {
  useEffect(() => {
    let remaining = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)'));
    if (remaining.length === 0) return;

    if (prefersReducedMotion()) {
      remaining.forEach((el) => el.classList.add('is-in'));
      return;
    }

    let queued = false;

    const detach = () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };

    const run = () => {
      queued = false;
      const limit = window.innerHeight * THRESHOLD;
      remaining = remaining.filter((el) => {
        if (el.getBoundingClientRect().top >= limit) return true;
        el.classList.add('is-in');
        return false;
      });
      if (remaining.length === 0) detach();
    };

    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    run();

    return detach;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
