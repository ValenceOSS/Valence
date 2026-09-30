import type { Share } from '@ValenceContracts/schemas/Share';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Says how often a link has been opened, against its allowance where it has one. The plural follows
 * the number the word belongs to — the allowance where there is one, since that is what "times"
 * counts, and the openings where there is not.
 *
 * @param share - The link.
 * @returns The phrase to show.
 */
const saidOpened = (share: Share): string => {
  const opened = share.views.toString();

  if (share.viewCap === null) {
    return sayCount('common.count.times', share.views);
  }

  const cap = share.viewCap.toString();

  return share.viewCap === 1
    ? say('client.sharing.saidOpened.openedOf1Time', { opened })
    : say('client.sharing.saidOpened.openedOfCapTimes', { opened, cap });
};

export { saidOpened };
