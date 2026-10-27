import { AUDIO_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIO_FILE_EXTENSIONS';
import { VIDEO_FILE_EXTENSIONS } from '@ValenceContracts/constants/VIDEO_FILE_EXTENSIONS';
import { extname, isAbsolute, join, normalize, resolve, sep } from 'node:path';
import { AUDIO_RECIPES } from './audioClipArguments';

type LibraryFill =
  | {
      kind: 'fill';
      root: string;
      files: string[];
      seconds: number;
      cover: string | null;
      tags: [string, string][];
      chapters: number;
    }
  | { kind: 'refused'; message: string };

const DEFAULT_SECONDS = 2;

const LONGEST_SECONDS = 3 * 60 * 60;

const DEFAULT_CHAPTERS = 5;

const MOST_CHAPTERS = 99;

const COVER_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

const MADE = new Set([...VIDEO_FILE_EXTENSIONS, ...Object.keys(AUDIO_RECIPES), 'epub']);

const USAGE = [
  'Usage: pnpm library:fill <library folder> <file> [<file> …] [options]',
  '',
  'Each file is a path inside the library folder, named as a real one would be. A shell range',
  'names a run of episodes or tracks:',
  '',
  '  pnpm library:fill ~/Media/Anime "Some Show (1998)/Season 01/Some Show - S01E"{01..12}.mkv',
  '  pnpm library:fill ~/Media/Music "Some Band/Some Album (1999)/0"{1..9}" - Track.flac"',
  '  pnpm library:fill ~/Media/Books "An Author/A Book (1965)/A Book.epub"',
  '  pnpm library:fill ~/Media/Books "An Author/A Book {A Reader}/A Book.m4b"',
  '',
  'Music and spoken books are tagged from their path: the first folder is the artist or author,',
  'the folder a file sits in is its album or book, and the file is its number and title.',
  '',
  'Options:',
  '  --seconds <n>       How long each clip runs, from 1 to 10800. Two unless given.',
  '  --cover <image>     The picture an album or book is given, in place of a plain colour.',
  '  --tag <key=value>   Another tag for every audio file made, such as a MusicBrainz id.',
  '  --chapters <n>      How many chapters an .m4b is marked with. Five unless given.',
].join('\n');

/**
 * Reads a whole number option's value, written in plain digits, refusing anything else.
 *
 * @param name - The option, for the message.
 * @param value - What was given after it.
 * @param most - The largest it may be.
 * @returns The number, or why it is refused.
 */
const wholeNumber = (
  name: string,
  value: string | undefined,
  most: number,
): number | { message: string } => {
  const asked = value !== undefined && /^\d+$/u.test(value) ? Number(value) : Number.NaN;

  return Number.isInteger(asked) && asked >= 1 && asked <= most
    ? asked
    : { message: `${name} takes a whole number from 1 to ${most.toString()}.` };
};

/**
 * Reads what `library:fill` was asked to make: the library folder, each file inside it, how long
 * every clip runs, and what music and books are given besides their path. A file that would land
 * outside the folder, that the scanner would pass over for its extension, or that FFmpeg cannot
 * write is refused rather than made, and so is an option it does not know, so that a mistyped one
 * is never taken for the folder.
 *
 * @param argv - The arguments after the script's own name.
 * @param cwd - Where a relative library folder or cover is read from.
 * @returns The files to make, or why there is nothing to make.
 */
const fillArguments = (argv: readonly string[], cwd: string): LibraryFill => {
  const positional: string[] = [];
  const tags: [string, string][] = [];
  let seconds = DEFAULT_SECONDS;
  let chapters = DEFAULT_CHAPTERS;
  let cover: string | null = null;

  for (let at = 0; at < argv.length; at += 1) {
    const argument = argv[at] ?? '';
    const value = argv[at + 1];

    if (argument === '--help' || argument === '-h') {
      return { kind: 'refused', message: USAGE };
    }

    if (argument === '--seconds' || argument === '--chapters') {
      const read =
        argument === '--seconds'
          ? wholeNumber(argument, value, LONGEST_SECONDS)
          : wholeNumber(argument, value, MOST_CHAPTERS);

      if (typeof read !== 'number') {
        return { kind: 'refused', message: read.message };
      }

      if (argument === '--seconds') {
        seconds = read;
      } else {
        chapters = read;
      }

      at += 1;
    } else if (argument === '--cover') {
      if (value === undefined || !COVER_EXTENSIONS.has(extname(value).slice(1).toLowerCase())) {
        return {
          kind: 'refused',
          message: `--cover takes a picture: one of ${[...COVER_EXTENSIONS].join(', ')}.`,
        };
      }

      cover = resolve(cwd, value);
      at += 1;
    } else if (argument === '--tag') {
      const split = value?.indexOf('=') ?? -1;

      if (value === undefined || split < 1) {
        return { kind: 'refused', message: '--tag takes a key and a value: --tag key=value.' };
      }

      tags.push([value.slice(0, split), value.slice(split + 1)]);
      at += 1;
    } else if (argument.startsWith('-')) {
      return { kind: 'refused', message: `${argument} is not an option.\n\n${USAGE}` };
    } else {
      positional.push(argument);
    }
  }

  const [folder, ...named] = positional;

  if (folder === undefined || named.length === 0) {
    return { kind: 'refused', message: USAGE };
  }

  const root = resolve(cwd, folder);
  const files: string[] = [];

  for (const file of named) {
    const inside = normalize(file);

    if (isAbsolute(file) || inside === '..' || inside.startsWith(`..${sep}`)) {
      return {
        kind: 'refused',
        message: `${file} is not inside the library folder. Name it from the folder, not from /.`,
      };
    }

    const extension = extname(inside).slice(1).toLowerCase();

    if (AUDIO_FILE_EXTENSIONS.has(extension) && !MADE.has(extension)) {
      return {
        kind: 'refused',
        message: `FFmpeg cannot write a .${extension} file, so there is no stand-in for ${file}.`,
      };
    }

    if (!MADE.has(extension)) {
      return {
        kind: 'refused',
        message: `${file} would be passed over by the scanner. Give it one of: ${[...MADE].join(', ')}.`,
      };
    }

    const path = join(root, inside);

    if (!files.includes(path)) {
      files.push(path);
    }
  }

  return { kind: 'fill', root, files, seconds, cover, tags, chapters };
};

export type { LibraryFill };

export { fillArguments };
