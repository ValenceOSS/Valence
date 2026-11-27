import type { MusicAlbum, MusicArtist } from '@ValenceContracts/schemas/Music';

const FOR_THE_ARTIST = 3;

const FOR_FOLLOWING = 2;

/**
 * Albums in the library this profile has not played but is likely to want: by the artists it
 * plays and follows, and in the genres it plays most, the closest first and the newest first among
 * equals. An album that shares nothing with what it plays is left out.
 *
 * @param albums - Every album it can hear, newest first.
 * @param played - The albums it played, latest first.
 * @param artists - Every artist it can hear, to know which it follows.
 * @param most - How many to suggest at most.
 * @returns The albums, the most likely first.
 */
const albumsYouMightLike = (
  albums: readonly MusicAlbum[],
  played: readonly MusicAlbum[],
  artists: readonly MusicArtist[],
  most: number,
): MusicAlbum[] => {
  const heard = new Set(played.map((album) => album.id));
  const plays = new Map<string, number>();
  const genres = new Map<string, number>();

  for (const album of played) {
    plays.set(album.artist.id, (plays.get(album.artist.id) ?? 0) + 1);

    for (const genre of album.genres) {
      genres.set(genre.toLowerCase(), (genres.get(genre.toLowerCase()) ?? 0) + 1);
    }
  }

  const followed = new Set(
    artists.filter((artist) => artist.isFavourite).map((artist) => artist.id),
  );

  return albums
    .flatMap((album, at) => {
      if (heard.has(album.id)) {
        return [];
      }

      const closeness =
        (plays.get(album.artist.id) ?? 0) * FOR_THE_ARTIST +
        (followed.has(album.artist.id) ? FOR_FOLLOWING : 0) +
        album.genres.reduce((sum, genre) => sum + (genres.get(genre.toLowerCase()) ?? 0), 0);

      return closeness === 0 ? [] : [{ album, closeness, at }];
    })
    .sort((one, other) => other.closeness - one.closeness || one.at - other.at)
    .slice(0, most)
    .map(({ album }) => album);
};

export { albumsYouMightLike };
