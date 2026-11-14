import { Icon } from '@ValenceUI/Icon';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { Link } from '@ValenceUI/Link';
import { useHrefOf } from '@ValenceScreens/navigation/useHrefOf';
import { NOTHING_OPEN } from '@ValenceScreens/navigation/NOTHING_OPEN';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { titleLogoUrl } from '@ValenceClient/library/titleLogoUrl';
import { TitleLogo } from '@ValenceScreens/components/TitleLogo/TitleLogo';
import {
  ChevronDown as ChevronDownIcon,
  CircleCheck as CircleCheckIcon,
  Download as DownloadIcon,
  EyeOff as EyeOffIcon,
  Info as InfoIcon,
  Layers as LayersIcon,
  Share as ShareIcon,
  SquarePlay as SquarePlayIcon,
  Tv as TvIcon,
  UserCheck as UserCheckIcon,
  Users as UsersIcon,
  X as XIcon,
} from '@keyline-icons/react';
import {
  CircleCheck as CircleCheckFilledIcon,
  Play as PlayFilledIcon,
} from '@keyline-icons/react/fill';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { SplitButton } from '@ValenceUI/SplitButton';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Server as ServerDuotoneIcon } from '@keyline-icons/react/duotone';
import { describePicture } from '@ValenceClient/library/describePicture';
import { useFilmCopies } from '@ValenceScreens/library/useFilmCopies';
import { useCardOrigin } from '@ValenceScreens/linking/useCardOrigin';
import { OriginMark } from '@ValenceUI/OriginMark';
import { canKeepFiles } from '@ValenceClient/downloads/canKeepFiles';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { Spinner } from '@ValenceUI/Spinner';
import { DownloadDialog } from '@ValenceScreens/components/DownloadDialog/DownloadDialog';
import { useHasScrolledPast } from '@ValenceUI/useHasScrolledPast';
import { ScrolledTitle } from '@ValenceScreens/components/ScrolledTitle/ScrolledTitle';
import { Skeleton } from '@ValenceUI/Skeleton';
import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
import { PlayWithRestart } from '@ValenceScreens/components/PlayWithRestart/PlayWithRestart';
import { PLAY_FACE } from '@ValenceUI/tokens/PLAY_FACE';
import { WatchedBar } from '@ValenceUI/WatchedBar';
import { ArtworkCloseButton } from '@ValenceScreens/components/ArtworkCloseButton/ArtworkCloseButton';
import { TintedGround } from '@ValenceScreens/components/TintedGround/TintedGround';
import { useArtworkTint } from '@ValenceScreens/library/useArtworkTint';
import { ArtworkBackButton } from '@ValenceScreens/components/ArtworkBackButton/ArtworkBackButton';
import { TitleHero } from '@ValenceScreens/components/TitleHero/TitleHero';
import { RoundActions } from '@ValenceScreens/components/RoundActions/RoundActions';
import type { RoundAction } from '@ValenceScreens/components/RoundActions/RoundActions.types';
import { DialogArrival } from '@ValenceScreens/components/DialogArrival/DialogArrival';
import { DialogSections } from '@ValenceScreens/components/DialogSections/DialogSections';
import { DialogHeadline } from '@ValenceScreens/components/DialogHeadline/DialogHeadline';
import { DialogHeadlinePart } from '@ValenceScreens/components/DialogHeadlinePart/DialogHeadlinePart';
import { editionOptionsOf } from '@ValenceClient/library/editionOptionsOf';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { useQuery } from '@tanstack/react-query';
import { useHeldWhileLeaving } from '@ValenceClient/shell/useHeldWhileLeaving';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { MediaPreview } from '@ValenceScreens/components/MediaPreview/MediaPreview';
import { MediaFacts } from '@ValenceScreens/components/MediaFacts/MediaFacts';
import { TitleBadges } from '@ValenceScreens/components/TitleBadges/TitleBadges';
import { PluginPanels } from '@ValenceScreens/components/PluginPanels/PluginPanels';
import { scrollToTopOf } from '@ValenceScreens/navigation/scrollToTopOf';
import { TitleDetails } from '@ValenceScreens/components/TitleDetails/TitleDetails';
import { RatingPanel } from '@ValenceScreens/components/RatingPanel/RatingPanel';
import { EmbeddedVideo } from '@ValenceUI/EmbeddedVideo';
import { catalogueTrailerUrl } from '@ValenceScreens/library/catalogueTrailerUrl';
import { CastGrid } from '@ValenceScreens/components/CastGrid/CastGrid';
import { EXTRA_KIND_LABELS } from '@ValenceContracts/schemas/Library';
import { KeepHeart } from '@ValenceScreens/components/KeepHeart/KeepHeart';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { SeasonMate } from '@ValenceScreens/components/SeasonMate/SeasonMate';
import { PartOfCollections } from '@ValenceScreens/components/PartOfCollections/PartOfCollections';
import { AddToCollectionDialog } from '@ValenceScreens/components/AddToCollectionDialog/AddToCollectionDialog';
import { subjectOfMedia } from '@ValenceClient/collections/subjectOfMedia';
import { Callout } from '@ValenceUI/Callout';
import { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import { usePreferredCopy } from '@ValenceClient/linking/usePreferredCopy';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MediaDetailDialogProps } from './MediaDetailDialog.types';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayingAll } from '@ValenceI18n/sayingAll';
import { LikeThisShelf } from '@ValenceScreens/components/LikeThisShelf/LikeThisShelf';

const CAST_PLACEHOLDERS = 5;

const LOGO_BOX = 'max-h-[20svh] w-auto max-w-[min(70vw,30rem)] object-contain object-left';

/**
 * Everything known about one item, for deciding whether to watch it: what it is about, who is in it,
 * how it was made, and where this viewer left it. Offers both carrying on and starting again, since
 * those are different intentions and only one of them can be the default.
 *
 * @param media - The item, or null while none is open.
 * @param onClose - Told when the dialog was dismissed.
 * @param onPlay - Told to start it, and where from.
 * @param resumeSeconds - Where this viewer left it.
 * @param watchedFractionFor - How far through each sibling they are.
 * @param siblings - The other episodes of the same season.
 * @param onSelectSibling - Told which sibling was chosen.
 * @param onInspect - Told to open the page of a film like this one, where that is offered.
 * @param onOpenShow - Told to open the page of a programme like this one, where that is offered.
 * @param onBack - Told to go back to whatever opened this.
 * @param backLabel - What going back is called.
 * @param onAsk - Told to open a title from the catalogue, as its address names it.
 * @param isKept - Whether it is kept.
 * @param onToggleKept - Told to keep it, or stop.
 * @param isWatched - Whether this viewer has watched it through.
 * @param onMarkWatched - Told to record it as watched, or to take that back.
 * @param onRate - Told what they gave it, or null to take the rating back.
 * @param onOpenPerson - Told which performer to open from the cast, where opening one is offered.
 * @param onShare - Told to hand out a link to it, where this account may share at all.
 * @param onStartParty - Told to open a watch party on it, where this account may hold one.
 * @param onPlayOn - Told to play it on one of this person's televisions instead, from where they
 *   had got to, where one is open.
 */
const MediaDetailDialog = ({
  media,
  onClose,
  onPlay,
  resumeSeconds,
  watchedFractionFor,
  siblings = [],
  onSelectSibling,
  onInspect,
  onOpenShow,
  onBack,
  backLabel,
  onAsk,
  isKept = false,
  onToggleKept,
  isWatched = false,
  onMarkWatched,
  onRate,
  onOpenPerson,
  onShare,
  onHide,
  onDecideForSomebody,
  onStartParty,
  onPlayOn,
}: MediaDetailDialogProps) => {
  const hrefOf = useHrefOf();
  const asked = useQuery(libraryQueries.detail(media?.id ?? null));
  const detail = useHeldWhileLeaving(asked.data ?? null, media !== null);
  const isLoading = media !== null && asked.isPending;

  const [unlettered, setUnlettered] = useState<string | null>(null);
  const [lastShown, setLastShown] = useState<MediaSummary | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const { mark: pastTheArtwork, hasPassed: hasScrolledPast } = useHasScrolledPast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isWatchingTrailer, setIsWatchingTrailer] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const { may } = useWhatIMayDo();

  const tint = useArtworkTint(
    media !== null && media.hasBackdrop
      ? artworkUrl(media.id, 'backdrop', { size: 'small' })
      : null,
  );

  const prepared = useQuery({ ...downloadQueries.all(), enabled: canKeepFiles() });

  const prefersReducedMotion = useReducedMotionConfig();

  useEffect(() => {
    if (media === null) {
      return;
    }

    setLastShown(media);
    setUnlettered(null);
    setVersion(null);

    const returning = requestAnimationFrame(() => {
      scrollToTopOf(topRef.current, prefersReducedMotion !== true);
    });

    return () => {
      cancelAnimationFrame(returning);
    };
  }, [media, prefersReducedMotion]);

  const siblingKey = siblings.map((sibling) => sibling.id).join(',');
  const shown = media ?? lastShown;
  const isAFilm =
    shown !== null &&
    shown.seriesId === null &&
    (shown.seriesTitle ?? null) === null &&
    (shown.extraKind ?? null) === null;
  const isLettered = shown?.hasLogo === true && unlettered !== shown.id;

  const preparing = (prepared.data ?? []).find(
    (one) => one.mediaId === shown?.id && one.state !== 'ready' && one.state !== 'failed',
  );

  const percent = `${Math.round((preparing?.progress ?? 0) * 100).toString()}%`;
  const shownResume = useHeldWhileLeaving(resumeSeconds, media !== null);
  const shownSiblings = useHeldWhileLeaving(siblings, media !== null, siblingKey);
  const originOf = useOriginOf();
  const extras = detail?.extras ?? [];
  const trailer = extras.find((one) => one.extraKind === 'trailer') ?? null;
  const trailerKey = trailer === null ? (detail?.trailerKey ?? null) : null;
  const hasTrailer = trailer !== null || trailerKey !== null;
  const versions = detail?.versions ?? [];
  const filmCopies = useFilmCopies(media === null ? null : shown);
  const cardOrigin = useCardOrigin();
  const [firstServer = '', ...otherServers] = filmCopies.map(
    (copy) => copy.server ?? say('common.thisServer'),
  );
  const preferred = usePreferredCopy(shown, versions);
  const chosenVersion = versions.find((one) => one.id === (version ?? preferred)) ?? null;
  const isTheSameTitle = chosenVersion !== null && originOf(chosenVersion.libraryId) !== null;

  if (shown === null) {
    return null;
  }

  const metadata = detail?.metadata ?? null;
  const origin = originOf(shown.libraryId);
  const alsoOn = [
    ...new Set(
      versions.flatMap((one) => {
        const elsewhere = originOf(one.libraryId);

        return elsewhere === null ? [] : [elsewhere.name];
      }),
    ),
  ];
  const fromMarks = (
    filmCopies.length > 1
      ? filmCopies.map((copy) => copy.media.libraryId)
      : [shown.libraryId, ...versions.map((one) => one.libraryId)]
  )
    .flatMap((libraryId) => {
      const { origin: mark } = cardOrigin(libraryId);

      return mark === undefined ? [] : [mark];
    })
    .filter((mark, at, every) => every.findIndex((other) => other.label === mark.label) === at);
  const season = metadata?.seasonNumber ?? null;
  const genres = metadata?.genres ?? [];
  const cast = metadata?.cast ?? [];
  const overview =
    typeof metadata?.overview === 'string' && metadata.overview !== '' ? metadata.overview : null;

  const startsFrom = chosenVersion === null || isTheSameTitle ? (shownResume ?? 0) : 0;
  const playSays =
    chosenVersion !== null
      ? chosenVersion.versionLabel === null || chosenVersion.versionLabel === undefined
        ? say('screens.mediaDetailDialog.playThisEdition')
        : say('common.playName', { name: chosenVersion.versionLabel })
      : shownResume === undefined
        ? say('common.play')
        : say('screens.mediaDetailDialog.resumeFromShownResume', {
            shownResume: formatDuration(shownResume),
          });

  const watchedShare =
    shownResume === undefined || shown.durationSeconds <= 0
      ? null
      : shownResume / shown.durationSeconds;
  const playFaceOf = (
    <>
      <Icon of={PlayFilledIcon} size={18} />
      {playSays}
      {watchedShare === null ? null : (
        <WatchedBar
          watched={watchedShare}
          className="mx-0 w-10 shrink-0 rounded-[2px] bg-on-white/20 [&>span]:rounded-[2px] [&>span]:bg-on-white"
        />
      )}
    </>
  );

  const play = (
    <PlayWithRestart
      {...(shownResume === undefined
        ? {}
        : {
            onStartAgain: () => {
              onPlay(chosenVersion ?? shown, 0);
            },
          })}
    >
      {filmCopies.length > 1 ? (
        <ActionMenu
          label={say('common.playFrom')}
          align="start"
          look="play"
          trigger={
            <>
              {playFaceOf}
              <Icon of={ChevronDownIcon} size={16} />
            </>
          }
          groups={[
            {
              name: say('common.playFrom'),
              items: filmCopies.map((copy) => ({
                id: copy.media.id,
                label: copy.server ?? say('common.thisServer'),
                icon: <Icon of={ServerDuotoneIcon} size={18} />,
                detail: [describePicture(copy.media), formatDuration(copy.media.durationSeconds)]
                  .filter((part) => part !== null)
                  .join(' · '),
                onChoose: () => {
                  onPlay(copy.media, copy.media.id === shown.id ? (shownResume ?? 0) : 0);
                },
              })),
            },
          ]}
        />
      ) : versions.length === 0 ? (
        <Button
          variant="confirm"
          size="none"
          className={PLAY_FACE}
          onClick={() => {
            onPlay(shown, shownResume ?? 0);
          }}
        >
          {playFaceOf}
        </Button>
      ) : (
        <SplitButton
          size="lg"
          choiceLabel={say('screens.mediaDetailDialog.whichEditionToPlay')}
          choiceName={say('screens.mediaDetailDialog.editions')}
          onClick={() => {
            onPlay(chosenVersion ?? shown, startsFrom);
          }}
          options={editionOptionsOf(shown, detail?.versionLabel ?? null, versions)}
          selectedId={chosenVersion?.id ?? shown.id}
          onSelect={(id) => {
            setVersion(id === shown.id ? null : id);
          }}
        >
          {playFaceOf}
        </SplitButton>
      )}
    </PlayWithRestart>
  );

  const actions: RoundAction[] = [
    ...(onToggleKept === undefined
      ? []
      : [
          {
            id: 'favourite',
            label: isKept ? say('screens.bookDialog.stopKeeping') : say('screens.bookDialog.keep'),
            isChosen: isKept,
            icon: <KeepHeart isKept={isKept} size={20} />,
            onChoose: () => {
              onToggleKept(shown);
            },
          },
        ]),
    ...(onMarkWatched === undefined
      ? []
      : [
          {
            id: 'watched',
            label: isWatched ? say('common.markAsUnwatched') : say('common.markAsWatched'),
            isChosen: isWatched,
            icon: <Icon of={isWatched ? CircleCheckFilledIcon : CircleCheckIcon} size={20} />,
            onChoose: () => {
              onMarkWatched(shown, !isWatched);
            },
          },
        ]),
    ...(canKeepFiles()
      ? [
          {
            id: 'download',
            label:
              preparing === undefined
                ? say('common.download')
                : say('screens.mediaDetailDialog.preparingPercent', { percent }),
            icon:
              preparing === undefined ? (
                <Icon of={DownloadIcon} size={20} />
              ) : (
                <Spinner size="sm" label={say('screens.mediaDetailDialog.preparing')} />
              ),
            onChoose: () => {
              setIsDownloading(true);
            },
          },
        ]
      : []),
    ...(onShare === undefined
      ? []
      : [
          {
            id: 'share',
            label: say('common.share'),
            icon: <Icon of={ShareIcon} size={20} />,
            onChoose: () => {
              onShare(shown);
            },
          },
        ]),
    ...(onPlayOn === undefined
      ? []
      : [
          {
            id: 'play-on',
            label: say('common.playOnTV'),
            icon: <Icon of={TvIcon} size={18} />,
            onChoose: () => {
              onPlayOn(chosenVersion ?? shown, startsFrom);
            },
          },
        ]),
    ...(!hasTrailer
      ? []
      : [
          {
            id: 'trailer',
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
    ...(onStartParty === undefined
      ? []
      : [
          {
            id: 'party',
            label: say('screens.mediaDetailDialog.watchTogether'),
            icon: <Icon of={UsersIcon} size={18} />,
            onChoose: () => {
              onStartParty(shown);
            },
          },
        ]),
    ...(may('library.edit')
      ? [
          {
            id: 'collection',
            label: say('common.addToACollection'),
            icon: <Icon of={LayersIcon} size={18} />,
            onChoose: () => {
              setIsCollecting(true);
            },
          },
        ]
      : []),
    ...(onDecideForSomebody === undefined
      ? []
      : [
          {
            id: 'decide',
            label: say('common.whoMayWatchThis'),
            icon: <Icon of={UserCheckIcon} size={18} />,
            onChoose: () => {
              onDecideForSomebody(shown);
            },
          },
        ]),
    ...(onHide === undefined
      ? []
      : [
          {
            id: 'hide',
            label: say('screens.mediaDetailDialog.hideThis'),
            icon: <Icon of={EyeOffIcon} size={18} />,
            onChoose: () => {
              onHide(shown);
            },
          },
        ]),
  ];

  return (
    <Dialog label={shown.title} isOpen={media !== null} onClose={onClose} size="stage" edge={tint}>
      <DialogContent className="p-3 sm:p-4">
        <ScrolledTitle
          title={shown.title}
          artwork={shown.hasPoster ? artworkUrl(shown.id, 'poster', { size: 'small' }) : null}
          detail={
            <>
              <MediaFacts media={shown} hasRuntime size="xs" tone="muted" />
              <TitleBadges detail={detail} isBrief className="hidden flex-nowrap sm:flex" />
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
          <DialogArrival key={shown.id}>
            <TitleHero
              ref={topRef}
              preview={
                <MediaPreview
                  mediaId={shown.id}
                  backdropUrl={shown.hasBackdrop ? artworkUrl(shown.id, 'backdrop') : null}
                  durationSeconds={shown.durationSeconds}
                  hasSound
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
                  repeats={false}
                  fills
                />
              }
            >
              <DialogHeadline className="flex flex-col items-start gap-8">
                <DialogHeadlinePart
                  as="h2"
                  isTitle
                  className={
                    isLettered
                      ? 'flex'
                      : 'max-w-[18ch] text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-on-scrim'
                  }
                >
                  {isLettered ? (
                    <TitleLogo
                      src={titleLogoUrl(shown.id)}
                      alt={shown.seriesTitle ?? shown.title}
                      className={LOGO_BOX}
                      onError={() => {
                        setUnlettered(shown.id);
                      }}
                    />
                  ) : (
                    (shown.seriesTitle ?? shown.title)
                  )}
                </DialogHeadlinePart>

                <DialogHeadlinePart className="flex w-full flex-wrap items-center gap-3">
                  <div className="w-full md:w-[21rem]">{play}</div>

                  <RoundActions
                    label={say('screens.mediaDetailDialog.moreToDoWithThis')}
                    actions={actions}
                    isCompact
                    className="md:ml-auto"
                  />
                </DialogHeadlinePart>
              </DialogHeadline>
            </TitleHero>

            <span ref={pastTheArtwork} aria-hidden className="block h-px" />

            <DialogHeadline className="grid gap-x-12 gap-y-5 px-1 pt-2 sm:px-2 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
              <div className="flex min-w-0 flex-col gap-4">
                {(shown.seriesTitle ?? '').trim() === '' ||
                showIdOf(shown) === null ||
                onOpenShow === undefined ? null : (
                  <DialogHeadlinePart as="span" className="-mb-3">
                    {hrefOf === null ? (
                      <Button
                        variant="subtle"
                        size="none"
                        hasTooltip={false}
                        onClick={() => {
                          onOpenShow(shown);
                        }}
                        className="text-sm font-medium"
                      >
                        {shown.seriesTitle}
                      </Button>
                    ) : (
                      <Link
                        href={hrefOf({ ...NOTHING_OPEN, show: showIdOf(shown) ?? '' })}
                        look="bare"
                        onNavigate={() => {
                          onOpenShow(shown);
                        }}
                        className="text-sm font-medium text-text-muted transition-colors hover:text-text"
                      >
                        {shown.seriesTitle}
                      </Link>
                    )}
                  </DialogHeadlinePart>
                )}

                {shown.seriesTitle === null || shown.seriesTitle === undefined ? null : (
                  <DialogHeadlinePart as="span" className="text-lg font-semibold text-text">
                    {shown.title}
                  </DialogHeadlinePart>
                )}

                <DialogHeadlinePart className="flex flex-col gap-2.5">
                  <MediaFacts
                    media={detail === null ? shown : { ...shown, sizeBytes: detail.sizeBytes }}
                    hasRuntime
                    hasSize
                    size="base"
                    tone="muted"
                  />
                  <TitleBadges detail={detail} />
                </DialogHeadlinePart>

                <DialogHeadlinePart>
                  {isLoading ? (
                    <div aria-hidden className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[92%]" />
                      <Skeleton className="h-4 w-[70%]" />
                    </div>
                  ) : overview === null ? (
                    <p className="flex items-center gap-2 text-sm text-text-muted">
                      <Icon of={InfoIcon} size={16} />
                      {say('screens.mediaDetailDialog.noSynopsisYetConfigureAMetadata')}
                    </p>
                  ) : (
                    <p className="max-w-[65ch] text-base leading-relaxed text-text">{overview}</p>
                  )}
                </DialogHeadlinePart>
              </div>

              <DialogHeadlinePart className="flex flex-col gap-3 text-sm leading-relaxed">
                {cast.length === 0 ? null : (
                  <p>
                    <span className="text-text-muted">{say('common.cast')}: </span>
                    <span className="text-text">
                      {cast
                        .slice(0, 3)
                        .map((member) => member.name)
                        .join(', ')}
                    </span>
                  </p>
                )}

                {genres.length === 0 ? null : (
                  <p>
                    <span className="text-text-muted">{say('common.genres')}: </span>
                    <span className="text-text">{genres.join(', ')}</span>
                  </p>
                )}

                {filmCopies.length < 2 && origin === null && alsoOn.length === 0 ? null : (
                  <p className="flex items-center gap-2.5 text-text-muted">
                    {fromMarks.length === 0 ? null : (
                      <span className="flex shrink-0 -space-x-2">
                        {fromMarks.map((mark) => (
                          <OriginMark key={mark.label} {...mark} />
                        ))}
                      </span>
                    )}
                    <span className="min-w-0">
                      {filmCopies.length > 1
                        ? say('common.fromName', {
                            name: sayAgain(sayingAll([firstServer, ...otherServers])),
                          })
                        : origin === null
                          ? say('common.alsoOnNames', { names: alsoOn.join(', ') })
                          : say('common.fromName', { name: origin.name })}
                    </span>
                  </p>
                )}

                {onRate === undefined ? null : (
                  <RatingPanel
                    subject={{ mediaId: shown.id }}
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
              {origin === null || origin.isReachable ? null : (
                <Callout
                  tone="warning"
                  title={say('common.nameCannotBeReachedRightNow', { name: origin.name })}
                />
              )}

              {media !== null && asked.isError ? (
                <CouldNotRead
                  said={say('screens.mediaDetailDialog.theRestOfThisCouldNotBeRead')}
                  isTryingAgain={asked.isFetching}
                  onTryAgain={() => {
                    void asked.refetch();
                  }}
                />
              ) : null}

              <TitleDetails
                seriesTitle={metadata?.seriesTitle}
                releaseDate={metadata?.releaseDate}
                status={metadata?.status}
                budget={metadata?.budget}
                revenue={metadata?.revenue}
                rottenTomatoes={metadata?.rottenTomatoes}
              />

              <PartOfCollections subject={media === null ? null : subjectOfMedia(shown)} />

              <PluginPanels on="title" subjectId={shown.id} />

              <DialogSection
                {...(isLoading || cast.length === 0 ? { heading: say('common.cast') } : {})}
              >
                {isLoading ? (
                  <>
                    <ul aria-hidden className="flex gap-4">
                      {Array.from({ length: CAST_PLACEHOLDERS }, (_, index) => index).map(
                        (index) => (
                          <li
                            key={index}
                            className="flex min-w-0 flex-1 flex-col items-center gap-3"
                          >
                            <Skeleton className="aspect-[2/3] w-full" />
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-12" />
                          </li>
                        ),
                      )}
                    </ul>
                  </>
                ) : cast.length === 0 ? (
                  <>
                    <p className="flex items-center gap-2 text-sm text-text-muted">
                      <Icon of={InfoIcon} size={16} />
                      {say('screens.mediaDetailDialog.nobodyIsCreditedYetAMetadata')}
                    </p>
                  </>
                ) : (
                  <CastGrid
                    members={cast}
                    {...(onOpenPerson === undefined ? {} : { onOpenPerson })}
                  />
                )}
              </DialogSection>

              {extras.length === 0 ? null : (
                <Rail title={say('common.extras')} sizesCards hasArrows={false} className="px-0">
                  {extras.map((extra) => (
                    <li key={extra.id}>
                      <MediaCard
                        {...(extra.extraKind === null || extra.extraKind === undefined
                          ? {}
                          : { eyebrow: EXTRA_KIND_LABELS[extra.extraKind] })}
                        title={extra.title}
                        subtitle={<MediaFacts media={extra} hasRuntime />}
                        shape="wide"
                        {...(extra.hasBackdrop
                          ? { imageUrl: artworkUrl(extra.id, 'backdrop', { size: 'medium' }) }
                          : {})}
                        onSelect={() => {
                          onPlay(extra, 0);
                        }}
                      />
                    </li>
                  ))}
                </Rail>
              )}

              {shownSiblings.length === 0 ? null : (
                <DialogSection>
                  <Rail
                    title={
                      season === null
                        ? say('screens.mediaDetailDialog.moreFromThisSeries')
                        : say('screens.mediaDetailDialog.moreFromSeasonSeason', {
                            season: season.toString(),
                          })
                    }
                    hasArrows={false}
                    look="title"
                    className="px-0"
                  >
                    {shownSiblings.map((sibling) => (
                      <li key={sibling.id} className="flex">
                        <SeasonMate
                          episode={sibling}
                          watched={watchedFractionFor?.(sibling.id)}
                          onSelect={() => {
                            onSelectSibling?.(sibling);
                          }}
                        />
                      </li>
                    ))}
                  </Rail>
                </DialogSection>
              )}

              {onInspect === undefined ||
              onOpenShow === undefined ||
              (shown.extraKind ?? null) !== null ? null : (
                <LikeThisShelf
                  mediaId={shown.id}
                  kind={isAFilm ? 'film' : 'series'}
                  externalId={shown.externalId}
                  {...(onAsk === undefined ? {} : { onAsk })}
                  onPlay={onPlay}
                  onInspect={onInspect}
                  onOpenShow={onOpenShow}
                />
              )}
            </DialogSections>
          </DialogArrival>
        </TintedGround>
      </DialogContent>

      <DownloadDialog
        media={isDownloading ? shown : null}
        onClose={() => {
          setIsDownloading(false);
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

      <AddToCollectionDialog
        subject={isCollecting && media !== null ? subjectOfMedia(shown) : null}
        title={shown.seriesTitle ?? shown.title}
        onClose={() => {
          setIsCollecting(false);
        }}
      />
    </Dialog>
  );
};

MediaDetailDialog.displayName = 'MediaDetailDialog';

export { MediaDetailDialog };
