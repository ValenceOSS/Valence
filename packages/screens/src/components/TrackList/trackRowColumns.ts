/**
 * The columns a row of a song list is laid out in, the same for a song as for one missing from it,
 * so the two line up.
 *
 * @param showsAlbum - Whether the list names each song's album.
 * @returns The grid's classes.
 */
const trackRowColumns = (showsAlbum: boolean): string =>
  showsAlbum
    ? 'grid-cols-[2rem_minmax(0,1fr)_auto_3rem_auto] md:grid-cols-[2rem_minmax(0,1.4fr)_minmax(0,1fr)_auto_3rem_auto]'
    : 'grid-cols-[2rem_minmax(0,1fr)_auto_3rem_auto]';

export { trackRowColumns };
