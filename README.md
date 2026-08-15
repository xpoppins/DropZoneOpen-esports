# Drop Zone Open — BGMI tournament site

A MERN tournament site for a community BGMI event. It does two jobs: collects
registrations through your Google Form, and shows live standings that admins
update between matches.

- **client** — Vite + React 18 + TypeScript, Tailwind for layout, Howler for
  audio. No animation library: reveals are CSS transitions driven by one
  IntersectionObserver.
- **server** — Express + Mongoose. **MongoDB is optional**: with no database
  configured the API reads and writes `server/data/*.json` instead, so the site
  runs on a laptop with nothing installed.

---

## Install and run

```bash
npm install          # installs both workspaces
npm run dev          # API on :4000, site on :5173
```

Open http://localhost:5173.

```bash
npm run build        # builds the client, then compiles the server
npm start            # serves the built site AND the API from :4000
npm run seed         # see "Editing standings"
npm run media        # regenerates the placeholder audio + backdrop
```

The score-entry page is at **http://localhost:5173/admin** (and `/admin` on the
built site). See "Updating scores during a match night" below.

---

## How to connect your Google Form

The registration button is a plain link to your form. To point it at yours:

1. Open your form at https://forms.google.com
2. Click **Send** (top right)
3. Choose the **link** tab — the chain icon 🔗
4. Copy the URL
5. Open `client/src/config/tournament.ts` and paste it into `registrationFormUrl`
6. Save, then rebuild (`npm run build`) — or just restart `npm run dev`

```ts
// ── SWAP THIS ONE LINE WITH YOUR GOOGLE FORM LINK ──
registrationFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSd..../viewform',
```

A shortened `https://forms.gle/xxxxxxxx` link works exactly the same.

**Check the form is accepting responses**: in the form's **Responses** tab, the
toggle at the top must be on. If it is off, visitors reach a page that says the
form is closed, and the button on this site will still look like it worked.

Set `registrationOpen: false` in the same file to turn every registration button
into a disabled "Registrations closed" state once the deadline passes.

---

## Everything you edit

`client/src/config/tournament.ts` is the single source of truth for content:
name, edition, dates, prize pool, entry fee, slot counts, rules, FAQ, schedule
and contact links. No component hardcodes any of it.

Dates are ISO strings with the IST offset:

```ts
registrationClosesAt: '2026-09-15T23:59:00+05:30',
```

That means "midnight IST" to you, and the countdown stays correct for a visitor
in any timezone.

---

## Why there is a backend at all

Fair question — most of this site could be a folder of static files. The server
earns its place for exactly one thing: **standings that change while people are
watching.**

Registration is a Google Form, so no server is needed for that. The rules, the
format, the prize split — all static. But on a match night you want to type in
scores and have every phone refreshing the page see them within a minute,
without you rebuilding and redeploying the site between matches. That needs
something running that holds the current numbers. That is the server, and that
is all it does:

- serves the standings and re-serves them when you change them
- accepts score updates from `/admin`, gated behind a password
- keeps the slot counter (`147 / 256`) in one place
- counts how many people opened the registration form (no personal data)

If you ever decide that redeploying after each match is fine, delete the
`server/` folder, move `results.json` into the client, and this becomes a static
site — nothing in the design depends on the API being there. It already falls
back to a bundled copy of the standings when the API is unreachable.

---

## Updating scores during a match night

Go to **`/admin`** (`http://localhost:5173/admin` in dev, `yoursite.com/admin`
once deployed).

1. Type the admin password — this is `ADMIN_TOKEN` from `server/.env`. Set one
   before the tournament: any long random string. Without it the page loads but
   every save is refused.
2. Pick the stage tab: Qualifiers / Semi-finals / Grand finals.
3. Set the status — `pending`, `live` or `complete`. `live` puts a pulsing
   "Live now" badge on the public board.
4. **+ Add squad**, then fill in tag, name, matches played, placement points and
   kill points. Total updates as you type; rank is worked out from it.
5. **Save**. The public page picks it up on its next poll, within 60 seconds.

The password lives in the tab's memory only, so closing the tab logs you out.
Rows without both a tag and a name are dropped on save, so a half-typed row
cannot break the board.

---

## Editing standings by hand

If you would rather not use the page, standings live in `server/data/results.json`. Rank and totals are calculated for
you — enter only what you counted:

```json
{
  "updatedAt": "2026-09-21T22:40:00+05:30",
  "stages": {
    "qualifiers": {
      "label": "Qualifiers",
      "status": "complete",              // pending | live | complete
      "note": "Group A of 16. Top 4 advance.",
      "teams": [
        { "tag": "PHX", "name": "Phoenix Rising", "matches": 4, "placementPts": 34, "killPts": 41 }
      ]
    },
    "semis": { "...": "same shape" },
    "finals": { "...": "same shape" }
  }
}
```

- `total` = `placementPts + killPts`, computed on the client; ranks follow from it.
- A stage with an empty `teams` array shows the pre-tournament invitation instead
  of a table, so an unplayed stage never looks broken.
- **Without MongoDB**, the file is re-read on every request: save it, refresh,
  done. The page also re-polls every 60 seconds on its own.
- `npm run seed -- --sample --force` drops a filled-in demo board into
  `results.json` so you can see the populated table. It overwrites real scores —
  that is what `--force` is confirming.

### Using MongoDB instead

```bash
cp .env.example server/.env       # then edit it
```

```
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=dropzone
ADMIN_TOKEN=some-long-random-string
```

On first boot with an empty database the server imports `data/results.json`
automatically. After that the database is the source of truth — `npm run seed`
re-imports the file whenever you want to reset it.

With `ADMIN_TOKEN` set you can post scores from a script or Postman:

```bash
curl -X PUT http://localhost:4000/api/standings/qualifiers \
  -H "content-type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"status":"live","note":"Match 3 of 4","teams":[{"tag":"PHX","name":"Phoenix Rising","matches":3,"placementPts":24,"killPts":31}]}'

curl -X PATCH http://localhost:4000/api/tournament \
  -H "content-type: application/json" -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"slots":{"total":256,"filled":163}}'
```

Without `ADMIN_TOKEN`, those write endpoints stay shut and say so.

### API

| Method | Path                             | Notes                                  |
| ------ | -------------------------------- | -------------------------------------- |
| GET    | `/api/health`                    | which store is live                    |
| GET    | `/api/media`                     | what the organiser uploaded            |
| GET    | `/api/media/:kind`               | `image` · `video` · `audio` · `click`  |
| PUT    | `/api/media/:kind`               | admin token, raw body                  |
| DELETE | `/api/media/:kind`               | admin token                            |
| GET    | `/api/standings`                 | all three stages                       |
| GET    | `/api/standings/:stage`          | `qualifiers` · `semis` · `finals`      |
| GET    | `/api/tournament`                | slots filled, registration open        |
| PUT    | `/api/standings/:stage`          | admin token                            |
| PATCH  | `/api/tournament`                | admin token                            |
| POST   | `/api/registrations/intent`      | counts form opens, stores no personal data |
| GET    | `/api/registrations/intent/count`| admin session                          |
| GET    | `/api/admin/session`             | is this browser signed in              |
| POST   | `/api/admin/login`               | `{ password }` → session cookie        |
| POST   | `/api/admin/logout`              | clears it                              |

If the API is unreachable the site falls back to `client/src/data/results.json`
and labels the board "saved copy". It never shows an error screen.

---

## Admin security

`/admin` renders a password box and nothing else until the **server** confirms a
session — the score fields, slot inputs and upload controls are never built for
an anonymous visitor.

| Concern | How it is handled |
| --- | --- |
| Password storage | Posted once to `/api/admin/login`, exchanged for an `HttpOnly; SameSite=Strict; Secure` cookie. Never held in JS; `document.cookie` is empty while signed in. |
| Brute force | 8 failures per IP → 15-minute lockout, covering both the login and the `x-admin-token` header. |
| Timing attacks | Compared with `crypto.timingSafeEqual` over SHA-256 digests. |
| Session life | 8 hours, in memory. A restart signs everyone out. Single-instance by design. |
| Uploads | Magic-byte sniffing. A renamed `.svg` is rejected — same-origin SVG can execute script. |
| Cross-origin | No CORS headers at all unless `ALLOWED_ORIGIN` is set. |
| Headers | CSP (`script-src 'self'`), `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy`. |
| Discovery | `X-Robots-Tag: noindex` on `/admin`, plus `robots.txt`. |
| Info leaks | `/api/health` reveals its data directory only to a signed-in admin. |

Your side of it: a long random `ADMIN_TOKEN`, HTTPS in production, and never
committing `server/.env`. It is one shared password, not per-admin accounts —
rotating it signs everybody out.

---

## The registration gate

Every Register button opens a consent step first: a checkbox, a link that opens
the full terms in a stacked dialog, and a button that stays inert until the box
is ticked. The registration panel carries the same checkbox inline, directly
above its button, and the footer links the terms for anyone who just wants to
read them.

Acceptance is stored against `TERMS_VERSION` in `client/src/config/terms.ts`.
Change the wording, bump the version, and every visitor is asked again rather
than carrying an acceptance of text they never saw.

Edit the terms in that same file. Everything in `[BRACKETS]` needs a decision
from you — minimum age, jurisdiction, ban length; names, dates, slots and prize
money interpolate from `tournament.ts`.

**This gate is UX, not evidence** — it lives in the visitor's own browser. Add a
required "I accept" checkbox question to the Google Form too; that response row
is the timestamped, per-squad record you would actually rely on.

---

## The backdrop and sounds, from /admin

`/admin` → **Look and sound** swaps four things with no redeploy: background
image, background video, ambient loop, click sound. Uploads go through the API
and are stored in MongoDB when it is configured — which is what makes them
survive a restart on free hosting. "Remove" restores the shipped placeholder.

Order of precedence: **uploaded → file in the repo → shipped placeholder.**

The background video plays on desktop only. Phones, save-data connections and
reduced-motion devices keep the still image.

## The backdrop image

The background is one photograph, fixed in place, blurred hard and dimmed, with
everything else sitting on top of it. Besides the admin panel, you can commit
one instead:

**Save it as `client/public/media/bg.jpg`** — that is the whole procedure.
`bg.webp` and `bg.png` work too. The page checks for it at load and layers it
over the shipped placeholder; if no file is there, the placeholder
(`bg.svg`, an original dusk-ridge drawing) stays.

It is blurred to roughly 30px, so sharpness does not matter — colour and shape
are all that survive. A wide screenshot, 1600×900 or larger, works best. Keep it
under ~400 KB; it loads on every visit.

To make it more or less visible, there are exactly two numbers, both in
`client/src/styles/index.css` under `.backdrop-plate` / `.backdrop-wash`:
`brightness()` on the image and the alpha values in the wash gradient.

**On the images you sent**: those are Krafton's official BGMI/PUBG promotional
art. Using them on a tournament site that hands out prize money is the kind of
thing that draws a takedown, so I have not committed them. If you want that
exact look with no legal exposure, a screenshot you took yourself in-game, or a
squad photo from a past event, blurs down to the same thing.

## Sound

Two files, both replaceable, both optional:

| File                              | What it is           | Aim for                          |
| --------------------------------- | -------------------- | -------------------------------- |
| `client/public/audio/ambient.mp3`  | background loop      | 30–90s, 96 kbps mono, under 1 MB |
| `client/public/audio/click.mp3`    | UI tick              | under 200ms, under 10 KB         |

Placeholders ship as `.wav` (generated by `npm run media`, no ffmpeg needed).
**An `.mp3` you drop in with the same name takes priority over the placeholder**
— nothing else to change. For the Zedge sound you linked: download it from that
page, rename it to `click.mp3`, and drop it in `client/public/audio/`.

Delete both files and the sound button removes itself.

**Why nothing plays when the page opens:** every browser blocks audio until the
visitor interacts with the page — this is not something a site can opt out of.
So a first-time visitor lands in silence and the button is the first gesture.
Once someone has turned sound on, the choice is remembered, and on their next
visit the loop starts at their first click or tap anywhere on the page.

## Accessibility and performance notes

- `prefers-reduced-motion: reduce` turns off the fade-ups, the accordion
  transition and smooth anchor scrolling. All content stays readable.
- No WebGL, no video, no animation library. The whole site is 58 KB gzipped;
  Howler (10 KB) only downloads if someone turns sound on, and the admin page is
  its own chunk that visitors never fetch.
- The board scrolls sideways on small screens; rank, tag, squad and total are
  visible without scrolling at 360px.
- Audio never starts on its own. The choice is remembered in `localStorage`, but
  a returning visitor still lands in silence.

## Deploying

```bash
npm run build
NODE_ENV=production PORT=4000 npm start
```

The Express server serves `client/dist` and the API from one origin, so no CORS
or environment configuration is needed in the browser. Set `MONGODB_URI` and
`ADMIN_TOKEN` in the environment if you are using a database.

---

Community tournament, not affiliated with or endorsed by Krafton, Inc. or
Battlegrounds Mobile India.
