import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import type { LocalNotice, Platform } from '@ValenceClient/platform/Platform.types';

/**
 * Shows a notice through the host's notification plugin once the system allows Valence to,
 * asking where it has not been asked yet.
 *
 * @param notice - What happened.
 * @returns Once it has been shown, or refused.
 */
const showWhereAllowed = async (notice: LocalNotice): Promise<void> => {
  const isAllowed = (await isPermissionGranted()) || (await requestPermission()) === 'granted';

  if (isAllowed) {
    sendNotification({ title: notice.title, body: notice.body });
  }
};

/**
 * Puts a notice up on this machine directly, the way a chat client does while it is open, through
 * the system's own notification centre rather than a push.
 *
 * @param notice - What happened.
 */
const notifyLocally: Platform['notifyLocally'] = (notice: LocalNotice): void => {
  void showWhereAllowed(notice).catch(() => undefined);
};

/**
 * Puts the unread count on Valence's own icon, through the host that owns the dock or the taskbar.
 *
 * @param count - How many are unread.
 */
const setUnreadBadge: Platform['setUnreadBadge'] = (count: number): void => {
  window.valence.notifications.setBadge(count);
};

export { notifyLocally, setUnreadBadge };
