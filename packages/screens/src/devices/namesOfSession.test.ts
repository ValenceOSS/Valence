import { describe, expect, it } from 'vitest';
import { saying } from '@ValenceI18n/saying';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import { namesOfSession } from './namesOfSession';

const A_SESSION: ActiveSession = {
  clientId: 'tab-1',
  accountId: 'account-1',
  profileId: 'profile-1',
  profileName: 'Dan',
  isGuest: false,
  guestOf: null,
  fromServer: null,
  deviceLabel: 'Valence (Dan’s iPhone)',
  device: null,
  client: null,
  identity: null,
  userAgent: null,
  clientKind: 'phone',
  connectedAt: 1000,
  streams: null,
  playback: null,
  listening: null,
  bookListening: null,
  reading: null,
};

describe('namesOfSession', () => {
  it('names the device and what it reaches Valence through apart', () => {
    expect(
      namesOfSession({
        ...A_SESSION,
        device: sayVerbatim('iPhone 17 Pro Max'),
        client: saying('common.valenceForSystem', { system: 'iOS' }),
      }),
    ).toEqual({ device: 'iPhone 17 Pro Max', client: 'Valence for iOS' });
  });

  it('falls back to the name the device gave itself where the server named neither', () => {
    expect(namesOfSession(A_SESSION)).toEqual({ device: 'Valence (Dan’s iPhone)', client: null });
  });

  it('names the device even where its client is not known', () => {
    expect(namesOfSession({ ...A_SESSION, device: sayVerbatim('Living Room') })).toEqual({
      device: 'Living Room',
      client: null,
    });
  });
});
