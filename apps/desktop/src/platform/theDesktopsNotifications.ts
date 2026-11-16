import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { z } from 'zod';
import type { LocalNotice, Platform } from '@ValenceClient/platform/Platform.types';
import { hearTheHost } from '@ValenceDesktop/bridge/hearTheHost';

const NOTICE_OPENED = 'valence:notice-opened';

const LARGEST_NOTICE_NUMBER = 2 ** 31;

const NOTICES_KEPT = 50;

const toOpen = new Map<number, () => void>();

const hearing: { stop: (() => void) | null } = { stop: null };

/**
 * Opens what a clicked notice was about, once, where this page put the notice up.
 *
 * @param notice - The number the notice was given.
 */
const openTheNotice = (notice: number): void => {
  const open = toOpen.get(notice);

  toOpen.delete(notice);
  open?.();
};

/**
 * Keeps what to open when the notice numbered `notice` is clicked, forgetting the oldest notice
 * kept once there are more than anybody will go back and click.
 *
 * @param notice - The number the notice was given.
 * @param open - What to do once it is clicked.
 */
const keepToOpen = (notice: number, open: () => void): void => {
  toOpen.set(notice, open);

  for (const oldest of toOpen.keys()) {
    if (toOpen.size <= NOTICES_KEPT) {
      break;
    }

    toOpen.delete(oldest);
  }

  hearing.stop ??= hearTheHost(NOTICE_OPENED, z.number().int(), openTheNotice);
};

/**
 * Shows a notice through the host's notification plugin once the system allows Valence to,
 * asking where it has not been asked yet, under a number the host names again when it is clicked.
 *
 * @param notice - What happened, and what to do once somebody clicks it.
 * @returns Once it has been shown, or refused.
 */
const showWhereAllowed = async (notice: LocalNotice): Promise<void> => {
  const isAllowed = (await isPermissionGranted()) || (await requestPermission()) === 'granted';

  if (!isAllowed) {
    return;
  }

  const id = Math.floor(Math.random() * LARGEST_NOTICE_NUMBER);

  if (notice.onOpen !== undefined) {
    keepToOpen(id, notice.onOpen);
  }

  sendNotification({ id, title: notice.title, body: notice.body });
};

/**
 * Puts a notice up on this machine directly, the way a chat client does while it is open, through
 * the system's own notification centre rather than a push. Clicking it brings the window forward,
 * which the host does, and opens what it was about.
 *
 * @param notice - What happened, and what to do once somebody clicks it.
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
