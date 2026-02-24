const colorCache = new Map<string, string>();

/**
 * Read a CSS custom property value from the document root.
 * Permanently cached — single dark theme means values never change at runtime.
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
