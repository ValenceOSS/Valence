import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zipSync } from 'fflate';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openEpub } from './openEpub';

const say = (text: string): Uint8Array => new TextEncoder().encode(text);

const A_PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 7]);

const CONTAINER = say(
  '<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>',
);

const PACKAGE = say(`<package>
  <metadata><dc:title>Moby-Dick</dc:title><dc:creator>Herman Melville</dc:creator></metadata>
  <manifest>
    <item id="one" href="text/one.xhtml" media-type="application/xhtml+xml"/>
    <item id="two" href="text/two.xhtml" media-type="application/xhtml+xml"/>
    <item id="pic" href="images/whale.png" media-type="image/png"/>
  </manifest>
  <spine><itemref idref="one"/><itemref idref="two"/></spine>
</package>`);

const address = (href: string): string => `/served/${href}`;

let where = '';

let path = '';

let withContents = '';

const NAV_PACKAGE = say(`<package>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="one" href="text/one.xhtml" media-type="application/xhtml+xml"/>
    <item id="two" href="text/two.xhtml" media-type="application/xhtml+xml"/>
    <item id="art" href="images/art.png" media-type="image/png"/>
    <item id="cover" href="images/cover.png" media-type="image/png" properties="cover-image"/>
  </manifest>
  <spine><itemref idref="one"/><itemref idref="two"/></spine>
</package>`);

const COVER = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 42]);

const aBook = async (name: string, files: Record<string, Uint8Array>): Promise<string> => {
  const at = join(where, name);

  await writeFile(at, zipSync(files));

  return at;
};

beforeAll(async () => {
  where = await mkdtemp(join(tmpdir(), 'valence-epub-'));
  path = await aBook('moby.epub', {
    'META-INF/container.xml': CONTAINER,
    'OEBPS/content.opf': PACKAGE,
    'OEBPS/text/one.xhtml': say(
      '<html><body><p>Call me Ishmael.</p><script>alert(1)</script></body></html>',
    ),
    'OEBPS/text/two.xhtml': say(
      '<html><body><p>Some years ago.</p><img src="../images/whale.png"/></body></html>',
    ),
    'OEBPS/images/whale.png': A_PNG,
  });
  withContents = await aBook('contents.epub', {
    'META-INF/container.xml': CONTAINER,
    'OEBPS/content.opf': NAV_PACKAGE,
    'OEBPS/nav.xhtml': say(
      '<nav epub:type="toc"><ol><li><a href="text/one.xhtml">Loomings</a></li><li><a href="text/two.xhtml#pequod">The Pequod</a></li><li><a href="text/gone.xhtml">Lost</a></li></ol></nav>',
    ),
    'OEBPS/text/one.xhtml': say(
      '<p><a href="two.xhtml#pequod">On</a> <a href="#here">Here</a> <a href="gone.xhtml">Gone</a> <a href="https://example.com/">Out</a></p>',
    ),
    'OEBPS/text/two.xhtml': say('<p id="pequod">The Pequod.</p>'),
    'OEBPS/images/art.png': A_PNG,
    'OEBPS/images/cover.png': COVER,
  });
});

afterAll(async () => {
  await rm(where, { recursive: true, force: true });
});

describe('openEpub', () => {
  it('opens as a book that reflows, since how many pages it makes is up to the screen', async () => {
    expect((await openEpub(path, address))?.layout).toBe('reflow');
  });

  it('reads the order it is read in', async () => {
    const book = await openEpub(path, address);

    expect(book?.spine.map((part) => part.href)).toEqual([
      'OEBPS/text/one.xhtml',
      'OEBPS/text/two.xhtml',
    ]);
  });

  it('names the parts by where they fall, since a spine says order and not names', async () => {
    expect((await openEpub(path, address))?.spine[0]?.title).toBe('Part 1');
  });

  it('reads a part, and cleans it on the way out', async () => {
    const document = await (await openEpub(path, address))?.readDocument(0);

    expect(document).toContain('Call me Ishmael.');
    expect(document).not.toContain('script');
  });

  it('points a picture at Valence, resolved from where the part sits and not the book', async () => {
    const document = await (await openEpub(path, address))?.readDocument(1);

    expect(document).toContain('/served/OEBPS/images/whale.png');
  });

  it('serves a picture the book holds', async () => {
    const picture = await (await openEpub(path, address))?.readResource('OEBPS/images/whale.png');

    expect(picture?.contentType).toBe('image/png');
    expect(picture?.bytes).toEqual(A_PNG);
  });

  it('will not serve something outside the book, however the address is written', async () => {
    const book = await openEpub(path, address);

    expect(await book?.readResource('../../../etc/passwd')).toBeNull();
  });

  it('says nothing of a part it does not hold', async () => {
    expect(await (await openEpub(path, address))?.readDocument(9)).toBeNull();
  });

  it('will not open an archive that is not a book', async () => {
    const wrong = await aBook('nothing.epub', { 'hello.txt': say('hello') });

    expect(await openEpub(wrong, address)).toBeNull();
  });

  it('will not open a book whose container points nowhere', async () => {
    const wrong = await aBook('lost.epub', {
      'META-INF/container.xml': say('<container></container>'),
    });

    expect(await openEpub(wrong, address)).toBeNull();
  });

  it('will not open a file that is not there', async () => {
    expect(await openEpub(join(where, 'missing.epub'), address)).toBeNull();
  });
});

describe('what a book says about itself', () => {
  it('carries the title and author out of the package rather than dropping them', async () => {
    const book = await openEpub(path, address);

    expect(book?.about).toMatchObject({ title: 'Moby-Dick', authors: ['Herman Melville'] });
  });

  it('says how much each part holds, so progress can be told across the whole book', async () => {
    const book = await openEpub(path, address);

    expect(book?.spine[0]?.size).toBeGreaterThan(0);
    expect(book?.spine[1]?.size).toBeGreaterThan(book?.spine[0]?.size ?? 0);
  });

  it('reads the table of contents, and which part each entry is in', async () => {
    const contents = await (await openEpub(withContents, address))?.readContents();

    expect(contents).toEqual([
      { title: 'Loomings', part: 0, anchor: null, depth: 0 },
      { title: 'The Pequod', part: 1, anchor: 'pequod', depth: 0 },
    ]);
  });

  it('lists the parts themselves where the book has no table of contents', async () => {
    const contents = await (await openEpub(path, address))?.readContents();

    expect(contents).toEqual([
      { title: 'Part 1', part: 0, anchor: null, depth: 0 },
      { title: 'Part 2', part: 1, anchor: null, depth: 0 },
    ]);
  });

  it('points a link to another part at that part, and one within a part at itself', async () => {
    const document = await (await openEpub(withContents, address))?.readDocument(0);

    expect(document).toContain('href="#valence-part-1:pequod"');
    expect(document).toContain('href="#valence-part-0:here"');
  });

  it('keeps the words of a link to nowhere in the book, and loses its address', async () => {
    const document = await (await openEpub(withContents, address))?.readDocument(0);

    expect(document).toContain('<a>Gone</a>');
  });

  it('leaves a link out to the web as it was', async () => {
    const document = await (await openEpub(withContents, address))?.readDocument(0);

    expect(document).toContain('href="https://example.com/"');
  });

  it('reads the cover the book declares', async () => {
    const cover = await (await openEpub(withContents, address))?.readCover();

    expect(cover?.bytes).toEqual(COVER);
  });

  it('uses the first picture as a cover where the book declares none', async () => {
    const cover = await (await openEpub(path, address))?.readCover();

    expect(cover?.bytes).toEqual(A_PNG);
  });

  it('has no cover where the book holds no picture at all', async () => {
    const bare = await aBook('bare.epub', {
      'META-INF/container.xml': CONTAINER,
      'OEBPS/content.opf': say(
        '<package><manifest><item id="one" href="one.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="one"/></spine></package>',
      ),
      'OEBPS/one.xhtml': say('<p>Words only.</p>'),
    });

    expect(await (await openEpub(bare, address))?.readCover()).toBeNull();
  });
});
