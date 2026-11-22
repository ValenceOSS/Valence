import { readLanguage, selectAudioStream } from '@ValenceCore/functions/describeTrack';

type LanguagedAudioStream = {
  index: number;
  language?: string | null | undefined;
  isDefault?: boolean | undefined;
};

/**
 * Finds a file's sound track in a language, however either side spells it: the one the file marks
 * default among several in it, or else the first.
 *
 * @param streams - The file's sound tracks.
 * @param language - The language, in any spelling, or nothing.
 * @returns The track, or nothing where the file has none in that language.
 */
const audioStreamInLanguage = <TStream extends LanguagedAudioStream>(
  streams: readonly TStream[],
  language: string | null | undefined,
): TStream | undefined => {
  const wanted = readLanguage(language);

  return wanted === null
    ? undefined
    : selectAudioStream(
        streams.filter((stream) => readLanguage(stream.language) === wanted),
        wanted,
      );
};

export { audioStreamInLanguage };
