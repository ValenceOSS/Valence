import type { Share } from '@ValenceContracts/schemas/Share';
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
  if (share.viewCap === null) {
    return sayCount('client.saidOpened.times', share.views);
  }

  return sayCount('client.saidOpened.timesOf', share.viewCap, { opened: share.views.toString() });
};

export { saidOpened };
