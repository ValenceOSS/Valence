import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { AdminShare } from '@ValenceContracts/schemas/Share';

const DAY_MS = 86_400_000;

/**
 * Says where a shared link stands: revoked, expired and when, used up, or how long it has left.
 *
 * @param share - The link.
 * @param now - The time to measure from, in milliseconds.
 * @returns What to show in its status column.
 */
const describeShareStatus = (share: AdminShare, now: number): string => {
  if (share.isRevoked) {
    return say('client.sharing.shareStanding.withdrawn');
  }

  if (share.expiresAt !== null && Date.parse(share.expiresAt) <= now) {
    return say('screens.adminArea.sharesPanel.expiredWhen', {
      when: describeSince(share.expiresAt, now),
    });
  }

  if (share.isSpent) {
    return say('screens.adminArea.sharesPanel.allOpensUsed');
  }

  if (share.expiresAt === null) {
    return say('screens.adminArea.sharesPanel.noEndDate');
  }

  const days = Math.ceil((Date.parse(share.expiresAt) - now) / DAY_MS);

  return days <= 1
    ? say('screens.adminArea.sharesPanel.endsToday')
    : sayCount('screens.adminArea.sharesPanel.count.endsInCountDays', days);
};

export { describeShareStatus };
