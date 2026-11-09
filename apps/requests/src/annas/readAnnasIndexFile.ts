import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { bookOfAnnasRecord } from '@ValenceRequests/annas/bookOfAnnasRecord';
import type { AnnasBookRecord } from '@ValenceRequests/annas/AnnasBookRecord';
import type { AnnasIndexReader } from '@ValenceRequests/annas/AnnasIndexReader';

const AT_ONCE = 1000;

const SAYS_HOW_FAR_EVERY = 50_000;

const READ_AT_ONCE_BYTES = 8 * 1024 * 1024;

/**
 * Reads one gzipped file of Anna's Archive's index, one record to a line, and hands on the books
 * wanted from it a batch at a time, saying how many records it has read as it goes. The file is read
 * in large pieces, so several read side by side from one spinning disk do not keep it seeking. Lines
 * are split on line breaks alone, since a description can hold a carriage return of its own.
 *
 * @param file - The file.
 * @param wanted - Which languages, formats and torrents are kept.
 * @param sink - Where each batch goes, waited for before reading on, and how far it has got.
 * @returns How many records were read.
 */
const readAnnasIndexFile: AnnasIndexReader = async (file, wanted, sink) => {
  let read = 0;
  let rest = '';
  let batch: AnnasBookRecord[] = [];
  const stream = createReadStream(file, { highWaterMark: READ_AT_ONCE_BYTES }).pipe(
    createGunzip({ chunkSize: 1024 * 1024 }),
  );

  for await (const chunk of stream) {
    const lines = (rest + String(chunk)).split('\n');

    rest = lines.pop() ?? '';

    for (const line of lines) {
      if (line === '') {
        continue;
      }

      read += 1;

      const book = bookOfAnnasRecord(line, wanted);

      if (book !== null) {
        batch.push(book);
      }

      if (read % SAYS_HOW_FAR_EVERY === 0) {
        sink.onRead(read);
      }
    }

    if (batch.length >= AT_ONCE) {
      await sink.keep(batch);
      batch = [];
    }
  }

  const last = rest === '' ? null : bookOfAnnasRecord(rest, wanted);

  if (rest !== '') {
    read += 1;
  }

  await sink.keep(last === null ? batch : [...batch, last]);
  sink.onRead(read);

  return read;
};

export { readAnnasIndexFile };
