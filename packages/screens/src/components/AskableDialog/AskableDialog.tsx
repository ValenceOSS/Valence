import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MusicNote as MusicNoteIcon, X as XIcon } from '@keyline-icons/react';
import { BackdropScrim } from '@ValenceUI/BackdropScrim';
import { DownloadProgressReadout } from '@ValenceScreens/components/DownloadProgressReadout/DownloadProgressReadout';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { askForMedia, removeMediaRequest } from '@ValenceClient/requests/fetchMediaRequests';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { RELEASE_TYPE_NAMES } from '@ValenceScreens/components/AdminArea/RELEASE_TYPE_NAMES';
import { CastGrid } from '@ValenceScreens/components/MediaDetailDialog/components/CastGrid/CastGrid';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { ReleaseTypeChooser } from '@ValenceScreens/components/ReleaseTypeChooser/ReleaseTypeChooser';
import { ChooseQualityDialog } from '@ValenceScreens/components/AskableDialog/components/ChooseQualityDialog/ChooseQualityDialog';
import { SeasonChooser } from '@ValenceScreens/components/SeasonChooser/SeasonChooser';
import { describeAskableFacts } from './describeAskableFacts';
import { describeStanding } from './describeStanding';
import { readAsking } from './readAsking';
import { progressOfRequest } from '@ValenceScreens/requests/progressOfRequest';
import type { CatalogueTitleDetail } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequestAsk, ReleaseType } from '@ValenceContracts/schemas/MediaRequest';
import type { AskableDialogProps } from './AskableDialog.types';
import { STATUS_LOOK } from '@ValenceScreens/status/STATUS_LOOK';

const FOLLOWED_EVERY_MS = 5000;

type Choosing = { asked: MediaRequestAsk; onAsked: () => void };

/**
 * What to ask for a title as it stands: a film as it is, a series with the seasons chosen, an
 * artist with the kinds of release chosen, an album as it is.
 *
 * @param title - The title.
 * @param seasons - The seasons chosen, for a series.
 * @param releaseTypes - The kinds of release chosen, for an artist.
 * @returns What to ask for.
 */
const askingFor = (
  title: CatalogueTitleDetail,
  seasons: number[] | null,
  releaseTypes: ReleaseType[],
): MediaRequestAsk =>
  isMusicRequest(title.kind)
    ? {
        kind: title.kind,
        musicBrainzId: title.musicBrainzId ?? title.id,
        ...(title.kind === 'artist' ? { releaseTypes } : {}),
      }
    : {
        kind: title.kind,
        tmdbId: Number(title.id),
        ...(title.kind === 'series' ? { seasons } : {}),
      };

/**
 * The page of a film, series, artist or album that can be asked for, opened from anywhere its
 * address names it: its artwork, what it is, who is in it, and where it stands — in the library
 * already, with a way to open it; somewhere along being fetched; or there to be asked for, with
 * the seasons of a series or the kinds of an artist's releases to choose. An artist's albums can be
 * asked for one at a time as well. Somebody's own request can be cancelled from here until it is in
 * the library, which deletes whatever it had started downloading.
 *
 * @param asking - The title the address names, as its kind and id, or nothing.
 * @param onClose - Called when it is dismissed.
 * @param onOpen - Called to open what is in the library already.
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
  const [releaseTypes, setReleaseTypes] = useState<ReleaseType[]>(['album']);
  const [isAsking, setIsAsking] = useState(false);
  const [askedAlbums, setAskedAlbums] = useState<ReadonlySet<string>>(new Set());
  const [problem, setProblem] = useState<string | null>(null);
  const title = found.data ?? null;
  const requestId = title?.standing.requestId ?? null;
  const requests = useQuery({ ...requestsQueries.mediaRequests(), enabled: requestId !== null });
  const request = requests.data?.find((one) => one.id === requestId) ?? null;
  const progress = useQuery(requestsQueries.requestProgress(request?.state === 'downloading'));
  const going = request === null ? null : progressOfRequest(request, progress.data ?? []);
  const me = useQuery(sessionQueries.who());
  const [isCancelling, setIsCancelling] = useState(false);
  const [choosing, setChoosing] = useState<Choosing | null>(null);
  const offered = useQuery(
    requestsQueries.profilesOnOffer(
      title !== null && isMusicRequest(title.kind) ? 'music' : 'video',
      title?.standing.status === 'askable',
    ),
  );
  const choices = offered.data?.forcedId === null ? offered.data.choices : [];
  const mayCancel =
    request !== null &&
    request.requestedBy.id === me.data?.id &&
    request.state !== 'filed' &&
    request.state !== 'available';
  const standing = title === null ? null : describeStanding(title.standing);
  const isReady =
    title !== null &&
    (seasons === null || seasons.length > 0) &&
    (title.kind !== 'artist' || releaseTypes.length > 0);

  const send = (asked: MediaRequestAsk, onAsked: () => void = () => undefined) => {
    setIsAsking(true);
    setProblem(null);

    void askForMedia(asked)
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(refusal?.message ?? 'That could not be asked for.');

          return;
        }

        onAsked();
        void cache.invalidateQueries({ queryKey: requestsQueries.key });
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
      label={title?.title ?? 'Something to ask for'}
      isOpen={named !== null}
      onClose={onClose}
      size="stage"
    >
      <DialogContent className="p-3 sm:p-4">
        {found.isError ? (
          <CouldNotRead
            what="This title"
            isTryingAgain={found.isFetching}
            onTryAgain={() => {
              void found.refetch();
            }}
          />
        ) : title === null ? (
          <Spinner isCentered label="Reading the catalogue" />
        ) : (
          <div className="flex flex-col gap-8">
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
                <Button isIconOnly variant="overlay" label="Close" onClick={onClose}>
                  <Icon of={XIcon} size={20} />
                </Button>
              </div>

              <div className="absolute inset-x-0 bottom-0 flex items-end gap-5 p-5 sm:p-8">
                {isMusicRequest(title.kind) ? (
                  <MusicArtwork
                    src={title.posterUrl}
                    label={`The cover of ${title.title}`}
                    shape={title.kind === 'artist' ? 'round' : 'square'}
                    isLifted
                    className="hidden w-32 sm:flex"
                  />
                ) : title.posterUrl === null ? null : (
                  <img
                    src={title.posterUrl}
                    alt=""
                    className="hidden aspect-[2/3] w-32 rounded-lg object-cover shadow-[var(--shadow-artwork)] sm:block"
                  />
                )}

                <div className="flex min-w-0 flex-col gap-2">
                  {standing === null ? null : (
                    <span>
                      <Badge size="sm" tone={standing.tone}>
                        {standing.label}
                      </Badge>
                    </span>
                  )}
                  <h2 className="text-[clamp(1.75rem,5vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-on-scrim">
                    {title.title}
                  </h2>
                  <span className="text-sm text-on-scrim/75">{describeAskableFacts(title)}</span>
                  {going === null ? null : (
                    <ProgressBar
                      label={`How much of ${title.title} has arrived`}
                      value={Math.round(going.progress * 1000) / 10}
                      className="max-w-md"
                      readout={
                        <DownloadProgressReadout progress={going} className="text-on-scrim/75" />
                      }
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-8 px-2 sm:px-4">
              {title.overview === null ? null : (
                <p className="max-w-[70ch] font-body text-sm leading-relaxed text-text-muted">
                  {title.overview}
                </p>
              )}

              {title.cast.length === 0 ? null : (
                <section aria-label="Cast" className="flex flex-col gap-3">
                  <CastGrid
                    members={title.cast.map((member) => ({
                      name: member.name,
                      role: member.role ?? '',
                      imageUrl: member.photoUrl,
                    }))}
                  />
                </section>
              )}

              {title.standing.status !== 'askable' ? null : title.kind === 'series' ? (
                <SeasonChooser tmdbId={Number(title.id)} seasons={seasons} onChange={setSeasons} />
              ) : title.kind === 'artist' ? (
                <ReleaseTypeChooser value={releaseTypes} onChange={setReleaseTypes} />
              ) : null}

              {title.albums.length === 0 ? null : (
                <section aria-label="Albums" className="flex flex-col gap-3">
                  <h3 className="text-xs uppercase tracking-[0.16em] text-text-muted">Albums</h3>
                  <ul className="flex flex-col gap-1">
                    {title.albums
                      .filter((album) => album.type !== null)
                      .toSorted((left, right) =>
                        (right.firstReleased ?? '').localeCompare(left.firstReleased ?? ''),
                      )
                      .map((album) => (
                        <li
                          key={album.id}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--surface-hover)]"
                        >
                          <Icon of={MusicNoteIcon} size={16} tone="muted" className="shrink-0" />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm text-text">{album.title}</span>
                            <span className="text-xs text-text-muted">
                              {[
                                album.type === null ? null : RELEASE_TYPE_NAMES[album.type].one,
                                album.firstReleased?.slice(0, 4) ?? null,
                              ]
                                .filter((part) => part !== null)
                                .join(' · ')}
                            </span>
                          </span>
                          {askedAlbums.has(album.id) ? (
                            <Badge size="sm" tone={STATUS_LOOK.queued.tone}>
                              Requested
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
                              Request
                            </Button>
                          )}
                        </li>
                      ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        )}
      </DialogContent>

      <DialogFooter
        note={problem}
        dismiss={{ onChoose: onClose }}
        confirm={
          title === null
            ? undefined
            : title.standing.status === 'library' && title.standing.mediaId !== null
              ? {
                  label: 'Open',
                  onChoose: () => {
                    onOpen(title.kind, title.standing.mediaId ?? '');
                  },
                }
              : title.standing.status === 'askable'
                ? {
                    label: title.kind === 'artist' ? 'Watch this artist' : 'Request',
                    isDisabled: !isReady,
                    isLoading: isAsking,
                    onChoose: () => {
                      ask(askingFor(title, seasons, releaseTypes));
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
            Cancel request
          </Button>
        ) : null}
      </DialogFooter>

      <ChooseQualityDialog
        title={title?.title ?? 'this'}
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

      <ConfirmDialog
        title={`Cancel ${title?.title ?? 'this request'}?`}
        detail="It will not be fetched, and whatever it had started downloading is deleted. You can ask for it again whenever you like."
        confirmLabel="Cancel request"
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
