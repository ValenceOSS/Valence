import { VIDEO_FILE_EXTENSIONS } from '@ValenceContracts/constants/VIDEO_FILE_EXTENSIONS';
import { extname, isAbsolute, join, normalize, resolve, sep } from 'node:path';

type LibraryFill =
  | { kind: 'fill'; root: string; files: string[]; seconds: number }
  | { kind: 'refused'; message: string };

const DEFAULT_SECONDS = 2;

const LONGEST_SECONDS = 3 * 60 * 60;

const USAGE = [
  'Usage: pnpm library:fill <library folder> <file> [<file> …] [--seconds <n>]',
  '',
  'Each file is a path inside the library folder, named as a real one would be. A shell range',
  'names a run of episodes:',
  '',
  '  pnpm library:fill ~/Flux/Anime "Some Show (1998)/Season 01/Some Show - S01E{01..12}.mkv"',
].join('\n');

/**
 * Reads what `library:fill` was asked to make: the library folder, each file inside it, and how
 * long every clip runs. A file that would land outside the folder, or that the scanner would pass
 * over for its extension, is refused rather than made, and so is an option it does not know, so
 * that a mistyped one is never taken for the folder.
 *
 * @param argv - The arguments after the script's own name.
 * @param cwd - Where a relative library folder is read from.
 * @returns The files to make, or why there is nothing to make.
 */
const fillArguments = (argv: readonly string[], cwd: string): LibraryFill => {
  const positional: string[] = [];
  let seconds = DEFAULT_SECONDS;

  for (let at = 0; at < argv.length; at += 1) {
    const argument = argv[at] ?? '';

    if (argument === '--help' || argument === '-h') {
      return { kind: 'refused', message: USAGE };
    }

    if (argument === '--seconds') {
      const asked = Number(argv[at + 1]);

      if (!Number.isInteger(asked) || asked < 1 || asked > LONGEST_SECONDS) {
        return {
          kind: 'refused',
          message: `--seconds takes a whole number from 1 to ${LONGEST_SECONDS.toString()}.`,
        };
      }

      seconds = asked;
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

    if (!VIDEO_FILE_EXTENSIONS.has(extension)) {
      return {
        kind: 'refused',
        message: `${file} would be passed over by the scanner. Give it one of: ${[...VIDEO_FILE_EXTENSIONS].join(', ')}.`,
      };
    }

    const path = join(root, inside);

    if (!files.includes(path)) {
      files.push(path);
    }
  }

  return { kind: 'fill', root, files, seconds };
};

export type { LibraryFill };

export { fillArguments };
