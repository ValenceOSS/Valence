import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { albumArtworkUrl, artistImageUrl } from '@ValenceClient/music/fetchMusic';
import type { CatalogueEntry } from '@ValenceContracts/schemas/AdminCatalogue';

/**
 * Where a Catalogue title's picture is: its own from the library where it is held — a series by
 * its title's poster rather than an episode's — and otherwise the catalogue's poster, if any.
 *
 * @param entry - The title.
 * @returns The address, or nothing where there is no picture.
 */
const catalogueArtUrl = (
  entry: Pick<CatalogueEntry, 'art' | 'kind' | 'posterUrl'>,
): string | null => {
  const { art } = entry;

  if (art === null) {
    return entry.posterUrl;
  }

  switch (art.kind) {
    case 'media':
      return artworkUrl(art.id, 'poster', { isOfTitle: entry.kind === 'series', size: 'small' });
    case 'album':
      return albumArtworkUrl(art.id);
    case 'artist':
      return artistImageUrl(art.id);
    case 'book':
      return bookCoverUrl(art.id);
  }
};

export { catalogueArtUrl };
