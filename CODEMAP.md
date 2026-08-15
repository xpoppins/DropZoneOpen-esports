# Code map — how this site is built and where to change things

For future-you, or whoever maintains this next. `SETUP.txt` is the "how do I run
and deploy it" guide; this is the "where in the code is that, and what happens if
I touch it" guide.

**Rule of thumb before you change any code:** most things you will actually want
to change are content, and content lives in two files —
`client/src/config/tournament.ts` and `client/src/config/terms.ts`. Try there
first. The components read from those files and hardcode nothing.

---

## 1. The 30-second mental model

```
   BROWSER                          SERVER (Express)              STORAGE
   ┌──────────────────┐             ┌──────────────────┐          ┌─────────────┐
   │ index.html       │             │ /api/standings   │◀────────▶│ MongoDB     │
   │  └ main.tsx      │──fetch─────▶│ /api/tournament  │   or     │   ...or...  │
   │      ├ App.tsx   │   /api/*    │ /api/media/*     │◀────────▶│ JSON files  │
   │      │  └ sections            │ /api/admin/*     │          │ server/data │
   │      └ Admin.tsx │             └──────────────────┘          └─────────────┘
   │        (/admin)  │
   └──────────────────┘
```

- **One page** for visitors, built from sections stacked in `App.tsx`.
- **One extra page** at `/admin`, chosen in `main.tsx` by looking at the URL.
  No router library — it is one `if`.
- The server is optional for looks and required for live scores. If it is
  unreachable, the site falls back to a bundled copy of the standings and says
  "saved copy" under the board.
- The database is optional. No `MONGODB_URI` means the same API reads and writes
  JSON files in `server/data/`.

---

## 2. "I want to change X" → go here

| I want to change… | File | Notes |
| --- | --- | --- |
| Tournament name, dates, maps, mode | `client/src/config/tournament.ts` | Everything reads from here |
| Google Form link | `client/src/config/tournament.ts` → `registrationFormUrl` | One line |
| Prize amounts / add a non-cash prize | `client/src/config/tournament.ts` → `prizePool` | Number = cash, `'text'` = anything else |
| Participation certificate line | `client/src/config/tournament.ts` → `prizePool.participationNote` | `''` hides the box |
| Slot count fallback | `client/src/config/tournament.ts` → `slots` | Live value comes from the API |
| Rules text, FAQ answers | `client/src/config/tournament.ts` → `rules`, `faq` | Arrays; add or remove freely |
| Schedule / stage cards | `client/src/config/tournament.ts` → `schedule` | |
| Points table | `client/src/config/tournament.ts` → `points` | Also feeds the terms |
| Contact links, socials | `client/src/config/tournament.ts` → `contact` | Footer reads these |
| Terms & Conditions wording | `client/src/config/terms.ts` | **Bump `TERMS_VERSION`** after any edit |
| Colours | `client/src/styles/index.css` → `:root` | Change hex **and** the matching `--*-rgb` |
| Fonts | `client/src/main.tsx` (imports) + `tailwind.config.js` | |
| Spacing / section padding | `client/src/styles/index.css` → `.section`, `.bay` | |
| Backdrop darkness or blur | `client/src/styles/index.css` → `.backdrop-plate`, `.backdrop-wash` | |
| Background image / video / sounds | **`/admin` → Look and sound** | No code change at all |
| Order of page sections | `client/src/App.tsx` | Just reorder the JSX |
| Anything on the score-entry page | `client/src/admin/Admin.tsx` | |
| Upload size limits, allowed file types | `server/src/routes.ts` → `KIND_LIMIT_MB`, `sniffFamily` | Read §7 first |
| Login rules, lockout, session length | `server/src/auth.ts` | |
| Security headers / CSP | `server/src/index.ts` | |
| How standings are validated | `server/src/types.ts` → `parseStage` | |

---

## 3. Folder map

### `client/src/config/` — the content layer

| File | What it is |
| --- | --- |
| `tournament.ts` | Every string and number on the public page. **Start here.** |
| `terms.ts` | The T&C document, as data. Pulls names/dates/prizes from `tournament.ts` so they cannot drift. |

### `client/src/sections/` — one file per band of the page

`Hero` · `PrizePool` · `Format` · `Rules` · `Register` · `Standings` · `Faq` ·
`Footer`. Each one reads config, renders markup, and owns no data of its own
except `Standings` (which receives live results as props).

The order they appear on screen is the order they are listed in `App.tsx`.

### `client/src/components/` — reused pieces

| File | What it is |
| --- | --- |
| `StatusBar.tsx` | The fixed top bar: countdown, slots, sound toggle, Register button |
| `Backdrop.tsx` | The blurred background layer. Picks uploaded → repo file → placeholder |
| `ui/Section.tsx` | The heading + intro wrapper every section uses |
| `ui/RegisterCta.tsx` | The orange button. Intercepts clicks for the consent gate |
| `ui/ConsentCheckbox.tsx` | The inline "I accept" tick box |
| `ui/Modal.tsx` | Native `<dialog>` wrapper — focus trap and Esc come free |
| `ui/TermsBody.tsx` | Renders `terms.ts` into the dialog |
| `ui/Accordion.tsx` | Rules and FAQ. Open/close is a CSS grid transition, no JS animation |
| `ui/AudioToggle.tsx` | Sound on/off. Hides itself if no audio file exists |

### `client/src/lib/` — the wiring

| File | What it is |
| --- | --- |
| `api.ts` | Talks to the server; holds the offline fallback and `withTotals()` which computes rank |
| `useTournamentData.ts` | Fetches standings + slots, re-polls every 60s |
| `consent.tsx` | The terms gate: who accepted, the two dialogs, and opening the form |
| `audio.tsx` | Sound. Loads Howler only on first click |
| `media.ts` | Finds uploaded media, falls back to repo files |
| `useCountdown.ts` | The ticking clock |
| `useReveal.ts` | Fade-up on scroll |
| `motion.ts` | One question: has the visitor asked for reduced motion? |
| `format.ts` | Money, numbers and IST dates. **All date formatting goes through here.** |

### `server/src/`

| File | What it is |
| --- | --- |
| `index.ts` | Boots Express, security headers, serves the built site in production |
| `routes.ts` | Every endpoint, plus admin auth middleware and upload checks |
| `auth.ts` | Password check, sessions, brute-force lockout |
| `store.ts` | **The important one.** One interface, two implementations: Mongo and JSON files |
| `models.ts` | Mongoose schemas |
| `types.ts` | Validation. Nothing reaches storage without passing through here |
| `env.ts` | Reads `server/.env` |
| `seed.ts` | `npm run seed` — imports/refills standings |

---

## 4. The CSS system

`client/src/styles/index.css` is one file, ~1,400 lines, in three Tailwind
layers. It is long but strictly ordered — find your area by its comment banner:

```
backdrop · status bar · type bits · panels · controls · countdown · stamps ·
meter · tabs · board · accordion · reveal · admin · admin sign-in ·
admin media · modal · consent · terms
```

**Colours are defined twice, on purpose:**

```css
--flare: #ff6b1a;        /* used by hand-written CSS */
--flare-rgb: 255 107 26; /* used by Tailwind, so text-flare/70 works */
```

Change one without the other and half the site keeps the old colour. This is the
single easiest mistake to make in this file.

**Which to use when:** Tailwind utilities in the JSX for layout (grid, spacing,
sizing). Hand-written classes in `index.css` for anything with a *look* that
repeats — `.cta`, `.panel`, `.board`, `.modal`. Utilities always win over the
components layer, so you can override a hand-written class inline.

**Custom breakpoint:** `rail:` = 900px and up (desktop). Anything not prefixed is
the phone layout. This site is built phone-first; check narrow before wide.

---

## 5. How to do the four most likely jobs

### Add a new section to the page

1. Copy `client/src/sections/Faq.tsx` — it is the smallest one.
2. Put your content in `tournament.ts`, not in the component.
3. Wrap it in `<Section id="..." title="..." intro="...">`.
4. Import it in `App.tsx` and drop it where you want it in the list.
5. Add `data-reveal` to anything that should fade up on scroll.

### Add a field to the config

1. Add it to `CONFIG` in `tournament.ts`.
2. Use it as `CONFIG.yourField`. TypeScript infers the type — no interface to update.
3. If it is a date, store it as `'2026-09-15T23:59:00+05:30'` and print it with
   `formatIST()` from `lib/format.ts`.

### Add an API endpoint

1. Add the method to the `Store` type in `server/src/store.ts`.
2. Implement it **twice** — in `createFileStore()` and in `createMongoStore()`.
   The build fails if you forget one, which is the point.
3. Add the route in `routes.ts`. Put `requireAdmin` in front of anything that writes.
4. Call it from the client through `lib/api.ts`.

### Change what a prize looks like

`prizePool` in `tournament.ts`. A number is cash and gets a proportional bar; a
quoted string is anything else and gets no bar. `PrizePool.tsx` decides with
`isCash()` — you do not need to touch the component to add a trophy or a
gaming mouse.

---

## 6. Conventions worth keeping

- **Content lives in config, never in components.** If you are typing a
  tournament fact into a `.tsx` file, it belongs in `tournament.ts`.
- **All numerals render in the mono font** via `.num`. It is the strongest part
  of the visual identity — a plain-font number will look wrong.
- **Dates are ISO strings with `+05:30`** and formatted through `lib/format.ts`,
  so the countdown is right for a visitor in any timezone.
- **Every write endpoint is behind `requireAdmin`.** No exceptions.
- **Nothing reaches storage unvalidated** — everything goes through `types.ts`.
- **Reduced motion is respected everywhere.** New animation? Check
  `prefersReducedMotion()` first.
- **The site must survive the API being down.** Test it: stop the server, reload
  the page. It should still render with "saved copy" under the board.

---

## 7. Gotchas that will bite you

| Thing | Why it bites |
| --- | --- |
| `.env.example` vs `server/.env` | The example is a blank template and **nothing reads it**. Real values go in `server/.env`. Both are git-ignored here, so a fresh clone has neither — copy the settings from §8 of `SETUP.txt` by hand on a new machine. |
| MongoDB's 16 MB document limit | Uploaded media is stored inside one document. Anything near 16 MB cannot be saved to Mongo at all. See below. |
| Tailwind opacity on CSS variables | `text-dust/70` only compiles because `--dust-rgb` exists as channels. A hex-only variable silently produces **no CSS**. |
| `TERMS_VERSION` | Edit the terms without bumping it and everyone keeps an acceptance of wording they never saw. |
| The CSP | Adding a CDN script, Google Font, or analytics tag **will be blocked**. Add the host to the CSP in `server/src/index.ts` or self-host it. |
| Browsers block audio | Nothing can autoplay before a click. This is not a bug and cannot be worked around. |
| Free-host disks are wiped | Uploads and scores need MongoDB in production or they vanish on restart. |
| `npm run seed -- --sample --force` | Overwrites real standings with demo data. |

### If you want bigger media uploads

Current caps are in `server/src/routes.ts`: image 6 MB, video 12 MB, ambient
6 MB, click 2 MB. Raising them is one line, but three things break before the
number does:

1. **MongoDB refuses anything over ~16 MB per document.** Storing a 300 MB file
   would need GridFS, which is a real rewrite of `store.ts`.
2. **The whole file is held in memory** while uploading and again while serving.
   Render's free tier has 512 MB of RAM; a few hundred MB of video will get the
   process killed, taking the whole site down — not just the upload.
3. **Every visitor downloads the backdrop.** 300 MB on Indian mobile data is
   minutes of waiting and a real chunk of someone's data pack, and the image is
   blurred and darkened anyway — a 400 KB JPEG and a 300 MB PNG look identical
   once the blur is applied.

If the background looks soft and you want it sharper, the fix is in
`.backdrop-plate` — it currently applies `blur(30px) brightness(0.5)` on desktop
and `blur(18px) brightness(0.45)` on phones. Lower the blur, raise the
brightness. A bigger file changes nothing you can see.

---

## 8. Commands

```bash
npm run dev      # site :5173, API :4000, both reload on save
npm run build    # typecheck + build both workspaces — run before every deploy
npm start        # serve the built site and API together on :4000
npm run media    # regenerate placeholder sounds and backdrop art
npm run seed     # standings helper (see SETUP.txt)
```

`npm run build` is the real test in this project: it typechecks both workspaces
and fails on anything broken. Run it before you push.

---

## 9. If you are handing this to someone else

Point them at, in order: `SETUP.txt` (run it), this file (change it),
`README.md` (the reference). The three cover different questions and are meant
to be read in that order.
