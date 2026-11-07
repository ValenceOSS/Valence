import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { readTextPreferences, writeTextPreferences } from './textPreferences';

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

describe('textPreferences', () => {
  it('sets text at a medium size on a white page before anybody has chosen', () => {
    expect(readTextPreferences()).toEqual({
      size: 'medium',
      spacing: 'normal',
      margins: 'normal',
      page: 'light',
      isDouble: true,
      gap: 24,
      isAnimated: true,
      isScrolling: false,
    });
  });

  it('remembers what somebody chose, on the device', () => {
    writeTextPreferences({
      size: 'larger',
      spacing: 'loose',
      margins: 'wide',
      page: 'sepia',
      isDouble: false,
      gap: 8,
      isAnimated: false,
      isScrolling: false,
    });

    expect(readTextPreferences()).toEqual({
      size: 'larger',
      spacing: 'loose',
      margins: 'wide',
      page: 'sepia',
      isDouble: false,
      gap: 8,
      isAnimated: false,
      isScrolling: false,
    });
  });

  it('keeps its settings apart from the page reader’s', () => {
    writeTextPreferences({
      size: 'small',
      spacing: 'tight',
      margins: 'narrow',
      page: 'light',
      isDouble: true,
      gap: 24,
      isAnimated: true,
      isScrolling: false,
    });

    expect([...held.keys()]).toEqual(['valence.reader.text']);
  });

  it('falls back one setting at a time where what was kept is unreadable', () => {
    held.set('valence.reader.text', JSON.stringify({ size: 'enormous', page: 'sepia' }));

    expect(readTextPreferences()).toEqual({
      size: 'medium',
      spacing: 'normal',
      margins: 'normal',
      page: 'sepia',
      isDouble: true,
      gap: 24,
      isAnimated: true,
      isScrolling: false,
    });
  });

  it('falls back entirely where what was kept is not even JSON', () => {
    held.set('valence.reader.text', '{not json');

    expect(readTextPreferences().size).toBe('medium');
  });

  it('keeps one set for every book on the device', () => {
    const night = { ...readTextPreferences(), size: 'larger' as const, page: 'sepia' as const };

    writeTextPreferences(night);

    expect(readTextPreferences()).toEqual(night);
  });
});
