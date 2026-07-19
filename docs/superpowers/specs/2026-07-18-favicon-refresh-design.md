# Favicon Refresh — Design Spec

**Date:** 2026-07-18
**Status:** Approved

## Problem

The browser tab icon (`frontend/public/favicon.svg`) is a purple/blue glassy
lightning-bolt left over from the previous design. The current design language
is warm terracotta on charcoal with a mono/terminal aesthetic and the
`ethan.harter` wordmark — the icon matches none of it.

## Decision

Replace the icon with an **"e." monogram**: the lowercase "e" plus terracotta
dot from the wordmark, on a charcoal tile. Chosen over a terminal-prompt glyph
(too generic among dev sites) and a bare accent dot (too weak at tab size).

## Design

- **File:** overwrite `frontend/public/favicon.svg` in place. `index.html`
  already links `/favicon.svg` with `type="image/svg+xml"` — no HTML change.
- **Canvas:** 64×64 viewBox. Full-bleed rounded square, corner radius 14,
  fill `#0c0e10` (the site's dark `--bg`).
- **Glyph:** lowercase "e" in `#ede8dc` (dark-theme `--ink`), bold, set in
  `ui-monospace, Consolas, Menlo, monospace` — SVG favicons cannot load
  webfonts, so the system mono stack stands in for Geist Mono.
- **Dot:** terracotta `#d9663d` (dark-theme `--accent`) circle following the
  "e", echoing the wordmark's accent dot. Sized and positioned to stay
  visible at 16×16 (radius ≥ 5 SVG units).
- **Theming:** one static icon for both browser themes; the charcoal tile
  reads on light and dark chrome. No media queries inside the SVG.
- **Composition guardrail:** the "e" + dot pair is horizontally centered as a
  unit and fills roughly 60–70% of the tile height; exact x/y/font-size tuned
  visually at implementation time.

## Verification

- `cd frontend && npm run build` succeeds.
- Load the dev site in a browser and confirm the tab shows the new icon
  legibly (hard-refresh to bust favicon cache).

## Out of scope

- PNG/ICO fallbacks, apple-touch-icon, manifest icons — the site currently
  ships SVG-only and all modern browsers render it; nothing else exists today
  to keep in sync.
- Light/dark adaptive variants.
