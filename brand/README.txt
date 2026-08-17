YOUR LOGO AND THE ICONS BUILT FROM IT
=====================================

Your logo currently lives at:

    client/public/logo_png.png

That is the file every icon on the site is generated from. To change the
branding, replace that file and run:

    npm run seo:images
    npm run build

(You can also drop a file at brand/logo.png instead — the script checks
client/public/logo_png.png first, then brand/logo.png, brand/logo.jpg,
brand/logo.webp. Or pass a path:  node scripts/make-seo-images.mjs path/to.png)


WHAT GETS GENERATED
-------------------
    client/public/og.png                1200x630  link previews
    client/public/favicon.ico           32x32     browser tab, Google mobile
    client/public/favicon.svg                     sharp on retina screens
    client/public/apple-touch-icon.png  180x180   iOS home screen
    client/public/icon-192.png          192x192   Android home screen
    client/public/icon-512.png          512x512   manifest + schema.org logo

These are committed to git on purpose. The deploy just serves them, so Render
never needs Chrome installed to build the site.


ABOUT .ICO FILES
----------------
You do NOT need to supply an .ico. The script builds favicon.ico from your PNG.
.ico is an old container format that most upload boxes reject, which is why
yours would not attach anywhere. A PNG is exactly the right thing to give.


HOW YOUR LOGO IS HANDLED
------------------------
* TRIMMED. Exported logos carry empty margin around the artwork. The script
  measures where the actual art starts and ends, and uses only that, so the
  badge fills the icon instead of floating small in the middle.

* BACKGROUND. The script reads the corner pixel of your file to decide what to
  pad with. Your logo is cut out (transparent), so it pads with the site's
  near-black. If you ever supply a logo on solid white, it pads with that same
  white instead — no mismatched bars.


TRANSPARENCY: WHY ONLY THE FAVICON HAS IT
-----------------------------------------
The favicon is transparent, so your cut-out badge sits correctly whether the
browser tab bar is light or dark. Checked against both.

The other icons keep a solid background ON PURPOSE. This is not an oversight:

* apple-touch-icon.png — iOS ignores alpha on home-screen icons. It composites
  transparency onto BLACK. So a "transparent" iOS icon just becomes a black
  icon, and giving it a defined background means you get that result on
  purpose rather than by accident.

* icon-192.png / icon-512.png — site.webmanifest declares the 512 as
  "maskable", and Android crops maskable icons into a circle or squircle. That
  only works if the background fills the whole square. A cut-out mark gets its
  corners sliced off and looks broken on the home screen.

* icon-512.png is also the logo Google reads from your Organization structured
  data. A defined background renders more predictably there than alpha does.

If you would rather have all of them transparent anyway, open
scripts/make-seo-images.mjs, find the `jobs` array, and add
`transparent: true` (plus a third `true` argument to `square(...)`) to whichever
ones you want. The trade-offs above are the reason it is not the default.

* FAVICON IS CROPPED TIGHTER. A browser tab is 16 to 32 pixels. Your badge is
  detailed — crossed rifles, a supply crate, smoke, a wordmark — and at that
  size the full wide logo turns into a smear. So the favicon uses the centred
  square of the artwork, which drops the empty flanks and roughly doubles how
  much of the icon the emblem fills. The larger icons keep the whole mark.

  If you ever make a simplified version of the mark (just the crate and smoke,
  no wordmark), it will look sharper still at 16px. Not required — the current
  one is legible — but it is the one upgrade left on the icons.
