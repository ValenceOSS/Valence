import type { ExtraKind } from '@ValenceContracts/schemas/Library';

const BY_FOLDER = new Map<string, ExtraKind>([
  ['trailers', 'trailer'],
  ['behind the scenes', 'behindTheScenes'],
  ['deleted scenes', 'deletedScene'],
  ['featurettes', 'featurette'],
  ['interviews', 'interview'],
  ['scenes', 'scene'],
  ['clips', 'clip'],
  ['shorts', 'short'],
  ['samples', 'sample'],
  ['extras', 'other'],
  ['other', 'other'],
]);

const BY_SUFFIX = new Map<string, ExtraKind>([
  ['trailer', 'trailer'],
  ['behindthescenes', 'behindTheScenes'],
  ['deleted', 'deletedScene'],
  ['deletedscene', 'deletedScene'],
  ['featurette', 'featurette'],
  ['interview', 'interview'],
  ['scene', 'scene'],
  ['clip', 'clip'],
  ['short', 'short'],
  ['sample', 'sample'],
  ['extra', 'other'],
  ['other', 'other'],
]);

const WORDS = [...BY_SUFFIX.keys()].join('|');

const SUFFIX = new RegExp(`[-._ ](${WORDS})\\d*$`, 'i');

const BARE = new RegExp(`^(${WORDS})\\d*$`, 'i');

type FoundExtra = {
  kind: ExtraKind;
  parentPath: string | null;
  seriesFolder: string | null;
};

/**
 * Drops a filename's extension, leaving a leading dot alone so that a hidden file does not become an
 * empty name.
 *
 * @param name - The filename.
 * @returns It without its extension.
 */
const stripExtension = (name: string): string => {
  const lastDot = name.lastIndexOf('.');

  return lastDot > 0 ? name.slice(0, lastDot) : name;
};

/**
 * Splits a path into the folder holding a file and the file's own name.
 *
 * @param path - The file's path.
 * @returns Where it sits and what it is called.
 */
const partsOf = (path: string): { folder: string; name: string } => {
  const at = path.lastIndexOf('/');

  return at <= 0
    ? { folder: '', name: path }
    : { folder: path.slice(0, at), name: path.slice(at + 1) };
};

/**
 * Reads which of a folder's videos are films and programmes in their own right rather than extras
 * marked as such by their own names, so that a file called nothing but the word can tell whether it
 * sits beside exactly one thing.
 *
 * @param inFolder - Every video in the one folder.
 * @returns Those of them that claim to be nobody's extra.
 */
const plainOnes = (inFolder: readonly string[]): string[] =>
  inFolder.filter((candidate) => {
    const stem = stripExtension(partsOf(candidate).name);

    if (BARE.test(stem)) {
      return false;
    }

    const marked = SUFFIX.exec(stem);

    return (
      marked === null ||
      !inFolder.some((other) => stripExtension(partsOf(other).name) === stem.slice(0, marked.index))
    );
  });

/**
 * Finds what a file in an extras folder belongs to.
 *
 * A film keeps its extras beside itself, so the folder above holds the film and the extra hangs off
 * it. A programme keeps them above its seasons, where there is no single file to point at — a series
 * is made of its episodes rather than being one of them — so what comes back is the folder, and the
 * programme is named from that instead.
 *
 * @param folder - The folder holding the film, or the programme.
 * @param videos - Every video in the library, by the folder holding it.
 * @param itself - The extra being placed, so that a file sitting in the same folder as the film is
 *   never offered itself as its own parent.
 * @returns The film to hang off, or the folder of the programme to belong to.
 */
const whatItBelongsTo = (
  folder: string,
  videos: Map<string, string[]>,
  itself: string,
): { parentPath: string | null; seriesFolder: string | null } => {
  const beside = (videos.get(folder) ?? []).filter((candidate) => candidate !== itself);
  const largest = [...beside].sort((left, right) => right.length - left.length)[0] ?? null;

  return beside.length === 0
    ? { parentPath: null, seriesFolder: folder === '' ? null : folder }
    : { parentPath: largest, seriesFolder: null };
};

/**
 * Reads which files are extras rather than things in their own right, and what each belongs to.
 *
 * All three of the ways people mark one are accepted, because all three are what the tools filling
 * these folders already write: a folder named for what is in it, a suffix on the filename itself,
 * and a file called nothing but the word.
 *
 * A suffix counts only where something beside it carries the same name without it. A suffix says
 * which film this belongs to, so with no such film there is nothing being claimed — and a film
 * called `The Short` is a film rather than somebody's short.
 *
 * A bare `Trailer.mkv` names no film at all, so it is read as belonging to the one video it sits
 * beside. Exactly one: a folder holding a film and its trailer is the layout this form comes from,
 * where a folder holding several is a library, and a film in it called `Short` is a film.
 *
 * Done across the whole library at once rather than per file, since a file is read before its
 * neighbours are known and an extra is only an extra by reference to something else.
 *
 * @param paths - Every media file in the library.
 * @returns What each extra is and what it hangs off, for the files that are extras.
 */
const groupExtras = (paths: readonly string[]): Map<string, FoundExtra> => {
  const videos = new Map<string, string[]>();

  for (const path of paths) {
    const { folder } = partsOf(path);

    videos.set(folder, [...(videos.get(folder) ?? []), path]);
  }

  const found = new Map<string, FoundExtra>();

  for (const path of paths) {
    const { folder, name } = partsOf(path);
    const stem = stripExtension(name);
    const folderName = folder.slice(folder.lastIndexOf('/') + 1).toLowerCase();
    const byFolder = BY_FOLDER.get(folderName);

    if (byFolder !== undefined) {
      const above = folder.slice(0, Math.max(0, folder.lastIndexOf('/')));

      found.set(path, { kind: byFolder, ...whatItBelongsTo(above, videos, path) });

      continue;
    }

    const alone = BARE.exec(stem);
    const byBare = alone?.[1] === undefined ? undefined : BY_SUFFIX.get(alone[1].toLowerCase());

    if (byBare !== undefined) {
      const plain = plainOnes(videos.get(folder) ?? []);

      if (plain.length === 1) {
        found.set(path, { kind: byBare, parentPath: plain[0] ?? null, seriesFolder: null });
      }

      continue;
    }

    const marked = SUFFIX.exec(stem);
    const bySuffix = marked?.[1] === undefined ? undefined : BY_SUFFIX.get(marked[1].toLowerCase());

    if (marked === null || bySuffix === undefined) {
      continue;
    }

    const named = stem.slice(0, marked.index);
    const sibling =
      (videos.get(folder) ?? []).find(
        (candidate) => stripExtension(partsOf(candidate).name) === named,
      ) ?? null;

    if (sibling === null) {
      continue;
    }

    found.set(path, { kind: bySuffix, parentPath: sibling, seriesFolder: null });
  }

  return found;
};

export type { FoundExtra };

export { groupExtras };
