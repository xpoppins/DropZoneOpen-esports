import { useId, useState } from 'react';
import { useDuckHandlers } from '../../lib/audio';

export type AccordionItem = { q: string; a: string };

type Props = { items: readonly AccordionItem[]; idPrefix: string };

/**
 * One panel open at a time. The open/close animation is a CSS grid-row
 * transition — no measuring, no animation library. A closed panel is marked
 * aria-hidden so a screen reader never reads seven answers at once.
 */
export function Accordion({ items, idPrefix }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId().replace(/:/g, '');
  const duck = useDuckHandlers();

  return (
    <div className="border-t border-rule">
      {items.map((item, i) => {
        const expanded = open === i;
        const panelId = `${idPrefix}-${baseId}-panel-${i}`;
        const buttonId = `${idPrefix}-${baseId}-button-${i}`;

        return (
          <div key={item.q}>
            <h3 className="contents">
              <button
                id={buttonId}
                type="button"
                className="acc-trigger"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => {
                  duck.onClick();
                  setOpen(expanded ? null : i);
                }}
                onMouseEnter={duck.onMouseEnter}
                onMouseLeave={duck.onMouseLeave}
              >
                <span className="flex-1">{item.q}</span>
                <span className="sign" aria-hidden="true">
                  {expanded ? '–' : '+'}
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!expanded}
              className="acc-panel"
              data-open={expanded}
            >
              <div className="acc-clip">
                <p className="acc-body">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
