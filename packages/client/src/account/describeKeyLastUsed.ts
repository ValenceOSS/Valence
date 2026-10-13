import { say } from '@ValenceI18n/say';

const DAY_MS = 86_400_000;

/**
 * Says when an API key was last used in words rather than as a timestamp, and says plainly when it
 * never has been — which is the thing worth noticing in a list of keys.
 *
 * @param at - When it was last used, or nothing where it never has been.
 * @returns The phrase to show.
 */
const describeKeyLastUsed = (at: string | null): string => {
  if (at === null) {
    return say('common.neverUsed');
  }

  const days = Math.floor((Date.now() - Date.parse(at)) / DAY_MS);

  if (days < 1) {
    return say('screens.apiKeyPanel.usedToday');
  }

  return days === 1
    ? say('screens.apiKeyPanel.usedYesterday')
    : say('screens.apiKeyPanel.usedDaysDaysAgo', { days: days.toString() });
};

export { describeKeyLastUsed };
