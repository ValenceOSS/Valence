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
 * remembers: the language itself from a server that picks a track by it, which still hands the file
 * over as it is where that track is the one it plays by itself, and the track's own number from an
 * older one, even where it is the file's default, since an older server asked for nothing plays the
 * library's language.
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
  const heard = audioStreamInLanguage(streams, remembered);
  const language = readLanguage(remembered);

  if (heard === undefined || language === null) {
    return NOTHING_ASKED;
  }

  return hearsLanguages
    ? { audioStreamIndex: undefined, audioLanguage: language }
    : { audioStreamIndex: heard.index, audioLanguage: undefined };
};

export type { SoundtrackAsked };

export { soundtrackAsked };
