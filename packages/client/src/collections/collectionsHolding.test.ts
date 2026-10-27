import { describe, expect, it } from 'vitest';
import { CollectionSchema } from '@ValenceContracts/schemas/Collection';
import { collectionsHolding } from './collectionsHolding';
import type { CollectionEntryKind } from '@ValenceContracts/schemas/Collection';

/**
 * A collection holding the kinds given.
 *
 * @param id - Which collection.
 * @param holds - What it holds.
 * @returns The collection.
 */
const aCollection = (id: string, holds: CollectionEntryKind[]) =>
  CollectionSchema.parse({
    id,
    name: id,
    description: null,
    isOrdered: false,
    hasOwnArtwork: false,
    entryCount: 1,
    coverMediaIds: [],
    holds,
    updatedAt: '2026-10-27T00:00:00.000Z',
  });

const FILMS = aCollection('00000000-0000-4000-8000-000000000001', ['film']);

const SHOWS = aCollection('00000000-0000-4000-8000-000000000002', ['series']);

const BOTH = aCollection('00000000-0000-4000-8000-000000000003', ['film', 'series']);

describe('collectionsHolding', () => {
  it('keeps the collections holding films for a page of films, and programmes for theirs', () => {
    expect(collectionsHolding([FILMS, SHOWS, BOTH], 'film')).toEqual([FILMS, BOTH]);
    expect(collectionsHolding([FILMS, SHOWS, BOTH], 'series')).toEqual([SHOWS, BOTH]);
  });

  it('puts a collection from a server that does not say what it holds on both', () => {
    const { holds: _unsaid, ...older } = FILMS;
    const parsed = CollectionSchema.parse(older);

    expect(collectionsHolding([parsed], 'series')).toEqual([parsed]);
  });
});
