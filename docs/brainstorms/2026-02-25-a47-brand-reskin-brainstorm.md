# A47 Brand Design System Reskin

**Date:** 2026-02-25
**Status:** Brainstorm
**Figma Source:** [BRAND BOOK - A47 NEWS AI](https://www.figma.com/design/zPiiWP3bHxq50HE7lZEcgy/BRAND-BOOK---A47-NEWS-AI--Copy-?node-id=0-1)

---

## What We're Building

A complete visual reskin of World Monitor to adopt the A47 News AI brand identity. All three variants (full, tech, finance) will receive the new skin. Every existing feature and functionality is retained — only the visual presentation changes.

**From:** Terminal/military intelligence aesthetic (monospace fonts, pure black backgrounds, minimal radii)
**To:** Polished editorial/news-tech aesthetic (Saira SemiCondensed + Montserrat, deep navy backgrounds, large rounded cards, red/teal/purple accent system)

---

## Why This Approach

**Strategy: New design token file + CSS rewrite**

The current system uses CSS variables in `:root` but has significant design debt: no formal token system, inconsistent spacing/radii, ~15,000 lines of monolithic CSS with hardcoded values throughout, and colors baked into TypeScript for WebGL layers. A simple variable swap would miss the hardcoded values and not establish the structured foundation needed.

A formal design token file (TypeScript) as a single source of truth that generates CSS variables gives us:
- One place to define all A47 brand values
- Ability to catch all hardcoded color/font references during migration
- A clean foundation for future brand updates
- TypeScript type safety for token usage in components

---

## Key Decisions

### 1. Full Brand Adoption
Replace ALL visual elements — fonts, colors, backgrounds, borders, radii, and map theming. No hybrid or partial approach. The app should feel like a native A47 product.

### 2. Dark Theme Only
Remove the light theme toggle. The app ships exclusively in A47's deep navy dark theme. This simplifies the token system and matches the brand book (which only defines dark).

### 3. Brand-Accurate Border Radii
Use the brand book's large radius values (45px for cards/panels, 47px for pills). Accept the visual breathing room this creates rather than scaling down. **Note:** The current panels grid uses `4px` gaps — this will need to increase (likely to 12-16px) to accommodate 45px radii without corners visually colliding.

### 4. Hybrid Semantic Colors
Remap domain-specific colors to A47's palette where natural mappings exist:
- **Critical/High severity:** `#ff3c51` (A47 Red)
- **Low/Safe/Normal:** `#47f5c8` (A47 Teal)
- **Info:** `#7620ff` (A47 Purple)
- **Medium/Warning:** Keep standard orange/yellow (`#ffaa00` / `#eab308`) — no clean A47 mapping
- **Status live:** `#47f5c8` (Teal)
- **Status cached/warning:** `#feed55` (A47 Yellow)
- **Status unavailable:** `#ff3c51` (A47 Red)

### 5. Map Rebranding
Shift the 3D globe from military dark-green tones to A47's deep navy palette:
- Map background: `#0a0a1f` (matching app bg)
- Map grid: `#1c1c47` (surface-hover tone)
- Country fills: `#12122e` (navy surface)
- Country strokes: `#393b54` (border-default)
- Highlighted/active regions: `#47f5c8` at low opacity

### 6. All Variants
Apply uniformly across full, tech, and finance variants.

---

## A47 Brand Token Reference

### Colors

#### Primary
| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#12122e` | Primary surface, cards, panels |
| `red` | `#ff3c51` | Accent, CTAs, breaking indicators |
| `teal` | `#47f5c8` | Secondary highlight, success states |
| `white` | `#f5f6fc` | Primary text |

#### Secondary
| Token | Hex | Usage |
|-------|-----|-------|
| `purple` | `#7620ff` | Tertiary accent, info states |
| `purple-light` | `#8f49ff` | Purple variant |
| `yellow` | `#feed55` | Warning, attention |
| `deep-teal` | `#0d5257` | Dark teal for subtle backgrounds |

#### Backgrounds & Surfaces
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#0a0a1f` | App background (gradient start) |
| `bg-deep` | `#040416` | App background (gradient end) |
| `surface` | `#12122e` | Card/panel surface |
| `surface-hover` | `#1c1c47` | Hovered states |

#### Borders
| Token | Hex | Usage |
|-------|-----|-------|
| `border-default` | `#393b54` | Standard borders |
| `border-strong` | `#3a3d4e` | Emphasized borders |

### Typography

#### Font Families
- **Headline:** `'Saira SemiCondensed', sans-serif` (Google Fonts)
- **Body:** `'Montserrat', sans-serif` (Google Fonts)

#### Type Scale (Headings — Saira SemiCondensed)
| Token | Size/Line-height | Weight |
|-------|-----------------|--------|
| H1 | 40/44 | Bold |
| H2 | 36/40 | Bold |
| H3 | 32/36 | Bold |
| H4 | 30/34 | Bold |
| H5 | 26/30 | SemiBold |
| H6 | 24/28 | SemiBold |

#### Type Scale (Body — Montserrat)
| Token | Size/Line-height | Weight |
|-------|-----------------|--------|
| B1 | 20/24 | Bold |
| B2 | 18/24 | Bold |
| B3 | 16/22 | Medium |
| B4 | 14/20 | Regular |
| B5 | 12/16 | Regular |
| B6 | 10/14 | Regular |

#### Typography Rules
- Headlines: Saira SemiCondensed Bold, title case
- Leads/Labels: Montserrat Bold, ALL CAPS
- Sub-heads: Montserrat SemiBold, sentence case
- Body: Montserrat Regular, sentence case
- Disclaimers: Montserrat Regular, 60% of body size
- Italics: Only for captions, quotes, AP style rules — never for headers or body copy

### Border Radius
| Context | Value |
|---------|-------|
| Cards/Panels | 45px |
| Pills/Chips | 47px |
| Buttons/Inputs | 12px |
| Small badges/tags | 8px |
| Circular elements | 50% |

### Letter Spacing
All type hierarchy levels use `letter-spacing: 0` per brand spec. This replaces the current 0.5-2px spacing used on uppercase labels.

---

## Scope of Changes

### CSS / Styling
- Create `src/config/design-tokens.ts` — single source of truth for all brand tokens
- Rewrite CSS `:root` variables to use A47 palette
- Remove all light theme CSS (`[data-theme="light"]` rules)
- Update `main.css` — colors, fonts, radii, backgrounds, letter-spacing throughout
- Update `panels.css`, `settings-window.css`, `lang-switcher.css`, `rtl-overrides.css`
- Increase `.panels-grid` gap from 4px to accommodate 45px radii
- Remove theme toggle from settings UI

### TypeScript / Components
- Update `src/utils/theme-manager.ts` — remove light theme logic
- Update `src/utils/theme-colors.ts` — simplify for single theme
- Update `src/components/DeckGLMap.ts` — remap hardcoded RGB arrays to A47 palette
- Update `src/config/pipelines.ts` — remap pipeline colors
- Update all components using `getCSSColor()` (14 files)
- Update `index.html` — load Google Fonts (Saira SemiCondensed + Montserrat), remove FOUC theme script

### Map
- Update map background, country fill, stroke, and grid CSS variables
- Update DeckGL layer colors in TypeScript

### Assets
- Extract and replace A47 logo assets from Figma
- Update loading screen with A47 branding
- Generate new favicon and PWA icons from A47 logo
- Update PWA manifest colors
- Update Tauri config theme colors
- Update OG image generation colors

### Testing
- Regenerate all E2E visual regression golden screenshots
- Verify all layer toggles render correctly with new palette
- Test DeckGL map colors across all layer types

---

## Resolved Questions

1. **Logo assets:** Extract from Figma during implementation.
2. **Loading/splash screen:** Yes — rebrand with A47 colors and logo.
3. **Favicon + PWA icons:** Yes — generate new ones from A47 logo. Full rebrand of all touchpoints.
