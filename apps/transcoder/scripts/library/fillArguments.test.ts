import { describe, expect, it } from 'vitest';
import { fillArguments } from './fillArguments';

const CWD = '/home/someone';

describe('fillArguments', () => {
  it('reads the library folder and the files to make inside it', () => {
    expect(
      fillArguments(['/media/Anime', 'Show (1998)/Season 01/Show - S01E01.mkv'], CWD),
    ).toStrictEqual({
      kind: 'fill',
      root: '/media/Anime',
      files: ['/media/Anime/Show (1998)/Season 01/Show - S01E01.mkv'],
      seconds: 2,
      cover: null,
      tags: [],
      chapters: 5,
    });
  });

  it('reads a relative library folder from where it was run', () => {
    const fill = fillArguments(['Anime', 'Film (2001).mp4'], CWD);

    expect(fill.kind === 'fill' && fill.root).toBe('/home/someone/Anime');
  });

  it('makes a file named twice only once', () => {
    const fill = fillArguments(['/media', 'a.mkv', './a.mkv'], CWD);

    expect(fill.kind === 'fill' && fill.files).toStrictEqual(['/media/a.mkv']);
  });

  it('takes how long the clips run, wherever it is given', () => {
    const fill = fillArguments(['--seconds', '30', '/media', 'a.mkv'], CWD);

    expect(fill.kind === 'fill' && fill.seconds).toBe(30);
  });

  it('refuses a length that is not a whole number of seconds', () => {
    expect(fillArguments(['/media', 'a.mkv', '--seconds', '1.5'], CWD).kind).toBe('refused');
    expect(fillArguments(['/media', 'a.mkv', '--seconds', '0'], CWD).kind).toBe('refused');
    expect(fillArguments(['/media', 'a.mkv', '--seconds'], CWD).kind).toBe('refused');
    expect(fillArguments(['/media', 'a.mkv', '--seconds', '0x10'], CWD).kind).toBe('refused');
    expect(fillArguments(['/media', 'a.mkv', '--seconds', '1e1'], CWD).kind).toBe('refused');
    expect(fillArguments(['/media', 'a.mkv', '--seconds', ' 30'], CWD).kind).toBe('refused');
  });

  it('refuses an option it does not know, rather than taking it for the folder', () => {
    const fill = fillArguments(['--seconds=30', '/media', 'a.mkv'], CWD);

    expect(fill.kind === 'refused' && fill.message).toContain('--seconds=30 is not an option');
  });

  it('says how to use it when there is nothing to make', () => {
    const fill = fillArguments(['/media'], CWD);

    expect(fill.kind === 'refused' && fill.message).toContain('Usage');
  });

  it('says how to use it when asked', () => {
    const fill = fillArguments(['--help'], CWD);

    expect(fill.kind === 'refused' && fill.message).toContain('Usage');
  });

  it('refuses a file that would land outside the library folder', () => {
    expect(fillArguments(['/media', '../elsewhere/a.mkv'], CWD).kind).toBe('refused');
    expect(fillArguments(['/media', 'Show/../../a.mkv'], CWD).kind).toBe('refused');
    expect(fillArguments(['/media', '/etc/a.mkv'], CWD).kind).toBe('refused');
  });

  it('keeps a name that only starts with two dots', () => {
    expect(fillArguments(['/media', '..Show/a.mkv'], CWD).kind).toBe('fill');
  });

  it('refuses a file the scanner would pass over', () => {
    const fill = fillArguments(['/media', 'Show/notes.txt'], CWD);

    expect(fill.kind === 'refused' && fill.message).toContain('passed over');
  });

  it('reads the extension whatever its case', () => {
    expect(fillArguments(['/media', 'Film (2001).MKV'], CWD).kind).toBe('fill');
  });

  it('makes music, spoken books and books as well as films', () => {
    expect(
      fillArguments(
        ['/media', 'Band/Album/01 - Song.flac', 'Author/Book/Book.m4b', 'Author/Novel/Novel.epub'],
        CWD,
      ).kind,
    ).toBe('fill');
  });

  it('says plainly where FFmpeg cannot write the file asked for', () => {
    const fill = fillArguments(['/media', 'Band/Album/01 - Song.ape'], CWD);

    expect(fill.kind === 'refused' && fill.message).toContain('FFmpeg cannot write a .ape file');
  });

  it('takes a cover from where it was run, and refuses one that is not a picture', () => {
    const fill = fillArguments(['/media', 'Band/Album/01.mp3', '--cover', 'art/front.png'], CWD);

    expect(fill.kind === 'fill' && fill.cover).toBe('/home/someone/art/front.png');
    expect(fillArguments(['/media', 'a.mp3', '--cover', 'notes.txt'], CWD).kind).toBe('refused');
    expect(fillArguments(['/media', 'a.mp3', '--cover'], CWD).kind).toBe('refused');
  });

  it('takes each tag it is given, keeping an equals sign in the value', () => {
    const fill = fillArguments(
      ['/media', 'a.flac', '--tag', 'MUSICBRAINZ_ALBUMID=abc', '--tag', 'COMMENT=a=b'],
      CWD,
    );

    expect(fill.kind === 'fill' && fill.tags).toStrictEqual([
      ['MUSICBRAINZ_ALBUMID', 'abc'],
      ['COMMENT', 'a=b'],
    ]);
  });

  it('refuses a tag with no key', () => {
    expect(fillArguments(['/media', 'a.flac', '--tag', '=abc'], CWD).kind).toBe('refused');
    expect(fillArguments(['/media', 'a.flac', '--tag', 'abc'], CWD).kind).toBe('refused');
  });

  it('takes how many chapters a spoken book is marked with', () => {
    const fill = fillArguments(['/media', 'Author/Book/Book.m4b', '--chapters', '12'], CWD);

    expect(fill.kind === 'fill' && fill.chapters).toBe(12);
    expect(fillArguments(['/media', 'a.m4b', '--chapters', '0'], CWD).kind).toBe('refused');
  });
});
