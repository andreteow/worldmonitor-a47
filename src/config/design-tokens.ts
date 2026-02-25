/**
 * A47 Brand Design Tokens — Single source of truth for brand colors.
 *
 * CSS variables in :root (main.css) are the primary token system for CSS consumers.
 * This file exists for TypeScript consumers that can't read CSS variables
 * (DeckGL/Canvas layers, OG image generation, etc.).
 *
 * Use hexToRGBA() from @/utils/hex-to-rgba for deck.gl color tuples.
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Primary
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

  // Text hierarchy (derived from #f5f6fc at decreasing opacity on #0a0a1f)
  text: '#f5f6fc',
  textSecondary: '#c8c9d4',
  textDim: '#8a8b99',
  textMuted: '#6b6c7a',
  textFaint: '#585966',
  textGhost: '#464752',

  // Map
  mapBg: '#0a0a1f',
  mapGrid: '#1c1c47',
  mapCountry: '#12122e',
  mapStroke: '#393b54',

  // Semantic (hybrid — A47 where natural, preserved where not)
  semanticCritical: '#ff3c51',
  semanticHigh: '#ff8800',
  semanticElevated: '#ffaa00',
  semanticNormal: '#47f5c8',
  semanticLow: '#7620ff',
  semanticInfo: '#8f49ff',

  // Threat levels
  threatCritical: '#ff3c51',
  threatHigh: '#f97316',
  threatMedium: '#eab308',
  threatLow: '#47f5c8',
  threatInfo: '#8f49ff',

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
} as const;
