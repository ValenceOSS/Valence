import { calendarDateOf } from '@ValenceServer/requests/musicBrainz/calendarDateOf';
import { releaseTypeOf } from '@ValenceServer/requests/musicBrainz/releaseTypeOf';
import type { CatalogueAlbum } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicBrainzReleaseGroup } from '@ValenceServer/requests/musicBrainz/MusicBrainzReleaseGroupSchema';

/**
 * A MusicBrainz release group as an album a request can wait for.
 *
 * @param group - The release group.
 * @returns The album.
 */
const catalogueAlbumOf = (group: MusicBrainzReleaseGroup): CatalogueAlbum => ({
  id: group.id,
  title: group.title,
  type: releaseTypeOf(group['primary-type'], group['secondary-types']),
  firstReleased: calendarDateOf(group['first-release-date']),
});

export { catalogueAlbumOf };
