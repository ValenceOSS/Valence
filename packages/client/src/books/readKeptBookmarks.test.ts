import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { readKeptBookmarks } from './readKeptBookmarks';
import type { Bookmark } from '@ValenceContracts/schemas/Book';

const held = new Map<string, string>();

const A_BOOKMARK: Bookmark = {
  id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b01',
  bookId: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001',
  chapterId: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0002',
  pageNumber: 3,
  fraction: null,
  pageShown: null,
  excerpt: null,
  picture: null,
  createdAt: '2026-11-11T00:00:00.000Z',
};

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

describe('readKeptBookmarks', () => {
  it('holds nothing for a book this device has not kept', () => {
    expect(readKeptBookmarks('book')).toEqual({ known: [], waiting: [] });
  });

  it('reads what the server last said and the changes still to send', () => {
    const kept = {
      known: [A_BOOKMARK],
      waiting: [
        { kind: 'add', bookmark: { ...A_BOOKMARK, id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b02' } },
        { kind: 'remove', bookmarkId: A_BOOKMARK.id },
      ],
    };

    held.set('valence.books.bookmarks.book', JSON.stringify(kept));

    expect(readKeptBookmarks('book')).toEqual(kept);
  });

  it('holds nothing rather than failing on what it cannot read', () => {
    held.set('valence.books.bookmarks.book', '{not json');
    held.set('valence.books.bookmarks.other', JSON.stringify({ known: 'everything' }));

    expect(readKeptBookmarks('book')).toEqual({ known: [], waiting: [] });
    expect(readKeptBookmarks('other')).toEqual({ known: [], waiting: [] });
  });
});
