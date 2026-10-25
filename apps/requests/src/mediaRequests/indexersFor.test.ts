import { describe, expect, it } from 'vitest';
import { indexersFor } from './indexersFor';

const ANIME_SITE = { id: '00000000-0000-4000-8000-000000000001', libraryIds: ['anime'] };

const GENERAL_SITE = { id: '00000000-0000-4000-8000-000000000002', libraryIds: [] };

const TPB = { id: '00000000-0000-4000-8000-000000000003', libraryIds: ['films'] };

const ALL = [ANIME_SITE, GENERAL_SITE, TPB];

describe('indexersFor', () => {
  it('searches everywhere while no indexer is kept for a library and nothing was chosen', () => {
    expect(
      indexersFor({ libraryId: 'anime', indexerIds: null }, [
        { ...ANIME_SITE, libraryIds: [] },
        GENERAL_SITE,
      ]),
    ).toBeUndefined();
  });

  it('searches the indexers that serve its library, and those kept for every library', () => {
    expect(indexersFor({ libraryId: 'anime', indexerIds: null }, ALL)).toEqual([
      ANIME_SITE.id,
      GENERAL_SITE.id,
    ]);
    expect(indexersFor({ libraryId: 'films', indexerIds: null }, ALL)).toEqual([
      GENERAL_SITE.id,
      TPB.id,
    ]);
  });

  it('searches only the indexers a request was given, whatever its library', () => {
    expect(indexersFor({ libraryId: 'films', indexerIds: [ANIME_SITE.id] }, ALL)).toEqual([
      ANIME_SITE.id,
    ]);
    expect(indexersFor({ libraryId: 'films', indexerIds: [] }, ALL)).toEqual([
      GENERAL_SITE.id,
      TPB.id,
    ]);
  });

  it('narrows a search by hand to the ones chosen among those it may use', () => {
    expect(
      indexersFor({ libraryId: 'anime', indexerIds: null }, ALL, [GENERAL_SITE.id, TPB.id]),
    ).toEqual([GENERAL_SITE.id]);
    expect(indexersFor({ libraryId: 'anime', indexerIds: null }, ALL, [])).toEqual([]);
  });
});
