import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { torrentKeyOf } from './torrentKeyOf';
import { importAnnasBooks } from './importAnnasBooks';
import type { AnnasBookRecord } from './AnnasBookRecord';

const aRecord = (md5: string, title: string, extension: string, language: string, path: string) =>
  JSON.stringify({
    _id: `md5:${md5}`,
    _source: {
      file_unified_data: {
        title_best: title,
        author_best: 'Robert Jordan',
        extension_best: extension,
        filesize_best: 1000,
        year_best: '1990',
        cover_url_best: null,
        most_likely_language_codes: [language],
        identifiers_unified: { server_path: [path] },
      },
    },
  });

const FICTION = (md5: string) => `g3/libgenrs_fiction/libgenrs_fiction/381000/${md5}.epub`;

describe('importAnnasBooks', () => {
  it('keeps the books in the languages, formats and torrents asked for, and no others', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'annas-'));
    const file = join(folder, 'aarecords__0.json.gz');
    const md5 = (letter: string) => letter.repeat(32);

    await writeFile(
      file,
      gzipSync(
        [
          aRecord(
            md5('a'),
            'The Eye of the World\\rwith a carriage return',
            'epub',
            'en',
            FICTION(md5('a')),
          ),
          aRecord(md5('b'), 'Une autre', 'epub', 'fr', FICTION(md5('b'))),
          aRecord(md5('c'), 'A Mobi', 'mobi', 'en', FICTION(md5('c'))),
          aRecord(md5('d'), 'Packed', 'epub', 'en', 'g1/zlib2/pilimi-zlib2-1-2/5'),
          'not json at all',
        ].join('\n'),
      ),
    );

    const kept: AnnasBookRecord[] = [];
    const counted = await importAnnasBooks({
      files: [file],
      keep: (books) => {
        kept.push(...books);

        return Promise.resolve();
      },
      torrentKeys: new Set([torrentKeyOf('libgen_rs_fic', 'f_381000.torrent')]),
      languages: new Set(['en', 'ja']),
      formats: new Set(['epub', 'pdf']),
    });

    expect(counted).toEqual({ read: 5, kept: 1 });
    expect(kept.map((book) => [book.md5, book.torrent, book.fileInTorrent])).toEqual([
      [md5('a'), 'f_381000.torrent', `381000/${md5('a')}.epub`],
    ]);
  });
});
