import { describe, expect, it } from 'vitest';
import { LIBRARIES } from '@ValenceRequests/arrImport/testing/LIBRARIES';
import { aSetup } from '@ValenceRequests/arrImport/testing/aSetup';
import { plannedLibrariesOf } from './plannedLibrariesOf';
import { plannedProfilesOf } from './plannedProfilesOf';

const MAPPINGS = [
  { from: '/movies', to: '/media/Films' },
  { from: '/music', to: '/media/Music' },
];

describe('plannedLibrariesOf', () => {
  it('finds the library each app fills, and the profiles what it holds there use', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const lidarr = await aSetup('lidarr-v2', 'lidarr', 'http://lidarr:8686');
    const profiles = plannedProfilesOf([radarr, lidarr], []);
    const planned = plannedLibrariesOf([radarr, lidarr], LIBRARIES, MAPPINGS, profiles);

    expect(planned.libraries.map((one) => one.report)).toEqual([
      {
        libraryId: LIBRARIES[0]?.id,
        libraryName: 'Films',
        libraryKind: 'movies',
        appName: 'Radarr',
        appUrl: 'http://radarr:7878',
        rootFolders: ['/movies'],
        isGuessed: false,
        profileName: 'HD-1080p',
      },
      {
        libraryId: LIBRARIES[2]?.id,
        libraryName: 'Music',
        libraryKind: 'music',
        appName: 'Lidarr',
        appUrl: 'http://lidarr:8686',
        rootFolders: ['/music'],
        isGuessed: false,
        profileName: 'Lossless',
      },
    ]);
    expect(
      planned.libraries.map(({ arrProfileId, metadataProfileId, rootFolder }) => ({
        arrProfileId,
        metadataProfileId,
        rootFolder,
      })),
    ).toEqual([
      { arrProfileId: 4, metadataProfileId: null, rootFolder: '/movies' },
      { arrProfileId: 2, metadataProfileId: 1, rootFolder: '/music' },
    ]);
    expect(planned.unplaced).toEqual([]);
  });

  it('lists a folder no library holds, and gives a library two apps fill to the first', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const fourK = await aSetup('radarr-v4', 'radarr', 'http://radarr4k:7878', 'Radarr 4K');
    const planned = plannedLibrariesOf(
      [radarr, fourK],
      LIBRARIES,
      [...MAPPINGS, { from: '/movies4k', to: '/media/Films/4K' }],
      [],
    );

    expect(planned.libraries.map((one) => one.report.appName)).toEqual(['Radarr']);

    const lost = plannedLibrariesOf([fourK], LIBRARIES, [], []);

    expect(lost.unplaced).toEqual([{ from: 'Radarr 4K', path: '/movies4k' }]);
  });

  it('falls back to a root folder’s defaults, then the first profile, where nothing is held', async () => {
    const lidarr = await aSetup('lidarr-v2', 'lidarr', 'http://lidarr:8686');
    const [held] = plannedLibrariesOf(
      [{ ...lidarr, artists: [] }],
      LIBRARIES,
      MAPPINGS,
      [],
    ).libraries;

    expect(held).toMatchObject({ arrProfileId: 2, metadataProfileId: 1, profile: null });

    const [bare] = plannedLibrariesOf(
      [{ ...lidarr, artists: [], rootFolders: [{ id: 1, path: '/music' }] }],
      LIBRARIES,
      MAPPINGS,
      [],
    ).libraries;

    expect(bare).toMatchObject({ arrProfileId: 2, metadataProfileId: 1 });
  });
});
