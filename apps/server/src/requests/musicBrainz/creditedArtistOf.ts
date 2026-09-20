import type { MusicBrainzReleaseGroup } from '@ValenceServer/requests/musicBrainz/MusicBrainzReleaseGroupSchema';

/**
 * Who a release group is credited to, as its cover says it: each artist with the words that join
 * them, such as `Simon & Garfunkel`.
 *
 * @param group - The release group.
 * @returns The credit, or null where it has none.
 */
const creditedArtistOf = (group: Pick<MusicBrainzReleaseGroup, 'artist-credit'>): string | null =>
  group['artist-credit'].map((credit) => `${credit.name}${credit.joinphrase}`).join('') || null;

export { creditedArtistOf };
