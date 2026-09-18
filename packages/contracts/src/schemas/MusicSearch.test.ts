import { describe, expect, it } from 'vitest';
import { MusicSearchSchema } from './MusicSearch';

describe('MusicSearch', () => {
  it('reads a search that found nothing', () => {
    const nothing = { tracks: [], albums: [], artists: [], playlists: [] };

    expect(MusicSearchSchema.parse(nothing)).toEqual(nothing);
  });

  it('needs every kind of result, even where one is empty', () => {
    expect(MusicSearchSchema.safeParse({ tracks: [] }).success).toBe(false);
  });
});
