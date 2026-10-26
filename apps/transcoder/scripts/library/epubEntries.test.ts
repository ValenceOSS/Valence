import { describe, expect, it } from 'vitest';
import { epubEntries } from './epubEntries';

const COVER = { data: Buffer.from([0xff, 0xd8]), mediaType: 'image/jpeg', extension: 'jpg' };

const textOf = (name: string, entries: ReturnType<typeof epubEntries>): string =>
  Buffer.from(entries.find((entry) => entry.name === name)?.data ?? []).toString('utf8');

describe('epubEntries', () => {
  it('puts the type first, as every reader looks for it', () => {
    const entries = epubEntries({ title: 'A Book', author: 'An Author', cover: COVER });

    expect(entries[0]?.name).toBe('mimetype');
    expect(textOf('mimetype', entries)).toBe('application/epub+zip');
  });

  it('points the container at the package', () => {
    expect(
      textOf(
        'META-INF/container.xml',
        epubEntries({ title: 'A Book', author: null, cover: COVER }),
      ),
    ).toContain('full-path="OEBPS/content.opf"');
  });

  it('names the book and its author, describes it, and reads one chapter', () => {
    const opf = textOf(
      'OEBPS/content.opf',
      epubEntries({ title: 'A Book', author: 'An Author', cover: COVER }),
    );

    expect(opf).toContain('<dc:title>A Book</dc:title>');
    expect(opf).toContain('<dc:creator>An Author</dc:creator>');
    expect(opf).toContain('<dc:description>A stand-in for A Book by An Author');
    expect(opf).toContain('<itemref idref="chapter"/>');
  });

  it('carries its cover as the cover', () => {
    const entries = epubEntries({ title: 'A Book', author: null, cover: COVER });

    expect(textOf('OEBPS/content.opf', entries)).toContain(
      'href="cover.jpg" media-type="image/jpeg" properties="cover-image"',
    );
    expect(entries.find((entry) => entry.name === 'OEBPS/cover.jpg')?.data).toBe(COVER.data);
  });

  it('leaves out an author nobody named', () => {
    expect(
      textOf('OEBPS/content.opf', epubEntries({ title: 'A Book', author: null, cover: COVER })),
    ).not.toContain('dc:creator');
  });

  it('escapes what XML would read as markup', () => {
    const opf = textOf(
      'OEBPS/content.opf',
      epubEntries({ title: 'Salt & <Pepper>', author: null, cover: COVER }),
    );

    expect(opf).toContain('<dc:title>Salt &amp; &lt;Pepper&gt;</dc:title>');
  });
});
