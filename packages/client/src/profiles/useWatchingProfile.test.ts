import { waitFor } from '@testing-library/react';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { useWatchingProfile } from './useWatchingProfile';

const readCurrentProfile = vi.fn<() => string | null>();
const fetchProfiles = vi.fn<() => Promise<ViewerProfile[]>>();

vi.mock('@ValenceClient/profiles/currentProfile', () => ({
  readCurrentProfile: () => readCurrentProfile(),
}));

vi.mock('@ValenceClient/profiles/fetchProfiles', () => ({
  fetchProfiles: () => fetchProfiles(),
}));

const aProfile = (id: string): ViewerProfile => ({
  id,
  name: id,
  colour: '#e8503a',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

beforeEach(() => {
  readCurrentProfile.mockReset().mockReturnValue(null);
  fetchProfiles.mockReset().mockResolvedValue([]);
});

describe('useWatchingProfile', () => {
  it('answers with the face this device picked', async () => {
    readCurrentProfile.mockReturnValue('kid');
    fetchProfiles.mockResolvedValue([aProfile('dan'), aProfile('kid')]);

    const { result } = renderHookInACache(() => useWatchingProfile());

    await waitFor(() => {
      expect(result.current).toBe('kid');
    });
  });

  it('falls back to the first face where the device picked nobody, as the server does', async () => {
    fetchProfiles.mockResolvedValue([aProfile('dan'), aProfile('kid')]);

    const { result } = renderHookInACache(() => useWatchingProfile());

    await waitFor(() => {
      expect(result.current).toBe('dan');
    });
  });

  it('falls back the same way where the device picked somebody who is gone', async () => {
    readCurrentProfile.mockReturnValue('removed');
    fetchProfiles.mockResolvedValue([aProfile('dan')]);

    const { result } = renderHookInACache(() => useWatchingProfile());

    await waitFor(() => {
      expect(result.current).toBe('dan');
    });
  });

  it('says nothing rather than guessing while the faces are still being read', () => {
    const { result } = renderHookInACache(() => useWatchingProfile());

    expect(result.current).toBeNull();
  });

  it('says nothing where the account has no faces at all', async () => {
    const { result } = renderHookInACache(() => useWatchingProfile());

    await waitFor(() => {
      expect(fetchProfiles).toHaveBeenCalled();
    });
    expect(result.current).toBeNull();
  });
});
