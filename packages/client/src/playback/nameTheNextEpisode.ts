import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { say } from '@ValenceI18n/say';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Names the episode offered next by its place in the series and its title, or by its title alone
 * where its place is not known.
 *
 * @param episode - The episode offered.
 * @returns What to call it.
 */
const nameTheNextEpisode = (
  episode: Pick<MediaSummary, 'title'> &
    Partial<Pick<MediaSummary, 'seasonNumber' | 'episodeNumber' | 'episodeNumberEnd'>>,
): string =>
  typeof episode.seasonNumber === 'number' && typeof episode.episodeNumber === 'number'
    ? say('client.calendar.describeCalendarEntry.sSeasonNumberEEpisodeNumberTitle', {
        seasonNumber: episode.seasonNumber.toString(),
        episodeNumber: describeEpisodeNumbers(episode.episodeNumber, episode.episodeNumberEnd),
        title: episode.title,
      })
    : episode.title;

export { nameTheNextEpisode };
