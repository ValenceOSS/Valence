import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { fetchLanguagesInUse } from './fetchLanguagesInUse';
import { readLanguagesInUse } from './readLanguagesInUse';

beforeEach(() => {
  installPlatform(aStillPlatform());
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('fetchLanguagesInUse', () => {
  it('asks the server and keeps its answer for the next launch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ server: 'de', profile: 'it' })))),
    );

    expect(await fetchLanguagesInUse()).toEqual({ server: 'de', profile: 'it' });
    expect(readLanguagesInUse()).toEqual({ server: 'de', profile: 'it' });
  });

  it('keeps what it last heard where the server cannot answer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ server: 'de', profile: null })))),
    );
    await fetchLanguagesInUse();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    expect(await fetchLanguagesInUse()).toEqual({ server: 'de', profile: null });
  });
});
