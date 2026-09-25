import type { BrowserWindow } from 'electron';

const SHOWN = '#ffffff';

const HIDDEN = '#00000000';

/**
 * Shows or hides the system's own window controls, so they come and go over a film with the
 * player's controls rather than sitting over the picture the whole way through.
 *
 * macOS can take its traffic lights away altogether. Windows and Linux cannot remove the controls
 * laid over the page without closing the window, so there their symbols are drawn clear instead,
 * which leaves the corner as empty as the rest of the picture.
 *
 * @param window - The window.
 * @param isShown - Whether they should be showing.
 * @param platform - Which system it is running on.
 */
const showTheWindowControls = (
  window: Pick<BrowserWindow, 'setWindowButtonVisibility' | 'setTitleBarOverlay'>,
  isShown: boolean,
  platform: NodeJS.Platform,
): void => {
  if (platform === 'darwin') {
    window.setWindowButtonVisibility(isShown);

    return;
  }

  window.setTitleBarOverlay({ symbolColor: isShown ? SHOWN : HIDDEN });
};

export { showTheWindowControls };
