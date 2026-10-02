import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFollowTheRoom } from './useFollowTheRoom';
import type { FollowTheRoom } from './useFollowTheRoom';
import type { PartyPlayback } from './PartyPlayback';
import type { RoomPlayer } from './RoomPlayer';

type FakePlayer = RoomPlayer & { at: number; paused: boolean; rate: number };

/**
 * A player standing at a moment, paused or not, that remembers what it was asked to do.
 *
 * @param at - Where it is.
 * @param paused - Whether it is paused.
 * @returns The player.
 */
const aPlayer = (at: number, paused = false): FakePlayer => {
  const player: FakePlayer = {
    at,
    paused,
    rate: 1,
    readyState: () => 4,
    currentSeconds: () => player.at,
    frameSkewSeconds: () => 0,
    bufferedAheadSeconds: () => 10,
    isPaused: () => player.paused,
    isSeeking: () => false,
    seekTo: vi.fn((seconds: number) => {
      player.at = seconds;
    }),
    play: vi.fn(() => {
      player.paused = false;

      return Promise.resolve();
    }),
    pause: vi.fn(() => {
      player.paused = true;
    }),
    setRate: vi.fn((rate: number) => {
      player.rate = rate;
    }),
  };

  return player;
};

/**
 * A party, playing and holding nobody up unless told otherwise.
 *
 * @param change - What differs.
 * @returns The party.
 */
const aParty = (change: Partial<PartyPlayback> = {}): PartyPlayback => ({
  id: 'a-party',
  command: null,
  meConnectionId: 'me',
  referenceSeconds: null,
  jitterMs: 0,
  isPlaying: true,
  isHeld: false,
  waitingFor: [],
  members: 2,
  onReport: vi.fn(),
  onCommand: vi.fn(),
  ...change,
});

/**
 * Follows a room with a player, for as long as the test changes either.
 *
 * @param player - The player.
 * @param party - The party at first.
 * @returns The hook, and how to change the party.
 */
const follow = (player: FakePlayer, party: PartyPlayback | undefined) => {
  const onSaid = vi.fn();
  const onCannotStart = vi.fn();
  const drawn = renderHook((props: FollowTheRoom) => useFollowTheRoom(props), {
    initialProps: {
      party,
      playerOf: () => player,
      isSessionPlaying: true,
      onSaid,
      onCannotStart,
    },
  });

  return {
    ...drawn,
    onSaid,
    change: (next: PartyPlayback | undefined) => {
      drawn.rerender({
        party: next,
        playerOf: () => player,
        isSessionPlaying: true,
        onSaid,
        onCannotStart,
      });
    },
  };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useFollowTheRoom', () => {
  it('jumps to the room once on joining part-way through, and only when far off', () => {
    const player = aPlayer(10);

    follow(player, aParty({ referenceSeconds: 600 }));

    expect(player.seekTo).toHaveBeenCalledWith(600);

    const near = aPlayer(599);

    follow(near, aParty({ referenceSeconds: 600 }));

    expect(near.seekTo).not.toHaveBeenCalled();
  });

  it('applies a command once, by its sequence, and says who sent it', () => {
    const player = aPlayer(100);
    const command = {
      sequence: 4,
      atMs: 1,
      byName: 'Jo',
      byConnectionId: 'them',
      command: { kind: 'seek' as const, atSeconds: 300 },
    };
    const { change, onSaid } = follow(player, aParty({ command }));

    expect(player.seekTo).toHaveBeenCalledWith(300);
    expect(onSaid).toHaveBeenCalledTimes(1);

    change(aParty({ command }));

    expect(player.seekTo).toHaveBeenCalledTimes(1);
  });

  it('runs while the room runs, and stops while somebody holds it up', () => {
    const player = aPlayer(100, true);
    const { change } = follow(player, aParty());

    expect(player.play).toHaveBeenCalled();

    change(aParty({ isHeld: true }));

    expect(player.pause).toHaveBeenCalled();
  });

  it('reports where it is every second, and stops reporting on leaving', () => {
    const player = aPlayer(42);
    const party = aParty();
    const { change } = follow(player, party);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(party.onReport).toHaveBeenCalledWith(
      expect.objectContaining({ positionSeconds: 42, isWatching: true, bufferedAheadSeconds: 10 }),
    );

    change(undefined);
    vi.mocked(party.onReport).mockClear();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(party.onReport).not.toHaveBeenCalled();
  });

  it('eases a little drift with speed and snaps a lot', () => {
    const player = aPlayer(100);
    const { change } = follow(player, aParty({ referenceSeconds: 100 }));

    change(aParty({ referenceSeconds: 100.4 }));

    expect(player.rate).toBeGreaterThan(1);

    change(aParty({ referenceSeconds: 110 }));

    expect(player.at).toBe(110);
    expect(player.rate).toBe(1);
  });

  it('lines everybody up on the room’s frame while the room is held', () => {
    const player = aPlayer(100, true);
    const { change } = follow(player, aParty({ isHeld: true, referenceSeconds: 100 }));

    change(aParty({ isHeld: true, referenceSeconds: 100.5 }));

    expect(player.at).toBe(100.5);
  });

  it('does nothing outside a party', () => {
    const player = aPlayer(5, true);

    follow(player, undefined);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(player.play).not.toHaveBeenCalled();
    expect(player.seekTo).not.toHaveBeenCalled();
  });
});
