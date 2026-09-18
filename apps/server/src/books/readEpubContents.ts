import { decodeXmlText } from './decodeXmlText';
import { insideTheBook } from './readEpubPackage';

type ContentsEntry = {
  title: string;
  href: string;
  anchor: string | null;
  depth: number;
};

const TOC_NAV = /<nav\b[^>]*\btype\s*=\s*"[^"]*\btoc\b[^"]*"[^>]*>([\s\S]*?)<\/nav>/i;

const NAV_TOKEN = /<ol\b[^>]*>|<\/ol>|<a\b[^>]*\bhref\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

const NCX_TOKEN =
  /<navPoint\b[^>]*>|<\/navPoint>|<text>([\s\S]*?)<\/text>|<content\b[^>]*\bsrc\s*=\s*"([^"]*)"[^>]*>/gi;

/**
 * Resolves an address a contents document wrote into a place in the book: the document it points
 * at, inside the archive, and where in that document, if anywhere.
 *
 * @param base - The folder the contents document sits in.
 * @param written - The address it wrote.
 * @returns The document and the place in it, or nothing where it points outside the book.
 */
const placeOf = (base: string, written: string): { href: string; anchor: string | null } | null => {
  const href = insideTheBook(base, written);
  const hash = written.indexOf('#');

  return href === null
    ? null
    : { href, anchor: hash === -1 || hash === written.length - 1 ? null : written.slice(hash + 1) };
};

/**
 * Reads a book's table of contents: what each part is called, and where it starts.
 *
 * A book can say this two ways, and a book from before 2011 only knows the older one. The newer is a
 * page of lists — the `toc` navigation, whose nesting is the depth — and the older is an NCX, whose
 * nested `navPoint`s are. Both are read with patterns, like the package, because both are written by
 * machines to a narrow shape.
 *
 * An entry is kept even where two point at the same place: a contents page lists what its author
 * listed, and a book that names a picture as well as the chapter it sits in means both.
 *
 * @param contentsAt - Where the contents document sits inside the archive.
 * @param xml - The contents document.
 * @param kind - Whether it is the newer navigation page or the older NCX.
 * @returns The entries, in the order the book lists them.
 */
const readEpubContents = (
  contentsAt: string,
  xml: string,
  kind: 'nav' | 'ncx',
): ContentsEntry[] => {
  const base = contentsAt.includes('/') ? contentsAt.slice(0, contentsAt.lastIndexOf('/')) : '';
  const entries: ContentsEntry[] = [];

  if (kind === 'nav') {
    const nav = TOC_NAV.exec(xml)?.[1] ?? '';
    let depth = -1;

    for (const [token, written, label] of nav.matchAll(NAV_TOKEN)) {
      if (token.startsWith('</')) {
        depth -= 1;
      } else if (token.toLowerCase().startsWith('<ol')) {
        depth += 1;
      } else if (written !== undefined && label !== undefined) {
        const place = placeOf(base, written);
        const title = decodeXmlText(label);

        if (place !== null && title !== '') {
          entries.push({ title, ...place, depth: Math.max(depth, 0) });
        }
      }
    }

    return entries;
  }

  let depth = -1;
  let title: string | null = null;

  for (const [token, label, written] of xml.matchAll(NCX_TOKEN)) {
    if (token.startsWith('</')) {
      depth -= 1;
    } else if (token.toLowerCase().startsWith('<navpoint')) {
      depth += 1;
      title = null;
    } else if (label !== undefined) {
      title = decodeXmlText(label);
    } else if (written !== undefined && depth >= 0 && title !== null && title !== '') {
      const place = placeOf(base, written);

      if (place !== null) {
        entries.push({ title, ...place, depth });
      }
    }
  }

  return entries;
};

export type { ContentsEntry };

export { readEpubContents };
