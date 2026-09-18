import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aShell } from '@ValenceClient/testing/aShell';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { renderHookInAnAddress } from '@ValenceScreens/testing/renderHookInAnAddress';
import { readListeningParty, setListeningParty } from './listeningParty';
import { useListenAlong } from './useListenAlong';
import type { PartyMember, WatchParty } from '@ValenceContracts/schemas/WatchParty';
import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

const music = vi.hoisted(() => ({ fetchTracks: vi.fn() }));

vi.mock('@ValenceClient/music/fetchMusic', async (original) => ({
  ...(await original<Record<string, never>>()),
  fetchTracks: music.fetchTracks,
}));

const ONE = aTrack(1);

const TWO = aTrack(2);

const member = (connectionId: string, name: string, role: PartyMember['role']): PartyMember => ({
  connectionId,
  accountId: `account-${connectionId}`,
  profileId: null,
  name,
  role,
  joinedAtMs: role === 'host' ? 0 : 1,
  isWatching: true,
  isReady: true,
  positionSeconds: 0,
  reportedAtMs: 0,
  bufferedAheadSeconds: 0,
});

const aParty = (overrides: Partial<WatchParty> = {}): WatchParty => ({
  id: 'p1',
  kind: 'listen',
  mediaId: ONE.id,
  createdAtMs: 0,
  everyoneMaySeek: false,
  everyoneMayPlayPause: false,
  hasPassword: false,
  isPlaying: true,
  isHeld: false,
  members: [member('dan', 'Dan', 'host'), member('sam', 'Sam', 'guest')],
  timekeeperId: 'dan',
  ...overrides,
});

const inParty = (
  me: string,
  party: WatchParty | null,
  overrides: Partial<WatchPartyState> = {},
): WatchPartyState => ({
  ...aShell().watchParty,
  party,
  meConnectionId: me,
  send: vi.fn(),
  join: vi.fn(),
  report: vi.fn(),
  ...overrides,
});

const playing = (track: MusicTrack | null, overrides = {}) =>
  aFakeMusicPlayer({
    current: track,
    isPlaying: track !== null,
    positionSeconds: 10,
    durationSeconds: 200,
    ...overrides,
  });

beforeEach(() => {
  music.fetchTracks.mockResolvedValue([TWO]);
});

afterEach(() => {
  setListeningParty(null);
  window.history.pushState({}, '', '/');
});

describe('useListenAlong', () => {
  describe('listening along', () => {
    it('puts on the song the party is playing, where the host has got to', async () => {
      const { player } = playing(null);
      const party = inParty('sam', aParty({ mediaId: TWO.id }), { referenceSeconds: 42 });

      renderHookInAnAddress(() => {
        useListenAlong(party, player);
      });

      await waitFor(() => {
        expect(player.play).toHaveBeenCalledWith([TWO], 0, {
          isOrdered: true,
          positionSeconds: 42,
          isPlaying: true,
        });
      });
      expect(music.fetchTracks).toHaveBeenCalledWith([TWO.id]);
    });

    it('stops when the host stops', () => {
      const { player } = playing(ONE);

      renderHookInAnAddress(() => {
        useListenAlong(inParty('sam', aParty({ isPlaying: false })), player);
      });

      expect(player.pause).toHaveBeenCalled();
    });

    it('goes wherever the host skips to', () => {
      const { player } = playing(ONE);
      const party = inParty('sam', aParty(), {
        command: {
          sequence: 1,
          atMs: 0,
          byName: 'Dan',
          byConnectionId: 'dan',
          command: { kind: 'seek', atSeconds: 90 },
        },
      });

      renderHookInAnAddress(() => {
        useListenAlong(party, player);
      });

      expect(player.seek).toHaveBeenCalledWith(90);
    });

    it('catches up with the host after drifting away from them', () => {
      const { player } = playing(ONE, { positionSeconds: 50 });

      renderHookInAnAddress(() => {
        useListenAlong(inParty('sam', aParty(), { referenceSeconds: 100 }), player);
      });

      expect(player.seek).toHaveBeenCalledWith(100);
    });

    it('leaves a listener a moment behind alone', () => {
      const { player } = playing(ONE, { positionSeconds: 99 });

      renderHookInAnAddress(() => {
        useListenAlong(inParty('sam', aParty(), { referenceSeconds: 100 }), player);
      });

      expect(player.seek).not.toHaveBeenCalled();
    });
  });

  describe('hosting', () => {
    it('moves the party on to whatever the host moves on to', () => {
      const { player } = playing(TWO);
      const party = inParty('dan', aParty());

      renderHookInAnAddress(() => {
        useListenAlong(party, player);
      });

      expect(party.send).toHaveBeenCalledWith({ kind: 'changeWhatIsPlaying', mediaId: TWO.id });
    });

    it('stops the party when the host pauses', () => {
      const { player, set } = playing(ONE);
      const party = inParty('dan', aParty());

      renderHookInAnAddress(() => {
        useListenAlong(party, player);
      });

      act(() => {
        set({ isPlaying: false, positionSeconds: 12 });
      });

      expect(party.send).toHaveBeenCalledWith({ kind: 'pause', atSeconds: 12 });
    });

    it('takes the party with the host when they skip through the song', () => {
      let at = 0;
      const { player, set } = playing(ONE, { positionSeconds: 10 });
      const party = inParty('dan', aParty());

      renderHookInAnAddress(() => {
        useListenAlong(party, player, () => at);
      });

      at = 500;

      act(() => {
        set({ positionSeconds: 120 });
      });

      expect(party.send).toHaveBeenCalledWith({ kind: 'seek', atSeconds: 120 });
    });

    it('says nothing while the song simply plays on', () => {
      let at = 0;
      const { player, set } = playing(ONE, { positionSeconds: 10 });
      const party = inParty('dan', aParty());

      renderHookInAnAddress(() => {
        useListenAlong(party, player, () => at);
      });

      at = 1000;

      act(() => {
        set({ positionSeconds: 11 });
      });

      expect(party.send).not.toHaveBeenCalled();
    });
  });

  it('says where it has got to, so the party can measure drift', () => {
    const { player } = playing(ONE, { positionSeconds: 33 });
    const party = inParty('sam', aParty());

    renderHookInAnAddress(() => {
      useListenAlong(party, player);
    });

    expect(party.report).toHaveBeenCalledWith({
      positionSeconds: 33,
      bufferedAheadSeconds: 0,
      isWatching: true,
      isReady: true,
    });
  });

  it('joins the party an invitation into the music section names', () => {
    window.history.pushState({}, '', '/music?party=p9');

    const party = inParty('sam', null);

    renderHookInAnAddress(() => {
      useListenAlong(party, playing(null).player);
    });

    expect(party.join).toHaveBeenCalledWith('p9');
  });

  it('tells the rest of the window which listening party it is in', () => {
    renderHookInAnAddress(() => {
      useListenAlong(inParty('sam', aParty()), playing(ONE).player);
    });

    expect(readListeningParty()).toMatchObject({ hostName: 'Dan', mayChoose: false });
  });

  it('is in no listening party while watching a film together', () => {
    renderHookInAnAddress(() => {
      useListenAlong(inParty('sam', aParty({ kind: 'watch' })), playing(ONE).player);
    });

    expect(readListeningParty()).toBeNull();
  });
});
