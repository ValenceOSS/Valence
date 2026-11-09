import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { readAnnasIndexFileOnThread } from './readAnnasIndexFileOnThread';
import { torrentKeyOf } from './torrentKeyOf';
import type { AnnasBookRecord } from './AnnasBookRecord';

const MD5 = 'b'.repeat(32);

const WANTED = {
  torrentKeys: new Set([torrentKeyOf('libgen_rs_fic', 'f_381000.torrent')]),
  languages: new Set(['en']),
  formats: new Set(['epub']),
};

describe('readAnnasIndexFileOnThread', () => {
  it('reads a file on a thread of its own and keeps what it finds here', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'annas-'));
    const file = join(folder, 'aarecords__0.json.gz');

    await writeFile(
      file,
      gzipSync(
        JSON.stringify({
          _id: `md5:${MD5}`,
          _source: {
            file_unified_data: {
              title_best: 'Dune',
              extension_best: 'epub',
              most_likely_language_codes: ['en'],
              identifiers_unified: {
                server_path: [`g3/libgenrs_fiction/libgenrs_fiction/381000/${MD5}.epub`],
              },
            },
          },
        }),
      ),
    );

    const kept: AnnasBookRecord[] = [];
    const read = await readAnnasIndexFileOnThread(file, WANTED, {
      keep: (books) => {
        kept.push(...books);

        return Promise.resolve();
      },
      onRead: () => {},
    });

    expect(read).toBe(1);
    expect(kept.map((book) => book.title)).toEqual(['Dune']);
  });

  it('says so where the file cannot be read', async () => {
    await expect(
      readAnnasIndexFileOnThread(join(tmpdir(), 'no-such-index.json.gz'), WANTED, {
        keep: () => Promise.resolve(),
        onRead: () => {},
      }),
    ).rejects.toThrow();
  });
});
