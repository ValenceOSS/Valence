import { saidWhen } from '@ValenceClient/format/saidWhen';
import type { Share } from '@ValenceContracts/schemas/Share';
import { say } from '@ValenceI18n/say';

/**
 * Says what still holds a link open, for one that is still working — or used up, which stops only
 * new people opening it, not those who already have. A link with neither an end date
 * nor a limit works until somebody withdraws it, which is worth saying plainly rather than leaving
 * blank. Worded without an owner, since the same phrase is read by whoever made the link and by
 * whoever looks after everybody's.
 *
 * @param share - The link.
 * @returns The phrase to show.
 */
const untilWhen = (share: Share): string => {
  const expiresAt = share.expiresAt === null ? null : saidWhen(share.expiresAt);

  if (share.isSpent) {
    return expiresAt === null
      ? say('client.sharing.untilWhen.whoeverOpenedItCanStillWatch2')
      : say('client.sharing.untilWhen.whoeverOpenedItCanStillWatch', { expiresAt });
  }

  if (expiresAt !== null) {
    return say('client.sharing.untilWhen.runsOutExpiresAt', { expiresAt });
  }

  return share.viewCap === null
    ? say('client.sharing.untilWhen.untilItIsWithdrawn')
    : say('client.sharing.untilWhen.untilItHasBeenOpenedEnough');
};

export { untilWhen };
