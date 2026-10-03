import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const HOUR = 3_600_000;

const DAY = 24 * HOUR;

/**
 * Says how long a setup link has left, in the largest whole unit that fits.
 *
 * @param expiresAt - When it stops working.
 * @param now - The moment to measure from.
 * @returns The words to show.
 */
const describeLinkLife = (expiresAt: string, now: number): string => {
  const left = Date.parse(expiresAt) - now;

  if (Number.isNaN(left) || left <= 0) {
    return say('screens.accountStanding.linkExpired');
  }

  if (left >= DAY) {
    return sayCount('screens.describeLinkLife.linkWorksForDays', Math.floor(left / DAY));
  }

  return sayCount(
    'screens.describeLinkLife.linkWorksForHours',
    Math.max(1, Math.floor(left / HOUR)),
  );
};

export { describeLinkLife };
