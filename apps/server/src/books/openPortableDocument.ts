import { readFile } from 'node:fs/promises';
import { ColorSpace, Document, Matrix } from 'mupdf';
import { say } from '@ValenceI18n/say';
import { pdfPartsOf } from './pdfPartsOf';
import { readPdfPageText } from './readPdfPageText';
import { reflowPdfText } from './reflowPdfText';
import type { FixedBook, ReflowBook } from './BookFile';

type OutlineItem = NonNullable<ReturnType<Document['loadOutline']>>[number];

const RENDER_AT = 2;

const SAMPLED_PAGES = 8;

const FEWEST_LETTERS_A_PAGE = 300;

/**
 * Opens a PDF. One whose pages carry their words — a book typeset to PDF rather than scanned — is
 * read as text that reflows like an EPUB: its words rebuilt into paragraphs and headings, split into
 * the chapters its own contents name, so it can be read at any size on any screen. One whose pages
 * are pictures, as a scan or a comic is, has its pages drawn rather than unpacked.
 *
 *
 * A PDF holds instructions, not pictures — text, vectors and fonts that mean nothing until somebody
 * decides how large to draw them. So a page here is rendered, at twice its nominal size so it holds
 * up on a screen that has more pixels than points, and handed over as a picture like every other
 * page in Valence. What reaches a reader is the same whatever the file was.
 *
 * Drawing is not free, which is the whole reason pages are cached. It is also the reason the size is
 * fixed here rather than taken from the request: a reader that asked for a different width on every
 * turn would render the same page again and again.
 *
 * @param path - The document.
 * @returns The pages and how to draw one, or nothing where this is not a document that opens.
 */
const openPortableDocument = async (path: string): Promise<FixedBook | ReflowBook | null> => {
  const data = await readFile(path).catch(() => null);

  if (data === null) {
    return null;
  }

  const opened = ((): Document | null => {
    try {
      return Document.openDocument(data, 'application/pdf');
    } catch {
      return null;
    }
  })();

  if (opened === null) {
    return null;
  }

  const pageCount = ((): number => {
    try {
      return opened.countPages();
    } catch {
      return 0;
    }
  })();

  const stated = (key: string): string | null => {
    try {
      const found = opened.getMetaData(key)?.trim();

      return found === undefined || found === '' ? null : found;
    } catch {
      return null;
    }
  };

  if (pageCount === 0) {
    return null;
  }

  const title = stated(Document.META_INFO_TITLE);
  const author = stated(Document.META_INFO_AUTHOR);

  const drawn = (at: number) => {
    try {
      const page = opened.loadPage(at);
      const picture = page.toPixmap(
        Matrix.scale(RENDER_AT, RENDER_AT),
        ColorSpace.DeviceRGB,
        false,
      );

      return Promise.resolve({ bytes: picture.asPNG(), contentType: 'image/png' });
    } catch {
      return Promise.resolve(null);
    }
  };

  const lettersOn = (at: number): number => {
    try {
      return opened
        .loadPage(at)
        .toStructuredText('preserve-whitespace')
        .asText()
        .replace(/\s/gu, '').length;
    } catch {
      return 0;
    }
  };

  const sampled = Array.from({ length: Math.min(SAMPLED_PAGES, pageCount) }, (_, at) =>
    Math.floor(((at + 0.5) * pageCount) / Math.min(SAMPLED_PAGES, pageCount)),
  );
  const isText =
    sampled.reduce((sum, at) => sum + lettersOn(at), 0) / sampled.length >= FEWEST_LETTERS_A_PAGE;
  const about =
    title === null && author === null
      ? {}
      : {
          about: {
            series: null,
            title,
            authors: author === null ? [] : [author],
            description: null,
          },
        };

  if (isText) {
    const chapters = ((): { title: string; page: number; depth: number }[] => {
      const flatten = (
        items: readonly OutlineItem[],
        depth: number,
      ): { title: string; page: number; depth: number }[] =>
        items.flatMap((item) => [
          ...(item.title === undefined || item.page === undefined
            ? []
            : [{ title: item.title.trim(), page: item.page, depth }]),
          ...flatten(item.down ?? [], depth + 1),
        ]);

      try {
        return flatten(opened.loadOutline() ?? [], 0);
      } catch {
        return [];
      }
    })();
    const parts = pdfPartsOf(
      pageCount,
      chapters.filter((one) => one.depth === 0),
      (from, to) =>
        say('server.books.pagesFromTo', { from: (from + 1).toString(), to: to.toString() }),
    );
    const partOf = (page: number) =>
      Math.max(
        0,
        parts.findIndex((part) => page >= part.from && page < part.to),
      );

    return {
      layout: 'reflow',
      ...about,
      spine: parts.map((part, at) => ({
        href: `part-${at.toString()}`,
        title: part.title,
        size: Math.max(1, part.to - part.from),
      })),
      readContents: () =>
        Promise.resolve(
          chapters.length === 0
            ? parts.map((part, at) => ({ title: part.title, part: at, anchor: null, depth: 0 }))
            : chapters.map((one) => ({
                title: one.title,
                part: partOf(one.page),
                anchor: null,
                depth: one.depth,
              })),
        ),
      readDocument: (part) => {
        const range = parts[part];

        if (range === undefined) {
          return Promise.resolve(null);
        }

        try {
          const pages = Array.from({ length: range.to - range.from }, (_, at) =>
            readPdfPageText(opened.loadPage(range.from + at)),
          );

          return Promise.resolve(reflowPdfText(pages));
        } catch {
          return Promise.resolve(null);
        }
      },
      readResource: () => Promise.resolve(null),
      readCover: () => drawn(0),
    };
  }

  return {
    layout: 'fixed',
    pageCount,
    ...about,
    readPage: (at) => (at < 0 || at >= pageCount ? Promise.resolve(null) : drawn(at)),
  };
};

export { openPortableDocument };
