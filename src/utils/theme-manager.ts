/**
 * Theme manager — dark-only (A47 brand).
 * Light theme removed. These exports remain for API compatibility
 * but getCurrentTheme() always returns 'dark'.
 */

export type Theme = 'dark';

/** Always returns 'dark' — single theme. */
export function getCurrentTheme(): Theme {
  return 'dark';
}
