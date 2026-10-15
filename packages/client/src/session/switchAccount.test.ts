import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { switchAccount } from './switchAccount';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('switchAccount', () => {
  it('says so where it could not move', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 401 }))),
    );

    await expect(switchAccount('t2')).resolves.toBe(false);
  });
});
