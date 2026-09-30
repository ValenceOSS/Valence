import { say } from '@ValenceI18n/say';

/**
 * Names a season the way somebody would say it, giving specials their own name rather than calling
 * them season zero.
 *
 * An episode nobody could place in a season is not a special. Those are two different facts, and one
 * of them is a guess, so it is named for what it is rather than borrowed from the other.
 *
 * @param seasonNumber - The season, or null where the scanner could not place it.
 * @returns What to call it.
 */
const nameSeason = (seasonNumber: number | null): string => {
  if (seasonNumber === null) {
    return say('common.otherChoice');
  }

  return seasonNumber === 0
    ? say('common.specials')
    : say('common.seasonSeasonNumber', { seasonNumber: seasonNumber.toString() });
};

export { nameSeason };
