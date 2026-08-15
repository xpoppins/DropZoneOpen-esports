import { CONFIG } from '../config/tournament';
import { Section } from '../components/ui/Section';
import { Accordion } from '../components/ui/Accordion';

export function Faq() {
  return (
    <Section
      id="faq"
      title="Asked before every event"
      intro="If your question is not here, mail the organisers — the address is at the bottom of the page."
    >
      <div className="grid grid-cols-12">
        <div className="col-span-12 rail:col-span-9">
          <Accordion items={CONFIG.faq} idPrefix="faq" />
        </div>
      </div>
    </Section>
  );
}
