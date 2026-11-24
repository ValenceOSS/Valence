import { albumsYouMightLike } from '@ValenceTv/music/albumsYouMightLike';
import { aMusicAlbum } from '@ValenceTv/testing/aMusicAlbum';
import { aMusicArtist } from '@ValenceTv/testing/aMusicArtist';

const PLAYED_ARTIST = aMusicArtist(1);
const FOLLOWED = aMusicArtist(2, { isFavourite: true });
const STRANGER = aMusicArtist(3);

const by = (n: number, artist: typeof PLAYED_ARTIST, genres: string[] = []) =>
  aMusicAlbum(n, { artist: { id: artist.id, name: artist.name }, genres });

const ARTISTS = [PLAYED_ARTIST, FOLLOWED, STRANGER];

describe('albumsYouMightLike', () => {
  it('suggests what the artists played and followed made, and nothing already played', () => {
    const played = [by(1, PLAYED_ARTIST)];
    const albums = [by(1, PLAYED_ARTIST), by(2, PLAYED_ARTIST), by(3, FOLLOWED), by(4, STRANGER)];

    expect(albumsYouMightLike(albums, played, ARTISTS, 10).map((album) => album.title)).toEqual([
      'Album 2',
      'Album 3',
    ]);
  });

  it('suggests a stranger in a genre that is played, whatever its case', () => {
    const played = [by(1, PLAYED_ARTIST, ['Metal'])];
    const albums = [by(4, STRANGER, ['metal']), by(5, STRANGER, ['Jazz'])];

    expect(albumsYouMightLike(albums, played, ARTISTS, 10).map((album) => album.title)).toEqual([
      'Album 4',
    ]);
  });

  it('puts the closest first and the newest first among equals', () => {
    const played = [by(1, PLAYED_ARTIST, ['Metal']), by(9, PLAYED_ARTIST, ['Metal'])];
    const albums = [by(4, STRANGER, ['Metal']), by(5, STRANGER, ['Metal']), by(6, PLAYED_ARTIST)];

    expect(albumsYouMightLike(albums, played, ARTISTS, 10).map((album) => album.title)).toEqual([
      'Album 6',
      'Album 4',
      'Album 5',
    ]);
  });

  it('stops at how many were asked for', () => {
    const played = [by(1, PLAYED_ARTIST)];
    const albums = [by(2, PLAYED_ARTIST), by(3, PLAYED_ARTIST), by(4, PLAYED_ARTIST)];

    expect(albumsYouMightLike(albums, played, ARTISTS, 2)).toHaveLength(2);
  });

  it('suggests nothing where nothing was played and nobody is followed', () => {
    expect(albumsYouMightLike([by(4, STRANGER)], [], ARTISTS, 10)).toEqual([]);
  });
});
