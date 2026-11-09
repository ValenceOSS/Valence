/* oxlint-disable valence/no-hard-coded-strings -- stands in for a session in tests */
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';

/**
 * A session for a test: one browser tab with the app open and nothing playing, changed by whatever
 * the test needs.
 *
 * @param changes - What differs from a tab with nothing playing.
 * @returns The session.
 */
const anActiveSession = (changes: Partial<ActiveSession> = {}): ActiveSession => ({
  clientId: 'tab-1',
  accountId: 'account-1',
  profileId: 'profile-1',
  profileName: 'Dan',
  isGuest: false,
  guestOf: null,
  fromServer: null,
  deviceLabel: 'Living room TV',
  device: null,
  client: null,
  identity: null,
  userAgent: null,
  clientKind: 'browser',
  connectedAt: 1000,
  streams: null,
  playback: null,
  listening: null,
  bookListening: null,
  reading: null,
  controlledFrom: null,
  remoteFor: null,
  ...changes,
});

export { anActiveSession };
