import { describe, expect, it } from 'vitest';
import { indexersFor } from './indexersFor';

const NYAA = { id: '00000000-0000-4000-8000-000000000001', libraryIds: ['anime'] };

const LEETX = { id: '00000000-0000-4000-8000-000000000002', libraryIds: [] };

const TPB = { id: '00000000-0000-4000-8000-000000000003', libraryIds: ['films'] };

const ALL = [NYAA, LEETX, TPB];

describe('indexersFor', () => {
  it('searches everywhere while no indexer is kept for a library and nothing was chosen', () => {
    expect(
      indexersFor({ libraryId: 'anime', indexerIds: null }, [{ ...NYAA, libraryIds: [] }, LEETX]),
    ).toBeUndefined();
  });

  it('searches the indexers that serve its library, and those kept for every library', () => {
    expect(indexersFor({ libraryId: 'anime', indexerIds: null }, ALL)).toEqual([NYAA.id, LEETX.id]);
    expect(indexersFor({ libraryId: 'films', indexerIds: null }, ALL)).toEqual([LEETX.id, TPB.id]);
  });

  it('searches only the indexers a request was given, whatever its library', () => {
    expect(indexersFor({ libraryId: 'films', indexerIds: [NYAA.id] }, ALL)).toEqual([NYAA.id]);
    expect(indexersFor({ libraryId: 'films', indexerIds: [] }, ALL)).toEqual([LEETX.id, TPB.id]);
  });

  it('narrows a search by hand to the ones chosen among those it may use', () => {
    expect(indexersFor({ libraryId: 'anime', indexerIds: null }, ALL, [LEETX.id, TPB.id])).toEqual([
      LEETX.id,
    ]);
    expect(indexersFor({ libraryId: 'anime', indexerIds: null }, ALL, [])).toEqual([]);
  });
});
