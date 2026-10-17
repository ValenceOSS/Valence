import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ArrowLeft as ArrowLeftIcon, ListVideo as ListVideoIcon } from '@keyline-icons/react';
import { ListVideo as ListVideoFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { easeOut } from '@ValenceUI/animations/reveal';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { gatherSeasons } from './gatherSeasons';
import { OPENED_EPISODE_REM } from './OPENED_EPISODE_REM';
import { EpisodeLine } from './components/EpisodeLine/EpisodeLine';
import { SeasonLine } from './components/SeasonLine/SeasonLine';
import type { EpisodeMenuProps, EpisodeMenuView, EpisodeSeason } from './EpisodeMenu.types';
import { say } from '@ValenceI18n/say';

const POINTING_SETTLES_MILLISECONDS = 90;

const SLIDE_PIXELS = 28;

const BACK_AWAY = {
  width: 0,
  marginLeft: '0rem',
  opacity: 0,
  x: -SLIDE_PIXELS / 2,
  overflow: 'hidden',
} as const;

const EPISODE_LINE_REM = 2.25;

const SEASON_LINE_REM = 4;

const LINE_GAP_REM = 0.125;

const PANEL_HEADING_AND_PADDING_REM = 4.75;

/**
 * Says how tall a list of equal lines stands, with the gaps between them.
 *
 * @param count - How many lines.
 * @param lineRem - How tall each one is, in rem.
 * @returns The height, in rem.
 */
const heightOfLines = (count: number, lineRem: number): number =>
  count * lineRem + Math.max(count - 1, 0) * LINE_GAP_REM;

/**
 * Names a season for the heading above its episodes, falling back to a neutral heading for anything
 * the scanner could not place in one.
 *
 * @param seasonNumber - The season, where it is known.
 * @returns What to call it.
 */
const headingOf = (seasonNumber: number | null): string =>
  seasonNumber === null ? say('common.episodes') : nameSeason(seasonNumber);

/**
 * Picks the episode a season opens on: the one playing where it is in that season, otherwise the
 * first the viewer has not finished, otherwise the first.
 *
 * @param season - The season being opened.
 * @param playingId - Which episode is on now.
 * @param watchedFractionFor - How to ask how far through a given episode they are.
 * @returns The episode's id, or null for a season of none.
 */
const firstToOpen = (
  season: EpisodeSeason,
  playingId: string,
  watchedFractionFor?: (mediaId: string) => number | undefined,
): string | null =>
  (
    season.episodes.find((episode) => episode.id === playingId) ??
    season.episodes.find((episode) => (watchedFractionFor?.(episode.id) ?? 0) < 1) ??
    season.episodes[0] ??
    null
  )?.id ?? null;

/**
 * Offers every episode of the programme without leaving the player, one season at a time: a list of
 * single lines, the one pointed at opened out to its still and what it is about, with a way back to
 * the list of seasons to move between them. Opens on the season and episode playing now.
 *
 * @param episodes - Every episode of the programme.
 * @param playingId - Which one is on now.
 * @param onSelect - Called with the episode they chose.
 * @param watchedFractionFor - How to ask how far through a given episode they are.
 * @param onOpenChange - Called as the menu opens or closes, so the bar stays put while it is open.
 * @param isDisabled - Whether the menu is inert, as it is while a session is starting.
 * @param isPlaying - Whether the player is playing, so the mark on the one on now moves with it.
 */
const EpisodeMenu = ({
  episodes,
  playingId,
  onSelect,
  watchedFractionFor,
  onOpenChange,
  isDisabled = false,
  isPlaying = true,
}: EpisodeMenuProps) => {
  const prefersReducedMotion = useReducedMotionConfig() === true;
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<EpisodeMenuView>({ kind: 'season', seasonNumber: null });
  const [direction, setDirection] = useState(1);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const pointingRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const linesRef = useRef(new Map<string, HTMLLIElement>());
  const landOnRef = useRef<string | null>(null);

  const seasons = useMemo(() => gatherSeasons(episodes), [episodes]);
  const playing = episodes.find((episode) => episode.id === playingId) ?? null;
  const viewKey =
    view.kind === 'everySeason' ? 'everySeason' : `season-${String(view.seasonNumber ?? 'none')}`;

  useEffect(
    () => () => {
      if (pointingRef.current !== null) {
        window.clearTimeout(pointingRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const rail = listRef.current?.parentElement ?? null;

      if (rail === null) {
        return;
      }

      const line = landOnRef.current === null ? undefined : linesRef.current.get(landOnRef.current);

      rail.scrollTop = line === undefined ? 0 : Math.max(line.offsetTop - 8, 0);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isOpen, viewKey]);

  if (episodes.length === 0) {
    return null;
  }

  const stopPointing = () => {
    if (pointingRef.current !== null) {
      window.clearTimeout(pointingRef.current);
      pointingRef.current = null;
    }
  };

  const pointAt = (mediaId: string) => {
    stopPointing();
    pointingRef.current = window.setTimeout(() => {
      pointingRef.current = null;
      setOpenedId(mediaId);
    }, POINTING_SETTLES_MILLISECONDS);
  };

  const show = (next: boolean) => {
    if (next) {
      setView({
        kind: 'season',
        seasonNumber: playing?.seasonNumber ?? seasons[0]?.seasonNumber ?? null,
      });
      setDirection(1);
      setOpenedId(playingId);
      landOnRef.current = playingId;
    } else {
      stopPointing();
    }

    setIsOpen(next);
    onOpenChange?.(next);
  };

  const openSeason = (season: EpisodeSeason) => {
    const first = firstToOpen(season, playingId, watchedFractionFor);

    setDirection(1);
    setView({ kind: 'season', seasonNumber: season.seasonNumber });
    setOpenedId(first);
    landOnRef.current = first;
  };

  const backToEverySeason = () => {
    stopPointing();
    setDirection(-1);
    setView({ kind: 'everySeason' });
    landOnRef.current = null;
  };

  const shownSeason =
    view.kind === 'season'
      ? (seasons.find((season) => season.seasonNumber === view.seasonNumber) ?? seasons[0])
      : undefined;

  const tallestRem = Math.max(
    ...seasons.map(
      (season) => heightOfLines(season.episodes.length, EPISODE_LINE_REM) + OPENED_EPISODE_REM,
    ),
    seasons.length < 2 ? 0 : heightOfLines(seasons.length, SEASON_LINE_REM),
  );

  const heading = (
    <span className="flex items-center">
      <AnimatePresence initial={false}>
        {view.kind === 'everySeason' || seasons.length < 2 ? null : (
          <motion.span
            key="back"
            initial={prefersReducedMotion ? { opacity: 0 } : BACK_AWAY}
            animate={{
              width: 'auto',
              marginLeft: '-0.25rem',
              opacity: 1,
              x: 0,
              transitionEnd: { overflow: 'visible' },
            }}
            exit={prefersReducedMotion ? { opacity: 0 } : BACK_AWAY}
            transition={{ duration: prefersReducedMotion ? 0.12 : 0.24, ease: easeOut }}
            className="-my-1 flex shrink-0"
          >
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              label={say('screens.seasonChooser.seasons')}
              onClick={backToEverySeason}
              className="mr-2"
            >
              <Icon of={ArrowLeftIcon} size={18} />
            </Button>
          </motion.span>
        )}
      </AnimatePresence>

      <span className="flex min-w-0 flex-col">
        {playing?.seriesTitle === null || playing?.seriesTitle === undefined ? null : (
          <span className="truncate text-xs font-normal text-text-muted">
            {playing.seriesTitle}
          </span>
        )}

        <span className="truncate">
          {view.kind === 'everySeason'
            ? say('screens.seasonChooser.seasons')
            : headingOf(shownSeason?.seasonNumber ?? null)}
        </span>
      </span>
    </span>
  );

  return (
    <PopoverPanel
      tone="default"
      label={say('common.episodes')}
      heading={heading}
      isDisabled={isDisabled}
      isOpen={isOpen}
      onOpenChange={show}
      trigger={
        isOpen ? <Icon of={ListVideoFilledIcon} size={20} /> : <Icon of={ListVideoIcon} size={20} />
      }
      className="w-[min(30rem,calc(100vw-1.5rem))] mb-7.5"
    >
      <div
        ref={listRef}
        className="relative overflow-x-clip"
        style={{
          minHeight: `min(${tallestRem.toString()}rem, calc(70vh - ${PANEL_HEADING_AND_PADDING_REM.toString()}rem))`,
        }}
      >
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          <motion.div
            key={viewKey}
            custom={direction}
            variants={{
              arriving: (towards: number) => ({
                x: prefersReducedMotion ? 0 : towards * SLIDE_PIXELS,
                opacity: 0,
              }),
              here: { x: 0, opacity: 1 },
              leaving: (towards: number) => ({
                x: prefersReducedMotion ? 0 : towards * -SLIDE_PIXELS,
                opacity: 0,
              }),
            }}
            initial="arriving"
            animate="here"
            exit="leaving"
            transition={{ duration: prefersReducedMotion ? 0.12 : 0.24, ease: easeOut }}
          >
            {view.kind === 'everySeason' ? (
              <ul className="flex flex-col gap-0.5">
                {seasons.map((season) => (
                  <li key={String(season.seasonNumber ?? 'none')}>
                    <SeasonLine
                      season={season}
                      name={headingOf(season.seasonNumber)}
                      isOn={season.episodes.some((episode) => episode.id === playingId)}
                      isMoving={isPlaying}
                      watchedCount={
                        season.episodes.filter(
                          (episode) => (watchedFractionFor?.(episode.id) ?? 0) >= 1,
                        ).length
                      }
                      onChoose={() => {
                        openSeason(season);
                      }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {(shownSeason?.episodes ?? []).map((episode) => {
                  const watchedFraction = watchedFractionFor?.(episode.id);

                  return (
                    <li
                      key={episode.id}
                      ref={(element) => {
                        if (element === null) {
                          linesRef.current.delete(episode.id);
                        } else {
                          linesRef.current.set(episode.id, element);
                        }
                      }}
                    >
                      <EpisodeLine
                        episode={episode}
                        isOn={episode.id === playingId}
                        isMoving={isPlaying}
                        isOpen={episode.id === openedId}
                        {...(watchedFraction === undefined ? {} : { watchedFraction })}
                        onPoint={() => {
                          pointAt(episode.id);
                        }}
                        onStopPointing={stopPointing}
                        onOpen={() => {
                          stopPointing();
                          setOpenedId(episode.id);
                        }}
                        onChoose={() => {
                          show(false);
                          onSelect(episode);
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PopoverPanel>
  );
};

EpisodeMenu.displayName = 'EpisodeMenu';

export { EpisodeMenu };
