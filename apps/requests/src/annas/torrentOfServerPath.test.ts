import { describe, expect, it } from 'vitest';
import { torrentOfServerPath } from './torrentOfServerPath';

describe('torrentOfServerPath', () => {
  it('finds a Library Genesis book in the torrent named for its thousand', () => {
    expect(
      torrentOfServerPath(
        'g3/libgenrs_fiction/libgenrs_fiction/381000/0c31c1b74360bc370e88e45394983e38.epub',
      ),
    ).toEqual({
      group: 'libgen_rs_fic',
      torrent: 'f_381000.torrent',
      path: '381000/0c31c1b74360bc370e88e45394983e38.epub',
    });
    expect(
      torrentOfServerPath(
        'g4/libgenrs_nonfiction/libgenrs_nonfiction/4220000/0c31a5e5f9d68d48f5beb22f04700669',
      )?.torrent,
    ).toBe('r_4220000.torrent');
  });

  it('finds a Z-Library book in the torrent named for its folder', () => {
    expect(
      torrentOfServerPath(
        'g6/zlib3_files/20250322/annas_archive_data__aacid__zlib3_files__20250322T160154Z--20250322T160155Z/aacid__zlib3_files__20250322T160154Z__93025328__JS5CXFtZ9aw7GeEMJzJ43w',
      ),
    ).toEqual({
      group: 'zlib',
      torrent: 'annas_archive_data__aacid__zlib3_files__20250322T160154Z--20250322T160155Z.torrent',
      path: 'annas_archive_data__aacid__zlib3_files__20250322T160154Z--20250322T160155Z/aacid__zlib3_files__20250322T160154Z__93025328__JS5CXFtZ9aw7GeEMJzJ43w',
    });
  });

  it('finds nothing for a collection whose books are not each a file of their own', () => {
    expect(torrentOfServerPath('g1/zlib2/pilimi-zlib2-21840000-21939999/21876107')).toBeNull();
    expect(torrentOfServerPath('g2/ia1lcpdf/g/ghostalphabetpoe0000magi.pdf')).toBeNull();
  });
});
