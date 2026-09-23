import { AUDIO_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIO_FILE_EXTENSIONS';
import { AUDIOBOOK_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIOBOOK_FILE_EXTENSIONS';
import { TEXT_SUBTITLE_EXTENSIONS } from '@ValenceContracts/constants/TEXT_SUBTITLE_EXTENSIONS';
import { VIDEO_FILE_EXTENSIONS } from '@ValenceContracts/constants/VIDEO_FILE_EXTENSIONS';
import { BOOK_FORMATS } from '@ValenceContracts/schemas/Book';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { TorrentFile } from '@ValenceRequests/downloads/TorrentFile';

type SortedFiles = { unwanted: number[]; program: string | null; hasWanted: boolean };

const WANTED: Readonly<Record<LibraryKind, ReadonlySet<string>>> = {
  movies: new Set([...VIDEO_FILE_EXTENSIONS, ...TEXT_SUBTITLE_EXTENSIONS]),
  shows: new Set([...VIDEO_FILE_EXTENSIONS, ...TEXT_SUBTITLE_EXTENSIONS]),
  music: new Set([...AUDIO_FILE_EXTENSIONS, 'jpg', 'jpeg', 'png']),
  books: new Set([...BOOK_FORMATS, ...AUDIOBOOK_FILE_EXTENSIONS, 'cue', 'jpg', 'jpeg', 'png']),
};

const ALONGSIDE: ReadonlySet<string> = new Set([
  ...TEXT_SUBTITLE_EXTENSIONS,
  'cue',
  'jpg',
  'jpeg',
  'png',
]);

const PROGRAMS: ReadonlySet<string> = new Set([
  'exe',
  'com',
  'scr',
  'pif',
  'msi',
  'bat',
  'cmd',
  'lnk',
  'vbs',
  'vbe',
  'js',
  'jse',
  'wsf',
  'hta',
  'ps1',
  'jar',
  'apk',
  'dmg',
  'app',
  'reg',
  'cpl',
]);

const SAMPLE = /(^|[\\/._ -])samples?([\\/._ -]|$)/i;

/**
 * A file's extension, lower case and without its dot.
 *
 * @param name - The file's name, with any folders before it.
 * @returns Its extension, or nothing where it has none.
 */
const extensionOf = (name: string): string => {
  const base = name.slice(Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\')) + 1);
  const at = base.lastIndexOf('.');

  return at <= 0 ? '' : base.slice(at + 1).toLowerCase();
};

/**
 * Sorts a torrent's files by what a library of its kind takes: videos and their subtitles for
 * films and series, tracks and their cover for music, and for books both what is read and what is
 * listened to — an audiobook's tracks with their cover and the cue sheet saying where its chapters
 * fall. Everything else — notes,
 * pictures, links, samples of the video — is not worth fetching. A program among them marks the
 * torrent as the kind of fake that passes for a film and runs something instead, and one with
 * nothing a library takes cannot be filed at all — subtitles, covers and cue sheets are kept with
 * what they belong to, but are not something to file on their own.
 *
 * @param files - The torrent's files.
 * @param kind - The kind of library it is for.
 * @returns Which files to leave out, the first program where there is one, and whether anything
 *   is left worth fetching.
 */
const sortTorrentFiles = (files: readonly TorrentFile[], kind: LibraryKind): SortedFiles => {
  const isWanted = (file: TorrentFile) =>
    WANTED[kind].has(extensionOf(file.name)) &&
    !(VIDEO_FILE_EXTENSIONS.has(extensionOf(file.name)) && SAMPLE.test(file.name));

  return {
    unwanted: files.filter((file) => !isWanted(file)).map((file) => file.index),
    program: files.find((file) => PROGRAMS.has(extensionOf(file.name)))?.name ?? null,
    hasWanted: files.some((file) => isWanted(file) && !ALONGSIDE.has(extensionOf(file.name))),
  };
};

export type { SortedFiles };

export { sortTorrentFiles };
