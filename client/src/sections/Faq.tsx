import { CONFIG, feeCopy } from '../config/tournament';
import { Section } from '../components/ui/Section';
import { Accordion } from '../components/ui/Accordion';
import type { EventSettings } from '../lib/api';

type Props = { event: EventSettings };

export function Faq({ event }: Props) {
  // The fee answer is written from the live number, so changing the fee in
  // /admin changes what the FAQ says. Every other answer is fixed copy.
  const items = CONFIG.faq.map((item) =>
    'liveAnswer' in item && item.liveAnswer === 'entryFee'
      ? { ...item, a: feeCopy(event.entryFee).faq }
      : item,
  );
  return (
    <Section
      id="faq"
      title="Asked before every event"
      intro="If your question is not here, mail the organisers — the address is at the bottom of the page."
    >
      <div className="grid grid-cols-12">
        <div className="col-span-12 rail:col-span-9">
          <Accordion items={items} idPrefix="faq" />
        </div>
      </div>
    </Section>
  );
}
