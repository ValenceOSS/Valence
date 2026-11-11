import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { readKeptBookmarks } from './readKeptBookmarks';
import { writeKeptBookmarks } from './writeKeptBookmarks';

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

describe('writeKeptBookmarks', () => {
  it('keeps a book’s bookmarks where they are read back from, apart from other books', () => {
    const kept = {
      known: [],
      waiting: [{ kind: 'remove' as const, bookmarkId: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b01' }],
    };

    writeKeptBookmarks('book', kept);

    expect(readKeptBookmarks('book')).toEqual(kept);
    expect(readKeptBookmarks('other')).toEqual({ known: [], waiting: [] });
    expect([...held.keys()]).toEqual(['valence.books.bookmarks.book']);
  });
});
