import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { AdminShare } from '@ValenceContracts/schemas/Share';

/**
 * Says how often a shared link has been opened, against its allowance where it has one.
 *
 * @param share - The link.
 * @returns Such as "2 of 5", "Never", "Once" or "4 times".
 */
const describeShareOpens = (share: AdminShare): string => {
  if (share.viewCap !== null) {
    return say('common.doneOfTotal', {
      done: share.views.toString(),
      total: share.viewCap.toString(),
    });
  }

  if (share.views === 0) {
    return say('common.never');
  }

  return share.views === 1
    ? say('screens.adminArea.sharesPanel.once')
    : sayCount('common.count.times', share.views);
};

export { describeShareOpens };
