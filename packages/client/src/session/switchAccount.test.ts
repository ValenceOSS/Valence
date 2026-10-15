import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { readCurrentProfile, writeCurrentProfile } from '@ValenceClient/profiles/currentProfile';
import { switchAccount } from './switchAccount';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('switchAccount', () => {
  it('asks the server to make another account the one in use, and forgets the face chosen', async () => {
    const fetch = vi.fn((_address: string, _init: RequestInit) =>
      Promise.resolve(new Response('{}')),
    );

    vi.stubGlobal('fetch', fetch);
    writeCurrentProfile('a-face');

    await expect(switchAccount('t2')).resolves.toBe(true);
    expect(fetch.mock.calls[0]?.[1].body).toBe(JSON.stringify({ sessionToken: 't2' }));
    expect(readCurrentProfile()).toBeNull();
  });

  it('says so where it could not move', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 401 }))),
    );

    await expect(switchAccount('t2')).resolves.toBe(false);
  });
});
