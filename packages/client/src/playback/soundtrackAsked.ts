import { readLanguage, selectAudioStream } from '@ValenceCore/functions/describeTrack';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

type SoundtrackAsked = {
  audioStreamIndex: number | undefined;
  audioLanguage: string | undefined;
};

const NOTHING_ASKED: SoundtrackAsked = { audioStreamIndex: undefined, audioLanguage: undefined };

/**
 * What to ask the server for so a title plays in the soundtrack language this device remembers:
 * the language itself from a server that picks a track by it, which still hands the file over as
 * it is where that track is the one it plays by itself, and the track's own number from an older
 * one, which otherwise plays the library's language.
 *
 * @param remembered - The language this device last chose, in any spelling, or nothing.
 * @param streams - The title's soundtracks.
 * @param hearsLanguages - Whether the server picks a track by language.
 * @returns The language or the track to send, or nothing where nothing was remembered or the title
 *   has no soundtrack in that language.
 */
const soundtrackAsked = (
  remembered: string | null,
  streams: readonly AudioStream[],
  hearsLanguages: boolean,
): SoundtrackAsked => {
  const language = readLanguage(remembered);
  const matching = streams.filter((stream) => readLanguage(stream.language) === language);
  const heard = language === null ? undefined : selectAudioStream(matching, language);

  if (language === null || heard === undefined) {
    return NOTHING_ASKED;
  }

  return hearsLanguages
    ? { audioStreamIndex: undefined, audioLanguage: language }
    : { audioStreamIndex: heard.index, audioLanguage: undefined };
};

export type { SoundtrackAsked };

export { NOTHING_ASKED, soundtrackAsked };
