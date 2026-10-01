import { describe, expect, it } from 'vitest';
import { ArrRootFoldersSchema } from './ArrRootFoldersSchema';

describe('ArrRootFoldersSchema', () => {
  it('reads Radarr’s and Lidarr’s root folders, free space and all', () => {
    expect(
      ArrRootFoldersSchema.parse([
        {
          path: '/movies',
          accessible: true,
          freeSpace: 1_288_490_188_800,
          unmappedFolders: [{ name: 'Old', path: '/movies/Old', relativePath: 'Old' }],
          id: 1,
        },
        {
          name: 'Music',
          path: '/music',
          defaultMetadataProfileId: 1,
          defaultQualityProfileId: 2,
          defaultMonitorOption: 'all',
          defaultNewItemMonitorOption: 'all',
          defaultTags: [],
          id: 2,
        },
      ]),
    ).toEqual([
      { id: 1, path: '/movies', accessible: true, freeSpace: 1_288_490_188_800 },
      { id: 2, path: '/music', accessible: true },
    ]);
  });
});
