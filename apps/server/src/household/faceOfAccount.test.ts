import { describe, expect, it } from 'vitest';
import { faceOfAccount } from './faceOfAccount';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { StoredHousehold } from './StoredHousehold';

const NOTHING_OF_ITS_OWN: StoredHousehold = {
  name: null,
  colour: null,
  avatar: null,
  updatedAt: '2026-10-01T00:00:00.000Z',
};

const CHOSEN: StoredHousehold = {
  name: 'The Morgans',
  colour: '#3ac47d',
  avatar: { kind: 'drawn', style: 'bottts', seed: 'house' },
  updatedAt: '2026-10-02T00:00:00.000Z',
};

/**
 * A profile, the owner unless said otherwise.
 *
 * @param change - What differs from the owner.
 * @returns The profile.
 */
const aProfile = (change: Partial<ViewerProfile> = {}): ViewerProfile => ({
  id: 'p-dan',
  name: 'Dan',
  colour: '#8b5ce8',
  avatar: { kind: 'photo', isVideo: false, frame: null },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: {
    statusShows: 'valence',
    logo: 'light',
    showsArtwork: true,
    showsWhilePaused: true,
    showsBrowsing: true,
    time: 'remaining',
    showsTmdbLink: true,
    showsPartySize: true,
    sharesFilms: true,
    sharesShows: true,
    sharesMusic: true,
    hiddenLibraryIds: [],
  },
  prefersBestCopy: false,
  isOwner: true,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-10-20T00:00:00.000Z',
  ...change,
});

const DAD = aProfile({ id: 'p-dad', name: 'Dad', isOwner: false, colour: '#e8503a' });

describe('faceOfAccount', () => {
  it('is its one profile where one person watches, whatever the account chose before', () => {
    expect(faceOfAccount({ name: 'dcm', stored: CHOSEN, profiles: [aProfile()] })).toEqual({
      name: 'Dan',
      colour: '#8b5ce8',
      avatar: { kind: 'photo', isVideo: false, frame: null },
      updatedAt: '2026-10-20T00:00:00.000Z',
      hasOwnName: false,
      hasOwnPicture: false,
    });
  });

  it('follows the owner profile where several watch and the account chose nothing', () => {
    expect(
      faceOfAccount({ name: 'dcm', stored: NOTHING_OF_ITS_OWN, profiles: [DAD, aProfile()] }),
    ).toMatchObject({
      name: 'Dan',
      colour: '#8b5ce8',
      avatar: { kind: 'photo' },
      hasOwnName: false,
      hasOwnPicture: false,
    });
  });

  it('wears what the account chose for itself where several watch', () => {
    expect(
      faceOfAccount({ name: 'dcm', stored: CHOSEN, profiles: [aProfile(), DAD] }),
    ).toMatchObject({
      name: 'The Morgans',
      colour: '#3ac47d',
      avatar: { kind: 'drawn', seed: 'house' },
      hasOwnName: true,
      hasOwnPicture: true,
    });
  });

  it('takes a picture of its own and the owner’s name, each on its own', () => {
    expect(
      faceOfAccount({
        name: 'dcm',
        stored: { ...NOTHING_OF_ITS_OWN, avatar: CHOSEN.avatar },
        profiles: [aProfile(), DAD],
      }),
    ).toMatchObject({ name: 'Dan', avatar: { kind: 'drawn' }, hasOwnPicture: true });
  });

  it('changes when either the account or its owner last changed, so no cache keeps the old one', () => {
    const later = '2026-10-21T00:00:00.000Z';

    expect(
      faceOfAccount({
        name: 'dcm',
        stored: { ...CHOSEN, updatedAt: later },
        profiles: [aProfile(), DAD],
      }).updatedAt,
    ).toBe(later);
    expect(
      faceOfAccount({ name: 'dcm', stored: CHOSEN, profiles: [aProfile(), DAD] }).updatedAt,
    ).toBe('2026-10-20T00:00:00.000Z');
  });

  it('is what the account chose, or its name, before it has any profile', () => {
    expect(faceOfAccount({ name: 'dcm', stored: NOTHING_OF_ITS_OWN, profiles: [] })).toMatchObject({
      name: 'dcm',
      avatar: { kind: 'initial' },
      hasOwnPicture: false,
    });
  });
});
