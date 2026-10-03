import { localIdOf } from './localIdOf';
import { linkedAddressOf } from './linkedAddressOf';
import type { CataloguePage } from './CataloguePageSchema';

/**
 * One page of a linked server's catalogue, as rows of this server's own: every id made this
 * server's, every reference between them followed, the library made the one this server keeps the
 * linked one in, and every path and artwork address made the route on the linked server it is read
 * from — so a page, a shelf or a search reads them as it reads anything else, and a file is only
 * ever read from the server that has it.
 *
 * @param page - The page, as the linked server sent it.
 * @param serverId - The linked server.
 * @param libraryId - The library this server keeps it in.
 * @returns The rows.
 */
const localRowsOf = (page: CataloguePage, serverId: string, libraryId: string) => {
  const here = (id: string) => localIdOf(serverId, id);
  const from = (route: string, has: string | null | undefined) =>
    has === null || has === undefined ? null : linkedAddressOf(serverId, route);

  return {
    series: page.series.map((row) => ({ ...row, id: here(row.id), libraryId })),
    mediaItems: page.mediaItems.map((row) => ({
      ...row,
      id: here(row.id),
      libraryId,
      path: linkedAddressOf(serverId, `/api/media/${row.id}`),
      parentId: row.parentId === null || row.parentId === undefined ? null : here(row.parentId),
      seriesId: row.seriesId === null || row.seriesId === undefined ? null : here(row.seriesId),
      posterUrl: from(`/api/media/${row.id}/image/poster`, row.posterUrl),
      backdropUrl: from(`/api/media/${row.id}/image/backdrop`, row.backdropUrl),
      logoUrl: from(`/api/media/${row.id}/image/logo`, row.logoUrl),
    })),
    artists: page.artists.map((row) => ({
      ...row,
      id: here(row.id),
      libraryId,
      imagePath: from(`/api/music/artists/${row.id}/image`, row.imagePath),
    })),
    albums: page.albums.map((row) => ({
      ...row,
      id: here(row.id),
      libraryId,
      artistId: here(row.artistId),
      artworkPath: from(`/api/music/albums/${row.id}/artwork`, row.artworkPath),
    })),
    tracks: page.tracks.map((row) => ({
      ...row,
      mediaItemId: here(row.mediaItemId),
      albumId: here(row.albumId),
    })),
    trackArtists: page.trackArtists.map((row) => ({
      ...row,
      mediaItemId: here(row.mediaItemId),
      artistId: here(row.artistId),
    })),
    books: page.books.map((row) => ({
      ...row,
      id: here(row.id),
      libraryId,
      path: linkedAddressOf(serverId, `/api/books/${row.id}`),
      posterUrl: from(`/api/books/${row.id}/cover`, row.posterUrl),
    })),
    chapters: page.chapters.map((row) => ({
      ...row,
      id: here(row.id),
      bookId: here(row.bookId),
      path: linkedAddressOf(serverId, `/api/books/${row.bookId}/chapters/${row.id}`),
    })),
  };
};

export { localRowsOf };
