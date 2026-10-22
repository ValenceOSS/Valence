import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { ASKING_FOR } from './ASKING_FOR';
import { hasChosenThisLaunch } from './hasChosenThisLaunch';
import { launchStore } from './launchStore';
import { noteChosenThisLaunch } from './noteChosenThisLaunch';
import { switchToProfile } from './switchToProfile';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const fetchMock = vi.fn<FetchLike>();

const OPEN: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Kid',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: false,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const LOCKED: ViewerProfile = { ...OPEN, id: '00000000-0000-4000-8000-000000000003', hasPin: true };

beforeEach(() => {
  installPlatform(aFakePlatform({ thisLaunch: aFakePlatform().store }));
  fetchMock.mockReset().mockResolvedValue(Response.json(OPEN));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('switchToProfile', () => {
  it('chooses a profile with no PIN at once, keeping the choice made this launch', async () => {
    noteChosenThisLaunch('acc-1');

    const cache = new QueryClient();
    const invalidate = vi.spyOn(cache, 'invalidateQueries');

    await switchToProfile(cache, OPEN);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/profiles/${OPEN.id}/choose`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(hasChosenThisLaunch('acc-1')).toBe(true);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['profiles'] });
  });

  it('asks for the PIN of a profile that has one, rather than choosing it', async () => {
    noteChosenThisLaunch('acc-1');
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await switchToProfile(new QueryClient(), LOCKED);

    expect(fetchMock).toHaveBeenCalledWith('/api/profiles/chosen', { method: 'DELETE' });
    expect(hasChosenThisLaunch('acc-1')).toBe(false);
    expect(launchStore().read(ASKING_FOR)).toBe(LOCKED.id);
  });

  it('asks who is watching where the profile could not be chosen', async () => {
    noteChosenThisLaunch('acc-1');
    fetchMock.mockResolvedValue(Response.json({ error: 'No.' }, { status: 403 }));

    await switchToProfile(new QueryClient(), OPEN);

    expect(hasChosenThisLaunch('acc-1')).toBe(false);
    expect(launchStore().read(ASKING_FOR)).toBe(OPEN.id);
  });
});
