import { useAudio } from '../../lib/audio';

/**
 * Nothing plays until this is pressed — the browser would block it anyway, and
 * sound that starts on its own is the fastest way to lose a visitor. If no
 * audio file shipped, the button does not render at all.
 *
 * The "off" state is drawn with a CSS strike rather than a slashed-note glyph,
 * which not every Android font has.
 */
export function AudioToggle() {
  const { available, enabled, toggle } = useAudio();
  if (!available) return null;

  return (
    <button
      type="button"
      className="audio-toggle"
      onClick={toggle}
      aria-pressed={enabled}
      title={enabled ? 'Turn sound off' : 'Turn sound on'}
    >
      <span className="audio-note" aria-hidden="true">
        ♪
      </span>
      <span className="audio-toggle-word">{enabled ? 'Sound on' : 'Sound off'}</span>
      <span className="sr-only">{enabled ? 'Turn sound off' : 'Turn sound on'}</span>
    </button>
  );
}
