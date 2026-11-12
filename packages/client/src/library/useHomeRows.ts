import { useCallback, useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { streamQueries } from '@ValenceClient/query/streamQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { homeRows, MIN_ROW, ROW_LIMIT } from '@ValenceClient/library/homeRows';
import { pickForYou } from '@ValenceClient/library/pickForYou';
import { tasteOf } from '@ValenceClient/library/tasteOf';
import { carryingOn } from '@ValenceClient/library/carryingOn';
import { isOnContinueWatching } from '@ValenceContracts/schemas/WatchProgress';
import { addedAtMs } from '@ValenceCore/functions/addedAtMs';
import type { MediaPage, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ListItemsOptions } from '@ValenceClient/library/fetchLibrary';
import type { Rail } from '@ValenceClient/library/groupIntoRails';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import { say } from '@ValenceI18n/say';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';

const FIRST_GENRES = 6;

const GENRE_BATCH = 6;

const BATCHES_AHEAD = 2;

const DECADE_BATCH = 4;

const DECADE_SPAN = 9;

const ENCORE_BATCH = 12;

const ENCORE_REACH = 20;

const ENCORE_ORDERS = ['newest', 'title'] as const;

const TASTE_DEPTH = 3;

const LIKED_STARS = 4;

const LIKED_READ = 60;

const ACCLAIMED_FROM = 7.5;

const ENCORE_KINDS = 3;

const DRY_ROUNDS = 2;

const TAIL_ROW = /^(?:genre|decade|more|again):/u;

const NOTHING: readonly MediaSummary[] = [];

type Encore = {
  at: number;
  genre: string;
  order: 'newest' | 'title' | null;
  decade: number | null;
  page: number;
};

const NO_TASTE: readonly string[] = [];

/**
 * Keeps only what the rows read from a set of questions — each one's answer, whether it is still
 * being asked, and whether the answer is only the one from before — so the set stays the same object
 * until one of those changes.
 *
 * @param results - The questions, as asked.
 * @returns Each one's answer, whether it is still being read, and whether it is the one from before.
 */
const answersOf = (
  results: readonly {
    data: MediaSummary[] | undefined;
    isLoading: boolean;
    isPlaceholderData: boolean;
  }[],
): { data: MediaSummary[] | undefined; isLoading: boolean; isPlaceholderData: boolean }[] =>
  results.map(({ data, isLoading, isPlaceholderData }) => ({ data, isLoading, isPlaceholderData }));

/**
 * Keeps what the rows read from a set of counted questions: each one's page, how many match in all,
 * whether it is still being asked, and whether the answer is only the one from before.
 *
 * @param results - The questions, as asked.
 * @returns Each one's page and total, whether it is still being read, and whether it is the one from
 *   before.
 */
const pageAnswersOf = (
  results: readonly {
    data: MediaPage | undefined;
    isLoading: boolean;
    isPlaceholderData: boolean;
  }[],
): {
  data: MediaSummary[] | undefined;
  total: number | undefined;
  isLoading: boolean;
  isPlaceholderData: boolean;
}[] =>
  results.map(({ data, isLoading, isPlaceholderData }) => ({
    data: data?.items,
    total: data?.total,
    isLoading,
    isPlaceholderData,
  }));

/**
 * What to call a shelf in the endless tail, which is a genre seen from a particular angle: the newest
 * of it, the whole of it by name, the part of it belonging to one decade, or the next of its best.
 *
 * @param genre - The genre the shelf is drawn from.
 * @param order - The order it is arranged in, where the angle is an arrangement.
 * @param decade - The decade it is narrowed to, where the angle is a decade.
 * @param page - How far past the genre's own row it reaches, where the angle is going deeper.
 * @returns What the row says it is.
 */
const encoreTitle = (
  genre: string,
  order: 'newest' | 'title' | null,
  decade: number | null,
  page: number,
): string => {
  if (page > 0) {
    return say('client.library.useHomeRows.moreGenre', { genre });
  }

  if (decade !== null) {
    return say('client.library.useHomeRows.genreFromTheDecadeS', {
      genre,
      decade: decade.toString(),
    });
  }

  return order === 'newest'
    ? say('client.library.useHomeRows.newInGenre', { genre })
    : `${genre} A–Z`;
};

/**
 * What to ask the server for to fill a shelf in the endless tail.
 *
 * @param encore - The genre, and the angle it is seen from.
 * @param encore.genre - The genre.
 * @param encore.order - The order it is arranged in, where the angle is an arrangement.
 * @param encore.decade - The decade it is narrowed to, where the angle is a decade.
 * @param encore.page - How far past the genre's own row it reaches, where the angle is going deeper.
 * @returns The question.
 */
const encoreAsked = ({
  genre,
  order,
  decade,
  page,
}: Pick<Encore, 'genre' | 'order' | 'decade' | 'page'>): ListItemsOptions => ({
  genre,
  limit: ROW_LIMIT,
  ...(order === null ? { order: 'rated' as const } : { order }),
  ...(decade === null ? {} : { yearFrom: decade, yearTo: decade + DECADE_SPAN }),
  ...(page === 0 ? {} : { offset: page * ROW_LIMIT }),
});

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
 * another order. Those leanings are worked out once, when the page is first drawn: marking something
 * watched from the page changes them, and the rows must not reorder under somebody, or ask for a
 * genre that has just moved up, while they are still looking at it.
 *
 * Once the first rows are drawn, the page is not read again from the start. Whatever is asked for
 * afterwards — a row that has just become worth showing, the next few genres — fills in where it
 * goes rather than taking the page away while it arrives. When the libraries shown change — somebody
 * hides one, or brings it back — each row goes on showing what it showed until its new answer comes,
 * so the page keeps its length and its place rather than emptying and filling again. Only
 * forgetting what somebody has watched, kept and rated — as happens when another profile takes over
 * — starts the page again.
 *
 * What somebody is part way through and has liked is read from the hidden library films played
 * from sources are kept in as well, since those are theirs to resume though they are in no library.
 *
 * Each question is put to every library at once and answered in one order across them all, the
 * genre and decade rows best-rated first.
 *
 * Past the genres and decades it goes on with the same genres in other orders and eras, each once:
 * a row already shown is not shown again, and once every one has been, there are no more to ask
 * for. Once they all have been, the rows come round again, each round in an order of its own, so the
 * page goes on for as long as somebody scrolls. Asking for more asks for a number of rows to show rather than of questions to put, so a genre,
 * decade or angle with too little in it to make a row is passed over and the next asked for in its
 * place, and the page never stops short because the last few questions came back empty.
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
  const cache = useQueryClient();
  const [readFrom, setReadFrom] = useState(watchable);

  const rowOf = useCallback(
    (options: ListItemsOptions) => ({
      ...libraryQueries.across(watchable, options),
      enabled: canAsk,
      placeholderData: (): MediaSummary[] | undefined =>
        cache.getQueryData(libraryQueries.across(readFrom, options).queryKey),
    }),
    [watchable, canAsk, cache, readFrom],
  );

  const countedRowOf = useCallback(
    (options: ListItemsOptions) => ({
      ...libraryQueries.acrossCounted(watchable, options),
      enabled: canAsk,
      placeholderData: (): MediaPage | undefined =>
        cache.getQueryData(libraryQueries.acrossCounted(readFrom, options).queryKey),
    }),
    [watchable, canAsk, cache, readFrom],
  );
  const [genreLimit, setGenreLimit] = useState(FIRST_GENRES);
  const [decadeLimit, setDecadeLimit] = useState(0);
  const [encoreLimit, setEncoreLimit] = useState(0);
  const [againLimit, setAgainLimit] = useState(0);
  const [tailWanted, setTailWanted] = useState(FIRST_GENRES);

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
    () => [...progress.values()].filter(isOnContinueWatching).map((one) => one.mediaId),
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

  const [keptTaste, setKeptTaste] = useState<readonly string[] | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  if (!isTasteKnown && (keptTaste !== null || hasDrawn)) {
    setKeptTaste(null);
    setHasDrawn(false);
  }

  const hasStreams = useServerHas('streams.fromSources');
  const streamed = useQuery(streamQueries.library(canAsk && hasStreams === true));
  const viewable = useMemo(
    () => (streamed.data === undefined ? watchable : [...watchable, streamed.data]),
    [watchable, streamed.data],
  );

  const resuming = useQuery({
    ...libraryQueries.across(viewable, { ids: resumingIds, limit: ROW_LIMIT }),
    enabled: canAsk && resumingIds.length > 0,
    placeholderData: keepPreviousData,
  });

  const hasUpNext = useServerHas('library.upNext');
  const upNext = useQuery({ ...viewingQueries.upNext(), enabled: canAsk && hasUpNext === true });

  const hasLikeness = useServerHas('library.likeness');
  const because = useQuery(viewingQueries.becauseYouWatched(canAsk && hasLikeness === true));

  const liked = useQuery({
    ...libraryQueries.across(viewable, { ids: likedIds, limit: LIKED_READ }),
    enabled: canAsk && isTasteKnown && keptTaste === null && likedIds.length > 0,
    placeholderData: keepPreviousData,
  });

  const recent = useQuery(rowOf({ order: 'newest', limit: ROW_LIMIT }));

  const acclaimed = useQuery(
    rowOf({ minRating: ACCLAIMED_FROM, order: 'newest', limit: ROW_LIMIT }),
  );

  const isLikedRead =
    likedIds.length === 0 || liked.isError || (liked.isSuccess && !liked.isPlaceholderData);

  if (keptTaste === null && canAsk && isTasteKnown && isLikedRead) {
    setKeptTaste(tasteOf((likedIds.length > 0 ? liked.data : undefined) ?? []));
  }

  const taste = keptTaste ?? NO_TASTE;

  const everyGenre = useMemo(
    () =>
      keptTaste !== null && facets.data !== undefined
        ? [...new Set([...keptTaste, ...facets.data.genres])]
        : [],
    [keptTaste, facets.data],
  );

  const genres = useMemo(() => everyGenre.slice(0, genreLimit), [everyGenre, genreLimit]);

  const genreQueries = useMemo(
    () => genres.map((genre) => countedRowOf({ genre, order: 'rated', limit: ROW_LIMIT })),
    [genres, countedRowOf],
  );

  const byGenre = useQueries({
    queries: genreQueries,
    combine: pageAnswersOf,
  });

  const everyDecade = useMemo(
    () =>
      facets.data === undefined ? [] : [...facets.data.decades].sort((left, right) => right - left),
    [facets.data],
  );

  const decades = useMemo(() => everyDecade.slice(0, decadeLimit), [everyDecade, decadeLimit]);

  const decadeQueries = useMemo(
    () =>
      decades.map((decade) =>
        rowOf({ yearFrom: decade, yearTo: decade + DECADE_SPAN, order: 'rated', limit: ROW_LIMIT }),
      ),
    [decades, rowOf],
  );

  const byDecade = useQueries({
    queries: decadeQueries,
    combine: answersOf,
  });

  const areGenresSettled = byGenre.every((one) => !one.isLoading);
  const areDecadesSettled = byDecade.every((one) => !one.isLoading);

  const aheadQueries = useMemo(
    () => [
      ...everyGenre.slice(genreLimit, genreLimit + GENRE_BATCH * BATCHES_AHEAD).map((genre) => ({
        ...countedRowOf({ genre, order: 'rated', limit: ROW_LIMIT }),
        enabled: canAsk && areGenresSettled,
      })),
      ...(everyGenre.length > genreLimit
        ? []
        : everyDecade
            .slice(decadeLimit, decadeLimit + DECADE_BATCH * BATCHES_AHEAD)
            .map((decade) => ({
              ...rowOf({
                yearFrom: decade,
                yearTo: decade + DECADE_SPAN,
                order: 'rated',
                limit: ROW_LIMIT,
              }),
              enabled: canAsk && areGenresSettled && areDecadesSettled,
            }))),
    ],
    [
      everyGenre,
      genreLimit,
      everyDecade,
      decadeLimit,
      rowOf,
      countedRowOf,
      canAsk,
      areGenresSettled,
      areDecadesSettled,
    ],
  );

  useQueries({
    queries: aheadQueries,
    combine: () => null,
  });

  const shownGenres = useMemo(
    () =>
      areGenresSettled
        ? genres.filter((_, at) => (byGenre[at]?.data ?? NOTHING).length >= MIN_ROW)
        : [],
    [areGenresSettled, genres, byGenre],
  );

  const pagesKey = genres
    .map((genre, at) =>
      [genre, Math.ceil((byGenre[at]?.total ?? 0) / ROW_LIMIT).toString()].join('\t'),
    )
    .join('\n');

  const pagesOf = useMemo(
    () =>
      new Map(
        pagesKey.split('\n').map((line) => {
          const [genre = '', pages = '0'] = line.split('\t');

          return [genre, Number(pages)] as const;
        }),
      ),
    [pagesKey],
  );

  const encoresUpTo = useCallback(
    (limit: number) => {
      const seen = new Set<string>();

      return Array.from({ length: limit }, (_, at): Encore | null => {
        const step = Math.floor(at / ENCORE_KINDS);
        const across = Math.max(1, everyGenre.length);

        if (at % ENCORE_KINDS === 0) {
          const wide = Math.max(1, shownGenres.length);
          const genre = shownGenres[step % wide];
          const order = ENCORE_ORDERS[Math.floor(step / wide) % ENCORE_ORDERS.length];

          return genre === undefined || order === undefined
            ? null
            : { at, genre, order, decade: null, page: 0 };
        }

        if (at % ENCORE_KINDS === 1) {
          const deep = Math.max(1, everyDecade.length);
          const genre = everyGenre[step % across];
          const decade = everyDecade[Math.floor(step / across) % deep];

          return genre === undefined || decade === undefined
            ? null
            : { at, genre, order: null, decade, page: 0 };
        }

        const genre = everyGenre[step % across];
        const page = 1 + Math.floor(step / across);

        return genre === undefined || page >= (pagesOf.get(genre) ?? 0)
          ? null
          : { at, genre, order: null, decade: null, page };
      }).filter((one): one is Encore => {
        if (one === null) {
          return false;
        }

        const key = [one.genre, one.order, one.decade, one.page].join(' ');

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);

        return true;
      });
    },
    [shownGenres, everyGenre, everyDecade, pagesOf],
  );

  const encores = useMemo(() => encoresUpTo(encoreLimit), [encoresUpTo, encoreLimit]);

  const encoreQueries = useMemo(
    () =>
      encores.map(({ genre, order, decade, page }) =>
        rowOf(encoreAsked({ genre, order, decade, page })),
      ),
    [encores, rowOf],
  );

  const byEncore = useQueries({
    queries: encoreQueries,
    combine: answersOf,
  });

  const areEncoresSettled = byEncore.every((one) => !one.isLoading);

  const thinAtTheEnd =
    byEncore.length -
    1 -
    byEncore.findLastIndex((one) => one.isLoading || (one.data ?? NOTHING).length >= MIN_ROW);
  const finiteRoom =
    ENCORE_KINDS *
    Math.max(
      Math.max(1, shownGenres.length) * ENCORE_ORDERS.length,
      Math.max(1, everyGenre.length) * Math.max(1, everyDecade.length),
    );
  const deepest = new Map<string, number>();

  for (const one of encores) {
    deepest.set(one.genre, Math.max(deepest.get(one.genre) ?? 0, one.page));
  }

  const canGoDeeper = everyGenre.some(
    (genre) => (deepest.get(genre) ?? 0) + 1 < (pagesOf.get(genre) ?? 0),
  );
  const hasMoreEncores =
    shownGenres.length > 0 &&
    (encoreLimit < finiteRoom || canGoDeeper) &&
    thinAtTheEnd < DRY_ROUNDS * Math.max(1, everyGenre.length);

  const encoresAheadQueries = useMemo(
    () =>
      everyGenre.length > genreLimit || everyDecade.length > decadeLimit
        ? []
        : encoresUpTo(encoreLimit + ENCORE_BATCH * BATCHES_AHEAD)
            .slice(encores.length)
            .map(({ genre, order, decade, page }) => ({
              ...rowOf(encoreAsked({ genre, order, decade, page })),
              enabled: canAsk && areEncoresSettled,
            })),
    [
      everyGenre,
      genreLimit,
      everyDecade,
      decadeLimit,
      encoresUpTo,
      encoreLimit,
      encores.length,
      rowOf,
      canAsk,
      areEncoresSettled,
    ],
  );

  useQueries({
    queries: encoresAheadQueries,
    combine: () => null,
  });

  const hasPluginRows = useServerHas('plugins.homeRows');
  const fromPlugins = useQuery({
    ...pluginQueries.homeRows(),
    enabled: canAsk && hasPluginRows === true,
  });

  const rails = useMemo(() => {
    const leanings = new Set(taste.slice(0, TASTE_DEPTH));
    const candidates = genres.flatMap((genre, at) =>
      leanings.has(genre) ? (byGenre[at]?.data ?? NOTHING) : NOTHING,
    );

    return homeRows({
      resuming: carryingOn(
        (resumingIds.length > 0 ? resuming.data : undefined) ?? NOTHING,
        progress,
        upNext.data ?? [],
      ).slice(0, ROW_LIMIT),
      picked: pickForYou(candidates, taste, new Set(likedIds), ROW_LIMIT),
      recent: [...(recent.data ?? NOTHING)].sort(byNewest),
      because: (because.data ?? []).map((one) => ({
        ...one,
        items: one.items.filter((media) => watchable.includes(media.libraryId)),
      })),
      acclaimed: [...(acclaimed.data ?? NOTHING)].sort(byRating),
      genres: genres.map((genre, at) => ({
        genre,
        items: [...(byGenre[at]?.data ?? NOTHING)].sort(byRating),
      })),
      decades: decades.map((decade, at) => ({
        decade,
        items: [...(byDecade[at]?.data ?? NOTHING)].sort(byRating),
      })),
      more: encores.map(({ at, genre, order, decade, page }, index) => ({
        id: `more:${at.toString()}`,
        title: encoreTitle(genre, order, decade, page),
        items: [...(byEncore[index]?.data ?? NOTHING)],
      })),
      fromPlugins: (fromPlugins.data?.rows ?? []).map((one) => ({
        id: `plugin:${one.pluginId}:${one.rowId}`,
        title: say('client.library.useHomeRows.titleFromPluginName', {
          title: one.title,
          pluginName: one.pluginName,
        }),
        items: one.items.filter((media) => watchable.includes(media.libraryId)),
      })),
      again: againLimit,
    });
  }, [
    againLimit,
    fromPlugins.data,
    taste,
    genres,
    byGenre,
    resuming.data,
    resumingIds,
    upNext.data,
    progress,
    likedIds,
    recent.data,
    because.data,
    watchable,
    acclaimed.data,
    decades,
    byDecade,
    encores,
    byEncore,
  ]);

  const isReadingFirst =
    canAsk &&
    (keptTaste === null ||
      facets.isLoading ||
      recent.isLoading ||
      acclaimed.isLoading ||
      resuming.isLoading ||
      upNext.isLoading ||
      byGenre.slice(0, FIRST_GENRES).some((one) => one.isLoading));

  if (!hasDrawn && canAsk && !isReadingFirst) {
    setHasDrawn(true);
  }

  const isEveryRowRead =
    canAsk &&
    [recent, acclaimed, ...byGenre, ...byDecade, ...byEncore].every(
      (one) => !one.isLoading && !one.isPlaceholderData,
    );

  if (isEveryRowRead && [...readFrom].sort().join(' ') !== [...watchable].sort().join(' ')) {
    setReadFrom(watchable);
  }

  const hasMoreGenres = everyGenre.length > genreLimit;
  const hasMoreDecades = everyDecade.length > decadeLimit;
  const hasMoreTail = hasMoreGenres || hasMoreDecades || hasMoreEncores;
  const tailShown = rails.filter((rail) => TAIL_ROW.test(rail.id)).length;
  const canComeRoundAgain = !hasMoreTail && shownGenres.length > 0;
  const isTailSettled = areGenresSettled && areDecadesSettled && areEncoresSettled;

  useEffect(() => {
    if (!canAsk || !hasDrawn || !isTailSettled || tailShown >= tailWanted) {
      return;
    }

    if (hasMoreGenres) {
      setGenreLimit((limit) => limit + GENRE_BATCH);
    } else if (hasMoreDecades) {
      setDecadeLimit((limit) => limit + DECADE_BATCH);
    } else if (hasMoreEncores) {
      const wanted = encores.length + tailWanted - tailShown;
      const room = encoreLimit + ENCORE_KINDS * Math.max(1, everyGenre.length) * ENCORE_REACH;
      let limit = encoreLimit + ENCORE_BATCH;

      while (limit < room && encoresUpTo(limit).length < wanted) {
        limit += ENCORE_BATCH;
      }

      setEncoreLimit(limit);
    } else if (canComeRoundAgain && tailWanted > FIRST_GENRES) {
      setAgainLimit((limit) => limit + tailWanted - tailShown);
    }
  }, [
    canComeRoundAgain,
    canAsk,
    hasDrawn,
    isTailSettled,
    tailShown,
    tailWanted,
    genreLimit,
    decadeLimit,
    encoreLimit,
    encores.length,
    encoresUpTo,
    everyGenre.length,
    hasMoreGenres,
    hasMoreDecades,
    hasMoreEncores,
  ]);

  const showMore = useCallback(() => {
    setTailWanted((wanted) => Math.max(wanted, tailShown) + ENCORE_BATCH);
  }, [tailShown]);

  return {
    rails,
    isReading: !hasDrawn && isReadingFirst,
    hasMore: hasMoreTail || canComeRoundAgain,
    isReadingMore: hasMoreTail && (!isTailSettled || tailShown < tailWanted),
    showMore,
  };
};

export { useHomeRows };
