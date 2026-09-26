import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { readBookmarks } from './readBookmarks';
import { writeBookmarks } from './writeBookmarks';

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

describe('writeBookmarks', () => {
  it('keeps the marked pages of a chapter, once each and in order', () => {
    writeBookmarks('book', 'chapter', [9, 2, 9, 5]);

    expect(held.get('valence.reader.bookmarks.book.chapter')).toBe('[2,5,9]');
  });

  it('keeps each chapter to itself', () => {
    writeBookmarks('book', 'first', [1]);
    writeBookmarks('book', 'second', [4]);

    expect(readBookmarks('book', 'first')).toEqual([1]);
    expect(readBookmarks('book', 'second')).toEqual([4]);
  });
});
