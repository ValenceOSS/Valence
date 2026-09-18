/**
 * Builds the address a catalogue's trailer is framed from.
 *
 * The no-cookie host, because a viewer who asked to see a trailer did not ask to be followed around
 * by the place it is hosted; and no related videos at the end, because what a video host thinks
 * somebody should watch next is not what a library is for.
 *
 * @param key - The video host's identifier, as the catalogue gave it.
 * @returns The address to frame.
 */
const catalogueTrailerUrl = (key: string): string =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(key)}?rel=0&modestbranding=1`;

export { catalogueTrailerUrl };
