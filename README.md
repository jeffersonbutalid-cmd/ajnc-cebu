# AJNC Cebu Website

The single-page website for **Apostolic Jesus Name Church — Cebu** (AJNC), a
Oneness Pentecostal church family in Mandaue City, Cebu, Philippines.

This is a static HTML/CSS/JS site, implemented from the Claude Design handoff.

## Structure

```
index.html                  Main one-page site (hero, plan, about, believe,
                            sermons, find-a-church, ministries, events,
                            leaders, timeline, stories, giving, prayer,
                            contact, newsletter, footer)
assets/
  site.css                  Site styles
  timeline.css              "Our Story" timeline styles
  site.js                   Nav, reveal-on-scroll, Find-a-Church (Leaflet),
                            forms, sermon player
  timeline.js               Timeline rail + modal
  halo3d.js                 Hero halo (Three.js, lazy / desktop only)
  *.png / *.jpg             Logo, seal, pastor portraits, photography
blog/
  index.html                "The Word" blog index
  why-we-baptise-in-jesus-name.html   Sample article
```

## External dependencies (CDN)

- [Leaflet 1.9.4](https://leafletjs.com/) — Find a Church map
- [Three.js 0.160](https://threejs.org/) — hero halo (progressively enhanced)
- Google Fonts: Bricolage Grotesque (display) + Figtree (body)

## Running locally

It's a static site — serve the folder with any static server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Brand notes

- **Colors** — Bone Cream `#FAF7F1` (surface), Ink Navy `#0E2B4F` (text),
  Gospel Red `#C8262E` (accent), Mission Gold `#E8B53C` (salt only).
- **Type** — Bricolage Grotesque for display/scripture, Figtree for body.
- **Tagline** — "Together we carry the gospel to the whole world."

## Production TODO

The prototype carries a few placeholders to wire up before going live:

- `YOUTUBE_CHANNEL_ID` in the sermon player script (`index.html`).
- `FEATURED_SERMON_VIDEO_ID` in the Featured Sermon block.
- Prayer-request and newsletter forms post nowhere yet (front-end only).
- Self-host the Google Fonts for production performance/privacy.
