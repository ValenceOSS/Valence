import { useCallback, useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { homeRows, MIN_ROW, ROW_LIMIT } from '@ValenceClient/library/homeRows';
import { pickForYou } from '@ValenceClient/library/pickForYou';
import { tasteOf } from '@ValenceClient/library/tasteOf';
import { isWorthResuming } from '@ValenceContracts/schemas/WatchProgress';
import { addedAtMs } from '@ValenceCore/functions/addedAtMs';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Rail } from '@ValenceClient/library/groupIntoRails';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

const FIRST_GENRES = 6;

const GENRE_BATCH = 4;

const DECADE_BATCH = 4;

const DECADE_SPAN = 9;

const ENCORE_BATCH = 3;

const ENCORE_ORDERS = ['newest', 'title'] as const;

const TASTE_DEPTH = 3;

const LIKED_STARS = 4;

const LIKED_READ = 60;

const ACCLAIMED_FROM = 7.5;

const NOTHING: readonly MediaSummary[] = [];

/**
 * Keeps only what the rows read from a set of questions — each one's answer and whether it is still
 * being asked — so the set stays the same object until one of those changes.
 *
 * @param results - The questions, as asked.
 * @returns Each one's answer and whether it is still being read.
 */
const answersOf = (
  results: readonly { data: MediaSummary[] | undefined; isLoading: boolean }[],
): { data: MediaSummary[] | undefined; isLoading: boolean }[] =>
  results.map(({ data, isLoading }) => ({ data, isLoading }));

/**
 * What to call a shelf in the endless tail, which is a genre seen from a particular angle: the newest
 * of it, the whole of it by name, or the part of it belonging to one decade.
 *
 * @param genre - The genre the shelf is drawn from.
 * @param order - The order it is arranged in, where the angle is an arrangement.
 * @param decade - The decade it is narrowed to, where the angle is a decade.
 * @returns What the row says it is.
 */
const encoreTitle = (
  genre: string,
  order: 'newest' | 'title' | null,
  decade: number | null,
): string => {
  if (decade !== null) {
    return `${genre} from the ${decade.toString()}s`;
  }

  return order === 'newest' ? `New in ${genre}` : `${genre} A–Z`;
};

/**
 * Orders things by when somebody last had them on, most recent first.
 *
 * @param progress - How far through each thing they are, and when they last were.
 * @returns A comparison to sort by.
 */
const byLastWatched =
  (progress: Map<string, WatchProgress>) =>
  (left: MediaSummary, right: MediaSummary): number =>
    (Date.parse(progress.get(right.id)?.updatedAt ?? '') || 0) -
    (Date.parse(progress.get(left.id)?.updatedAt ?? '') || 0);

/**
 * Orders things newest first, by when they were added.
 *
 * @param left - One thing.
 * @param right - The other.
 * @returns A comparison to sort by.
 */
const byNewest = (left: MediaSummary, right: MediaSummary): number =>
  addedAtMs(right.addedAt) - addedAtMs(left.addedAt);

/**
 * Orders things best-rated first, with anything unrated last.
 *
 * @param left - One thing.
 * @param right - The other.
 * @returns A comparison to sort by.
 */
const byRating = (left: MediaSummary, right: MediaSummary): number =>
  (right.rating ?? -1) - (left.rating ?? -1);

/**
 * Asks the server for the front page's rows, each as its own small question, and puts them together.
 *
 * One question per row rather than one for everything, so no row waits on the size of the library:
 * the newest twenty, the best-rated twenty, twenty from each genre there is. The genres are asked
 * for a few at a time — the first handful before the page is drawn, the rest as somebody scrolls
 * towards them — so the page goes on for as long as the library does without asking for all of it
 * at once.
 *
 * The genres somebody leans towards are asked for first, and what they are offered is chosen from
 * those same answers, so offering it costs nothing more. Which genres those are waits on what they
 * have kept, rated and watched, so the rows are not asked for once and then asked for again in
 * another order.
 *
 * Each question is put to every library and the answers laid end to end, so each row is sorted
 * again once they are together — otherwise the first library's newest would fill the row before
 * the second's newest were looked at.
 *
 * Past the genres and decades it goes on with the same genres in other orders and eras, each once:
 * a row already shown is not shown again, and once every one has been, there are no more to ask
 * for.
 *
 * @param viewerId - Whose front page it is, whose favourites and ratings decide what is offered.
 * @param watchable - The libraries holding something to watch.
 * @param progress - How far through each thing this viewer is.
 * @param isActive - Whether the rows are wanted at all, which they are not while somebody searches.
 * @param isProgressKnown - Whether that progress has arrived, since it decides what they are offered.
 * @returns The rows; whether the first of them are still being read; whether there are more genres
 *   to ask for and whether some are being asked for now; and how to ask for the next few.
 */
const useHomeRows = (
  viewerId: string,
  watchable: readonly string[],
  progress: Map<string, WatchProgress>,
  isActive: boolean,
  isProgressKnown: boolean,
): {
  rails: Rail[];
  isReading: boolean;
  hasMore: boolean;
  isReadingMore: boolean;
  showMore: () => void;
} => {
  const canAsk = isActive && watchable.length > 0;
  const [genreLimit, setGenreLimit] = useState(FIRST_GENRES);
  const [decadeLimit, setDecadeLimit] = useState(0);
  const [encoreLimit, setEncoreLimit] = useState(0);

  const favourites = useQuery(viewingQueries.favourites(viewerId));
  const ratings = useQuery({
    ...viewingQueries.ratings(viewerId),
    select: (given) =>
      given.flatMap((rating) =>
        rating.mediaId !== null && rating.stars >= LIKED_STARS ? [rating.mediaId] : [],
      ),
  });
  const facets = useQuery({ ...libraryQueries.facets(), enabled: canAsk });

  const resumingIds = useMemo(
    () => [...progress.values()].filter(isWorthResuming).map((one) => one.mediaId),
    [progress],
  );

  const likedIds = useMemo(
    () =>
      [...new Set([...(favourites.data ?? []), ...(ratings.data ?? []), ...progress.keys()])].slice(
        0,
        LIKED_READ,
      ),
    [favourites.data, ratings.data, progress],
  );

  const isTasteKnown = isProgressKnown && !favourites.isLoading && !ratings.isLoading;

  const resuming = useQuery({
    ...libraryQueries.across(watchable, { ids: resumingIds, limit: ROW_LIMIT }),
    enabled: canAsk && resumingIds.length > 0,
  });

  const liked = useQuery({
    ...libraryQueries.across(watchable, { ids: likedIds, limit: LIKED_READ }),
    enabled: canAsk && isTasteKnown && likedIds.length > 0,
  });

  const recent = useQuery({
    ...libraryQueries.across(watchable, { order: 'newest', limit: ROW_LIMIT }),
    enabled: canAsk,
  });

  const acclaimed = useQuery({
    ...libraryQueries.across(watchable, {
      minRating: ACCLAIMED_FROM,
      order: 'newest',
      limit: ROW_LIMIT,
    }),
    enabled: canAsk,
  });

  const taste = useMemo(() => tasteOf(liked.data ?? []), [liked.data]);

  const everyGenre = useMemo(
    () =>
      isTasteKnown && !liked.isLoading && facets.data !== undefined
        ? [...new Set([...taste, ...facets.data.genres])]
        : [],
    [isTasteKnown, liked.isLoading, facets.data, taste],
  );

  const genres = useMemo(() => everyGenre.slice(0, genreLimit), [everyGenre, genreLimit]);

  const byGenre = useQueries({
    queries: genres.map((genre) => ({
      ...libraryQueries.across(watchable, { genre, limit: ROW_LIMIT }),
      enabled: canAsk,
    })),
    combine: answersOf,
  });

  const everyDecade = useMemo(
    () =>
      facets.data === undefined ? [] : [...facets.data.decades].sort((left, right) => right - left),
    [facets.data],
  );

  const decades = useMemo(() => everyDecade.slice(0, decadeLimit), [everyDecade, decadeLimit]);

  const byDecade = useQueries({
    queries: decades.map((decade) => ({
      ...libraryQueries.across(watchable, {
        yearFrom: decade,
        yearTo: decade + DECADE_SPAN,
        limit: ROW_LIMIT,
      }),
      enabled: canAsk,
    })),
    combine: answersOf,
  });

  const areGenresSettled = byGenre.every((one) => !one.isLoading);

  const shownGenres = useMemo(
    () =>
      areGenresSettled
        ? genres.filter((_, at) => (byGenre[at]?.data ?? NOTHING).length >= MIN_ROW)
        : [],
    [areGenresSettled, genres, byGenre],
  );

  const encores = useMemo(
    () =>
      Array.from({ length: encoreLimit }, (_, at) => {
        const step = Math.floor(at / 2);

        if (at % 2 === 0) {
          const wide = Math.max(1, shownGenres.length);
          const genre = shownGenres[step % wide];
          const order = ENCORE_ORDERS[Math.floor(step / wide) % ENCORE_ORDERS.length];

          return genre === undefined || order === undefined
            ? null
            : { at, genre, order, decade: null };
        }

        const across = Math.max(1, everyGenre.length);
        const deep = Math.max(1, everyDecade.length);
        const genre = everyGenre[step % across];
        const decade = everyDecade[Math.floor(step / across) % deep];

        return genre === undefined || decade === undefined
          ? null
          : { at, genre, order: null, decade };
      })
        .filter((one) => one !== null)
        .filter(
          (one, index, all) =>
            all.findIndex(
              (other) =>
                other.genre === one.genre &&
                other.order === one.order &&
                other.decade === one.decade,
            ) === index,
        ),
    [encoreLimit, shownGenres, everyGenre, everyDecade],
  );

  const encoreRoom =
    2 *
    Math.max(
      Math.max(1, shownGenres.length) * ENCORE_ORDERS.length,
      Math.max(1, everyGenre.length) * Math.max(1, everyDecade.length),
    );
  const hasMoreEncores = shownGenres.length > 0 && encoreLimit < encoreRoom;

  const byEncore = useQueries({
    queries: encores.map(({ genre, order, decade }) => ({
      ...libraryQueries.across(watchable, {
        genre,
        limit: ROW_LIMIT,
        ...(order === null ? {} : { order }),
        ...(decade === null ? {} : { yearFrom: decade, yearTo: decade + DECADE_SPAN }),
      }),
      enabled: canAsk,
    })),
    combine: answersOf,
  });

  const rails = useMemo(() => {
    const leanings = new Set(taste.slice(0, TASTE_DEPTH));
    const candidates = genres.flatMap((genre, at) =>
      leanings.has(genre) ? (byGenre[at]?.data ?? NOTHING) : NOTHING,
    );

    return homeRows({
      resuming: [...(resuming.data ?? NOTHING)].sort(byLastWatched(progress)),
      picked: pickForYou(candidates, taste, new Set(likedIds), ROW_LIMIT),
      recent: [...(recent.data ?? NOTHING)].sort(byNewest),
      acclaimed: [...(acclaimed.data ?? NOTHING)].sort(byRating),
      genres: genres.map((genre, at) => ({
        genre,
        items: [...(byGenre[at]?.data ?? NOTHING)].sort(byRating),
      })),
      decades: decades.map((decade, at) => ({
        decade,
        items: [...(byDecade[at]?.data ?? NOTHING)].sort(byRating),
      })),
      more: encores.map(({ at, genre, order, decade }, index) => ({
        id: `more:${at.toString()}`,
        title: encoreTitle(genre, order, decade),
        items: [...(byEncore[index]?.data ?? NOTHING)],
      })),
    });
  }, [
    taste,
    genres,
    byGenre,
    resuming.data,
    progress,
    likedIds,
    recent.data,
    acclaimed.data,
    decades,
    byDecade,
    encores,
    byEncore,
  ]);

  const isReading =
    canAsk &&
    (!isTasteKnown ||
      facets.isLoading ||
      recent.isLoading ||
      acclaimed.isLoading ||
      resuming.isLoading ||
      liked.isLoading ||
      byGenre.slice(0, FIRST_GENRES).some((one) => one.isLoading));

  const hasMoreGenres = everyGenre.length > genreLimit;
  const hasMoreDecades = everyDecade.length > decadeLimit;

  const showMore = useCallback(() => {
    if (hasMoreGenres) {
      setGenreLimit((limit) => limit + GENRE_BATCH);

      return;
    }

    if (hasMoreDecades) {
      setDecadeLimit((limit) => limit + DECADE_BATCH);

      return;
    }

    setEncoreLimit((limit) => limit + ENCORE_BATCH);
  }, [hasMoreGenres, hasMoreDecades]);

  return {
    rails,
    isReading,
    hasMore: hasMoreGenres || hasMoreDecades || hasMoreEncores,
    isReadingMore:
      byGenre.some((one) => one.isLoading) ||
      byDecade.some((one) => one.isLoading) ||
      byEncore.some((one) => one.isLoading),
    showMore,
  };
};

export { useHomeRows };
