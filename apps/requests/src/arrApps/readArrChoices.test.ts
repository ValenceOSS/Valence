import { describe, expect, it } from 'vitest';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { createArrCaller } from './createArrCaller';
import { readArrChoices } from './readArrChoices';

describe('readArrChoices', () => {
  it('reads Radarr’s root folders and quality profiles', async () => {
    const arr = aFakeArr({
      'GET /api/v3/rootfolder': {
        body: [{ path: '/movies', accessible: true, freeSpace: 100, unmappedFolders: [], id: 1 }],
      },
      'GET /api/v3/qualityprofile': { body: [{ name: 'HD-1080p', cutoff: 7, items: [], id: 4 }] },
    });

    expect(await readArrChoices(createArrCaller(arr.fetch, anArrApp()), 'radarr')).toEqual({
      rootFolders: [{ id: 1, path: '/movies', freeBytes: 100, isAccessible: true }],
      qualityProfiles: [{ id: 4, name: 'HD-1080p' }],
      metadataProfiles: [],
    });
    expect(arr.asked.some((one) => one.path.endsWith('/metadataprofile'))).toBe(false);
  });

  it('reads Lidarr’s metadata profiles too', async () => {
    const arr = aFakeArr({
      'GET /api/v1/rootfolder': { body: [{ name: 'Music', path: '/music', id: 1 }] },
      'GET /api/v1/qualityprofile': { body: [{ name: 'Lossless', id: 2 }] },
      'GET /api/v1/metadataprofile': { body: [{ name: 'Standard', id: 1 }] },
    });

    expect(
      await readArrChoices(createArrCaller(arr.fetch, anArrApp({ kind: 'lidarr' })), 'lidarr'),
    ).toEqual({
      rootFolders: [{ id: 1, path: '/music', freeBytes: null, isAccessible: true }],
      qualityProfiles: [{ id: 2, name: 'Lossless' }],
      metadataProfiles: [{ id: 1, name: 'Standard' }],
    });
  });
});
