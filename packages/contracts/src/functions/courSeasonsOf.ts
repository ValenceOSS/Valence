import { episodesByChoice } from '@ValenceContracts/functions/episodesByChoice';
import { seasonsOf } from '@ValenceContracts/functions/seasonsOf';
import type { Asked } from '@ValenceContracts/functions/seasonsOf';
import type { AnimeFacts } from '@ValenceContracts/schemas/Anime';
import type {
  CatalogueEpisode,
  CatalogueSeason,
  HeldEpisode,
  RequestItem,
} from '@ValenceContracts/schemas/MediaRequest';

/**
 * An anime's cours as somebody asking for it chooses among them, in place of its seasons: how many
 * episodes each holds, the day the first aired, its name, and where each stands against what was
 * asked for and what the library holds. Specials first, as cour 0.
 *
 * @param episodes - Every episode the catalogue knows of.
 * @param anime - The show's cours.
 * @param requests - What has been asked of the show.
 * @param held - The episodes the library holds.
 * @returns The cours, in order.
 */
const courSeasonsOf = (
  episodes: readonly CatalogueEpisode[],
  anime: AnimeFacts,
  requests: readonly { items: readonly (Asked & Pick<RequestItem, 'cour'>)[] }[],
  held: readonly HeldEpisode[],
): CatalogueSeason[] => {
  const courOf = (season: number, episode: number) =>
    anime.episodes.find((one) => one.season === season && one.episode === episode)?.cour ?? season;
  const heldByCour = new Map<number, number>();

  for (const one of held) {
    const cour = courOf(one.season, one.episode);

    heldByCour.set(cour, (heldByCour.get(cour) ?? 0) + 1);
  }

  return seasonsOf(
    episodesByChoice({ episodes, anime }),
    requests.map((request) => ({
      items: request.items.map((item) => ({ ...item, season: item.cour ?? item.season })),
    })),
    heldByCour,
  ).map((season) => ({
    ...season,
    name: anime.cours.find((cour) => cour.cour === season.season)?.name ?? null,
  }));
};

export { courSeasonsOf };
