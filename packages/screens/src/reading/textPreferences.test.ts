import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { readTextPreferences, writeTextPreferences } from './textPreferences';

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

describe('textPreferences', () => {
  it('sets text at a medium size on a dark page before anybody has chosen', () => {
    expect(readTextPreferences()).toEqual({
      size: 'medium',
      spacing: 'normal',
      margins: 'normal',
      page: 'dark',
    });
  });

  it('remembers what somebody chose, on the device', () => {
    writeTextPreferences({ size: 'larger', spacing: 'loose', margins: 'wide', page: 'sepia' });

    expect(readTextPreferences()).toEqual({
      size: 'larger',
      spacing: 'loose',
      margins: 'wide',
      page: 'sepia',
    });
  });

  it('keeps its settings apart from the page reader’s', () => {
    writeTextPreferences({ size: 'small', spacing: 'tight', margins: 'narrow', page: 'light' });

    expect([...held.keys()]).toEqual(['valence.reader.text']);
  });

  it('falls back one setting at a time where what was kept is unreadable', () => {
    held.set('valence.reader.text', JSON.stringify({ size: 'enormous', page: 'sepia' }));

    expect(readTextPreferences()).toEqual({
      size: 'medium',
      spacing: 'normal',
      margins: 'normal',
      page: 'sepia',
    });
  });

  it('falls back entirely where what was kept is not even JSON', () => {
    held.set('valence.reader.text', '{not json');

    expect(readTextPreferences().size).toBe('medium');
  });
});
