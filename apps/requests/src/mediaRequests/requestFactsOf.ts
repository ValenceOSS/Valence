import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The facts a request keeps from the catalogue, its TVDB and IMDb ids only where the catalogue gave
 * them, so a catalogue that does not say keeps the ones it had.
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
  ...(catalogue.narrations === undefined ? {} : { narrations: catalogue.narrations }),
  ...(catalogue.tvdbId === undefined || catalogue.tvdbId === null
    ? {}
    : { tvdbId: catalogue.tvdbId }),
  ...(catalogue.imdbId === undefined || catalogue.imdbId === null
    ? {}
    : { imdbId: catalogue.imdbId }),
});

export { requestFactsOf };
