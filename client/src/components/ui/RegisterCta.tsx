import { CONFIG } from '../../config/tournament';
import { useDuckHandlers } from '../../lib/audio';
import { useConsent } from '../../lib/consent';

type Props = {
  label?: string;
  /** Longer wording used once there is room for it (the status bar swaps at 900px). */
  fullLabel?: string;
  className?: string;
};

/**
 * Still a real anchor — it can be long-pressed, opened in a new tab or copied —
 * but a plain left-click is intercepted so the terms are accepted first. Once
 * accepted, every later click goes straight through to the form.
 */
export function RegisterCta({ label = 'Register your squad', fullLabel, className = '' }: Props) {
  const duck = useDuckHandlers();
  const { requestRegistration } = useConsent();

  if (!CONFIG.registrationOpen) {
    return (
      <span className={`cta ${className}`} aria-disabled="true" role="link">
        Registrations closed
        <span aria-hidden="true">×</span>
      </span>
    );
  }

  return (
    <a
      className={`cta ${className}`}
      href={CONFIG.registrationFormUrl}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={duck.onMouseEnter}
      onMouseLeave={duck.onMouseLeave}
      onClick={(event) => {
        // Let ctrl/cmd/middle-click behave like a normal link.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        duck.onClick();
        requestRegistration();
      }}
    >
      {fullLabel ? (
        <>
          <span className="cta-short">{label}</span>
          <span className="cta-full">{fullLabel}</span>
        </>
      ) : (
        label
      )}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
