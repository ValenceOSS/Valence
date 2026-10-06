import { findSiblings } from '@ValenceClient/library/pickFeatured';
import { useShowEpisodes } from '@ValenceScreens/library/useShowEpisodes';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Finds the other episodes of the season an episode belongs to, in the order they are watched, from
 * the whole programme once the library has answered and from what is loaded until then.
 *
 * @param media - The episode being looked at, or null where nothing is.
 * @param known - Everything already loaded.
 * @returns The rest of its season, or nothing for a film.
 */
const useSeasonMates = (media: MediaSummary | null, known: MediaSummary[]): MediaSummary[] => {
  const episodes = useShowEpisodes(media, known);

  return media === null ? [] : findSiblings(episodes, media);
};

export { useSeasonMates };
