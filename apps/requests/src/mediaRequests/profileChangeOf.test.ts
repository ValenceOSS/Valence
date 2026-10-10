import { describe, expect, it } from 'vitest';
import { MediaRequestDraftSchema } from '@ValenceContracts/schemas/MediaRequest';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aProfile } from '@ValenceRequests/testing/aProfile';
import { profileChangeOf } from './profileChangeOf';
import type { HigherProfileAsks } from '@ValenceContracts/schemas/HigherProfileAsks';

const UHD = aProfile({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'UHD 4K', position: 0 });
const HD = aProfile({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa7', name: 'HD 1080p', position: 1 });
const SD = aProfile({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa8', name: 'SD', position: 2 });
const PROFILES = [UHD, HD, SD];

const KEPT = aMediaRequest({ profileId: HD.id, requestedById: 'first', libraryId: 'films' });

/**
 * A later ask, by somebody else unless told, at the profile and under the setting given.
 */
const anAsk = (profileId: string | null, higherProfileAsks: HigherProfileAsks, by = 'priya') =>
  MediaRequestDraftSchema.parse({
    kind: 'film',
    tmdbId: 438631,
    libraryId: 'films',
    libraryPath: '/media/Films',
    profileId,
    higherProfileAsks,
    requestedBy: { id: by, name: 'Priya' },
    isApproved: false,
    catalogue: { title: 'Dune', year: 2021 },
  });

describe('profileChangeOf', () => {
  it('changes nothing for an ask at no profile, or the one it has', () => {
    expect(profileChangeOf(KEPT, anAsk(null, 'upgrade'), PROFILES)).toEqual({});
    expect(profileChangeOf(KEPT, anAsk(HD.id, 'upgrade'), PROFILES)).toEqual({});
  });

  it('lets its only asker change it, as before', () => {
    expect(profileChangeOf(KEPT, anAsk(SD.id, 'keep', 'first'), PROFILES)).toEqual({
      profileId: SD.id,
      profileAsk: null,
    });
  });

  it('never lets somebody else’s lower ask downgrade it', () => {
    expect(profileChangeOf(KEPT, anAsk(SD.id, 'upgrade'), PROFILES)).toEqual({});
  });

  it('goes the way the library says for a higher ask', () => {
    expect(profileChangeOf(KEPT, anAsk(UHD.id, 'upgrade'), PROFILES)).toEqual({
      profileId: UHD.id,
      profileAsk: null,
    });
    expect(profileChangeOf(KEPT, anAsk(UHD.id, 'keep'), PROFILES)).toEqual({});
    expect(profileChangeOf(KEPT, anAsk(UHD.id, 'ask'), PROFILES)).toEqual({
      profileAsk: {
        asker: { id: 'priya', name: 'Priya' },
        profileId: UHD.id,
        profileName: 'UHD 4K',
      },
    });
  });

  it('keeps both versions of a film where the library says so, and asks for anything else', () => {
    expect(profileChangeOf(KEPT, anAsk(UHD.id, 'both'), PROFILES)).toEqual({ versions: [UHD.id] });
    expect(
      profileChangeOf({ ...KEPT, versions: [UHD.id] }, anAsk(UHD.id, 'both'), PROFILES),
    ).toEqual({});
    expect(
      profileChangeOf({ ...KEPT, kind: 'series' }, anAsk(UHD.id, 'both'), PROFILES),
    ).toMatchObject({ profileAsk: { profileId: UHD.id } });
  });

  it('lets the first person to ask for a title only followed until now change it', () => {
    expect(
      profileChangeOf({ ...KEPT, origin: 'monitored' }, anAsk(SD.id, 'keep'), PROFILES),
    ).toEqual({ profileId: SD.id, profileAsk: null });
  });

  it('changes nothing for following a title', () => {
    expect(
      profileChangeOf(KEPT, { ...anAsk(UHD.id, 'upgrade'), origin: 'monitored' }, PROFILES),
    ).toEqual({});
  });
});
