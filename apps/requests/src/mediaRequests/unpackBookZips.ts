import { copyFile, link, mkdir } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, join, normalize } from 'node:path';
import { AUDIOBOOK_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIOBOOK_FILE_EXTENSIONS';
import { BOOK_FILE_FORMATS } from '@ValenceContracts/constants/BOOK_FILE_FORMATS';
import { readZipDirectory } from '@ValenceCore/zip/readZipDirectory';
import { unpackZipEntry } from '@ValenceCore/zip/unpackZipEntry';
import { extensionOf } from '@ValenceRequests/mediaRequests/extensionOf';
import type { DownloadedFile } from '@ValenceRequests/mediaRequests/findDownloadedFiles';

const UNPACKED = '.valence-unpacked';

const PICTURES: ReadonlySet<string> = new Set(['jpg', 'jpeg', 'png', 'webp']);

const FEWEST_PAGES = 5;

type Unpacked = { files: DownloadedFile[]; folders: string[] };

/**
 * Whether a name in a zip would stay inside the folder it is unpacked into.
 *
 * @param name - The name, as the zip gives it.
 * @returns Whether it stays inside.
 */
const staysInside = (name: string): boolean => {
  const plain = normalize(name.replaceAll('\\', '/'));

  return !isAbsolute(plain) && !plain.split('/').includes('..');
};

/**
 * Takes the books out of a download's zip files, so a pack that zips each book — or every book
 * together — is filed like any other: each ebook, audiobook part and picture a zip holds is written
 * into a hidden folder beside it, named after the zip, so the book takes its name from the zip's. A
 * zip that holds only pages is a comic, and is offered as one, under the same name. Names that
 * would leave their folder are passed over, and a zip that cannot be read is left as it is.
 *
 * @param files - The download's files.
 * @returns The download's files with each zip's books in its place, and the folders made for them.
 */
const unpackBookZips = async (files: readonly DownloadedFile[]): Promise<Unpacked> => {
  const zips = files.filter((file) => extensionOf(file.name) === 'zip');
  const unpacked: DownloadedFile[] = [];
  const folders = new Set<string>();

  for (const zip of zips) {
    const entries = await readZipDirectory(zip.path);

    if (entries === null) {
      continue;
    }

    const into = join(dirname(zip.path), UNPACKED);
    const named = basename(zip.name, extname(zip.name));
    const books = entries.filter((entry) => {
      const extension = extensionOf(entry.name);

      return BOOK_FILE_FORMATS.has(extension) || AUDIOBOOK_FILE_EXTENSIONS.has(extension);
    });
    const pages = entries.filter((entry) => PICTURES.has(extensionOf(entry.name)));

    folders.add(into);

    if (books.length === 0 && pages.length >= FEWEST_PAGES) {
      const comic = join(into, `${named}.cbz`);

      await mkdir(into, { recursive: true });
      await link(zip.path, comic).catch(() => copyFile(zip.path, comic));
      unpacked.push({ path: comic, name: basename(comic), sizeBytes: zip.sizeBytes });

      continue;
    }

    for (const entry of [...books, ...pages]) {
      if (entry.name.endsWith('/') || !staysInside(entry.name)) {
        continue;
      }

      const to = join(into, named, normalize(entry.name.replaceAll('\\', '/')));

      if (await unpackZipEntry(zip.path, entry, to)) {
        unpacked.push({ path: to, name: basename(to), sizeBytes: entry.uncompressedSize });
      }
    }
  }

  return {
    files: [...files.filter((file) => extensionOf(file.name) !== 'zip'), ...unpacked],
    folders: [...folders],
  };
};

export type { Unpacked };

export { unpackBookZips };
