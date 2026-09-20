import { describe, expect, it } from 'vitest';
import { groupSessionsByViewer } from './groupSessionsByViewer';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';

const session = (overrides: Partial<ActiveSession> = {}): ActiveSession => ({
  clientId: 'cli_1',
  accountId: 'acc_1',
  profileId: 'prf_1',
  profileName: 'Dan',
  isGuest: false,
  guestOf: null,
  deviceLabel: 'Chrome on macOS',
  connectedAt: 0,
  playback: null,
  listening: null,
  ...overrides,
});

describe('groupSessionsByViewer', () => {
  it('answers nothing for nobody', () => {
    expect(groupSessionsByViewer([])).toEqual([]);
  });

  it('gathers every tab one person has open', () => {
    const groups = groupSessionsByViewer([
      session({ clientId: 'cli_1' }),
      session({ clientId: 'cli_2' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.sessions).toHaveLength(2);
  });

  it('keeps different viewers apart', () => {
    const groups = groupSessionsByViewer([
      session({ profileId: 'prf_1', profileName: 'Dan' }),
      session({ clientId: 'cli_2', profileId: 'prf_2', profileName: 'Sam' }),
    ]);

    expect(groups.map((group) => group.label)).toEqual(['Dan', 'Sam']);
  });

  it('gathers unidentified tabs under one heading rather than one each', () => {
    const groups = groupSessionsByViewer([
      session({ clientId: 'cli_1', profileId: null, profileName: null }),
      session({ clientId: 'cli_2', profileId: null, profileName: null }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe('Unknown viewer');
  });

  it('keeps the order it was given, so the list does not reshuffle itself', () => {
    const groups = groupSessionsByViewer([
      session({ profileId: 'prf_2', profileName: 'Sam' }),
      session({ clientId: 'cli_2', profileId: 'prf_1', profileName: 'Dan' }),
    ]);

    expect(groups.map((group) => group.label)).toEqual(['Sam', 'Dan']);
  });

  it('names a group by its key, so a re-render finds the same one', () => {
    const groups = groupSessionsByViewer([session()]);

    expect(groups[0]?.key).toBe('prf_1');
  });
});

describe('groupSessionsByViewer, where nobody has chosen a profile', () => {
  const signedIn = (overrides: Partial<ActiveSession> = {}): ActiveSession => ({
    clientId: 'cli_1',
    accountId: 'acc_1',
    profileId: null,
    profileName: 'Dan',
    isGuest: false,
    guestOf: null,
    deviceLabel: 'Chromium on macOS',
    connectedAt: 0,
    playback: null,
    listening: null,
    ...overrides,
  });

  it('keeps one account apart from another, which is every session there is today', () => {
    const groups = groupSessionsByViewer([
      signedIn({ clientId: 'cli_1' }),
      signedIn({ clientId: 'cli_2', accountId: 'acc_2', profileName: 'Marques' }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.label)).toEqual(['Dan', 'Marques']);
  });

  it('does not file one person’s viewing under somebody else who happened to connect first', () => {
    const groups = groupSessionsByViewer([
      signedIn({ clientId: 'cli_1' }),
      signedIn({ clientId: 'cli_2' }),
      signedIn({
        clientId: 'cli_3',
        accountId: 'acc_2',
        profileName: 'Marques',
        deviceLabel: 'Firefox on Windows',
      }),
      signedIn({ clientId: 'cli_4' }),
    ]);

    const marques = groups.find((group) => group.label === 'Marques');

    expect(groups.map((group) => group.sessions.length)).toEqual([3, 1]);
    expect(marques?.sessions.map((one) => one.clientId)).toEqual(['cli_3']);
  });

  it('gathers every tab of one account under it', () => {
    const groups = groupSessionsByViewer([
      signedIn({ clientId: 'cli_1' }),
      signedIn({ clientId: 'cli_2' }),
      signedIn({ clientId: 'cli_3' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.sessions).toHaveLength(3);
  });

  it('still tells two profiles of one account apart where profiles are chosen', () => {
    const groups = groupSessionsByViewer([
      signedIn({ clientId: 'cli_1', profileId: 'prf_1', profileName: 'Dan' }),
      signedIn({ clientId: 'cli_2', profileId: 'prf_2', profileName: 'Connie' }),
    ]);

    expect(groups.map((group) => group.label)).toEqual(['Dan', 'Connie']);
  });

  it('gathers sessions belonging to nobody recognisable rather than dropping them', () => {
    const groups = groupSessionsByViewer([
      signedIn({ clientId: 'cli_1', accountId: null, profileName: null }),
      signedIn({ clientId: 'cli_2', accountId: null, profileName: null }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe('Unknown viewer');
    expect(groups[0]?.sessions).toHaveLength(2);
  });
});
