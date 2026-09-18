import { describe, expect, it } from 'vitest';
import { LIBRARY_PARTS, LIBRARY_PARTS_BY_KIND, LibraryPartSchema } from './LibraryPart';

describe('LibraryPartSchema', () => {
  it('reads each part by name', () => {
    for (const part of LIBRARY_PARTS) {
      expect(LibraryPartSchema.parse(part)).toBe(part);
    }
  });

  it('refuses a part that does not exist', () => {
    expect(LibraryPartSchema.safeParse('everything').success).toBe(false);
  });
});

describe('LIBRARY_PARTS_BY_KIND', () => {
  it('offers films and shows the same parts', () => {
    expect(LIBRARY_PARTS_BY_KIND.movies).toEqual(LIBRARY_PARTS_BY_KIND.shows);
  });

  it('offers music only what a music library has', () => {
    expect(LIBRARY_PARTS_BY_KIND.music).toEqual([
      'albumCovers',
      'artistPictures',
      'lyrics',
      'musicVideos',
    ]);
  });

  it('offers books nothing, since nothing about a book is fetched', () => {
    expect(LIBRARY_PARTS_BY_KIND.books).toEqual([]);
  });

  it('offers every part to some kind of library', () => {
    const offered = new Set(Object.values(LIBRARY_PARTS_BY_KIND).flat());

    expect([...offered].sort()).toEqual([...LIBRARY_PARTS].sort());
  });
});
