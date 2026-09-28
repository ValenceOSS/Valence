/**
 * Where an artist's picture is read from: this server, which finds their face once on their Apple
 * Music page and keeps it, or shows a record's cover where there is no face to find.
 *
 * @param name - The artist.
 * @param coverOf - The release group whose cover stands in, where there is one.
 * @returns The picture's address.
 */
const artistPictureUrl = (name: string, coverOf: string | null = null): string =>
  `/api/music/catalogue/artists/picture?${new URLSearchParams({
    name,
    ...(coverOf === null ? {} : { cover: coverOf }),
  }).toString()}`;

export { artistPictureUrl };
