import { VIDEO_EXTENSIONS } from './VIDEO_EXTENSIONS';
import { parseEpisodePath } from './parseEpisodePath';
import type { EpisodePath, EpisodePathOptions } from './EpisodePath.types';

/**
 * Reads the episode a video file is, where it is a video file and names one.
 *
 * @param path - The file's path, or a folder's where it stands for the episode.
 * @param options - Whether it is a folder, and which kinds of rule to read it with.
 * @returns What it names, or null where it is not a video or names no episode.
 */
const resolveEpisode = (path: string, options: EpisodePathOptions = {}): EpisodePath | null => {
  const fileName = path.slice(path.lastIndexOf('/') + 1);
  const extension = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.') + 1) : '';

  if (options.isDirectory !== true && !VIDEO_EXTENSIONS.has(extension.toLowerCase())) {
    return null;
  }

  const read = parseEpisodePath(path, options);

  return read.isSuccess ? read : null;
};

export { resolveEpisode };
