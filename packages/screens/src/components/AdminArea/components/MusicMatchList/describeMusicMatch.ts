import { RELEASE_TYPE_NAMES } from '@ValenceClient/requests/RELEASE_TYPE_NAMES';
import type { MusicCatalogueHit } from '@ValenceContracts/schemas/MediaRequest';

/**
 * What tells one artist or album MusicBrainz found apart from the others: an album's artist, kind
 * and year, and an artist's year, and whatever MusicBrainz says besides.
 *
 * @param match - What was found.
 * @returns Such as `Pink Floyd · Album · 1973`, or null where there is nothing to say.
 */
const describeMusicMatch = (match: MusicCatalogueHit): string | null => {
  const parts = [
    match.artist,
    match.type === null ? null : RELEASE_TYPE_NAMES[match.type].one,
    match.year === null ? null : match.year.toString(),
    match.disambiguation,
  ].filter((part) => part !== null);

  return parts.length === 0 ? null : parts.join(' · ');
};

export { describeMusicMatch };
