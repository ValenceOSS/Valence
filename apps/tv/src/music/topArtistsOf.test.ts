import { topArtistsOf } from '@ValenceTv/music/topArtistsOf';
import { aMusicAlbum } from '@ValenceTv/testing/aMusicAlbum';
import { aMusicArtist } from '@ValenceTv/testing/aMusicArtist';

const ONE = aMusicArtist(1);
const TWO = aMusicArtist(2);
const THREE = aMusicArtist(3, { isFavourite: true });
const FOUR = aMusicArtist(4);

const by = (n: number, artist: typeof ONE) =>
  aMusicAlbum(n, { artist: { id: artist.id, name: artist.name } });

describe('topArtistsOf', () => {
  it('names first whoever has the most albums among what was played', () => {
    const played = [by(1, ONE), by(2, TWO), by(3, TWO)];

    expect(topArtistsOf(played, [ONE, TWO, FOUR], 10)).toEqual([TWO, ONE]);
  });

  it('puts the latest played first among artists played as much', () => {
    expect(topArtistsOf([by(1, TWO), by(2, ONE)], [ONE, TWO], 10)).toEqual([TWO, ONE]);
  });

  it('follows them with the artists followed but not played lately', () => {
    expect(topArtistsOf([by(1, ONE)], [ONE, TWO, THREE], 10)).toEqual([ONE, THREE]);
  });

  it('leaves out an artist it cannot find, and stops at how many were asked for', () => {
    const played = [by(1, ONE), by(2, TWO), by(3, FOUR)];

    expect(topArtistsOf(played, [ONE, TWO], 10)).toEqual([ONE, TWO]);
    expect(topArtistsOf(played, [ONE, TWO, FOUR], 2)).toEqual([ONE, TWO]);
  });

  it('names nobody where nothing was played and nobody is followed', () => {
    expect(topArtistsOf([], [ONE, TWO], 10)).toEqual([]);
  });
});
