import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { ASKING_FOR } from './ASKING_FOR';
import { hasChosenThisLaunch } from './hasChosenThisLaunch';
import { launchStore } from './launchStore';
import { noteChosenThisLaunch } from './noteChosenThisLaunch';
import { switchProfile } from './switchProfile';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const fetchMock = vi.fn<FetchLike>();

beforeEach(() => {
  installPlatform(aFakePlatform({ thisLaunch: aFakePlatform().store }));
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('switchProfile', () => {
  it('forgets that anybody chose this launch, so the app asks again', async () => {
    noteChosenThisLaunch('acc-1');

    await switchProfile(new QueryClient());

    expect(hasChosenThisLaunch('acc-1')).toBe(false);
  });

  it('remembers the profile somebody picked, so its PIN is asked for first', async () => {
    await switchProfile(new QueryClient(), 'p-2');

    expect(launchStore().read(ASKING_FOR)).toBe('p-2');
  });

  it('forgets any profile picked before where nobody was picked this time', async () => {
    launchStore().write(ASKING_FOR, 'p-2');

    await switchProfile(new QueryClient());

    expect(launchStore().read(ASKING_FOR)).toBeNull();
  });

  it('asks the server to let go of the profile this device chose', async () => {
    await switchProfile(new QueryClient());

    expect(fetchMock).toHaveBeenCalledWith('/api/profiles/chosen', { method: 'DELETE' });
  });

  it('reads the profiles again once the server has let go', async () => {
    const cache = new QueryClient();
    const invalidate = vi.spyOn(cache, 'invalidateQueries');

    await switchProfile(cache);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['profiles'] });
  });

  it('still asks again where the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    noteChosenThisLaunch('acc-1');

    const cache = new QueryClient();
    const invalidate = vi.spyOn(cache, 'invalidateQueries');

    await switchProfile(cache);

    expect(hasChosenThisLaunch('acc-1')).toBe(false);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['profiles'] });
  });
});
