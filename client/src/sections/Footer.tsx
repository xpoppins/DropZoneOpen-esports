import { CONFIG } from '../config/tournament';
import { useDuckHandlers } from '../lib/audio';
import { useConsent } from '../lib/consent';

const YEAR = new Date().getFullYear();

export function Footer() {
  const duck = useDuckHandlers();
  const { openTerms } = useConsent();

  const channels = [
    { label: 'Email', value: CONFIG.contact.email, href: `mailto:${CONFIG.contact.email}` },
    { label: 'WhatsApp', value: 'Captains channel', href: CONFIG.contact.whatsapp },
    { label: 'Discord', value: 'Server invite', href: CONFIG.contact.discord },
    { label: 'Instagram', value: 'Clips and results', href: CONFIG.contact.instagram },
  ];

  return (
    <footer id="contact" className="section bay pb-20" aria-labelledby="contact-title">
      <div className="grid grid-cols-12 gap-x-6 gap-y-10">
        <div className="col-span-12 rail:col-span-5">
          <h2 id="contact-title" className="text-[clamp(1.6rem,5vw,2.6rem)]">
            Run by {CONFIG.organiser}
          </h2>
          <p className="mt-4 max-w-prose text-dust/75">
            Admins answer on Discord fastest during match nights, and on email within a day otherwise. Bring room
            problems to the lobby admin first — they can fix things while the match is still on.
          </p>
        </div>

        <div className="col-span-12 rail:col-span-7 rail:pl-8">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            {channels.map((c) => (
              <div key={c.label} className="border-t border-rule py-4">
                <dt className="label">{c.label}</dt>
                <dd className="mt-1">
                  <a
                    className="link"
                    href={c.href}
                    target={c.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    onMouseEnter={duck.onMouseEnter}
                    onMouseLeave={duck.onMouseLeave}
                    onClick={duck.onClick}
                  >
                    {c.value}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-16 pt-6 border-t border-rule flex flex-wrap gap-x-8 gap-y-3 justify-between">
        <p className="text-[12px] text-dust/70 max-w-[62ch] leading-relaxed">
          {CONFIG.tournamentName} is a community tournament run by {CONFIG.organiser}. It is not affiliated with,
          sponsored by, or endorsed by Krafton, Inc. or Battlegrounds Mobile India. All game names and trademarks
          belong to their owners.
        </p>
        <p className="flex items-center gap-4 text-[11px] text-dust/70">
          <button type="button" className="link" onClick={openTerms}>
            Terms &amp; Conditions
          </button>
          <span className="num">© {YEAR}</span>
        </p>
      </div>
    </footer>
  );
}
