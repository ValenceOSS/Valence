import { searchRankOf } from '@ValenceCore/functions/searchRankOf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Orders what a search found across several libraries by how well each title answers it, so a show
 * whose name is exactly what was typed comes before films that only mention it, wherever each was
 * found. Titles that answer equally well keep the order their library gave them.
 *
 * @param found - Everything the libraries found, library by library.
 * @param search - What was typed.
 * @returns The same titles, best answers first.
 */
const rankBySearch = (found: readonly MediaSummary[], search: string): MediaSummary[] =>
  found
    .map((item, at) => ({ item, at, rank: searchRankOf([item.title, item.seriesTitle], search) }))
    .sort((one, other) => one.rank - other.rank || one.at - other.at)
    .map(({ item }) => item);

export { rankBySearch };
