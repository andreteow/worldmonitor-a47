---
title: Sync fork with upstream koala73/worldmonitor
type: refactor
status: active
date: 2026-02-25
---

# Sync Fork with Upstream koala73/worldmonitor

## Overview

Merge 36 new commits from `upstream/main` (koala73/worldmonitor) into our fork without discarding any of our custom work (10 commits across `refactor/remove-tauri-desktop` and `feat/a47-brand-design-system-reskin`).

## Current State

### Our Fork Changes (10 commits on `refactor/remove-tauri-desktop`)
- **A47 brand design system reskin** — new design tokens, CSS variables, fonts, typography, colors, component theming
- **Remove Tauri desktop app** — deleted `src-tauri/`, removed desktop-only services (`runtime.ts`, `tauri-bridge.ts`, `desktop-readiness.ts`, `persistent-cache.ts`), simplified build config for web-only deployment
- **Docs** — brainstorms, plans, architecture reference, RSS proxy investigation
- **Figma MCP** — `.mcp.json` config

### Upstream Changes (36 commits since fork point `d7052c07`)
Key features/fixes added upstream:
- HappyMonitor — positive news dashboard variant (`happy.worldmonitor.app`)
- Command palette (Cmd+K) + country commands
- Trade route & chokepoint visualization layer
- Mexico CII hotspot + LatAm security feeds
- Universal country detection for CII scoring
- AI Flow settings popup for web-only AI provider control
- Settings consolidation into unified tabbed modal
- Security hardening (SSRF, auth gating, IPC, XSS)
- OpenSky API optimizations (merged regions, cache TTLs, 429 cooldown)
- RSS proxy improvements + positive news feeds
- Various bug fixes and performance improvements

## Conflict Analysis

### 26 conflicting files, grouped by category:

#### Category 1: Tauri — "modify/delete" conflicts (8 files)
Our fork deleted these; upstream modified them. **Resolution: keep deleted (our intent).**
- `src-tauri/Cargo.lock`
- `src-tauri/Cargo.toml`
- `src-tauri/capabilities/default.json`
- `src-tauri/sidecar/local-api-server.mjs`
- `src-tauri/sidecar/local-api-server.test.mjs`
- `src-tauri/src/main.rs`
- `src-tauri/tauri.conf.json`
- `src/styles/settings-window.css` (deleted in our fork)

#### Category 2: Files we deleted that upstream modified (3 files)
- `e2e/runtime-fetch.spec.ts` — we deleted, upstream modified
- `src/components/RuntimeConfigPanel.ts` — we deleted, upstream modified
- `src/services/runtime.ts` — we deleted, upstream modified

**Decision needed:** These are related to our Tauri removal. We should review whether upstream's changes to these files are Tauri-specific or contain general improvements we want.

#### Category 3: Content merge conflicts — need manual resolution (15 files)
- `.gitignore` — likely minor
- `README.md` — we rebranded, upstream updated features
- `index.html` — we modified for A47 branding, upstream modified
- `package.json` — both added/changed dependencies
- `src/App.ts` — core file, both sides modified heavily
- `src/components/DeckGLMap.ts` — upstream added trade route layer
- `src/components/LiveNewsPanel.ts` — upstream modified
- `src/locales/el.json` — both added keys
- `src/locales/en.json` — both added keys
- `src/locales/th.json` — both added keys
- `src/locales/vi.json` — both added keys
- `src/main.ts` — we simplified for web-only, upstream modified
- `src/settings-window.ts` — we simplified, upstream added AI Flow
- `src/styles/main.css` — A47 reskin vs upstream style changes
- `src/utils/theme-manager.ts` — both modified theming

## Proposed Strategy

### Step 1: First, sync our `main` with upstream
Our `main` branch is still at the fork point (`d7052c07`) with zero local commits. This means we can fast-forward `main` to `upstream/main` cleanly with zero conflicts:

```bash
git checkout main
git merge upstream/main  # fast-forward, no conflicts
```

### Step 2: Merge updated `main` into our working branch
Then merge the now-updated `main` into `refactor/remove-tauri-desktop`:

```bash
git checkout refactor/remove-tauri-desktop
git merge main
```

This produces the same 26 conflicts but gives us a clean `main` tracking upstream.

### Step 3: Resolve conflicts interactively
Work through conflicts in this order:

#### 3a. Auto-resolve Tauri deletions (8 files)
For all `src-tauri/*` files and `src/styles/settings-window.css`: resolve by keeping them deleted (our intentional removal).

#### 3b. Evaluate "deleted vs modified" files (3 files)
For each, check if upstream's modifications contain non-Tauri improvements:
- `e2e/runtime-fetch.spec.ts` — check if test improvements are valuable
- `src/components/RuntimeConfigPanel.ts` — check for non-desktop features
- `src/services/runtime.ts` — check for non-desktop features

#### 3c. Manual content merges (15 files)
Resolve one by one, preserving:
- Our A47 branding (design tokens, CSS vars, fonts, colors)
- Our Tauri removal simplifications
- Upstream's new features and bug fixes

Priority order (most impactful first):
1. `src/App.ts` — largest, most complex
2. `src/styles/main.css` — A47 reskin + upstream styles
3. `src/main.ts` — entry point
4. `src/components/DeckGLMap.ts` — new trade routes layer
5. `src/utils/theme-manager.ts` — theming changes
6. `package.json` — dependency merge
7. `index.html` — branding + upstream changes
8. `src/settings-window.ts` — web-only + AI Flow
9. `src/components/LiveNewsPanel.ts`
10. Locale files (`en.json`, `el.json`, `th.json`, `vi.json`)
11. `.gitignore`, `README.md`

### Step 4: Verify build
```bash
npm run typecheck
npm run build
```

### Step 5: Run tests
```bash
npm run test:data
npm run test:e2e:full
```

## Acceptance Criteria

- [ ] `main` branch tracks `upstream/main` at latest commit (`424ad75d`)
- [ ] `refactor/remove-tauri-desktop` includes all 36 upstream commits
- [ ] All A47 brand design system changes preserved (design tokens, CSS, fonts)
- [ ] Tauri desktop removal preserved (no `src-tauri/` files reintroduced)
- [ ] TypeScript compiles cleanly (`npm run typecheck`)
- [ ] Production build succeeds (`npm run build`)
- [ ] All new upstream features accessible (HappyMonitor variant, command palette, trade routes, etc.)
- [ ] No regression in existing fork functionality

## Risk Mitigation

- **Before starting:** Create a backup branch `backup/pre-upstream-sync` from current HEAD
- **Incremental approach:** Resolve conflicts one file at a time with review
- **Build verification:** Run typecheck after each major file resolution to catch issues early
