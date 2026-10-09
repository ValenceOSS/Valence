import type { CatalogueAlbum, HeldInLibrary } from '@ValenceContracts/schemas/MediaRequest';
import type { CatalogueLookup } from '@ValenceServer/requests/catalogue/CatalogueLookup';

/**
 * What the libraries already hold of an artist's or an album's records, as a request for them is
 * told: each album held, at the quality its tracks are, so none is fetched again unless a lossy
 * copy is to be upgraded.
 *
 * @param lookup - The libraries, looked into by catalogue ids.
 * @param albums - The albums the request is for.
 * @returns What they hold.
 */
const heldAlbumsOf = async (
  lookup: Pick<CatalogueLookup, 'albumQualities'>,
  albums: readonly Pick<CatalogueAlbum, 'id'>[],
): Promise<HeldInLibrary> => ({
  mediaId: null,
  episodes: [],
  folder: null,
  seasonFolders: [],
  albums: [...(await lookup.albumQualities(albums.map((album) => album.id)))].map(
    ([id, quality]) => ({ id, quality }),
  ),
});

export { heldAlbumsOf };
