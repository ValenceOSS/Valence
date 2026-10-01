import { describe, expect, it } from 'vitest';
import { LidarrAlbumSchema } from './LidarrAlbumSchema';

describe('LidarrAlbumSchema', () => {
  it('reads an album, how many of its tracks are there, and its artist', () => {
    expect(
      LidarrAlbumSchema.parse({
        title: 'OK Computer',
        disambiguation: '',
        overview: '…',
        artistId: 2,
        foreignAlbumId: 'b1392450-e666-3926-a536-22c65f834433',
        monitored: true,
        anyReleaseOk: true,
        profileId: 1,
        duration: 3_200_000,
        albumType: 'Album',
        secondaryTypes: [],
        mediumCount: 1,
        ratings: { votes: 0, value: 0 },
        releaseDate: '1997-05-21T00:00:00Z',
        releases: [],
        genres: [],
        media: [],
        artist: {
          artistName: 'Radiohead',
          foreignArtistId: 'a74b1b7f-71a5-4011-9441-d0b5e4122711',
          monitored: true,
          id: 2,
        },
        images: [],
        links: [],
        statistics: {
          trackFileCount: 12,
          trackCount: 12,
          totalTrackCount: 12,
          sizeOnDisk: 400_000_000,
          percentOfTracks: 100,
        },
        grabbed: false,
        id: 9,
      }),
    ).toEqual({
      id: 9,
      foreignAlbumId: 'b1392450-e666-3926-a536-22c65f834433',
      title: 'OK Computer',
      artistId: 2,
      monitored: true,
      statistics: { trackFileCount: 12, trackCount: 12, totalTrackCount: 12 },
      artist: {
        id: 2,
        foreignArtistId: 'a74b1b7f-71a5-4011-9441-d0b5e4122711',
        artistName: 'Radiohead',
        monitored: true,
      },
    });
  });
});
