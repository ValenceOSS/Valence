import { readFile, stat } from 'node:fs/promises';
import { createExtractorFromData } from 'node-unrar-js';
import { saying } from '@ValenceI18n/saying';
import { imageTypeFor } from './imageTypeFor';
import { inPageOrder } from './inPageOrder';
import { COMIC_INFO, readComicInfo } from './readComicInfo';
import { MOST_XML_BYTES } from './MOST_XML_BYTES';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { BookAbout, FixedBook } from './BookFile';

const MOST_ARCHIVE_BYTES = 1024 * 1024 * 1024;

const MOST_PICTURE_BYTES = 64 * 1024 * 1024;

/**
 * Opens a comic archive that is a RAR rather than a zip.
 *
 * Unlike a zip this is read whole. RAR has no directory that can be reached without the rest of the
 * file, and the library that understands the format takes bytes rather than a path, so opening a
 * volume costs its weight in memory for as long as the open takes. That is why the pages a reader
 * asks for are cached: the second time through a chapter never comes back here.
 *
 * CBR is the older way of shipping a comic and the rarer one — almost everything is a zip — so this
 * is correctness first and speed a distant second.
 *
 * An archive over a gibibyte is refused and said to be, and so is a picture or description whose
 * header declares more than a page or a description could be, before anything is inflated.
 *
 * @param path - The archive.
 * @param onProblem - Told why an archive was refused, where it is a file the reader could see.
 * @returns The pages and how to read one, or nothing where this is not a RAR of pictures.
 */
const openComicRar = async (
  path: string,
  onProblem?: (reason: Said) => void,
): Promise<FixedBook | null> => {
  const size = await stat(path)
    .then((found) => found.size)
    .catch(() => null);

  if (size === null) {
    return null;
  }

  if (size > MOST_ARCHIVE_BYTES) {
    onProblem?.(saying('server.books.openComicRar.thatComicIsLargerThanA'));

    return null;
  }

  const data = await readFile(path).catch(() => null);

  if (data === null) {
    return null;
  }

  const held = new Uint8Array(data).buffer;
  const listing = await createExtractorFromData({ data: held }).catch(() => null);

  if (listing === null) {
    return null;
  }

  const names: string[] = [];
  let describedName: string | null = null;

  try {
    for (const header of listing.getFileList().fileHeaders) {
      if (header.flags.directory) {
        continue;
      }

      if (imageTypeFor(header.name) !== null && header.unpSize <= MOST_PICTURE_BYTES) {
        names.push(header.name);
      }

      if (header.name.toLowerCase().endsWith(COMIC_INFO) && header.unpSize <= MOST_XML_BYTES) {
        describedName = header.name;
      }
    }
  } catch {
    return null;
  }

  const ordered = inPageOrder(names);

  if (ordered.length === 0) {
    return null;
  }

  const about = ((): BookAbout | null => {
    if (describedName === null) {
      return null;
    }

    try {
      const [found] = [...listing.extract({ files: [describedName] }).files];
      const bytes = found?.extraction;

      return bytes === undefined ? null : readComicInfo(new TextDecoder().decode(bytes));
    } catch {
      return null;
    }
  })();

  return {
    layout: 'fixed',
    pageCount: ordered.length,
    ...(about === null ? {} : { about }),
    readPage: async (at) => {
      const name = ordered[at];
      const contentType = name === undefined ? null : imageTypeFor(name);

      if (name === undefined || contentType === null) {
        return null;
      }

      const again = await readFile(path).catch(() => null);

      if (again === null) {
        return null;
      }

      try {
        const extractor = await createExtractorFromData({ data: new Uint8Array(again).buffer });
        const [found] = [...extractor.extract({ files: [name] }).files];
        const bytes = found?.extraction;

        return bytes === undefined ? null : { bytes, contentType };
      } catch {
        return null;
      }
    },
  };
};

export { openComicRar };
