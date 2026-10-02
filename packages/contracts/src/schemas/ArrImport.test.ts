import { describe, expect, it } from 'vitest';
import {
  ArrImportAskSchema,
  ArrImportOrderSchema,
  ArrWantedBatchSchema,
  ArrWantedSchema,
} from './ArrImport';

const A_WANTED = {
  key: 'radarr:603',
  kind: 'film',
  tmdbId: 603,
  tvdbId: null,
  musicBrainzId: null,
  title: 'The Matrix',
  seasons: null,
  libraryId: null,
  profileId: null,
  isApproved: true,
  requester: null,
};

describe('ArrImportAskSchema', () => {
  it('fills in what an admin need not say, and tidies what they typed', () => {
    expect(
      ArrImportAskSchema.parse({
        sources: [{ kind: 'radarr', url: ' http://radarr:7878 ', apiKey: ' key ' }],
      }),
    ).toEqual({
      sources: [{ kind: 'radarr', url: 'http://radarr:7878', apiKey: 'key' }],
      pathMappings: [],
      secrets: {},
      choices: {},
    });
  });

  it('refuses a source of a kind Valence does not read, or one without a key', () => {
    expect(
      ArrImportAskSchema.safeParse({
        sources: [{ kind: 'readarr', url: 'http://readarr:8787', apiKey: 'key' }],
      }).success,
    ).toBe(false);
    expect(
      ArrImportAskSchema.safeParse({
        sources: [{ kind: 'sonarr', url: 'http://sonarr:8989', apiKey: '' }],
      }).success,
    ).toBe(false);
    expect(ArrImportAskSchema.safeParse({ sources: [] }).success).toBe(false);
  });

  it('takes a choice for each library and nothing else', () => {
    expect(
      ArrImportAskSchema.safeParse({
        sources: [{ kind: 'sonarr', url: 'http://sonarr:8989', apiKey: 'key' }],
        choices: { films: 'giveAway' },
      }).success,
    ).toBe(false);
  });
});

describe('ArrImportOrderSchema', () => {
  it('carries the libraries the server knows of', () => {
    expect(
      ArrImportOrderSchema.parse({
        sources: [{ kind: 'lidarr', url: 'http://lidarr:8686', apiKey: 'key' }],
        libraries: [
          { id: 'music', name: 'Music', kind: 'music', path: '/media/music', requestPath: null },
        ],
      }).libraries,
    ).toHaveLength(1);
  });
});

describe('ArrWantedSchema', () => {
  it('reads something to ask for, and refuses a batch of none or too many', () => {
    expect(ArrWantedSchema.parse(A_WANTED)).toEqual(A_WANTED);
    expect(ArrWantedBatchSchema.safeParse({ items: [] }).success).toBe(false);
    expect(
      ArrWantedBatchSchema.safeParse({ items: Array.from({ length: 26 }, () => A_WANTED) }).success,
    ).toBe(false);
  });
});
