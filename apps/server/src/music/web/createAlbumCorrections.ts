import { searchMusicCatalogue } from '@ValenceServer/requests/musicBrainz/searchMusicCatalogue';
import { findAppleAlbumCoverUrl } from './findAppleAlbumCoverUrl';
import type { MusicCatalogueHit } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicArtwork } from '@ValenceServer/music/scanMusicLibrary';
import type { AlbumCorrectingStore } from './AlbumCorrectingStore';
import type { MusicWeb } from './createMusicWeb';

type AlbumCorrections = {
  search: (query: string) => Promise<MusicCatalogueHit[]>;
  correct: (
    albumId: string,
    chosen: { releaseGroupId: string; title: string; artist: string | null },
  ) => Promise<boolean>;
  forget: (albumId: string) => Promise<boolean>;
};

/**
 * Tells an album in the library what record it really is, for one whose tags or whose looked-up
 * cover took it for another.
 *
 * The record is found on MusicBrainz and its cover taken from the Cover Art Archive, or from
 * Apple's catalogue where the archive has none. The album keeps its own title and songs; what
 * changes is which record it is known as and the cover drawn for it, and a scan leaves both alone
 * until the correction is forgotten, when the next scan reads them from the files again.
 *
 * @param options - Where albums are kept, the way out to the web, and where covers are drawn to.
 * @param options.store - Where albums are kept.
 * @param options.web - The way out to the web.
 * @param options.artwork - Where covers are drawn to.
 * @returns A way to search for the record, choose it and forget the choice.
 */
const createAlbumCorrections = ({
  store,
  web,
  artwork,
}: {
  store: AlbumCorrectingStore;
  web: MusicWeb;
  artwork: MusicArtwork;
}): AlbumCorrections => ({
  search: (query) => searchMusicCatalogue(web, query, 'album'),

  correct: async (albumId, chosen) => {
    const archived = await web.bytes(
      `https://coverartarchive.org/release-group/${encodeURIComponent(chosen.releaseGroupId)}/front-1200`,
    );
    const apple =
      archived !== null || chosen.artist === null
        ? null
        : await findAppleAlbumCoverUrl(web, { title: chosen.title, artistName: chosen.artist });
    const cover = archived ?? (apple === null ? null : await web.bytes(apple));
    const kept = cover === null ? null : await artwork.keep('album', albumId, { bytes: cover });

    return store.correctAlbum(albumId, chosen.releaseGroupId, kept);
  },

  forget: (albumId) => store.forgetAlbumCorrection(albumId),
});

export type { AlbumCorrections };

export { createAlbumCorrections };
