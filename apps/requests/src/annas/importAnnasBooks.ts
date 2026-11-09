import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { z } from 'zod';
import { searchWordsOf } from '@ValenceRequests/annas/searchWordsOf';
import { torrentKeyOf } from '@ValenceRequests/annas/torrentKeyOf';
import { torrentOfServerPath } from '@ValenceRequests/annas/torrentOfServerPath';
import type { AnnasBookRecord } from '@ValenceRequests/annas/AnnasBookRecord';

const AT_ONCE = 1000;

const SAYS_HOW_FAR_EVERY = 100_000;

const MOST_TITLE = 1000;

const MOST_AUTHOR = 500;

const MOST_ADDRESS = 1000;

const MD5 = /^md5:([0-9a-f]{32})$/;

const RecordSchema = z.object({
  _id: z.string(),
  _source: z.object({
    file_unified_data: z.object({
      title_best: z.string().catch(''),
      author_best: z.string().nullish().catch(null),
      extension_best: z.string().nullish().catch(null),
      filesize_best: z.number().nullish().catch(null),
      year_best: z.string().nullish().catch(null),
      cover_url_best: z.string().nullish().catch(null),
      most_likely_language_codes: z.array(z.string()).catch([]),
      identifiers_unified: z
        .object({ server_path: z.array(z.string()).catch([]) })
        .catch({ server_path: [] }),
    }),
  }),
});

type ImportAnnasBooksOptions = {
  files: readonly string[];
  keep: (books: readonly AnnasBookRecord[]) => Promise<void>;
  torrentKeys: ReadonlySet<string>;
  languages: ReadonlySet<string>;
  formats: ReadonlySet<string>;
  onProgress?: (read: number, kept: number) => void;
  isStopped?: () => boolean;
};

/**
 * One record of Anna's Archive's index as a book this service keeps, where it is one: in a language
 * and a format it is asked for, and in a bulk torrent that is still offered, as a file of its own.
 *
 * @param line - The record, as one line of the index.
 * @param options - Which languages, formats and torrents are kept.
 * @returns The book, or nothing.
 */
const bookOf = (
  line: string,
  options: Pick<ImportAnnasBooksOptions, 'torrentKeys' | 'languages' | 'formats'>,
): AnnasBookRecord | null => {
  let read: ReturnType<typeof RecordSchema.safeParse>;

  try {
    read = RecordSchema.safeParse(JSON.parse(line));
  } catch {
    return null;
  }

  const md5 = read.success ? MD5.exec(read.data._id)?.[1] : undefined;

  if (!read.success || md5 === undefined) {
    return null;
  }

  const record = read.data._source.file_unified_data;
  const language = record.most_likely_language_codes[0] ?? '';
  const extension = (record.extension_best ?? '').toLowerCase();

  if (record.title_best.trim() === '' || !options.languages.has(language)) {
    return null;
  }

  if (!options.formats.has(extension)) {
    return null;
  }

  const found = record.identifiers_unified.server_path
    .map(torrentOfServerPath)
    .find((one) => one !== null && options.torrentKeys.has(torrentKeyOf(one.group, one.torrent)));

  if (found === undefined || found === null) {
    return null;
  }

  const title = record.title_best.trim().slice(0, MOST_TITLE);
  const author = record.author_best?.trim().slice(0, MOST_AUTHOR) || null;
  const year = Number(record.year_best);

  return {
    md5,
    title,
    author,
    language,
    extension,
    sizeBytes: record.filesize_best ?? null,
    year: Number.isInteger(year) && year > 0 ? year : null,
    coverUrl:
      record.cover_url_best === null || record.cover_url_best === undefined
        ? null
        : record.cover_url_best.slice(0, MOST_ADDRESS),
    torrentGroup: found.group,
    torrent: found.torrent,
    fileInTorrent: found.path,
    searchKey: searchWordsOf(`${title} ${author ?? ''}`).slice(0, MOST_TITLE + MOST_AUTHOR),
  };
};

/**
 * Reads Anna's Archive's index of books — gzipped files of one record to a line, as its mirrors are
 * set up from — and keeps the books this service can fetch, a batch at a time, saying how far it
 * has got as it goes. Lines are split on line breaks alone, since a description can hold a carriage
 * return of its own.
 *
 * @param options - The files, how to keep a batch, which torrents, languages and formats to keep,
 *   and how to say how far it has got and whether to stop.
 * @returns How many records were read and how many books kept.
 */
const importAnnasBooks = async (
  options: ImportAnnasBooksOptions,
): Promise<{ read: number; kept: number }> => {
  let read = 0;
  let kept = 0;
  let batch: AnnasBookRecord[] = [];

  const flush = async () => {
    await options.keep(batch);
    kept += batch.length;
    batch = [];
  };

  for (const file of options.files) {
    let rest = '';
    const stream = createReadStream(file).pipe(createGunzip());

    for await (const chunk of stream) {
      const lines = (rest + String(chunk)).split('\n');

      rest = lines.pop() ?? '';

      for (const line of lines) {
        if (line === '') {
          continue;
        }

        read += 1;

        const book = bookOf(line, options);

        if (book !== null) {
          batch.push(book);
        }

        if (batch.length >= AT_ONCE) {
          await flush();
        }

        if (read % SAYS_HOW_FAR_EVERY === 0) {
          options.onProgress?.(read, kept);
        }
      }

      if (options.isStopped?.() === true) {
        stream.destroy();
        await flush();

        return { read, kept };
      }
    }
  }

  await flush();
  options.onProgress?.(read, kept);

  return { read, kept };
};

export { importAnnasBooks };
