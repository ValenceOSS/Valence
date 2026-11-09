type BookInTorrent = { group: string; torrent: string; path: string };

const NUMBERED_GROUPS: Readonly<Record<string, { group: string; prefix: string }>> = {
  libgenrs_fiction: { group: 'libgen_rs_fic', prefix: 'f_' },
  lgrsfic: { group: 'libgen_rs_fic', prefix: 'f_' },
  libgenrs_nonfiction: { group: 'libgen_rs_non_fic', prefix: 'r_' },
  lgrsnf: { group: 'libgen_rs_non_fic', prefix: 'r_' },
  libgenli_fiction: { group: 'libgen_li_fic', prefix: 'f_' },
};

const NAMED_GROUPS: Readonly<Record<string, string>> = {
  zlib3_files: 'zlib',
  upload_files: 'upload',
};

/**
 * Which of Anna's Archive's bulk torrents holds a book, and where in it, from the path its own
 * servers keep it at: Library Genesis keeps a thousand books to a torrent named for the first of
 * them, each under that number by its md5; Z-Library's and the uploads' torrents are named for the
 * folder their files are in. Nothing for a collection whose books are not each a file of their own.
 *
 * @param serverPath - Where Anna's Archive keeps the book.
 * @returns The torrent's group and name, and the file's path in it, or nothing.
 */
const torrentOfServerPath = (serverPath: string): BookInTorrent | null => {
  const parts = serverPath.split('/');
  const collection = parts[1] ?? '';
  const folder = parts.at(-2) ?? '';
  const file = parts.at(-1) ?? '';
  const numbered = NUMBERED_GROUPS[collection];

  if (folder === '' || file === '') {
    return null;
  }

  if (numbered !== undefined) {
    return /^\d+$/.test(folder)
      ? {
          group: numbered.group,
          torrent: `${numbered.prefix}${folder}.torrent`,
          path: `${folder}/${file}`,
        }
      : null;
  }

  const named = NAMED_GROUPS[collection];

  return named === undefined
    ? null
    : { group: named, torrent: `${folder}.torrent`, path: `${folder}/${file}` };
};

export type { BookInTorrent };

export { torrentOfServerPath };
