---
title: "News Panels Empty in Local Dev — RSS Proxy Architecture & Full Dashboard Reference"
date: 2026-02-25
category: integration-issues
tags:
  - rss-proxy
  - vite-dev-server
  - news-panels
  - api-routing
  - local-development
  - dashboard-architecture
  - panel-inventory
  - ai-pipeline
  - intelligence-findings
severity: high
component: "RSS feed pipeline, Vite dev server configuration, panel rendering system"
symptoms:
  - "All 14 news panels display as completely empty when running npm run dev"
  - "No visible error messages in the UI — errors silently caught"
  - "Issue affects all 100+ news feeds across all variants (full, tech, finance)"
  - "Problem does not occur in deployed production environment on Vercel"
  - "Structured data panels (markets, conflicts, climate) still work locally"
root_cause: >
  The RSS proxy endpoint (/api/rss-proxy) is a Vercel serverless edge function
  that only executes when deployed. The local Vite dev server has no middleware
  handler or proxy configuration for /api/rss-proxy requests, causing them to
  return 404 responses. The panel data fetching code silently catches these
  errors and returns empty arrays. This is a pre-existing architectural
  limitation, not a regression.
status: investigated
affects_variants:
  - full
  - tech
  - finance
related_files:
  - api/rss-proxy.js
  - src/config/feeds.ts
  - src/services/rss.ts
  - src/utils/proxy.ts
  - vite.config.ts
  - src/App.ts
  - src/components/NewsPanel.ts
  - src/components/Panel.ts
  - src/config/panels.ts
related_docs:
  - CLAUDE.md
  - docs/ADDING_ENDPOINTS.md
  - docs/DOCUMENTATION.md
  - CONTRIBUTING.md
---

# News Panels Empty in Local Dev — RSS Proxy Architecture & Full Dashboard Reference

## Table of Contents

1. [Problem: Why News Panels Are Empty Locally](#1-problem-why-news-panels-are-empty-locally)
2. [Complete Panel Inventory (Full Variant)](#2-complete-panel-inventory-full-variant)
3. [AI Analysis Pipeline (8 Layers)](#3-ai-analysis-pipeline-8-layers)
4. [Intelligence Findings Badge](#4-intelligence-findings-badge)
5. [Data Collection and Refresh](#5-data-collection-and-refresh)
6. [Sources Panel](#6-sources-panel)
7. [Prevention Strategies](#7-prevention-strategies)

---

## 1. Problem: Why News Panels Are Empty Locally

### Symptom

All 14 news-category panels (Live News, World News, Middle East, Africa, Latin America, Asia-Pacific, Energy, Government, Think Tanks, Intel, Financial, Technology, AI/ML, Layoffs) show no content when running `npm run dev`.

No error messages appear in the UI. The panels simply render empty.

### Investigation

The investigation compared branch `feat/a47-brand-design-system-reskin` against `origin/main` to determine if a CSS reskin caused the issue.

**Result**: The reskin branch only changed CSS, fonts, design tokens, and theme colors. **Zero changes** were made to any data service, feed configuration, or panel component. The empty panels are a **pre-existing local dev limitation**, not a regression.

### Root Cause: Missing Local Proxy for `/api/rss-proxy`

**Feed URL construction** (`src/config/feeds.ts`, line 5):

```typescript
const rss = (url: string) => `/api/rss-proxy?url=${encodeURIComponent(url)}`;
```

All 100+ RSS feeds are routed through `/api/rss-proxy`, which is a **Vercel serverless edge function** (`api/rss-proxy.js`). This function only runs when the app is deployed to Vercel.

**Vite dev server configuration** (`vite.config.ts`) has:
- 58 individual proxy routes for paths like `/rss/bbc`, `/rss/guardian` (unused by feeds)
- Proto RPC middleware for `/api/{domain}/v1/*` via `sebufApiPlugin()`
- Handlers for `/api/polymarket`, `/api/youtube/live`
- **No handler for `/api/rss-proxy`**

**Dev-mode URL passthrough** (`src/utils/proxy.ts`): `proxyUrl()` returns the path unchanged in dev mode, so every RSS request hits `http://localhost:PORT/api/rss-proxy?url=...`, which returns a 404.

**Silent failure** (`src/services/rss.ts`): All fetch errors are caught silently. The service returns cached data or an empty array. On a fresh dev session with no persistent cache, every panel renders empty — no error shown to the user.

### What Works vs. What Doesn't in Local Dev

| Data Source | Local Dev | Production | Why |
|---|---|---|---|
| RSS News Feeds (100+) | Does not work | Works | `/api/rss-proxy` is a Vercel edge function only |
| Proto RPC services (markets, climate, etc.) | Works | Works | `sebufApiPlugin()` middleware handles locally |
| Polymarket predictions | Works | Works | Custom Vite middleware exists |
| YouTube live streams | Works | Works | Custom Vite middleware exists |
| Yahoo Finance (stocks) | Works | Works | Vite proxy rule configured |
| USGS earthquakes | Works | Works | Vite proxy rule configured |
| AIS/OpenSky (vessels, flights) | Limited | Works | Requires `VITE_WS_RELAY_URL` env var |

### Potential Fixes

**Option A**: Proxy to deployed instance (simplest):
```typescript
// vite.config.ts — add to server.proxy
'/api/rss-proxy': {
  target: 'https://worldmonitor.app',
  changeOrigin: true,
}
```

**Option B**: Create local middleware mimicking `api/rss-proxy.js` (more robust, works offline).

**Option C**: Run the Tauri desktop sidecar (`npm run desktop:dev`) which includes a local API server.

---

## 2. Complete Panel Inventory (Full Variant)

The dashboard uses a responsive CSS Grid (`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`) with dense row packing. Panels are draggable, resizable (1-4 row spans), and togglable via Settings. All state is persisted to localStorage.

### 2A. News Feed Panels (14 panels)

All use the `NewsPanel` component (`src/components/NewsPanel.ts`) configured with different RSS feed categories. AI features on every headline: keyword threat classification + optional LLM summarization.

| Panel ID | Display Name | Feed Sources |
|---|---|---|
| `live-news` | Live News | All feeds combined (spans 2 columns) |
| `intel` | Intel Feed | Defense One, Breaking Defense, USNI, Bellingcat |
| `politics` | World News | Reuters, AP, BBC, Guardian, Al Jazeera |
| `middleeast` | Middle East | Al Jazeera, Al Arabiya, Middle East Eye |
| `africa` | Africa | Africa-focused feeds |
| `latam` | Latin America | LatAm regional feeds |
| `asia` | Asia-Pacific | Asia-Pacific feeds |
| `energy` | Energy & Resources | Energy sector feeds |
| `gov` | Government | White House, State Dept, Pentagon, CISA, Fed |
| `thinktanks` | Think Tanks | CSIS, Brookings, Carnegie, RAND |
| `finance` | Financial | CNBC, MarketWatch, Financial Times |
| `tech` | Technology | TechCrunch, The Verge, Ars Technica |
| `ai` | AI/ML | AI-specific feeds, HuggingFace, arXiv |
| `layoffs` | Layoffs Tracker | Layoff-tracking feeds |

### 2B. AI Analysis Panels (4 panels)

These panels perform substantial AI/ML analysis beyond simple data display.

| Panel ID | Component | What It Does |
|---|---|---|
| `insights` | `InsightsPanel` | LLM-generated world briefing from clustered news + focal points + signal aggregation + military posture. Includes missed stories, convergence zones, sentiment keywords. 2-min cooldown, cached. |
| `strategic-posture` | `StrategicPosturePanel` | Theater-by-theater military analysis. Combines OpenSky flight data + AIS vessel data. Detects surges, strike capability, target nations. 5-min auto-refresh. |
| `cii` | `CIIPanel` | Country Instability Index: 0-100 stability scoring for monitored nations. Multi-domain inputs: protests, military, news, outages, conflicts, UCDP, HAPI, displacement, climate. 15-min learning warmup, 4 component breakdown (Unrest, Conflict, Security, Information). |
| `strategic-risk` | `StrategicRiskPanel` | Cross-module alert aggregation. Geographic convergence detection, risk scoring with freshness tracking, 24h alert history. |

### 2C. Market / Economic Panels (9 panels, no AI)

| Panel ID | Component | Data Source |
|---|---|---|
| `markets` | `MarketPanel` | Yahoo Finance / Finnhub — stock prices, sparklines |
| `heatmap` | `HeatmapPanel` | Sector ETF data — color-coded sector performance grid |
| `commodities` | `CommoditiesPanel` | Yahoo Finance futures — oil, gold, silver, natural gas, copper |
| `crypto` | `CryptoPanel` | CoinGecko — BTC, ETH, altcoin prices |
| `polymarket` | `PredictionPanel` | Polymarket API — YES/NO probability bars |
| `economic` | `EconomicPanel` | FRED + oil analytics + USASpending — 3-tab layout |
| `etf-flows` | `ETFFlowsPanel` | Market proto RPC — BTC/ETH ETF inflow/outflow |
| `stablecoins` | `StablecoinPanel` | CoinGecko — USDT/USDC/DAI peg status + market cap |
| `macro-signals` | `MacroSignalsPanel` | Economic proto RPC — 7 macro signals with bullish/bearish verdicts |

### 2D. Conflict / Crisis Panels (7 panels, no AI)

| Panel ID | Component | Data Source |
|---|---|---|
| `ucdp-events` | `UcdpEventsPanel` | UCDP GED (Uppsala Conflict Data Program) — 3-tab: state-based, non-state, one-sided violence |
| `displacement` | `DisplacementPanel` | UNHCR — refugees, asylum seekers, IDPs by country |
| `climate` | `ClimateAnomalyPanel` | Climate proto RPC — temperature/precipitation anomalies |
| `population-exposure` | `PopulationExposurePanel` | Computed from UCDP + climate + seismic + population density |
| `satellite-fires` | `SatelliteFiresPanel` | NASA FIRMS (VIIRS satellite) — fire counts + FRP intensity by region |
| `cascade` | `CascadePanel` | Static config — interactive infrastructure dependency graph |
| `gdelt-intel` | `GdeltIntelPanel` | GDELT via Intelligence proto — 6 tabbed intel topics: Military, Cyber, Nuclear, Sanctions, Intelligence, Maritime |

### 2E. Live Media Panels (2 panels)

| Panel ID | Component | What It Shows |
|---|---|---|
| `live-news` (video) | `LiveNewsPanel` | Embedded YouTube live streams (Bloomberg, Sky News, Euronews, DW, CNBC, France24, etc.) |
| `live-webcams` | `LiveWebcamsPanel` | 23 global webcam feeds with regional filtering (Jerusalem, Kyiv, Taipei, DC, etc.) |

### 2F. User Customization (1 panel)

| Panel ID | Component | What It Shows |
|---|---|---|
| `monitors` | `MonitorPanel` | User-created keyword monitors — type keywords, see matching news filtered in real-time. Stored in localStorage. |

### Panel Ordering and Display

- Panels are ordered in the grid according to `src/config/panels.ts` configuration
- `live-news` is always forced first (spans 2 columns)
- Users can drag panels to reorder (saved to `localStorage['panel-order']`)
- Panel height is resizable via drag handle (1-4 row spans, saved to `localStorage['worldmonitor-panel-spans']`)
- Panels can be toggled on/off via Settings modal (saved to `localStorage['worldmonitor-panels']`)
- Priority 2 panels appear further down and may be below the fold

---

## 3. AI Analysis Pipeline (8 Layers)

The intelligence pipeline runs as news is ingested, building progressively richer analysis.

### Layer 1: Keyword Threat Classification

**File**: `src/services/threat-classifier.ts`

200+ keywords across 4 severity tiers (critical, high, medium, low) and 14 event categories (conflict, protest, disaster, diplomatic, economic, terrorism, cyber, health, environmental, military, crime, infrastructure, tech, general). Runs synchronously on every article. No external dependency.

**Variant-aware**: Tech and finance variants add domain-specific keywords (e.g., "zero-day", "supply chain attack" for tech; "market crash", "recession" for finance).

### Layer 2: AI-Enhanced Classification

Optional LLM upgrade of top keyword-classified articles. Backends: Groq, OpenRouter, or browser-side T5 (Transformers.js). Rate-limited per variant: full=80/min, tech=60/min, finance=40/min. 30-minute deduplication window per title.

### Layer 3: Hybrid News Clustering

**File**: `src/services/clustering.ts` + `src/services/analysis-core.ts`

Groups related headlines into single story clusters (deduplication across 100+ sources). Two-phase approach:
1. Fast Jaccard token similarity (always runs)
2. ML semantic similarity refinement via web worker embeddings (runs only if ML worker available and sufficient clusters exist)

### Layer 4: Entity Extraction

**Files**: `src/services/entity-extraction.ts` + `src/services/entity-index.ts`

Extracts country, company, and person entities from clustered headlines. Feeds the focal point detector with entity mentions and geographic context.

### Layer 5: Trending Spike Detection

**File**: `src/services/trending-keywords.ts`

Statistical spike detection: 2-hour rolling keyword frequency window vs. 7-day baseline. ML entity recognition (NER) enriches spikes with named entities at 0.75 confidence threshold.

Limits: 10,000 tracked terms, 5 auto-summaries per hour, 30-minute spike cooldown. Requires minimum 2 unique sources before flagging a spike.

### Layer 6: Signal Aggregation

**File**: `src/services/signal-aggregator.ts`

Collects ALL map signals (internet outages, military flights, military vessels, protests, AIS disruptions, satellite fires, temporal anomalies) and clusters them by country/region. Produces convergence zones where multiple signal types overlap.

### Layer 7: Focal Point Detection

**File**: `src/services/focal-point-detector.ts`

Cross-domain entity correlation. Identifies "main characters" appearing simultaneously across multiple intelligence streams. Example: IRAN mentioned in 12 news clusters + 5 military flights + internet outage = CRITICAL focal point with rich narrative context.

### Layer 8: LLM Summarization

**File**: `src/services/summarization.ts`

4-tier fallback chain: Ollama (local) -> Groq -> OpenRouter -> Browser T5 (Transformers.js). Triggered by user clicking the summarize button on a news panel, or automatically on trending spikes. Server-side Redis caching, per-provider circuit breakers, geo-context enrichment.

---

## 4. Intelligence Findings Badge

### What It Is

The **IntelligenceGapBadge** (`src/components/IntelligenceGapBadge.ts`) is a floating notification icon visible in the top-right of the app header. Desktop only (hidden on mobile).

### Refresh Cycle

Every **10 seconds**, the badge calls `mergeFindings()` to pull two data streams:

### Data Source A: Correlation Signals

From `src/services/correlation.ts`. Generated from real-time data analysis:

- **prediction_leads_news** — Prediction markets move before news breaks
- **news_leads_markets** — News breaks before markets react
- **silent_divergence** — Major gap between news volume and price action
- **velocity_spike** — Sudden acceleration in article volume
- **keyword_spike** — Trending keywords exceed baseline
- **convergence** — Multiple correlated events converging
- **triangulation** — 3+ data sources converging
- **geo_convergence** — Multiple signal types clustering geographically

Only signals from the last **30 minutes** are shown. Rolling buffer of 100 items.

### Data Source B: Unified Alerts

From `src/services/cross-module-integration.ts`. Three alert types:

- **CII Spike** — Country Instability Index changes by 10+ points
- **Convergence** — Multiple geographic signal types cluster (military + protests + outages simultaneously)
- **Cascade** — Infrastructure failure cascading to affect multiple countries

Alerts from the last **6 hours** are shown.

### Badge Behavior

- **Color**: gray (zero findings), subtle accent (1-3 low priority), red pulsing (critical/high priority present)
- **Sound**: Optional audio alert on new critical findings
- **Click**: Opens dropdown with 10 most recent findings, each showing icon, title, priority badge, actionable insight, and time ago
- **Finding click**: Opens `SignalModal` with full detail — sources, confidence score, related entities, clickable map location

### Connection to Other Panels

The badge is the **notification layer**. The same data feeds into:
- **Strategic Risk Panel** — detailed 24-hour alert timeline
- **AI Insights Panel** — narrative AI briefing built from these signals
- **CII Panel** — instability changes trigger alerts that appear in the badge

---

## 5. Data Collection and Refresh

### Source Coverage

- 208+ RSS domains whitelisted in the proxy allowlist (`api/rss-proxy.js`)
- 100+ feeds configured per variant in `src/config/feeds.ts`
- 14 proto-based RPC services for structured data
- 6+ external APIs (OpenSky, GDACS, EONET, NASA FIRMS, NWS, etc.)
- 3 financial APIs (Finnhub, Yahoo Finance, CoinGecko)

### Refresh Schedule

| Data Type | Interval | Conditional? |
|---|---|---|
| News (RSS feeds) | 5 min | Always |
| Markets (stocks) | 4 min | Always |
| Crypto | 4 min | Always |
| Predictions | 5 min | Always |
| Intelligence signals | 5 min | Full variant only |
| Natural disasters | 5 min | When layer enabled |
| Weather alerts | 10 min | When layer enabled |
| Maritime (AIS) | 10 min | When layer enabled |
| Cyber threats | 10 min | When layer enabled |
| Flight delays | 10 min | When layer enabled |
| Cable activity | 30 min | When layer enabled |
| Economic data (FRED) | 30 min | Always |
| US Government spending | 60 min | Always |
| PIZZINT indicator | 10 min | Always |

### Reliability Mechanisms

**Circuit breaker** per feed: 2 consecutive failures trigger a 5-minute cooldown before retry.

**Multi-tier cache**:
1. Memory cache — 10-minute TTL, fastest path
2. IndexedDB — persists across page reloads
3. localStorage — fallback for environments without IndexedDB

**Deduplication**: 30-minute window per normalized article title (lowercase, trimmed, single spaces). Prevents duplicate stories when syndicated across feeds.

**Visibility-aware**: Refresh loops pause when browser tab is hidden (Page Visibility API). On tab return, stale entries are flushed with 150ms stagger between refreshes to prevent thundering herd.

**Idle detection**: 2-minute user idle pauses refreshes.

---

## 6. Sources Panel

### Access

Opened via the **antenna button** in the top-right header toolbar.

### Contents

Displays all configured RSS and API sources in a 3-column grid with:
- Individual toggle switches per source
- "X/Y enabled" counter at the top
- Search/filter box
- "Select All" / "Select None" bulk actions

### Persistence

Disabled source IDs stored in `localStorage['worldmonitor-disabledFeeds']`. The RSS service reads this set at fetch time and skips disabled sources entirely.

### Status Indicator Dots (in Status Panel)

| Color | Meaning |
|---|---|
| Green | Fresh — updated less than 15 minutes ago |
| Yellow | Stale — updated 15 minutes to 2 hours ago |
| Orange | Very stale — updated 2 to 6 hours ago |
| Red | Error — last fetch failed |
| Gray | Disabled — toggled off by user |

### Effect of Disabling Sources

When a source is disabled:
- Articles from that source stop appearing on the next refresh cycle
- The source is never fetched (saves bandwidth)
- If ALL sources in a category are disabled, the panel shows an error message
- Re-enabling a source restores it on the next refresh

---

## 7. Prevention Strategies

### Silent Failure Visibility

The core developer experience problem: empty panels with no explanation.

**P0 — Console error for unhandled `/api/*` routes**: Add a Vite middleware that logs a clear warning when any `/api/*` request returns 404, explaining the route isn't proxied locally.

**P0 — Update CLAUDE.md**: Add a "Local Development Limitations" section documenting which panels work locally vs. require deployment.

**P1 — Dev mode diagnostics API**: Expose `window.__worldmonitor_rss_diagnostics()` in dev builds, returning feed failure counts, cache status, and circuit breaker states.

**P1 — First-run dev banner**: Show a dismissable banner on first local run explaining that RSS feeds require Vercel deployment.

### Dev/Prod Parity

**P1 — API route parity test**: Create `tests/api-parity.test.mjs` that verifies every feed URL pattern has either a Vite proxy route or a middleware handler.

**P2 — Unified local API gateway**: Create `npm run dev:with-gateway` that starts both Vite and a local API gateway mirroring Vercel's edge functions.

### Documentation Gaps

**P1 — Create `docs/DEVELOPMENT_GUIDE.md`**: Feature availability matrix (dev vs. prod), troubleshooting guide, API key setup instructions.

**P2 — Empty state UI improvement**: When a panel has zero items, show a helpful message distinguishing "no data available" from "data source failed" from "source disabled".

### Priority Summary

| Priority | Item | Effort |
|---|---|---|
| P0 | Add console warnings for 404 on `/api/*` routes | 30 min |
| P0 | Update CLAUDE.md with dev/prod limitations | 30 min |
| P1 | Create `docs/DEVELOPMENT_GUIDE.md` with feature matrix | 2 hours |
| P1 | Add dev diagnostics API for self-diagnosis | 1 hour |
| P1 | First-run dev mode banner | 1.5 hours |
| P1 | API route parity test | 2 hours |
| P2 | Unified local API gateway | 4 hours |
| P2 | Improved empty state UI messages | 2 hours |
