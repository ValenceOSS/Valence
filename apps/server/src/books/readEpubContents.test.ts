import { describe, expect, it } from 'vitest';
import { readEpubContents } from './readEpubContents';

const A_NAV = `<html><body>
  <nav epub:type="landmarks"><ol><li><a href="text/cover.xhtml">Cover</a></li></ol></nav>
  <nav epub:type="toc" role="doc-toc">
    <ol>
      <li><a href="text/one.xhtml">Chapter &amp; <em>One</em></a>
        <ol>
          <li><a href="text/one.xhtml#s1">A Section</a></li>
        </ol>
      </li>
      <li><a href="text/two.xhtml#start">Chapter Two</a></li>
      <li><a href="../../outside.xhtml">Nowhere</a></li>
    </ol>
  </nav>
</body></html>`;

const AN_NCX = `<ncx>
  <docTitle><text>The Book</text></docTitle>
  <navMap>
    <navPoint id="a" playOrder="1">
      <navLabel><text>Chapter One</text></navLabel>
      <content src="text/one.xhtml"/>
      <navPoint id="b" playOrder="2">
        <navLabel><text>A Section</text></navLabel>
        <content src="text/one.xhtml#s1"/>
      </navPoint>
    </navPoint>
    <navPoint id="c" playOrder="3">
      <navLabel><text>Chapter Two</text></navLabel>
      <content src="text/two.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;

describe('readEpubContents', () => {
  it('reads the table of contents from a navigation page, nesting and all', () => {
    expect(readEpubContents('OEBPS/nav.xhtml', A_NAV, 'nav')).toEqual([
      { title: 'Chapter & One', href: 'OEBPS/text/one.xhtml', anchor: null, depth: 0 },
      { title: 'A Section', href: 'OEBPS/text/one.xhtml', anchor: 's1', depth: 1 },
      { title: 'Chapter Two', href: 'OEBPS/text/two.xhtml', anchor: 'start', depth: 0 },
    ]);
  });

  it('reads only the table of contents, not the landmarks beside it', () => {
    const titles = readEpubContents('nav.xhtml', A_NAV, 'nav').map((entry) => entry.title);

    expect(titles).not.toContain('Cover');
  });

  it('reads the table of contents from an older NCX, nesting and all', () => {
    expect(readEpubContents('OEBPS/toc.ncx', AN_NCX, 'ncx')).toEqual([
      { title: 'Chapter One', href: 'OEBPS/text/one.xhtml', anchor: null, depth: 0 },
      { title: 'A Section', href: 'OEBPS/text/one.xhtml', anchor: 's1', depth: 1 },
      { title: 'Chapter Two', href: 'OEBPS/text/two.xhtml', anchor: null, depth: 0 },
    ]);
  });

  it('leaves out the title of the book, which an NCX writes before its contents', () => {
    const titles = readEpubContents('toc.ncx', AN_NCX, 'ncx').map((entry) => entry.title);

    expect(titles).not.toContain('The Book');
  });

  it('reads nothing from a navigation page with no table of contents', () => {
    expect(readEpubContents('nav.xhtml', '<html><body></body></html>', 'nav')).toEqual([]);
  });

  it('leaves out an entry with no name', () => {
    expect(
      readEpubContents(
        'nav.xhtml',
        '<nav epub:type="toc"><ol><li><a href="one.xhtml">  </a></li></ol></nav>',
        'nav',
      ),
    ).toEqual([]);
  });
});
