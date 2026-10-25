import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, relative } from 'node:path';
import { clipArguments } from './clipArguments';
import { fillArguments } from './fillArguments';

const say = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const ffmpeg = process.env['VALENCE_FFMPEG'] ?? 'ffmpeg';

const fill = fillArguments(process.argv.slice(2), process.env['INIT_CWD'] ?? process.cwd());

if (fill.kind === 'refused') {
  process.stderr.write(`${fill.message}\n`);
  process.exit(1);
}

const scratch = mkdtempSync(join(tmpdir(), 'valence-library-fill-'));

const clips = new Map<string, string>();

/**
 * Makes the clip for one container once, so every file of that kind is a copy of it.
 *
 * @param extension - The container, by its file extension.
 * @returns Where the clip is.
 * @throws If FFmpeg cannot be run or cannot write that container.
 */
const clipFor = (extension: string): string => {
  const made = clips.get(extension);

  if (made !== undefined) {
    return made;
  }

  const path = join(scratch, `clip.${extension}`);
  const args = clipArguments(extension, fill.seconds, path);

  if (args === null) {
    throw new Error(`There is no recipe for a .${extension} clip.`);
  }

  const outcome = spawnSync(ffmpeg, args, { encoding: 'utf8' });

  if (outcome.error !== undefined) {
    throw new Error(`${ffmpeg} could not be run. Run pnpm ffmpeg:sync, or put ffmpeg on PATH.`);
  }

  if (outcome.status !== 0) {
    throw new Error(`${ffmpeg} could not write a .${extension} clip:\n${outcome.stderr}`);
  }

  clips.set(extension, path);

  return path;
};

let made = 0;
let kept = 0;

try {
  for (const file of fill.files) {
    const shown = relative(fill.root, file);

    if (existsSync(file)) {
      kept += 1;
      say(`kept   ${shown}, which is already there`);
    } else {
      mkdirSync(dirname(file), { recursive: true });
      copyFileSync(clipFor(extname(file).slice(1).toLowerCase()), file);
      made += 1;
      say(`made   ${shown}`);
    }
  }

  say(
    `${made.toString()} made and ${kept.toString()} kept in ${fill.root}. Scan the library to see them.`,
  );
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
