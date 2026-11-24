import type { MusicAlbum, MusicArtist } from '@ValenceContracts/schemas/Music';

/**
 * The artists this profile listens to most: those with the most albums among what it played, the
 * latest played first among equals, then the ones it follows that it has not played lately.
 *
 * @param played - The albums it played, latest first.
 * @param artists - Every artist it can hear.
 * @param most - How many to name at most.
 * @returns The artists, most listened to first.
 */
const topArtistsOf = (
  played: readonly MusicAlbum[],
  artists: readonly MusicArtist[],
  most: number,
): MusicArtist[] => {
  const plays = new Map<string, number>();

  for (const album of played) {
    plays.set(album.artist.id, (plays.get(album.artist.id) ?? 0) + 1);
  }

  const byId = new Map(artists.map((artist) => [artist.id, artist]));
  const listenedTo = [...plays.entries()]
    .map(([id, count], at) => ({ artist: byId.get(id), count, at }))
    .sort((one, other) => other.count - one.count || one.at - other.at)
    .flatMap(({ artist }) => (artist === undefined ? [] : [artist]));
  const followed = artists.filter((artist) => artist.isFavourite && !plays.has(artist.id));

  return [...listenedTo, ...followed].slice(0, most);
};

export { topArtistsOf };
