import { RENDITION_DIRECTORY } from '@ValenceServer/library/isInRenditionDirectory';

type ReencodePaths = {
  directory: string;
  output: string;
  aside: string;
  sample: string;
};

/**
 * The extension a file ends in, so a re-encode can end in the same one.
 *
 * @param path - The file's path.
 * @returns Its extension including the dot, or nothing where it has none.
 */
const extensionOf = (path: string): string => {
  const name = path.slice(path.lastIndexOf('/') + 1);
  const dot = name.lastIndexOf('.');

  return dot > 0 ? name.slice(dot) : '';
};

/**
 * Where every file a re-encode touches lives: one folder at the top of the library, rather than one
 * beside each film.
 *
 * Inside the library root rather than somewhere else entirely, and that is not a tidiness
 * preference. Putting the original aside and the encode into its place are renames, and a rename is
 * only atomic within one filesystem — across a volume boundary it becomes a copy, which takes as
 * long as the encode did, can half-finish, and needs the disk twice over. Under the library root it
 * is instant and cannot half happen, whatever the operator has mounted where.
 *
 * One per library rather than one per film for the reason an operator would give: a library is a
 * thing they think about and a folder they can look in, and four hundred hidden directories
 * scattered through a shelf is not.
 *
 * The extension is always the original's. A `.mkv` that became a `.mp4` would be a path the scanner
 * no longer finds, and a path it no longer finds is `store.removeByPaths` — which deletes the row
 * and takes every viewer's watch progress and favourites with it. Keeping the container also keeps
 * the bitmap subtitles and the chapters, neither of which survives a move to MP4. One decision,
 * three reasons.
 *
 * @param libraryPath - The root of the library the file belongs to.
 * @param originalPath - The file being re-encoded.
 * @param requestId - The re-encode this belongs to.
 * @returns The directory, what the encode is written to, where the original is put while somebody
 *   judges it, and where a sample goes.
 */
const reencodePathsFor = (
  libraryPath: string,
  originalPath: string,
  requestId: string,
): ReencodePaths => {
  const extension = extensionOf(originalPath);
  const root = libraryPath.endsWith('/') ? libraryPath.slice(0, -1) : libraryPath;
  const directory = `${root}/${RENDITION_DIRECTORY}`;

  return {
    directory,
    output: `${directory}/${requestId}${extension}`,
    aside: `${directory}/${requestId}.original${extension}`,
    sample: `${directory}/${requestId}.sample${extension}`,
  };
};

export type { ReencodePaths };

export { reencodePathsFor };
