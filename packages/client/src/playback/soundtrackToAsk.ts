import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { NOTHING_ASKED, soundtrackAsked } from '@ValenceClient/playback/soundtrackAsked';
import type { SoundtrackAsked } from '@ValenceClient/playback/soundtrackAsked';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Works out what to ask the server for so a title starts in the soundtrack language this device
 * remembers, reading the title's soundtracks and whether the server picks a track by language
 * from what is already known where it can.
 *
 * @param cache - Where the title and the server's features are kept.
 * @param mediaId - The title about to start.
 * @param remembered - The language this device last chose, or nothing.
 * @returns The language or the track to send, or nothing.
 */
const soundtrackToAsk = async (
  cache: QueryClient,
  mediaId: string,
  remembered: string | null,
): Promise<SoundtrackAsked> => {
  if (remembered === null) {
    return NOTHING_ASKED;
  }

  const [known, hearsLanguages] = await Promise.all([
    cache.ensureQueryData(libraryQueries.detail(mediaId)).catch(() => null),
    cache
      .ensureQueryData(aboutQueries.server())
      .then((about) => about.features.includes('playback.audioLanguage'))
      .catch(() => false),
  ]);

  return soundtrackAsked(remembered, known?.audioStreams ?? [], hearsLanguages);
};

export { soundtrackToAsk };
