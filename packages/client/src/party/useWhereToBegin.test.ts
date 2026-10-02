import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWhereToBegin } from './useWhereToBegin';
import type { Arriving } from './useWhereToBegin';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';
import { aWatchPartyState } from '@ValenceClient/testing/aWatchPartyState';
import { WAIT_FOR_THE_ROOM_MS } from '@ValenceClient/party/whereToBegin';

/**
 * Somebody opening a film, invited to a party or not.
 *
 * @param change - What differs.
 * @returns Their arrival.
 */
const arriving = (change: Partial<Arriving> = {}): Arriving => ({
  watchParty: aWatchPartyState(),
  invitedTo: null,
  mediaId: 'film-1',
  resumeSeconds: 30,
  isReady: true,
  ...change,
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useWhereToBegin', () => {
  it('begins where they left off outside a party, once that is known', () => {
    expect(renderHook(() => useWhereToBegin(arriving({ isReady: false }))).result.current).toEqual({
      kind: 'wait',
    });
    expect(renderHook(() => useWhereToBegin(arriving())).result.current).toEqual({
      kind: 'begin',
      atSeconds: 30,
    });
  });

  it('joins the party it was invited to once, and begins where the room is', () => {
    const watchParty = aWatchPartyState();
    const { result, rerender } = renderHook((props: Arriving) => useWhereToBegin(props), {
      initialProps: arriving({ watchParty, invitedTo: 'p-1' }),
    });

    expect(result.current).toEqual({ kind: 'wait' });

    rerender(
      arriving({
        watchParty: { ...watchParty, party: aWatchParty(), referenceSeconds: 600 },
        invitedTo: 'p-1',
      }),
    );

    expect(result.current).toEqual({ kind: 'begin', atSeconds: 600 });
    expect(watchParty.join).toHaveBeenCalledTimes(1);
    expect(watchParty.join).toHaveBeenCalledWith('p-1');
  });

  it('gives up waiting for a room that never answers', () => {
    const { result } = renderHook(() => useWhereToBegin(arriving({ invitedTo: 'p-1' })));

    act(() => {
      vi.advanceTimersByTime(WAIT_FOR_THE_ROOM_MS);
    });

    expect(result.current).toEqual({ kind: 'begin', atSeconds: 30 });
  });

  it('keeps a settled start while the room moves on', () => {
    const watchParty = { ...aWatchPartyState(), party: aWatchParty(), referenceSeconds: 600 };
    const { result, rerender } = renderHook((props: Arriving) => useWhereToBegin(props), {
      initialProps: arriving({ watchParty, invitedTo: 'p-1' }),
    });

    rerender(arriving({ watchParty: { ...watchParty, referenceSeconds: 640 }, invitedTo: 'p-1' }));

    expect(result.current).toEqual({ kind: 'begin', atSeconds: 600 });
  });
});
