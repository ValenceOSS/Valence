import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative } from 'node:path';
import { AUDIO_RECIPES, audioClipArguments } from './audioClipArguments';
import { chapterMarks } from './chapterMarks';
import { clipArguments } from './clipArguments';
import { colourOf } from './colourOf';
import { coverArguments } from './coverArguments';
import { epubEntries } from './epubEntries';
import { fillArguments } from './fillArguments';
import { storedZip } from './storedZip';
import { taggedCopyArguments } from './taggedCopyArguments';
import { tagsFromPath } from './tagsFromPath';
import type { PathTags } from './tagsFromPath';

const say = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const ffmpeg = process.env['VALENCE_FFMPEG'] ?? 'ffmpeg';

const fill = fillArguments(process.argv.slice(2), process.env['INIT_CWD'] ?? process.cwd());

if (fill.kind === 'refused') {
  process.stderr.write(`${fill.message}\n`);
  process.exit(1);
}

if (fill.cover !== null && !existsSync(fill.cover)) {
  process.stderr.write(`There is no picture at ${fill.cover} to use as the cover.\n`);
  process.exit(1);
}

const scratch = mkdtempSync(join(tmpdir(), 'valence-library-fill-'));

const clips = new Map<string, string>();

/**
 * Runs FFmpeg, failing with what it said where it could not do what it was asked.
 *
 * @param args - Its arguments.
 * @param what - What it was making, for the message.
 * @throws If FFmpeg cannot be run or fails.
 */
const run = (args: string[], what: string): void => {
  const outcome = spawnSync(ffmpeg, args, { encoding: 'utf8' });

  if (outcome.error !== undefined) {
    throw new Error(`${ffmpeg} could not be run. Run pnpm ffmpeg:sync, or put ffmpeg on PATH.`);
  }

  if (outcome.status !== 0) {
    throw new Error(`${ffmpeg} could not write ${what}:\n${outcome.stderr}`);
  }
};

/**
 * Makes the clip for one container once, so every file of that kind is a copy of it.
 *
 * @param extension - The container, by its file extension.
 * @returns Where the clip is.
 * @throws If there is no recipe for it, or FFmpeg cannot write it.
 */
const clipFor = (extension: string): string => {
  const made = clips.get(extension);

  if (made !== undefined) {
    return made;
  }

  const path = join(scratch, `clip.${extension}`);
  const args =
    AUDIO_RECIPES[extension] === undefined
      ? clipArguments(extension, fill.seconds, path)
      : audioClipArguments(extension, fill.seconds, path);

  if (args === null) {
    throw new Error(`There is no recipe for a .${extension} clip.`);
  }

  run(args, `a .${extension} clip`);
  clips.set(extension, path);

  return path;
};

/**
 * Makes the picture an album or a book is drawn with: the one given, or a plain colour of its own.
 *
 * @param name - What it is a picture of, which chooses the colour.
 * @param shape - Whether it is an album's cover or a book's.
 * @returns Where the picture is.
 */
const coverFor = (name: string, shape: 'album' | 'book'): string => {
  if (fill.cover !== null) {
    return fill.cover;
  }

  const path = join(scratch, `cover-${colourOf(name)}-${shape}.jpg`);

  if (!existsSync(path)) {
    run(coverArguments(colourOf(name), shape, path), `the cover of ${name}`);
  }

  return path;
};

/**
 * Gives the folder an audio file sits in its cover, where it has none and is not the library
 * folder itself, so an album or a spoken book is drawn with its picture.
 *
 * @param file - The audio file.
 */
const coverTheFolderOf = (file: string): void => {
  const folder = dirname(file);

  if (folder === fill.root) {
    return;
  }

  const picture = coverFor(basename(folder), 'album');
  const cover = join(folder, `cover${extname(picture).toLowerCase()}`);

  if (!existsSync(cover)) {
    copyFileSync(picture, cover);
  }
};

const marks = join(scratch, 'chapters.txt');

writeFileSync(marks, chapterMarks(fill.seconds, fill.chapters));

/**
 * Lists the tags a stand-in audio file carries from its path, leaving out what the path does not
 * say. The artist is the album's artist too, and a narrator is credited as the composer, where
 * spoken books keep them.
 *
 * @param tags - What its path says.
 * @returns Each tag's name and value, as FFmpeg calls them.
 */
const tagsOf = (tags: PathTags): [string, string][] => {
  const named: [string, string][] = [['title', tags.title]];

  if (tags.artist !== null) {
    named.push(['artist', tags.artist], ['album_artist', tags.artist]);
  }

  if (tags.album !== null) {
    named.push(['album', tags.album]);
  }

  if (tags.track !== null) {
    named.push(['track', tags.track.toString()]);
  }

  if (tags.year !== null) {
    named.push(['date', tags.year.toString()]);
  }

  if (tags.narrator !== null) {
    named.push(['composer', tags.narrator]);
  }

  return named;
};

/**
 * Writes one stand-in file where it belongs: a clip of a film or episode, a tagged clip of a track
 * or a spoken book, or a short book.
 *
 * @param file - Where it goes.
 */
const make = (file: string): void => {
  const extension = extname(file).slice(1).toLowerCase();
  const tags = tagsFromPath(fill.root, file);

  if (extension === 'epub') {
    const picture = coverFor(tags.album ?? tags.title, 'book');
    const pictureExtension = extname(picture).slice(1).toLowerCase();

    writeFileSync(
      file,
      storedZip(
        epubEntries({
          title: tags.album ?? tags.title,
          author: tags.artist,
          cover: {
            data: readFileSync(picture),
            mediaType: pictureExtension === 'jpg' ? 'image/jpeg' : `image/${pictureExtension}`,
            extension: pictureExtension,
          },
        }),
      ),
    );

    return;
  }

  if (AUDIO_RECIPES[extension] === undefined) {
    copyFileSync(clipFor(extension), file);

    return;
  }

  const args = taggedCopyArguments({
    clip: clipFor(extension),
    output: file,
    extension,
    tags: [...tagsOf(tags), ...fill.tags],
    chapters: extension === 'm4b' ? marks : null,
  });

  if (args === null) {
    throw new Error(`There is no recipe for a .${extension} file.`);
  }

  run(args, relative(fill.root, file));
  coverTheFolderOf(file);
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
      make(file);
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
