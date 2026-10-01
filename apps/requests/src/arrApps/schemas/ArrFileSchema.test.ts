import { describe, expect, it } from 'vitest';
import { ArrFileSchema } from './ArrFileSchema';

describe('ArrFileSchema', () => {
  it('reads where Sonarr put an episode, and where Lidarr put a track', () => {
    expect(
      ArrFileSchema.parse({
        seriesId: 3,
        seasonNumber: 1,
        relativePath: 'Season 01/Severance - S01E02 - Half Loop.mkv',
        path: '/tv/Severance/Season 01/Severance - S01E02 - Half Loop.mkv',
        size: 2_147_483_648,
        dateAdded: '2026-10-01T09:30:00Z',
        quality: { quality: { id: 9, name: 'HDTV-1080p' } },
        id: 77,
      }),
    ).toEqual({ id: 77, path: '/tv/Severance/Season 01/Severance - S01E02 - Half Loop.mkv' });
    expect(
      ArrFileSchema.parse({
        artistId: 2,
        albumId: 9,
        path: '/music/Radiohead/OK Computer (1997)/01 - Airbag.flac',
        size: 30_000_000,
        dateAdded: '2026-10-01T09:30:00Z',
        id: 501,
      }),
    ).toMatchObject({ albumId: 9 });
  });
});
