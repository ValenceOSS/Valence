import { describe, expect, it } from 'vitest';
import { insideTheBook, packagePathIn, readEpubPackage } from './readEpubPackage';

const A_PACKAGE = `<?xml version="1.0"?>
<package version="3.0">
  <metadata>
    <dc:title>Moby-Dick</dc:title>
    <dc:creator>Herman Melville</dc:creator>
    <dc:creator>A Translator</dc:creator>
  </metadata>
  <manifest>
    <item id="one" href="text/one.xhtml" media-type="application/xhtml+xml"/>
    <item id="two" href="text/two.xhtml" media-type="application/xhtml+xml"/>
    <item id="pic" href="images/whale.png" media-type="image/png"/>
    <item id="css" href="style.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="one"/>
    <itemref idref="two"/>
  </spine>
</package>`;

describe('packagePathIn', () => {
  it('finds the package a container points at', () => {
    const container =
      '<container><rootfiles><rootfile full-path="OEBPS/content.opf" /></rootfiles></container>';

    expect(packagePathIn(container)).toBe('OEBPS/content.opf');
  });

  it('says nothing where the container names none', () => {
    expect(packagePathIn('<container></container>')).toBeNull();
  });
});

describe('insideTheBook', () => {
  it('resolves a path against the folder the package sits in', () => {
    expect(insideTheBook('OEBPS', 'text/one.xhtml')).toBe('OEBPS/text/one.xhtml');
  });

  it('follows a step back up, which a book may legitimately take', () => {
    expect(insideTheBook('OEBPS/text', '../images/one.png')).toBe('OEBPS/images/one.png');
  });

  it('drops the part of an address after a hash, which names a place in a document', () => {
    expect(insideTheBook('OEBPS', 'text/one.xhtml#chapter-2')).toBe('OEBPS/text/one.xhtml');
  });

  it('refuses to climb out of the book, which is the only thing it may name', () => {
    expect(insideTheBook('OEBPS', '../../../etc/passwd')).toBeNull();
  });
});

describe('readEpubPackage', () => {
  it('reads the series Calibre says a book is in, and its place', () => {
    const packageXml = `<package><metadata>
      <meta name="calibre:series" content="Red Rising"/>
      <meta name="calibre:series_index" content="2.0"/>
    </metadata><manifest></manifest><spine></spine></package>`;

    expect(readEpubPackage('content.opf', packageXml).series).toEqual({
      name: 'Red Rising',
      position: 2,
    });
  });

  it('reads the collection EPUB 3 says a book belongs to, with its place', () => {
    const packageXml = `<package><metadata>
      <meta property="belongs-to-collection" id="c01">The Expanse</meta>
      <meta refines="#c01" property="collection-type">series</meta>
      <meta refines="#c01" property="group-position">3</meta>
    </metadata><manifest></manifest><spine></spine></package>`;

    expect(readEpubPackage('content.opf', packageXml).series).toEqual({
      name: 'The Expanse',
      position: 3,
    });
  });

  it('says a book is in no series where its package names none', () => {
    expect(readEpubPackage('OEBPS/content.opf', A_PACKAGE).series).toBeNull();
  });

  it('reads what the book is called', () => {
    expect(readEpubPackage('OEBPS/content.opf', A_PACKAGE).title).toBe('Moby-Dick');
  });

  it('reads everybody it says wrote it', () => {
    expect(readEpubPackage('OEBPS/content.opf', A_PACKAGE).authors).toEqual([
      'Herman Melville',
      'A Translator',
    ]);
  });

  it('reads the order it is read in, and only the parts that are read', () => {
    const read = readEpubPackage('OEBPS/content.opf', A_PACKAGE);

    expect(read.spine.map((part) => part.href)).toEqual([
      'OEBPS/text/one.xhtml',
      'OEBPS/text/two.xhtml',
    ]);
  });

  it('keeps the pictures in the manifest, which the spine does not list', () => {
    expect(
      readEpubPackage('OEBPS/content.opf', A_PACKAGE).manifest.get('OEBPS/images/whale.png'),
    ).toBe('image/png');
  });

  it('reads a book whose package sits at the root of the archive', () => {
    const read = readEpubPackage('content.opf', A_PACKAGE);

    expect(read.spine[0]?.href).toBe('text/one.xhtml');
  });

  it('says a book with no spine has no parts, rather than inventing them', () => {
    expect(readEpubPackage('content.opf', '<package></package>').spine).toEqual([]);
  });
});

describe('a package that describes the book', () => {
  const described = `<package version="3.0">
  <metadata>
    <dc:title>Moby-Dick</dc:title>
    <dc:description>A sailor goes after a whale.</dc:description>
  </metadata>
  <manifest><item id="one" href="one.xhtml" media-type="application/xhtml+xml"/></manifest>
  <spine><itemref idref="one"/></spine>
</package>`;

  it('reads the description, which is what a shelf shows under a cover', () => {
    expect(readEpubPackage('content.opf', described).description).toBe(
      'A sailor goes after a whale.',
    );
  });

  it('reports nothing for a package that describes nothing', () => {
    expect(readEpubPackage('content.opf', A_PACKAGE).description).toBeNull();
  });

  it('finds the cover a newer book marks with a property', () => {
    const read = readEpubPackage(
      'OEBPS/content.opf',
      '<package><manifest><item id="c" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/></manifest><spine/></package>',
    );

    expect(read.coverHref).toBe('OEBPS/images/cover.jpg');
  });

  it('finds the cover an older book names in a meta', () => {
    const read = readEpubPackage(
      'OEBPS/content.opf',
      '<package><metadata><meta name="cover" content="the-cover"/></metadata><manifest><item id="the-cover" href="cover.jpg" media-type="image/jpeg"/></manifest><spine/></package>',
    );

    expect(read.coverHref).toBe('OEBPS/cover.jpg');
  });

  it('says there is no cover where the book names none', () => {
    expect(readEpubPackage('OEBPS/content.opf', A_PACKAGE).coverHref).toBeNull();
  });

  it('finds the contents page a newer book marks as its navigation', () => {
    const read = readEpubPackage(
      'content.opf',
      '<package><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/></manifest><spine/></package>',
    );

    expect(read.navHref).toBe('nav.xhtml');
  });

  it('finds the contents an older book names on its spine', () => {
    const read = readEpubPackage(
      'OEBPS/content.opf',
      '<package><manifest><item id="old" href="old.ncx" media-type="application/x-dtbncx+xml"/><item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/></manifest><spine toc="toc"/></package>',
    );

    expect(read.ncxHref).toBe('OEBPS/toc.ncx');
  });

  it('finds the older contents by its type where the spine names none', () => {
    const read = readEpubPackage(
      'content.opf',
      '<package><manifest><item id="x" href="toc.ncx" media-type="application/x-dtbncx+xml"/></manifest><spine/></package>',
    );

    expect(read.ncxHref).toBe('toc.ncx');
  });
});
