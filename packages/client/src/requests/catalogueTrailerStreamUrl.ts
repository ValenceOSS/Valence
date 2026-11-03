/**
 * Where the server streams the trailer of something that can be asked for, fetched from the
 * catalogue's video and cut to play behind its page.
 *
 * @param kind - Whether it is a film or a series.
 * @param id - Its catalogue id.
 * @returns The address of its stream.
 */
const catalogueTrailerStreamUrl = (kind: 'film' | 'series', id: string): string =>
  `/api/requests/catalogue/title/${kind}/${encodeURIComponent(id)}/trailer.m3u8`;

export { catalogueTrailerStreamUrl };
