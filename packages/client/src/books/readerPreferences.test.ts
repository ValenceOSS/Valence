import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { readReaderPreferences, writeReaderPreferences } from './readerPreferences';

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

describe('readerPreferences', () => {
  it('reads a book the way it is meant to be read before anybody has chosen', () => {
    expect(readReaderPreferences('rightToLeft')).toEqual({
      isDouble: false,
      isOffset: true,
      fit: 'both',
      direction: 'rightToLeft',
      isScrolling: false,
      isAnimated: true,
      gap: 0,
    });
  });

  it('remembers what somebody chose, on the device', () => {
    writeReaderPreferences({
      isDouble: true,
      isOffset: false,
      fit: 'width',
      direction: 'leftToRight',
      isScrolling: true,
      isAnimated: false,
      gap: 12,
    });

    expect(readReaderPreferences('rightToLeft')).toEqual({
      isDouble: true,
      isOffset: false,
      fit: 'width',
      direction: 'leftToRight',
      isScrolling: true,
      isAnimated: false,
      gap: 12,
    });
  });

  it('does not read straight down for somebody who saved their settings before there was a choice', () => {
    held.set(
      'valence.reader',
      JSON.stringify({ isDouble: true, isOffset: true, fit: 'both', direction: 'leftToRight' }),
    );

    expect(readReaderPreferences('leftToRight').isScrolling).toBe(false);
    expect(readReaderPreferences('leftToRight').isAnimated).toBe(true);
    expect(readReaderPreferences('leftToRight').gap).toBe(0);
  });

  it('falls back entirely where what was kept is unreadable', () => {
    held.set('valence.reader', JSON.stringify({ fit: 'enormous' }));

    expect(readReaderPreferences('leftToRight').fit).toBe('both');
  });
});
