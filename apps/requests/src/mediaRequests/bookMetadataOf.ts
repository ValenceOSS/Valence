/* oxlint-disable valence/no-hard-coded-strings -- an OPF document, which book readers and servers read in its own terms */
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

type BookAbout = Pick<
  MediaRequestRecord,
  'title' | 'artistName' | 'year' | 'overview' | 'openLibraryId'
> & { narrators: readonly string[]; series: string | null };

/**
 * Text made safe to stand inside an XML element or attribute.
 *
 * @param text - The text.
 * @returns It, escaped.
 */
const escaped = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/**
 * What is known of a book as an OPF document, the metadata file Calibre, Audiobookshelf and most
 * book servers read beside a book: its title, author, narrators, year, blurb, series and Open
 * Library id.
 *
 * @param about - The book.
 * @returns The document.
 */
const bookMetadataOf = (about: BookAbout): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId">',
    '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">',
    `    <dc:title>${escaped(about.title)}</dc:title>`,
    ...(about.artistName === null
      ? []
      : [`    <dc:creator opf:role="aut">${escaped(about.artistName)}</dc:creator>`]),
    ...about.narrators.map(
      (narrator) => `    <dc:contributor opf:role="nrt">${escaped(narrator)}</dc:contributor>`,
    ),
    ...(about.year === null ? [] : [`    <dc:date>${about.year.toString()}</dc:date>`]),
    ...(about.overview === null
      ? []
      : [`    <dc:description>${escaped(about.overview)}</dc:description>`]),
    ...(about.openLibraryId === null
      ? []
      : [
          `    <dc:identifier id="BookId" opf:scheme="OLID">OL${about.openLibraryId.toString()}W</dc:identifier>`,
        ]),
    ...(about.series === null
      ? []
      : [`    <meta name="calibre:series" content="${escaped(about.series)}"/>`]),
    '  </metadata>',
    '</package>',
    '',
  ].join('\n');

export type { BookAbout };

export { bookMetadataOf };
