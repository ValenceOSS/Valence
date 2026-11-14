import { say } from '@ValenceI18n/say';

/**
 * What a season is called where the catalogue gives it no name of its own.
 *
 * @param seasonNumber - The season, or nothing for episodes given no season.
 * @returns Its name.
 */
const nameOfSeason = (seasonNumber: number | null): string => {
  if (seasonNumber === null) {
    return say('common.episodes');
  }

  return seasonNumber === 0
    ? say('common.specials')
    : say('common.seasonSeasonNumber', { seasonNumber });
};

export { nameOfSeason };
