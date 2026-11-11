import { cardArtworkOf } from '@ValenceClient/library/cardArtworkOf';
import { useArtworkWarming } from '@ValenceScreens/library/useArtworkWarming';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FolderOpen as FolderOpenIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { NothingHere } from '@ValenceUI/NothingHere';
import { freshFlags } from '@ValenceClient/library/freshFlags';
import { BackToTop } from '@ValenceUI/BackToTop';
import { ComingUp } from '@ValenceScreens/components/ComingUp/ComingUp';
import { SplashScreenWithBrand } from '@ValenceScreens/components/SplashScreenWithBrand/SplashScreenWithBrand';
import { Spinner } from '@ValenceUI/Spinner';
import { Hero } from '@ValenceScreens/components/Hero/Hero';
import { groupIntoRails, RESUMING } from '@ValenceClient/library/groupIntoRails';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { pickUpFrom } from '@ValenceClient/library/pickUpFrom';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { pickFeatured } from '@ValenceClient/library/pickFeatured';
import { cn } from '@ValenceUI/cn';
import { LibraryRail } from '@ValenceScreens/components/LibraryBrowser/components/LibraryRail/LibraryRail';
import { EmptyLibrary } from '@ValenceScreens/components/LibraryBrowser/components/EmptyLibrary/EmptyLibrary';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { useHomeRows } from '@ValenceClient/library/useHomeRows';
import { useDismissWithUndo } from '@ValenceScreens/library/useDismissWithUndo';
import { useShell } from '@ValenceClient/shell/useShell';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import type { LibraryKind, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { LibraryBrowserProps } from './LibraryBrowser.types';
import { say } from '@ValenceI18n/say';

const HERO_COUNT = 5;

const WARMED_PER_RAIL = 10;

const WARMED_RAILS = 10;

const NEAR_THE_END_PX = 3000;

const PAGE_SIZE = 60;

const SEARCH_DEBOUNCE_MS = 250;

const HERO_SAMPLE = 200;

const WATCHABLE: ReadonlySet<LibraryKind> = new Set(['movies', 'shows', 'anime']);

/**
 * The front of the server: a hero drawn from everything on it, and the rows beneath it.
 *
 * Every library holding something to watch, together — films and programmes on one page rather than
 * one library at a time behind a switch. Choosing between them is what the bar along the top is for,
 * and a second way of choosing on the page itself was the same question asked twice. Books are left
 * to their own section, since nothing in one can be played.
 *
 * Beneath the hero it is a handful of rows rather than the library laid end to end: carrying on,
 * what somebody is likely to want, what is new, what is well thought of, and a few genres. A server
 * with six thousand films is still a page of a dozen rows; the rest is what the sections along the
 * top and search are for. Genres keep arriving as somebody scrolls, a few at a time, so the page
 * goes on for as long as there is something new to show. Searching trades the rows for the answer.
 *
 * @param search - What is in the search box.
 * @param onPlay - Told to open the page about something.
 * @param onWatch - Told to start something, and where from.
 * @param onShow - Told to open a programme rather than an episode.
 * @param onOpenShow - Told to open the programme an episode belongs to.
 * @param onItemsLoaded - Told what it drew, so an address naming an item can be resolved.
 * @param onFeatureChange - Told which item the hero is showing.
 * @param onPalette - Told the colours on screen, so the page can be lit by them.
 * @param onAddLibrary - Told to add a library, where the viewer may.
 * @param hasHero - Whether to open with a hero at all.
 * @param isKept - Whether each item is kept.
 * @param onToggleKept - Told to keep something, or stop.
 * @param onHide - Told to hide something from this viewer.
 * @param onReading - Told whether it is still reading, so that whoever is holding a screen over it
 *   can keep holding it until there is something behind it worth showing.
 */
const LibraryBrowser = ({
  search = '',
  hasHero = false,
  onFeatureChange,
  onPalette,
  onItemsLoaded,
  onOpenShow,
  isKept,
  onToggleKept,
  onHide,
  onAddLibrary,
  onPlay,
  onShow,
  onWatch,
  onReading,
}: LibraryBrowserProps) => {
  const { go } = usePlace();
  const { user } = useShell();
  const [appliedSearch, setAppliedSearch] = useState('');

  const askedFor = useQuery(libraryQueries.all());
  const libraries = useMemo(() => askedFor.data ?? [], [askedFor.data]);

  const watchable = useMemo(
    () => libraries.filter((entry) => WATCHABLE.has(entry.kind)).map((entry) => entry.id),
    [libraries],
  );

  const isHome = appliedSearch === '';

  const page = useQuery({
    ...libraryQueries.across(watchable, { search: appliedSearch, limit: PAGE_SIZE }),
    enabled: watchable.length > 0 && !isHome,
  });

  const items = page.data ?? [];

  const sample = useQuery({
    ...libraryQueries.across(watchable, { search: '', limit: HERO_SAMPLE }),
    placeholderData: keepPreviousData,
  });

  const heroItems = useMemo(() => sample.data ?? [], [sample.data]);

  const sampleIds = heroItems.map((item) => item.id).join(' ');
  const [picked, setPicked] = useState(() => ({
    of: sampleIds,
    items: pickFeatured(heroItems, HERO_COUNT),
  }));

  if (picked.of !== sampleIds) {
    setPicked({ of: sampleIds, items: pickFeatured(heroItems, HERO_COUNT) });
  }

  const heroPicks = useMemo(
    () => picked.items.map((one) => heroItems.find((item) => item.id === one.id) ?? one),
    [picked.items, heroItems],
  );

  const watched = useQuery(viewingQueries.progress());
  const progress = useMemo(() => byMediaId(watched.data ?? []), [watched.data]);
  const queryClient = useQueryClient();

  const home = useHomeRows(user.id, watchable, progress, isHome, !watched.isLoading);
  const dismiss = useDismissWithUndo();
  const { hasMore, isReadingMore, showMore } = home;

  const [end, setEnd] = useState<HTMLDivElement | null>(null);
  const [isNearTheEnd, setIsNearTheEnd] = useState(false);
  const [isAtEnd, setIsAtEnd] = useState(false);

  useEffect(() => {
    if (end === null || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const watching = new IntersectionObserver(([entry]) => {
      setIsAtEnd(entry?.isIntersecting === true);
    });

    watching.observe(end);

    return () => {
      watching.disconnect();
    };
  }, [end]);
  const [openedAt] = useState(() => Date.now());

  const homeRails = home.rails;
  const rails = isHome ? homeRails : groupIntoRails(items, openedAt, progress);

  useEffect(() => {
    if (end === null) {
      return;
    }

    let frame = 0;

    const measure = () => {
      frame = 0;
      setIsNearTheEnd(end.getBoundingClientRect().top < window.innerHeight + NEAR_THE_END_PX);
    };

    const measureSoon = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(measure);
      }
    };

    measure();
    window.addEventListener('scroll', measureSoon, { passive: true });
    window.addEventListener('resize', measureSoon);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', measureSoon);
      window.removeEventListener('resize', measureSoon);
    };
  }, [end, rails.length]);

  useEffect(() => {
    if (isHome && isNearTheEnd && hasMore && !isReadingMore) {
      showMore();
    }
  }, [isHome, isNearTheEnd, hasMore, isReadingMore, showMore]);
  const shown = rails.flatMap((rail) => rail.items);

  useArtworkWarming(
    [
      ...rails.slice(0, WARMED_RAILS),
      ...rails.slice(Math.max(WARMED_RAILS, rails.length - WARMED_RAILS)),
    ].flatMap(({ standsForShows = false, items: railItems }) =>
      railItems.slice(0, WARMED_PER_RAIL).map((media) => {
        const isShow = isHome && standsForShows && showIdOf(media) !== null;
        const picture = cardArtworkOf(media, {
          shape: isShow ? 'poster' : 'wide',
          isSeries: isShow,
          drawsLarge: false,
        });

        return isHome ? picture.wide : picture.resting;
      }),
    ),
  );
  const shownKey = shown.map((media) => media.id).join(',');

  const flagOf = useMemo(
    () => freshFlags([...heroItems, ...rails.flatMap((rail) => rail.items)], openedAt),
    [heroItems, rails, openedAt],
  );

  const reportItems = useRef(onItemsLoaded);
  const shownRef = useRef(shown);

  useEffect(() => {
    reportItems.current = onItemsLoaded;
    shownRef.current = shown;
  });

  useEffect(() => {
    if (shownRef.current.length > 0) {
      reportItems.current?.(shownRef.current);
    }
  }, [shownKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  const isReading =
    askedFor.isPending ||
    page.isLoading ||
    home.isReading ||
    (hasHero && watchable.length > 0 && sample.isPending);

  const tellTheScreen = useRef(onReading);

  useEffect(() => {
    tellTheScreen.current = onReading;
  });

  useEffect(() => {
    tellTheScreen.current?.(isReading);

    return () => {
      tellTheScreen.current?.(false);
    };
  }, [isReading]);

  const start = useCallback(
    (media: MediaSummary, startSeconds: number) => {
      if (onWatch === undefined) {
        onPlay(media);

        return;
      }

      onWatch(media, startSeconds);
    },
    [onWatch, onPlay],
  );

  const playShow = useCallback(
    async (media: MediaSummary) => {
      const series = showIdOf(media);
      const detail =
        series === null
          ? null
          : await queryClient
              .fetchQuery(libraryQueries.show(media.libraryId, series))
              .catch(() => null);
      const pickedUp =
        detail === null
          ? null
          : pickUpFrom(detail, {
              resumeFor: (mediaId) => resumeFor(progress, mediaId),
              isFinished: (mediaId) => progress.get(mediaId)?.isFinished === true,
            });

      if (pickedUp !== null) {
        start(pickedUp.episode, pickedUp.startSeconds);

        return;
      }

      if (series !== null && onShow !== undefined) {
        onShow(series);

        return;
      }

      onPlay(media);
    },
    [queryClient, progress, start, onShow, onPlay],
  );

  const playShowCard = useCallback(
    (media: MediaSummary) => {
      void playShow(media);
    },
    [playShow],
  );

  if (askedFor.isError || page.isError) {
    return (
      <CouldNotRead
        said={say('common.yourLibraryCouldNotBeRead')}
        isTryingAgain={askedFor.isFetching || page.isFetching}
        onTryAgain={() => {
          void askedFor.refetch();
          void page.refetch();
        }}
      />
    );
  }

  if (isReading) {
    return onReading !== undefined ? null : (
      <SplashScreenWithBrand
        label={say('screens.libraryBrowser.readingYourLibrary')}
        hasMark={true}
        marksPlace="valence-mark"
      />
    );
  }

  if (libraries.length === 0) {
    return (
      <NothingHere
        of={FolderOpenIcon}
        title={say('common.noLibrariesYet')}
        detail={
          onAddLibrary === undefined
            ? say('common.askTheServerAdminToAdd')
            : say('common.addOneToGetStarted')
        }
        fills
        {...(onAddLibrary === undefined
          ? {}
          : {
              action: (
                <Button variant="glossy" onClick={onAddLibrary}>
                  {say('common.addALibrary')}
                </Button>
              ),
            })}
      />
    );
  }

  if (watchable.length === 0) {
    const hasMusic = libraries.some((entry) => entry.kind === 'music');

    return (
      <NothingHere
        of={FolderOpenIcon}
        title={say('common.nothingToWatchYet')}
        detail={say('screens.libraryBrowser.thisServerHasNoFilmsOr')}
        fills
        {...(hasMusic
          ? {
              action: (
                <Button
                  variant="glossy"
                  onClick={() => {
                    go({ section: 'music' });
                  }}
                >
                  {say('screens.libraryBrowser.goToMusic')}
                </Button>
              ),
            }
          : {})}
      />
    );
  }

  const hasSheet = hasHero && heroItems.length > 0;

  return (
    <>
      <BackToTop />

      <motion.div initial={false} animate="shown" exit="gone" className="flex flex-col gap-8">
        {hasSheet ? (
          <Hero
            items={heroPicks}
            staysBehind
            onPlay={(media, startSeconds) => {
              if (showIdOf(media) === null) {
                start(media, startSeconds);
              } else {
                void playShow(media);
              }
            }}
            resumeFor={(mediaId) => {
              const media = heroPicks.find((one) => one.id === mediaId);

              return media === undefined || showIdOf(media) !== null
                ? null
                : resumeFor(progress, mediaId);
            }}
            onInspect={(media) => {
              if (media.seriesId !== null && onShow !== undefined) {
                onShow(media.seriesId);

                return;
              }

              onPlay(media);
            }}
            {...(onFeatureChange === undefined ? {} : { onFeatureChange })}
            {...(onPalette === undefined ? {} : { onPalette })}
          />
        ) : null}

        <section
          {...(hasSheet ? { 'data-meets-bar': '' } : {})}
          className={cn(
            'flex flex-col gap-5 px-4 sm:px-6',
            hasSheet
              ? 'valence-sheet relative z-10 min-h-[calc(100svh-var(--nav-clearance,0px))] pb-16 pt-2'
              : '',
          )}
        >
          <AnimatePresence presenceAffectsLayout={false}>
            <motion.div key={appliedSearch} initial={false} animate="shown">
              {rails.length === 0 ? (
                <EmptyLibrary
                  search={appliedSearch}
                  libraryName={null}
                  hasContentElsewhere={heroItems.length > 0}
                  canManage={onAddLibrary !== undefined}
                  {...(onAddLibrary === undefined ? {} : { onManage: onAddLibrary })}
                />
              ) : (
                <div className="flex flex-col gap-10">
                  {isHome && onShow !== undefined ? <ComingUp onOpenShow={onShow} /> : null}

                  {rails.map((rail) => (
                    <LibraryRail
                      key={rail.id}
                      rail={rail}
                      isHome={isHome}
                      progress={progress}
                      flagOf={flagOf}
                      onPlayFilm={start}
                      onPlayShow={playShowCard}
                      onInspect={onPlay}
                      {...(onOpenShow === undefined ? {} : { onOpenShow })}
                      {...(isKept === undefined ? {} : { isKept })}
                      {...(onToggleKept === undefined ? {} : { onToggleKept })}
                      {...(onHide === undefined ? {} : { onHide })}
                      {...(dismiss === null || rail.id !== RESUMING ? {} : { onDismiss: dismiss })}
                    />
                  ))}

                  {isHome && hasMore ? (
                    <div ref={setEnd} className="flex h-16 items-center justify-center">
                      {isReadingMore && isAtEnd ? (
                        <Spinner
                          size="sm"
                          label={say('screens.libraryBrowser.findingMoreToWatch')}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </motion.div>
    </>
  );
};

LibraryBrowser.displayName = 'LibraryBrowser';

export { LibraryBrowser };
