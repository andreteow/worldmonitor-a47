/**
 * Convert a hex color string to a deck.gl-compatible [R, G, B, A] tuple.
 * @param hex  6-digit hex color (e.g., '#ff3c51')
 * @param alpha  Alpha channel 0-255 (default 255 = fully opaque)
 */
export function hexToRGBA(hex: string, alpha = 255): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, alpha];
}
