import type { NfoTitle } from './NfoTitle.types';

/**
 * Writes text the way XML holds it, so an ampersand or an angle bracket in a title cannot break the
 * file.
 *
 * @param text - The text.
 * @returns The text, escaped.
 */
const escaped = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/**
 * Writes a title's metadata as an NFO file in Kodi's format, which Jellyfin and Emby both read: a
 * film's beside its file, a show's in its folder, and an episode's beside its file.
 *
 * @param title - What to write.
 * @returns The file's text.
 */
const nfoOf = (title: NfoTitle): string => {
  const line = (tag: string, value: string | number | null) =>
    value === null || value === '' ? [] : [`  <${tag}>${escaped(value.toString())}</${tag}>`];
  const lines = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    `<${title.kind}>`,
    ...line('title', title.title),
    ...line('originaltitle', title.originalTitle),
    ...line('sorttitle', title.sortTitle),
    ...line('year', title.year),
    ...line('season', title.season),
    ...line('episode', title.episode),
    ...line('plot', title.plot),
    ...line('tagline', title.tagline),
    ...line(title.kind === 'episodedetails' ? 'aired' : 'premiered', title.premiered),
    ...line('rating', title.rating),
    ...title.genres.flatMap((one) => line('genre', one)),
    ...title.tags.flatMap((one) => line('tag', one)),
    ...title.studios.flatMap((one) => line('studio', one)),
    ...title.directors.flatMap((one) => line('director', one)),
    ...title.writers.flatMap((one) => line('credits', one)),
    ...(title.ids.tmdb === null
      ? []
      : [
          `  <uniqueid type="tmdb"${title.kind === 'episodedetails' ? '' : ' default="true"'}>${escaped(title.ids.tmdb)}</uniqueid>`,
        ]),
    ...(title.ids.imdb === null
      ? []
      : [`  <uniqueid type="imdb">${escaped(title.ids.imdb)}</uniqueid>`]),
    ...(title.ids.tvdb === null
      ? []
      : [`  <uniqueid type="tvdb">${escaped(title.ids.tvdb)}</uniqueid>`]),
    ...title.cast.flatMap((one) => [
      '  <actor>',
      `    <name>${escaped(one.name)}</name>`,
      ...(one.role === '' ? [] : [`    <role>${escaped(one.role)}</role>`]),
      '  </actor>',
    ]),
    `</${title.kind}>`,
  ];

  return `${lines.join('\n')}\n`;
};

export { nfoOf };
