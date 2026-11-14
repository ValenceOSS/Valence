import { useMe } from '@ValenceClient/requests/useMe';
import { DEFAULT_RELEASE_TYPES } from '@ValenceContracts/schemas/MediaRequest';
import { useEffect, useState } from 'react';
import { Play as PlayFilledIcon, Stop as StopFilledIcon } from '@keyline-icons/react/fill';
import { useSample } from '@ValenceScreens/requests/useSample';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown as ChevronDownIcon,
  CircleX as CircleXIcon,
  ListVideo as ListVideoIcon,
  Plus as PlusIcon,
  Send as SendIcon,
  SquarePlay as SquarePlayIcon,
  X as XIcon,
} from '@keyline-icons/react';
import { DownloadProgressReadout } from '@ValenceScreens/components/DownloadProgressReadout/DownloadProgressReadout';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Dialog } from '@ValenceUI/Dialog';
import { EmbeddedVideo } from '@ValenceUI/EmbeddedVideo';
import { DialogContent } from '@ValenceUI/DialogContent';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { ReadMore } from '@ValenceUI/ReadMore';
import { Skeleton } from '@ValenceUI/Skeleton';
import { Spinner } from '@ValenceUI/Spinner';
import { cn } from '@ValenceUI/cn';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import {
  askForMedia,
  joinMediaRequest,
  removeMediaRequest,
} from '@ValenceClient/requests/fetchMediaRequests';
import { describeOthersStillWanting } from '@ValenceClient/requests/describeOthersStillWanting';
import { describeWhoElseAsked } from '@ValenceClient/requests/describeWhoElseAsked';
import { describeMyProfileAsk } from '@ValenceClient/requests/describeMyProfileAsk';
import { mayJoinRequest } from '@ValenceClient/requests/mayJoinRequest';
import { askersOf } from '@ValenceContracts/functions/askersOf';
import { isAskedByMe } from '@ValenceContracts/functions/isAskedByMe';
import { askingFor } from '@ValenceClient/requests/askingFor';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import { seasonsWithItemsOf } from '@ValenceClient/requests/seasonsWithItemsOf';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { CastGrid } from '@ValenceScreens/components/CastGrid/CastGrid';
import type { CastMember } from '@ValenceScreens/components/CastGrid/CastGrid.types';
import { AgeRating } from '@ValenceUI/AgeRating';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { ReleaseTypeChooser } from '@ValenceScreens/components/ReleaseTypeChooser/ReleaseTypeChooser';
import { SlidingList } from '@ValenceScreens/components/SlidingList/SlidingList';
import { AlbumTracks } from '@ValenceScreens/components/AskableDialog/components/AlbumTracks/AlbumTracks';
import { Checkbox } from '@ValenceUI/Checkbox';
import { BookFormatChooser } from '@ValenceScreens/components/BookFormatChooser/BookFormatChooser';
import { ChooseQualityDialog } from '@ValenceScreens/components/AskableDialog/components/ChooseQualityDialog/ChooseQualityDialog';
import { SeasonChooser } from '@ValenceScreens/components/SeasonChooser/SeasonChooser';
import { describeAskableFacts } from '@ValenceClient/requests/describeAskableFacts';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import { readAsking } from './readAsking';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { catalogueTrailerUrl } from '@ValenceScreens/library/catalogueTrailerUrl';
import { groupReleases } from '@ValenceClient/requests/groupReleases';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { DialogSections } from '@ValenceScreens/components/DialogSections/DialogSections';
import { TrailerBackdrop } from '@ValenceScreens/components/TrailerBackdrop/TrailerBackdrop';
import { TitleLogo } from '@ValenceScreens/components/TitleLogo/TitleLogo';
import { catalogueTrailerStreamUrl } from '@ValenceClient/requests/catalogueTrailerStreamUrl';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { iconOfQuality } from '@ValenceScreens/library/iconOfQuality';
import { TitleHero } from '@ValenceScreens/components/TitleHero/TitleHero';
import { TintedGround } from '@ValenceScreens/components/TintedGround/TintedGround';
import { ArtworkCloseButton } from '@ValenceScreens/components/ArtworkCloseButton/ArtworkCloseButton';
import { ArtworkBackButton } from '@ValenceScreens/components/ArtworkBackButton/ArtworkBackButton';
import { RoundActions } from '@ValenceScreens/components/RoundActions/RoundActions';
import type { RoundAction } from '@ValenceScreens/components/RoundActions/RoundActions.types';
import { PlayWithRestart } from '@ValenceScreens/components/PlayWithRestart/PlayWithRestart';
import { PLAY_FACE } from '@ValenceUI/tokens/PLAY_FACE';
import { useArtworkTint } from '@ValenceScreens/library/useArtworkTint';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import { DialogArrival } from '@ValenceScreens/components/DialogArrival/DialogArrival';
import { DialogHeadline } from '@ValenceScreens/components/DialogHeadline/DialogHeadline';
import { DialogHeadlinePart } from '@ValenceScreens/components/DialogHeadlinePart/DialogHeadlinePart';
import { askLinkedServer } from '@ValenceClient/linking/askLinkedServer';
import { linkingQueries } from '@ValenceClient/query/linkingQueries';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import type {
  BookFormat,
  MediaRequestAsk,
  ReleaseType,
} from '@ValenceContracts/schemas/MediaRequest';
import { useMayStream } from '@ValenceClient/streams/useMayStream';
import { usePlayFromSource } from '@ValenceClient/streams/usePlayFromSource';
import { screenOfProfile } from '@ValenceClient/streams/screenOfProfile';
import { detectFromBrowser } from '@ValenceClient/playback/detectFromBrowser';
import { ChooseSourceDialog } from '@ValenceScreens/components/ChooseSourceDialog/ChooseSourceDialog';
import type { DialogConfirmation } from '@ValenceUI/DialogFooter.types';
import type { AskableDialogProps } from './AskableDialog.types';
import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';
import { say } from '@ValenceI18n/say';

const FOLLOWED_EVERY_MS = 5000;

type Choosing = { asked: MediaRequestAsk; onAsked: () => void };

/**
 * The page of a film, series, artist or album that can be asked for, opened from anywhere its
 * address names it: its artwork, what it is, who is in it, and where it stands — in the library
 * already, or on a linked server, where it opens that title's own page instead, as if it were here;
 * somewhere along being fetched; or there to be asked for, with
 * the seasons of a series or the kinds of an artist's releases to choose. A film that is not in the
 * library plays straight from a source a plugin offers, for somebody who may: Play chooses the best
 * stream and plays it, and Sources lets them choose. A series already asked
 * for can have more seasons added. An artist's albums can be asked for one at a time as well. Somebody's own request can be cancelled from here until it is in
 * the library, which deletes whatever it had started downloading.
 *
 * @param asking - The title the address names, as its kind and id, or nothing.
 * @param onClose - Called when it is dismissed.
 * @param onPlay - Called with the title to play once a film has started playing from a source.
 * @param onOpen - Called to open what is in the library already, in its place of asking — a title
 *   the library holds is not asked about, but opened as it would be anywhere else, unless the
 *   address asks for more of it, as a show's Request more does: then its seasons are offered, those
 *   held whole locked, and only what is missing is fetched.
 * @param onOpenPerson - Told whose page to open from its cast, and the part they played, where
 *   opening one is offered.
 * @param onBack - Told to go back to whatever opened this, offered in place of closing it.
 * @param backLabel - What going back is called.
 */
const AskableDialog = ({
  asking,
  onClose,
  onOpen,
  onPlay,
  onOpenPerson,
  onBack,
  backLabel,
}: AskableDialogProps) => {
  const cache = useQueryClient();
  const named = readAsking(asking);
  const found = useQuery({
    ...requestsQueries.askable(named?.kind ?? 'film', named?.id ?? null),
    refetchInterval: (query) =>
      query.state.data?.standing.status === 'requested' ? FOLLOWED_EVERY_MS : false,
  });
  const [seasons, setSeasons] = useState<number[] | null>(null);
  const [followsNew, setFollowsNew] = useState(true);
  const [adding, setAdding] = useState<number[] | null>([]);
  const [addsFollowing, setAddsFollowing] = useState(false);
  const [releaseTypes, setReleaseTypes] = useState<ReleaseType[]>([...DEFAULT_RELEASE_TYPES]);
  const [bookFormats, setBookFormats] = useState<BookFormat[]>(['ebook']);
  const [isWholeSeries, setIsWholeSeries] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [askingElsewhere, setAskingElsewhere] = useState<string | null>(null);
  const faces = useQuery(linkingQueries.faces());
  const [askedAlbums, setAskedAlbums] = useState<ReadonlySet<string>>(new Set());
  const [problem, setProblem] = useState<string | null>(null);
  const [unlettered, setUnlettered] = useState<string | null>(null);
  const title = found.data ?? null;
  const heldKind = title?.kind ?? null;
  const isMore = named?.isMore === true;
  const heldId =
    !isMore && (title?.standing.status === 'library' || title?.standing.status === 'linked')
      ? title.standing.mediaId
      : null;
  const isElsewhere = title?.standing.status === 'linked';
  const kinds = useRequestableKinds();
  const isUnrequestable = title !== null && !kinds.has(title.kind);
  const isAskable =
    !isUnrequestable &&
    (title?.standing.status === 'askable' ||
      (isMore && title?.standing.status === 'library') ||
      (isElsewhere && title.standing.requestId === null));

  useEffect(() => {
    if (heldKind !== null && heldId !== null) {
      onOpen(heldKind, heldId);
    }
  }, [heldKind, heldId, onOpen]);
  const sample = useSample();
  const requestId = title?.standing.requestId ?? null;
  const requests = useQuery({ ...requestsQueries.mediaRequests(), enabled: requestId !== null });
  const request = requests.data?.find((one) => one.id === requestId) ?? null;
  const progress = useQuery(requestsQueries.requestProgress(request?.state === 'downloading'));
  const going = request === null ? null : progressOfRequest(request, progress.data ?? []);
  const asMe = useMe();
  const [isCancelling, setIsCancelling] = useState(false);
  const [choosing, setChoosing] = useState<Choosing | null>(null);
  const [isWatchingTrailer, setIsWatchingTrailer] = useState(false);
  const trailerKey = title?.trailerKey ?? null;
  const tint = useArtworkTint(title?.backdropUrl ?? null);
  const mayStream = useMayStream();
  const isStreamable =
    mayStream &&
    title?.kind === 'film' &&
    !isMore &&
    (title.standing.status === 'askable' ||
      title.standing.status === 'requested' ||
      title.standing.status === 'linked');
  const [device] = useState(() => detectFromBrowser(window, document.createElement('video')));
  const streaming = usePlayFromSource(
    isStreamable ? Number(title.id) : null,
    screenOfProfile(device, title?.runtimeMinutes ?? null),
    (mediaId) => {
      onPlay(mediaId);
    },
  );
  const offered = useQuery(
    requestsQueries.profilesOnOffer(
      title?.kind ?? 'film',
      isAskable,
      title !== null && (title.kind === 'film' || title.kind === 'series')
        ? Number(title.id)
        : undefined,
    ),
  );
  const choices = offered.data?.forcedId === null ? offered.data.choices : [];
  const mayCancel =
    request !== null &&
    isAskedByMe(request, asMe) &&
    request.state !== 'filed' &&
    request.state !== 'available';
  const standing = title === null ? null : describeStanding(title.standing);
  const whoElse = title === null ? null : describeWhoElseAsked(title.standing.askedBy ?? [], asMe);
  const myProfileAsk = request === null ? null : describeMyProfileAsk(request, asMe);
  const isJoinable = title !== null && !isUnrequestable && mayJoinRequest(title.standing, asMe);
  const isAddingSeasons =
    !isUnrequestable &&
    title?.kind === 'series' &&
    title.standing.status === 'requested' &&
    request !== null &&
    request.approval !== 'refused';
  const askedSeasons =
    request === null ? [] : (request.seasons ?? seasonsWithItemsOf(request.items));
  const isFollowedAlready =
    request !== null && (request.seasons === null || request.followsNewSeasons);
  const hasMoreToAdd =
    adding === null || adding.length > 0 || (addsFollowing && !isFollowedAlready);
  const isReady =
    title !== null &&
    (seasons === null || seasons.length > 0) &&
    (title.kind !== 'artist' || releaseTypes.length > 0) &&
    (title.kind !== 'book' || bookFormats.length > 0);

  const send = (asked: MediaRequestAsk, onAsked: () => void = () => undefined) => {
    setIsAsking(true);
    setProblem(null);

    void askForMedia(asked)
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(refusal?.message ?? say('common.thatCouldNotBeRequested'));

          return;
        }

        onAsked();
        void cache.invalidateQueries({ queryKey: requestsQueries.key });
      })
      .finally(() => {
        setIsAsking(false);
      });
  };

  const join = (requestId: string) => {
    setIsAsking(true);
    setProblem(null);

    void joinMediaRequest(requestId)
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(refusal?.message ?? say('common.thatCouldNotBeRequested'));

          return;
        }

        void cache.invalidateQueries({ queryKey: requestsQueries.key });
      })
      .catch(() => {
        setProblem(say('common.thatCouldNotBeRequested'));
      })
      .finally(() => {
        setIsAsking(false);
      });
  };

  const ask = (asked: MediaRequestAsk, onAsked: () => void = () => undefined) => {
    if (choices.length < 2) {
      send(asked, onAsked);

      return;
    }

    setChoosing({ asked, onAsked });
  };

  const mainAsk: Choosing | null =
    title === null || isElsewhere
      ? null
      : isAskable
        ? {
            asked: askingFor(title, seasons, releaseTypes, followsNew, bookFormats, isWholeSeries),
            onAsked: () => undefined,
          }
        : isAddingSeasons
          ? {
              asked: {
                kind: 'series',
                tmdbId: Number(title.id),
                seasons: adding,
                followsNewSeasons: addsFollowing,
              },
              onAsked: () => {
                setAdding([]);
                setAddsFollowing(false);
              },
            }
          : null;

  const requestAction: DialogConfirmation | undefined =
    title === null
      ? undefined
      : isElsewhere && title.standing.mediaId !== null
        ? {
            label: say('common.watchOnName', {
              name: title.standing.fromServer ?? say('common.linkedServers'),
            }),
            onChoose: () => {
              if (title.standing.mediaId !== null) {
                onOpen(title.kind, title.standing.mediaId);
              }
            },
          }
        : isAskable
          ? {
              label:
                title.kind === 'artist'
                  ? say('screens.askableDialog.watchThisArtist')
                  : say('common.request'),
              isDisabled: !isReady,
              isLoading: isAsking,
              onChoose: () => {
                ask(
                  askingFor(title, seasons, releaseTypes, followsNew, bookFormats, isWholeSeries),
                );
              },
            }
          : isAddingSeasons
            ? {
                label: say('common.addSeasons'),
                isDisabled: !hasMoreToAdd,
                isLoading: isAsking,
                onChoose: () => {
                  ask(
                    {
                      kind: 'series',
                      tmdbId: Number(title.id),
                      seasons: adding,
                      followsNewSeasons: addsFollowing,
                    },
                    () => {
                      setAdding([]);
                      setAddsFollowing(false);
                    },
                  );
                },
              }
            : isJoinable && title.standing.requestId !== null
              ? {
                  label: say('common.iWantThisToo'),
                  isLoading: isAsking,
                  onChoose: () => {
                    if (title.standing.requestId !== null) {
                      join(title.standing.requestId);
                    }
                  },
                }
              : undefined;

  const note =
    problem ??
    (isStreamable ? streaming.problem : null) ??
    (isUnrequestable && title.standing.status === 'askable'
      ? say('common.noLibraryTakesRequestsForThis')
      : null);

  const mainAction: (DialogConfirmation & { icon: IconGlyph }) | null = isStreamable
    ? {
        label: say('common.play'),
        icon: PlayFilledIcon,
        isLoading: streaming.isFinding || streaming.isStarting,
        onChoose: streaming.start,
      }
    : requestAction === undefined
      ? null
      : {
          ...requestAction,
          icon: isElsewhere && title.standing.mediaId !== null ? PlayFilledIcon : PlusIcon,
        };

  const actions: RoundAction[] = [
    ...(trailerKey === null
      ? []
      : [
          {
            id: 'trailer',
            label: say('common.watchTheTrailer'),
            icon: <Icon of={SquarePlayIcon} size={20} />,
            onChoose: () => {
              setIsWatchingTrailer(true);
            },
          },
        ]),
    ...(isStreamable
      ? [
          {
            id: 'sources',
            label: say('common.sources'),
            icon: <Icon of={ListVideoIcon} size={20} />,
            onChoose: streaming.openPicker,
          },
        ]
      : []),
    ...(isStreamable && requestAction !== undefined
      ? [
          {
            id: 'request',
            label: requestAction.label,
            icon: <Icon of={PlusIcon} size={20} />,
            isDisabled: requestAction.isDisabled === true || requestAction.isLoading === true,
            onChoose: () => {
              requestAction.onChoose?.();
            },
          },
        ]
      : []),
    ...(title !== null && isElsewhere && isAskable
      ? [
          {
            id: 'request-here',
            label: say('common.requestHere'),
            icon: <Icon of={PlusIcon} size={20} />,
            isDisabled: !isReady || isAsking,
            onChoose: () => {
              ask(askingFor(title, seasons, releaseTypes, followsNew, bookFormats, isWholeSeries));
            },
          },
        ]
      : []),
    ...(title === null || !isAskable || (title.kind !== 'film' && title.kind !== 'series')
      ? []
      : (faces.data ?? [])
          .filter((server) => server.takesRequests && server.isReachable)
          .map((server) => ({
            id: `ask-${server.id}`,
            label: say('common.askName', { name: server.name }),
            icon: <Icon of={SendIcon} size={20} />,
            isDisabled: !isReady || askingElsewhere === server.id,
            onChoose: () => {
              setAskingElsewhere(server.id);

              void askLinkedServer(
                server.id,
                askingFor(title, seasons, releaseTypes, followsNew, bookFormats, isWholeSeries),
              )
                .then((sent) => {
                  tellOutcome(
                    say('screens.askableDialog.askedNameForTitle', {
                      name: server.name,
                      title: title.title,
                    }),
                    failureOfRefusal(sent.refusal),
                  );
                })
                .finally(() => {
                  setAskingElsewhere(null);
                });
            },
          }))),
    ...(mayCancel
      ? [
          {
            id: 'cancel',
            label: say('common.cancelRequest'),
            icon: <Icon of={CircleXIcon} size={20} />,
            onChoose: () => {
              setIsCancelling(true);
            },
          },
        ]
      : []),
  ];

  return (
    <Dialog
      label={title?.title ?? say('screens.askableDialog.somethingToAskFor')}
      isOpen={named !== null && heldId === null}
      onClose={onClose}
      size="stage"
      edge={tint}
    >
      <DialogContent className="p-3 sm:p-4">
        {found.isError ? (
          <CouldNotRead
            said={say('screens.askableDialog.thisTitleCouldNotBeRead')}
            isTryingAgain={found.isFetching}
            onTryAgain={() => {
              void found.refetch();
            }}
          />
        ) : title === null ? (
          <div aria-busy className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-2xl">
              <Skeleton shape="soft" className="h-[34vh] min-h-[14rem] w-full sm:h-[22rem]" />
              <div className="absolute end-4 top-4">
                <Button isIconOnly variant="overlay" label={say('common.close')} onClick={onClose}>
                  <Icon of={XIcon} size={20} />
                </Button>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted">
                <Spinner size="lg" label={say('screens.askableDialog.fetchingItsDetails')} />
                <span aria-hidden className="text-sm font-medium">
                  {say('screens.askableDialog.fetchingItsDetails')}
                </span>
              </div>
            </div>
            <Skeleton shape="soft" className="h-28 w-full" />
            <Skeleton shape="soft" className="h-40 w-full" />
          </div>
        ) : (
          <TintedGround tint={tint}>
            <DialogArrival key={`${title.kind}:${title.id}`} className="flex flex-col">
              <TitleHero
                preview={
                  <TrailerBackdrop
                    label={say('common.titleTheTrailer', { title: title.title })}
                    trailerUrl={
                      title.backdropUrl === null ||
                      title.trailerKey === null ||
                      (title.kind !== 'film' && title.kind !== 'series')
                        ? null
                        : catalogueTrailerStreamUrl(title.kind, title.id)
                    }
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
                    backdrop={
                      title.backdropUrl === null ? (
                        <div className="absolute inset-0 overflow-hidden">
                          {title.posterUrl === null ? null : (
                            <img
                              src={title.posterUrl}
                              alt=""
                              className="size-full scale-110 object-cover opacity-60 blur-2xl"
                            />
                          )}
                        </div>
                      ) : (
                        <img
                          src={title.backdropUrl}
                          alt=""
                          className="absolute inset-0 size-full object-cover"
                        />
                      )
                    }
                  />
                }
              >
                <DialogHeadline className="flex flex-col items-start gap-8">
                  <div className="flex items-end gap-5">
                    {isMusicRequest(title.kind) ? (
                      <DialogHeadlinePart className="hidden w-32 sm:flex">
                        <MusicArtwork
                          src={title.posterUrl}
                          label={say('common.theCoverOfTitle', { title: title.title })}
                          shape={title.kind === 'artist' ? 'round' : 'square'}
                          isLifted
                          className="w-full"
                        />
                      </DialogHeadlinePart>
                    ) : null}

                    <div className="flex min-w-0 flex-col gap-2">
                      {standing === null ? null : (
                        <DialogHeadlinePart as="span">
                          <Badge size="sm" tone={standing.tone}>
                            {standing.label}
                          </Badge>
                        </DialogHeadlinePart>
                      )}
                      <DialogHeadlinePart
                        as="h2"
                        isTitle
                        className={
                          title.logoUrl === null || unlettered === title.id
                            ? 'text-[clamp(1.75rem,5vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-on-scrim'
                            : 'flex'
                        }
                      >
                        {title.logoUrl === null || unlettered === title.id ? (
                          title.title
                        ) : (
                          <TitleLogo
                            src={title.logoUrl}
                            alt={title.title}
                            className="max-h-[20svh] w-auto max-w-[min(70vw,30rem)] object-contain object-left"
                            onError={() => {
                              setUnlettered(title.id);
                            }}
                          />
                        )}
                      </DialogHeadlinePart>

                      {going === null ? null : (
                        <DialogHeadlinePart>
                          <ProgressBar
                            label={say('common.howFarTitleHasDownloaded', { title: title.title })}
                            value={Math.round(going.progress * 1000) / 10}
                            className="max-w-md"
                            readout={
                              <DownloadProgressReadout
                                progress={going}
                                className="text-on-scrim/75"
                              />
                            }
                          />
                        </DialogHeadlinePart>
                      )}
                    </div>
                  </div>

                  {mainAction === null && actions.length === 0 ? null : (
                    <DialogHeadlinePart className="flex w-full flex-wrap items-center gap-3">
                      {mainAction === null ? null : (
                        <div className="w-full md:w-[21rem]">
                          {!isStreamable &&
                          mainAsk !== null &&
                          choices.length > 1 &&
                          mainAction.isDisabled !== true &&
                          !isAsking ? (
                            <ActionMenu
                              label={mainAction.label}
                              align="start"
                              look="play"
                              trigger={
                                <>
                                  <Icon of={mainAction.icon} size={18} />
                                  {mainAction.label}
                                  <Icon of={ChevronDownIcon} size={16} />
                                </>
                              }
                              groups={[
                                {
                                  name: say('common.quality'),
                                  items: choices.map((choice) => ({
                                    id: choice.id,
                                    label: choice.name,
                                    icon: <Icon of={iconOfQuality(choice.name)} size={18} />,
                                    onChoose: () => {
                                      send(
                                        { ...mainAsk.asked, profileId: choice.id },
                                        mainAsk.onAsked,
                                      );
                                    },
                                  })),
                                },
                              ]}
                            />
                          ) : (
                            <PlayWithRestart>
                              <Button
                                variant="confirm"
                                size="none"
                                className={PLAY_FACE}
                                disabled={mainAction.isDisabled === true}
                                isLoading={mainAction.isLoading === true}
                                onClick={() => {
                                  mainAction.onChoose?.();
                                }}
                              >
                                <Icon of={mainAction.icon} size={18} />
                                {mainAction.label}
                              </Button>
                            </PlayWithRestart>
                          )}
                        </div>
                      )}

                      {actions.length === 0 ? null : (
                        <RoundActions
                          label={say('screens.askableDialog.moreToDoWithThis')}
                          actions={actions}
                          isCompact
                          className="md:ms-auto"
                        />
                      )}
                    </DialogHeadlinePart>
                  )}

                  {note === null ? null : (
                    <DialogHeadlinePart as="span" className="text-sm font-medium text-on-scrim">
                      <span role="alert">{note}</span>
                    </DialogHeadlinePart>
                  )}
                </DialogHeadline>
              </TitleHero>

              <DialogHeadline className="grid gap-x-12 gap-y-5 px-1 pt-2 sm:px-2 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
                <div className="flex min-w-0 flex-col gap-4">
                  <DialogHeadlinePart className="flex flex-col gap-2.5">
                    <span className="text-base text-text-muted">
                      {[
                        title.rating === null || title.rating === undefined
                          ? null
                          : `★ ${title.rating.toFixed(1)}`,
                        describeAskableFacts({ ...title, genres: [] }),
                      ]
                        .filter((fact) => fact !== null && fact !== '')
                        .join(' · ')}
                    </span>

                    {title.certification === null ||
                    title.certification === undefined ||
                    title.certification === '' ||
                    title.certificationRegion === null ||
                    title.certificationRegion === undefined ? null : (
                      <span className="flex">
                        <AgeRating
                          certification={title.certification}
                          region={title.certificationRegion}
                        />
                      </span>
                    )}
                  </DialogHeadlinePart>

                  {whoElse === null && myProfileAsk === null ? null : (
                    <DialogHeadlinePart className="flex flex-col gap-1 text-sm text-text-muted">
                      {whoElse === null ? null : <span>{whoElse}</span>}
                      {myProfileAsk === null ? null : <span>{myProfileAsk}</span>}
                    </DialogHeadlinePart>
                  )}

                  {title.overview === null ? null : (
                    <DialogHeadlinePart>
                      <ReadMore
                        lines={5}
                        className="max-w-[65ch] whitespace-pre-line text-base leading-relaxed text-text"
                      >
                        {title.overview}
                      </ReadMore>
                    </DialogHeadlinePart>
                  )}
                </div>

                <DialogHeadlinePart className="flex flex-col gap-3 text-sm leading-relaxed">
                  {title.cast.length === 0 ? null : (
                    <p>
                      <span className="text-text-muted">{say('common.cast')}: </span>
                      <span className="text-text">
                        {title.cast
                          .slice(0, 3)
                          .map((member) => member.name)
                          .join(', ')}
                      </span>
                    </p>
                  )}

                  {title.genres.length === 0 ? null : (
                    <p>
                      <span className="text-text-muted">{say('common.genres')}: </span>
                      <span className="text-text">{title.genres.join(', ')}</span>
                    </p>
                  )}
                </DialogHeadlinePart>
              </DialogHeadline>

              <DialogSections isOpen className="flex flex-col gap-10 px-1 pb-8 pt-10 sm:px-2">
                {title.tracks.length === 0 ? null : (
                  <DialogSection heading={say('common.songs2')}>
                    <AlbumTracks tracks={title.tracks} label={title.label} />
                  </DialogSection>
                )}

                {isAddingSeasons ? (
                  <DialogSection>
                    <SeasonChooser
                      tmdbId={Number(title.id)}
                      seasons={adding}
                      onChange={setAdding}
                      followsNew={addsFollowing}
                      onFollowsNew={setAddsFollowing}
                      alreadyAsked={askedSeasons}
                      isFollowedAlready={isFollowedAlready}
                    />
                  </DialogSection>
                ) : !isAskable ? null : title.kind === 'series' ? (
                  <DialogSection>
                    <SeasonChooser
                      tmdbId={Number(title.id)}
                      seasons={seasons}
                      onChange={setSeasons}
                      followsNew={followsNew}
                      onFollowsNew={setFollowsNew}
                    />
                  </DialogSection>
                ) : title.kind === 'artist' ? (
                  <DialogSection>
                    <ReleaseTypeChooser value={releaseTypes} onChange={setReleaseTypes} />
                  </DialogSection>
                ) : title.kind === 'book' ? (
                  <DialogSection>
                    <BookFormatChooser value={bookFormats} onChange={setBookFormats} />
                    {title.series === null || title.series === undefined ? null : (
                      <Checkbox
                        label={say('screens.askableDialog.everyBookInSeries', {
                          series: title.series.name,
                        })}
                        description={say('screens.askableDialog.andItsNewBooks')}
                        checked={isWholeSeries}
                        onCheckedChange={setIsWholeSeries}
                      />
                    )}
                  </DialogSection>
                ) : null}

                {groupReleases(title.albums).map((group) => (
                  <DialogSection key={group.id} heading={group.title}>
                    <SlidingList
                      items={group.albums}
                      keyOf={(album) => album.id}
                      renderItem={(album) => (
                        <span className="group flex items-center gap-3 py-2">
                          <span className="relative size-12 shrink-0">
                            <MusicArtwork
                              src={album.coverUrl}
                              label={say('common.theCoverOfTitle', { title: album.title })}
                              className="size-12"
                            />
                            <span
                              className={cn(
                                'absolute inset-0 flex items-center justify-center rounded-md bg-shade/40 transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-out)] focus-within:opacity-100',
                                sample.heard === album.id || sample.finding === album.id
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover:opacity-100',
                              )}
                            >
                              <Button
                                isIconOnly
                                variant="overlay"
                                size="xs"
                                label={
                                  sample.heard === album.id
                                    ? say('screens.askableDialog.stopTheSampleOfTitle', {
                                        title: album.title,
                                      })
                                    : say('screens.askableDialog.playASampleOfTitle', {
                                        title: album.title,
                                      })
                                }
                                isActive={sample.heard === album.id}
                                isLoading={sample.finding === album.id}
                                onClick={() => {
                                  void sample.toggle(album.id, title.title, album.title);
                                }}
                              >
                                <Icon
                                  of={sample.heard === album.id ? StopFilledIcon : PlayFilledIcon}
                                  size={14}
                                />
                              </Button>
                            </span>
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm text-text">{album.title}</span>
                            <span className="text-xs text-text-muted">
                              {album.firstReleased?.slice(0, 4) ??
                                say('screens.askableDialog.noYearGiven')}
                            </span>
                          </span>
                          {!kinds.has('album') ? null : askedAlbums.has(album.id) ? (
                            <Badge size="sm" tone={STATUS_LOOK.queued.tone}>
                              {say('common.requested')}
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="xs"
                              isLoading={isAsking}
                              onClick={() => {
                                ask({ kind: 'album', musicBrainzId: album.id }, () => {
                                  setAskedAlbums(new Set([...askedAlbums, album.id]));
                                });
                              }}
                            >
                              {say('common.request')}
                            </Button>
                          )}
                        </span>
                      )}
                    />
                  </DialogSection>
                ))}

                {title.cast.length === 0 ? null : (
                  <DialogSection>
                    <CastGrid
                      members={title.cast.map((member) => ({
                        personId: member.personId,
                        name: member.name,
                        role: member.role ?? '',
                        imageUrl: member.photoUrl,
                      }))}
                      {...(onOpenPerson === undefined
                        ? {}
                        : {
                            onOpenPerson: (member: CastMember) => {
                              if (member.personId !== null && member.personId !== undefined) {
                                onOpenPerson(member.personId, member.role);
                              }
                            },
                          })}
                    />
                  </DialogSection>
                )}
              </DialogSections>
            </DialogArrival>
          </TintedGround>
        )}
      </DialogContent>

      <Dialog
        label={
          title === null
            ? say('common.trailer')
            : say('common.titleTheTrailer', { title: title.title })
        }
        isOpen={isWatchingTrailer && trailerKey !== null}
        className="sm:w-[min(64rem,94vw)]"
        onClose={() => {
          setIsWatchingTrailer(false);
        }}
      >
        <DialogContent className="p-0">
          {trailerKey === null ? null : (
            <EmbeddedVideo
              label={
                title === null
                  ? say('common.trailer')
                  : say('common.titleTheTrailer', { title: title.title })
              }
              src={catalogueTrailerUrl(trailerKey)}
            />
          )}
        </DialogContent>
      </Dialog>

      {title === null || !isStreamable ? null : (
        <ChooseSourceDialog
          title={title.title}
          isOpen={streaming.isPickerOpen}
          offers={streaming.offers.data}
          isLooking={streaming.isLooking}
          isFailed={streaming.isFailed}
          bestId={streaming.bestId}
          isPlaying={streaming.isStarting}
          problem={streaming.problem}
          onTryAgain={streaming.lookAgain}
          onChoose={streaming.choose}
          onClose={streaming.closePicker}
        />
      )}

      {title === null ? null : (
        <ChooseQualityDialog
          title={title.title}
          choices={choices}
          isOpen={choosing !== null}
          isAsking={isAsking}
          onChoose={(profileId) => {
            const waiting = choosing;

            setChoosing(null);

            if (waiting !== null) {
              send({ ...waiting.asked, profileId }, waiting.onAsked);
            }
          }}
          onClose={() => {
            setChoosing(null);
          }}
        />
      )}

      <ConfirmDialog
        title={
          title === null
            ? say('common.cancelThisRequest')
            : say('common.cancelTitle', { title: title.title })
        }
        detail={
          (request === null ? null : describeOthersStillWanting(askersOf(request), asMe)) ??
          say('common.itWillNotBeFetchedAnd')
        }
        confirmLabel={say('common.cancelRequest')}
        isDestructive
        isOpen={isCancelling}
        onClose={() => {
          setIsCancelling(false);
        }}
        onConfirm={() => {
          setIsCancelling(false);
          setProblem(null);

          if (request !== null) {
            void removeMediaRequest(request.id, true).then((refusal) => {
              if (refusal !== null) {
                setProblem(refusal.message);
              }

              void cache.invalidateQueries({ queryKey: requestsQueries.key });
            });
          }
        }}
      />
    </Dialog>
  );
};

AskableDialog.displayName = 'AskableDialog';

export { AskableDialog };
