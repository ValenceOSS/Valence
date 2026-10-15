import { animeFactsOf } from '@ValenceServer/requests/anime/animeFactsOf';
import { searchAniList } from '@ValenceServer/requests/anilist/searchAniList';
import { createExpiringCache } from '@ValenceServer/library/createExpiringCache';
import type { AniListEntry } from '@ValenceServer/requests/anilist/AniListEntry';
import type { EpisodeGroup } from '@ValenceServer/requests/anime/EpisodeGroup';
import type { QueryWeb } from '@ValenceServer/music/web/createMusicWeb';
import type { CatalogueMatch } from '@ValenceServer/library/MetadataProvider';
import type { AnimeFacts, CourOrder } from '@ValenceContracts/schemas/Anime';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';

type AnimeDescriberOptions = {
  web: QueryWeb;
  readEpisodeGroups: (tmdbId: string) => Promise<EpisodeGroup[]>;
  searchFilms: (query: string) => Promise<CatalogueMatch[]>;
  now?: () => number;
};

const KEPT_FOR_MS = 24 * 60 * 60 * 1000;

const MOST_KEPT = 2000;

const MOST_FILMS = 5;

const MOST_NAMES_SEARCHED = 2;

/**
 * Words of a title, lower case and without punctuation, for telling whether two titles name the
 * same thing.
 *
 * @param title - The title.
 * @returns Its words.
 */
const wordsOf = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * Describes anime for a request beyond what the catalogue says: AniList is asked by the show's
 * title, and by another name it goes by where that finds nothing, and its answer is kept for a day,
 * since AniList asks to be called no more than thirty times a minute; the catalogue's episode
 * groups are read; the show's cours, names and ids are worked out from both; and each of its films
 * is found in the catalogue by its title and year.
 *
 * @param options - The way out to AniList, the catalogue's episode groups and film search, and,
 *   for a test, the time.
 * @returns How to describe one show, by its catalogue id, what the catalogue says of it, and how
 *   the operator asked for its cours to be worked out.
 */
const createAnimeDescriber = ({
  web,
  readEpisodeGroups,
  searchFilms,
  now,
}: AnimeDescriberOptions) => {
  const found = createExpiringCache<Promise<AniListEntry[]>>(KEPT_FOR_MS, {
    holds: MOST_KEPT,
    ...(now === undefined ? {} : { now }),
  });

  const entriesFor = (tmdbId: number, catalogue: RequestCatalogue): Promise<AniListEntry[]> => {
    const key = tmdbId.toString();
    const kept = found.get(key);

    if (kept !== undefined) {
      return kept;
    }

    const asking = (async () => {
      for (const name of [catalogue.title, ...catalogue.aliases].slice(0, MOST_NAMES_SEARCHED)) {
        const entries = await searchAniList(web, name);

        if (entries.length > 0) {
          return entries;
        }
      }

      return [];
    })();

    found.set(key, asking);

    return asking;
  };

  return async (
    tmdbId: number,
    catalogue: RequestCatalogue,
    order: CourOrder = 'auto',
  ): Promise<AnimeFacts> => {
    const [entries, groups] = await Promise.all([
      entriesFor(tmdbId, catalogue),
      readEpisodeGroups(tmdbId.toString()),
    ]);
    const facts = animeFactsOf(catalogue.episodes, entries, groups, order);
    const films = await Promise.all(
      facts.films.slice(0, MOST_FILMS).map(async (film) => {
        const match = (await searchFilms(film.title)).find(
          (candidate) =>
            wordsOf(candidate.title) === wordsOf(film.title) &&
            (film.year === null ||
              candidate.year === null ||
              Math.abs(candidate.year - film.year) <= 1),
        );

        return { ...film, tmdbId: match === undefined ? null : Number(match.externalId) };
      }),
    );

    return { ...facts, films };
  };
};

export { createAnimeDescriber };
