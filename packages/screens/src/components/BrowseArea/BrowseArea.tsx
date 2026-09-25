import { useEffect, useMemo, useRef, useState } from 'react';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { arrangeForBrowsing } from '@ValenceClient/library/arrangeForBrowsing';
import { BrowseOrderSchema } from '@ValenceClient/library/BrowseOrder';
import {
  readBrowseArrangement,
  saveBrowseArrangement,
} from '@ValenceScreens/library/browseArrangementPreference';
import type { Arrangement } from '@ValenceScreens/library/browseArrangementPreference';
import type { BrowseOrder } from '@ValenceClient/library/BrowseOrder';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Spinner } from '@ValenceUI/Spinner';
import { revealVariants, revealTransition, staggerVariants } from '@ValenceUI/animations/reveal';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownWideNarrow as SortIcon,
  Film as FilmIcon,
  Flame as FlameIcon,
  FolderOpen as FolderOpenIcon,
  Heart as HeartIcon,
  Monitor as MonitorIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { howToFillIt } from '@ValenceClient/library/howToFillIt';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { unwatchedByShow } from '@ValenceClient/library/unwatchedByShow';
import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import { MediaGrid } from '@ValenceScreens/components/MediaGrid/MediaGrid';
import { GridSizeChooser } from '@ValenceScreens/components/GridSizeChooser/GridSizeChooser';
import { readGridSize, saveGridSize } from '@ValenceScreens/library/gridSizePreference';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { BrowseAreaProps, BrowseKind } from './BrowseArea.types';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookRow } from '@ValenceScreens/components/BookRow/BookRow';
import { AppliedFilters } from '@ValenceUI/AppliedFilters';
import { BackToTop } from '@ValenceUI/BackToTop';
import { FilterMenu } from '@ValenceUI/FilterMenu';
import { useLibraryFilters } from '@ValenceClient/library/useLibraryFilters';
import { say } from '@ValenceI18n/say';

const PAGE_SIZE = 120;

const PAGES: Record<
  BrowseKind,
  {
    title: StringKey;
    empty: StringKey;
    filter: StringKey;
    order: StringKey;
    reading: StringKey;
    of: IconGlyph;
    emptyIsAbout: 'one library' | 'every library' | 'nothing anybody scanned';
  }
> = {
  shows: {
    title: 'screens.browseArea.shows.title',
    empty: 'screens.browseArea.shows.empty',
    filter: 'screens.browseArea.shows.filter',
    order: 'screens.browseArea.shows.order',
    reading: 'screens.browseArea.shows.reading',
    // eslint-disable-next-line valence/no-hard-coded-strings -- a case howToFillIt switches on, not words
    emptyIsAbout: 'one library',
    of: MonitorIcon,
  },
  films: {
    title: 'screens.browseArea.films.title',
    empty: 'screens.browseArea.films.empty',
    filter: 'screens.browseArea.films.filter',
    order: 'screens.browseArea.films.order',
    reading: 'screens.browseArea.films.reading',
    // eslint-disable-next-line valence/no-hard-coded-strings -- a case howToFillIt switches on, not words
    emptyIsAbout: 'one library',
    of: FilmIcon,
  },
  new: {
    title: 'screens.browseArea.new.title',
    empty: 'screens.browseArea.new.empty',
    filter: 'screens.browseArea.new.filter',
    order: 'screens.browseArea.new.order',
    reading: 'screens.browseArea.new.reading',
    // eslint-disable-next-line valence/no-hard-coded-strings -- a case howToFillIt switches on, not words
    emptyIsAbout: 'every library',
    of: FlameIcon,
  },
  favourites: {
    title: 'screens.browseArea.favourites.title',
    empty: 'screens.browseArea.favourites.empty',
    filter: 'screens.browseArea.favourites.filter',
    order: 'screens.browseArea.favourites.order',
    reading: 'screens.browseArea.favourites.reading',
    // eslint-disable-next-line valence/no-hard-coded-strings -- a case howToFillIt switches on, not words
    emptyIsAbout: 'nothing anybody scanned',
    of: HeartIcon,
  },
};

const BROWSE_ORDERS: readonly BrowseOrder[] = ['added', 'released', 'title', 'rating', 'size'];

const ORDER_NAMES: Record<BrowseOrder, StringKey> = {
  added: 'screens.browseArea.order.added',
  released: 'screens.browseArea.order.released',
  title: 'screens.browseArea.order.title',
  rating: 'screens.browseArea.order.rating',
  size: 'screens.browseArea.order.size',
};
/**
 * A page of the library asked one question — the films, the programmes, what arrived recently, what
 * has been kept — drawn as a grid across every library rather than one at a time.
 *
 * @param kind - Which question this page asks.
 * @param libraryId - One library to keep the page to, or null for every one of that kind.
 * @param onOpenShow - Told to open a programme, for a page whose cards stand for programmes.
 * @param onPlay - Told to start something, and where from.
 * @param onInspect - Told to open the page about something.
 * @param onItemsLoaded - Told what it drew, so an address naming an item can be resolved.
 * @param watchedFractionFor - How far through each item this viewer is.
 * @param isFinished - Whether this viewer has watched an item to the end, for how many episodes of
 *   each programme are left.
 * @param resumeFor - Where they left each item.
 * @param favourites - What they have kept, for the page that lists them.
 * @param isKept - Whether each item is kept.
 * @param onToggleKept - Told to keep something, or stop.
 * @param onHide - Told to hide something from this viewer.
 * @param keptBooks - The books this viewer has kept, for the favourites page.
 * @param onOpenBook - Told which kept book was chosen.
 */
const BrowseArea = ({
  kind,
  libraryId = null,
  onOpenShow,
  onPlay,
  onInspect,
  onItemsLoaded,
  watchedFractionFor,
  isFinished,
  resumeFor,
  favourites = [],
  keptBooks = [],
  onOpenBook,
  isKept,
  onToggleKept,
  onHide,
  onAddLibrary,
}: BrowseAreaProps) => {
  const [size, setSize] = useState(readGridSize);
  const [chosen, setChosen] = useState<{ kind: string; arrangement: Arrangement } | null>(null);
  const prefersReducedMotion = useReducedMotionConfig();
  const page = PAGES[kind];
  const filters = useLibraryFilters();
  const arrangement = useMemo(
    () => (chosen?.kind === kind ? chosen.arrangement : readBrowseArrangement(kind)),
    [chosen, kind],
  );
  const kindBefore = useRef(kind);

  useEffect(() => {
    if (kindBefore.current !== kind) {
      kindBefore.current = kind;
      filters.clear();
    }
  });

  const reportItems = useRef(onItemsLoaded);

  useEffect(() => {
    reportItems.current = onItemsLoaded;
  });

  const libraries = useQuery(libraryQueries.all());

  const hasNoLibraries = libraries.data !== undefined && libraries.data.length === 0;

  const libraryIds = useMemo(() => {
    const every = libraries.data ?? [];
    const only = every.find((entry) => entry.id === libraryId);

    return (
      only !== undefined && (kind === 'films' ? only.kind === 'movies' : only.kind === kind)
        ? [only]
        : every
    ).map((entry) => entry.id);
  }, [libraries.data, libraryId, kind]);

  const kept = favourites.join(',');
  const isFilterable = kind === 'films' || kind === 'shows';

  const asked =
    kind === 'favourites'
      ? { ids: kept === '' ? [] : kept.split(','), limit: PAGE_SIZE }
      : { order: 'newest' as const, limit: PAGE_SIZE };

  const found = useQuery(
    isFilterable
      ? libraryQueries.everything(libraryIds, { kind, ...filters.asked })
      : libraryQueries.across(libraryIds, asked),
  );

  const items = useMemo(() => collapseToShows(found.data ?? []), [found.data]);
  const unwatched = useMemo(
    () =>
      kind === 'shows' && isFinished !== undefined
        ? unwatchedByShow(found.data ?? [], isFinished)
        : null,
    [kind, found.data, isFinished],
  );

  const shown = useMemo(
    () =>
      !isFilterable
        ? items
        : arrangeForBrowsing(items, {
            ...arrangement,
            isWatched: (item) =>
              kind === 'shows'
                ? unwatched?.get(item.seriesId ?? item.seriesTitle ?? '') === 0
                : isFinished?.(item.id) === true,
          }),
    [isFilterable, items, arrangement, kind, unwatched, isFinished],
  );

  const arrange = (next: Arrangement) => {
    setChosen({ kind, arrangement: next });
    saveBrowseArrangement(kind, next);
  };

  const bookIds = kind === 'favourites' ? keptBooks : [];
  const foundBooks = useQuery(bookQueries.find({ ids: bookIds }));
  const books = bookIds.length === 0 ? [] : (foundBooks.data ?? []);

  const isReading =
    libraries.isPending ||
    (libraryIds.length > 0 && found.isPending) ||
    (bookIds.length > 0 && foundBooks.isPending);

  useEffect(() => {
    if (!isReading) {
      reportItems.current?.(items);
    }
  }, [items, isReading]);

  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      exit="gone"
      className="flex flex-col gap-6 px-5 pb-16 pt-6 sm:px-10"
    >
      <BackToTop />

      <motion.header
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'heavy')}
        className="flex min-h-10 items-center justify-end gap-4"
      >
        <h1 className="sr-only">{say(page.title)}</h1>

        {!isFilterable || filters.groups.length === 0 ? null : (
          <FilterMenu
            label={say(page.filter)}
            hasLabel
            groups={filters.groups}
            selected={filters.selected}
            onChange={filters.change}
          />
        )}

        {!isFilterable || isReading || items.length === 0 ? null : (
          <OptionMenu
            label={say(page.order)}
            align="end"
            triggerShape="button"
            trigger={
              <>
                <Icon of={SortIcon} size={16} />
                {say(ORDER_NAMES[arrangement.order])}
              </>
            }
            groups={[
              {
                name: say('screens.browseArea.orderGroup'),
                options: BROWSE_ORDERS.map((order) => ({
                  id: order,
                  label: say(ORDER_NAMES[order]),
                })),
                selectedId: arrangement.order,
                onSelect: (id) => {
                  const chosen = BrowseOrderSchema.safeParse(id);

                  if (chosen.success) {
                    arrange({ ...arrangement, order: chosen.data });
                  }
                },
              },
              {
                name: say('screens.browseArea.showGroup'),
                options: [
                  { id: 'everything', label: say('screens.browseArea.everything') },
                  { id: 'unwatched', label: say('screens.browseArea.onlyUnwatched') },
                ],
                selectedId: arrangement.isHidingWatched ? 'unwatched' : 'everything',
                onSelect: (id) => {
                  arrange({ ...arrangement, isHidingWatched: id === 'unwatched' });
                },
              },
            ]}
          />
        )}

        {isReading || items.length === 0 ? null : (
          <GridSizeChooser
            value={size}
            onValueChange={(next) => {
              setSize(next);
              saveGridSize(next);
            }}
          />
        )}
      </motion.header>

      {!isFilterable ? null : (
        <AppliedFilters
          groups={filters.groups}
          selected={filters.selected}
          onRemove={(id) => {
            const next = new Set(filters.selected);

            next.delete(id);
            filters.change(next);
          }}
          onClear={filters.clear}
        />
      )}

      <motion.section
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion)}
        aria-label={say(page.title)}
        className="flex flex-col gap-5"
      >
        {libraries.isError || found.isError ? (
          <CouldNotRead
            what={say(page.title)}
            isTryingAgain={libraries.isFetching || found.isFetching}
            onTryAgain={() => {
              void libraries.refetch();
              void found.refetch();
            }}
          />
        ) : isReading ? (
          <Spinner isCentered label={say(page.reading)} size="sm" />
        ) : items.length === 0 && books.length === 0 ? (
          hasNoLibraries ? (
            <NothingHere
              of={FolderOpenIcon}
              title={say('screens.browseArea.noLibraries')}
              // eslint-disable-next-line valence/no-hard-coded-strings -- a case howToFillIt switches on, not words
              detail={howToFillIt('no libraries', onAddLibrary !== undefined)}
              {...(onAddLibrary === undefined
                ? {}
                : {
                    action: (
                      <Button variant="glossy" onClick={onAddLibrary}>
                        {say('screens.browseArea.addLibrary')}
                      </Button>
                    ),
                  })}
            />
          ) : page.emptyIsAbout === 'nothing anybody scanned' ? (
            <NothingHere of={page.of} title={say(page.empty)} />
          ) : (
            <NothingHere
              of={page.of}
              title={say(page.empty)}
              detail={howToFillIt(page.emptyIsAbout, onAddLibrary !== undefined)}
              {...(onAddLibrary === undefined
                ? {}
                : {
                    action: (
                      <Button variant="glossy" onClick={onAddLibrary}>
                        {say('screens.browseArea.scanIt')}
                      </Button>
                    ),
                  })}
            />
          )
        ) : (
          <>
            {items.length === 0 ? null : (
              <MediaGrid
                items={shown}
                size={size}
                isSeries={kind === 'shows'}
                shape={kind === 'films' || kind === 'shows' ? 'poster' : 'wide'}
                {...(onOpenShow === undefined ? {} : { onOpenShow })}
                onPlay={onPlay}
                onInspect={onInspect}
                {...(watchedFractionFor === undefined ? {} : { watchedFractionFor })}
                {...(unwatched === null
                  ? {}
                  : {
                      unwatchedFor: (media: MediaSummary) =>
                        unwatched.get(media.seriesId ?? media.seriesTitle ?? ''),
                    })}
                {...(resumeFor === undefined ? {} : { resumeFor })}
                {...(isKept === undefined ? {} : { isKept })}
                {...(onToggleKept === undefined ? {} : { onToggleKept })}
                {...(onHide === undefined ? {} : { onHide })}
              />
            )}

            {books.length === 0 || onOpenBook === undefined ? null : (
              <BookRow title={say('screens.browseArea.books')} books={books} onOpen={onOpenBook} />
            )}
          </>
        )}
      </motion.section>
    </motion.div>
  );
};

BrowseArea.displayName = 'BrowseArea';

export { BrowseArea };
