import { waitFor } from '@testing-library/react';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { useWatchingProfile } from './useWatchingProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';

const fetchProfileList =
  vi.fn<() => Promise<{ profiles: ViewerProfile[]; chosenProfileId: string | null }>>();

vi.mock('@ValenceClient/profiles/fetchProfileList', () => ({
  fetchProfileList: () => fetchProfileList(),
}));

const aProfile = (id: string): ViewerProfile => ({
  id,
  name: id,
  colour: '#e8503a',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: id === 'dan',
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

beforeEach(() => {
  fetchProfileList.mockReset().mockResolvedValue({ profiles: [], chosenProfileId: null });
});

describe('useWatchingProfile', () => {
  it('answers with the face the server says this device chose', async () => {
    fetchProfileList.mockResolvedValue({
      profiles: [aProfile('dan'), aProfile('kid')],
      chosenProfileId: 'kid',
    });

    const { result } = renderHookInACache(() => useWatchingProfile());

    await waitFor(() => {
      expect(result.current).toBe('kid');
    });
  });

  it('says nothing rather than guessing while the faces are still being read', () => {
    const { result } = renderHookInACache(() => useWatchingProfile());

    expect(result.current).toBeNull();
  });

  it('says nothing while this device has chosen nobody', async () => {
    fetchProfileList.mockResolvedValue({
      profiles: [aProfile('dan'), aProfile('kid')],
      chosenProfileId: null,
    });

    const { result } = renderHookInACache(() => useWatchingProfile());

    await waitFor(() => {
      expect(fetchProfileList).toHaveBeenCalled();
    });

    expect(result.current).toBeNull();
  });
});
