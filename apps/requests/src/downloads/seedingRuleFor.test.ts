import { describe, expect, it } from 'vitest';
import { removesByDefault, seedingRuleFor } from '@ValenceRequests/downloads/seedingRuleFor';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';

const anIndexer = (
  overrides: Partial<Pick<Indexer, 'privacy' | 'removesWhenDone' | 'seedSeconds' | 'seedRatio'>>,
) => ({
  privacy: null,
  removesWhenDone: null,
  seedSeconds: null,
  seedRatio: null,
  ...overrides,
});

const NOTHING_ASKED = { minimumSeedSeconds: null, minimumRatio: null };

describe('removesByDefault', () => {
  it('clears up after a public tracker, which asks nothing of anybody', () => {
    expect(removesByDefault({ privacy: 'public' })).toBe(true);
  });

  it('leaves the torrents of a private or semi-private tracker alone', () => {
    expect(removesByDefault({ privacy: 'private' })).toBe(false);
    expect(removesByDefault({ privacy: 'semi-private' })).toBe(false);
  });

  it('treats an indexer nobody has said anything about as private', () => {
    expect(removesByDefault({ privacy: null })).toBe(false);
    expect(removesByDefault(null)).toBe(false);
  });
});

describe('seedingRuleFor', () => {
  it('takes the default from the tracker where the operator has said nothing', () => {
    expect(seedingRuleFor(anIndexer({ privacy: 'public' }), NOTHING_ASKED)).toEqual({
      removesWhenDone: true,
      seedSeconds: null,
      seedRatio: null,
    });
  });

  it('lets an operator clear up after a private tracker if they say so', () => {
    expect(
      seedingRuleFor(anIndexer({ privacy: 'private', removesWhenDone: true }), NOTHING_ASKED)
        .removesWhenDone,
    ).toBe(true);
  });

  it('lets an operator keep seeding a public tracker if they say so', () => {
    expect(
      seedingRuleFor(anIndexer({ privacy: 'public', removesWhenDone: false }), NOTHING_ASKED)
        .removesWhenDone,
    ).toBe(false);
  });

  it('takes what the tracker demands where the operator asked for nothing', () => {
    expect(
      seedingRuleFor(anIndexer({}), { minimumSeedSeconds: 604_800, minimumRatio: 1 }),
    ).toMatchObject({ seedSeconds: 604_800, seedRatio: 1 });
  });

  it('takes what the operator asked for where the release says nothing', () => {
    expect(
      seedingRuleFor(anIndexer({ seedSeconds: 3600, seedRatio: 2 }), NOTHING_ASKED),
    ).toMatchObject({ seedSeconds: 3600, seedRatio: 2 });
  });

  it('seeds for the longer of the two, never the shorter', () => {
    expect(
      seedingRuleFor(anIndexer({ seedSeconds: 3600, seedRatio: 0.5 }), {
        minimumSeedSeconds: 604_800,
        minimumRatio: 1,
      }),
    ).toMatchObject({ seedSeconds: 604_800, seedRatio: 1 });
  });

  it('keeps an operator asking for more than the tracker does', () => {
    expect(
      seedingRuleFor(anIndexer({ seedSeconds: 604_800, seedRatio: 3 }), {
        minimumSeedSeconds: 3600,
        minimumRatio: 1,
      }),
    ).toMatchObject({ seedSeconds: 604_800, seedRatio: 3 });
  });

  it('asks nothing of a release from an indexer that is no longer set up', () => {
    expect(seedingRuleFor(null, null)).toEqual({
      removesWhenDone: false,
      seedSeconds: null,
      seedRatio: null,
    });
  });
});
