import { describe, expect, it } from 'vitest';
import { bookMetadataOf } from './bookMetadataOf';

describe('bookMetadataOf', () => {
  it('writes what is known of a book as an OPF document, escaped', () => {
    const opf = bookMetadataOf({
      title: 'A Book & Its <Sequel>',
      artistName: 'An Author',
      year: 2020,
      overview: 'What it is "about".',
      openLibraryId: 123,
      narrators: ['A Reader'],
      series: 'A Series',
    });

    expect(opf).toContain('<dc:title>A Book &amp; Its &lt;Sequel&gt;</dc:title>');
    expect(opf).toContain('<dc:creator opf:role="aut">An Author</dc:creator>');
    expect(opf).toContain('<dc:contributor opf:role="nrt">A Reader</dc:contributor>');
    expect(opf).toContain('<dc:date>2020</dc:date>');
    expect(opf).toContain('<dc:description>What it is &quot;about&quot;.</dc:description>');
    expect(opf).toContain('opf:scheme="OLID">OL123W</dc:identifier>');
    expect(opf).toContain('<meta name="calibre:series" content="A Series"/>');
  });

  it('leaves out what is not known', () => {
    const opf = bookMetadataOf({
      title: 'A Book',
      artistName: null,
      year: null,
      overview: null,
      openLibraryId: null,
      narrators: [],
      series: null,
    });

    expect(opf).not.toContain('dc:creator');
    expect(opf).not.toContain('dc:date');
    expect(opf).not.toContain('calibre:series');
  });
});
