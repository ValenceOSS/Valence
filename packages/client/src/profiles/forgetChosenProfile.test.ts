import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetChosenProfile } from './forgetChosenProfile';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const fetchMock = vi.fn<FetchLike>();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('forgetChosenProfile', () => {
  it('asks the server to let go of the profile this device chose', async () => {
    await forgetChosenProfile();

    expect(fetchMock).toHaveBeenCalledWith('/api/profiles/chosen', { method: 'DELETE' });
  });

  it('says the server heard', async () => {
    await expect(forgetChosenProfile()).resolves.toBe(true);
  });

  it('says the server did not hear where it refused', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'No' }, { status: 500 }));

    await expect(forgetChosenProfile()).resolves.toBe(false);
  });

  it('says the server did not hear where it could not be reached, rather than throwing', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(forgetChosenProfile()).resolves.toBe(false);
  });
});
