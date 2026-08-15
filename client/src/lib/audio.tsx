import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Howl as HowlInstance } from 'howler';
import { fetchMediaMap, firstAvailable } from './media';

const STORAGE_KEY = 'dz.audio.on';
const FADE_MS = 800;
const AMBIENT_VOLUME = 0.35;
const DUCKED_VOLUME = AMBIENT_VOLUME * 0.3;

/** Your own file wins over the placeholder — drop an .mp3 in and it is used. */
const AMBIENT_SOURCES = ['/audio/ambient.mp3', '/audio/ambient.wav'];
const CLICK_SOURCES = ['/audio/click.mp3', '/audio/click.wav'];

type AudioApi = {
  /** Whether any ambient file shipped — if false the toggle hides itself. */
  available: boolean;
  enabled: boolean;
  toggle: () => void;
  click: () => void;
  duck: (on: boolean) => void;
};

const AudioCtx = createContext<AudioApi>({
  available: false,
  enabled: false,
  toggle: () => undefined,
  click: () => undefined,
  duck: () => undefined,
});

/** Howler needs an extension to pick a decoder; API URLs do not have one. */
const FORMAT_HINT = ['mp3', 'wav', 'ogg', 'm4a'];

type Howler = typeof import('howler');

export function AudioProvider({ children }: { children: ReactNode }) {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const lib = useRef<Howler | null>(null);
  const ambient = useRef<HowlInstance | null>(null);
  const clickFx = useRef<HowlInstance | null>(null);
  const sources = useRef<{ ambient: string; click: string | null } | null>(null);
  const ducked = useRef(false);
  const enabledRef = useRef(false);
  enabledRef.current = enabled;

  /**
   * Howler is imported on demand, never at page load: constructing it creates an
   * AudioContext, which browsers warn about before a gesture — and it keeps
   * ~10 KB out of the initial download.
   */
  const ensureLoaded = useCallback(async () => {
    if (lib.current) return lib.current;
    const found = sources.current;
    if (!found) return null;

    const mod = await import('howler');
    lib.current = mod;
    ambient.current = new mod.Howl({ src: [found.ambient], format: FORMAT_HINT, loop: true, volume: 0, html5: false });
    if (found.click) clickFx.current = new mod.Howl({ src: [found.click], format: FORMAT_HINT, volume: 0.35 });
    return mod;
  }, []);

  const setPlaying = useCallback(
    async (on: boolean) => {
      const mod = await ensureLoaded();
      const howl = ambient.current;
      if (!mod || !howl) return;
      mod.Howler.mute(false);

      if (on) {
        if (!howl.playing()) howl.play();
        howl.fade(howl.volume(), ducked.current ? DUCKED_VOLUME : AMBIENT_VOLUME, FADE_MS);
      } else {
        howl.fade(howl.volume(), 0, FADE_MS);
        window.setTimeout(() => {
          if (!enabledRef.current) howl.pause();
        }, FADE_MS + 40);
      }
    },
    [ensureLoaded],
  );

  useEffect(() => {
    let cancelled = false;
    let armed: (() => void) | null = null;

    void (async () => {
      // Uploaded from /admin first, then whatever shipped in public/audio.
      const uploaded = await fetchMediaMap();
      const [ambientSrc, clickSrc] = await Promise.all([
        firstAvailable([uploaded.audio, ...AMBIENT_SOURCES]),
        firstAvailable([uploaded.click, ...CLICK_SOURCES]),
      ]);
      if (cancelled || !ambientSrc) return;

      sources.current = { ambient: ambientSrc, click: clickSrc };
      setAvailable(true);

      // A first-time visitor always lands in silence. Someone who turned sound
      // on before gets it back at their first click anywhere — browsers block
      // audio until a gesture, so there is no way to start it any earlier.
      if (localStorage.getItem(STORAGE_KEY) !== '1') return;

      const start = () => {
        armed?.();
        armed = null;
        enabledRef.current = true;
        setEnabled(true);
        void setPlaying(true);
      };

      const events = ['pointerdown', 'keydown', 'touchstart'] as const;
      events.forEach((type) => document.addEventListener(type, start, { once: true, passive: true }));
      armed = () => events.forEach((type) => document.removeEventListener(type, start));
    })();

    return () => {
      cancelled = true;
      armed?.();
      ambient.current?.unload();
      clickFx.current?.unload();
      ambient.current = null;
      clickFx.current = null;
      lib.current?.Howler.unload();
      lib.current = null;
    };
  }, [setPlaying]);

  // Silence everything while the tab is in the background.
  useEffect(() => {
    const onVisibility = () => lib.current?.Howler.mute(document.hidden || !enabledRef.current);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    void setPlaying(next);
  }, [setPlaying]);

  const click = useCallback(() => {
    if (!enabledRef.current) return;
    clickFx.current?.play();
  }, []);

  const duck = useCallback((on: boolean) => {
    ducked.current = on;
    const howl = ambient.current;
    if (!howl || !enabledRef.current) return;
    howl.fade(howl.volume(), on ? DUCKED_VOLUME : AMBIENT_VOLUME, 240);
  }, []);

  return <AudioCtx.Provider value={{ available, enabled, toggle, click, duck }}>{children}</AudioCtx.Provider>;
}

export function useAudio(): AudioApi {
  return useContext(AudioCtx);
}

/** Spread onto any button or link: ducks the loop on hover, ticks on click. */
export function useDuckHandlers() {
  const { duck, click } = useAudio();
  return {
    onMouseEnter: () => duck(true),
    onMouseLeave: () => duck(false),
    onClick: () => click(),
  };
}
