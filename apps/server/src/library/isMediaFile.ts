import { VIDEO_FILE_EXTENSIONS } from '@ValenceContracts/constants/VIDEO_FILE_EXTENSIONS';
import { isInRenditionDirectory } from './isInRenditionDirectory';

/**
 * Decides whether a file is worth probing, from its path alone. A library holds artwork, subtitles,
 * sample clips and stray archives, and probing each of them costs a process launch for an answer
 * already known from the name.
 *
 * Valence's own directory is skipped whatever it holds. What is in there is a re-encode somebody
 * chose to keep beside the film, and it belongs to that film by its identifier rather than by being
 * found — indexing it would produce a second copy of the film with its own artwork, its own watch
 * progress and its own thumbnails.
 *
 * @param path - The file's path.
 * @returns Whether it looks like something to play.
 */
const isMediaFile = (path: string): boolean => {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';

  return !isInRenditionDirectory(path) && VIDEO_FILE_EXTENSIONS.has(extension);
};

export { isMediaFile };
