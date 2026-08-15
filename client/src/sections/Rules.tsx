import { CONFIG } from '../config/tournament';
import { Section } from '../components/ui/Section';
import { Accordion } from '../components/ui/Accordion';

export function Rules() {
  return (
    <Section
      id="rules"
      title="Rules that get squads removed"
      intro="Read these once properly. Admins enforce them the same way for the top seed and the last squad in the draw."
    >
      <div className="grid grid-cols-12 gap-x-6 gap-y-8">
        <div className="col-span-12 rail:col-span-8">
          <Accordion items={CONFIG.rules} idPrefix="rules" />
        </div>

        <aside className="col-span-12 rail:col-span-4 rail:pl-8">
          <div className="panel panel-pad" data-reveal>
            <span className="stamp stamp--danger">
              <i className="dot" aria-hidden="true" />
              Instant disqualification
            </span>
            <ul className="mt-5 text-[14px] text-dust/85 [&>li]:border-t [&>li]:border-rule [&>li]:py-3 [&>li:first-child]:border-t-0">
              <li>Any hack, script, macro or modified game file</li>
              <li>Emulator, PC client or automated input hardware</li>
              <li>Account sharing or an unregistered player in the lobby</li>
              <li>Teaming with another squad in a live match</li>
              <li>VPN used to change region</li>
            </ul>
            <p className="mt-6 text-[13px] text-dust/75">
              Record your matches. A clip is the only thing that settles a dispute.
            </p>
          </div>
        </aside>
      </div>
    </Section>
  );
}
