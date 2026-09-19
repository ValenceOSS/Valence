import type { RequestedAlbumStore } from '@ValenceServer/requests/albums/RequestedAlbumStore';

/**
 * Finds the album a request filed, once the library has read it: by the MusicBrainz release group
 * its tracks are tagged with, or else as the album the library found in the folder it was filed
 * into — which is then marked as that release group, so it is known by it from then on.
 *
 * @param albums - The music library's albums.
 * @param libraryId - The library it was filed into.
 * @param releaseGroupId - The album's release group, as the request knows it.
 * @param folder - The folder it was filed into.
 * @returns The album, or null where the library found none.
 */
const tieRequestedAlbum = async (
  albums: RequestedAlbumStore,
  libraryId: string,
  releaseGroupId: string,
  folder: string,
): Promise<string | null> => {
  const tagged = await albums.findByReleaseGroup(libraryId, releaseGroupId);

  if (tagged !== null) {
    return tagged;
  }

  const filed = await albums.findUnder(libraryId, folder);

  if (filed !== null) {
    await albums.setReleaseGroup(filed, releaseGroupId);
  }

  return filed;
};

export { tieRequestedAlbum };
