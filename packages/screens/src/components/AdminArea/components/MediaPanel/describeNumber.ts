import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Says where an episode falls in its season, as its row is numbered.
 *
 * @param episode - The episode.
 * @returns Such as "E1" or "E3–4", or a dash where the file does not say.
 */
const describeNumber = (episode: MediaSummary): string =>
  episode.episodeNumber === null || episode.episodeNumber === undefined
    ? '—'
    : `E${describeEpisodeNumbers(episode.episodeNumber, episode.episodeNumberEnd)}`;

export { describeNumber };
