import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

/**
 * The audio track a player would pick on its own if nothing were negotiated: the one the file marks
 * as default, or the first. Knowing this is what makes it possible to tell a session that happens to
 * be playing the natural track from one that had to be steered onto it.
 *
 * @param audioStreams - The file's audio tracks, as the catalogue holds them.
 * @returns That track's index, or null where the file has no audio at all.
 */
const naturalAudioStreamIndex = (audioStreams: readonly AudioStream[]): number | null =>
  (audioStreams.find((stream) => stream.isDefault) ?? audioStreams[0])?.index ?? null;

export { naturalAudioStreamIndex };
