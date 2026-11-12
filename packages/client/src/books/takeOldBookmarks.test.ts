import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { takeOldBookmarks } from './takeOldBookmarks';

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

describe('takeOldBookmarks', () => {
  it('finds nothing where the phone kept nothing', () => {
    expect(takeOldBookmarks('book', ['one', 'two'])).toEqual([]);
  });

  it('turns kept pages and places in the text into bookmarks, and forgets the old copies', () => {
    held.set('valence.reader.bookmarks.book.one', JSON.stringify([4, 4, 9]));
    held.set('valence.reader.bookmarks.book.two:text', JSON.stringify([250_000]));
    held.set('valence.reader.bookmarks.other.one', JSON.stringify([1]));

    const taken = takeOldBookmarks('book', ['one', 'two']);

    expect(
      taken.map(({ bookId, chapterId, pageNumber, fraction, pageShown, excerpt, picture }) => ({
        bookId,
        chapterId,
        pageNumber,
        fraction,
        pageShown,
        excerpt,
        picture,
      })),
    ).toEqual([
      {
        bookId: 'book',
        chapterId: 'one',
        pageNumber: 4,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
      },
      {
        bookId: 'book',
        chapterId: 'one',
        pageNumber: 9,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
      },
      {
        bookId: 'book',
        chapterId: 'two',
        pageNumber: null,
        fraction: 0.25,
        pageShown: null,
        excerpt: null,
        picture: null,
      },
    ]);
    expect(new Set(taken.map((one) => one.id)).size).toBe(3);
    expect([...held.keys()]).toEqual(['valence.reader.bookmarks.other.one']);
  });

  it('takes them only once', () => {
    held.set('valence.reader.bookmarks.book.one', JSON.stringify([4]));

    expect(takeOldBookmarks('book', ['one'])).toHaveLength(1);
    expect(takeOldBookmarks('book', ['one'])).toEqual([]);
  });

  it('forgets old copies it cannot read rather than failing', () => {
    held.set('valence.reader.bookmarks.book.one', '{not json');
    held.set('valence.reader.bookmarks.book.two', JSON.stringify(['page one', -2]));

    expect(takeOldBookmarks('book', ['one', 'two'])).toEqual([]);
    expect(held.size).toBe(0);
  });
});
