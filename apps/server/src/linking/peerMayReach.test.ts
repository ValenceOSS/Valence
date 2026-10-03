import { describe, expect, it } from 'vitest';
import { NOTHING_SHARED } from '@ValenceContracts/constants/NOTHING_SHARED';
import { peerMayReach } from './peerMayReach';

const SHARING = { ...NOTHING_SHARED, libraryIds: ['films', 'music'] };

const A_FILM = {
  id: 'arrival',
  title: 'Arrival',
  libraryId: 'films',
  certificationAge: 12,
  isNeverRated: false,
};

describe('peerMayReach', () => {
  it('reaches only titles in a shared library', () => {
    expect(peerMayReach(SHARING, A_FILM)).toBe('allowed');
    expect(peerMayReach(SHARING, { ...A_FILM, libraryId: 'anime' })).toBe('notShared');
  });

  it('keeps to the age the server was given', () => {
    const upToTwelve = { ...SHARING, maximumAge: 12 };

    expect(peerMayReach(upToTwelve, A_FILM)).toBe('allowed');
    expect(peerMayReach(upToTwelve, { ...A_FILM, certificationAge: 15 })).toBe('aboveTheAge');
  });

  it('refuses something uncertificated under an age, unless unrated things were allowed', () => {
    const unrated = { ...A_FILM, certificationAge: null };

    expect(peerMayReach({ ...SHARING, maximumAge: 12 }, unrated)).toBe('aboveTheAge');
    expect(peerMayReach({ ...SHARING, maximumAge: 12, allowsUnrated: true }, unrated)).toBe(
      'allowed',
    );
    expect(peerMayReach(SHARING, unrated)).toBe('allowed');
  });

  it('never reads something nothing certificates as unrated', () => {
    expect(
      peerMayReach(
        { ...SHARING, maximumAge: 12 },
        { ...A_FILM, libraryId: 'music', certificationAge: null, isNeverRated: true },
      ),
    ).toBe('allowed');
  });
});
