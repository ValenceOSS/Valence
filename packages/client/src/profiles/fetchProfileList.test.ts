import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { fetchProfileList } from './fetchProfileList';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const fetchMock = vi.fn<FetchLike>();

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Kid',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
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

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(Response.json({ profiles: [] }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchProfileList', () => {
  it('reads the profiles on the account and the one this device chose', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ profiles: [PROFILE], chosenProfileId: PROFILE.id }),
    );

    await expect(fetchProfileList()).resolves.toEqual({
      profiles: [PROFILE],
      chosenProfileId: PROFILE.id,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/profiles');
  });

  it('says nobody is chosen where the server leaves it out or says so', async () => {
    await expect(fetchProfileList()).resolves.toEqual({
      profiles: [],
      chosenProfileId: null,
      predatesChoosing: true,
    });

    fetchMock.mockResolvedValue(Response.json({ profiles: [PROFILE], chosenProfileId: null }));

    await expect(fetchProfileList()).resolves.toEqual({
      profiles: [PROFILE],
      chosenProfileId: null,
    });
  });

  it('reads another account’s profiles from the admin area', async () => {
    await fetchProfileList('acc-1');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/accounts/acc-1/profiles');
  });

  it('says so when the server refuses', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'No' }, { status: 403 }));

    await expect(fetchProfileList()).rejects.toThrow();
  });

  it('says so when the answer is not the shape it was promised', async () => {
    fetchMock.mockResolvedValue(Response.json({ profiles: [{ id: 'not a profile' }] }));

    await expect(fetchProfileList()).rejects.toThrow();
  });
});
