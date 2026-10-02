import { vi } from 'vitest';
import { aWatchPartyStateWith } from '@ValenceClient/testing/aWatchPartyStateWith';
import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';

/**
 * What a client holds of a party — or of none — that records what it was told, with Vitest's spies.
 *
 * @param change - What differs from holding no party at all.
 * @returns The state.
 */
const aWatchPartyState = (change: Partial<WatchPartyState> = {}): WatchPartyState =>
  aWatchPartyStateWith(vi.fn, change);

export { aWatchPartyState };
