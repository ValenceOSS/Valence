const WINDOW_BAR = '--valence-window-bar';

/**
 * How many pixels a desktop window's own bar takes from the top of the page.
 *
 * A popup placed against the top of the window has to treat this strip as the edge, or it opens
 * underneath a bar drawn over everything and cannot be read.
 *
 * @param root - The element the bar's height is set on.
 * @returns The height in pixels, or nothing where there is no bar.
 */
const windowBarHeight = (root: HTMLElement = document.documentElement): number => {
  const styles = getComputedStyle(root);
  const said = styles.getPropertyValue(WINDOW_BAR).trim();
  const amount = Number.parseFloat(said);

  if (Number.isNaN(amount)) {
    return 0;
  }

  return said.endsWith('rem') ? amount * Number.parseFloat(styles.fontSize) : amount;
};

export { windowBarHeight };
