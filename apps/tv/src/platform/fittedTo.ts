const POINTS_ACROSS = 1920;

type FittedScreen = { width: number; height: number; scale: number };

/**
 * The screen the TV layout is drawn on, fitted to a browser's window: 1920 points across, as tvOS's
 * is and as an Android TV's is made to be, as tall as the window's shape allows, and how much it is
 * scaled to fill the window.
 *
 * @param width - How wide the window is.
 * @param height - How tall the window is.
 * @returns The screen to draw on, and its scale.
 */
const fittedTo = (width: number, height: number): FittedScreen => {
  const scale = width > 0 ? width / POINTS_ACROSS : 1;

  return { width: POINTS_ACROSS, height: Math.round(height / scale), scale };
};

export { fittedTo };
