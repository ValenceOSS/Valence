import { readCatalogueReference } from '@ValenceCore/functions/readCatalogueReference';
import type {
  CatalogueDescription,
  CatalogueMatch,
  CataloguePaged,
  CatalogueSearching,
} from '@ValenceServer/library/MetadataProvider';

type CandidateSources = {
  searchPages: (searching: CatalogueSearching) => Promise<CataloguePaged>;
  describeTitle: (externalId: string, kind: 'tv' | 'movie') => Promise<CatalogueDescription | null>;
  findByImdbId: (imdbId: string, kind: 'tv' | 'movie') => Promise<string | null>;
  findByTvdbId?: (tvdbId: string, kind: 'tv' | 'movie') => Promise<string | null>;
};

type Candidates = { matches: CatalogueMatch[]; hasMore: boolean; total: number };

const IMDB_ID = /\b(tt\d{5,})\b/u;

const TVDB_ID =
  /(?:thetvdb\.com\/(?:\?(?:[^#]*&)?id=|(?:dereferrer\/)?series\/)|^tvdb[:\s]*)(\d+)\b/iu;

const AMPERSAND = /\s*&\s*/u;

const SPOKEN_AND = /\s+and\s+/iu;

/**
 * Finds the catalogue entries a title might be, for Fix match: by name a page at a time, saying how
 * many there are in all, with "&" and "and" taken as the same where the name as written finds
 * nothing; and by id, where a TMDB address, a TMDB number, an IMDb id or a TVDB address or id was
 * pasted, that entry first.
 *
 * @param asked - What was typed, whether films or programmes are wanted, and which page.
 * @param sources - How to search the catalogue, describe one entry and find an entry by IMDb or
 *   TVDB id.
 * @returns The entries, whether there are more, and how many there are in all.
 */
const findCandidates = async (
  asked: CatalogueSearching,
  sources: CandidateSources,
): Promise<Candidates> => {
  const query = asked.query.trim();
  const imdbId = IMDB_ID.exec(query)?.[1];
  const tvdbId = imdbId === undefined ? TVDB_ID.exec(query)?.[1] : undefined;
  const byOtherId = imdbId !== undefined || tvdbId !== undefined;
  const reference = byOtherId ? null : readCatalogueReference(query);
  const kind = reference?.kind ?? asked.kind;
  const id =
    imdbId !== undefined
      ? await sources.findByImdbId(imdbId, asked.kind).catch(() => null)
      : tvdbId !== undefined
        ? ((await sources.findByTvdbId?.(tvdbId, asked.kind).catch(() => null)) ?? null)
        : (reference?.id ?? null);
  const described =
    id === null || asked.page !== 1
      ? null
      : await sources.describeTitle(id, kind).catch(() => null);
  const named: CatalogueMatch[] =
    id === null || described === null
      ? []
      : [
          {
            externalId: id,
            kind,
            title: described.title,
            year: described.year,
            overview: described.overview,
            posterUrl: described.posterUrl,
          },
        ];

  if (byOtherId || (reference !== null && reference.kind !== null)) {
    return { matches: named, hasMore: false, total: named.length };
  }

  const search = (words: string) => sources.searchPages({ ...asked, query: words });
  const first = await search(query);
  const other = AMPERSAND.test(query)
    ? query.replaceAll(new RegExp(AMPERSAND, 'gu'), ' and ')
    : SPOKEN_AND.test(query)
      ? query.replaceAll(new RegExp(SPOKEN_AND, 'giu'), ' & ')
      : null;
  const paged = first.matches.length === 0 && other !== null ? await search(other) : first;
  const found = paged.matches.filter((match) => match.externalId !== id || match.kind !== kind);

  return {
    matches: [...named, ...found],
    hasMore: paged.hasMore,
    total: (paged.total ?? paged.matches.length) + named.length,
  };
};

export type { CandidateSources, Candidates };

export { findCandidates };
