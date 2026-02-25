---
title: "feat: A47 Brand Design System Reskin"
type: feat
status: completed
date: 2026-02-25
deepened: 2026-02-25
origin: docs/brainstorms/2026-02-25-a47-brand-reskin-brainstorm.md
---

# A47 Brand Design System Reskin

## Enhancement Summary

**Deepened on:** 2026-02-25
**Sections enhanced:** 8 phases + cross-cutting concerns
**Research agents used:** TypeScript reviewer, Performance oracle, Security sentinel, Architecture strategist, Pattern recognition specialist, Code simplicity reviewer, Frontend races reviewer, Best practices researcher (fonts), Best practices researcher (CSS tokens)

### Key Improvements

1. **Critical bug prevention:** The proposed `:root` is missing `--green`, `--red`, `--yellow`, `--orange` legacy CSS variables that have 183+ references across the codebase. These MUST be aliased to A47 colors or the entire UI breaks.
2. **Font loading strategy upgraded:** Use Fontsource (npm packages) + Fontaine (Vite plugin) for automatic font metric overrides that eliminate CLS. Use `font-display: swap` with `size-adjust` fallback descriptors instead of raw `font-display: swap` alone.
3. **Phase consolidation:** 8 phases reduced to 3 tracks — Foundation (tokens + fonts + CSS vars), Visual (colors + radii + typography), Assets + Testing. Phases 6 and 7 can run in parallel with the CSS track.
4. **Simplified token architecture:** `design-tokens.ts` serves purely as a TypeScript constant file for DeckGL/Canvas colors. CSS variables remain the primary token system — no runtime injection or generation needed.
5. **Security action item:** Rotate the Figma API key (exposed in `.mcp.json` during development). Tighten CSP `font-src` to `'self'` after self-hosting fonts.

### New Considerations Discovered

- **183 legacy CSS variable references** (`--green`, `--red`, `--yellow`) that would silently break if not aliased in the new `:root`
- **`--orange` is undefined** in the current codebase (pre-existing bug) — used in 14 places, resolves to `initial`
- **`.news-card` and `.intel-item` selectors don't exist** in current CSS — the plan's accent bar replacement targets wrong selectors
- **RTL/CJK locales need `--font-headline` override** in addition to `--font-body`
- **40+ `border-left` instances** (not 5 as initially estimated) need review — but most are on inner items inside panels, not panels themselves, so they work fine with 45px outer radius
- **`#7620ff` purple FAILS WCAG AA** at 2.8:1 — must use `#8f49ff` for all text/interactive elements
- **`switchBasemap()` and light theme listeners** should be fully removed, not left dormant

---

## Overview

Complete visual reskin of World Monitor to adopt the **A47 News AI** brand identity. All three variants (full, tech, finance) receive the new skin uniformly. Every existing feature is retained — only the visual presentation changes.

**From:** Terminal/military intelligence aesthetic (SF Mono, `#0a0a0a` black, `0px` radii, green-tinted map)
**To:** Editorial/news-tech aesthetic (Saira SemiCondensed + Montserrat, `#0a0a1f` deep navy, `45px` radii, navy map, red/teal/purple accents)

**Strategy:** New design token file (`src/config/design-tokens.ts`) as single source of truth + full CSS rewrite (see brainstorm: `docs/brainstorms/2026-02-25-a47-brand-reskin-brainstorm.md`).

## Problem Statement / Motivation

The app currently uses a generic "Palantir-style" military terminal aesthetic that does not align with the A47 News AI brand identity. The A47 brand book defines a polished editorial design language with specific colors, typography, and visual patterns that need to be applied across the entire application to establish brand consistency.

The current design system also has significant technical debt: no formal token system, ~15,000 lines of monolithic CSS with hardcoded values, inconsistent spacing/radii, and colors baked into TypeScript for WebGL layers. This reskin is an opportunity to establish a clean, tokenized foundation.

## Proposed Solution

### Architecture: Design Token Pipeline

```
src/config/design-tokens.ts    (Single Source of Truth)
        │
        ├──> CSS :root variables  (consumed by main.css, panels.css, etc.)
        ├──> TypeScript constants  (consumed by DeckGLMap.ts, Map.ts, etc.)
        └──> Runtime reader         (getCSSColor() for canvas/WebGL)
```

The token file exports both CSS variable names and raw values, ensuring TypeScript components and CSS stay in sync from one definition.

### Research Insights: Token Architecture

**Simplified approach (from simplicity + architecture reviewers):**

The original plan proposed `design-tokens.ts` as a "single source of truth" that generates CSS variables at runtime. This adds unnecessary indirection. Instead:

- **CSS `:root` variables remain the primary token system** — they already work, every CSS file consumes them, and `getCSSColor()` already reads them at runtime.
- **`design-tokens.ts` is a flat TypeScript constant file** — it exists solely so DeckGL/Canvas layer code can import RGB tuples and hex values directly (these contexts can't read CSS variables). No runtime injection, no generation.
- **No tooling (Style Dictionary, Token CSS) needed** — the codebase has ~30 files consuming tokens, not 300. A flat const object is the right level of abstraction.

**hexToRGBA utility (from architecture + token research):**

Add a single utility to bridge hex tokens to DeckGL's `[R, G, B, A]` tuple format:

```typescript
// src/utils/hex-to-rgba.ts
export function hexToRGBA(hex: string, alpha = 255): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, alpha];
}
```

This eliminates the need to maintain parallel `colors` (hex) and `colorsRGB` (tuple) objects. DeckGL layers call `hexToRGBA(colors.teal, 200)` instead of importing a separate RGB constant.

**4-element RGBA tuples (from TypeScript reviewer):**

The current plan shows 3-element `[R, G, B]` tuples in `colorsRGB`. deck.gl expects 4-element `[R, G, B, A]` tuples. Either:
- Always use `hexToRGBA()` (preferred — eliminates `colorsRGB` entirely), or
- If keeping `colorsRGB`, define as `[number, number, number, number]` with alpha=255

## Technical Approach

### Implementation Phases

---

#### Phase 1: Foundation — Design Tokens + Fonts (Priority: Highest)

Create the token system and load fonts. This phase touches few files but establishes the foundation everything else depends on.

**1.1 Create design token file**

`src/config/design-tokens.ts`

```typescript
// Colors — Primary
export const colors = {
  navy: '#12122e',
  red: '#ff3c51',
  teal: '#47f5c8',
  white: '#f5f6fc',
  // Secondary
  purple: '#7620ff',
  purpleLight: '#8f49ff',
  yellow: '#feed55',
  deepTeal: '#0d5257',
  // Backgrounds
  bgPrimary: '#0a0a1f',
  bgDeep: '#040416',
  surface: '#12122e',
  surfaceHover: '#1c1c47',
  // Borders
  borderDefault: '#393b54',
  borderStrong: '#3a3d4e',
  // Text hierarchy (derived from #f5f6fc at decreasing opacity)
  text: '#f5f6fc',
  textSecondary: '#c8c9d4',    // ~83%
  textDim: '#8a8b99',          // ~55%
  textMuted: '#6b6c7a',        // ~43%
  textFaint: '#585966',        // ~35%
  textGhost: '#464752',        // ~28%
  // Map
  mapBg: '#0a0a1f',
  mapGrid: '#1c1c47',
  mapCountry: '#12122e',
  mapStroke: '#393b54',
  // Semantic (hybrid — A47 where natural, preserved where not)
  semanticCritical: '#ff3c51',
  semanticHigh: '#ff8800',       // preserved orange
  semanticElevated: '#ffaa00',   // preserved yellow
  semanticNormal: '#47f5c8',     // A47 Teal
  semanticLow: '#7620ff',        // A47 Purple
  semanticInfo: '#8f49ff',       // A47 Purple Light (AA-compliant)
  // Threat levels
  threatCritical: '#ff3c51',
  threatHigh: '#f97316',         // preserved
  threatMedium: '#eab308',       // preserved
  threatLow: '#47f5c8',          // A47 Teal
  // Status
  statusLive: '#47f5c8',
  statusCached: '#feed55',
  statusUnavailable: '#ff3c51',
  // DEFCON (preserved — domain-standard)
  defcon1: '#ff0040',
  defcon2: '#ff4400',
  defcon3: '#ffaa00',
  defcon4: '#00aaff',
  defcon5: '#2d8a6e',
  // Legacy aliases (deprecated, map to new)
  red_legacy: '#ff3c51',
  green_legacy: '#47f5c8',
  yellow_legacy: '#feed55',
} as const;

// NOTE: No colorsRGB needed — use hexToRGBA(colors.teal, 200) in DeckGL layers
// See src/utils/hex-to-rgba.ts
```

**1.2 Self-host Google Fonts via Fontsource**

### Research Insights: Font Loading Strategy

**Use Fontsource npm packages (from font best practices research):**

Instead of manually downloading and subsetting WOFF2 files, use Fontsource — pre-built npm packages with optimal subsetting, tree-shaking by weight, and automatic `@font-face` generation:

```bash
npm install @fontsource/saira-semi-condensed @fontsource/montserrat
```

Import only needed weights in the app entry point:
```typescript
// src/main.ts (or wherever fonts are imported)
import '@fontsource/saira-semi-condensed/600.css';  // SemiBold (H5, H6)
import '@fontsource/saira-semi-condensed/700.css';  // Bold (H1-H4)
import '@fontsource/montserrat/400.css';             // Regular (body)
import '@fontsource/montserrat/500.css';             // Medium (B3)
import '@fontsource/montserrat/600.css';             // SemiBold (sub-heads)
import '@fontsource/montserrat/700.css';             // Bold (B1, B2, labels)
```

Fontsource files get processed through Vite's asset pipeline (content-hashed, bundled into `dist/assets/`) — no manual `public/fonts/` management needed.

**Reduce weight count to minimum (from performance oracle):**

Audit actual usage and eliminate any weight not actively needed. Each weight adds ~20-40KB. Target 4-5 files max:
- Saira SemiCondensed: 600 + 700 (2 files)
- Montserrat: 400 + 500 + 700 (3 files, drop 600 if SemiBold not actively used)

**Use Fontaine Vite plugin for CLS prevention (from font + races research):**

Fontaine automatically generates fallback `@font-face` descriptors with `size-adjust`, `ascent-override`, `descent-override` that match the metrics of the web fonts. This eliminates CLS from the monospace → proportional font swap:

```bash
npm install -D fontaine
```

```typescript
// vite.config.ts
import { fontaine } from 'fontaine';

export default defineConfig({
  plugins: [
    fontaine({
      fallbacks: ['system-ui', 'Arial'],
      resolvePath: (id) => new URL(`./node_modules/@fontsource/${id}/files`, import.meta.url),
    }),
    // ... other plugins
  ],
});
```

**font-display strategy (from performance + races research):**

- Use `font-display: swap` (Fontsource default) — text is immediately visible with fallback, then swaps to web font. Combined with Fontaine metric overrides, the swap is visually imperceptible.
- Do NOT use `font-display: optional` — it risks the web font never loading on slow connections, leaving the fallback permanently.
- Preload the two most critical font files (Montserrat 400, Saira SemiCondensed 700) in `index.html`:

```html
<link rel="preload" href="/assets/montserrat-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/saira-semi-condensed-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
```

Note: Exact preload paths will be content-hashed by Vite — use the Vite `transformIndexHtml` hook or manual update after first build.

**Remove Google Fonts Workbox rules (from font research):**

Delete the runtime Google Fonts caching rules in `vite.config.ts` (lines 585-599) — no longer needed when self-hosting.

**Tighten CSP font-src (from security sentinel):**

After self-hosting, update CSP in `index.html` and Tauri configs:
```
font-src 'self';
```
Remove `fonts.gstatic.com` and any other external font domains.

**1.3 Update `index.html`**
- Remove the FOUC `<script>` that checks for light theme (line 95). Replace with a cleanup script that deletes `worldmonitor-theme` from localStorage if it equals `'light'`.
- Update skeleton inline `<style>` (lines 98-131): replace all hardcoded colors with A47 palette, update font-family to Montserrat with system-ui fallback.
- Remove `[data-theme="light"]` skeleton CSS (lines 121-131).
- Update `<meta name="theme-color" content="#0a0a1f">`.
- Update `<title>`, OG meta tags, and JSON-LD structured data if rebranding the name.

**Phase 1 deliverables:**
- [ ] `src/config/design-tokens.ts` created with hex color constants
- [ ] `src/utils/hex-to-rgba.ts` created with `hexToRGBA()` utility
- [ ] `@fontsource/saira-semi-condensed` and `@fontsource/montserrat` installed via npm
- [ ] Fontsource CSS imports added to app entry point (5 weights total)
- [ ] `fontaine` Vite plugin installed and configured for CLS-free font swap
- [ ] Preload hints added for 2 critical font weights in `index.html`
- [ ] Google Fonts Workbox cache rules removed from `vite.config.ts`
- [ ] CSP `font-src` tightened to `'self'`
- [ ] `index.html` skeleton, FOUC script, and meta tags updated
- [ ] App loads with new fonts and correct skeleton colors

---

#### Phase 2: CSS Variables + Theme Cleanup (Priority: High)

Rewrite all CSS variable definitions and remove the light theme.

**2.1 Rewrite `:root` variables**

`src/styles/main.css` lines 8-106 — Replace both `:root` blocks with A47 tokens:

```css
:root {
  /* Backgrounds */
  --bg: #0a0a1f;
  --bg-secondary: #040416;
  --surface: #12122e;
  --surface-hover: #1c1c47;
  --surface-active: #1c1c47;
  /* Borders */
  --border: #393b54;
  --border-strong: #3a3d4e;
  --border-subtle: #1c1c47;
  /* Text hierarchy */
  --text: #f5f6fc;
  --text-secondary: #c8c9d4;
  --text-dim: #8a8b99;
  --text-muted: #6b6c7a;
  --text-faint: #585966;
  --text-ghost: #464752;
  --accent: #ff3c51;
  /* Overlays (adjusted for navy) */
  --overlay-subtle: rgba(245,246,252,0.03);
  --overlay-light: rgba(245,246,252,0.05);
  --overlay-medium: rgba(245,246,252,0.1);
  --overlay-heavy: rgba(245,246,252,0.2);
  /* Misc */
  --shadow-color: rgba(4,4,22,0.5);
  --scrollbar-thumb: #393b54;
  --input-bg: #1c1c47;
  --panel-bg: #12122e;
  --panel-border: #393b54;
  /* Map */
  --map-bg: #0a0a1f;
  --map-grid: #1c1c47;
  --map-country: #12122e;
  --map-stroke: #393b54;
  /* Fonts */
  --font-headline: 'Saira SemiCondensed', sans-serif;
  --font-body: 'Montserrat', sans-serif;
  --font-mono: 'SF Mono','Monaco','Cascadia Code','Fira Code',monospace;
  /* Semantic — see design-tokens.ts for full mapping */
  --semantic-critical: #ff3c51;
  --semantic-high: #ff8800;
  --semantic-elevated: #ffaa00;
  --semantic-normal: #47f5c8;
  --semantic-low: #7620ff;
  --semantic-info: #8f49ff;
  /* ... threat, defcon, status vars ... */

  /* CRITICAL: Legacy color aliases (from pattern recognition review) */
  /* These 4 variables have 183+ references across the codebase.       */
  /* Removing them without aliases would silently break the entire UI.  */
  --green: #47f5c8;   /* was #4ade80 — mapped to A47 Teal */
  --red: #ff3c51;     /* was #ef4444 — mapped to A47 Red */
  --yellow: #feed55;  /* was #eab308 — mapped to A47 Yellow */
  --orange: #ff8800;  /* was UNDEFINED (pre-existing bug, 14 refs) — now defined */
}
```

### Research Insight: Legacy Variable Aliases Are Critical

**From pattern recognition specialist:** The proposed `:root` block was missing `--green`, `--red`, `--yellow`, and `--orange` — variables that are referenced 183+ times across the CSS. Without these aliases, every severity indicator, status badge, border-left accent, and conditional color in the app would render as `initial` (transparent/default).

**Action:** Always include these legacy aliases in `:root`. During implementation, optionally grep for each and migrate to the more explicit `--semantic-*` names, but the aliases MUST exist as a safety net.

**`--orange` was never defined** (pre-existing bug) — 14 CSS rules reference `var(--orange)` and currently get `initial`. Define it now as `#ff8800` so these 14 rules finally work correctly.

**2.2 Delete `[data-theme="light"]` block**

Remove lines 112-187 of `main.css` (the entire light theme override block).

**2.3 Update locale font overrides**

Keep RTL and CJK overrides but update the fallback chain:
```css
[dir="rtl"] {
  --font-body: 'Geeza Pro','SF Arabic','Tahoma',system-ui,sans-serif;
  --font-headline: 'Geeza Pro','SF Arabic','Tahoma',system-ui,sans-serif;
}
:lang(zh-CN),:lang(zh) {
  --font-body: 'PingFang SC','Microsoft YaHei','Noto Sans SC',system-ui,sans-serif;
  --font-headline: 'PingFang SC','Microsoft YaHei','Noto Sans SC',system-ui,sans-serif;
}
```

**Research Insight (from pattern recognition):** The original plan only overrode `--font-body` for RTL/CJK. Since we're adding `--font-headline` (Saira SemiCondensed), RTL/CJK locales also need `--font-headline` overridden — Saira SemiCondensed has no Arabic or CJK glyphs.

**2.4 Update `settings-window.css`**

Replace hardcoded colors in `.settings-shell` with CSS variable references:
```css
.settings-shell {
  --settings-bg: var(--bg-secondary);
  --settings-surface: var(--surface-hover);
  --settings-text: var(--text);
  --settings-text-secondary: var(--text-dim);
  --settings-accent: var(--semantic-info);
  --settings-green: var(--teal, #47f5c8);
  --settings-yellow: var(--yellow, #feed55);
  --settings-red: var(--semantic-critical);
  --settings-blue: var(--semantic-info);
}
```

Replace the settings font-family override (line 20) with `var(--font-body)`.

**2.5 Simplify `theme-manager.ts`**

- Remove `Theme` type union — always `'dark'`
- Remove `getStoredTheme()` and `applyStoredTheme()`
- Remove `setTheme()` toggle logic — or reduce to a no-op
- Update hardcoded `meta theme-color` values to `#0a0a1f`
- **Remove** `theme-changed` event dispatch and all listeners entirely (from TypeScript + races reviewers) — leaving dormant event listeners is dead code that confuses future maintainers. Clean removal is safer than leaving no-ops.
- **Remove `switchBasemap()`** in DeckGLMap.ts (from TypeScript reviewer) — with only one theme, there's only one basemap style. Remove LIGHT_STYLE constant and the switchBasemap method entirely.

**TypeScript cascade warning (from TypeScript reviewer):** Removing Theme type, getStoredTheme, applyStoredTheme, and setTheme will trigger `noUnusedLocals` / `noUnusedParameters` errors in any file that imported them. Search for all import sites and clean them up in the same commit to avoid breaking `npm run typecheck`.

**2.6 Simplify `theme-colors.ts`**

- Remove per-theme cache invalidation logic
- Cache values permanently (theme never changes)

**2.7 Remove theme toggle from settings UI**

Remove the theme toggle button from the settings panel in `App.ts` and its CSS (lines 567-585 of `main.css`).

**Phase 2 deliverables:**
- [ ] `:root` CSS variables fully rewritten to A47 palette
- [ ] Legacy aliases (`--green`, `--red`, `--yellow`, `--orange`) defined in `:root`
- [ ] `[data-theme="light"]` CSS block deleted
- [ ] `settings-window.css` hardcoded colors replaced with variables
- [ ] `theme-manager.ts` simplified to dark-only
- [ ] `theme-colors.ts` cache simplified
- [ ] Theme toggle button removed from UI
- [ ] Locale font overrides preserved and updated (both `--font-body` and `--font-headline`)
- [ ] All `theme-changed` event listeners removed from DeckGLMap, MapPopup, etc.
- [ ] `switchBasemap()` and `LIGHT_STYLE` removed from DeckGLMap.ts
- [ ] All imports of removed theme-manager exports cleaned up (`npm run typecheck` passes)

### Research Insight: Atomic Deployment

**From frontend races reviewer:** The FOUC cleanup script (Phase 1), theme-manager simplification (Phase 2), and `:root` variable rewrite (Phase 2) must all deploy together in a single commit/deploy. If the FOUC script is removed but the old `:root` still has light theme, returning users with `data-theme="light"` in localStorage would get incorrect CSS. Ship these changes atomically.

---

#### Phase 3: Typography + Letter Spacing (Priority: High)

Replace all font references and normalize letter-spacing.

**3.1 Global font-family replacement**

Search and replace across `main.css`:
- `font-family: var(--font-mono)` → `font-family: var(--font-body)` (for body text)
- `font-family: var(--font-body)` is already correct for body after Phase 2
- Add `font-family: var(--font-headline)` for panel titles, section headings, modal titles, and any element that should use Saira SemiCondensed

**3.2 Apply type scale**

Map the A47 type scale to existing CSS classes. Approximate mapping:

| Current usage | Current size | New token | New size | Font |
|--------------|-------------|-----------|----------|------|
| Panel titles | 11px | B5 | 12px/16 | Montserrat Regular |
| Body text | 12px | B5 | 12px/16 | Montserrat Regular |
| Section headings | 14px | B4 | 14px/20 | Montserrat Regular |
| Stat values | 16px | B3 | 16px/22 | Montserrat Medium |
| Modal headings | 22px | H6 | 24px/28 | Saira SemiCondensed SemiBold |
| Hero numbers | 28px | H4 | 30px/34 | Saira SemiCondensed Bold |

**3.3 Normalize letter-spacing**

Remove all `letter-spacing` declarations (101 instances in `main.css`). The A47 brand specifies `letter-spacing: 0` for all type hierarchy levels.

**3.4 Preserve `font-variant-numeric: tabular-nums`**

Verify Montserrat supports `tabular-nums` (it does). Keep all existing `font-variant-numeric` declarations.

**3.5 Preserve monospace for code/technical content**

Keep `--font-mono` variable for any code display or raw data contexts (e.g., JSON viewers, debug panels). Only use it explicitly, not as a default.

**Phase 3 deliverables:**
- [ ] All font-family references updated
- [ ] Headlines use Saira SemiCondensed, body uses Montserrat
- [ ] Type scale applied per brand spec
- [ ] All `letter-spacing` declarations removed (101 instances)
- [ ] `tabular-nums` verified working with Montserrat
- [ ] Monospace preserved for code/technical contexts only

---

#### Phase 4: Border Radius + Panel Grid Layout (Priority: High)

This is the highest-risk visual change. Apply brand radii and adjust the grid to accommodate.

**4.1 Panel border-radius**

Update `.panel` in `main.css` (line 807-818):
```css
.panel {
  border-radius: 45px;
  overflow: hidden;
}
```

**4.2 Increase `.panel-content` padding**

To prevent content clipping in rounded corners, increase horizontal padding:
```css
.panel-content {
  padding: 16px;  /* was ~8px */
}
```

Increase `.panel-header` padding:
```css
.panel-header {
  padding: 12px 20px;  /* was 6px 10px */
}
```

**4.3 Grid gap increase**

```css
.panels-grid {
  gap: 12px;      /* was 4px */
  padding: 12px;  /* was 4px */
}
```

**4.4 Review border-left accent bars**

### Research Insight: Accent Bars Don't Need Replacement

**From simplicity reviewer + pattern recognition:** The original plan proposed replacing `border-left` with `::before` pseudo-elements on `.news-card`, `.signal-item`, `.intel-item`. However:

1. **`.news-card` and `.intel-item` selectors don't exist** in the current CSS (pattern recognition found 0 matches). The actual selectors are different — audit the real class names before making changes.
2. **Most `border-left` instances (40+) are on inner items inside panels**, not on the panels themselves. A panel has 45px outer radius, but its scrollable inner content items are rectangular. The `border-left` on these inner items is **not visually affected** by the panel's outer border-radius.
3. **`::before` pseudo-elements add unnecessary complexity** (simplicity reviewer) — `border-left` is simpler, more maintainable, and already works.

**Revised approach:**
- Keep `border-left` on inner content items (no change needed)
- Only convert to `::before` if an element IS the direct rounded container AND visually clips the border-left (unlikely for inner scroll items)
- Audit all 40+ `border-left` instances during implementation to confirm which (if any) actually clip

**4.5 Update resize handle**

The `.panel-resize-handle` (line 844-878) needs padding from corners:
```css
.panel-resize-handle {
  border-radius: 0 0 45px 45px;
  padding: 0 45px;  /* keep handle away from rounded corners */
}
```

**4.6 Apply radius scale to other elements**

| Element | New radius |
|---------|-----------|
| `.panel` | 45px |
| `.story-modal`, `.signal-modal` | 45px |
| `.mapboxgl-popup-content` | 12px |
| Buttons, inputs, dropdowns | 12px |
| `.panel-count`, status badges | 8px |
| `.variant-label`, category tags | 47px (pill) |
| Scrollbar thumbs | 4px (keep) |
| Circular dots/avatars | 50% |

**4.7 Verify breakpoints**

Test at 768px, 1200px, 1440px, 2000px+ to confirm column counts don't regress. The 12px gap on 1440px: 4 * 280px + 3 * 12px = 1156px — fits fine.

**Phase 4 deliverables:**
- [ ] All panels have 45px border-radius
- [ ] Panel content padding increased to prevent corner clipping
- [ ] Grid gap increased to 12px
- [ ] All 40+ border-left accent bars audited — confirm inner items don't clip
- [ ] Resize handles adapted for rounded corners
- [ ] All other elements use appropriate radius from scale
- [ ] Tables inside panels verified (bottom rows not clipped)
- [ ] Breakpoints tested — no column count regressions
- [ ] GPU compositing profiled for 45px radius panels at 2000px+ (from performance oracle — `border-radius` on `contain: content` elements triggers compositing layers; profile on low-end hardware)

---

#### Phase 5: Hardcoded Colors in CSS (Priority: Medium)

Find and replace all hardcoded hex/rgba values in CSS files that are not using CSS variables.

**5.1 Audit `main.css` hardcoded colors**

~40-50 instances of hardcoded `rgba()` or hex values. Key replacements:

| Location | Old value | New value |
|----------|----------|-----------|
| Line 336 `.variant-option.active` | `rgba(68, 255, 136, 0.1)` | `rgba(71, 245, 200, 0.1)` (teal) |
| Line 348 tech variant active | `rgba(74, 158, 255, 0.1)` | `rgba(118, 32, 255, 0.1)` (purple) |
| Line 392, 424 badge text | `#0a0a0a` | `#0a0a1f` |
| Line 425 beta badge bg | `#f59e0b` | `#feed55` |
| Line 851-862 resize gradients | green-tinted | teal-tinted |
| Line 896 dragging shadow | green glow | teal glow |
| Line 913 error bg | red rgba | `rgba(255, 60, 81, 0.15)` |
| Line 1915 webcam bg | `#000` | `#0a0a1f` |
| Line 5282 popup border | `var(--red)` | `var(--accent)` |
| Line 5731 grid lines | green rgba | teal rgba |

**5.2 Update `panels.css`**

19 `color-mix()` instances — update variable references (variables will carry new values from Phase 2, percentages stay the same).

**5.3 Update `lang-switcher.css` and `rtl-overrides.css`**

Replace any hardcoded colors with CSS variable references.

**5.4 Update `public/offline.html`**

Replace 5 hardcoded colors (`#0a0f0a`, `#e0e0e0`, `#1a3a1a`, `#4ade80`, `#2a5a2a`) with A47 palette values.

**Phase 5 deliverables:**
- [ ] All ~50 hardcoded CSS color values replaced
- [ ] `panels.css` color-mix references verified
- [ ] `offline.html` updated
- [ ] No hardcoded hex values remain that reference old palette

### Research Insight: Consider CSS File Split (Optional)

**From architecture strategist:** The `main.css` file is ~15,000 lines. This reskin touches hundreds of lines throughout. Consider splitting it during the reskin into logical modules:
- `src/styles/variables.css` — `:root` tokens
- `src/styles/typography.css` — font-face, type scale
- `src/styles/panels.css` — panel grid, cards (already exists)
- `src/styles/map.css` — map-specific styles
- `src/styles/main.css` — everything else

**Verdict:** This is a nice-to-have, not a requirement. The primary goal is the reskin. If the file split adds risk or time, skip it and keep the monolithic `main.css` — it works. The split can be done in a follow-up PR.

---

#### Phase 6: TypeScript Component Colors (Priority: Medium)

Update all hardcoded colors in TypeScript files.

### Research Insight: Phase 6 Can Parallelize with CSS Track

**From architecture strategist:** Phases 6 (TypeScript colors) and 7 (assets) are independent of the CSS changes in Phases 2-5. Once Phase 1 (tokens + fonts foundation) is done, the CSS track and TypeScript track can proceed in parallel — either by different developers or in separate branches merged together.

**6.1 DeckGLMap.ts — `getOverlayColors()` (lines 159-215)**

Remove the `isLight` branching (light theme is gone). Remap colors:

| Category | Old RGBA | New RGBA | Notes |
|----------|---------|---------|-------|
| `hotspotHigh` | `[255, 68, 68, 200]` | `[255, 60, 81, 200]` | A47 Red |
| `base` | `[0, 150, 255, 200]` | `[118, 32, 255, 200]` | A47 Purple |
| `nuclear` | `[255, 215, 0, 200]` | `[254, 237, 85, 200]` | A47 Yellow |
| `cable` | `[0, 200, 255, 150]` | `[71, 245, 200, 150]` | A47 Teal |
| `startupHub` | `[0, 255, 150, 200]` | `[71, 245, 200, 200]` | A47 Teal |
| `datacenter` | `[0, 255, 200, 180]` | `[71, 245, 200, 180]` | A47 Teal |

**Important exceptions — preserve as-is:**
- Military affiliation colors (US-NATO blue, Russia red, China orange, etc.) — these encode geopolitical meaning
- DEFCON indicator colors — domain-standard
- Weather severity — functional, not brand

**6.2 DeckGLMap.ts — Inline layer colors (lines 1200-2200)**

~70+ additional `[R,G,B,A]` tuples in layer builders. Apply the same mapping principle: remap generic colors to A47 palette, preserve semantically meaningful colors.

**Using hexToRGBA (from token research + architecture strategist):**

Instead of manually maintaining 70+ inline RGBA tuples, import from tokens:

```typescript
import { colors } from '@/config/design-tokens';
import { hexToRGBA } from '@/utils/hex-to-rgba';

// Before: [0, 200, 255, 150]
// After:
getColor: () => hexToRGBA(colors.teal, 150),
```

This makes future brand updates trivial — change the hex in `design-tokens.ts`, all layers update automatically.

**6.3 DeckGLMap.ts — Basemap style**

Remove `LIGHT_STYLE` constant. Keep `DARK_STYLE` (CARTO dark-matter). Consider whether a navy-tinted style exists, but CARTO dark-matter already works well with the navy palette.

**6.4 Map.ts — D3/SVG mobile fallback**

Update 5 hardcoded hex values (lines 579-583) and 3 severity rgba values (lines 1148-1150).

**6.5 Other component files**

Update hardcoded colors in:
- `SignalModal.ts`
- `PizzIntIndicator.ts` (DEFCON — preserve)
- `MacroSignalsPanel.ts`
- `InvestmentsPanel.ts`
- `CountryTimeline.ts`
- `MapPopup.ts`
- `CountryBriefPage.ts` — update export font-family to Montserrat with system-ui fallback

**6.6 Config files**

- `src/config/pipelines.ts` — remap `PIPELINE_COLORS` to A47-adjacent colors

**Phase 6 deliverables:**
- [ ] `getOverlayColors()` rewritten — no light/dark branching, A47 colors
- [ ] ~70 inline RGBA tuples remapped in DeckGL layer builders
- [ ] LIGHT_STYLE removed
- [ ] Map.ts D3/SVG colors updated
- [ ] All component hardcoded colors updated
- [ ] Pipeline colors remapped
- [ ] Military affiliation and DEFCON colors preserved

---

#### Phase 7: Assets + Branding (Priority: Medium)

Replace all visual branding assets.

**7.1 Extract logo from Figma**

Use the Figma MCP to extract SVG logo assets from the brand book:
- A47 logo mark (icon)
- A47 horizontal lockup
- A47 vertical lockup

**7.2 Generate favicon + PWA icons**

From the logo, generate:
- `public/favico/favicon-16x16.png`
- `public/favico/favicon-32x32.png`
- `public/favico/apple-touch-icon.png`
- `public/favico/android-chrome-192x192.png`
- `public/favico/android-chrome-512x512.png`
- `public/favico/worldmonitor-icon-1024.png` → rename to `a47-icon-1024.png`
- `public/favicon.ico`

**7.3 Update PWA manifest**

`vite.config.ts` lines 500-515:
```typescript
theme_color: '#0a0a1f',
background_color: '#0a0a1f',
```

Update `VARIANT_META` (lines 40-125) if rebranding variant names.

**7.4 Update Tauri configs**

All three config files:
```json
"backgroundColor": [10, 10, 31, 255]
```

Update CSP to allow self-hosted font files (already covered if self-hosting from `/fonts/`).

Update Tauri desktop icons in `src-tauri/icons/` — all 16 files.

**7.5 Update OG image generation**

`api/og-story.js` — replace all ~30 hardcoded colors with A47 palette:
- Background gradient: `#0a0a1f` to `#040416`
- Brand text: update from "WORLDMONITOR" if rebranding
- Severity colors: use A47 semantic mapping
- Font: specify Montserrat/Saira for server-side SVG

`api/story.js` — update "World Monitor" brand references in meta tags.

**Security insight (from security sentinel):** The OG image generator uses a `LEVEL_COLORS` whitelist to constrain user-controlled color input into the SVG. **Preserve this whitelist pattern** — it prevents SVG injection via malicious color strings. Update the whitelist values to A47 colors but keep the validation logic intact.

**7.6 Update loading screen**

The skeleton shell in `index.html` (already handled in Phase 1). Add A47 logo SVG inline for the loading state.

**Phase 7 deliverables:**
- [ ] Logo assets extracted from Figma
- [ ] Favicons generated in all sizes
- [ ] PWA manifest colors updated
- [ ] All 3 Tauri configs updated (bg color, icons, CSP)
- [ ] Tauri icons replaced (16 files)
- [ ] OG image generation rebranded
- [ ] Loading screen shows A47 logo

---

#### Phase 8: Testing + Polish (Priority: High)

**8.1 Accessibility audit**

Run WCAG AA contrast checks on all color combinations:

| Combination | Ratio | Status |
|-------------|-------|--------|
| `#f5f6fc` on `#12122e` | ~14.4:1 | PASS |
| `#f5f6fc` on `#0a0a1f` | ~16.7:1 | PASS |
| `#ff3c51` on `#12122e` | ~4.4:1 | MARGINAL — use for large text/icons only |
| `#47f5c8` on `#12122e` | ~9.8:1 | PASS |
| `#7620ff` on `#12122e` | ~2.8:1 | FAIL — use `#8f49ff` instead |
| `#8f49ff` on `#12122e` | ~4.1:1 | PASS for large text (3:1) |
| `#feed55` on `#12122e` | ~12.3:1 | PASS |
| `#c8c9d4` on `#12122e` | ~9.5:1 | PASS |
| `#8a8b99` on `#12122e` | ~5.3:1 | PASS |
| `#6b6c7a` on `#12122e` | ~3.5:1 | PASS for large text only |

**Action:** Use `#8f49ff` (purple-light) instead of `#7620ff` for any text-on-surface usage. Reserve `#7620ff` for decorative/icon use only.

**8.2 Visual regression golden screenshots**

Regenerate ALL golden screenshots in a single atomic operation after all changes land:
```bash
npm run test:e2e:visual:update:full
```

**8.3 Cross-browser testing**

Verify Saira SemiCondensed + Montserrat rendering at 10-14px across:
- Chrome (primary)
- Safari (macOS/iOS)
- Firefox

**8.4 Critical visual regression areas** (manual spot-check):

1. Panel grid at 768px, 1200px, 1440px, 2000px+
2. DeckGL map with all 35+ layers active
3. Panel headers with long i18n titles + badges + controls at 45px radius
4. Tables inside panels (fires, climate, displacement, UCDP, market)
5. All modals (story, signal, country intel, channel management)
6. Map popups and tooltips
7. Settings window — all tabs
8. Mobile D3/SVG map
9. RTL layout (Arabic)
10. PWA install flow
11. Skeleton → app transition (font FOUT check)

**8.5 E2E test runs**

```bash
npm run test:e2e           # Full suite
npm run test:data          # Data tests (should be unaffected)
```

**Phase 8 deliverables:**
- [ ] All WCAG AA contrast failures resolved
- [ ] Golden screenshots regenerated
- [ ] Cross-browser font rendering verified
- [ ] 11 critical visual areas manually verified
- [ ] E2E tests passing

---

## Phase Consolidation Insight

**From simplicity reviewer:** The 8 sequential phases can be consolidated into 3 parallel tracks after Phase 1:

```
Phase 1: Foundation (tokens + fonts + index.html)
    ├── Track A: CSS (Phases 2-5 merged: vars, typography, radii, hardcoded colors)
    ├── Track B: TypeScript (Phase 6: DeckGL, Map, components)
    └── Track C: Assets (Phase 7: logo, favicon, PWA, Tauri, OG)
Phase 8: Testing + Polish (after all tracks merge)
```

This reduces the critical path from 8 sequential phases to 3 + 1 parallel tracks. The CSS and TypeScript changes are independent — CSS variables propagate to `getCSSColor()` automatically, and DeckGL colors are standalone constants.

---

## System-Wide Impact

### Interaction Graph

The CSS variable change in `:root` propagates to every DOM element via inheritance. The `theme-changed` event (dispatched by `setTheme()`) is listened to by DeckGLMap, MapPopup, and components using `getCSSColor()`. Removing the light theme means:
1. `setTheme()` no longer fires → `theme-changed` listeners should be **removed entirely** (not left dormant)
2. `getCSSColor()` cache never invalidates → safe to cache permanently
3. The FOUC script no longer sets `data-theme` → no attribute-based CSS matching needed

### Error Propagation

- Font loading failure (network): `font-display: swap` + Fontaine metric overrides ensure text remains visible with near-identical metrics. No CLS, no functional errors.
- Missing CSS variable: falls back to `initial` keyword — could cause invisible text. **Critical mitigation:** Define legacy aliases (`--green`, `--red`, `--yellow`, `--orange`) in addition to new semantic variables.
- DeckGL color array wrong length: will throw at layer creation. Mitigated by `hexToRGBA()` utility which always returns `[number, number, number, number]` — eliminates manual tuple construction errors.
- Removed theme-manager exports: `noUnusedLocals` errors propagate to every importing file. Mitigated by cleaning all import sites atomically.

### State Lifecycle Risks

- `localStorage('worldmonitor-theme')` may contain `'light'` for returning users. **Mitigation:** Phase 1 FOUC script cleanup deletes stale key.
- Service worker caching old CSS: **Mitigation:** Workbox versioned cache busting handles this automatically via content hashes.

### API Surface Parity

- `getCSSColor(varName)` API unchanged — same function signature, same variable names (updated values)
- `theme-manager.ts` exports unchanged (functions still exist but become no-ops for light theme)
- No public API changes

### Integration Test Scenarios

1. Returning user with `worldmonitor-theme: light` in localStorage → app loads with navy dark theme, stale key cleaned up
2. DeckGL map with 10+ layers active → all layer colors render correctly against navy basemap
3. PWA installed offline → fonts load from local cache, no broken layout
4. RTL user (Arabic) → panels, accent bars, and fonts render correctly in RTL
5. Tauri desktop cold start → window background matches navy, no white flash

---

## Acceptance Criteria

### Functional Requirements

- [ ] All existing features work identically (no functional regressions)
- [ ] All 3 variants (full, tech, finance) display the A47 brand
- [ ] Map layers render with correct colors against navy basemap
- [ ] Panel drag-drop, resize, and grid reflow work with 45px radii
- [ ] Settings window renders correctly without theme toggle
- [ ] RTL (Arabic) and CJK (Chinese) layouts work correctly
- [ ] PWA installs with correct A47 icons and colors
- [ ] Tauri desktop launches with A47 branding

### Non-Functional Requirements

- [ ] WCAG AA contrast met for all text-on-surface combinations (4.5:1 normal text, 3:1 large text)
- [ ] `#7620ff` purple never used for text — only `#8f49ff` (purple-light) for text/interactive
- [ ] First Contentful Paint not regressed by more than 200ms from font loading
- [ ] CLS from font swap < 0.01 (verified via Lighthouse — Fontaine metric overrides should achieve this)
- [ ] No visible font FOUT in skeleton → app transition (Fontaine `size-adjust` ensures invisible swap)
- [ ] Total font payload under 300KB (Fontsource Latin subsets, 5 WOFF2 files, ~30-50KB each)
- [ ] No external font domains in network requests (all self-hosted via Fontsource)

### Quality Gates

- [ ] All E2E tests pass
- [ ] Visual regression goldens regenerated
- [ ] Manual spot-check of 11 critical areas
- [ ] `npm run typecheck` passes (verify after each phase — removing theme exports triggers `noUnusedLocals` cascade)
- [ ] `npm run build` succeeds for all 3 variants
- [ ] No remaining references to removed theme-manager exports (`grep` for `getStoredTheme`, `applyStoredTheme`, `LIGHT_STYLE`, `switchBasemap`)
- [ ] No `var(--green)` / `var(--red)` / `var(--yellow)` referencing undefined variables (verify aliases exist)

---

## Security Action Items

**From security sentinel review:**

1. **CRITICAL: Rotate Figma API key** — The key `figd_OI2BfS-...` was exposed in `.mcp.json` during this planning session. While `.mcp.json` is gitignored, rotate the key in Figma settings after logo extraction is complete.
2. **Tighten CSP `font-src`** — After self-hosting fonts via Fontsource, update CSP to `font-src 'self'` in both `index.html` and all three Tauri config files. Remove any `fonts.gstatic.com` or wildcard font domains.
3. **Preserve OG image color whitelist** — `api/og-story.js` uses `LEVEL_COLORS` to whitelist valid color inputs. Keep this validation pattern when updating to A47 colors.
4. **Audit CSP `connect-src`** — Remove any Google Fonts domains from `connect-src` if present.

---

## Dependencies & Prerequisites

- Figma MCP access to extract logo assets (Figma file: `zPiiWP3bHxq50HE7lZEcgy`)
- Fontsource npm packages: `@fontsource/saira-semi-condensed`, `@fontsource/montserrat`
- Fontaine Vite plugin: `fontaine` (dev dependency)
- No external API or service dependencies

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Missing legacy CSS vars breaks 183+ rules | **Certain** | **Critical** | Define `--green`, `--red`, `--yellow`, `--orange` aliases in `:root` |
| 45px radius breaks panel content clipping | High | Medium | Increase inner padding; prototype on single panel first |
| Font CLS (monospace → proportional swap) | High | Medium | Fontaine metric overrides + `font-display: swap` + preload |
| Font width change causes text overflow | Medium | Medium | Test at all sizes 9-14px; Fontaine `size-adjust` minimizes shift |
| DeckGL color mapping mismatches | Medium | High | Use `hexToRGBA()` utility; build explicit mapping table |
| Returning users see broken light theme | High | High | Phase 1 localStorage cleanup + atomic deployment |
| Increased FCP from font loading | Medium | Low | Fontsource (bundled) + preload 2 critical weights |
| `#7620ff` purple fails WCAG AA | Certain | Medium | Use `#8f49ff` for all text; reserve `#7620ff` for decorative only |
| noUnusedLocals cascade from removing theme exports | High | Low | Clean up all import sites in same commit |
| RTL/CJK broken headlines (no Arabic/CJK glyphs in Saira) | High | High | Override `--font-headline` for RTL and CJK locales |
| 45px radius GPU compositing on low-end hardware | Low | Medium | Profile with Chrome DevTools layers panel; reduce if needed |

---

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-02-25-a47-brand-reskin-brainstorm.md](docs/brainstorms/2026-02-25-a47-brand-reskin-brainstorm.md) — Key decisions carried forward: full brand adoption, dark-only theme, 45px radii, hybrid semantic colors, map rebranding, all variants

### Internal References

- CSS variables: `src/styles/main.css:8-187`
- Theme manager: `src/utils/theme-manager.ts`
- Theme colors: `src/utils/theme-colors.ts`
- DeckGL colors: `src/components/DeckGLMap.ts:159-215, 1200-2200`
- D3 map colors: `src/components/Map.ts:579-583, 1148-1150`
- Settings CSS: `src/styles/settings-window.css:1-15`
- Pipeline colors: `src/config/pipelines.ts:1016-1020`
- Panel grid: `src/styles/main.css:792-843`
- OG image: `api/og-story.js`
- PWA manifest: `vite.config.ts:490-516`
- Tauri configs: `src-tauri/tauri.conf.json`, `src-tauri/tauri.tech.conf.json`, `src-tauri/tauri.finance.conf.json`
- Skeleton/FOUC: `index.html:95-131`
- Offline page: `public/offline.html`

### External References

- A47 Brand Book (Figma): `https://www.figma.com/design/zPiiWP3bHxq50HE7lZEcgy/`
- Fontsource — Saira Semi Condensed: `https://fontsource.org/fonts/saira-semi-condensed`
- Fontsource — Montserrat: `https://fontsource.org/fonts/montserrat`
- Fontaine (font metric override Vite plugin): `https://github.com/unjs/fontaine`
- WCAG AA contrast requirements: 4.5:1 normal text, 3:1 large text
- Google Fonts specimen pages (reference only — self-hosting via Fontsource):
  - Saira SemiCondensed: `https://fonts.google.com/specimen/Saira+Semi+Condensed`
  - Montserrat: `https://fonts.google.com/specimen/Montserrat`
