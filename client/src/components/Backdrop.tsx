import { useEffect, useState } from 'react';
import { fetchMediaMap, firstAvailable } from '../lib/media';
import { useReducedMotion } from '../lib/motion';

/** Drop any one of these into client/public/media/ and it becomes the backdrop. */
const IMAGE_FILES = ['/media/bg.jpg', '/media/bg.webp', '/media/bg.png'];
const VIDEO_FILES = ['/media/bg.mp4', '/media/bg.webm'];

/** A background video is a luxury: skip it on phones, on metered connections,
 *  and for anyone who asked for less motion. They get the still instead. */
function videoAllowed(reduced: boolean): boolean {
  if (reduced) return false;
  if (window.matchMedia('(max-width: 899px)').matches) return false;
  const connection = (navigator as { connection?: { saveData?: boolean } }).connection;
  return !connection?.saveData;
}

/**
 * One fixed, heavily blurred backdrop behind everything, with a dark wash over
 * it so text contrast never depends on which image was used.
 *
 * Three sources, in order: whatever was uploaded from /admin, then a file
 * dropped into client/public/media/, then the shipped SVG placeholder.
 */
export function Backdrop() {
  const reduced = useReducedMotion();
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const uploaded = await fetchMediaMap();
      const still = await firstAvailable([uploaded.image, ...IMAGE_FILES]);
      if (!cancelled && still) setImage(still);

      if (!videoAllowed(reduced)) return;
      const loop = await firstAvailable([uploaded.video, ...VIDEO_FILES]);
      if (!cancelled && loop) setVideo(loop);
    })();

    return () => {
      cancelled = true;
    };
  }, [reduced]);

  return (
    <div className="backdrop" aria-hidden="true">
      <div
        className="backdrop-plate"
        style={image ? { backgroundImage: `url('${image}'), url('/media/bg.svg')` } : undefined}
      />

      {video && (
        <video
          className="backdrop-video"
          src={video}
          poster={image ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          onError={() => setVideo(null)}
        />
      )}

      <div className="backdrop-wash" />
    </div>
  );
}
