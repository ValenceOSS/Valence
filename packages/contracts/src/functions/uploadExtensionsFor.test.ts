import { describe, expect, it } from 'vitest';
import { uploadExtensionsFor } from '@ValenceContracts/functions/uploadExtensionsFor';

describe('uploadExtensionsFor', () => {
  it('takes video and subtitles for films and programmes', () => {
    for (const kind of ['movies', 'shows'] as const) {
      const extensions = uploadExtensionsFor(kind);

      expect(extensions).toContain('mkv');
      expect(extensions).toContain('mp4');
      expect(extensions).toContain('srt');
      expect(extensions).not.toContain('mp3');
    }
  });

  it('takes tracks for music and nothing else', () => {
    const extensions = uploadExtensionsFor('music');

    expect(extensions).toContain('mp3');
    expect(extensions).toContain('flac');
    expect(extensions).not.toContain('mkv');
  });

  it('takes the formats a book comes in for books, to read and to hear', () => {
    expect(uploadExtensionsFor('books')).toEqual([
      'aac',
      'cbr',
      'cbz',
      'epub',
      'flac',
      'm4a',
      'm4b',
      'mp3',
      'oga',
      'ogg',
      'opus',
      'pdf',
      'rar',
      'zip',
    ]);
  });

  it('lists each in order, without a dot', () => {
    for (const kind of ['movies', 'shows', 'music', 'books'] as const) {
      const extensions = uploadExtensionsFor(kind);

      expect(extensions).toEqual([...extensions].toSorted());
      expect(extensions.every((extension) => !extension.startsWith('.'))).toBe(true);
    }
  });
});
