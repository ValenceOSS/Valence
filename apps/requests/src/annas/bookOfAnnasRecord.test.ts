import { describe, expect, it } from 'vitest';
import { bookOfAnnasRecord } from './bookOfAnnasRecord';
import { torrentKeyOf } from './torrentKeyOf';

const MD5 = 'a'.repeat(32);

const WANTED = {
  torrentKeys: new Set([torrentKeyOf('libgen_rs_fic', 'f_381000.torrent')]),
  languages: new Set(['en']),
  formats: new Set(['epub']),
};

const aLine = (title: string, author: string | null) =>
  JSON.stringify({
    _id: `md5:${MD5}`,
    _source: {
      file_unified_data: {
        title_best: title,
        author_best: author,
        extension_best: 'EPUB',
        filesize_best: 1000,
        year_best: 'unknown',
        cover_url_best: '',
        most_likely_language_codes: ['en'],
        identifiers_unified: {
          server_path: [`g3/libgenrs_fiction/libgenrs_fiction/381000/${MD5}.epub`],
        },
      },
    },
  });

describe('bookOfAnnasRecord', () => {
  it('keeps a wanted book without the NUL characters a database cannot hold', () => {
    expect(bookOfAnnasRecord(aLine('Dune\u0000', 'Frank\u0000 Herbert'), WANTED)).toMatchObject({
      md5: MD5,
      title: 'Dune',
      author: 'Frank Herbert',
      extension: 'epub',
      year: null,
      coverUrl: null,
      fileInTorrent: `381000/${MD5}.epub`,
    });
  });

  it('passes over a record with no title, and a line that is not a record', () => {
    expect(bookOfAnnasRecord(aLine('\u0000 ', null), WANTED)).toBeNull();
    expect(bookOfAnnasRecord('{', WANTED)).toBeNull();
    expect(bookOfAnnasRecord('{}', WANTED)).toBeNull();
  });
});
