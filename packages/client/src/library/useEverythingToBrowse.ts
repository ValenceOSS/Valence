import { useMemo } from 'react';
import { experimental_streamedQuery as streamedQuery, useQuery } from '@tanstack/react-query';
import { arrangeForBrowsing } from '@ValenceClient/library/arrangeForBrowsing';
import { narrowAsTheServerDoes } from '@ValenceClient/library/narrowAsTheServerDoes';
import { readEveryItemAsItComes } from '@ValenceClient/library/readEveryItemAsItComes';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import type { Arrangement } from '@ValenceClient/library/browseArrangementPreference';
import type { ListItemsOptions } from '@ValenceClient/library/fetchLibrary';
import type { NarrowedHere } from '@ValenceClient/library/narrowAsTheServerDoes';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type Asked = NarrowedHere &
  Pick<
    ListItemsOptions,
    'occasions' | 'audioLanguages' | 'audioCodecs' | 'audioChannels' | 'minYourStars'
  >;

type Browsing = {
  libraryIds: readonly string[];
  kind: 'films' | 'shows';
  asked: Asked;
  arrangement: Arrangement;
  isFinished: (mediaId: string) => boolean;
  isWanted: boolean;
};

type Browsed = {
  found: readonly MediaSummary[];
  cells: readonly MediaSummary[];
  isWaiting: boolean;
  isStillReading: boolean;
};

const NOTHING: readonly MediaSummary[] = [];

/**
 * Reads every film or programme in some libraries for a page that lists them all, drawing the
 * first page as soon as it arrives and the rest as they come, newest first so the top of the
 * usual order is right from the start. What the list can be narrowed by without the server is
 * narrowed here, so changing it reads nothing again, and the cards are put in order only when what
 * was read, the narrowing or the order changes.
 *
 * @param browsing - The libraries, which kind of title, what is asked, the order and whether to
 *   leave out what has been watched, what has been, and whether the page is showing at all.
 * @returns What was found, the cards to show in order, whether nothing has arrived yet, and whether
 *   more is still coming.
 */
const useEverythingToBrowse = ({
  libraryIds,
  kind,
  asked,
  arrangement,
  isFinished,
  isWanted,
}: Browsing): Browsed => {
  const { genres, decades, minRating, minYourStars } = asked;
  const { occasions, audioLanguages, audioCodecs, audioChannels } = asked;
  const here = useMemo(
    (): NarrowedHere => ({
      ...(genres === undefined ? {} : { genres }),
      ...(decades === undefined ? {} : { decades }),
      ...(minRating === undefined ? {} : { minRating }),
    }),
    [genres, decades, minRating],
  );
  const ofTheServer = useMemo(
    (): Omit<ListItemsOptions, 'limit' | 'offset'> => ({
      kind,
      order: 'newest',
      ...(occasions === undefined ? {} : { occasions }),
      ...(audioLanguages === undefined ? {} : { audioLanguages }),
      ...(audioCodecs === undefined ? {} : { audioCodecs }),
      ...(audioChannels === undefined ? {} : { audioChannels }),
      ...(minYourStars === undefined ? {} : { minYourStars }),
    }),
    [kind, occasions, audioLanguages, audioCodecs, audioChannels, minYourStars],
  );
  const read = useQuery({
    queryKey: [
      ...libraryQueries.key,
      'everything',
      'as-it-comes',
      [...libraryIds].sort(),
      ofTheServer,
    ],
    queryFn: streamedQuery<readonly MediaSummary[], readonly MediaSummary[]>({
      streamFn: ({ signal }) => readEveryItemAsItComes(libraryIds, ofTheServer, signal),
      refetchMode: 'replace',
      reducer: (all, page) => [...all, ...page],
      initialValue: NOTHING,
    }),
    enabled: isWanted && libraryIds.length > 0,
  });
  const held = isWanted ? read.data : undefined;
  const found = useMemo(
    () => (held === undefined ? NOTHING : narrowAsTheServerDoes(held, here)),
    [held, here],
  );
  const { order, isHidingWatched } = arrangement;
  const cells = useMemo(
    () => arrangeForBrowsing(found, { order, isHidingWatched, isFinished }),
    [found, order, isHidingWatched, isFinished],
  );

  return {
    found,
    cells,
    isWaiting: isWanted && read.isPending && read.fetchStatus !== 'idle',
    isStillReading: isWanted && held !== undefined && read.fetchStatus === 'fetching',
  };
};

export type { Browsed, Browsing };

export { useEverythingToBrowse };
