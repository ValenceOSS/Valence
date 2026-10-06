import { Icon } from '@ValenceUI/Icon';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import {
  ArrowUTurnRight as ArrowUTurnRightIcon,
  EyeOff as EyeOffIcon,
  Heart as HeartIcon,
  MoreHorizontal as MoreHorizontalIcon,
} from '@keyline-icons/react';
import { Heart as HeartFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCardOrigin } from '@ValenceScreens/linking/useCardOrigin';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { MediaCard } from '@ValenceUI/MediaCard';
import { ArtCard } from '@ValenceUI/ArtCard';
import { Badge } from '@ValenceUI/Badge';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { liquidSpring } from '@ValenceUI/animations/reveal';
import { hasFinePointer } from '@ValenceUI/hasFinePointer';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { useQuery } from '@tanstack/react-query';
import { isWatchedThrough } from '@ValenceClient/library/isWatchedThrough';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { showSlug } from '@ValenceCore/functions/showSlug';
import { MediaPreview } from '@ValenceScreens/components/MediaPreview/MediaPreview';
import { MediaFacts } from '@ValenceScreens/components/MediaFacts/MediaFacts';
import type { RailCardProps } from './RailCard.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const HOVER_DELAY_MILLISECONDS = 600;

const GROWTH = 1.18;

const MARGIN = 12;

const POSTER_POPOUT_REM = 22;

const GENRE_LIMIT = 3;
type Anchor = { left: number; top: number; width: number };

type Extra = {
  id: string;
  label: string;
  icon: ReactNode;
  isActive?: boolean;
  onChoose: () => void;
};

/**
 * Places an opened card over the one it grew from, so it expands from where the pointer already is
 * rather than appearing somewhere else.
 *
 * @param rect - Where the resting card sits.
 * @returns Where to put the opened one.
 * @param fewest - The narrowest it may be, for a card too narrow to hold a picture that lies flat.
 */
const placeOver = (rect: DOMRect, fewest = 0): Anchor => {
  const width = Math.max(rect.width * GROWTH, fewest);
  const centred = rect.left + rect.width / 2 - width / 2;
  const furthest = window.innerWidth - width - MARGIN;

  return {
    width,
    left: Math.min(Math.max(centred, MARGIN), Math.max(furthest, MARGIN)),
    top: rect.top - (rect.height * (GROWTH - 1)) / 2,
  };
};

/**
 * Moves an opened card back inside the window when expanding it would take it off an edge — the
 * cards at the ends of a row are exactly the ones a pointer reaches first.
 *
 * @param top - Where the card would go.
 * @param height - How much room there is.
 * @returns Where it should actually go.
 */
const fitInside = (top: number, height: number): number => {
  const lowest = window.innerHeight - height - MARGIN;

  return Math.max(Math.min(top, lowest), MARGIN);
};

/**
 * A card in a row that grows when a pointer rests on it, playing a preview and showing what it is
 * with the controls for starting or keeping it. Rests before opening, since a pointer crossing a
 * row should not open every card it passes. Where the opened card is too narrow to hold every control
 * beside the one that plays it, the rest fold into a menu rather than running off its edge.
 *
 * @param media - The item to draw.
 * @param watchedFraction - How far through it this viewer is. A card for a whole programme leaves
 *   its episode's out, and is ticked only once the programme is watched through, every season that
 *   has aired included.
 * @param unwatchedCount - For a card that stands for a programme, how many of its episodes this
 *   viewer has still to watch.
 * @param onPlay - Told to start it, and where from.
 * @param onInspect - Told to open the page about it.
 * @param resumeSeconds - Where they left it.
 * @param hoverDelayMilliseconds - How long a pointer rests before it opens.
 * @param onOpenShow - Told to open the programme an episode belongs to.
 * @param isKept - Whether it is kept.
 * @param onToggleKept - Told to keep it, or stop.
 * @param isSeries - Whether this card stands for a whole programme rather than for the episode that
 *   happens to represent it, in which case the episode's own name and number are not what a reader
 *   is looking at — and pressing it opens the programme rather than that one episode.
 * @param shape - Whether the card stands upright on the film's poster or lies flat on its backdrop.
 *   Either way, what opens over it is the wide preview, grown wide enough to be watched.
 *   A card that stands for a whole programme is always upright, on the programme's poster, whatever
 *   was asked.
 * @param look - Whether it rests as a card with its name and facts beneath, or as the picture alone
 *   with its logo drawn in, a flag for what is new and a bar for how far through it is, as a home
 *   page lays titles out.
 * @param flag - What is new about it, across the picture where it rests as the picture alone.
 */
const RailCard = ({
  media,
  watchedFraction,
  unwatchedCount,
  onPlay,
  onInspect,
  resumeSeconds,
  hoverDelayMilliseconds = HOVER_DELAY_MILLISECONDS,
  onOpenShow,
  isKept = false,
  onToggleKept,
  onHide,
  isSeries = false,
  shape: askedShape = 'wide',
  look = 'card',
  flag,
}: RailCardProps) => {
  const shape = isSeries ? 'poster' : askedShape;

  const inspect = () => {
    if (isSeries && onOpenShow !== undefined) {
      onOpenShow(media);

      return;
    }

    onInspect(media);
  };

  const holderRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const cardOrigin = useCardOrigin();
  const prefersReducedMotion = useReducedMotionConfig();

  const close = useCallback(() => {
    setAnchor(null);
  }, []);

  useEffect(() => {
    if (anchor === null) {
      return;
    }

    window.addEventListener('scroll', close, { capture: true, passive: true });

    return () => {
      window.removeEventListener('scroll', close, { capture: true });
    };
  }, [anchor, close]);

  const named = media.seriesId ?? showSlug(media.seriesTitle ?? '');

  const asked = useQuery({
    ...libraryQueries.detail(media.id),
    enabled: anchor !== null && !isSeries,
  });

  const mayBeSeenThrough = isSeries && unwatchedCount === 0;

  const asking = useQuery({
    ...libraryQueries.show(media.libraryId, named === '' ? null : named),
    enabled: isSeries && (anchor !== null || mayBeSeenThrough),
  });

  const detail = asked.data ?? null;
  const show = asking.data ?? null;
  const isSeenThrough =
    mayBeSeenThrough &&
    show !== null &&
    isWatchedThrough(show, () => true, new Date().toISOString().slice(0, 10));
  const shownFraction = isSeries ? (isSeenThrough ? 1 : undefined) : watchedFraction;

  const told = isSeries ? null : (detail?.metadata.overview ?? null);

  const genres = isSeries ? (show?.genres ?? []) : (detail?.metadata.genres ?? []);

  const panelRef = useRef<HTMLDivElement>(null);
  const isMenuOpenRef = useRef(false);

  const extras: Extra[] = [
    ...(resumeSeconds === undefined
      ? []
      : [
          {
            id: 'again',
            label: say('screens.railCard.startTitleAgain', { title: media.title }),
            icon: <Icon of={ArrowUTurnRightIcon} size={17} />,
            onChoose: () => {
              onPlay(media, 0);
            },
          },
        ]),
    ...(onToggleKept === undefined
      ? []
      : [
          {
            id: 'keep',
            label: isKept
              ? say('common.stopKeepingTitle', { title: media.title })
              : say('common.keepTitle', { title: media.title }),
            icon: <Icon of={HeartIcon} whenActive={HeartFilledIcon} isActive={isKept} size={17} />,
            isActive: isKept,
            onChoose: () => {
              onToggleKept(media);
            },
          },
        ]),
    ...(onHide === undefined
      ? []
      : [
          {
            id: 'hide',
            label: say('screens.railCard.hideTitle', { title: media.title }),
            icon: <Icon of={EyeOffIcon} size={17} />,
            onChoose: () => {
              onHide(media);
            },
          },
        ]),
  ];

  useLayoutEffect(() => {
    const panel = panelRef.current;

    if (anchor === null || panel === null) {
      return;
    }

    const fit = () => {
      const fitted = fitInside(anchor.top, panel.offsetHeight);

      if (Math.abs(fitted - anchor.top) > 1) {
        setAnchor({ ...anchor, top: fitted });
      }
    };

    fit();

    const watcher = new ResizeObserver(fit);

    watcher.observe(panel);

    return () => {
      watcher.disconnect();
    };
  }, [anchor]);

  const open = useCallback(() => {
    const holder = holderRef.current;

    if (holder === null || prefersReducedMotion === true || !hasFinePointer()) {
      return;
    }

    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    setAnchor(
      placeOver(holder.getBoundingClientRect(), shape === 'poster' ? POSTER_POPOUT_REM * rem : 0),
    );
  }, [prefersReducedMotion, shape]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => cancel, [cancel]);

  const wideUrl = media.hasBackdrop
    ? artworkUrl(media.id, 'backdrop', { isOfTitle: isSeries })
    : media.hasPoster
      ? artworkUrl(media.id, 'poster')
      : undefined;

  const restingUrl =
    shape === 'poster' && media.hasPoster
      ? artworkUrl(media.id, 'poster', { size: 'small' })
      : wideUrl;

  return (
    <div
      ref={holderRef}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') {
          return;
        }

        cancel();
        timerRef.current = setTimeout(open, hoverDelayMilliseconds);
      }}
      onPointerLeave={() => {
        cancel();
      }}
    >
      {look === 'art' ? (
        <ArtCard
          title={media.seriesTitle ?? media.title}
          {...(wideUrl === undefined ? {} : { imageUrl: wideUrl })}
          {...(media.hasLogo ? { logoUrl: artworkUrl(media.id, 'logo') } : {})}
          {...(flag === undefined ? {} : { flag })}
          {...(shownFraction === undefined ? {} : { watchedFraction: shownFraction })}
          onSelect={inspect}
          className="w-full"
        />
      ) : (
        <MediaCard
          {...(isSeries || media.seriesTitle === null || media.seriesTitle === undefined
            ? {}
            : { eyebrow: media.title })}
          title={media.seriesTitle ?? media.title}
          subtitle={<MediaFacts media={media} hasEpisode={!isSeries} />}
          shape={shape}
          {...(shownFraction === undefined ? {} : { watchedFraction: shownFraction })}
          {...(unwatchedCount === undefined
            ? {}
            : {
                count: unwatchedCount,
                countLabel: sayCount('common.countEpisodesLeft', unwatchedCount),
              })}
          {...(restingUrl === undefined ? {} : { imageUrl: restingUrl })}
          {...cardOrigin(media.libraryId)}
          onSelect={inspect}
          className="w-full"
        />
      )}

      {createPortal(
        <AnimatePresence>
          {anchor === null ? null : (
            <motion.div
              key={media.id}
              ref={panelRef}
              initial={{ opacity: 0, scale: 1 / GROWTH }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1 / GROWTH }}
              transition={liquidSpring}
              onPointerLeave={() => {
                if (!isMenuOpenRef.current) {
                  close();
                }
              }}
              style={{
                left: anchor.left,
                top: anchor.top,
                width: anchor.width,
              }}
              className="fixed z-40 flex max-h-[calc(100svh_-_1.5rem)] flex-col overflow-hidden rounded-lg valence-float p-1.5"
            >
              <Button
                variant="bare"
                size="none"
                aria-label={say('screens.railCard.moreAboutValue', {
                  value: media.seriesTitle ?? media.title,
                })}
                onClick={inspect}
                className="absolute inset-0 z-0 rounded-lg"
              />

              <div className="pointer-events-none aspect-video max-h-[42svh] w-full shrink-0 overflow-hidden rounded-md">
                <MediaPreview
                  mediaId={media.id}
                  backdropUrl={wideUrl ?? null}
                  durationSeconds={media.durationSeconds}
                  settleMilliseconds={0}
                  fills
                />
              </div>

              <div className="flex min-h-0 w-full flex-1 flex-col gap-3 px-4 pb-4 pt-4 text-left">
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0 text-xs font-medium text-text-muted">
                    {isSeries
                      ? show === null
                        ? null
                        : [
                            show.seasonCount === 1
                              ? null
                              : sayCount('common.count.seasons', show.seasonCount),
                            sayCount('common.count.episodes', show.episodeCount),
                            unwatchedCount === undefined || (unwatchedCount === 0 && !isSeenThrough)
                              ? null
                              : unwatchedCount === 0
                                ? say('screens.railCard.allWatched')
                                : sayCount('screens.railCard.episodesLeft', unwatchedCount),
                          ]
                            .filter((part) => part !== null)
                            .join(' · ')
                      : media.seriesTitle === null || media.seriesTitle === undefined
                        ? null
                        : media.title}
                  </span>
                </span>

                {onOpenShow === undefined ||
                media.seriesTitle === null ||
                media.seriesTitle === undefined ? (
                  <span className="text-xl font-semibold leading-tight tracking-[-0.02em] text-text">
                    {media.seriesTitle ?? media.title}
                  </span>
                ) : (
                  <Button
                    variant="bare"
                    size="none"
                    aria-label={say('screens.railCard.aboutSeriesTitle', {
                      seriesTitle: media.seriesTitle,
                    })}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenShow(media);
                    }}
                    className="relative z-10 self-start text-left text-xl font-semibold leading-tight tracking-[-0.02em] text-text underline-offset-4 hover:underline"
                  >
                    {media.seriesTitle}
                  </Button>
                )}

                <span className="pointer-events-none flex min-h-0 shrink flex-col gap-3 text-left">
                  <MediaFacts
                    media={
                      isSeries && show !== null
                        ? { ...media, rating: show.rating ?? null, year: show.year ?? null }
                        : media
                    }
                    hasEpisode={!isSeries}
                    size="xs"
                    tone="muted"
                  />

                  {told === null || told === '' ? null : (
                    <span className="line-clamp-3 min-h-0 shrink overflow-hidden text-xs leading-relaxed text-text-muted">
                      {told}
                    </span>
                  )}

                  {genres.length === 0 ? null : (
                    <span className="flex shrink-0 flex-wrap gap-1.5">
                      {genres.slice(0, GENRE_LIMIT).map((genre) => (
                        <Badge key={genre} size="sm">
                          {genre}
                        </Badge>
                      ))}
                    </span>
                  )}
                </span>

                <span className="@container relative z-10 flex shrink-0 items-center gap-2 pt-1">
                  <Button
                    variant="confirm"
                    size="md"
                    className="min-w-0 flex-1"
                    onClick={(event) => {
                      event.stopPropagation();
                      onPlay(media, resumeSeconds ?? 0);
                    }}
                  >
                    <Icon of={PlayFilledIcon} size={15} />
                    <span className="truncate">
                      {resumeSeconds === undefined
                        ? say('common.play')
                        : say('screens.railCard.resumeFromResumeSeconds', {
                            resumeSeconds: formatDuration(resumeSeconds),
                          })}
                    </span>
                  </Button>

                  {extras.length <= 1 ? null : (
                    <ActionMenu
                      label={say('screens.railCard.moreToDoWithTitle', { title: media.title })}
                      align="end"
                      look="raised"
                      className="size-9 @sm:hidden"
                      trigger={<Icon of={MoreHorizontalIcon} size={17} />}
                      onOpenChange={(isOpen) => {
                        isMenuOpenRef.current = isOpen;

                        if (!isOpen && panelRef.current?.matches(':hover') !== true) {
                          close();
                        }
                      }}
                      groups={[
                        {
                          items: extras.map((extra) => ({
                            id: extra.id,
                            label: extra.label,
                            icon: extra.icon,
                            onChoose: extra.onChoose,
                          })),
                        },
                      ]}
                    />
                  )}

                  {extras.map((extra) => (
                    <Button
                      key={extra.id}
                      isIconOnly
                      variant="secondary"
                      size="md"
                      label={extra.label}
                      {...(extra.isActive === undefined ? {} : { isActive: extra.isActive })}
                      className={extras.length <= 1 ? '' : 'hidden @sm:inline-flex'}
                      onClick={(event) => {
                        event.stopPropagation();
                        extra.onChoose();
                      }}
                    >
                      {extra.icon}
                    </Button>
                  ))}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};

RailCard.displayName = 'RailCard';

export { RailCard };
