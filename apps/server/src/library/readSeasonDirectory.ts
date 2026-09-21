const SEASON_WORDS =
  'season|series|sæson|saison|staffel|stagione|säsong|seizoen|sezon|sezona|sezóna|sezonul|série|séria|serie|seria|temporada|kausi';

const SEASON_DIRECTORY = new RegExp(`\\b(?:${SEASON_WORDS})[\\s._-]*(?<season>\\d{1,4})\\b`, 'i');

const SEASON_PREFIX = /\bs(?<season>\d{1,4})\b/i;

const SPECIALS_DIRECTORY = /\b(?:specials?|extras?)\b/i;

/**
 * Reads the season a directory declares, accepting the several ways people write it — `Season 2`,
 * `S02`, `Series 2`, `Staffel 2`, `Temporada 2` — since a shelf is arranged by whoever filled it
 * rather than by a convention, and the tools that fill one do not all speak English.
 *
 * The bare `s` form takes its number immediately, where the spelled-out words may be separated from
 * theirs. `S02` is a season and `Elvis 1977` is not, and allowing a space after the `s` in a name
 * ending in one is the difference between those two readings.
 *
 * @param name - The directory name as it is on disk.
 * @returns The season number, or null where the directory names none.
 */
const readSeasonDirectory = (name: string): number | null => {
  if (SPECIALS_DIRECTORY.test(name)) {
    return 0;
  }

  const match = SEASON_DIRECTORY.exec(name) ?? SEASON_PREFIX.exec(name);

  return match?.groups?.season === undefined ? null : Number(match.groups.season);
};

export { readSeasonDirectory };
