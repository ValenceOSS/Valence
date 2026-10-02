import { ageCeilingOf } from './ageCeilingOf';
import { ageOfRating } from './ageOfRating';
import type { SourceCeiling } from './SourceReader';

type PlexRestrictions = {
  filterMovies: string | null;
  filterTelevision: string | null;
  restrictionProfile: string | null;
};

const PROFILE_RATINGS: Readonly<Record<string, readonly string[]>> = {
  little_kid: ['G', 'TV-Y', 'TV-G'],
  older_kid: ['G', 'TV-Y', 'TV-G', 'PG', 'TV-Y7', 'TV-PG'],
  teen: ['G', 'TV-Y', 'TV-G', 'PG', 'TV-Y7', 'TV-PG', 'PG-13', 'TV-14'],
};

/**
 * Reads one Plex filter string, such as `contentRating=G%2CPG|label=kids` or `contentRating!=R`,
 * as the ceiling its rating part sets.
 *
 * @param filter - The filter as plex.tv holds it.
 * @param regions - The certification systems to read ratings in.
 * @returns The ceiling, or null where the filter says nothing about ratings.
 */
const ceilingOfFilter = (filter: string, regions: readonly string[]): SourceCeiling | null => {
  let decoded = filter;

  try {
    decoded = decodeURIComponent(filter);
  } catch {
    decoded = filter;
  }

  for (const part of decoded.split(/[|&]/)) {
    const [, operator = '', list = ''] = /^contentRating(!?=)(.*)$/i.exec(part.trim()) ?? [];
    const ratings = list
      .split(',')
      .map((one) => one.trim())
      .filter((one) => one !== '');

    if (ratings.length === 0) {
      continue;
    }

    if (operator === '=') {
      return { maximumAge: ageCeilingOf(ratings, regions), allowsUnrated: false };
    }

    const lowest = Math.min(...ratings.map((one) => ageOfRating(one, regions) ?? 21));

    return { maximumAge: Math.max(lowest - 1, 0), allowsUnrated: true };
  }

  return null;
};

/**
 * The age ceiling a Plex account's restrictions amount to: the stricter of its film and television
 * filters, or the ratings its managed-user profile allows.
 *
 * @param restrictions - The account's filters and profile.
 * @param regions - The certification systems to read ratings in.
 * @returns The ceiling, or null where the account is not restricted.
 */
const plexCeilingOf = (
  restrictions: PlexRestrictions,
  regions: readonly string[],
): SourceCeiling | null => {
  const found = [restrictions.filterMovies, restrictions.filterTelevision]
    .flatMap((filter) => (filter === null || filter === '' ? [] : [filter]))
    .map((filter) => ceilingOfFilter(filter, regions))
    .filter((ceiling) => ceiling !== null);
  const profile = PROFILE_RATINGS[restrictions.restrictionProfile ?? ''];

  if (profile !== undefined) {
    found.push({ maximumAge: ageCeilingOf(profile, regions), allowsUnrated: false });
  }

  if (found.length === 0) {
    return null;
  }

  return {
    maximumAge: Math.min(...found.map((one) => one.maximumAge)),
    allowsUnrated: found.every((one) => one.allowsUnrated),
  };
};

export type { PlexRestrictions };

export { plexCeilingOf };
