import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { hasChosenThisLaunch } from './hasChosenThisLaunch';
import { noteChosenThisLaunch } from './noteChosenThisLaunch';
import { useProfileChoice } from './useProfileChoice';

type ProfileList = { profiles: ViewerProfile[]; chosenProfileId: string | null };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const fetchProfileList = vi.hoisted(() => vi.fn<() => Promise<ProfileList>>());
const reconnectRealtimeClient = vi.hoisted(() => vi.fn<() => void>());
const fetchMock = vi.fn<FetchLike>();

vi.mock('@ValenceClient/profiles/fetchProfileList', () => ({ fetchProfileList }));
vi.mock('@ValenceClient/realtime/reconnectRealtimeClient', () => ({ reconnectRealtimeClient }));

const aProfile = (id: string, hasPin = false): ViewerProfile => ({
  id,
  name: id,
  colour: '#e8503a',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: id === 'dan',
  hasPin,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const DAN = aProfile('dan');
const KID = aProfile('kid');

beforeEach(() => {
  installPlatform(aFakePlatform({ thisLaunch: aFakePlatform().store }));
  fetchProfileList.mockReset().mockResolvedValue({ profiles: [DAN, KID], chosenProfileId: null });
  reconnectRealtimeClient.mockReset();
  fetchMock
    .mockReset()
    .mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useProfileChoice', () => {
  it('is reading while the profiles are still being read', () => {
    fetchProfileList.mockReturnValue(new Promise<ProfileList>(() => {}));

    const { result } = renderHookInACache(() => useProfileChoice('acc-1'));

    expect(result.current.state).toEqual({ kind: 'reading' });
  });

  it('lets the app through to say what is wrong where the profiles cannot be read', async () => {
    fetchProfileList.mockRejectedValue(new Error('offline'));

    const { result } = renderHookInACache(() => useProfileChoice('acc-1'));

    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: 'chosen' });
    });
  });

  it('is chosen for an account with one profile and no PIN, without asking anybody', async () => {
    fetchProfileList.mockResolvedValue({ profiles: [DAN], chosenProfileId: DAN.id });

    const { result } = renderHookInACache(() => useProfileChoice('acc-1'));

    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: 'chosen' });
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks who is watching on an account whose only profile has a PIN', async () => {
    const locked = aProfile('dan', true);

    fetchProfileList.mockResolvedValue({ profiles: [locked], chosenProfileId: null });

    const { result } = renderHookInACache(() => useProfileChoice('acc-1'));

    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: 'choosing', profiles: [locked] });
    });
  });

  it('asks who is watching on an account with several profiles', async () => {
    const { result } = renderHookInACache(() => useProfileChoice('acc-1'));

    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: 'choosing', profiles: [DAN, KID] });
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lets go of a profile chosen before this launch, once, and asks again', async () => {
    fetchProfileList
      .mockResolvedValueOnce({ profiles: [DAN, KID], chosenProfileId: KID.id })
      .mockResolvedValue({ profiles: [DAN, KID], chosenProfileId: null });

    const { result } = renderHookInACache(() => useProfileChoice('acc-1'));

    await waitFor(() => {
      expect(fetchProfileList).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: 'choosing', profiles: [DAN, KID] });
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/profiles/chosen', { method: 'DELETE' });
  });

  it('lets go only once even where the server still says the profile is chosen', async () => {
    fetchProfileList.mockResolvedValue({ profiles: [DAN, KID], chosenProfileId: KID.id });

    renderHookInACache(() => useProfileChoice('acc-1'));

    await waitFor(() => {
      expect(fetchProfileList).toHaveBeenCalledTimes(2);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the profile somebody chose since the app started', async () => {
    noteChosenThisLaunch('acc-1');
    fetchProfileList.mockResolvedValue({ profiles: [DAN, KID], chosenProfileId: KID.id });

    const { result } = renderHookInACache(() => useProfileChoice('acc-1'));

    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: 'chosen' });
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks again where somebody chose this launch but the server has let go since', async () => {
    noteChosenThisLaunch('acc-1');

    const { result } = renderHookInACache(() => useProfileChoice('acc-1'));

    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: 'choosing', profiles: [DAN, KID] });
    });
  });

  it('is chosen once somebody chose, telling the socket who is watching now', async () => {
    const { result } = renderHookInACache(() => useProfileChoice('acc-1'));

    await waitFor(() => {
      expect(result.current.state.kind).toBe('choosing');
    });

    fetchProfileList.mockResolvedValue({ profiles: [DAN, KID], chosenProfileId: KID.id });

    act(() => {
      result.current.chose();
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: 'chosen' });
    });
    expect(hasChosenThisLaunch('acc-1')).toBe(true);
    expect(reconnectRealtimeClient).toHaveBeenCalledTimes(1);
  });

  it('is chosen where there is nobody signed in to ask about, and reads nothing', () => {
    const { result } = renderHookInACache(() => useProfileChoice(null));

    expect(result.current.state).toEqual({ kind: 'chosen' });
    expect(fetchProfileList).not.toHaveBeenCalled();
  });

  it('does nothing when told somebody chose where there is nobody signed in', () => {
    const { result } = renderHookInACache(() => useProfileChoice(null));

    act(() => {
      result.current.chose();
    });

    expect(reconnectRealtimeClient).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
