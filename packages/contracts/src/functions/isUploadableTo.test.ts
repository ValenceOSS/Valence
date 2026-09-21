import { describe, expect, it } from 'vitest';
import { isUploadableTo } from '@ValenceContracts/functions/isUploadableTo';

describe('isUploadableTo', () => {
  it('takes video and subtitles for films and programmes', () => {
    for (const kind of ['movies', 'shows'] as const) {
      expect(isUploadableTo(kind, 'Arrival (2016).mkv')).toBe(true);
      expect(isUploadableTo(kind, 'Arrival (2016).en.srt')).toBe(true);
      expect(isUploadableTo(kind, 'cover.jpg')).toBe(false);
    }
  });

  it('takes tracks for music and nothing else', () => {
    expect(isUploadableTo('music', '01 Intro.flac')).toBe(true);
    expect(isUploadableTo('music', 'Arrival.mkv')).toBe(false);
  });

  it('takes the formats a book comes in for books, including an archive of pages', () => {
    for (const name of ['a.cbz', 'a.cbr', 'a.pdf', 'a.epub', 'a.zip', 'a.rar']) {
      expect(isUploadableTo('books', name)).toBe(true);
    }

    expect(isUploadableTo('books', 'a.mkv')).toBe(false);
  });

  it('does not mind the case of the extension', () => {
    expect(isUploadableTo('movies', 'ARRIVAL.MKV')).toBe(true);
  });

  it('judges a path by the file at the end of it', () => {
    expect(isUploadableTo('shows', 'Show/Season 1/S01E01.mp4')).toBe(true);
    expect(isUploadableTo('shows', 'Show.mkv/notes.txt')).toBe(false);
  });

  it('never takes a name that starts with a dot, nor one with no extension', () => {
    expect(isUploadableTo('movies', '.hidden.mkv')).toBe(false);
    expect(isUploadableTo('movies', 'Arrival')).toBe(false);
  });
});
