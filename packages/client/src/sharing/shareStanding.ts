import type { Share } from '@ValenceContracts/schemas/Share';

type ShareStanding = { label: string; isLive: boolean; canWithdraw: boolean };

/**
 * Says how a link stands, and says which of the three ways it ended rather than only that it has.
 * Withdrawn, run out and used up are different things to have happened, and somebody looking at a
 * list of links is usually trying to tell them apart.
 *
 * A used-up link can still be withdrawn. Its allowance only stops new people opening it: whoever
 * already has keeps watching until it runs out, and withdrawing it is how to end that early.
 *
 * @param share - The link.
 * @param now - What to treat as now, so the phrasing can be tested.
 * @returns What to show and how loudly.
 */
const shareStanding = (share: Share, now: number): ShareStanding => {
  if (share.isRevoked) {
    return { label: 'Withdrawn', isLive: false, canWithdraw: false };
  }

  if (share.expiresAt !== null && Date.parse(share.expiresAt) <= now) {
    return { label: 'Ran out', isLive: false, canWithdraw: false };
  }

  return share.isSpent
    ? { label: 'All used up', isLive: false, canWithdraw: true }
    : { label: 'Live', isLive: true, canWithdraw: true };
};

export type { ShareStanding };

export { shareStanding };
