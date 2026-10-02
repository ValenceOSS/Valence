import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePartyPlayback } from './usePartyPlayback';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';
import { aWatchPartyState } from '@ValenceClient/testing/aWatchPartyState';
import type { WatchPartyState } from './useWatchParty';
import type { WatchParty } from '@ValenceContracts/schemas/WatchParty';

/**
 * What a client holds of a party, or of none.
 *
 * @param party - The party, or nothing.
 * @returns The state.
 */
const aState = (party: WatchParty | null): WatchPartyState =>
  aWatchPartyState({ party, referenceSeconds: 12, jitterMs: 3 });

/**
 * A party of one kind or the other.
 *
 * @param kind - Watching or listening.
 * @returns The party.
 */
const aParty = (kind: 'watch' | 'listen'): WatchParty => aWatchParty({ kind });

describe('usePartyPlayback', () => {
  it('hands a player what it follows of a party watching something', () => {
    const { result } = renderHook(() => usePartyPlayback(aState(aParty('watch'))));

    expect(result.current).toMatchObject({
      id: 'p-1',
      referenceSeconds: 12,
      jitterMs: 3,
      isPlaying: true,
      members: 0,
    });
  });

  it('hands nothing for a party listening to music, or none', () => {
    expect(renderHook(() => usePartyPlayback(aState(aParty('listen')))).result.current).toBeNull();
    expect(renderHook(() => usePartyPlayback(aState(null))).result.current).toBeNull();
    expect(renderHook(() => usePartyPlayback(undefined)).result.current).toBeNull();
  });

  it('is the same object for as long as nothing in it changes', () => {
    const state = aState(aParty('watch'));
    const { result, rerender } = renderHook((held: WatchPartyState) => usePartyPlayback(held), {
      initialProps: state,
    });
    const first = result.current;

    rerender({ ...state });

    expect(result.current).toBe(first);
  });
});
