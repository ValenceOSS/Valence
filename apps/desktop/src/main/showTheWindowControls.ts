import type { BrowserWindow } from 'electron';

/**
 * Shows or hides macOS's traffic lights, so they come and go over a film with the player's controls
 * rather than sitting over the picture the whole way through.
 *
 * Windows and Linux have nothing to do here: their minimise, maximise and close are drawn by the
 * page, in the strip along its top, and come and go with it.
 *
 * @param window - The window.
 * @param isShown - Whether they should be showing.
 * @param platform - Which system it is running on.
 */
const showTheWindowControls = (
  window: Pick<BrowserWindow, 'setWindowButtonVisibility'>,
  isShown: boolean,
  platform: NodeJS.Platform,
): void => {
  if (platform === 'darwin') {
    window.setWindowButtonVisibility(isShown);
  }
};

export { showTheWindowControls };
