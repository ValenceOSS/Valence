import { drawUnreadBadge } from '@ValenceDesktop/bridge/drawUnreadBadge';
import { tellTheHost } from '@ValenceDesktop/bridge/tellTheHost';

/**
 * Hands the host the unread count for Valence's icon, with the picture Windows needs drawn first.
 *
 * @param count - How many are unread.
 * @param platform - Which operating system the window is on.
 */
const setTheUnreadBadge = (count: number, platform: string): void => {
  if (platform !== 'win32') {
    tellTheHost('set_unread_badge', { count, picture: null });

    return;
  }

  void drawUnreadBadge(count).then((picture) => {
    tellTheHost('set_unread_badge', { count, picture });
  });
};

export { setTheUnreadBadge };
