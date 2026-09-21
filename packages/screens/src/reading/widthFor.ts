const WIDEST = 3840;

/**
 * How wide to ask for a page, in real pixels rather than the ones a browser counts in.
 *
 * @param across - How many pages are shown at once.
 * @returns The width to ask the server for.
 */
const widthFor = (across: number): number => {
  const screen = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const density = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 3);

  return Math.min(Math.round((screen * density) / Math.max(across, 1)), WIDEST);
};

export { WIDEST, widthFor };
