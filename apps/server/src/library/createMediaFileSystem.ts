import { readdir, realpath, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { MediaFileSystem, ScanFindings, ScannedFile } from './scanLibrary';

const MAX_DEPTH = 12;

/**
 * Whether a failure to look at a path means the path is not there.
 *
 * `ENOENT` is a real answer: the file has gone, or the link points at nothing. Anything else —
 * refused permission, a stale handle from a mount that dropped, an I/O error — is the filesystem
 * declining to say, and a scan must not read that as absence.
 *
 * @param error - What the filesystem threw.
 * @returns Whether it amounts to "there is nothing here".
 */
const meansItIsGone = (error: NodeJS.ErrnoException): boolean => error.code === 'ENOENT';

/**
 * Nothing found, and nothing that failed.
 *
 * @returns An empty walk.
 */
const nothing = (): ScanFindings => ({ files: [], unreadable: [] });

/**
 * Walks a library root and everything below it, gathering the files worth considering with their
 * sizes and modification times — the two facts a scan uses to decide what has changed.
 *
 * Also gathers what it could not see. A directory that will not open, a link that will not resolve,
 * a file that will not stat: each is a place this walk knows nothing about, and saying so is the
 * point. A walk that answered "no files here" for a folder it could not read would have the scan
 * conclude the media was gone.
 *
 * @param root - Where to start.
 * @param depth - How far down this walk already is.
 * @param seen - The directories already walked, by the real path each resolves to.
 * @returns Every file found, and every path this walk could not read.
 */
const walk = async (root: string, depth: number, seen: Set<string>): Promise<ScanFindings> => {
  if (depth > MAX_DEPTH) {
    return { files: [], unreadable: [root] };
  }

  const entries = await readdir(root, { withFileTypes: true }).catch(() => null);

  if (entries === null) {
    return { files: [], unreadable: [root] };
  }

  const files: ScannedFile[] = [];
  const unreadable: string[] = [];

  for (const entry of entries) {
    const path = join(root, entry.name);

    if (entry.isDirectory()) {
      const below = await walkInto(path, depth + 1, seen);

      files.push(...below.files);
      unreadable.push(...below.unreadable);

      continue;
    }

    const looked = await stat(path).then(
      (details) => ({ details }),
      (error: NodeJS.ErrnoException) => ({ error }),
    );

    if (!('details' in looked)) {
      if (!meansItIsGone(looked.error)) {
        unreadable.push(path);
      }

      continue;
    }

    const { details } = looked;

    if (details.isDirectory()) {
      const below = await walkInto(path, depth + 1, seen);

      files.push(...below.files);
      unreadable.push(...below.unreadable);

      continue;
    }

    if (!details.isFile()) {
      continue;
    }

    files.push({
      path,
      sizeBytes: details.size,
      modifiedAtMs: Math.floor(details.mtimeMs),
    });
  }

  return { files, unreadable };
};

/**
 * Walks a directory unless this walk has been through it already, which is what stops a link
 * pointing back up its own tree from being followed round for ever. Two links to one directory read
 * it once, under whichever name was reached first.
 *
 * A directory already walked is answered with nothing rather than with a failure: it was read, just
 * not twice.
 *
 * @param path - The directory to walk, as it was reached.
 * @param depth - How far down the walk this directory sits.
 * @param seen - The directories already walked, by the real path each resolves to.
 * @returns Everything below it, or nothing where it has been walked already.
 */
const walkInto = async (path: string, depth: number, seen: Set<string>): Promise<ScanFindings> => {
  const resolved = await realpath(path).then(
    (real) => ({ real }),
    (error: NodeJS.ErrnoException) => ({ error }),
  );

  if (!('real' in resolved)) {
    return meansItIsGone(resolved.error) ? nothing() : { files: [], unreadable: [path] };
  }

  const { real } = resolved;

  if (seen.has(real)) {
    return nothing();
  }

  seen.add(real);

  return walk(path, depth, seen);
};

/**
 * The real filesystem, as the scanner uses it. Kept behind an interface so a scan can be tested
 * against a directory tree described in a test rather than one that has to exist on disk.
 */
const createMediaFileSystem = (): MediaFileSystem => ({
  listFiles: (root) => walkInto(root, 0, new Set()),
});

export { createMediaFileSystem };
