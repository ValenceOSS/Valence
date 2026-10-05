import { describe, expect, it } from 'vitest';
import { albumsOfMissingSongs } from './albumsOfMissingSongs';

const song = (title: string, album: string | null, releaseId: string | null = null) => ({
  title,
  artist: 'Bicep',
  album,
  releaseId,
  coverUrl: null,
});

describe('albumsOfMissingSongs', () => {
  it('names each album once, by its first song, counting its songs', () => {
    const albums = albumsOfMissingSongs([
      song('Apricots', 'Isles'),
      song('Glue', 'Bicep'),
      song('Atlas', 'isles'),
    ]);

    expect(albums.map((album) => [album.song.title, album.songCount])).toEqual([
      ['Apricots', 2],
      ['Glue', 1],
    ]);
  });

  it('tells albums apart by the release a song was named on, where it was', () => {
    const albums = albumsOfMissingSongs([
      song('Apricots', 'Isles', '32d2437b-3975-4445-a5b3-b4e6ceb35fd9'),
      song('Atlas', 'Isles', '32d2437b-3975-4445-a5b3-b4e6ceb35fd9'),
      song('Saku', 'Isles', '00000000-0000-4000-8000-000000000001'),
    ]);

    expect(albums.map((album) => album.songCount)).toEqual([2, 1]);
  });

  it('goes by a song’s own title where no album was named', () => {
    expect(albumsOfMissingSongs([song('Apricots', null), song('Glue', null)])).toHaveLength(2);
  });
});
