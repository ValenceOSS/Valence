import { availableParallelism } from 'node:os';
import { readAnnasIndexFileOnThread } from '@ValenceRequests/annas/readAnnasIndexFileOnThread';
import type { AnnasBookRecord } from '@ValenceRequests/annas/AnnasBookRecord';
import type { AnnasIndexReader } from '@ValenceRequests/annas/AnnasIndexReader';
import type { AnnasWanted } from '@ValenceRequests/annas/AnnasWanted';

const CORES_LEFT_FREE = 2;

type ImportAnnasBooksOptions = AnnasWanted & {
  files: readonly string[];
  keep: (books: readonly AnnasBookRecord[]) => Promise<void>;
  onProgress?: (read: number, kept: number) => void;
  onNote?: (problem: string) => void;
  threads?: number;
  readFile?: AnnasIndexReader;
};

type ImportedAnnasBooks = { read: number; kept: number; skipped: number; failedFiles: string[] };

/**
 * How many files to read at once: one a core, less a couple left for everything else the machine
 * does, and never more than there are files.
 *
 * @param files - How many files there are.
 * @returns How many to read at once.
 */
const threadsFor = (files: number): number =>
  Math.max(1, Math.min(files, availableParallelism() - CORES_LEFT_FREE));

/**
 * Reads Anna's Archive's index of books, several files at once on threads of their own, and keeps
 * the books this service can fetch, saying how far it has got as it goes. Each batch is kept whole
 * where it can be; where the database refuses one, its books are kept one at a time, so a single
 * book it cannot hold costs only that book. A file that cannot be read is told about and passed over,
 * and the rest are read all the same.
 *
 * @param options - The files, how to keep a batch, which torrents, languages and formats to keep,
 *   how to say how far it has got and what happened to each file, how many files to read at once, and what reads
 *   a file.
 * @returns How many records were read, how many books kept and passed over, and which files could
 *   not be read.
 */
const importAnnasBooks = async ({
  files,
  keep,
  torrentKeys,
  languages,
  formats,
  onProgress,
  onNote,
  threads = threadsFor(files.length),
  readFile = readAnnasIndexFileOnThread,
}: ImportAnnasBooksOptions): Promise<ImportedAnnasBooks> => {
  const readOf = new Map<string, number>();
  const failedFiles: string[] = [];
  let kept = 0;
  let skipped = 0;
  const totalRead = () => [...readOf.values()].reduce((sum, one) => sum + one, 0);

  const keepBatch = async (books: readonly AnnasBookRecord[]) => {
    const unique = [...new Map(books.map((book) => [book.md5, book])).values()];

    if (unique.length === 0) {
      return;
    }

    try {
      await keep(unique);
      kept += unique.length;
    } catch {
      for (const book of unique) {
        try {
          await keep([book]);
          kept += 1;
        } catch (error) {
          skipped += 1;
          onNote?.(
            `passed over ${book.md5}: ${error instanceof Error ? error.message.slice(0, 200) : ''}`,
          );
        }
      }
    }

    onProgress?.(totalRead(), kept);
  };

  const waiting = [...files];

  const readTheRest = async (): Promise<void> => {
    for (let file = waiting.shift(); file !== undefined; file = waiting.shift()) {
      const one = file;

      try {
        const read = await readFile(
          one,
          { torrentKeys, languages, formats },
          {
            keep: keepBatch,
            onRead: (count) => {
              readOf.set(one, count);
            },
          },
        );

        readOf.set(one, read);
        onNote?.(`finished ${one}: ${read.toString()} records`);
      } catch (error) {
        failedFiles.push(one);
        onNote?.(`could not read ${one}: ${error instanceof Error ? error.message : ''}`);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, threads) }, readTheRest));
  onProgress?.(totalRead(), kept);

  return { read: totalRead(), kept, skipped, failedFiles };
};

export type { ImportedAnnasBooks };

export { importAnnasBooks };
