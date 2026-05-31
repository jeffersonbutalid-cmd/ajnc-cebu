# AJNC Cebu Website

The website for **Apostolic Jesus Name Church — Cebu** (AJNC), a Oneness
Pentecostal church family in Mandaue City, Cebu, Philippines.

A static HTML/CSS/JS site, plus a Netlify Function for the AI assistant and a
Supabase database for shared church data. Implemented from the Claude Design
handoff.

## Structure

```
index.html                  Main one-page site (hero, plan, about, believe,
                            sermons, find-a-church, ministries, events,
                            leaders, stories, giving, prayer, contact,
                            newsletter, AI assistant, footer)
assets/
  site.css                  Site styles
  chat.css                  AI assistant widget styles
  config.js                 Runtime config (Supabase / Formspree / chat endpoint)
  data.js                   Supabase data layer (churches + placeholders)
  site.js                   Nav, reveal, Find-a-Church (Leaflet), forms
  microsite.js              Per-church microsite hydration + single map
  chat.js                   AI assistant widget logic
  halo3d.js                 Hero halo (Three.js, lazy / desktop only)
  *.png / *.jpg             Logo, seal, pastor portraits, photography
microsite/
  index.html                Lean per-church ad-landing page (one template,
                            every city — hydrated from Supabase by slug)
blog/                       "The Word" blog (index + sample article)
netlify/functions/
  chat.mjs                  Serverless endpoint → Claude, grounded in the KB
data/
  upci-knowledge.md         AI assistant knowledge base (apostolic / UPCI)
supabase/
  schema.sql                Tables + RLS + seed for churches & placeholders
netlify.toml                Build, functions, and /api/chat redirect
.env.example                Required environment variables
```

## External dependencies (CDN)

- [Leaflet 1.9.4](https://leafletjs.com/) — Find a Church map
- [Three.js 0.160](https://threejs.org/) — hero halo (progressively enhanced)
- Google Fonts: Bricolage Grotesque (display) + Figtree (body)

## Running locally

The static pages work with any static server:

```bash
python3 -m http.server 8000   # http://localhost:8000/
```

To run the AI assistant locally, use the Netlify CLI (loads the function and
your `ANTHROPIC_API_KEY`):

```bash
npm i -g netlify-cli
netlify dev
```

---

## 1 · AI church assistant (Claude)

A floating "Ask us anything" widget (`assets/chat.js` + `chat.css`) posts the
conversation to **`/.netlify/functions/chat`** (`netlify/functions/chat.mjs`),
which calls the **Claude API** grounded in **`data/upci-knowledge.md`**. The
knowledge base is sent as a *cached* system prompt (prompt caching) so repeat
questions are cheaper and faster.

**Setup**
1. In Netlify → Site configuration → Environment variables, add
   `ANTHROPIC_API_KEY`. Optionally set `CLAUDE_MODEL`
   (default `claude-haiku-4-5-20251001`; use `claude-sonnet-4-6` for richer
   answers).
2. Deploy. The widget works automatically; with no key set it shows a friendly
   "email us" fallback instead of failing.

**Knowledge base** — edit `data/upci-knowledge.md` to refine answers or paste in
more content from upci.org. It was compiled from UPCI's Articles of Faith and the
live "Our Beliefs" / "Oneness Pentecostalism" pages (verified May 2026; sources
listed at the end of the file). Direct crawling is blocked by the network policy,
so expand it by pasting page text under the matching headings. The doctrinal
guardrails (Oneness, not Trinitarian; baptism in Jesus' name; Holy Ghost with
tongues) live in both the KB and the function's system prompt.

## 2 · Forms (Formspree)

The prayer-request and newsletter forms submit to **Formspree**. Put your form
IDs (the part after `https://formspree.io/f/`) in `assets/config.js`:

```js
formspree: { prayer: 'xayzwqlb', newsletter: 'mzbjkrpo' }
```

Until real IDs are set, the forms show an optimistic success message (demo mode)
and post nowhere. Once set, submissions go straight to your Formspree inbox.

## 3 · Shared data (Supabase)

Church locations and per-church placeholders live in Supabase so the main site
**and every microsite** read the same source and reflect edits **without a
redeploy**.

**Setup**
1. Create a Supabase project, open the SQL editor, and run `supabase/schema.sql`
   (creates `churches` + `site_config`, enables read-only RLS, seeds the 8
   churches).
2. Put your project URL and **anon** key in `assets/config.js`
   (`supabaseUrl`, `supabaseAnonKey`). The anon key is public by design; writes
   are blocked by RLS — edit data from the Supabase dashboard.
3. Set `churchSlug` per site (`'cebu'` for the main site; each microsite its
   own slug).

**How it flows**
- **Find a Church** (`data.js` → `site.js`) loads `churches` at runtime. With no
  Supabase configured, it falls back to the built-in list, so the page always
  works.
- **Placeholders** — any element with `data-ajnc-bind="key"` is filled from the
  `site_config` value for this church. Giving details are wired this way:
  ```html
  <span data-ajnc-bind="gcash_number">0917 555 4673</span>
  <a data-ajnc-bind="youtube_url" data-ajnc-bind-attr="href">…</a>
  ```
  Add rows to `site_config` and bind more fields as needed (service times, bank
  numbers, socials). Edit a row → it updates on every site that reads it.

## 4 · Microsite (one template, every city)

`microsite/index.html` is a lean, conversion-focused ad-landing page for a single
local church (hero, what's-next, plan-your-visit, we-believe, sermons, giving,
contact + single-church map, AI assistant). It reuses the shared styles, the
Claude assistant, Formspree, and the Supabase data layer — **no separate
codebase**.

**How it picks a church** (`assets/microsite.js`):
`?church=<slug>` (preview) → `AJNC_CONFIG.churchSlug` → `"cebu"`. It loads that
church (Supabase when configured, otherwise the built-in dataset in
`assets/churches.fallback.js`) and hydrates every `data-church="…"` field (name,
city, pastor, address, service times, coordinates/map, YouTube), plus the
`data-ajnc-bind` placeholders (GCash/Maya/BPI, email, phone).

**Preview per city now** — open `microsite/?church=davao`, `?church=manila`,
`?church=cebu`, etc. This works offline against `churches.fallback.js`, so you can
see each city hydrate before Supabase is connected. When Supabase is set, live
rows take precedence.

**Deploying one per city**
- Ready-made configs live in `microsite/configs/` (`cebu.js`, `davao.js`,
  `manila.js`). Host `microsite/` on each subdomain (e.g. `davao.ajnc.ph`) and
  copy the matching file to `assets/config.js` (set `churchSlug`,
  `youtubeChannelId`, Supabase keys). Edit the church's row in Supabase and the
  live microsite updates — no redeploy.
- The page carries Cebu values as static SEO defaults and updates `<title>`,
  meta description, and JSON-LD client-side per church. For the strongest
  per-city SEO, also set those static defaults per subdomain build.

Each church keeps its own pastor and details via its row — the microsite never
hard-codes another church's pastor.

## Brand notes

- **Colors** — Bone Cream `#FAF7F1` (surface), Ink Navy `#0E2B4F` (text),
  Gospel Red `#C8262E` (accent), Mission Gold `#E8B53C` (salt only).
- **Type** — Bricolage Grotesque for display/scripture, Figtree for body.
- **Tagline** — "Together we carry the gospel to the whole world."

## Configured

- YouTube channel `UC2S7h4HtT5jO6GdJbTTGpKQ` and featured sermon `USfbRXdo2sM`
  are wired into the sermon player.

## Still to provide

- `ANTHROPIC_API_KEY` (Netlify env) — turns on the AI assistant.
- Formspree form IDs — turn on real form delivery.
- Supabase URL + anon key — turn on live, shared church data.
- Self-host the Google Fonts for production performance/privacy.
