import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

/* ============================================================================
 * ICONS AND THE SOCIAL PREVIEW IMAGE
 * ----------------------------------------------------------------------------
 * Run:   npm run seo:images
 *
 * HOW TO USE YOUR OWN LOGO
 *   Save it as  brand/logo.png  in this project. That is the only step.
 *   Re-run the command and every icon below is rebuilt from it.
 *
 *   - A PNG is exactly right. You do NOT need to supply an .ico — this script
 *     builds favicon.ico for you. (.ico is an old container format that most
 *     upload boxes reject, which is why yours would not attach.)
 *   - A transparent background is best. If your PNG has one, icons are placed
 *     on the site's near-black so they look native in a dark browser tab.
 *   - If it has no transparency, the script samples the logo's own corner
 *     colour and pads with that, so a white-background logo becomes a clean
 *     white icon rather than a logo with odd bars down the sides.
 *   - Square-ish art works best. A wide logo still works, it just sits letter-
 *     boxed inside the square icons.
 *
 * WHY THE OUTPUT IS COMMITTED
 *   These files are generated here, on your machine, and checked into git. The
 *   deploy just serves them. That keeps Chrome (which this script drives) out
 *   of the build, so Render never needs a browser installed to deploy.
 *
 * WHAT GETS WRITTEN into client/public/
 *   og.png               1200x630  link previews in WhatsApp, Discord, X
 *   favicon.ico          32x32     browser tabs, and Google's mobile results
 *   favicon.svg                    modern browsers; wraps the PNG so it stays
 *                                  sharp on high-density screens
 *   apple-touch-icon.png 180x180   iOS home screen
 *   icon-192.png         192x192   Android home screen / manifest
 *   icon-512.png         512x512   manifest, and the logo in your schema.org
 *                                  Organization data that Google reads
 * ==========================================================================*/

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const publicDir = path.join(root, 'client', 'public');
const tmpDir = path.join(root, 'node_modules', '.tmp-seo');

/**
 * Where the source logo is looked for, in order. Pass a path as an argument to
 * override. `client/public/logo_png.png` is the file already in this project.
 */
const LOGO_CANDIDATES = [
  process.argv[2],
  path.join(root, 'client', 'public', 'logo_png.png'),
  path.join(root, 'brand', 'logo.png'),
  path.join(root, 'brand', 'logo.jpg'),
  path.join(root, 'brand', 'logo.webp'),
].filter(Boolean);

const VOID = '#0a0c0e';
const ZONE = '#3df2e4';
const FLARE = '#ff6b1a';
const DUST = '#c9bfa4';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

async function firstExisting(list) {
  for (const candidate of list) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      /* next */
    }
  }
  return null;
}

/** The display face, inlined so rendering never depends on the network. */
async function displayFontCss() {
  const file = path.join(root, 'node_modules', '@fontsource-variable', 'archivo', 'files', 'archivo-latin-wdth-normal.woff2');
  try {
    const b64 = (await fs.readFile(file)).toString('base64');
    return `@font-face{font-family:'Archivo Variable';src:url(data:font/woff2;base64,${b64}) format('woff2-variations');font-weight:100 900;font-stretch:62% 125%;font-display:block;}`;
  } catch {
    return '';
  }
}

/**
 * Shared logo-drawing routine, injected into every page this script renders.
 *
 * Two problems it solves, both of which decide whether an icon looks
 * professional or amateurish:
 *
 * 1. TRIMMING. Exported logos almost always carry empty margin around the
 *    artwork. Dropped straight into a square icon, a wide logo ends up small
 *    and marooned in the middle. So the artwork's real bounding box is measured
 *    and only that is drawn — the badge then fills the icon.
 *
 * 2. BACKGROUND. The script cannot know whether your PNG is cut out or sits on
 *    a solid colour, so it reads the corner pixel and decides: transparent
 *    corner means draw on the site's near-black; a solid corner means pad with
 *    that same colour, so a logo on white becomes a clean white icon rather
 *    than one with mismatched bars at the sides.
 */
const LOGO_HELPER = `
function drawLogo(img, canvas, fillRatio, paintBackground, squareCrop) {
  var W = canvas.width, H = canvas.height, out = canvas.getContext('2d');

  var m = document.createElement('canvas');
  m.width = img.naturalWidth; m.height = img.naturalHeight;
  var mx = m.getContext('2d', { willReadFrequently: true });
  mx.drawImage(img, 0, 0);

  var data;
  try { data = mx.getImageData(0, 0, m.width, m.height).data; }
  catch (e) { out.drawImage(img, 0, 0, W, H); return; }

  var corner = [data[0], data[1], data[2], data[3]];
  var cutOut = corner[3] < 25;
  var bg = cutOut ? '${VOID}' : 'rgb(' + corner[0] + ',' + corner[1] + ',' + corner[2] + ')';

  // A pixel counts as artwork if it is visible (cut-out art) or differs from
  // the flat background colour (art on a solid backdrop).
  function isInk(i) {
    if (cutOut) return data[i + 3] > 20;
    return Math.abs(data[i] - corner[0]) + Math.abs(data[i + 1] - corner[1]) + Math.abs(data[i + 2] - corner[2]) > 30;
  }

  var minX = m.width, minY = m.height, maxX = -1, maxY = -1;
  for (var y = 0; y < m.height; y++) {
    for (var x = 0; x < m.width; x++) {
      if (isInk((y * m.width + x) * 4)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) { minX = 0; minY = 0; maxX = m.width - 1; maxY = m.height - 1; }

  var cw = maxX - minX + 1, ch = maxY - minY + 1;

  // A browser tab is 16 to 32 pixels. A wide logo letterboxed into that is a
  // smear. Taking the centred square of the artwork instead throws away the
  // empty flanks and roughly doubles how much of the icon the emblem occupies,
  // which is the difference between a recognisable mark and a coloured blob.
  // Biased slightly upward because wordmarks sit along the bottom.
  if (squareCrop) {
    var side = Math.min(cw, ch);
    minX = minX + (cw - side) / 2;
    minY = minY + ((ch - side) / 2) * 0.72;
    cw = side;
    ch = side;
  }

  var scale = Math.min((W * fillRatio) / cw, (H * fillRatio) / ch);
  var dw = cw * scale, dh = ch * scale;

  // Icons need an opaque square. The social card already has its own gradient
  // behind the logo, so there the canvas is left transparent.
  if (paintBackground !== false) {
    out.fillStyle = bg;
    out.fillRect(0, 0, W, H);
  }
  out.imageSmoothingQuality = 'high';
  out.drawImage(m, minX, minY, cw, ch, (W - dw) / 2, (H - dh) / 2, dw, dh);
}`;

const logoSquare = (logoUrl, size, squareCrop = false, transparent = false) => `
<canvas id="out" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px"></canvas>
<img id="logo" src="${logoUrl}" style="display:none">
<script>
${LOGO_HELPER}
(function () {
  var img = document.getElementById('logo');
  function go() {
    drawLogo(img, document.getElementById('out'), ${squareCrop ? 0.96 : 0.88}, ${!transparent}, ${squareCrop});
    document.title = 'ready';
  }
  if (img.complete) go(); else img.onload = go;
})();
</script>`;

/** The fallback mark, used when no brand/logo.png has been supplied yet. */
const generatedMark = (size) => {
  const pad = Math.round(size * 0.16);
  const bar = Math.max(2, Math.round(size * 0.055));
  const inner = size - pad * 2;
  return `
<div style="position:relative;width:${size}px;height:${size}px;background:${VOID};display:flex;align-items:center;justify-content:center">
  <div style="position:relative;width:${inner}px;height:${inner}px">
    <div style="position:absolute;inset:0;border:${bar}px solid ${ZONE};opacity:0.95"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:${Math.round(inner * 0.34)}px;height:${Math.round(inner * 0.34)}px;background:${FLARE}"></div>
  </div>
</div>`;
};

/**
 * 1200x630 social card. With a logo supplied it becomes a proper lockup —
 * badge on the left, wordmark and details on the right. Without one it is the
 * type-only card.
 */
const ogCard = (logoUrl) => `
<div style="position:relative;width:1200px;height:630px;overflow:hidden">
  <div style="position:absolute;inset:0;background:
      radial-gradient(120% 90% at 88% 108%, rgba(255,107,26,0.30) 0%, rgba(255,107,26,0) 58%),
      radial-gradient(80% 70% at 4% -10%, rgba(61,242,228,0.14) 0%, rgba(61,242,228,0) 60%),
      ${VOID}"></div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:6px;background:${ZONE}"></div>

  <div style="position:absolute;inset:58px 68px;display:flex;align-items:center;gap:54px">
    ${
      logoUrl
        ? `<canvas id="ogLogo" width="360" height="360" style="width:360px;height:360px;flex:none;filter:drop-shadow(0 10px 30px rgba(0,0,0,0.55))"></canvas>
           <img id="logo" src="${logoUrl}" style="display:none">`
        : ''
    }
    <div style="flex:1;min-width:0">
      <div style="font-family:ui-monospace,monospace;color:${ZONE};font-size:19px;letter-spacing:0.24em;text-transform:uppercase">
        Drop Zone Open &middot; League First
      </div>
      <div class="display" style="margin-top:26px;font-size:${logoUrl ? 92 : 132}px;color:#f2ede1">No second</div>
      <div class="display" style="font-size:${logoUrl ? 92 : 132}px;color:transparent;-webkit-text-stroke:2.5px #f2ede1">Circle</div>
      <div style="margin-top:34px;font-family:ui-monospace,monospace;color:${DUST};font-size:21px">
        BGMI &middot; Squad TPP &middot; Erangel / Miramar / Rondo
      </div>
      <div style="margin-top:22px;display:flex;align-items:center;gap:16px">
        <span style="background:${FLARE};color:#0a0c0e;font-family:ui-monospace,monospace;font-size:20px;font-weight:700;padding:13px 22px;letter-spacing:0.04em">REGISTER YOUR SQUAD</span>
        <span style="font-family:ui-monospace,monospace;color:${DUST};opacity:0.75;font-size:18px">live standings</span>
      </div>
    </div>
  </div>
</div>
${
  logoUrl
    ? `<script>
${LOGO_HELPER}
(function () {
  var img = document.getElementById('logo');
  function go() {
    // 0.98 because the card has its own generous padding around the logo —
    // no need for the extra margin the square icons want.
    drawLogo(img, document.getElementById('ogLogo'), 0.98, false);
    document.title = 'ready';
  }
  if (img.complete) go(); else img.onload = go;
})();
</script>`
    : ''
}`;

const page = (fontCss, body, w, h, transparent = false) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;background:${transparent ? 'transparent' : VOID};overflow:hidden}
body{font-family:'Archivo Variable',Impact,sans-serif;-webkit-font-smoothing:antialiased}
.display{font-family:'Archivo Variable',Impact,sans-serif;font-weight:800;font-stretch:125%;letter-spacing:-0.02em;line-height:0.84;text-transform:uppercase}
</style></head><body>${body}</body></html>`;

/**
 * A 32x32 ICO wrapping a PNG. The ICO container has allowed PNG payloads since
 * Vista, which every browser in use reads — and it means this script needs no
 * image-encoding library at all.
 */
function icoFromPng(png, size = 32) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(1, 4); // one image inside
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // 0 means 256 in this format
  entry.writeUInt8(size === 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2); // palette size
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12); // byte offset of the payload
  return Buffer.concat([header, entry, png]);
}

async function shoot(chrome, htmlPath, width, height, transparent = false) {
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    // Lets the corner-sampling script above run before the shutter closes.
    '--virtual-time-budget=1500',
    '--allow-file-access-from-files',
    // Without this Chrome paints white behind the page and the alpha is lost.
    ...(transparent ? ['--default-background-color=00000000'] : []),
    `--window-size=${width},${height}`,
    `--screenshot=${htmlPath}.png`,
    pathToFileURL(htmlPath).href,
  ];
  await new Promise((resolve, reject) => {
    const proc = spawn(chrome, args, { stdio: 'ignore' });
    proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`chrome exited ${code}`))));
    proc.on('error', reject);
  });
  return fs.readFile(`${htmlPath}.png`);
}

async function main() {
  const chrome = await firstExisting(CHROME_CANDIDATES);
  if (!chrome) throw new Error('Chrome not found — edit CHROME_CANDIDATES in this script.');

  const logoPath = await firstExisting(LOGO_CANDIDATES);
  const logoUrl = logoPath ? pathToFileURL(logoPath).href : null;

  if (logoPath) {
    console.log(`[seo] using your logo: ${path.relative(root, logoPath)}`);
  } else {
    console.log('[seo] no brand/logo.png found — using the generated placeholder mark.');
    console.log('[seo] drop a PNG at brand/logo.png and run this again to use your own.');
  }

  const fontCss = await displayFontCss();
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.mkdir(publicDir, { recursive: true });

  // `crop` = take the centred square of the artwork. Only the favicon needs it:
  // that is the one shown at 16-32px, where a wide logo becomes unreadable.
  // The manifest icons keep the whole mark, since they are shown much larger.
  const square = (size, crop = false, transparent = false) =>
    logoUrl ? logoSquare(logoUrl, size, crop, transparent) : generatedMark(size);

  /**
   * WHICH ICONS GET A TRANSPARENT BACKGROUND
   *
   * The favicon does, because a browser tab is sometimes light and sometimes
   * dark, and a cut-out mark sits correctly on both.
   *
   * The others deliberately do NOT, and it is not an oversight:
   *   - apple-touch-icon: iOS does not honour alpha here. It composites
   *     transparency onto BLACK, so a "transparent" iOS icon is a black icon
   *     with the logo on it — which is what the solid version already gives,
   *     only predictably.
   *   - icon-192 / icon-512: site.webmanifest declares 512 as `maskable`, and
   *     Android crops maskable icons to a circle or squircle. That only works
   *     if the background actually fills the square; a cut-out mark gets its
   *     corners sliced off.
   *   - icon-512 is also the logo Google reads from your Organization schema,
   *     where a defined background renders more predictably than alpha.
   */
  const jobs = [
    { name: 'og', body: ogCard(logoUrl), w: 1200, h: 630, out: 'og.png' },
    { name: 'icon512', body: square(512), w: 512, h: 512, out: 'icon-512.png' },
    { name: 'icon192', body: square(192), w: 192, h: 192, out: 'icon-192.png' },
    { name: 'apple', body: square(180), w: 180, h: 180, out: 'apple-touch-icon.png' },
    // Rendered at 128 and declared as 32 inside the ICO: downscaling a crisp
    // 128 in the browser beats asking the renderer to draw detail at 32.
    { name: 'ico', body: square(128, true, true), w: 128, h: 128, out: null, transparent: true },
  ];

  let icoPng = null;
  for (const job of jobs) {
    const htmlPath = path.join(tmpDir, `${job.name}.html`);
    await fs.writeFile(htmlPath, page(fontCss, job.body, job.w, job.h, job.transparent), 'utf8');
    const png = await shoot(chrome, htmlPath, job.w, job.h, job.transparent);
    if (job.out) {
      await fs.writeFile(path.join(publicDir, job.out), png);
      console.log(`[seo] ${job.out.padEnd(20)} ${job.w}x${job.h}`.padEnd(46) + `${(png.length / 1024).toFixed(1)} KB`);
    } else {
      icoPng = png;
    }
  }

  if (icoPng) {
    await fs.writeFile(path.join(publicDir, 'favicon.ico'), icoFromPng(icoPng, 32));
    console.log('[seo] favicon.ico          32x32');

    // favicon.svg simply carries the same bitmap, so browsers that prefer SVG
    // get one file that scales instead of a blurry 32px upscale.
    const b64 = icoPng.toString('base64');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Drop Zone Open">
  <image href="data:image/png;base64,${b64}" width="128" height="128"/>
</svg>
`;
    await fs.writeFile(path.join(publicDir, 'favicon.svg'), svg, 'utf8');
    console.log('[seo] favicon.svg          vector wrapper');
  }

  await fs.rm(tmpDir, { recursive: true, force: true });
  console.log('[seo] done. Commit client/public/ — the deploy needs no Chrome.');
}

main().catch((err) => {
  console.error('[seo] failed:', err.message);
  process.exitCode = 1;
});
