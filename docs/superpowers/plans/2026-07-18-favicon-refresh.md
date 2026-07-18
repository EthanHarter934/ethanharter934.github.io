# Favicon Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the outdated purple-bolt favicon with an "e." monogram matching the current terracotta-on-charcoal design.

**Architecture:** Overwrite `frontend/public/favicon.svg` in place with a hand-authored 64×64 SVG (charcoal rounded tile, cream mono "e", terracotta dot). `index.html` already links `/favicon.svg`, so no other file changes.

**Tech Stack:** Static SVG, Vite build for verification.

**Spec:** `docs/superpowers/specs/2026-07-18-favicon-refresh-design.md`

## Global Constraints

- Colors exactly: tile `#0c0e10`, glyph `#ede8dc`, dot `#d9663d`
- Font stack exactly: `ui-monospace, Consolas, Menlo, monospace` (no webfonts in SVG favicons)
- 64×64 viewBox, corner radius 14, dot radius ≥ 5
- One static icon, no media queries in the SVG
- Only `frontend/public/favicon.svg` changes
- Work on branch `feature/favicon-refresh` off `main`

---

### Task 1: Replace favicon.svg

**Files:**
- Modify: `frontend/public/favicon.svg` (full replacement)

**Interfaces:**
- Consumes: nothing
- Produces: nothing consumed by code — `frontend/index.html` line `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` picks it up unchanged

- [ ] **Step 1: Create branch**

```bash
git checkout main && git checkout -b feature/favicon-refresh
```

- [ ] **Step 2: Replace the file contents**

Overwrite `frontend/public/favicon.svg` with exactly:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0c0e10"/>
  <text x="25" y="34" text-anchor="middle" dominant-baseline="central" font-family="ui-monospace, Consolas, Menlo, monospace" font-size="46" font-weight="700" fill="#ede8dc">e</text>
  <circle cx="45" cy="45" r="6.5" fill="#d9663d"/>
</svg>
```

- [ ] **Step 3: Visual check at tab sizes**

Render the SVG at 16px and 64px (browser page or an HTML harness in the scratchpad directory, e.g. two `<img src="favicon.svg">` tags at those sizes) and confirm: the "e" is legible at 16px, the dot is visible and clearly terracotta, and the pair reads as one centered unit filling ~60–70% of tile height. If composition is off, tune only `x`/`y`/`font-size`/`cx`/`cy` values — colors, radius, and structure stay as specified.

- [ ] **Step 4: Build verification**

```bash
cd frontend && npm run build
```

Expected: build succeeds; `dist/favicon.svg` exists and matches the new file.

- [ ] **Step 5: Commit**

```bash
git add frontend/public/favicon.svg
git commit -m "feat: e. monogram favicon matching the terracotta-on-charcoal design"
```
