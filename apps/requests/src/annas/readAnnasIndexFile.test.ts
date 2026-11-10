import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { readAnnasIndexFile } from './readAnnasIndexFile';
import { torrentKeyOf } from './torrentKeyOf';
import type { AnnasBookRecord } from './AnnasBookRecord';

const aLine = (md5: string) =>
  JSON.stringify({
    _id: `md5:${md5}`,
    _source: {
      file_unified_data: {
        title_best: `Book ${md5.slice(0, 4)}`,
        extension_best: 'epub',
        most_likely_language_codes: ['en'],
        identifiers_unified: {
          server_path: [`g3/libgenrs_fiction/libgenrs_fiction/381000/${md5}.epub`],
        },
      },
    },
  });

describe('readAnnasIndexFile', () => {
  it('hands on every wanted book in batches, and counts every record read', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'annas-'));
    const file = join(folder, 'aarecords__0.json.gz');
    const md5s = Array.from({ length: 2500 }, (_, at) => at.toString(16).padStart(32, '0'));

    await writeFile(file, gzipSync(`${md5s.map(aLine).join('\n')}\n\n`));

    const batches: AnnasBookRecord[][] = [];
    const reads: number[] = [];
    const read = await readAnnasIndexFile(
      file,
      {
        torrentKeys: new Set([torrentKeyOf('libgen_rs_fic', 'f_381000.torrent')]),
        languages: new Set(['en']),
        formats: new Set(['epub']),
      },
      {
        keep: (books) => {
          batches.push([...books]);

          return Promise.resolve();
        },
        onRead: (count) => {
          reads.push(count);
        },
      },
    );

    expect(read).toBe(2500);
    expect(batches.flat().map((book) => book.md5)).toEqual(md5s);
    expect(reads.at(-1)).toBe(2500);
  });
});
