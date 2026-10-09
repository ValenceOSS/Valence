import { DEFAULT_RELEASE_TYPES } from '@ValenceContracts/schemas/MediaRequest';
import { useEffect, useState } from 'react';
import { Stop as StopFilledIcon } from '@keyline-icons/react/fill';
import { useSample } from '@ValenceScreens/requests/useSample';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MusicNote as MusicNoteIcon, Tape as TapeIcon, X as XIcon } from '@keyline-icons/react';
import { BackdropScrim } from '@ValenceUI/BackdropScrim';
import { DownloadProgressReadout } from '@ValenceScreens/components/DownloadProgressReadout/DownloadProgressReadout';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Dialog } from '@ValenceUI/Dialog';
import { EmbeddedVideo } from '@ValenceUI/EmbeddedVideo';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Spinner } from '@ValenceUI/Spinner';
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
import { isAskedBy } from '@ValenceContracts/functions/isAskedBy';
import { askingFor } from '@ValenceClient/requests/askingFor';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import { seasonsWithItemsOf } from '@ValenceClient/requests/seasonsWithItemsOf';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { CastGrid } from '@ValenceScreens/components/MediaDetailDialog/components/CastGrid/CastGrid';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { ReleaseTypeChooser } from '@ValenceScreens/components/ReleaseTypeChooser/ReleaseTypeChooser';
import { BookFormatChooser } from '@ValenceScreens/components/BookFormatChooser/BookFormatChooser';
import { ChooseQualityDialog } from '@ValenceScreens/components/AskableDialog/components/ChooseQualityDialog/ChooseQualityDialog';
import { SeasonChooser } from '@ValenceScreens/components/SeasonChooser/SeasonChooser';
import { describeAskableFacts } from '@ValenceClient/requests/describeAskableFacts';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import { readAsking } from './readAsking';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { catalogueTrailerUrl } from '@ValenceScreens/library/catalogueTrailerUrl';
import { groupReleases } from '@ValenceScreens/requests/groupReleases';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { DialogSections } from '@ValenceScreens/components/DialogSections/DialogSections';
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
import type { AskableDialogProps } from './AskableDialog.types';
import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';
import { say } from '@ValenceI18n/say';

const FOLLOWED_EVERY_MS = 5000;

type Choosing = { asked: MediaRequestAsk; onAsked: () => void };

/**
 * The page of a film, series, artist or album that can be asked for, opened from anywhere its
 * address names it: its artwork, what it is, who is in it, and where it stands — in the library
 * already, with a way to open it; somewhere along being fetched; or there to be asked for, with
 * the seasons of a series or the kinds of an artist's releases to choose. A series already asked
 * for can have more seasons added. An artist's albums can be asked for one at a time as well. Somebody's own request can be cancelled from here until it is in
 * the library, which deletes whatever it had started downloading.
 *
 * @param asking - The title the address names, as its kind and id, or nothing.
 * @param onClose - Called when it is dismissed.
 * @param onOpen - Called to open what is in the library already, in its place of asking — a title
 *   the library holds is not asked about, but opened as it would be anywhere else, unless the
 *   address asks for more of it, as a show's Request more does: then its seasons are offered, those
 *   held whole locked, and only what is missing is fetched.
 */
const AskableDialog = ({ asking, onClose, onOpen }: AskableDialogProps) => {
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
  const [isAsking, setIsAsking] = useState(false);
  const [askingElsewhere, setAskingElsewhere] = useState<string | null>(null);
  const faces = useQuery(linkingQueries.faces());
  const [askedAlbums, setAskedAlbums] = useState<ReadonlySet<string>>(new Set());
  const [problem, setProblem] = useState<string | null>(null);
  const title = found.data ?? null;
  const heldKind = title?.kind ?? null;
  const isMore = named?.isMore === true;
  const heldId = !isMore && title?.standing.status === 'library' ? title.standing.mediaId : null;
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
  const me = useQuery(sessionQueries.who());
  const [isCancelling, setIsCancelling] = useState(false);
  const [choosing, setChoosing] = useState<Choosing | null>(null);
  const [isWatchingTrailer, setIsWatchingTrailer] = useState(false);
  const trailerKey = title?.trailerKey ?? null;
  const offered = useQuery(requestsQueries.profilesOnOffer(title?.kind ?? 'film', isAskable));
  const choices = offered.data?.forcedId === null ? offered.data.choices : [];
  const mayCancel =
    request !== null &&
    isAskedBy(request, me.data?.id) &&
    request.state !== 'filed' &&
    request.state !== 'available';
  const standing = title === null ? null : describeStanding(title.standing);
  const whoElse =
    title === null ? null : describeWhoElseAsked(title.standing.askedBy ?? [], me.data?.id);
  const myProfileAsk = request === null ? null : describeMyProfileAsk(request, me.data?.id);
  const isJoinable =
    title !== null && !isUnrequestable && mayJoinRequest(title.standing, me.data?.id);
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

  return (
    <Dialog
      label={title?.title ?? say('screens.askableDialog.somethingToAskFor')}
      isOpen={named !== null && heldId === null && (title !== null || !found.isPending)}
      onClose={onClose}
      size="stage"
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
          <Spinner isCentered label={say('common.readingTheCatalogue')} />
        ) : (
          <DialogArrival key={`${title.kind}:${title.id}`} className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-2xl">
              <div className="relative h-[34vh] min-h-[14rem] sm:h-[22rem]">
                {title.backdropUrl === null ? (
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
                )}
                <BackdropScrim />
              </div>

              <div className="absolute right-4 top-4">
                <Button isIconOnly variant="overlay" label={say('common.close')} onClick={onClose}>
                  <Icon of={XIcon} size={20} />
                </Button>
              </div>

              <DialogHeadline className="absolute inset-x-0 bottom-0 flex items-end gap-5 p-5 sm:p-8">
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
                ) : title.posterUrl === null ? null : (
                  <DialogHeadlinePart className="hidden w-32 sm:block">
                    <img
                      src={title.posterUrl}
                      alt=""
                      className="aspect-[2/3] w-full rounded-lg object-cover shadow-[var(--shadow-artwork)]"
                    />
                  </DialogHeadlinePart>
                )}

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
                    className="text-[clamp(1.75rem,5vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-on-scrim"
                  >
                    {title.title}
                  </DialogHeadlinePart>
                  <DialogHeadlinePart as="span" className="text-sm text-on-scrim/75">
                    {describeAskableFacts(title)}
                  </DialogHeadlinePart>
                  {whoElse === null ? null : (
                    <DialogHeadlinePart as="span" className="text-sm text-on-scrim/75">
                      {whoElse}
                    </DialogHeadlinePart>
                  )}
                  {myProfileAsk === null ? null : (
                    <DialogHeadlinePart as="span" className="text-sm text-on-scrim/75">
                      {myProfileAsk}
                    </DialogHeadlinePart>
                  )}

                  {going === null ? null : (
                    <DialogHeadlinePart>
                      <ProgressBar
                        label={say('common.howFarTitleHasDownloaded', { title: title.title })}
                        value={Math.round(going.progress * 1000) / 10}
                        className="max-w-md"
                        readout={
                          <DownloadProgressReadout progress={going} className="text-on-scrim/75" />
                        }
                      />
                    </DialogHeadlinePart>
                  )}
                </div>
              </DialogHeadline>
            </div>

            <DialogSections className="flex flex-col gap-3 pb-4">
              {title.overview === null ? null : (
                <DialogSection heading={say('common.synopsis')}>
                  <p className="max-w-[70ch] text-[0.95rem] leading-relaxed text-text">
                    {title.overview}
                  </p>
                </DialogSection>
              )}

              {title.cast.length === 0 ? null : (
                <DialogSection>
                  <CastGrid
                    members={title.cast.map((member) => ({
                      name: member.name,
                      role: member.role ?? '',
                      imageUrl: member.photoUrl,
                    }))}
                  />
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
                </DialogSection>
              ) : null}

              {groupReleases(title.albums).map((group) => (
                <DialogSection key={group.id} heading={group.title}>
                  <ul className="flex flex-col gap-1">
                    {group.albums.map((album) => (
                      <li
                        key={album.id}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--surface-hover)]"
                      >
                        <Button
                          isIconOnly
                          variant="ghost"
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
                          className="shrink-0"
                        >
                          <Icon
                            of={sample.heard === album.id ? StopFilledIcon : MusicNoteIcon}
                            size={16}
                            tone={sample.heard === album.id ? 'inherit' : 'muted'}
                          />
                        </Button>
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
                      </li>
                    ))}
                  </ul>
                </DialogSection>
              ))}
            </DialogSections>
          </DialogArrival>
        )}
      </DialogContent>

      <DialogFooter
        note={
          problem ??
          (isUnrequestable && title.standing.status === 'askable'
            ? say('common.noLibraryTakesRequestsForThis')
            : null)
        }
        {...(trailerKey === null
          ? {}
          : {
              lead: (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsWatchingTrailer(true);
                  }}
                >
                  <Icon of={TapeIcon} size={16} />
                  {say('common.watchTheTrailer')}
                </Button>
              ),
            })}
        dismiss={{ onChoose: onClose }}
        confirm={
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
                      ask(askingFor(title, seasons, releaseTypes, followsNew, bookFormats));
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
                    : undefined
        }
      >
        {mayCancel ? (
          <Button
            variant="ghost"
            onClick={() => {
              setIsCancelling(true);
            }}
          >
            {say('common.cancelRequest')}
          </Button>
        ) : null}

        {title === null || !isAskable || (title.kind !== 'film' && title.kind !== 'series')
          ? null
          : (faces.data ?? [])
              .filter((server) => server.takesRequests && server.isReachable)
              .map((server) => (
                <Button
                  key={server.id}
                  variant="ghost"
                  disabled={!isReady}
                  isLoading={askingElsewhere === server.id}
                  onClick={() => {
                    setAskingElsewhere(server.id);

                    void askLinkedServer(
                      server.id,
                      askingFor(title, seasons, releaseTypes, followsNew, bookFormats),
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
                  }}
                >
                  {say('common.askName', { name: server.name })}
                </Button>
              ))}

        {title !== null && isElsewhere && isAskable ? (
          <Button
            variant="secondary"
            disabled={!isReady}
            isLoading={isAsking}
            onClick={() => {
              ask(askingFor(title, seasons, releaseTypes, followsNew, bookFormats));
            }}
          >
            {say('common.requestHere')}
          </Button>
        ) : null}
      </DialogFooter>

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
          (request === null ? null : describeOthersStillWanting(askersOf(request), me.data?.id)) ??
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
