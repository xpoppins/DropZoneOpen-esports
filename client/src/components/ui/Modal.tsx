import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Small line under the title. */
  sub?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Wider layout for long documents. */
  wide?: boolean;
};

/**
 * A native <dialog> — the browser gives us the focus trap, Esc to close, the
 * backdrop, and correct semantics for free. Stacking works too, so the terms
 * can open on top of the consent step.
 */
export function Modal({ open, onClose, title, sub, children, footer, wide = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  /**
   * A native listener rather than React's onClose: `close` does not bubble, so
   * the element itself is the unambiguous place to catch it. The target check
   * keeps stacked dialogs (terms on top of the consent step) independent.
   */
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = (event: Event) => {
      if (event.target === dialog) onCloseRef.current();
    };

    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, []);

  // A modal <dialog> does not stop the page behind it from scrolling.
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal--wide' : ''}`}
      // Clicking the backdrop means clicking the dialog itself, never a child.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <div>
          <h2 className="modal-title">{title}</h2>
          {sub && <p className="modal-sub">{sub}</p>}
        </div>
        <button type="button" className="modal-x" onClick={onClose} aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="modal-body">{children}</div>

      {footer && <div className="modal-foot">{footer}</div>}
    </dialog>
  );
}
