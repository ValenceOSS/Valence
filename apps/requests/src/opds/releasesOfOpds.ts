import { BOOK_FILE_TYPES } from '@ValenceRequests/opds/BOOK_FILE_TYPES';
import { directBookRelease } from '@ValenceRequests/opds/directBookRelease';
import type { OpdsEntry } from '@ValenceRequests/opds/OpdsEntry';
import type { Release } from '@ValenceContracts/schemas/Indexer';

/**
 * Turns the books in an OPDS feed into releases: one for each file type a book can be downloaded
 * as that Valence files as a book, fetched directly rather than by torrent or usenet.
 *
 * @param entries - The books.
 * @param indexer - The catalogue they came from.
 * @returns The releases.
 */
const releasesOfOpds = (
  entries: readonly OpdsEntry[],
  indexer: { id: string; name: string },
): Release[] =>
  entries.flatMap((entry) =>
    entry.acquisitions.flatMap((link): Release[] => {
      const type = BOOK_FILE_TYPES[link.type];

      return type === undefined
        ? []
        : [
            directBookRelease(
              {
                key: link.href,
                title: entry.title,
                authors: entry.authors,
                label: type.label,
                isHeard: type.isHeard,
                sizeBytes: link.length,
                publishedAt: entry.updatedAt,
                downloadUrl: link.href,
                infoUrl: entry.infoUrl,
              },
              indexer,
            ),
          ];
    }),
  );

export { releasesOfOpds };
