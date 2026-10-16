import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';

/**
 * A series' episodes numbered by what somebody chooses among: its seasons, or for anime its cours,
 * which is what the seasons a request names mean for anime. Specials are season 0 either way.
 *
 * @param catalogue - The episodes, and the cours of anime.
 * @returns The episodes, each under the season or cour it is chosen by.
 */
const episodesByChoice = <Episode extends RequestCatalogue['episodes'][number]>(catalogue: {
  episodes: readonly Episode[];
  anime?: RequestCatalogue['anime'];
}): Episode[] => {
  const anime = catalogue.anime ?? null;

  return anime === null
    ? [...catalogue.episodes]
    : catalogue.episodes.map((episode) => ({
        ...episode,
        season:
          anime.episodes.find(
            (one) => one.season === episode.season && one.episode === episode.episode,
          )?.cour ?? (episode.season === 0 ? 0 : episode.season),
      }));
};

export { episodesByChoice };
