import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { TERMS_VERSION } from '../config/terms';
import { CONFIG } from '../config/tournament';
import { Modal } from '../components/ui/Modal';
import { TermsBody } from '../components/ui/TermsBody';
import { recordFormOpen } from './api';

const STORAGE_KEY = 'dz.terms.accepted';

type ConsentApi = {
  /** Accepted the current version of the terms, in this browser. */
  accepted: boolean;
  /** Tick / untick from the inline checkbox in the registration panel. */
  setAccepted: (value: boolean) => void;
  /** Called by every Register button. Opens the form, or asks first. */
  requestRegistration: () => void;
  openTerms: () => void;
};

const ConsentCtx = createContext<ConsentApi>({
  accepted: false,
  setAccepted: () => undefined,
  requestRegistration: () => undefined,
  openTerms: () => undefined,
});

function readStored(): boolean {
  try {
    // Storing the version, not a boolean: change the terms, bump the version in
    // config/terms.ts, and everyone is asked again instead of silently carrying
    // an acceptance of wording they never saw.
    return localStorage.getItem(STORAGE_KEY) === TERMS_VERSION;
  } catch {
    return false;
  }
}

function openForm() {
  recordFormOpen();
  window.open(CONFIG.registrationFormUrl, '_blank', 'noopener,noreferrer');
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [accepted, setAcceptedState] = useState(readStored);
  const [askOpen, setAskOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [ticked, setTicked] = useState(false);
  const [shake, setShake] = useState(false);
  const acceptedRef = useRef(accepted);
  acceptedRef.current = accepted;

  const setAccepted = useCallback((value: boolean) => {
    acceptedRef.current = value;
    setAcceptedState(value);
    try {
      if (value) localStorage.setItem(STORAGE_KEY, TERMS_VERSION);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private mode — the tick still works for this visit */
    }
  }, []);

  const requestRegistration = useCallback(() => {
    if (acceptedRef.current) {
      openForm();
      return;
    }
    setTicked(false);
    setShake(false);
    setAskOpen(true);
  }, []);

  const confirm = () => {
    if (!ticked) {
      setShake(true);
      return;
    }
    setAccepted(true);
    setAskOpen(false);
    // Same click, so the popup blocker treats this as a user gesture.
    openForm();
  };

  useEffect(() => {
    if (!shake) return;
    const id = window.setTimeout(() => setShake(false), 500);
    return () => window.clearTimeout(id);
  }, [shake]);

  return (
    <ConsentCtx.Provider value={{ accepted, setAccepted, requestRegistration, openTerms: () => setTermsOpen(true) }}>
      {children}

      <Modal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        title="One thing before you register"
        sub="The form opens in a new tab once you accept."
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setAskOpen(false)}>
              Cancel
            </button>
            <button type="button" className="cta" onClick={confirm} aria-disabled={!ticked}>
              Open the registration form
              <span aria-hidden="true">↗</span>
            </button>
          </>
        }
      >
        <label className={`consent ${shake ? 'consent--shake' : ''}`}>
          <input type="checkbox" checked={ticked} onChange={(e) => setTicked(e.target.checked)} />
          <span>
            I have read and accept the{' '}
            <button type="button" className="link" onClick={() => setTermsOpen(true)}>
              Terms &amp; Conditions
            </button>
            , and I confirm every player in my squad meets the eligibility rules.
          </span>
        </label>

        {shake && (
          <p className="consent-warn" role="alert">
            Tick the box to continue.
          </p>
        )}

        <ul className="consent-points">
          <li>Entry is free. Nobody from this tournament will ask you to pay for a slot.</li>
          <li>Emulators, hacks and unregistered players mean instant disqualification.</li>
          <li>The captain is responsible for the whole squad’s conduct.</li>
        </ul>
      </Modal>

      <Modal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        title="Terms &amp; Conditions"
        sub={`${CONFIG.tournamentName} ${CONFIG.edition}`}
        wide
        footer={
          <button type="button" className="btn-ghost" onClick={() => setTermsOpen(false)}>
            Close
          </button>
        }
      >
        <TermsBody />
      </Modal>
    </ConsentCtx.Provider>
  );
}

export function useConsent(): ConsentApi {
  return useContext(ConsentCtx);
}
