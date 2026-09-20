import { Icon } from '@ValenceUI/Icon';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Filter as FilterIcon, Search as SearchIcon, X as XIcon } from '@keyline-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { Spinner } from '@ValenceUI/Spinner';
import { revealVariants, revealTransition, staggerVariants } from '@ValenceUI/animations/reveal';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import { MediaGrid } from '@ValenceScreens/components/MediaGrid/MediaGrid';
import { GridSizeChooser } from '@ValenceScreens/components/GridSizeChooser/GridSizeChooser';
import { readGridSize, saveGridSize } from '@ValenceScreens/library/gridSizePreference';
import { buildFilterOptions } from './buildFilterOptions';
import { FilterChips } from './components/FilterChips/FilterChips';
import type { LibraryFacets } from '@ValenceContracts/schemas/Library';
import type { SearchAreaProps, SearchKind } from './SearchArea.types';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AlbumShelf } from '@ValenceScreens/components/AlbumShelf/AlbumShelf';
import { ArtistShelf } from '@ValenceScreens/components/ArtistShelf/ArtistShelf';
import { BookRow } from '@ValenceScreens/components/BookRow/BookRow';
import { AskableResults } from './components/AskableResults/AskableResults';
import { BackToTop } from '@ValenceUI/BackToTop';

const SETTLE_MILLISECONDS = 250;

const PAGE_SIZE = 60;

const KINDS: { id: SearchKind; label: string }[] = [
  { id: 'everything', label: 'Everything' },
  { id: 'films', label: 'Films' },
  { id: 'shows', label: 'Shows' },
  { id: 'music', label: 'Music' },
  { id: 'books', label: 'Books' },
];

const NO_FACETS: LibraryFacets = { genres: [], decades: [], maxRating: 0 };

const DECADE = 10;

/**
 * Reads a chip's value back as a number, since chips deal in strings and everything downstream of
 * them is arithmetic.
 *
 * @param value - The chip's value, or nothing where none is chosen.
 * @returns The number, or nothing.
 */
const asNumber = (value: string | null): number | undefined =>
  value === null ? undefined : Number(value);

/**
 * Searching the libraries, and narrowing them. A field on its own answers "what is this called", and
 * most of the time somebody is asking something looser — a kind of thing, a decade, an evening's
 * worth of something. Both are asked of the server rather than of the page, since a library is
 * longer than one page of it.
 *
 * @param search - What is in the search box.
 * @param onSearchChange - Told what was typed.
 * @param genre - The genre chosen, or nothing.
 * @param onGenreChange - Told which genre was chosen.
 * @param onPlay - Told to start something, and where from.
 * @param onInspect - Told to open the page about something.
 * @param onItemsLoaded - Told what it found, so an address naming an item can be resolved.
 * @param watchedFractionFor - How far through each item this viewer is.
 * @param resumeFor - Where they left each item.
 * @param isKept - Whether each item is kept.
 * @param onToggleKept - Told to keep something, or stop.
 * @param onOpenBook - Told which book was chosen, where books are searched too.
 * @param onAsk - Told which title not in the library was chosen, where somebody may ask for one;
 *   without it, only the library is searched.
 * @param onHide - Told to hide something from this viewer.
 */
const SearchArea = ({
  search,
  onSearchChange,
  genre,
  onGenreChange,
  onPlay,
  onInspect,
  onItemsLoaded,
  watchedFractionFor,
  resumeFor,
  isKept,
  onToggleKept,
  onHide,
  onOpenBook,
  onAsk,
}: SearchAreaProps) => {
  const [kind, setKind] = useState<SearchKind>('everything');
  const [decade, setDecade] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<string | null>(null);
  const [minYourStars, setMinYourStars] = useState<string | null>(null);
  const [isShowingFilters, setIsShowingFilters] = useState(false);
  const [size, setSize] = useState(readGridSize);
  const [liveSearch, setLiveSearch] = useState(search);
  const prefersReducedMotion = useReducedMotionConfig();

  useEffect(() => {
    setLiveSearch(search);
  }, [search]);

  const reportSearchChange = useRef(onSearchChange);

  reportSearchChange.current = onSearchChange;

  useEffect(() => {
    if (liveSearch === search) {
      return;
    }

    const timer = setTimeout(() => {
      reportSearchChange.current(liveSearch);
    }, SETTLE_MILLISECONDS);

    return () => {
      clearTimeout(timer);
    };
  }, [liveSearch, search]);

  const asking = useQuery(libraryQueries.facets());
  const facets = asking.data ?? NO_FACETS;

  const options = useMemo(() => buildFilterOptions(facets), [facets]);

  const reportItems = useRef(onItemsLoaded);

  reportItems.current = onItemsLoaded;

  const libraries = useQuery(libraryQueries.all());

  const libraryIds = useMemo(
    () => (libraries.data ?? []).map((entry) => entry.id),
    [libraries.data],
  );

  const asked = useMemo(() => {
    const startsAt = asNumber(decade);

    return {
      ...(liveSearch.trim() === '' ? {} : { search: liveSearch }),
      ...(kind === 'films' || kind === 'shows' ? { kind } : {}),
      ...(genre === null ? {} : { genre }),
      ...(startsAt === undefined ? {} : { yearFrom: startsAt, yearTo: startsAt + DECADE - 1 }),
      ...(minRating === null ? {} : { minRating: Number(minRating) }),
      ...(minYourStars === null ? {} : { minYourStars: Number(minYourStars) }),
      limit: PAGE_SIZE,
    };
  }, [liveSearch, kind, genre, decade, minRating, minYourStars]);

  const [settled, setSettled] = useState(asked);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(asked);
    }, SETTLE_MILLISECONDS);

    return () => {
      clearTimeout(timer);
    };
  }, [asked]);

  const found = useQuery({
    ...libraryQueries.across(libraryIds, settled),
    enabled: kind !== 'books' && kind !== 'music',
  });

  const items = useMemo(
    () => (kind === 'books' || kind === 'music' ? [] : collapseToShows(found.data ?? [])),
    [found.data, kind],
  );

  const wantsMusic =
    (kind === 'everything' || kind === 'music') &&
    settled.search !== undefined &&
    settled.search !== '';

  const foundMusic = useQuery({
    ...musicQueries.search(settled.search ?? ''),
    enabled: wantsMusic,
  });

  const music = wantsMusic
    ? (foundMusic.data ?? { tracks: [], albums: [], artists: [], playlists: [] })
    : { tracks: [], albums: [], artists: [], playlists: [] };

  const wantsBooks =
    (kind === 'everything' || kind === 'books') &&
    settled.search !== undefined &&
    genre === null &&
    settled.yearFrom === undefined &&
    settled.minRating === undefined &&
    settled.minYourStars === undefined;

  const foundBooks = useQuery({
    ...bookQueries.find({ search: settled.search ?? '' }),
    enabled: wantsBooks,
  });

  const books = wantsBooks ? (foundBooks.data ?? []) : [];
  const howMany = items.length + books.length + music.albums.length + music.artists.length;

  const isReading =
    libraries.isPending ||
    (libraryIds.length > 0 &&
      ((kind !== 'books' && kind !== 'music' && found.isPending) ||
        (wantsBooks && foundBooks.isPending) ||
        (wantsMusic && foundMusic.isPending) ||
        asked !== settled));

  useEffect(() => {
    if (!isReading) {
      reportItems.current?.(items);
    }
  }, [items, isReading]);

  const narrowed = [decade, minRating, minYourStars].filter((chosen) => chosen !== null).length;

  const isNarrowed =
    kind !== 'everything' || genre !== null || liveSearch.trim() !== '' || narrowed > 0;

  const clearFilters = () => {
    setDecade(null);
    setMinRating(null);
  };

  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      exit="gone"
      className="flex flex-col gap-6"
    >
      <BackToTop />

      <div className="flex flex-col gap-6">
        <motion.div
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion, 'heavy')}
        >
          <TextField
            label="Search the library"
            isLabelHidden
            isBare
            size="xl"
            type="search"
            hasFocusOnMount
            value={liveSearch}
            placeholder="Everything you own"
            icon={<Icon of={SearchIcon} size={28} />}
            onValueChange={setLiveSearch}
          />
        </motion.div>

        <motion.div
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            {KINDS.map((option) => (
              <Button
                key={option.id}
                size="sm"
                variant={option.id === kind ? 'glossy' : 'secondary'}
                onClick={() => {
                  setKind(option.id);
                }}
              >
                {option.label}
              </Button>
            ))}

            <Button
              size="sm"
              variant={isShowingFilters ? 'glossy' : 'secondary'}
              isActive={isShowingFilters}
              onClick={() => {
                setIsShowingFilters(!isShowingFilters);
              }}
            >
              <Icon of={FilterIcon} size={16} />
              {narrowed === 0 ? 'Filters' : `Filters (${narrowed.toString()})`}
            </Button>

            {!isNarrowed ? null : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setKind('everything');
                  onGenreChange(null);
                  setLiveSearch('');
                  onSearchChange('');
                  clearFilters();
                }}
              >
                <Icon of={XIcon} size={16} />
                Clear
              </Button>
            )}
          </div>

          <FilterChips
            legend="Genre"
            options={options.genres}
            value={genre}
            onValueChange={onGenreChange}
          />

          <AnimatePresence initial={false}>
            {!isShowingFilters ? null : (
              <motion.div
                key="filters"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={revealTransition(prefersReducedMotion)}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-5 pt-2">
                  <FilterChips
                    legend="Decade"
                    options={options.decades}
                    value={decade}
                    onValueChange={setDecade}
                  />
                  <FilterChips
                    legend="Rating"
                    options={options.ratings}
                    value={minRating}
                    onValueChange={setMinRating}
                  />
                  <FilterChips
                    legend="Your rating"
                    options={options.yourStars}
                    value={minYourStars}
                    onValueChange={setMinYourStars}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <motion.section
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion)}
        aria-label="Results"
        className="flex flex-col gap-5"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-muted">
          {isReading ? (
            <Spinner isCentered label="Searching" size="sm" />
          ) : (
            <span>
              {howMany === 0 ? (
                'Nothing here'
              ) : (
                <AnimatedNumber value={howMany} suffix={howMany === 1 ? ' result' : ' results'} />
              )}
            </span>
          )}

          {items.length === 0 ? null : (
            <GridSizeChooser
              value={size}
              onValueChange={(next) => {
                setSize(next);
                saveGridSize(next);
              }}
            />
          )}
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={[kind, genre, decade, minRating, minYourStars].join(':')}
            variants={staggerVariants}
            initial="hidden"
            animate="shown"
            exit="gone"
          >
            {libraries.isError || found.isError ? (
              <CouldNotRead
                what="The library"
                isTryingAgain={libraries.isFetching || found.isFetching}
                onTryAgain={() => {
                  void libraries.refetch();
                  void found.refetch();
                }}
              />
            ) : howMany === 0 && !isReading ? (
              <p className="max-w-prose text-text-muted">
                {kind === 'books' && settled.search === undefined
                  ? 'Type the name of a book, or who wrote it.'
                  : isNarrowed
                    ? 'Nothing matches all of that. Taking one of the filters off is usually the fastest way back.'
                    : 'This library has nothing in it yet. Scanning one from the home page is where things come from.'}
              </p>
            ) : (
              <div className="flex flex-col gap-8">
                {items.length === 0 ? null : (
                  <MediaGrid
                    items={items}
                    size={size}
                    onPlay={onPlay}
                    onInspect={onInspect}
                    {...(watchedFractionFor === undefined ? {} : { watchedFractionFor })}
                    {...(resumeFor === undefined ? {} : { resumeFor })}
                    {...(isKept === undefined ? {} : { isKept })}
                    {...(onToggleKept === undefined ? {} : { onToggleKept })}
                    {...(onHide === undefined ? {} : { onHide })}
                  />
                )}

                {books.length === 0 || onOpenBook === undefined ? null : (
                  <BookRow title="Books" books={books} onOpen={onOpenBook} />
                )}

                {music.artists.length === 0 && music.albums.length === 0 ? null : (
                  <div className="flex flex-col gap-8 [--music-lane:0px]">
                    <ArtistShelf heading="Artists" artists={music.artists} />
                    <AlbumShelf heading="Albums" albums={music.albums} />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {onAsk === undefined || settled.search === undefined ? null : (
          <AskableResults query={settled.search} kind={kind} onAsk={onAsk} />
        )}
      </motion.section>
    </motion.div>
  );
};

SearchArea.displayName = 'SearchArea';

export { SearchArea };
