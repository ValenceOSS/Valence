import { Icon } from '@ValenceUI/Icon';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { titleLogoUrl } from '@ValenceClient/library/titleLogoUrl';
import { TitleLogo } from '@ValenceScreens/components/TitleLogo/TitleLogo';
import {
  ArrowUTurnRight as ArrowUTurnRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Download as DownloadIcon,
  EyeOff as EyeOffIcon,
  Info as InfoIcon,
  Layers as LayersIcon,
  Share as ShareIcon,
  Tape as TapeIcon,
  UserCheck as UserCheckIcon,
  Users as UsersIcon,
  X as XIcon,
  Monitor as MonitorIcon,
} from '@keyline-icons/react';
import { Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { ActionBar } from '@ValenceUI/ActionBar';
import { SplitButton } from '@ValenceUI/SplitButton';
import { canKeepFiles } from '@ValenceClient/downloads/canKeepFiles';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { Spinner } from '@ValenceUI/Spinner';
import { DownloadDialog } from '@ValenceScreens/components/DownloadDialog/DownloadDialog';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { useHasScrolledPast } from '@ValenceUI/useHasScrolledPast';
import { ScrolledTitle } from '@ValenceScreens/components/ScrolledTitle/ScrolledTitle';
import { BackdropScrim } from '@ValenceUI/BackdropScrim';
import { Badge } from '@ValenceUI/Badge';
import { Skeleton } from '@ValenceUI/Skeleton';
import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
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
import { CastGrid } from './components/CastGrid/CastGrid';
import { EXTRA_KIND_LABELS } from '@ValenceContracts/schemas/Library';
import { KeepHeart } from '@ValenceScreens/components/KeepHeart/KeepHeart';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { SeasonMate } from './components/SeasonMate/SeasonMate';
import { PartOfCollections } from '@ValenceScreens/components/PartOfCollections/PartOfCollections';
import { AddToCollectionDialog } from '@ValenceScreens/components/AddToCollectionDialog/AddToCollectionDialog';
import { subjectOfMedia } from '@ValenceClient/collections/subjectOfMedia';
import { Callout } from '@ValenceUI/Callout';
import { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import { usePreferredCopy } from '@ValenceClient/linking/usePreferredCopy';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MediaDetailDialogProps } from './MediaDetailDialog.types';
import { say } from '@ValenceI18n/say';

const CAST_PLACEHOLDERS = 5;

const LOGO_BOX = 'max-h-[16svh] w-auto max-w-[min(70vw,26rem)] object-contain object-left';

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
 * @param onBack - Told to go back to whatever opened this.
 * @param backLabel - What going back is called.
 * @param isKept - Whether it is kept.
 * @param onToggleKept - Told to keep it, or stop.
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
  onBack,
  backLabel,
  isKept = false,
  onToggleKept,
  onRate,
  onOpenPerson,
  onShare,
  onHide,
  onDecideForSomebody,
  onStartParty,
  onPlayOn,
}: MediaDetailDialogProps) => {
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
  const season = metadata?.seasonNumber ?? null;
  const genres = metadata?.genres ?? [];
  const cast = metadata?.cast ?? [];

  return (
    <Dialog label={shown.title} isOpen={media !== null} onClose={onClose} size="stage">
      <DialogContent className="p-3 sm:p-4">
        <ScrolledTitle
          title={shown.title}
          artwork={shown.hasPoster ? artworkUrl(shown.id, 'poster') : null}
          isShowing={hasScrolledPast}
        >
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            label={say('common.close')}
            onClick={onClose}
          >
            <Icon of={XIcon} size={16} />
          </Button>
        </ScrolledTitle>

        <DialogArrival key={shown.id}>
          <div ref={topRef} className="relative overflow-hidden rounded-2xl">
            <div className="relative h-[42vh] min-h-[16rem] sm:h-[26rem]">
              <MediaPreview
                mediaId={shown.id}
                backdropUrl={shown.hasBackdrop ? artworkUrl(shown.id, 'backdrop') : null}
                durationSeconds={shown.durationSeconds}
                hasSound
                {...(onToggleKept === undefined
                  ? {}
                  : {
                      actions: (
                        <Button
                          isIconOnly
                          variant="overlay"
                          label={
                            isKept
                              ? say('common.stopKeepingTitle', { title: shown.title })
                              : say('common.keepTitle', { title: shown.title })
                          }
                          isActive={isKept}
                          onClick={() => {
                            onToggleKept(shown);
                          }}
                        >
                          <KeepHeart isKept={isKept} size={18} />
                        </Button>
                      ),
                    })}
                repeats={false}
                fills
              />

              <BackdropScrim />
            </div>

            {onBack === undefined ? null : (
              <div className="absolute left-4 top-4">
                <Button variant="overlay" size="sm" onClick={onBack}>
                  <Icon of={ChevronLeftIcon} size={16} />
                  {backLabel ?? say('common.back')}
                </Button>
              </div>
            )}

            <div className="absolute right-4 top-4">
              <Button isIconOnly variant="overlay" label={say('common.close')} onClick={onClose}>
                <Icon of={XIcon} size={20} />
              </Button>
            </div>

            <DialogHeadline className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:p-8">
              <DialogHeadlinePart
                as="h2"
                isTitle
                className={
                  isLettered
                    ? 'flex'
                    : 'max-w-[16ch] text-[clamp(2rem,6vw,3.75rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-on-scrim'
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

              {shown.seriesTitle === null || shown.seriesTitle === undefined ? null : (
                <DialogHeadlinePart as="span" className="text-sm font-medium text-on-scrim/75">
                  {shown.title}
                </DialogHeadlinePart>
              )}

              <DialogHeadlinePart>
                <MediaFacts
                  media={detail === null ? shown : { ...shown, sizeBytes: detail.sizeBytes }}
                  hasRuntime
                  hasSize
                  size="sm"
                  tone="scrim"
                />
              </DialogHeadlinePart>

              {origin === null ? null : (
                <DialogHeadlinePart className="text-sm text-on-scrim/80">
                  {say('common.fromName', { name: origin.name })}
                </DialogHeadlinePart>
              )}

              {origin !== null || alsoOn.length === 0 ? null : (
                <DialogHeadlinePart className="text-sm text-on-scrim/80">
                  {say('common.alsoOnNames', { names: alsoOn.join(', ') })}
                </DialogHeadlinePart>
              )}

              <DialogHeadlinePart className="text-on-scrim/85">
                <TitleBadges detail={detail} />
              </DialogHeadlinePart>
            </DialogHeadline>
          </div>

          <span ref={pastTheArtwork} aria-hidden className="block h-px" />

          <DialogSections className="flex flex-col gap-3 px-0 pb-4 pt-4">
            {origin === null || origin.isReachable ? null : (
              <Callout
                tone="warning"
                title={say('common.nameCannotBeReachedRightNow', { name: origin.name })}
              />
            )}

            {onRate === undefined ? null : (
              <RatingPanel
                subject={{ mediaId: shown.id }}
                title={shown.title}
                onRate={(given) => {
                  onRate(shown, given);
                }}
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

            <DialogSection heading={say('common.synopsis')}>
              {isLoading ? (
                <div aria-hidden className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[92%]" />
                  <Skeleton className="h-4 w-[70%]" />
                </div>
              ) : typeof metadata?.overview === 'string' && metadata.overview !== '' ? (
                <p className="text-[0.95rem] leading-relaxed text-text">{metadata.overview}</p>
              ) : (
                <p className="flex items-center gap-2 text-sm text-text-muted">
                  <Icon of={InfoIcon} size={16} />
                  {say('screens.mediaDetailDialog.noSynopsisYetConfigureAMetadata')}
                </p>
              )}

              {genres.length === 0 ? null : (
                <span className="flex flex-wrap gap-1.5">
                  {genres.map((label) => (
                    <Badge key={label} size="sm">
                      {label}
                    </Badge>
                  ))}
                </span>
              )}
            </DialogSection>

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
                    {Array.from({ length: CAST_PLACEHOLDERS }, (_, index) => index).map((index) => (
                      <li key={index} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                        <Skeleton className="aspect-[2/3] w-full" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </li>
                    ))}
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
                      {...(extra.hasBackdrop ? { imageUrl: artworkUrl(extra.id, 'backdrop') } : {})}
                      onSelect={() => {
                        onPlay(extra, 0);
                      }}
                    />
                  </li>
                ))}
              </Rail>
            )}

            {shownSiblings.length === 0 ? null : (
              <DialogSection
                heading={
                  season === null
                    ? say('screens.mediaDetailDialog.moreFromThisSeries')
                    : say('screens.mediaDetailDialog.moreFromSeasonSeason', {
                        season: season.toString(),
                      })
                }
              >
                <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
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
                </ul>
              </DialogSection>
            )}
          </DialogSections>
        </DialogArrival>
      </DialogContent>

      <DialogFooter>
        <ActionBar
          label={say('screens.mediaDetailDialog.moreToDoWithThis')}
          primary={
            <div className="flex w-full items-center gap-2">
              {versions.length === 0 ? (
                <Button
                  variant="confirm"
                  size="lg"
                  className="min-w-0 flex-1"
                  onClick={() => {
                    onPlay(shown, shownResume ?? 0);
                  }}
                >
                  <Icon of={PlayFilledIcon} size={18} />
                  {shownResume === undefined
                    ? say('common.play')
                    : say('screens.mediaDetailDialog.resumeFromShownResume', {
                        shownResume: formatDuration(shownResume),
                      })}
                </Button>
              ) : (
                <SplitButton
                  className="flex-1"
                  choiceLabel={say('screens.mediaDetailDialog.whichEditionToPlay')}
                  choiceName={say('screens.mediaDetailDialog.editions')}
                  onClick={() => {
                    onPlay(
                      chosenVersion ?? shown,
                      chosenVersion === null || isTheSameTitle ? (shownResume ?? 0) : 0,
                    );
                  }}
                  options={editionOptionsOf(shown, detail?.versionLabel ?? null, versions)}
                  selectedId={chosenVersion?.id ?? shown.id}
                  onSelect={(id) => {
                    setVersion(id === shown.id ? null : id);
                  }}
                >
                  <Icon of={PlayFilledIcon} size={18} />
                  {chosenVersion !== null
                    ? chosenVersion.versionLabel === null ||
                      chosenVersion.versionLabel === undefined
                      ? say('screens.mediaDetailDialog.playThisEdition')
                      : say('common.playName', { name: chosenVersion.versionLabel })
                    : shownResume === undefined
                      ? say('common.play')
                      : say('screens.mediaDetailDialog.resumeFromShownResume', {
                          shownResume: formatDuration(shownResume),
                        })}
                </SplitButton>
              )}
            </div>
          }
          actions={[
            ...(!hasTrailer
              ? []
              : [
                  {
                    id: 'trailer',
                    isPinned: true,
                    label: say('common.watchTheTrailer'),
                    icon: <Icon of={TapeIcon} size={18} />,
                    onChoose: () => {
                      if (trailer === null) {
                        setIsWatchingTrailer(true);

                        return;
                      }

                      onPlay(trailer, 0);
                    },
                  },
                ]),
            ...(shownResume === undefined
              ? []
              : [
                  {
                    id: 'again',
                    label: say('common.startAgain'),
                    icon: <Icon of={ArrowUTurnRightIcon} size={18} />,
                    onChoose: () => {
                      onPlay(shown, 0);
                    },
                  },
                ]),
            ...(onShare === undefined
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
                        <Icon of={DownloadIcon} size={18} />
                      ) : (
                        <Spinner size="sm" label={say('screens.mediaDetailDialog.preparing')} />
                      ),
                    onChoose: () => {
                      setIsDownloading(true);
                    },
                  },
                ]
              : []),
            ...(onPlayOn === undefined
              ? []
              : [
                  {
                    id: 'play-on',
                    isPinned: true,
                    label: say('common.playOnTV'),
                    icon: <Icon of={MonitorIcon} size={18} />,
                    onChoose: () => {
                      onPlayOn(
                        chosenVersion ?? shown,
                        chosenVersion === null || isTheSameTitle ? (shownResume ?? 0) : 0,
                      );
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
          ]}
        />
      </DialogFooter>

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
