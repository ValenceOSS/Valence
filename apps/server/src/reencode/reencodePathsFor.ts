import { RENDITION_DIRECTORY } from '@ValenceServer/library/isInRenditionDirectory';

type ReencodePaths = {
  directory: string;
  output: string;
  aside: string;
  sample: string;
};

/**
 * Splits a path into the folder holding a file, the file's name, and its extension.
 *
 * @param path - The file's path.
 * @returns Where it sits, what it is called, and what it ends in.
 */
const partsOf = (path: string): { folder: string; extension: string } => {
  const at = path.lastIndexOf('/');
  const folder = at <= 0 ? '' : path.slice(0, at);
  const name = at <= 0 ? path : path.slice(at + 1);
  const dot = name.lastIndexOf('.');

  return { folder, extension: dot > 0 ? name.slice(dot) : '' };
};

/**
 * Where every file a re-encode touches lives.
 *
 * All four sit in one directory beside the original, which is not a tidiness preference. Putting
 * the original aside and the encode into place are renames, and a rename is only atomic within one
 * filesystem — across a volume boundary it becomes a copy, which takes as long as the encode did,
 * can half-finish, and needs the disk twice over. Beside the film, it is instant and cannot half
 * happen.
 *
 * The extension is always the original's. A `.mkv` that became a `.mp4` would be a path the scanner
 * no longer finds, and a path it no longer finds is `store.removeByPaths` — which deletes the row
 * and takes every viewer's watch progress and favourites with it. Keeping the container also keeps
 * the bitmap subtitles and the chapters, neither of which survives a move to MP4. One decision,
 * three reasons.
 *
 * @param originalPath - The file being re-encoded.
 * @param requestId - The re-encode this belongs to.
 * @returns The directory, what the encode is written to, where the original is put while somebody
 *   judges it, and where a sample goes.
 */
const reencodePathsFor = (originalPath: string, requestId: string): ReencodePaths => {
  const { folder, extension } = partsOf(originalPath);
  const directory = `${folder}/${RENDITION_DIRECTORY}`;

  return {
    directory,
    output: `${directory}/${requestId}${extension}`,
    aside: `${directory}/${requestId}.original${extension}`,
    sample: `${directory}/${requestId}.sample${extension}`,
  };
};

export type { ReencodePaths };

export { reencodePathsFor };
