import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileQueries } from './profileQueries';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

const fetchProfileList = vi.fn<
  () => Promise<{
    profiles: ViewerProfile[];
    chosenProfileId: string | null;
    predatesChoosing?: true;
  }>
>();

vi.mock('@ValenceClient/profiles/fetchProfileList', () => ({
  fetchProfileList: () => fetchProfileList(),
}));

const aProfile = (overrides: Partial<ViewerProfile> = {}): ViewerProfile => ({
  id: 'profile-1',
  name: 'Marques',
  colour: '#8b5ce8',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  askStillWatchingAfter: 3,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: false,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  ...overrides,
});

const ask = async (): Promise<ViewerProfile | null> => {
  const { queryFn } = profileQueries.watching();

  if (typeof queryFn !== 'function') {
    throw new TypeError('The query has no function to run.');
  }

  return queryFn({
    queryKey: ['profiles', 'watching'],
    signal: new AbortController().signal,
    meta: undefined,
    client: new QueryClient(),
  });
};

beforeEach(() => {
  fetchProfileList.mockReset().mockResolvedValue({ profiles: [aProfile()], chosenProfileId: null });
});

describe('profileQueries.watching', () => {
  it('picks out whoever the server says this device chose', async () => {
    fetchProfileList.mockResolvedValue({
      profiles: [aProfile(), aProfile({ id: 'profile-2', name: 'Ada' })],
      chosenProfileId: 'profile-2',
    });

    expect((await ask())?.name).toBe('Ada');
  });

  it('is nobody while this device has chosen nobody', async () => {
    fetchProfileList.mockResolvedValue({
      profiles: [aProfile({ name: 'Default' }), aProfile({ id: 'profile-2' })],
      chosenProfileId: null,
    });

    expect(await ask()).toBeNull();
  });

  it('is nobody when the chosen profile is no longer on the account', async () => {
    fetchProfileList.mockResolvedValue({
      profiles: [aProfile({ name: 'Default' })],
      chosenProfileId: 'long-gone',
    });

    expect(await ask()).toBeNull();
  });

  it('is the first profile on a server from before devices chose, which records against it', async () => {
    fetchProfileList.mockResolvedValue({
      profiles: [aProfile({ name: 'Default' }), aProfile({ id: 'profile-2' })],
      chosenProfileId: null,
      predatesChoosing: true,
    });

    expect((await ask())?.name).toBe('Default');
  });
});
