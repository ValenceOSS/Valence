import { app, nativeImage } from 'electron';
import type { BrowserWindow } from 'electron';
import { say } from '@ValenceI18n/say';

/**
 * Shows how many notifications are unread on Valence's icon: the dock's own badge on macOS and the
 * launcher's on Linux, and on Windows, which has no badge to give a count to, the picture the window
 * drew laid over the corner of the taskbar button.
 *
 * @param window - The window whose taskbar button carries it on Windows.
 * @param count - How many are unread.
 * @param picture - The count as the window drew it, for Windows.
 */
const showTheUnreadCount = (
  window: Pick<BrowserWindow, 'isDestroyed' | 'setOverlayIcon'> | null,
  count: number,
  picture: string | null,
): void => {
  if (process.platform !== 'win32') {
    app.setBadgeCount(count);

    return;
  }

  if (window === null || window.isDestroyed()) {
    return;
  }

  window.setOverlayIcon(
    count === 0 || picture === null ? null : nativeImage.createFromDataURL(picture),
    count === 0
      ? ''
      : say('desktop.main.showTheUnreadCount.countUnread', { count: count.toString() }),
  );
};

export { showTheUnreadCount };
