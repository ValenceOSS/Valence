import { showSlug } from '@ValenceCore/functions/showSlug';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Valence's identifier for the programme an episode belongs to, worked out as the library works it
 * out: the series where the catalogue named one, and a slug of the title where it did not.
 *
 * @param episode - The episode.
 * @returns The programme's identifier, or nothing for an item that is not an episode.
 */
const showIdOfEpisode = (
  episode: Pick<MediaSummary, 'seriesId' | 'seriesTitle'>,
): string | null => {
  const title = episode.seriesTitle ?? '';

  if (title === '') {
    return null;
  }

  return episode.seriesId ?? showSlug(title);
};

export { showIdOfEpisode };
