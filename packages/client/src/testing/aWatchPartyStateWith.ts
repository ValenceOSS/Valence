import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';

/**
 * What a client holds of a party — or of none — that records what it was told, for a screen to be
 * drawn against, whichever test runner is recording: Vitest on the web, Jest on a native client.
 *
 * @param spy - Makes a function that remembers how it was called, such as `vi.fn` or `jest.fn`.
 * @param change - What differs from holding no party at all.
 * @returns The state.
 */
const aWatchPartyStateWith = (
  spy: () => () => void,
  change: Partial<WatchPartyState> = {},
): WatchPartyState => ({
  party: null,
  command: null,
  refusal: null,
  notice: null,
  passwordWanted: null,
  meConnectionId: 'me',
  referenceSeconds: null,
  waitingFor: [],
  jitterMs: 0,
  open: spy(),
  join: spy(),
  leave: spy(),
  send: spy(),
  report: spy(),
  setRole: spy(),
  remove: spy(),
  ask: spy(),
  setPassword: spy(),
  forgetNotice: spy(),
  stopAsking: spy(),
  loosen: spy(),
  ...change,
});

export { aWatchPartyStateWith };
