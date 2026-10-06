import { describe, expect, it } from 'vitest';
import { theBrowsersStore } from '@ValenceClient/platform/theBrowsersStore';
import type { KeptStorage } from '@ValenceClient/platform/KeptStorage';

/**
 * Storage kept in memory, as a browser's would be.
 *
 * @returns The storage.
 */
const aStorage = (): KeptStorage => {
  const kept = new Map<string, string>();

  return {
    getItem: (key) => kept.get(key) ?? null,
    setItem: (key, value) => {
      kept.set(key, value);
    },
    removeItem: (key) => {
      kept.delete(key);
    },
  };
};

/**
 * Storage that refuses everything, as a private window can.
 *
 * @returns The storage.
 */
const aRefusingStorage = (): KeptStorage => ({
  getItem: () => {
    throw new Error('private mode');
  },
  setItem: () => {
    throw new Error('quota exceeded');
  },
  removeItem: () => {
    throw new Error('private mode');
  },
});

describe('theBrowsersStore', () => {
  const storage = aStorage();
  const store = theBrowsersStore(() => storage);
  const refusing = theBrowsersStore(aRefusingStorage);

  it('reads back what it was given', () => {
    store.write('valence.thing', 'kept');

    expect(store.read('valence.thing')).toBe('kept');
  });

  it('says nothing for something it was never given', () => {
    expect(store.read('valence.nothing')).toBeNull();
  });

  it('forgets what it is asked to forget', () => {
    store.write('valence.thing', 'kept');
    store.forget('valence.thing');

    expect(store.read('valence.thing')).toBeNull();
  });

  it('answers with nothing where storage is refused, as a private window refuses it', () => {
    expect(refusing.read('valence.thing')).toBeNull();
  });

  it('carries on where a write is refused, rather than stopping anybody watching', () => {
    expect(() => {
      refusing.write('valence.thing', 'kept');
    }).not.toThrow();
  });

  it('carries on where forgetting is refused too', () => {
    expect(() => {
      refusing.forget('valence.thing');
    }).not.toThrow();
  });
});
