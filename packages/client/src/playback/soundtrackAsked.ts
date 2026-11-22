import { audioStreamInLanguage } from '@ValenceCore/functions/audioStreamInLanguage';
import { readLanguage } from '@ValenceCore/functions/describeTrack';
import { NOTHING_ASKED } from '@ValenceClient/playback/NOTHING_ASKED';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

type SoundtrackAsked = {
  audioStreamIndex: number | undefined;
  audioLanguage: string | undefined;
};

/**
 * Works out what to ask the server for so a title plays in the soundtrack language this device
 * remembers. A server that picks a track by language is sent the language whatever this title's
 * own file carries, since it weighs every copy of the title and falls back to the library's
 * language itself; it still hands the file over as it is where the track is the one the file plays
 * by itself. An older server is sent the number of the file's track in that language, even where it
 * is the file's default, since asked for nothing it plays the library's language.
 *
 * @param remembered - The language this device last chose, in any spelling, or nothing.
 * @param streams - The title's soundtracks.
 * @param hearsLanguages - Whether the server picks a track by language.
 * @returns The language or the track to send, or nothing where nothing was remembered, or where an
 *   older server would be asked for a language the title has no soundtrack in.
 */
const soundtrackAsked = (
  remembered: string | null,
  streams: readonly AudioStream[],
  hearsLanguages: boolean,
): SoundtrackAsked => {
  const language = readLanguage(remembered);

  if (language === null) {
    return NOTHING_ASKED;
  }

  if (hearsLanguages) {
    return { audioStreamIndex: undefined, audioLanguage: language };
  }

  const heard = audioStreamInLanguage(streams, language);

  return heard === undefined
    ? NOTHING_ASKED
    : { audioStreamIndex: heard.index, audioLanguage: undefined };
};

export type { SoundtrackAsked };

export { soundtrackAsked };
