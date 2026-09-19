import { describe, expect, it } from 'vitest';
import { sortTorrentFiles } from './sortTorrentFiles';

/**
 * A torrent's files, numbered in the order given.
 */
const filesOf = (...names: string[]) => names.map((name, index) => ({ index, name }));

describe('sortTorrentFiles', () => {
  it('keeps a film and its subtitles, and leaves out notes, pictures, links and samples', () => {
    expect(
      sortTorrentFiles(
        filesOf(
          'Dune (2021)/Dune.2021.1080p.mkv',
          'Dune (2021)/Dune.2021.1080p.en.srt',
          'Dune (2021)/Sample/dune-sample.mkv',
          'Dune (2021)/RARBG.txt',
          'Dune (2021)/poster.jpg',
          'Dune (2021)/Visit us.url',
          'Dune (2021)/Manual.pdf',
        ),
        'movies',
      ),
    ).toEqual({ unwanted: [2, 3, 4, 5, 6], program: null, hasWanted: true });
  });

  it('keeps an album’s tracks and its cover', () => {
    expect(
      sortTorrentFiles(
        filesOf('The Wall/01 - In the Flesh.flac', 'The Wall/cover.jpg', 'The Wall/rip.log'),
        'music',
      ),
    ).toEqual({ unwanted: [2], program: null, hasWanted: true });
  });

  it('keeps a book, a PDF among them', () => {
    expect(sortTorrentFiles(filesOf('Dune.epub', 'Dune.pdf', 'info.nfo'), 'books')).toEqual({
      unwanted: [2],
      program: null,
      hasWanted: true,
    });
  });

  it('names the program in a torrent that passes for a film', () => {
    expect(
      sortTorrentFiles(filesOf('Dune.2021.1080p.mkv.exe', 'Codec/Install.bat'), 'movies'),
    ).toEqual({ unwanted: [0, 1], program: 'Dune.2021.1080p.mkv.exe', hasWanted: false });
  });

  it('says where nothing in a torrent can be filed, as with one packed in archives', () => {
    expect(sortTorrentFiles(filesOf('Dune.rar', 'Dune.r00'), 'movies').hasWanted).toBe(false);
  });
});
