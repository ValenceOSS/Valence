import type { MediaRequestDraft, SeriesBook } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * What a series request asks for one of its books: the book by its Open Library id, in the series'
 * formats and library, for whoever asked for the series and approved as it is, and the narration
 * chosen for it.
 *
 * @param series - The series request.
 * @param book - The book.
 * @param narrationsWanted - The narration chosen, or null for a choice to be made.
 * @returns What to ask for it, or nothing where Open Library does not know it.
 */
const seriesBookDraft = (
  series: MediaRequestRecord,
  book: SeriesBook,
  narrationsWanted: string[] | null,
): MediaRequestDraft | null =>
  book.openLibraryId === null
    ? null
    : {
        kind: 'book',
        openLibraryId: book.openLibraryId,
        libraryId: series.libraryId,
        libraryPath: series.libraryPath,
        libraryLanguage: series.libraryLanguage,
        bookFormats: series.bookFormats ?? ['ebook'],
        narrationsWanted,
        requestedBy: {
          id: series.requestedById,
          name: series.requestedByName,
          askingProfile: series.requestedByProfile ?? null,
        },
        isApproved: series.approval === 'approved',
        origin: series.origin,
        catalogue: {
          title: book.title,
          year: book.year,
          artist: book.author,
          posterUrl: book.coverUrl,
          isEnded: true,
          narrations: book.narrations,
        },
      };

export { seriesBookDraft };
