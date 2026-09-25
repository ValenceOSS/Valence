import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

/**
 * Where an episode falls in its programme, as a card says it beneath the programme's name.
 *
 * @param media - The episode.
 * @returns Its season and number, and its own title.
 */
const whereItFalls = (media: MediaSummary): string => {
  const numbers =
    typeof media.seasonNumber === 'number' && typeof media.episodeNumber === 'number'
      ? `${say('client.whereItFalls.numbers', {
          season: media.seasonNumber.toString(),
          episode: describeEpisodeNumbers(media.episodeNumber, media.episodeNumberEnd),
        })}  `
      : '';

  return `${numbers}${media.title}`;
};

export { whereItFalls };
