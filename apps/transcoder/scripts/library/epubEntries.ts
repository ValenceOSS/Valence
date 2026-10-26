import type { ZipEntry } from './storedZip';

type StandInBook = {
  title: string;
  author: string | null;
  cover: { data: Uint8Array; mediaType: string; extension: string };
};

/**
 * Escapes text for the inside of an XML element or a double-quoted attribute.
 *
 * @param text - The text.
 * @returns It, safe to write into XML.
 */
const escaped = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/**
 * Lays out the files of a stand-in EPUB: the type and container every reader looks for first, a
 * package naming the book, its author, a short description and its cover, a table of contents, and
 * one chapter, so it opens and reads as a book, however short.
 *
 * @param book - What the book is called, who wrote it, and its cover.
 * @returns The entries, the type first, as an EPUB has them.
 */
const epubEntries = ({ title, author, cover }: StandInBook): ZipEntry[] => {
  const name = escaped(title);
  const by = author === null ? null : escaped(author);
  const blurb = escaped(
    by === null
      ? `A stand-in for ${title}, made for development.`
      : `A stand-in for ${title} by ${author ?? ''}, made for development.`,
  );
  const page = (heading: string, body: string) =>
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">',
      `<head><title>${heading}</title></head>`,
      `<body>${body}</body>`,
      '</html>',
    ].join('\n');

  return [
    { name: 'mimetype', data: Buffer.from('application/epub+zip') },
    {
      name: 'META-INF/container.xml',
      data: Buffer.from(
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">',
          '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>',
          '</container>',
        ].join('\n'),
      ),
    },
    {
      name: 'OEBPS/content.opf',
      data: Buffer.from(
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id">',
          '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">',
          `<dc:identifier id="id">urn:valence:stand-in:${name}</dc:identifier>`,
          `<dc:title>${name}</dc:title>`,
          ...(by === null ? [] : [`<dc:creator>${by}</dc:creator>`]),
          `<dc:description>${blurb}</dc:description>`,
          '<dc:language>en</dc:language>',
          '<meta name="cover" content="cover"/>',
          '</metadata>',
          '<manifest>',
          '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
          '<item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>',
          `<item id="cover" href="cover.${cover.extension}" media-type="${cover.mediaType}" properties="cover-image"/>`,
          '</manifest>',
          '<spine><itemref idref="chapter"/></spine>',
          '</package>',
        ].join('\n'),
      ),
    },
    {
      name: 'OEBPS/nav.xhtml',
      data: Buffer.from(
        page(
          name,
          `<nav epub:type="toc"><ol><li><a href="chapter.xhtml">${name}</a></li></ol></nav>`,
        ),
      ),
    },
    {
      name: 'OEBPS/chapter.xhtml',
      data: Buffer.from(page(name, `<h1>${name}</h1>\n<p>${blurb}</p>`)),
    },
    { name: `OEBPS/cover.${cover.extension}`, data: cover.data },
  ];
};

export type { StandInBook };

export { epubEntries };
