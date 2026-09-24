import { readdir, rm, rmdir } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { TEXT_SUBTITLE_EXTENSIONS } from '@ValenceContracts/constants/TEXT_SUBTITLE_EXTENSIONS';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import { diskRefusalOf } from '@ValenceServer/files/diskRefusalOf';

const SIDECAR_EXTENSIONS: ReadonlySet<string> = new Set([
  ...TEXT_SUBTITLE_EXTENSIONS,
  'sub',
  'idx',
  'sup',
  'nfo',
  'jpg',
  'jpeg',
  'png',
  'webp',
]);

type MediaFileDeletion =
  | { kind: 'deleted' }
  | { kind: 'outside' }
  | { kind: 'readOnly' }
  | { kind: 'denied' }
  | { kind: 'failed' };

/**
 * Whether a file beside a film belongs to it alone: named for it, as `Arrival.en.srt` or
 * `Arrival-poster.jpg` are for `Arrival.mkv`, and of a kind that is only ever kept beside something
 * else. Another film is never one, so `Arrival.Extended.mkv` stays where it is.
 *
 * @param name - The name of the file beside it.
 * @param stem - The film's own name, without its extension.
 * @returns Whether it goes with the film.
 */
const isSidecarOf = (name: string, stem: string): boolean =>
  (name.startsWith(`${stem}.`) || name.startsWith(`${stem}-`)) &&
  SIDECAR_EXTENSIONS.has(extname(name).slice(1).toLowerCase());

/**
 * Deletes one media file from its library's disk, with what was kept beside it for it alone —
 * subtitles, an `.nfo`, its own artwork — and the folders it leaves empty on the way up, stopping at
 * the library's own folder.
 *
 * A file already gone counts as deleted, since that was what was asked. A path that is not inside
 * the library is refused before anything is touched, whatever the catalogue says, so a row that
 * went wrong can never reach past the folder it was scanned from. What the disk refuses — a mount
 * that is read-only, a folder Valence may not change — is told apart from any other failure, since
 * the fix for those two is a setting on the machine.
 *
 * @param root - The library's folder.
 * @param path - The file.
 * @returns Whether it went, and why not where it did not.
 */
const deleteMediaFile = async (root: string, path: string): Promise<MediaFileDeletion> => {
  if (path === root || !isUnderAny(path, [root])) {
    return { kind: 'outside' };
  }

  const folder = dirname(path);
  const stem = basename(path, extname(path));

  try {
    await rm(path, { force: true });

    const beside = await readdir(folder).catch(() => []);

    await Promise.all(
      beside
        .filter((name) => isSidecarOf(name, stem))
        .map((name) => rm(join(folder, name), { force: true })),
    );
  } catch (error) {
    const refusal = diskRefusalOf(error instanceof Error ? error : null);

    return refusal.kind === 'missing' ? { kind: 'failed' } : refusal;
  }

  for (let emptied = folder; emptied !== root && isUnderAny(emptied, [root]);) {
    const isGone = await rmdir(emptied).then(
      () => true,
      () => false,
    );

    if (!isGone) {
      break;
    }

    emptied = dirname(emptied);
  }

  return { kind: 'deleted' };
};

export type { MediaFileDeletion };

export { deleteMediaFile };
