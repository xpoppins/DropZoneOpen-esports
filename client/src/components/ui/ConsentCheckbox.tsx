import { useConsent } from '../../lib/consent';

/**
 * The inline version, sitting directly above the button in the registration
 * panel. Ticking it here means the button opens the form with no extra step;
 * clicking the button without ticking asks in a dialog instead. Both write the
 * same acceptance.
 */
export function ConsentCheckbox() {
  const { accepted, setAccepted, openTerms } = useConsent();

  return (
    <label className="consent">
      <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
      <span>
        I have read and accept the{' '}
        <button type="button" className="link" onClick={openTerms}>
          Terms &amp; Conditions
        </button>
        , and I confirm every player in my squad meets the eligibility rules.
      </span>
    </label>
  );
}
