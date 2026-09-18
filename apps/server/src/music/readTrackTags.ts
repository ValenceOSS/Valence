import { parseFile } from 'music-metadata';
import { tagsFromMetadata } from './tagsFromMetadata';
import type { TrackTags } from './TrackTags';

/**
 * Reads a track's tags straight out of its file: ID3, Vorbis comments, MP4 atoms, whatever it
 * carries. No probing through the media service is needed, since everything a music library is
 * built from is in the tags and the pictures and lyrics beside them.
 *
 * @param path - The track.
 * @returns Its tags, or nothing where the file could not be read as audio.
 */
const readTrackTags = async (path: string): Promise<TrackTags | null> => {
  const meta = await parseFile(path, { duration: true }).catch(() => null);

  const isAudio =
    meta !== null &&
    meta.format.hasAudio !== false &&
    meta.format.codec !== undefined &&
    (meta.format.duration ?? 0) > 0;

  return isAudio ? tagsFromMetadata(meta, path) : null;
};

export { readTrackTags };
