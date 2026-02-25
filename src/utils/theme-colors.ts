const colorCache = new Map<string, string>();

/**
 * Clear the cached CSS color values so they are re-read from the document root
 * on next access. Called when the theme changes.
 */
export function invalidateColorCache(): void {
  colorCache.clear();
}

/**
 * Read a CSS custom property value from the document root.
 * Cached until invalidated — call invalidateColorCache() when the theme changes.
 * @param varName CSS variable name including -- prefix (e.g., '--semantic-critical')
 * @returns The computed color value string
 */
export function getCSSColor(varName: string): string {
  const cached = colorCache.get(varName);
  if (cached) return cached;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName).trim();
  colorCache.set(varName, value);
  return value;
}
