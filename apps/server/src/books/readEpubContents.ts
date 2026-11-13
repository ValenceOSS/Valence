import { decodeXmlText } from './decodeXmlText';
import { insideTheBook } from './readEpubPackage';
import { tagsOf } from './tagsOf';

type ContentsEntry = {
  title: string;
  href: string;
  anchor: string | null;
  depth: number;
};

const TOC_TYPE = /\btype\s*=\s*"[^"]*\btoc\b/iu;

const HREF = /\bhref\s*=\s*"([^"]*)"/iu;

const SRC = /\bsrc\s*=\s*"([^"]*)"/iu;

const MOST_LABEL_CHARACTERS = 2000;

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
  let depth = -1;
  let labelFrom: number | null = null;
  let written: string | null = null;
  let title: string | null = null;
  let inNav = kind === 'ncx';

  for (const tag of tagsOf(xml)) {
    if (kind === 'nav' && tag.name === 'nav') {
      if (inNav && tag.isClosing) {
        break;
      }

      inNav = inNav || (!tag.isClosing && TOC_TYPE.test(tag.attributes));
      continue;
    }

    if (!inNav) {
      continue;
    }

    const label = (): string | null =>
      labelFrom === null || tag.starts - labelFrom > MOST_LABEL_CHARACTERS
        ? null
        : decodeXmlText(xml.slice(labelFrom, tag.starts));

    if (kind === 'nav') {
      if (tag.name === 'ol') {
        depth += tag.isClosing ? -1 : 1;
      } else if (tag.name === 'a' && !tag.isClosing) {
        written = HREF.exec(tag.attributes)?.[1] ?? null;
        labelFrom = written === null ? null : tag.ends;
      } else if (tag.name === 'a' && written !== null) {
        const place = placeOf(base, written);
        const named = label();

        if (place !== null && named !== null && named !== '') {
          entries.push({ title: named, ...place, depth: Math.max(depth, 0) });
        }

        written = null;
        labelFrom = null;
      }
    } else if (tag.name === 'navpoint') {
      depth += tag.isClosing ? -1 : 1;
      title = tag.isClosing ? title : null;
    } else if (tag.name === 'text') {
      if (tag.isClosing) {
        title = label();
        labelFrom = null;
      } else {
        labelFrom = tag.ends;
      }
    } else if (
      tag.name === 'content' &&
      !tag.isClosing &&
      depth >= 0 &&
      title !== null &&
      title !== ''
    ) {
      const src = SRC.exec(tag.attributes)?.[1];
      const place = src === undefined ? null : placeOf(base, src);

      if (place !== null) {
        entries.push({ title, ...place, depth });
      }
    }
  }

  return entries;
};

export type { ContentsEntry };

export { readEpubContents };
