/**
 * Words made safe to hand MusicBrainz's search, whose query language reads brackets, colons,
 * quotation marks and the like as its own.
 *
 * @param words - The words.
 * @returns Them escaped.
 */
const escapedForMusicBrainz = (words: string): string =>
  words.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, '\\$&');

export { escapedForMusicBrainz };
