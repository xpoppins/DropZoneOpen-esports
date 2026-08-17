# SEO — what was done, why, and what is left for you

This file explains every SEO change made to this site: what it is, which file
it lives in, and what it actually does for you. Read the first section if you
read nothing else.

**Nothing about how the site works was changed.** Standings, the admin panel,
uploads, the calendar and the prize pool all behave exactly as before. Every
change here is either a new file, or additions to `<head>`.

---

## The one thing to understand first

There are two different jobs people call "SEO", and they need different work:

**1. Being findable and correctly understood.** Meta tags, structured data,
sitemaps, crawl rules, link previews, page speed, semantic HTML. This is
engineering, it is finishable, and **it is done — all of it is in this repo.**

**2. Being worth ranking.** Content, links, brand searches, reviews, mentions.
This is not code. No amount of markup gets a site ranked for "BGMI tournament"
against sites with hundreds of pages and thousands of links. That part is on
you, and the last section of this file tells you exactly what to do.

The playbook you shared (200,000 impressions and 50,000 clicks) is a
**content-marketing plan for a multi-page business site.** It assumes 40 to 60
published pages and steady link building. This is a one-page tournament site.
Honest read: with the technical work now in place, this site can realistically
own its **branded searches** ("Drop Zone Open", "Drop Zone Open registration")
and compete for **long-tail intent** ("BGMI tournament registration India",
"free BGMI custom room tournament") — a few hundred to a few thousand
impressions a month while a tournament is live. Reaching 200k needs the content
engine described at the end. I would rather tell you that now than have you
wonder in three months why the numbers did not move.

---

## Part 1 — Technical SEO

### `client/index.html` — the head, rewritten

Everything a crawler or a social platform reads before it runs any JavaScript.

| Tag | Why it is there |
|---|---|
| `<title>` (51 chars) | Leads with "BGMI Squad TPP Tournament", not the brand, because that is what people type. Under 60 chars so Google does not cut it off. |
| `<meta name="description">` (134 chars) | Under 155 so it does not truncate. Written to earn the click, not to stuff keywords. |
| `<link rel="canonical">` | Tells Google the one true address of this page. Prevents the same page being seen as several (with/without `www`, with tracking params) and splitting its own ranking. |
| `<meta name="keywords">` | Ignored by Google since 2009. Included because you asked and because a few small engines still read it. It costs nothing and does nothing. |
| `<meta name="robots">` + `googlebot` | `index, follow` plus `max-image-preview:large`, which is what lets Google show a big image next to your result instead of a thumbnail. |
| `<html lang="en-IN">` | Indian English. Helps Google serve this to the right country. |

### Link previews (Open Graph + Twitter Card)

For a tournament, **this matters more than any ranking factor.** Every squad
that shares the link in a WhatsApp group is a preview card. Before: a bare URL.
Now: a branded 1200x630 image, title and description.

Implemented: `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`,
`og:locale`, `og:image` (+ `secure_url`, `type`, `width`, `height`, `alt`), and
the matching `twitter:card` / `title` / `description` / `image` / `image:alt`.

`og:image:width` and `height` are not optional in practice — without them
WhatsApp often renders a small square instead of the wide card.

### Icons — `scripts/make-seo-images.mjs`

Google shows your favicon **beside your result on mobile search**, so this is a
search asset, not just a browser-tab decoration. The site had none.

Generated from **your logo** (`client/public/logo_png.png`) and committed:

```
og.png               1200x630   link previews
favicon.svg                     modern browsers, crisp at any size
favicon.ico          32x32      older browsers, Google mobile results
apple-touch-icon.png 180x180    iOS home screen
icon-192.png         192x192    Android / manifest
icon-512.png         512x512    manifest + the logo in your schema
```

Re-run with `npm run seo:images` whenever the branding changes. The files are
committed, so **your deploy never needs Chrome installed.** Full notes are in
`brand/README.txt`.

Two things the generator does that matter:

- **Trims** the empty margin around your artwork, so the badge fills the icon
  instead of floating small in the middle.
- **Crops the favicon tighter.** A browser tab is 16 to 32 pixels, and your
  badge is detailed. The favicon uses the centred square of the mark, dropping
  the empty flanks; the larger icons keep the whole logo. Compared side by side
  at 32px, the crop is the difference between a readable badge and a blur.

### `client/public/robots.txt`

Allows the whole public site, blocks `/admin` and `/api/`, and points to the
sitemap. It also **explicitly allows the AI crawlers** — GPTBot, ClaudeBot,
PerplexityBot, Google-Extended, OAI-SearchBot and others. They are blocked by
default on many hosts, and being readable by them is the whole point of the
LLMO work below.

### `client/public/sitemap.xml` — `scripts/make-sitemap.mjs`

Regenerated on every `npm run build`, so `lastmod` is always the deploy date.
One URL, because the public site is one page. Anchors like `#standings` are
deliberately **not** listed: they are parts of a page, not pages, and a sitemap
full of them is one Google trusts less.

### `/admin` kept out of search

Two locks: `Disallow: /admin` in robots.txt, and the server already sends
`X-Robots-Tag: noindex, nofollow` on that path. The header is the one that
actually works — robots.txt stops crawling, not indexing.

### Speed and Core Web Vitals

Measured on the production build served by Express:

```
TTFB                39 ms
DOMContentLoaded   159 ms
First Contentful Paint  748 ms
Requests            23
Transferred        251 KB
```

That is comfortably inside Google's thresholds. Fonts are self-hosted (no
third-party request), the admin panel is a separate chunk visitors never
download, and the media cache added earlier means the backdrop no longer costs
a database round trip per visit. **No work needed here.**

---

## Part 2 — Structured data (the part that does the heavy lifting)

This is what lets Google, Bing, Siri, Alexa, ChatGPT and Perplexity understand
that this page is *a specific sports event, on specific dates, with a specific
entry fee, run by a specific organisation* — instead of "some text about a
game".

### Where it lives

- **`client/src/config/seo.ts`** — builds the whole schema.org graph.
- **`client/src/lib/useStructuredData.ts`** — keeps it in step with live data.
- **`client/index.html`** — a static baseline copy for crawlers that do not run
  JavaScript.

### What is described

One connected `@graph`, joined by `@id` so a crawler sees one entity, not five
unrelated blobs:

| Node | What it says |
|---|---|
| `Organization` | Drop Zone Collective, its logo, email and social profiles. |
| `WebSite` | The site itself, published by that organisation. |
| `WebPage` | This page, about that event, plus `speakable` (below). |
| `SportsEvent` | **The important one.** Name, description, start and end dates, online attendance mode, virtual location, organiser, capacity, remaining slots, prize pool, and an `Offer` carrying the entry fee, currency and whether registration is open. |
| `subEvent` x3 | Group A, Group B and the Grand finals as their own dated events. |
| `FAQPage` | All 8 of your FAQ questions and answers. |

### The bit worth being pleased about

**The structured data is live.** It is built from the same data the page
renders, so:

- Change the entry fee in `/admin` → `offers.price` changes.
- Move a date in the calendar → `startDate`, `endDate` and the sub-events move.
- Edit the prize pool → the `award` line changes.
- Registration closes → `availability` flips to `SoldOut`.

You never edit schema by hand, and it can never drift out of sync with what a
visitor is being told. Verified working: the graph currently reports your real
fee, your real dates and your real prize pool.

### Why there are two copies

`index.html` carries a **baseline** built from the config defaults. Crawlers
that do not run JavaScript (some social scrapers, older bots) read that. Google,
Bing and the AI crawlers all render the page, and get the **live** version,
which replaces the baseline on load. You get correct data either way.

A `<script type="application/ld+json">` is a data block, not code — the browser
never executes it, so the site's strict `script-src 'self'` policy does not
block it. Confirmed: no CSP errors in the console.

---

## Part 3 — AEO and voice search (answer engines)

AEO is about being **the answer**, not a blue link. A voice assistant reads one
result aloud; an AI answer quotes one or two sources.

- **`FAQPage` schema** on all 8 questions. Answer engines lift these almost
  verbatim. The entry-fee answer is generated from the live fee, so a voice
  assistant never quotes a stale price.
- **`speakable`** on the `WebPage` node, naming the exact CSS selectors an
  assistant should read aloud (`#hero h1`, `#hero p`, `#format h2`, `#prize h2`)
  — the headline, the summary sentence, the format and the prizes.
- **Answer-first copy** was already the house style here, which helps: your FAQ
  answers open with "Yes —" or "No.", and the format section states the rules in
  short declarative sentences. That is exactly the shape featured snippets and
  voice answers pull from.

---

## Part 4 — LLMO / GEO (being cited by AI)

When someone asks an AI "is there a BGMI tournament I can enter?", you want to
be quoted correctly rather than hallucinated about.

### `client/public/llms.txt`

A plain-language brief for language models, following the emerging `llms.txt`
convention. It states what the site is, the exact format and scoring, who can
enter, how to register, how room IDs are distributed, and that this is a
community event **not affiliated with KRAFTON** — the single most likely thing
for an AI to get wrong.

Critically, it tells models **not to quote the fee, dates, slots or prizes from
the file itself**, and points them at `/api/tournament` and `/api/standings`
instead, which are public read-only endpoints that are always current. That is
the difference between an AI citing you accurately in six months and citing a
number you changed.

### The other half of LLMO

Models are fed by the same signals as search: clean semantic HTML, real
structured data, and a page that states facts plainly. All three are in place.

---

## Part 5 — On-page and semantic SEO

Audited; the existing markup was already strong and needed almost nothing:

- **One `<h1>`** (the hero), **9 `<h2>`** — one per section, each tied to its
  section with `aria-labelledby`. Correct hierarchy, no skipped levels.
- **Landmarks**: `<main>`, `<header>`, `<footer>`, plus a skip link.
- **No missing `alt`**, no unnamed buttons.
- **No `<nav>`** — and that is correct. This is a single page with no menu; the
  footer is a contact list, not navigation. Adding a fake nav landmark would be
  worse than not having one.
- **Semantic keywords** are carried naturally by the copy: "Squad TPP", "BGMI",
  map names, "qualifiers", "grand finals", "room ID", "registration". Google's
  semantic matching wants topic coverage, not repetition, and the page has it.

The `title` and `description` were rewritten to lead with search intent. That
is the highest-leverage on-page change available on a one-page site, and it is
the one from the playbook ("rewrite titles/metas") that actually applies here.

---

## Part 6 — What is NOT done, because it cannot be done in code

Off-page SEO is not a file. Here is your list, in the order that matters.

### 1. Google Search Console — do this first, today

Nothing else can be measured until this exists.

1. Go to `search.google.com/search-console`
2. Add property → URL prefix → `https://dropzoneopen-esports.onrender.com`
3. Verify. The **HTML tag** method is easiest: it gives you a
   `<meta name="google-site-verification" content="...">` — paste it into
   `client/index.html` next to the other meta tags, rebuild, deploy, click
   Verify.
4. Sitemaps → submit `sitemap.xml`
5. URL Inspection → paste your homepage → **Request Indexing**

Then do the same at `bing.com/webmasters` (it also feeds ChatGPT search).

Expect nothing for 3 to 7 days. That is normal.

### 2. Fill in your real social links

`client/src/config/tournament.ts` still has placeholders:

```
whatsapp:  https://wa.me/919000000000     ← placeholder
discord:   https://discord.gg/your-invite ← placeholder
instagram: https://instagram.com/your-handle ← placeholder
```

These feed the `sameAs` field in your Organization schema, which is how Google
connects your site to your social accounts and starts treating you as a real
entity. **The code deliberately filters placeholders out** rather than
publishing fake profile URLs, so `sameAs` is currently empty. Put real URLs in
and it populates itself.

*(Also worth a look: the footer labels one link "You Tube" but points it at
`CONFIG.contact.discord`. I left it alone as you asked, but it is probably not
what you meant.)*

### 3. Brand searches are your best traffic

Branded queries convert at 30 to 60% CTR. Every Instagram post, Discord
announcement and YouTube clip that says "Drop Zone Open" creates people who
later search for it. That is the single most realistic path to real click
volume for this site.

### 4. If you want the impressions numbers, you need pages

A one-page site cannot rank for many things. If you genuinely want the
playbook's numbers, the site needs content:

- **Per-season result pages** — "Drop Zone Open League First — Final Standings"
  is a page people search for *by name* after the event, permanently.
- **Guides** — "How to get a BGMI room ID", "BGMI tournament rules explained",
  "BGMI points system explained". These are real long-tail searches with low
  competition.
- **A YouTube channel** with the casted finals, embedded on the site.

Each of those is a new indexable page. Twenty of them, each earning 200 to 500
impressions a month, is how the number moves. Say the word and I will build a
content section that reuses the existing design.

### 5. Links

Esports directories, BGMI community Discords, Reddit (r/BGMI, r/IndianGaming —
share results, do not spam), and any org whose squads play. One genuine mention
from a gaming site is worth more than fifty directory submissions.

---

## Maintenance

| When | Do this |
|---|---|
| Every deploy | Nothing — the sitemap regenerates itself. |
| After a tournament | Update standings in `/admin`, then Request Indexing in GSC. |
| New season | Change the dates and fee in `/admin`. Schema follows automatically. |
| Domain change | One line: `VITE_SITE_URL` in `client/.env`, then rebuild. Canonical, OG, sitemap and schema all follow. |
| Branding change | Replace `client/public/logo_png.png`, then `npm run seo:images` |
| Weekly | GSC → Performance. Watch impressions, CTR, and queries in positions 8 to 20. |

---

## Files changed and added

**Added**

```
client/src/config/seo.ts             the schema.org graph
client/src/lib/useStructuredData.ts  keeps it live
client/public/llms.txt               AI answer-engine brief
client/public/site.webmanifest       installable metadata
client/public/sitemap.xml            generated
client/public/og.png                 social preview, built from your logo
client/public/favicon.svg / .ico     icons, built from your logo
client/public/icon-192.png / 512     icons, built from your logo
client/public/apple-touch-icon.png   icons, built from your logo
brand/README.txt                     how to swap the logo
client/.env                          VITE_SITE_URL (public, committed)
scripts/make-sitemap.mjs             sitemap generator
scripts/make-seo-images.mjs          icon + OG generator
SEO.md                               this file
```

**Changed**

```
client/index.html          head rewritten, baseline schema, richer noscript
client/public/robots.txt   sitemap line + AI crawler rules
client/vite.config.ts      injects VITE_SITE_URL into the HTML
client/src/App.tsx         one line: the structured-data hook
package.json               prebuild sitemap + seo:images script
.gitignore                 exception so client/.env is committed
```

Nothing in `server/` was touched.

---

## Verified

- Built HTML contains no unreplaced `%VITE_SITE_URL%` placeholders.
- All 9 SEO files serve with correct content types on the production server.
- `/admin` returns `X-Robots-Tag: noindex, nofollow`.
- The live JSON-LD renders, replaces the baseline, and reports the real fee,
  dates, capacity and prize pool. No CSP errors.
- Title 51 chars, description 134 chars — neither truncates.
- Site still works: standings, schedule, prizes, register, admin. Zero console
  errors.
