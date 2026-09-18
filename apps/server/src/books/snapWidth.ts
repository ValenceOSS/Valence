const PAGE_WIDTHS = [640, 960, 1280, 1920, 2560, 3840] as const;

/**
 * Rounds the width somebody asked for a page at up to the next one Valence keeps.
 *
 * A reader asks for exactly as wide as its window is, so without this every window size anybody has
 * ever read at is another copy of every page. Rounding up rather than to the nearest never sends a
 * page narrower than it will be drawn.
 *
 * @param width - How wide the page was asked for.
 * @returns The width it is drawn and kept at.
 */
const snapWidth = (width: number): number =>
  PAGE_WIDTHS.find((kept) => kept >= width) ?? PAGE_WIDTHS[PAGE_WIDTHS.length - 1] ?? width;

export { PAGE_WIDTHS, snapWidth };
