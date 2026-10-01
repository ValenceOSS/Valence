import { describe, expect, it } from 'vitest';
import { ArrAppChangeSchema, ArrAppDraftSchema, FulfilmentSchema } from './ArrApp';

describe('ArrAppDraftSchema', () => {
  it('fills in what somebody connecting an app need not decide, and tidies its paths', () => {
    expect(
      ArrAppDraftSchema.parse({
        name: ' Radarr ',
        kind: 'radarr',
        url: 'http://radarr:7878',
        remotePath: '/movies/',
        localPath: ' /media/Films ',
      }),
    ).toEqual({
      name: 'Radarr',
      kind: 'radarr',
      url: 'http://radarr:7878',
      apiKey: '',
      remotePath: '/movies',
      localPath: '/media/Films',
      isEnabled: true,
    });
  });

  it('refuses an app of a kind Valence does not know, or with no address', () => {
    expect(
      ArrAppDraftSchema.safeParse({ name: 'Readarr', kind: 'readarr', url: 'http://r' }).success,
    ).toBe(false);
    expect(ArrAppDraftSchema.safeParse({ name: 'Radarr', kind: 'radarr', url: '' }).success).toBe(
      false,
    );
  });

  it('changes only what it is given, and never the kind', () => {
    expect(ArrAppChangeSchema.parse({ kind: 'sonarr', isEnabled: false })).toEqual({
      isEnabled: false,
    });
  });
});

describe('FulfilmentSchema', () => {
  it('searches on add and names no metadata profile unless told otherwise', () => {
    expect(
      FulfilmentSchema.parse({
        appId: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
        rootFolderPath: '/movies',
        qualityProfileId: 4,
      }),
    ).toEqual({
      appId: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
      rootFolderPath: '/movies',
      qualityProfileId: 4,
      metadataProfileId: null,
      searchesOnAdd: true,
    });
  });
});
