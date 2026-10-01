import { describe, expect, it } from 'vitest';
import { LidarrArtistSchema } from './LidarrArtistSchema';

describe('LidarrArtistSchema', () => {
  it('reads an artist Lidarr has, by its MusicBrainz id', () => {
    expect(
      LidarrArtistSchema.parse({
        artistMetadataId: 2,
        status: 'continuing',
        ended: false,
        artistName: 'Radiohead',
        foreignArtistId: 'a74b1b7f-71a5-4011-9441-d0b5e4122711',
        tadbId: 0,
        discogsId: 0,
        overview: '…',
        artistType: 'Group',
        disambiguation: '',
        links: [],
        images: [],
        path: '/music/Radiohead',
        qualityProfileId: 1,
        metadataProfileId: 1,
        monitored: true,
        monitorNewItems: 'all',
        genres: [],
        cleanName: 'radiohead',
        sortName: 'radiohead',
        tags: [],
        added: '2026-10-01T09:00:00Z',
        id: 2,
      }),
    ).toEqual({
      id: 2,
      foreignArtistId: 'a74b1b7f-71a5-4011-9441-d0b5e4122711',
      artistName: 'Radiohead',
      path: '/music/Radiohead',
      monitored: true,
    });
  });
});
