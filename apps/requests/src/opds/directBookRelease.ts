import { createHash } from 'node:crypto';
import type { Release } from '@ValenceContracts/schemas/Indexer';

const EBOOK_CATEGORY = 7020;

const AUDIOBOOK_CATEGORY = 3030;

type DirectBook = {
  key: string;
  title: string;
  authors: readonly string[];
  label: string;
  isHeard: boolean;
  sizeBytes: number | null;
  publishedAt: string | null;
  downloadUrl: string;
  infoUrl: string | null;
};

/**
 * Makes a release of a book that is downloaded directly rather than by torrent or usenet, named by
 * its title, its authors and its file type so it is matched and judged like any other book release.
 *
 * @param book - The book, with what makes it unique within its indexer as its key.
 * @param indexer - The indexer it came from.
 * @returns The release.
 */
const directBookRelease = (book: DirectBook, indexer: { id: string; name: string }): Release => {
  const by = book.authors.length === 0 ? '' : ` - ${book.authors.join(', ')}`;
  const published = book.publishedAt === null ? null : new Date(book.publishedAt);

  return {
    id: createHash('sha256').update(`${indexer.id}:${book.key}`).digest('hex').slice(0, 32),
    title: `${book.title}${by} [${book.label}]`,
    indexerId: indexer.id,
    indexerName: indexer.name,
    protocol: 'direct',
    sizeBytes: book.sizeBytes,
    seeders: null,
    leechers: null,
    grabs: null,
    publishedAt:
      published === null || Number.isNaN(published.getTime()) ? null : published.toISOString(),
    categories: [book.isHeard ? AUDIOBOOK_CATEGORY : EBOOK_CATEGORY],
    downloadUrl: book.downloadUrl,
    magnetUrl: null,
    infoUrl: book.infoUrl,
    infoHash: null,
    downloadFactor: null,
    uploadFactor: null,
    minimumRatio: null,
    minimumSeedSeconds: null,
  };
};

export type { DirectBook };

export { directBookRelease };
