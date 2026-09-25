import { EXTRA_FOLDERS } from './EXTRA_FOLDERS';
import type { ExtraKind } from '@ValenceContracts/schemas/Library';

const BY_NAME = new Map<string, ExtraKind>([
  ['trailer', 'trailer'],
  ['sample', 'sample'],
]);

const BY_SUFFIX: readonly (readonly [string, ExtraKind])[] = [
  ['-trailer', 'trailer'],
  ['.trailer', 'trailer'],
  ['_trailer', 'trailer'],
  ['- trailer', 'trailer'],
  ['-sample', 'sample'],
  ['.sample', 'sample'],
  ['_sample', 'sample'],
  ['- sample', 'sample'],
  ['-scene', 'scene'],
  ['-clip', 'clip'],
  ['-interview', 'interview'],
  ['-behindthescenes', 'behindTheScenes'],
  ['-deleted', 'deletedScene'],
  ['-deletedscene', 'deletedScene'],
  ['-featurette', 'featurette'],
  ['-short', 'short'],
  ['-extra', 'other'],
  ['-other', 'other'],
];

/**
 * Whether a file is an extra rather than a film or an episode, and which kind, by Jellyfin's rules:
 * it sits in a folder named exactly for extras — `Featurettes`, `Behind The Scenes`, `Trailers` —
 * other than the library's own top folder, it is named exactly `trailer` or `sample`, or its name
 * ends `-trailer`, `-featurette`, `-deleted` and the like, a number after it allowed.
 *
 * @param path - The file's path.
 * @param libraryRoot - The library's top folder.
 * @returns The kind of extra, or null where it is not one.
 */
const readExtraKind = (path: string, libraryRoot: string): ExtraKind | null => {
  const folder = path.slice(0, Math.max(0, path.lastIndexOf('/')));
  const folderName = folder.slice(folder.lastIndexOf('/') + 1).toLowerCase();
  const fileName = path.slice(path.lastIndexOf('/') + 1);
  const stem = (
    fileName.includes('.') ? fileName.slice(0, fileName.lastIndexOf('.')) : fileName
  ).toLowerCase();
  const trimmed = stem.replace(/[0-9]+$/, '');
  const byFolder =
    folder.toLowerCase() === libraryRoot.replace(/\/+$/, '').toLowerCase()
      ? undefined
      : EXTRA_FOLDERS.get(folderName);

  return (
    byFolder ??
    BY_NAME.get(stem) ??
    BY_SUFFIX.find(([suffix]) => trimmed.endsWith(suffix))?.[1] ??
    null
  );
};

export { readExtraKind };
