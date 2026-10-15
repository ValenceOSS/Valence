import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionUser } from '@ValenceContracts/schemas/Session';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { useMe } from './useMe';

type ProfileList = { profiles: ViewerProfile[]; chosenProfileId: string | null };

const fetchSession = vi.hoisted(() => vi.fn<() => Promise<SessionUser | null>>());
const fetchProfileList = vi.hoisted(() => vi.fn<() => Promise<ProfileList>>());

vi.mock('@ValenceClient/session/auth', () => ({ fetchSession }));
vi.mock('@ValenceClient/profiles/fetchProfileList', () => ({ fetchProfileList }));

const KID: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Kid',
  colour: '#e8503a',
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

const SOMEBODY: SessionUser = {
  id: 'acc-1',
  name: 'The Smiths',
  email: null,
  username: 'smiths',
  emailVerified: false,
  image: null,
  role: null,
  twoFactorEnabled: false,
};

beforeEach(() => {
  fetchSession.mockReset().mockResolvedValue(SOMEBODY);
  fetchProfileList.mockReset().mockResolvedValue({ profiles: [KID], chosenProfileId: KID.id });
});

describe('useMe', () => {
  it('is nobody while it is not yet known who is signed in', () => {
    fetchSession.mockReturnValue(new Promise<SessionUser | null>(() => {}));

    const { result } = renderHookInACache(() => useMe());

    expect(result.current).toBeNull();
  });

  it('is the account and the profile watching on this device', async () => {
    const { result } = renderHookInACache(() => useMe());

    await waitFor(() => {
      expect(result.current).toEqual({ accountId: 'acc-1', profileId: KID.id });
    });
  });

  it('is the account alone while this device has chosen nobody', async () => {
    fetchProfileList.mockResolvedValue({ profiles: [KID], chosenProfileId: null });

    const { result } = renderHookInACache(() => useMe());

    await waitFor(() => {
      expect(fetchProfileList).toHaveBeenCalled();
      expect(result.current).toEqual({ accountId: 'acc-1', profileId: null });
    });
  });

  it('is nobody where nobody is signed in', async () => {
    fetchSession.mockResolvedValue(null);

    const { result } = renderHookInACache(() => useMe());

    await waitFor(() => {
      expect(fetchSession).toHaveBeenCalled();
    });

    expect(result.current).toBeNull();
  });

  it('stays the same answer while nothing changes, so what depends on it does not run again', async () => {
    const { result, rerender } = renderHookInACache(() => useMe());

    await waitFor(() => {
      expect(result.current?.profileId).toBe(KID.id);
    });

    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
