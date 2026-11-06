import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { rememberAppearance } from './rememberAppearance';

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

describe('rememberAppearance', () => {
  it('keeps how the server looks on the device, and passes it on', () => {
    const appearance = {
      roundness: 'default' as const,
      brand: { name: 'Home Cinema', accent: null, description: null, logo: null },
    };

    expect(rememberAppearance(appearance)).toBe(appearance);
    expect(held.get('valence.appearance')).toContain('Home Cinema');
  });
});
