# AJNC — Apostolic Jesus Name Church (Cebu)

Website, per-church microsite, and blog for AJNC, a Oneness Pentecostal church
family in Mandaue, Cebu, Philippines. Static HTML/CSS/JS + a Netlify Function
for the AI assistant + optional Supabase for shared church data.

## Structure

```
index.html              Main site (nav w/ dropdowns, hero, plan, about+photos,
                        believe, sermons (featured + 3), find-a-church, ministries,
                        events, leaders, stories, giving, prayer, contact, footer)
microsite/index.html    Per-church landing page (hydrated by ?church=<slug>)
microsite/configs/      Per-subdomain config template
blog/                   "The Word" blog (index + sample article)
assets/
  site.css / site.js    Main-site styles + interactions (nav, finder, forms)
  chat.css / chat.js     "Grace" AI assistant widget
  microsite.js           Microsite hydration (nav, player, map, forms)
  config.js              Runtime config (Supabase / Formspree / chat / YouTube)
  data.js                Supabase read layer (churches + placeholders)
  churches.fallback.js   Built-in church data (used when Supabase is off)
  *.jpg / *.png          Logo, seal, Grace avatar, pastor + About photos
netlify/functions/
  chat.mjs               Claude-backed assistant endpoint
  _knowledge.mjs         Embedded UPCI knowledge base (edit data/upci-knowledge.md too)
data/upci-knowledge.md   Human-editable knowledge base source
robots.txt sitemap.xml llms.txt   SEO / AEO / GEO
netlify.toml             Build + functions config
```

## Run locally

```bash
python3 -m http.server 8000        # static preview at http://localhost:8000/
# AI assistant locally:
npm i -g netlify-cli && netlify dev
```

## Features at a glance

- **Navigation** — dropdowns (About ▸ Who We Are/What We Believe/Pastors;
  Resources ▸ Sermons/Blog) + Ministries, Giving, Prayer Request, Church
  Locator, Contact. Mobile shows only the seal + hamburger; "Plan your visit"
  lives inside the menu.
- **Grace AI assistant** — floating chat → Netlify Function → Claude, grounded
  in the UPCI knowledge base. Language toggle ENG / TAG / CEB (Tagalog &
  Cebuano use a stronger model for fluency), typewriter replies, no em-dashes,
  American-English on EN, photo avatar, minimize + close.
- **Sermons** — featured sermon on top + three videos below (real YouTube
  thumbnails).
- **Find a Church / microsites** — locator cards open `microsite/?church=<slug>`;
  the microsite hydrates per city from Supabase (or built-in fallback data).
- **Forms** — prayer + newsletter via Formspree.
- **SEO/AEO/GEO** — JSON-LD (Church, FAQ, Event, VideoObject, WebSite,
  speakable WebPage), robots.txt (welcomes AI crawlers), sitemap.xml, llms.txt.

---

## Go-live checklist

1. **Deploy** — drag the build (or connect the repo to Netlify for auto-deploy;
   a GitHub Action is included at `.github/workflows/netlify-deploy.yml`).
2. **AI assistant** — set `ANTHROPIC_API_KEY` in Netlify → Environment
   variables. (Optional: `CLAUDE_MODEL`, `CLAUDE_MODEL_INTL`.)
3. **Forms** — Formspree IDs are wired (`xkoeaajp` prayer, `xvzynnkd`
   newsletter); confirm the form on first submission.
4. **Supabase (optional)** — run `supabase/schema.sql`, then set `supabaseUrl`
   + `supabaseAnonKey` in `assets/config.js` to make church data editable live.
5. **Domain** — canonicals/sitemap/robots/llms currently use `https://ajnc.ph`.
   If your production domain differs, tell the maintainer to update them.
6. **Submit** `sitemap.xml` in Google Search Console + Bing Webmaster Tools.

### Still to provide / tidy
- **Sermon video titles** — the three cards below the featured one use neutral
  labels; send the real titles to set them exactly.
- **Image sizes** — `lunch.jpg` (~10 MB) and the other About photos are large;
  resize to ~1600 px / ~300 KB each for faster loads and better Core Web Vitals.

## Brand
Bone `#FAF7F1` · Ink Navy `#0E2B4F` · Gospel Red `#C8262E` · Mission Gold
`#E8B53C`. Display: Bricolage Grotesque. Body: Figtree.
Tagline: "Together we carry the gospel to the whole world."
