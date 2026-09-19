import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The facts a request keeps from the catalogue.
 *
 * @param catalogue - What the catalogue says.
 * @returns The facts, as a request keeps them.
 */
const requestFactsOf = (catalogue: RequestCatalogue) => ({
  title: catalogue.title,
  artistName: catalogue.artist,
  year: catalogue.year,
  aliases: catalogue.aliases,
  overview: catalogue.overview,
  posterUrl: catalogue.posterUrl,
  runtimeMinutes: catalogue.runtimeMinutes,
  releaseDates: catalogue.releaseDates,
  isEnded: catalogue.isEnded,
});

export { requestFactsOf };
