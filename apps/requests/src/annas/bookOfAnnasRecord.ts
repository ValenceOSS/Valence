import { z } from 'zod';
import { searchWordsOf } from '@ValenceRequests/annas/searchWordsOf';
import { torrentKeyOf } from '@ValenceRequests/annas/torrentKeyOf';
import { torrentOfServerPath } from '@ValenceRequests/annas/torrentOfServerPath';
import type { AnnasBookRecord } from '@ValenceRequests/annas/AnnasBookRecord';
import type { AnnasWanted } from '@ValenceRequests/annas/AnnasWanted';

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

/**
 * Text as a database can keep it, without the NUL characters a few records carry.
 *
 * @param text - The text.
 * @returns The text, trimmed, without them.
 */
const keepable = (text: string): string => text.replaceAll('\u0000', '').trim();

/**
 * One record of Anna's Archive's index as a book this service keeps, where it is one: in a language
 * and a format it is asked for, and in a bulk torrent that is still offered, as a file of its own.
 *
 * @param line - The record, as one line of the index.
 * @param wanted - Which languages, formats and torrents are kept.
 * @returns The book, or nothing.
 */
const bookOfAnnasRecord = (line: string, wanted: AnnasWanted): AnnasBookRecord | null => {
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
  const extension = keepable(record.extension_best ?? '').toLowerCase();
  const title = keepable(record.title_best).slice(0, MOST_TITLE);

  if (title === '' || !wanted.languages.has(language) || !wanted.formats.has(extension)) {
    return null;
  }

  const found = record.identifiers_unified.server_path
    .map(torrentOfServerPath)
    .find((one) => one !== null && wanted.torrentKeys.has(torrentKeyOf(one.group, one.torrent)));

  if (found === undefined || found === null) {
    return null;
  }

  const author = keepable(record.author_best ?? '').slice(0, MOST_AUTHOR) || null;
  const coverUrl = keepable(record.cover_url_best ?? '').slice(0, MOST_ADDRESS) || null;
  const year = Number(record.year_best);

  return {
    md5,
    title,
    author,
    language,
    extension,
    sizeBytes: record.filesize_best ?? null,
    year: Number.isInteger(year) && year > 0 ? year : null,
    coverUrl,
    torrentGroup: found.group,
    torrent: found.torrent,
    fileInTorrent: keepable(found.path),
    searchKey: searchWordsOf(`${title} ${author ?? ''}`).slice(0, MOST_TITLE + MOST_AUTHOR),
  };
};

export { bookOfAnnasRecord };
