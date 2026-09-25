import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Where an episode falls in its programme, as a card says it beneath the programme's name.
 *
 * @param media - The episode.
 * @returns Its season and number, and its own title.
 */
const whereItFalls = (media: MediaSummary): string => {
  const numbers =
    typeof media.seasonNumber === 'number' && typeof media.episodeNumber === 'number'
      ? `S${media.seasonNumber.toString()} · E${media.episodeNumber.toString()}  `
      : '';

  return `${numbers}${media.title}`;
};

export { whereItFalls };
