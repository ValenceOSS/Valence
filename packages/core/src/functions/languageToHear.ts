import { audioStreamInLanguage } from '@ValenceCore/functions/audioStreamInLanguage';
import { readLanguage } from '@ValenceCore/functions/describeTrack';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

/**
 * The language to pick one file's sound track in: the one a listener asked to hear where the file
 * has a track in it, and otherwise the library's own.
 *
 * @param streams - The file's sound tracks.
 * @param asked - The language asked to be heard, or nothing.
 * @param libraryLanguage - The library's own language for sound, or nothing.
 * @returns The language to prefer, or nothing for the file's own default.
 */
const languageToHear = (
  streams: readonly AudioStream[],
  asked: string | null | undefined,
  libraryLanguage: string | null,
): string | null =>
  audioStreamInLanguage(streams, asked) === undefined ? libraryLanguage : readLanguage(asked);

export { languageToHear };
