import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { readBookmarks } from './readBookmarks';

const held = new Map<string, string>();

beforeEach(() => {
  held.clear();
  installPlatform(
    aFakePlatform({
      store: {
        read: (key) => held.get(key) ?? null,
        write: (key, value) => {
          held.set(key, value);
        },
        forget: (key) => {
          held.delete(key);
        },
      },
    }),
  );
});

afterEach(() => {
  forgetPlatform();
});

describe('readBookmarks', () => {
  it('has nothing marked in a chapter nobody has marked', () => {
    expect(readBookmarks('book', 'chapter')).toEqual([]);
  });

  it('reads the marked pages of one chapter, in order', () => {
    held.set('valence.reader.bookmarks.book.chapter', JSON.stringify([12, 3, 7]));
    held.set('valence.reader.bookmarks.book.other', JSON.stringify([1]));

    expect(readBookmarks('book', 'chapter')).toEqual([3, 7, 12]);
  });

  it('forgets marks it cannot read rather than failing', () => {
    held.set('valence.reader.bookmarks.book.chapter', JSON.stringify(['page one', -2]));

    expect(readBookmarks('book', 'chapter')).toEqual([]);
  });
});
