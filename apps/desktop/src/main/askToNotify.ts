import { Notification } from 'electron';

/**
 * Has macOS ask whether Valence may send notifications the first time it opens, rather than the
 * first time something arrives, which can be days later and easy to miss.
 *
 * Electron asks macOS for alerts, sounds and the dock badge when it first gets ready to show a
 * notification, and has nothing else that asks; checking whether notifications are supported is what
 * gets it ready. macOS shows the question once and remembers the answer, so every later launch asks
 * nothing. Other systems need no asking, and are left alone.
 */
const askToNotify = (): void => {
  if (process.platform !== 'darwin') {
    return;
  }

  Notification.isSupported();
};

export { askToNotify };
