import { cleanBookDocument } from './cleanBookDocument';
import { imageTypeFor } from './imageTypeFor';
import { readEpubContents } from './readEpubContents';
import { insideTheBook, packagePathIn, readEpubPackage } from './readEpubPackage';
import { readZipDirectory } from './readZipDirectory';
import { readZipEntry } from './readZipEntry';
import type { ContentsPlace, ReflowBook, SpineEntry } from './BookFile';
import type { ZipEntry } from './readZipDirectory';

const CONTAINER = 'META-INF/container.xml';

/**
 * Names a part of a book by where it comes, for a book whose table of contents does not name it.
 *
 * @param at - Which part of the book this is.
 * @returns What to call it.
 */
const nameFor = (at: number): string => `Part ${(at + 1).toString()}`;

/**
 * The folder a path inside the archive sits in.
 *
 * @param href - The path.
 * @returns Its folder, or nothing for a path at the root.
 */
const folderOf = (href: string): string =>
  href.includes('/') ? href.slice(0, href.lastIndexOf('/')) : '';

/**
 * Writes a place in the book as an address the reader follows rather than leaves the page for.
 *
 * @param part - Which part of the book.
 * @param anchor - Where in it, if anywhere.
 * @returns The address.
 */
const placeLink = (part: number, anchor: string | null): string =>
  `#valence-part-${part.toString()}${anchor === null ? '' : `:${anchor}`}`;

/**
 * Opens an ebook, which is a zip of documents that lay themselves out wherever they are shown.
 *
 * Nothing here becomes a picture. A page in an EPUB is not a thing the file has an opinion about:
 * how many pages its text makes is decided by the screen, the size somebody set and how wide they
 * hold their phone, so the server hands over the text and the reader decides what a page is.
 *
 * The archive is read the way a comic is — the directory only, then one entry at a time — so opening
 * a book costs its package rather than its contents. The table of contents is read only when it is
 * asked for, since most requests are for one part or one picture.
 *
 * Each part says how much it holds, so a reader can say how far through the whole book somebody is
 * rather than how far through a part: a book split into ten uneven parts would otherwise jump.
 *
 * @param path - The book.
 * @param addressFor - Turns a path inside the book into one this server serves, for its pictures.
 * @returns The book's parts and how to read one, or nothing where this is not an ebook.
 */
const openEpub = async (
  path: string,
  addressFor: (href: string) => string | null,
): Promise<ReflowBook | null> => {
  const entries = await readZipDirectory(path);

  if (entries === null) {
    return null;
  }

  const held = new Map<string, ZipEntry>();

  for (const entry of entries) {
    held.set(entry.name, entry);
  }

  const containerEntry = held.get(CONTAINER);
  const containerBytes =
    containerEntry === undefined ? null : await readZipEntry(path, containerEntry);

  if (containerBytes === null) {
    return null;
  }

  const packageAt = packagePathIn(new TextDecoder().decode(containerBytes));
  const packageEntry = packageAt === null ? undefined : held.get(packageAt);
  const packageBytes = packageEntry === undefined ? null : await readZipEntry(path, packageEntry);

  if (packageAt === null || packageBytes === null) {
    return null;
  }

  const read = readEpubPackage(packageAt, new TextDecoder().decode(packageBytes));

  if (read.spine.length === 0) {
    return null;
  }

  const base = folderOf(packageAt);
  const spine: SpineEntry[] = read.spine.map((part, at) => ({
    href: part.href,
    title: nameFor(at),
    size: held.get(part.href)?.uncompressedSize ?? 0,
  }));

  const about =
    read.title === null && read.authors.length === 0 && read.description === null
      ? null
      : { series: null, title: read.title, authors: read.authors, description: read.description };

  /**
   * Reads one entry of the archive as text.
   *
   * @param href - The entry.
   * @returns Its text, or nothing where the book does not hold it.
   */
  const readText = async (href: string | null): Promise<string | null> => {
    const entry = href === null ? undefined : held.get(href);
    const bytes = entry === undefined ? null : await readZipEntry(path, entry);

    return bytes === null ? null : new TextDecoder().decode(bytes);
  };

  /**
   * Reads one picture out of the archive.
   *
   * @param inside - Where it is inside the archive.
   * @returns The picture, or nothing where it is not one the book holds.
   */
  const readPicture = async (inside: string) => {
    const entry = held.get(inside);
    const contentType = imageTypeFor(inside);

    if (entry === undefined || contentType === null) {
      return null;
    }

    const bytes = await readZipEntry(path, entry);

    return bytes === null ? null : { bytes, contentType };
  };

  return {
    layout: 'reflow',
    spine,
    ...(about === null ? {} : { about }),
    readContents: async () => {
      const nav = await readText(read.navHref);
      const ncx = nav === null ? await readText(read.ncxHref) : null;
      const listed =
        nav !== null && read.navHref !== null
          ? readEpubContents(read.navHref, nav, 'nav')
          : ncx !== null && read.ncxHref !== null
            ? readEpubContents(read.ncxHref, ncx, 'ncx')
            : [];

      const places: ContentsPlace[] = listed.flatMap((entry) => {
        const part = spine.findIndex((one) => one.href === entry.href);

        return part === -1
          ? []
          : [{ title: entry.title, part, anchor: entry.anchor, depth: entry.depth }];
      });

      return places.length > 0
        ? places
        : spine.map((one, part) => ({ title: one.title, part, anchor: null, depth: 0 }));
    },
    readDocument: async (part) => {
      const wanted = spine[part];
      const html = wanted === undefined ? null : await readText(wanted.href);

      if (wanted === undefined || html === null) {
        return null;
      }

      const chapterBase = folderOf(wanted.href);

      return cleanBookDocument(
        html,
        (src) => {
          const inside = insideTheBook(chapterBase, src);

          return inside === null || !held.has(inside) ? null : addressFor(inside);
        },
        (href) => {
          const hash = href.indexOf('#');
          const anchor = hash === -1 || hash === href.length - 1 ? null : href.slice(hash + 1);

          if (hash === 0) {
            return placeLink(part, anchor);
          }

          const inside = insideTheBook(chapterBase, href);
          const to = inside === null ? -1 : spine.findIndex((one) => one.href === inside);

          return to === -1 ? null : placeLink(to, anchor);
        },
      );
    },
    readResource: async (href) => {
      const inside = insideTheBook(base, href) ?? href;

      return held.has(inside) ? readPicture(inside) : readPicture(href);
    },
    readCover: async () => {
      const declared = read.coverHref === null ? null : await readPicture(read.coverHref);

      if (declared !== null) {
        return declared;
      }

      const firstPicture = [...read.manifest.keys()].find((href) => imageTypeFor(href) !== null);

      return firstPicture === undefined ? null : readPicture(firstPicture);
    },
  };
};

export { openEpub };
