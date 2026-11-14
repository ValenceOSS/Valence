import { cn } from '@ValenceUI/cn';
import { JOINED_LOOKS } from '@ValenceUI/tokens/joinedLooks';
import { ShowStatusBadge } from '@ValenceScreens/components/ShowStatusBadge/ShowStatusBadge';
import { Icon } from '@ValenceUI/Icon';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { titleLogoUrl } from '@ValenceClient/library/titleLogoUrl';
import { TitleLogo } from '@ValenceScreens/components/TitleLogo/TitleLogo';
import {
  ChevronDown as ChevronDownIcon,
  CircleCheck as CircleCheckIcon,
  Download as DownloadIcon,
  Layers as LayersIcon,
  Plus as PlusIcon,
  Share as ShareIcon,
  SquarePlay as SquarePlayIcon,
  X as XIcon,
} from '@keyline-icons/react';
import {
  CircleCheck as CircleCheckFilledIcon,
  Play as PlayFilledIcon,
} from '@keyline-icons/react/fill';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { Dialog } from '@ValenceUI/Dialog';
import { PartOfCollections } from '@ValenceScreens/components/PartOfCollections/PartOfCollections';
import { AddToCollectionDialog } from '@ValenceScreens/components/AddToCollectionDialog/AddToCollectionDialog';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { PluginPanels } from '@ValenceScreens/components/PluginPanels/PluginPanels';
import { DialogContent } from '@ValenceUI/DialogContent';
import { useHasScrolledPast } from '@ValenceUI/useHasScrolledPast';
import { ScrolledTitle } from '@ValenceScreens/components/ScrolledTitle/ScrolledTitle';
import { Badge } from '@ValenceUI/Badge';
import { AgeRating } from '@ValenceUI/AgeRating';
import { showQualityBadges } from '@ValenceClient/library/showQualityBadges';
import { canKeepFiles } from '@ValenceClient/downloads/canKeepFiles';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { waysToDownloadAProgramme } from '@ValenceClient/downloads/waysToDownloadAProgramme';
import { DownloadDialog } from '@ValenceScreens/components/DownloadDialog/DownloadDialog';
import { EmbeddedVideo } from '@ValenceUI/EmbeddedVideo';
import { catalogueTrailerUrl } from '@ValenceScreens/library/catalogueTrailerUrl';
import { Spinner } from '@ValenceUI/Spinner';
import { PlayWithRestart } from '@ValenceScreens/components/PlayWithRestart/PlayWithRestart';
import { PLAY_FACE } from '@ValenceUI/tokens/PLAY_FACE';
import { WatchedBar } from '@ValenceUI/WatchedBar';
import { ArtworkBackButton } from '@ValenceScreens/components/ArtworkBackButton/ArtworkBackButton';
import { ArtworkCloseButton } from '@ValenceScreens/components/ArtworkCloseButton/ArtworkCloseButton';
import { TintedGround } from '@ValenceScreens/components/TintedGround/TintedGround';
import { useArtworkTint } from '@ValenceScreens/library/useArtworkTint';
import { TitleHero } from '@ValenceScreens/components/TitleHero/TitleHero';
import { useShowCopies } from '@ValenceScreens/library/useShowCopies';
import { RoundActions } from '@ValenceScreens/components/RoundActions/RoundActions';
import type { RoundAction } from '@ValenceScreens/components/RoundActions/RoundActions.types';
import { DialogHeadline } from '@ValenceScreens/components/DialogHeadline/DialogHeadline';
import { DialogHeadlinePart } from '@ValenceScreens/components/DialogHeadlinePart/DialogHeadlinePart';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Server as ServerDuotoneIcon } from '@keyline-icons/react/duotone';
import type { ShowCopy } from '@ValenceScreens/library/useShowCopies';
import { useHeldWhileLeaving } from '@ValenceClient/shell/useHeldWhileLeaving';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { MediaPreview } from '@ValenceScreens/components/MediaPreview/MediaPreview';
import { scrollToTopOf } from '@ValenceScreens/navigation/scrollToTopOf';
import { RatingPanel } from '@ValenceScreens/components/RatingPanel/RatingPanel';
import { pickUpFrom } from '@ValenceClient/library/pickUpFrom';
import { SeasonPicker } from './components/SeasonPicker/SeasonPicker';
import { EpisodeRow } from './components/EpisodeRow/EpisodeRow';
import { MissingRow } from './components/MissingRow/MissingRow';
import { RAIL } from '@ValenceUI/tokens/rail';
import { DialogSections } from '@ValenceScreens/components/DialogSections/DialogSections';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { SlidingList } from '@ValenceScreens/components/SlidingList/SlidingList';
import { ChooseEpisodes } from './components/ChooseEpisodes/ChooseEpisodes';
import { isWatchedThrough } from '@ValenceClient/library/isWatchedThrough';
import { laySeasonsOut } from '@ValenceClient/library/laySeasonsOut';
import { describeAirDate } from '@ValenceCore/functions/describeAirDate';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowDialogProps } from './ShowDialog.types';
import { say } from '@ValenceI18n/say';
import { LikeThisShelf } from '@ValenceScreens/components/LikeThisShelf/LikeThisShelf';
import { sayCount } from '@ValenceI18n/sayCount';
import { isShowMissingEpisodes } from '@ValenceClient/library/isShowMissingEpisodes';

/**
 * A programme in full: its seasons, its episodes, where a viewer got to in each, and the episodes
 * the catalogue says exist that this library does not have. Opening it is how somebody decides what
 * to watch next rather than only what to watch now.
 *
 * @param show - The programme, or null while none is open.
 * @param onClose - Told when the dialog was dismissed.
 * @param onBack - Told to go back to whatever opened this.
 * @param backLabel - What going back is called.
 * @param onPlay - Told to start an episode, and where from.
 * @param onInspect - Told to open the page about an episode, or about a film like this programme.
 * @param onOpenShow - Told to open the page of a programme like this one, where that is offered.
 * @param watchedFractionFor - How far through each episode this viewer is.
 * @param resumeFor - Where they left each episode.
 * @param isFinished - Whether they have finished each episode.
 * @param onMarkWatched - Told to mark episodes watched, or unwatched again, one at a time or a
 *   season at once.
 * @param onRate - Told what they gave it, or null to take the rating back. Offered only for a
 *   programme the scanner resolved to a series of its own, since a rating is keyed on that.
 * @param onRequestMore - Told to ask for more of the programme, by its catalogue id, where the
 *   viewer may ask; offered where the catalogue lists aired episodes the library does not hold.
 * @param onAsk - Told to open a title from the catalogue, as its address names it.
 * @param onOpenPerson - Told which performer to open from a missing episode's cast.
 * @param onSwitchCopy - Told to open another server's copy of the programme instead, where more
 *   than one server has it, to watch it from there.
 */
const ShowDialog = ({
  show,
  onClose,
  onBack,
  backLabel,
  onPlay,
  onInspect,
  onOpenShow,
  onShare,
  watchedFractionFor,
  resumeFor,
  isFinished,
  onMarkWatched,
  onRate,
  onRequestMore,
  onAsk,
  onOpenPerson,
  onSwitchCopy,
}: ShowDialogProps) => {
  const [unlettered, setUnlettered] = useState<string | null>(null);
  const [lastShown, setLastShown] = useState(show);
  const [chosenSeason, setChosenSeason] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<{ mediaIds: string[]; episodes: number } | null>(
    null,
  );
  const [isChoosing, setIsChoosing] = useState(false);
  const onThisDevice = new Set(useHeldFiles().map((file) => file.mediaId));
  const [isWatchingTrailer, setIsWatchingTrailer] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const { may } = useWhatIMayDo();
  const topRef = useRef<HTMLDivElement>(null);
  const { mark: pastTheArtwork, hasPassed: hasScrolledPast } = useHasScrolledPast();
  const prefersReducedMotion = useReducedMotionConfig();
  const tint = useArtworkTint(
    show === null
      ? null
      : artworkUrl(show.coverMediaId, 'backdrop', { isOfTitle: true, size: 'small' }),
  );

  const asked = useQuery(libraryQueries.show(show?.libraryId ?? null, show?.id ?? null));
  const copies = useShowCopies(show);
  const cache = useQueryClient();
  const detail = useHeldWhileLeaving(asked.data ?? null, show !== null);
  const isLoading = show !== null && asked.isPending;
  const trailer = (detail?.extras ?? []).find((one) => one.extraKind === 'trailer') ?? null;
  const trailerKey = trailer === null ? (detail?.trailerKey ?? null) : null;
  const hasTrailer = trailer !== null || trailerKey !== null;

  const carryOnRef = useRef({ resumeFor, isFinished });
  const seasonPickedFor = useRef<string | null>(null);

  useEffect(() => {
    carryOnRef.current = { resumeFor, isFinished };
  });

  useEffect(() => {
    if (show === null) {
      seasonPickedFor.current = null;

      return;
    }

    setLastShown(show);

    const returning = requestAnimationFrame(() => {
      scrollToTopOf(topRef.current, prefersReducedMotion !== true);
    });

    return () => {
      cancelAnimationFrame(returning);
    };
  }, [show, prefersReducedMotion]);

  useEffect(() => {
    if (detail === null || seasonPickedFor.current === detail.id) {
      return;
    }

    seasonPickedFor.current = detail.id;
    setChosenSeason(pickUpFrom(detail, carryOnRef.current)?.episode.seasonNumber ?? null);
  }, [detail]);

  const shown = show ?? lastShown;

  if (shown === null) {
    return null;
  }

  const seasons = detail?.seasons ?? [];

  const lettered =
    seasons.flatMap((one) => one.episodes).find((episode) => episode.hasLogo) ?? null;
  const carryingOn = detail === null ? null : pickUpFrom(detail, { resumeFor, isFinished });
  const today = new Date().toISOString().slice(0, 10);
  const laidOut =
    detail === null
      ? { choices: [], showing: null, rows: [] }
      : laySeasonsOut(detail, chosenSeason, today);
  const chooseFrom = laidOut.choices;

  /**
   * Opens the download dialog on the episodes wanted, leaving out what this device already has.
   *
   * @param mediaIds - The episodes wanted.
   */
  const download = (mediaIds: readonly string[]) => {
    const wanted = mediaIds.filter((id) => !onThisDevice.has(id));

    if (wanted.length > 0) {
      setDownloading({ mediaIds: wanted, episodes: wanted.length });
    }
  };
  const { showing } = laidOut;
  const inOrder = laidOut.rows;
  const shownEpisodes = inOrder.flatMap(({ episode }) => (episode === null ? [] : [episode]));
  const isSeasonWatched =
    shownEpisodes.length > 0 && shownEpisodes.every((episode) => isFinished?.(episode.id) === true);

  const isSeenThrough =
    watchedFractionFor !== undefined &&
    detail !== null &&
    isWatchedThrough(detail, (mediaId) => (watchedFractionFor(mediaId) ?? 0) >= 1, today);

  const showWatched =
    carryingOn === null || !carryingOn.isResuming || carryingOn.episode.durationSeconds <= 0
      ? null
      : carryingOn.startSeconds / carryingOn.episode.durationSeconds;

  const playFace =
    carryingOn === null ? null : (
      <>
        <Icon of={PlayFilledIcon} size={18} />
        {carryingOn.isResuming
          ? say('screens.showDialog.resumeStartSeconds', {
              startSeconds: formatDuration(carryingOn.startSeconds),
            })
          : say('screens.showDialog.playValueEpisodeValue2', {
              value: nameSeason(carryingOn.episode.seasonNumber ?? null),
              value2: (carryingOn.episode.episodeNumber ?? 1).toString(),
            })}
        {showWatched === null ? null : (
          <WatchedBar
            watched={showWatched}
            className="mx-0 w-10 shrink-0 rounded-[2px] bg-on-white/20 [&>span]:rounded-[2px] [&>span]:bg-on-white"
          />
        )}
      </>
    );

  /**
   * Plays the programme from one of its copies: the episode to carry on from there, read from that
   * copy, with the dialog moved onto it so its episodes are the ones shown.
   *
   * @param copy - The copy to play from.
   */
  const playFrom = async (copy: ShowCopy) => {
    if (copy.show.id === shown.id) {
      if (carryingOn !== null) {
        onPlay(carryingOn.episode, carryingOn.startSeconds);
      }

      return;
    }

    onSwitchCopy?.(copy.show);

    const there = await cache.fetchQuery(libraryQueries.show(copy.show.libraryId, copy.show.id));
    const next = there === null ? null : pickUpFrom(there, { resumeFor, isFinished });

    if (next !== null) {
      onPlay(next.episode, next.startSeconds);
    }
  };

  const play =
    carryingOn === null ? (
      <PlayWithRestart>
        <Button variant="confirm" size="none" className={PLAY_FACE} isLoading disabled>
          {say('screens.showDialog.readingTheEpisodes')}
        </Button>
      </PlayWithRestart>
    ) : copies.length > 1 && onSwitchCopy !== undefined ? (
      <ActionMenu
        label={say('common.playFrom')}
        align="start"
        look="play"
        trigger={
          <>
            {playFace}
            <Icon of={ChevronDownIcon} size={16} />
          </>
        }
        groups={[
          {
            name: say('common.playFrom'),
            items: copies.map((copy) => ({
              id: copy.show.id,
              label: copy.server ?? say('common.thisServer'),
              icon: <Icon of={ServerDuotoneIcon} size={18} />,
              detail: sayCount('common.count.episodes', copy.show.episodeCount),
              onChoose: () => {
                void playFrom(copy);
              },
            })),
          },
        ]}
      />
    ) : (
      <PlayWithRestart
        {...(carryingOn.isResuming
          ? {
              onStartAgain: () => {
                onPlay(carryingOn.episode, 0);
              },
            }
          : {})}
      >
        <Button
          variant="confirm"
          size="none"
          className={PLAY_FACE}
          onClick={() => {
            onPlay(carryingOn.episode, carryingOn.startSeconds);
          }}
        >
          {playFace}
        </Button>
      </PlayWithRestart>
    );

  const actions: RoundAction[] = [
    ...(!hasTrailer
      ? []
      : [
          {
            id: 'trailer',
            isPinned: true,
            label: say('common.watchTheTrailer'),
            icon: <Icon of={SquarePlayIcon} size={18} />,
            onChoose: () => {
              if (trailer === null) {
                setIsWatchingTrailer(true);

                return;
              }

              onPlay(trailer, 0);
            },
          },
        ]),
    ...(!canKeepFiles() || (shown.seriesId ?? null) === null || detail === null
      ? []
      : [
          {
            id: 'download',
            isPinned: true,
            label: say('common.download'),
            icon: <Icon of={DownloadIcon} size={18} />,
            onChoose: () => {
              setIsChoosing(true);
            },
            choices: waysToDownloadAProgramme(detail, showing).map((way) => ({
              id: way.label,
              label: way.label,
              onChoose: () => {
                if (way.kind === 'choose') {
                  setIsChoosing(true);

                  return;
                }

                download(
                  way.mediaIds ??
                    detail.seasons.flatMap((one) => one.episodes.map((episode) => episode.id)),
                );
              },
            })),
          },
        ]),
    ...(!may('library.edit') || (shown.seriesId ?? null) === null
      ? []
      : [
          {
            id: 'collection',
            label: say('common.addToACollection'),
            icon: <Icon of={LayersIcon} size={18} />,
            onChoose: () => {
              setIsCollecting(true);
            },
          },
        ]),
    ...(onRequestMore === undefined ||
    detail === null ||
    (detail.tmdbId ?? null) === null ||
    !isShowMissingEpisodes(detail, new Date().toISOString().slice(0, 10))
      ? []
      : [
          {
            id: 'request-more',
            isPinned: true,
            label: say('common.requestMore'),
            icon: <Icon of={PlusIcon} size={18} />,
            onChoose: () => {
              onRequestMore(detail.tmdbId ?? 0);
            },
          },
        ]),
    ...(onShare === undefined || (shown.seriesId ?? null) === null
      ? []
      : [
          {
            id: 'share',
            isPinned: true,
            label: say('common.share'),
            icon: <Icon of={ShareIcon} size={18} />,
            onChoose: () => {
              onShare(shown);
            },
          },
        ]),
  ];

  return (
    <Dialog label={shown.title} isOpen={show !== null} onClose={onClose} size="stage" edge={tint}>
      <DialogContent className="p-3 sm:p-4">
        <ScrolledTitle
          title={shown.title}
          artwork={artworkUrl(shown.coverMediaId, 'backdrop', { isOfTitle: true })}
          detail={
            <>
              {sayCount('common.count.episodes', shown.episodeCount)}
              {detail?.status === undefined ||
              detail.status === null ||
              detail.status === '' ? null : (
                <ShowStatusBadge status={detail.status} />
              )}
            </>
          }
          isShowing={hasScrolledPast}
          tint={tint}
        >
          <Button
            isIconOnly
            variant="confirm"
            size="sm"
            label={say('common.close')}
            onClick={onClose}
          >
            <Icon of={XIcon} size={16} />
          </Button>
        </ScrolledTitle>

        <TintedGround tint={tint}>
          <TitleHero
            ref={topRef}
            preview={
              <MediaPreview
                mediaId={shown.coverMediaId}
                backdropUrl={artworkUrl(shown.coverMediaId, 'backdrop', { isOfTitle: true })}
                durationSeconds={0}
                controlsAtTop
                closing={
                  onBack === undefined ? (
                    <ArtworkCloseButton onClose={onClose} />
                  ) : (
                    <ArtworkBackButton
                      label={
                        backLabel === undefined
                          ? say('common.back')
                          : say('common.backToName', { name: backLabel })
                      }
                      onBack={onBack}
                    />
                  )
                }
                isRoomy
                fills
              />
            }
          >
            <DialogHeadline className="flex flex-col items-start gap-8">
              <DialogHeadlinePart
                as="h2"
                isTitle
                className={
                  lettered === null || unlettered === lettered.id
                    ? 'max-w-[18ch] text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-on-scrim'
                    : 'flex'
                }
              >
                {lettered === null || unlettered === lettered.id ? (
                  shown.title
                ) : (
                  <TitleLogo
                    src={titleLogoUrl(lettered.id)}
                    alt={shown.title}
                    className="max-h-[20svh] w-auto max-w-[min(70vw,30rem)] object-contain object-left"
                    onError={() => {
                      setUnlettered(lettered.id);
                    }}
                  />
                )}
              </DialogHeadlinePart>

              <DialogHeadlinePart className="flex w-full flex-wrap items-center gap-3">
                <div className="w-full md:w-[21rem]">{play}</div>

                <RoundActions
                  label={say('screens.bookDialog.moreToDoWithThisBook')}
                  actions={actions}
                  isCompact
                  className="md:ms-auto"
                />
              </DialogHeadlinePart>
            </DialogHeadline>
          </TitleHero>

          <span ref={pastTheArtwork} aria-hidden className="block h-px" />

          <DialogHeadline className="grid gap-x-12 gap-y-5 px-1 pt-2 sm:px-2 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
            <div className="flex min-w-0 flex-col gap-4">
              <DialogHeadlinePart className="flex flex-wrap items-center gap-3">
                <span className="text-base text-text-muted">
                  {shown.seasonCount === 1
                    ? sayCount('common.count.episodes', shown.episodeCount)
                    : [
                        sayCount('common.count.seasons', shown.seasonCount),
                        sayCount('common.count.episodes', shown.episodeCount),
                      ].join(' · ')}
                </span>

                {detail === null ||
                detail.certification === null ||
                detail.certification === undefined ||
                detail.certification === '' ? null : (
                  <AgeRating
                    certification={detail.certification}
                    region={detail.certificationRegion ?? ''}
                  />
                )}

                {showQualityBadges(
                  (detail?.seasons ?? []).flatMap((season) => season.episodes),
                ).map((badge) => (
                  <Badge
                    key={badge.label}
                    tone="outline"
                    className={
                      badge.isMixed
                        ? 'bg-highlight/30 font-bold text-highlight'
                        : 'bg-text/30 font-bold text-text'
                    }
                  >
                    {badge.isMixed && !badge.label.includes(' / ')
                      ? say('screens.showDialog.onSomeEpisodes', { label: badge.label })
                      : badge.label}
                  </Badge>
                ))}

                {isSeenThrough ? (
                  <Badge tone="success" size="sm">
                    {say('common.watched')}
                  </Badge>
                ) : null}

                {detail?.status === undefined ||
                detail.status === null ||
                detail.status === '' ? null : (
                  <ShowStatusBadge
                    status={detail.status}
                    className="border border-current/60 bg-current/30 font-bold backdrop-blur-none"
                  />
                )}
              </DialogHeadlinePart>

              {detail?.nextEpisode === undefined || detail.nextEpisode === null ? null : (
                <DialogHeadlinePart className="text-sm text-text-muted">
                  {say('common.nextSSeasonNumberEEpisodeNumberAirDate', {
                    seasonNumber: detail.nextEpisode.seasonNumber.toString(),
                    episodeNumber: detail.nextEpisode.episodeNumber.toString(),
                    airDate: describeAirDate(detail.nextEpisode.airDate, today),
                  })}
                </DialogHeadlinePart>
              )}

              {(detail?.overview ?? '') === '' ? null : (
                <DialogHeadlinePart>
                  <p className="max-w-[65ch] text-base leading-relaxed text-text">
                    {detail?.overview}
                  </p>
                </DialogHeadlinePart>
              )}
            </div>

            <DialogHeadlinePart className="flex flex-col gap-4 text-sm leading-relaxed">
              {(shown.genres ?? []).length === 0 ? null : (
                <p>
                  <span className="text-text-muted">{say('common.genres')}: </span>
                  <span className="text-text">{(shown.genres ?? []).slice(0, 3).join(', ')}</span>
                </p>
              )}

              {onRate === undefined || (shown.seriesId ?? null) === null ? null : (
                <RatingPanel
                  subject={{ seriesId: shown.seriesId ?? '' }}
                  title={shown.title}
                  isBare
                  onRate={(given) => {
                    onRate(shown, given);
                  }}
                />
              )}
            </DialogHeadlinePart>
          </DialogHeadline>

          <DialogSections isOpen className="flex flex-col gap-10 px-1 pb-8 pt-10 sm:px-2">
            <DialogSection>
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h3 className={RAIL.title}>{say('common.episodes')}</h3>

                {(onMarkWatched === undefined || shownEpisodes.length === 0) &&
                chooseFrom.length < 2 ? null : (
                  <span className={JOINED_LOOKS.track}>
                    {onMarkWatched === undefined || shownEpisodes.length === 0 ? null : (
                      <Button
                        variant="bare"
                        size="none"
                        className={cn(JOINED_LOOKS.segment, 'inline-flex items-center')}
                        onClick={() => {
                          onMarkWatched(shownEpisodes, !isSeasonWatched);
                        }}
                      >
                        <Icon
                          of={isSeasonWatched ? CircleCheckFilledIcon : CircleCheckIcon}
                          size={15}
                        />
                        {isSeasonWatched
                          ? chooseFrom.length < 2
                            ? say('screens.showDialog.markAllUnwatched')
                            : say('common.markSeasonUnwatched')
                          : chooseFrom.length < 2
                            ? say('screens.showDialog.markAllWatched')
                            : say('common.markSeasonWatched')}
                      </Button>
                    )}

                    {chooseFrom.length < 2 ? null : (
                      <SeasonPicker
                        seasons={chooseFrom}
                        value={showing}
                        onChange={setChosenSeason}
                      />
                    )}
                  </span>
                )}
              </header>

              {show !== null && asked.isError ? (
                <CouldNotRead
                  said={say('screens.showDialog.theEpisodesCouldNotBeRead')}
                  isTryingAgain={asked.isFetching}
                  onTryAgain={() => {
                    void asked.refetch();
                  }}
                />
              ) : isLoading ? (
                <Spinner
                  isCentered
                  label={say('screens.showDialog.readingTheEpisodes')}
                  size="sm"
                />
              ) : inOrder.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {say('screens.showDialog.nothingHereYetEpisodesAppearAs')}
                </p>
              ) : (
                <SlidingList
                  label={say('common.episodes')}
                  items={inOrder}
                  keyOf={(row) => row.key}
                  renderItem={({ at, episode, listed, airs }) =>
                    episode === null ? (
                      <MissingRow
                        showTitle={shown.title}
                        seasonNumber={chosenSeason ?? laidOut.choices[0]?.seasonNumber ?? null}
                        logoMediaId={lettered?.id ?? null}
                        castMediaId={shownEpisodes[0]?.id ?? shown.coverMediaId}
                        genres={shown.genres ?? []}
                        {...(onOpenPerson === undefined ? {} : { onOpenPerson })}
                        episodeNumber={at}
                        {...(airs === '' ? {} : { airs })}
                        {...(listed === null ? {} : { title: listed.title })}
                        {...(listed?.stillUrl === null || listed?.stillUrl === undefined
                          ? {}
                          : { stillUrl: listed.stillUrl })}
                        {...(listed === null ? {} : { overview: listed.overview ?? null })}
                        {...(onRequestMore === undefined ||
                        detail === null ||
                        (detail.tmdbId ?? null) === null
                          ? {}
                          : {
                              onRequest: () => {
                                onRequestMore(detail.tmdbId ?? 0);
                              },
                            })}
                      />
                    ) : (
                      <EpisodeRow
                        episode={episode}
                        onPlay={onPlay}
                        {...(airs === '' ? {} : { airs })}
                        {...(onInspect === undefined ? {} : { onInspect })}
                        {...(onMarkWatched === undefined
                          ? {}
                          : {
                              onMarkWatched: (one: MediaSummary, isWatched: boolean) => {
                                onMarkWatched([one], isWatched);
                              },
                            })}
                        {...(watchedFractionFor?.(episode.id) === undefined
                          ? {}
                          : { watchedFraction: watchedFractionFor(episode.id) ?? 0 })}
                        {...(resumeFor === undefined || resumeFor(episode.id) === null
                          ? {}
                          : { resumeSeconds: Math.floor(resumeFor(episode.id) ?? 0) })}
                      />
                    )
                  }
                />
              )}
            </DialogSection>

            <PartOfCollections
              subject={
                show === null || (shown.seriesId ?? null) === null
                  ? null
                  : { seriesId: shown.seriesId ?? '' }
              }
            />

            {onInspect === undefined || onOpenShow === undefined ? null : (
              <LikeThisShelf
                mediaId={show === null ? null : shown.coverMediaId}
                kind="series"
                externalId={
                  detail?.tmdbId === undefined || detail.tmdbId === null
                    ? null
                    : detail.tmdbId.toString()
                }
                {...(onAsk === undefined ? {} : { onAsk })}
                onPlay={onPlay}
                onInspect={onInspect}
                onOpenShow={onOpenShow}
              />
            )}

            {(shown.seriesId ?? null) === null ? null : (
              <PluginPanels on="series" subjectId={shown.seriesId ?? ''} />
            )}
          </DialogSections>
        </TintedGround>
      </DialogContent>

      <DownloadDialog
        series={
          downloading !== null && (shown.seriesId ?? null) !== null
            ? {
                id: shown.seriesId ?? '',
                title: shown.title,
                episodes: downloading.episodes,
                mediaIds: downloading.mediaIds,
              }
            : null
        }
        media={null}
        onClose={() => {
          setDownloading(null);
        }}
      />

      <AddToCollectionDialog
        subject={
          isCollecting && show !== null && (shown.seriesId ?? null) !== null
            ? { seriesId: shown.seriesId ?? '' }
            : null
        }
        title={shown.title}
        onClose={() => {
          setIsCollecting(false);
        }}
      />

      <ChooseEpisodes
        isOpen={isChoosing}
        title={shown.title}
        seasons={seasons}
        held={onThisDevice}
        onClose={() => {
          setIsChoosing(false);
        }}
        onChosen={(mediaIds) => {
          setIsChoosing(false);
          download(mediaIds);
        }}
      />

      <Dialog
        label={say('common.titleTheTrailer', { title: shown.title })}
        isOpen={isWatchingTrailer && trailerKey !== null}
        className="sm:w-[min(64rem,94vw)]"
        onClose={() => {
          setIsWatchingTrailer(false);
        }}
      >
        <DialogContent className="p-0">
          {trailerKey === null ? null : (
            <EmbeddedVideo
              label={say('common.titleTheTrailer', { title: shown.title })}
              src={catalogueTrailerUrl(trailerKey)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

ShowDialog.displayName = 'ShowDialog';

export { ShowDialog };
