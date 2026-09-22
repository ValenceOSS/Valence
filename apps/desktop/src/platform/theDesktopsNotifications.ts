import type { LocalNotice, Platform } from '@ValenceClient/platform/Platform.types';

/**
 * Puts a notice up on this machine directly, the way a chat client does while it is open, rather
 * than waiting on the push a browser tab would need instead.
 *
 * A page cannot open the OS's own notification centre, but the window it is drawn in can: the
 * `Notification` a browser uses for the same purpose is a page API Chromium still answers inside
 * Electron, so nothing here reaches for a bridge — it draws one the same way a tab would, on a
 * client that is never asleep the way a tab can be, and so never needed the service worker a browser
 * asks the same thing of.
 *
 * @param notice - What happened, and what to do once somebody presses it.
 */
const notifyLocally: Platform['notifyLocally'] = (notice: LocalNotice): void => {
  const shown = new Notification(notice.title, { body: notice.body });

  if (notice.onOpen !== undefined) {
    shown.onclick = () => {
      window.focus();
      notice.onOpen?.();
    };
  }
};

/**
 * Puts the unread count on Valence's own icon, the way a chat client counts what is waiting for you
 * without your having to open it.
 *
 * Passed to the process that owns the dock or the taskbar, since a page cannot touch either — the
 * count is true the moment this is called and stale the moment after, so it is asked for again on
 * every change rather than kept.
 *
 * @param count - How many are unread.
 */
const setUnreadBadge: Platform['setUnreadBadge'] = (count: number): void => {
  window.valence.notifications.setBadge(count);
};

export { notifyLocally, setUnreadBadge };
