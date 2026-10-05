import { creditedArtistOf } from '@ValenceServer/requests/musicBrainz/creditedArtistOf';
import { releaseGroupCoverUrl } from '@ValenceServer/requests/musicBrainz/releaseGroupCoverUrl';
import { releaseTypeOf } from '@ValenceServer/requests/musicBrainz/releaseTypeOf';
import { yearOfDate } from '@ValenceServer/requests/musicBrainz/yearOfDate';
import type { MusicCatalogueHit } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicBrainzReleaseGroup } from '@ValenceServer/requests/musicBrainz/MusicBrainzReleaseGroupSchema';

/**
 * A MusicBrainz release group as an album to ask for: with its artist, its kind, the year it came
 * out and its cover.
 *
 * @param group - The release group.
 * @returns The album.
 */
const albumHitOf = (group: MusicBrainzReleaseGroup): MusicCatalogueHit => ({
  kind: 'album',
  musicBrainzId: group.id,
  title: group.title,
  artist: creditedArtistOf(group),
  disambiguation: group.disambiguation === '' ? null : group.disambiguation,
  type: releaseTypeOf(group['primary-type'], group['secondary-types']),
  year: yearOfDate(group['first-release-date']),
  coverUrl: releaseGroupCoverUrl(group.id, { title: group.title, artist: creditedArtistOf(group) }),
});

export { albumHitOf };
