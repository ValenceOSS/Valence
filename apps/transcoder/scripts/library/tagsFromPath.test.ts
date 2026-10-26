import { describe, expect, it } from 'vitest';
import { tagsFromPath } from './tagsFromPath';

describe('tagsFromPath', () => {
  it('reads a track filed under its artist and album', () => {
    expect(
      tagsFromPath('/music', '/music/Some Band/Some Album (1999)/03 - Some Song.flac'),
    ).toStrictEqual({
      artist: 'Some Band',
      album: 'Some Album',
      title: 'Some Song',
      track: 3,
      year: 1999,
      narrator: null,
    });
  });

  it('reads a chapter of a spoken book, and who reads it', () => {
    expect(
      tagsFromPath('/books', '/books/An Author/A Book (1965) {A Reader}/01 Chapter One.mp3'),
    ).toMatchObject({
      artist: 'An Author',
      album: 'A Book',
      title: 'Chapter One',
      track: 1,
      year: 1965,
      narrator: 'A Reader',
    });
  });

  it('reads a book in a series by its own folder, without the number it stands at', () => {
    expect(tagsFromPath('/books', '/books/An Author/A Series/2 - A Book/A Book.m4b')).toMatchObject(
      { artist: 'An Author', album: 'A Book', title: 'A Book', track: null },
    );
  });

  it('says nothing it cannot read', () => {
    expect(tagsFromPath('/music', '/music/Loose Song.mp3')).toStrictEqual({
      artist: null,
      album: null,
      title: 'Loose Song',
      track: null,
      year: null,
      narrator: null,
    });
  });

  it('reads an album as its own artist where there is only the one folder', () => {
    expect(tagsFromPath('/music', '/music/An Album/1. A Song.mp3')).toMatchObject({
      artist: null,
      album: 'An Album',
      title: 'A Song',
      track: 1,
    });
  });
});
