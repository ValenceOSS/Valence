import { basename, extname, relative, sep } from 'node:path';

type PathTags = {
  artist: string | null;
  album: string | null;
  title: string;
  track: number | null;
  year: number | null;
  narrator: string | null;
};

const NUMBERED = /^(?<number>\d{1,3})(?:\s*[-.]\s*|\s+)(?<rest>.+)$/u;

const YEAR = /\s*\((?<year>\d{4})\)/u;

const NARRATOR = /\s*\{(?<narrator>[^}]+)\}/u;

/**
 * Reads the tags a stand-in audio file should carry from where it is named to be, the way a
 * tagged file of music or a spoken book is usually filed: the artist or author as the first folder,
 * the album or book as the folder it sits in, with its year in brackets and a narrator in braces, and
 * the track's number and title in its own name.
 *
 * @param root - The library folder.
 * @param file - The file, inside it.
 * @returns The tags, each null where the path does not say.
 */
const tagsFromPath = (root: string, file: string): PathTags => {
  const folders = relative(root, file).split(sep).slice(0, -1);
  const own = basename(file, extname(file));
  const numbered = NUMBERED.exec(own)?.groups;
  const holder = folders.at(-1) ?? null;
  const year = holder === null ? null : (YEAR.exec(holder)?.groups?.['year'] ?? null);
  const narrator = holder === null ? null : (NARRATOR.exec(holder)?.groups?.['narrator'] ?? null);
  const album =
    holder === null
      ? null
      : holder
          .replace(YEAR, '')
          .replace(NARRATOR, '')
          .replace(/^\d{1,3}\s*-\s*/u, '')
          .trim();

  return {
    artist: folders.length >= 2 ? (folders[0] ?? null) : null,
    album: album === '' ? null : album,
    title: numbered?.['rest']?.trim() ?? own,
    track: numbered?.['number'] === undefined ? null : Number(numbered['number']),
    year: year === null ? null : Number(year),
    narrator: narrator?.trim() ?? null,
  };
};

export type { PathTags };

export { tagsFromPath };
