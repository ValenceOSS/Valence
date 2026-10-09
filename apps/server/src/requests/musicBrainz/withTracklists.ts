import type { CatalogueAlbum } from '@ValenceContracts/schemas/MediaRequest';
import type { Tracklist } from '@ValenceServer/requests/musicBrainz/readTracklists';

const HOLDING_SINGLES = new Set<CatalogueAlbum['type']>(['album', 'ep', 'mixtape']);

/**
 * An artist's albums with how many tracks the longest edition of each has, and each single marked
 * where every one of its tracks is on one of their albums, EPs or mixtapes already, so a request
 * for the artist need not fetch it.
 *
 * @param albums - The albums.
 * @param tracklists - The longest edition of each, by its release group.
 * @returns The albums, with what their tracks say.
 */
const withTracklists = (
  albums: readonly CatalogueAlbum[],
  tracklists: ReadonlyMap<string, Tracklist>,
): CatalogueAlbum[] => {
  const onAlbums = new Set(
    albums
      .filter((album) => HOLDING_SINGLES.has(album.type))
      .flatMap((album) => tracklists.get(album.id)?.recordings ?? []),
  );

  return albums.map((album) => {
    const tracklist = tracklists.get(album.id);

    return tracklist === undefined
      ? album
      : {
          ...album,
          trackCount: tracklist.trackCount > 0 ? tracklist.trackCount : null,
          ...(album.type === 'single'
            ? {
                isOnAnAlbum:
                  tracklist.recordings.length > 0 &&
                  tracklist.recordings.every((recording) => onAlbums.has(recording)),
              }
            : {}),
        };
  });
};

export { withTracklists };
