import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProfileLibrary } from '@ValenceContracts/schemas/ProfileLibraries';
import { fetchProfileLibraries } from './fetchProfileLibraries';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const fetchMock = vi.fn<FetchLike>();

const LIBRARY: ProfileLibrary = {
  id: 'lib-1',
  name: 'Films',
  mayView: true,
  maximumAge: 12,
  allowsUnrated: false,
  accountMaximumAge: null,
};

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(Response.json({ libraries: [LIBRARY] }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchProfileLibraries', () => {
  it('reads each library and what the profile is held to in it', async () => {
    await expect(fetchProfileLibraries('kid')).resolves.toEqual([LIBRARY]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/profiles/kid/libraries');
  });

  it('reads a profile on another account from the admin area', async () => {
    await fetchProfileLibraries('kid', 'acc-1');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/accounts/acc-1/profiles/kid/libraries');
  });

  it('keeps a profile’s id from reaching past its own place in the address', async () => {
    await fetchProfileLibraries('a/b');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/profiles/a%2Fb/libraries');
  });

  it('says so when the server refuses', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'No' }, { status: 404 }));

    await expect(fetchProfileLibraries('kid')).rejects.toThrow();
  });

  it('says so when the answer is not the shape it was promised', async () => {
    fetchMock.mockResolvedValue(Response.json({ libraries: [{ id: 'lib-1' }] }));

    await expect(fetchProfileLibraries('kid')).rejects.toThrow();
  });
});
