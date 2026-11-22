import { readLanguage } from '@ValenceCore/functions/describeTrack';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

/**
 * Finds the track in another copy of a title that stands for one chosen in the original, which
 * may sit at a different place there: the one in the same language, and among several the one
 * that is likewise the default, then has as many channels, then the same codec, or else the first.
 *
 * @param wanted - The track chosen in the original.
 * @param streams - The other copy's tracks.
 * @returns Its track, or nothing where it has none in that language.
 */
const audioStreamMatching = (
  wanted: AudioStream,
  streams: readonly AudioStream[],
): AudioStream | undefined => {
  const language = readLanguage(wanted.language);
  const inIt = streams.filter((stream) => readLanguage(stream.language) === language);
  const likeness = (stream: AudioStream) =>
    (stream.isDefault === wanted.isDefault ? 4 : 0) +
    (stream.channels === wanted.channels ? 2 : 0) +
    (stream.codec === wanted.codec ? 1 : 0);

  return inIt.reduce<AudioStream | undefined>(
    (best, stream) => (best === undefined || likeness(stream) > likeness(best) ? stream : best),
    undefined,
  );
};

export { audioStreamMatching };
