import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

/**
 * An episode's place in its programme, as the television's apps write it: "S1: E3".
 *
 * @param episode - The episode.
 * @returns Its season and number.
 */
const placeOfEpisode = (
  episode: Pick<MediaSummary, 'seasonNumber' | 'episodeNumber' | 'episodeNumberEnd'>,
): string =>
  say('tv.placeOfEpisode.sValueEValue2', {
    value: (episode.seasonNumber ?? 1).toString(),
    value2: describeEpisodeNumbers(episode.episodeNumber ?? 1, episode.episodeNumberEnd),
  });

export { placeOfEpisode };
