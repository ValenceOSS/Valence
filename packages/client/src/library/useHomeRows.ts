import { useCallback, useMemo, useState } from 'react';
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
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
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

const ENCORE_BATCH = 3;

const ENCORE_ORDERS = ['newest', 'title'] as const;

const TASTE_DEPTH = 3;

const LIKED_STARS = 4;

const LIKED_READ = 60;

const ACCLAIMED_FROM = 7.5;

const NOTHING: readonly MediaSummary[] = [];

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
  const cache = useQueryClient();
  const [readFrom, setReadFrom] = useState(watchable);

  const rowOf = (options: ListItemsOptions) => ({
    ...libraryQueries.across(watchable, options),
    enabled: canAsk,
    placeholderData: (): MediaSummary[] | undefined =>
      cache.getQueryData(libraryQueries.across(readFrom, options).queryKey),
  });
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

  const byGenre = useQueries({
    queries: genres.map((genre) => rowOf({ genre, limit: ROW_LIMIT })),
    combine: answersOf,
  });

  const everyDecade = useMemo(
    () =>
      facets.data === undefined ? [] : [...facets.data.decades].sort((left, right) => right - left),
    [facets.data],
  );

  const decades = useMemo(() => everyDecade.slice(0, decadeLimit), [everyDecade, decadeLimit]);

  const byDecade = useQueries({
    queries: decades.map((decade) =>
      rowOf({ yearFrom: decade, yearTo: decade + DECADE_SPAN, limit: ROW_LIMIT }),
    ),
    combine: answersOf,
  });

  const areGenresSettled = byGenre.every((one) => !one.isLoading);
  const areDecadesSettled = byDecade.every((one) => !one.isLoading);

  useQueries({
    queries: [
      ...everyGenre.slice(genreLimit, genreLimit + GENRE_BATCH * BATCHES_AHEAD).map((genre) => ({
        ...rowOf({ genre, limit: ROW_LIMIT }),
        enabled: canAsk && areGenresSettled,
      })),
      ...(everyGenre.length > genreLimit
        ? []
        : everyDecade
            .slice(decadeLimit, decadeLimit + DECADE_BATCH * BATCHES_AHEAD)
            .map((decade) => ({
              ...rowOf({ yearFrom: decade, yearTo: decade + DECADE_SPAN, limit: ROW_LIMIT }),
              enabled: canAsk && areGenresSettled && areDecadesSettled,
            }))),
    ],
    combine: () => null,
  });

  const shownGenres = useMemo(
    () =>
      areGenresSettled
        ? genres.filter((_, at) => (byGenre[at]?.data ?? NOTHING).length >= MIN_ROW)
        : [],
    [areGenresSettled, genres, byGenre],
  );

  const encoresUpTo = useCallback(
    (limit: number) =>
      Array.from({ length: limit }, (_, at) => {
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
    [shownGenres, everyGenre, everyDecade],
  );

  const encores = useMemo(() => encoresUpTo(encoreLimit), [encoresUpTo, encoreLimit]);

  const encoreRoom =
    2 *
    Math.max(
      Math.max(1, shownGenres.length) * ENCORE_ORDERS.length,
      Math.max(1, everyGenre.length) * Math.max(1, everyDecade.length),
    );
  const hasMoreEncores = shownGenres.length > 0 && encoreLimit < encoreRoom;

  const byEncore = useQueries({
    queries: encores.map(({ genre, order, decade }) =>
      rowOf({
        genre,
        limit: ROW_LIMIT,
        ...(order === null ? {} : { order }),
        ...(decade === null ? {} : { yearFrom: decade, yearTo: decade + DECADE_SPAN }),
      }),
    ),
    combine: answersOf,
  });

  const areEncoresSettled = byEncore.every((one) => !one.isLoading);

  useQueries({
    queries:
      everyGenre.length > genreLimit || everyDecade.length > decadeLimit
        ? []
        : encoresUpTo(encoreLimit + ENCORE_BATCH * BATCHES_AHEAD)
            .slice(encores.length)
            .map(({ genre, order, decade }) => ({
              ...rowOf({
                genre,
                limit: ROW_LIMIT,
                ...(order === null ? {} : { order }),
                ...(decade === null ? {} : { yearFrom: decade, yearTo: decade + DECADE_SPAN }),
              }),
              enabled: canAsk && areEncoresSettled,
            })),
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
      more: encores.map(({ at, genre, order, decade }, index) => ({
        id: `more:${at.toString()}`,
        title: encoreTitle(genre, order, decade),
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
    });
  }, [
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
    isReading: !hasDrawn && isReadingFirst,
    hasMore: hasMoreGenres || hasMoreDecades || hasMoreEncores,
    isReadingMore:
      byGenre.some((one) => one.isLoading) ||
      byDecade.some((one) => one.isLoading) ||
      byEncore.some((one) => one.isLoading),
    showMore,
  };
};

export { useHomeRows };
