import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { readGuestPlace, writeGuestPlace } from './guestPlace';

const held = new Map<string, string>();

beforeEach(() => {
  held.clear();
  installATestClient({
    store: {
      read: (key) => held.get(key) ?? null,
      write: (key, value) => {
        held.set(key, value);
      },
      forget: (key) => {
        held.delete(key);
      },
    },
  });
});

afterEach(() => {
  forgetPlatform();
});

describe('guestPlace', () => {
  it('knows nothing of a book not opened on this device', () => {
    expect(readGuestPlace('book-1')).toBeNull();
  });

  it('keeps where a guest got to, for that book alone', () => {
    writeGuestPlace('book-1', { chapterId: 'c', pageNumber: null, fraction: 0.4 });

    expect(readGuestPlace('book-1')).toEqual({ chapterId: 'c', pageNumber: null, fraction: 0.4 });
    expect(readGuestPlace('book-2')).toBeNull();
  });

  it('forgets a place it cannot read rather than failing', () => {
    held.set('valence.shared.book-1', '{not json');

    expect(readGuestPlace('book-1')).toBeNull();
  });
});
