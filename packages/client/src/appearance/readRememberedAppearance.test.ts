import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { readRememberedAppearance } from './readRememberedAppearance';

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

describe('readRememberedAppearance', () => {
  it('has nothing before this device has asked', () => {
    expect(readRememberedAppearance()).toBeUndefined();
  });

  it('gives back how the server looked the last time', () => {
    held.set(
      'valence.appearance',
      JSON.stringify({ roundness: 'soft', brand: { name: 'Home Cinema', logo: '/logo.png' } }),
    );

    expect(readRememberedAppearance()?.brand).toMatchObject({
      name: 'Home Cinema',
      logo: '/logo.png',
    });
  });

  it('has nothing where what was kept no longer reads', () => {
    held.set('valence.appearance', '{not json');

    expect(readRememberedAppearance()).toBeUndefined();
  });
});
