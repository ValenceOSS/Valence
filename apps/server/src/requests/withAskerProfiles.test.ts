import { describe, expect, it, vi } from 'vitest';
import { withAskerProfiles } from './withAskerProfiles';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * A film request, asked for by whoever is given.
 */
const aRequest = (change: Partial<MediaRequest>): MediaRequest => ({
  id: '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
  kind: 'film',
  tmdbId: 100,
  musicBrainzId: null,
  openLibraryId: null,
  title: 'A Film',
  artistName: null,
  year: 2026,
  overview: null,
  posterUrl: 'https://image.example/poster.jpg',
  libraryId: '9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  profileId: null,
  profileName: null,
  isPickedByHand: false,
  state: 'wanted',
  problem: null,
  problemCode: null,
  approval: 'approved',
  refusedBecause: null,
  requestedBy: { id: 'account-1', name: 'Sam' },
  alsoAskedBy: [],
  origin: 'asked',
  isFollowed: false,
  profileAsk: null,
  seasons: null,
  followsNewSeasons: false,
  releaseTypes: null,
  releaseDate: null,
  releaseDates: { theatrical: null, digital: null, physical: null },
  items: [],
  mediaId: null,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...change,
});

const PROFILE = '11111111-1111-4111-8111-111111111111';

describe('withAskerProfiles', () => {
  it('fills in the profile of each asker that has none, asking once per account', async () => {
    const profileOf = vi.fn((accountId: string) =>
      Promise.resolve(accountId === 'account-1' ? PROFILE : null),
    );

    const [first, second] = await withAskerProfiles(
      [
        aRequest({ alsoAskedBy: [{ id: 'account-2', name: 'Kit' }] }),
        aRequest({ id: '7f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b' }),
      ],
      profileOf,
    );

    expect(first?.requestedBy.profileId).toBe(PROFILE);
    expect(first?.alsoAskedBy[0]?.profileId).toBeUndefined();
    expect(second?.requestedBy.profileId).toBe(PROFILE);
    expect(profileOf).toHaveBeenCalledTimes(2);
  });

  it('keeps the profile a request already kept', async () => {
    const kept = '22222222-2222-4222-8222-222222222222';
    const [request] = await withAskerProfiles(
      [aRequest({ requestedBy: { id: 'account-1', name: 'Sam', profileId: kept } })],
      () => Promise.resolve(PROFILE),
    );

    expect(request?.requestedBy.profileId).toBe(kept);
  });
});
