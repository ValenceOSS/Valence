import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft as ChevronLeftIcon,
  MoreHorizontal as MoreHorizontalIcon,
} from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  Check as CheckFilledIcon,
  Pen as PenFilledIcon,
  Search as SearchFilledIcon,
  SearchList as SearchListFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { qualityStepOf } from '@ValenceCore/functions/qualityStepOf';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { catalogueArtUrl } from '@ValenceClient/requests/catalogueArtUrl';
import { downloadsOfHandOff } from '@ValenceClient/requests/downloadsOfHandOff';
import { downloadsOfRequest } from '@ValenceClient/requests/downloadsOfRequest';
import {
  approveMediaRequest,
  askForMedia,
  changeMediaRequest,
  decideNarration,
  decideProfileAsk,
  followRequestItems,
  fulfilMediaRequest,
  removeMediaRequest,
  retryMediaRequest,
  stopRequestDownload,
} from '@ValenceClient/requests/fetchMediaRequests';
import { watchDownloadQueue } from '@ValenceClient/requests/fetchDownloadQueue';
import { seasonsOfTitle } from '@ValenceClient/requests/seasonsOfTitle';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { nameSearchScope } from '@ValenceClient/requests/nameSearchScope';
import { FormattedBytes } from '@ValenceScreens/components/FormattedBytes/FormattedBytes';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { ApproveRequestDialog } from '@ValenceScreens/components/AdminArea/components/ApproveRequestDialog/ApproveRequestDialog';
import { RefuseRequestDialog } from '@ValenceScreens/components/AdminArea/components/RefuseRequestDialog/RefuseRequestDialog';
import { RequestBlocklistTab } from '@ValenceScreens/components/AdminArea/components/TitlePage/components/RequestBlocklistTab/RequestBlocklistTab';
import { RequestHistoryTab } from '@ValenceScreens/components/AdminArea/components/TitlePage/components/RequestHistoryTab/RequestHistoryTab';
import { InteractiveSearchDialog } from './components/InteractiveSearchDialog/InteractiveSearchDialog';
import { ItemList } from './components/ItemList/ItemList';
import { AskerStrip } from './components/AskerStrip/AskerStrip';
import { TrackTable } from './components/TrackTable/TrackTable';
import { FolderLink } from '@ValenceScreens/components/FolderLink/FolderLink';
import { folderOf } from '@ValenceScreens/components/AdminArea/components/MediaPanel/folderOf';
import { RemoveTitleDialog } from './components/RemoveTitleDialog/RemoveTitleDialog';
import { SeasonList } from './components/SeasonList/SeasonList';
import { StopDownloadDialog } from './components/StopDownloadDialog/StopDownloadDialog';
import { TitleDetails } from './components/TitleDetails/TitleDetails';
import { TitleHero } from './components/TitleHero/TitleHero';
import { TitleProgress } from './components/TitleProgress/TitleProgress';
import { ProfileAskCard } from './components/ProfileAskCard/ProfileAskCard';
import { NarrationAskCard } from './components/NarrationAskCard/NarrationAskCard';
import { HandedToNote } from './components/HandedToNote/HandedToNote';
import { askOfEntry } from './askOfEntry';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { RequestDownload } from '@ValenceClient/requests/downloadsOfRequest';
import type { TitleSeason } from '@ValenceClient/requests/seasonsOfTitle';
import type {
  DownloadStopNext,
  RequestItem,
  SearchScope,
} from '@ValenceContracts/schemas/MediaRequest';
import type { ActionMenuGroup } from '@ValenceUI/ActionMenu.types';
import type { TitleFact } from './components/TitleDetails/TitleDetails.types';
import type { TitlePageProps } from './TitlePage.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const ON_ITS_WAY_EVERY_MS = 5000;

const SECONDS_PER_MINUTE = 60;

/**
 * One title's page in the admin Catalogue: everything about it in one place, whether it was asked
 * for, is in the library, or both. Its hero says where it stands and what can be done — approve or
 * decline it, search for it, pick a release by hand, edit, follow, mark as added, or remove it. Then
 * how it is going, with one row for each download and a way to stop each; its seasons or albums,
 * each with a switch to follow it; its details and its files on disk; what it has done; and any
 * release it will not try again.
 *
 * A title nobody asked for can be followed from here, the whole of it or one season at a time.
 *
 * @param titleKey - Which title, by its Catalogue key.
 * @param onBack - Told to go back to the Catalogue.
 * @param onOpenFolder - Called with a folder to open in Files.
 */
const TitlePage = ({ titleKey, onBack, onOpenFolder }: TitlePageProps) => {
  const cache = useQueryClient();
  const catalogue = useQuery(requestsQueries.titleCatalogue());
  const requests = useQuery(requestsQueries.mediaRequests());
  const libraries = useQuery(libraryQueries.all());
  const admin = useQuery(adminQueries.overview());
  const entry = catalogue.data?.find((one) => one.key === titleKey) ?? null;
  const request =
    entry?.requestId === null || entry === null
      ? null
      : (requests.data?.find((one) => one.id === entry.requestId) ?? null);
  const kind = entry?.kind ?? 'film';
  const catalogueId = entry?.catalogueId ?? null;
  const isHeldOnDisk = kind === 'film' || kind === 'series' || kind === 'album' || kind === 'book';
  const facts = useQuery(requestsQueries.askable(kind, catalogueId));
  const files = useQuery(requestsQueries.titleFiles(kind, isHeldOnDisk ? catalogueId : null));
  const seasonList = useQuery(
    requestsQueries.seriesSeasons(
      kind === 'series' && catalogueId !== null && Number.isInteger(Number(catalogueId))
        ? Number(catalogueId)
        : null,
    ),
  );
  const handedTo = useQuery(
    requestsQueries.handedTo(request?.isHandedOff === true ? request.id : null),
  );
  const isMoving = entry?.status === 'downloading';
  const isThroughItsApp =
    request?.isHandedOff === true && admin.data?.settings.controlsConnectedApps === true;
  const isWatchingQueue = request !== null && !isThroughItsApp;
  const queue = useQuery(requestsQueries.downloadQueue());
  const inItsApp = useQuery({
    ...requestsQueries.handOffDownloads(isThroughItsApp ? request.id : null),
    refetchInterval: isMoving ? ON_ITS_WAY_EVERY_MS : false,
  });

  useEffect(() => {
    if (!isWatchingQueue) {
      return undefined;
    }

    void cache.invalidateQueries({ queryKey: requestsQueries.downloadQueue().queryKey });

    return watchDownloadQueue((next) => {
      cache.setQueryData(requestsQueries.downloadQueue().queryKey, next);
    });
  }, [cache, isWatchingQueue]);
  const [searching, setSearching] = useState<{ scope: SearchScope | null } | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [stopping, setStopping] = useState<RequestDownload | null>(null);

  const reread = async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: requestsQueries.titleCatalogue().queryKey }),
      cache.invalidateQueries({ queryKey: requestsQueries.mediaRequests().queryKey }),
      cache.invalidateQueries({ queryKey: requestsQueries.downloadQueue().queryKey }),
      ...(request === null
        ? []
        : [
            cache.invalidateQueries({
              queryKey: requestsQueries.handOffDownloads(request.id).queryKey,
            }),
          ]),
    ]);
  };

  const act = (doing: () => Promise<{ refusal: Refusal }>, done: string, failed: string) => {
    setIsBusy(true);

    void doing()
      .then(({ refusal }) => {
        if (refusal === null) {
          notify.worked(done);
        } else {
          notify.failed(refusal.message === '' ? failed : refusal.message);
        }
      })
      .then(reread)
      .finally(() => {
        setIsBusy(false);
      });
  };

  const downloads =
    request === null
      ? []
      : isThroughItsApp
        ? downloadsOfHandOff(request, inItsApp.data ?? [])
        : downloadsOfRequest(request, queue.data?.downloads ?? []);
  const seasons =
    kind === 'series'
      ? seasonsOfTitle(request, files.data?.files ?? [], seasonList.data ?? [])
      : [];

  if (catalogue.isPending) {
    return <Spinner isCentered size="sm" label={say('screens.adminArea.cataloguePanel.reading')} />;
  }

  if (entry === null) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-text-muted">
          {say('screens.adminArea.titlePage.thatTitleIsNoLongerHere')}
        </p>
        <Button variant="secondary" size="sm" onClick={onBack}>
          {say('screens.adminArea.titlePage.backToTheCatalogue')}
        </Button>
      </div>
    );
  }

  const failedToSay = say('screens.adminArea.titlePage.thatCouldNotBeDone');

  const follow = (seasonsAsked: number[] | null = null) => {
    const asked = askOfEntry(entry, seasonsAsked);

    if (asked !== null) {
      act(
        async () => ({ refusal: (await askForMedia(asked)).refusal }),
        say('screens.adminArea.titlePage.followingName', { name: entry.title }),
        failedToSay,
      );
    }
  };

  const followSeason = (season: TitleSeason, isFollowed: boolean) => {
    if (request === null) {
      if (isFollowed) {
        follow([season.season]);
      }

      return;
    }

    if (season.isAsked) {
      const itemIds = season.episodes.flatMap((episode) =>
        episode.itemId === null ? [] : [episode.itemId],
      );

      act(
        async () => ({
          refusal: (await followRequestItems(request.id, itemIds, isFollowed)).refusal,
        }),
        say(
          isFollowed
            ? 'screens.adminArea.titlePage.followingName'
            : 'screens.adminArea.titlePage.noLongerFollowingName',
          { name: nameSeason(season.season) },
        ),
        failedToSay,
      );

      return;
    }

    if (isFollowed) {
      const asked = new Set([
        ...(request.seasons ??
          seasons.filter((one) => one.season > 0 && one.isAsked).map((one) => one.season)),
        season.season,
      ]);

      act(
        async () => ({
          refusal: (
            await changeMediaRequest(request.id, {
              seasons: [...asked].toSorted((left, right) => left - right),
            })
          ).refusal,
        }),
        say('screens.adminArea.titlePage.followingName', { name: nameSeason(season.season) }),
        failedToSay,
      );
    }
  };

  const followItem = (item: RequestItem, isFollowed: boolean) => {
    if (request !== null) {
      act(
        async () => ({
          refusal: (await followRequestItems(request.id, [item.id], isFollowed)).refusal,
        }),
        say(
          isFollowed
            ? 'screens.adminArea.titlePage.followingName'
            : 'screens.adminArea.titlePage.noLongerFollowingName',
          { name: item.title },
        ),
        failedToSay,
      );
    }
  };

  const stop = (next: DownloadStopNext, isDeletingFiles: boolean) => {
    const download = stopping;

    if (request === null || download === null) {
      return;
    }

    setIsBusy(true);

    void stopRequestDownload(request.id, download.downloadId, { next, isDeletingFiles })
      .then(({ refusal }) => {
        if (refusal !== null) {
          notify.failed(refusal.message);

          return;
        }

        notify.worked(
          say('screens.adminArea.titlePage.stoppedTitle', { title: download.releaseTitle }),
        );
        setStopping(null);

        if (next === 'byHand') {
          setSearching({ scope: null });
        }
      })
      .then(reread)
      .finally(() => {
        setIsBusy(false);
      });
  };

  const remove = (isDeletingFiles: boolean) => {
    if (request === null) {
      return;
    }

    setIsBusy(true);

    void removeMediaRequest(request.id, true, isDeletingFiles)
      .then((refusal) => {
        if (refusal !== null) {
          notify.failed(refusal.message);

          return;
        }

        notify.worked(say('screens.adminArea.downloadsPanel.removedTitle', { title: entry.title }));
        setIsRemoving(false);
      })
      .then(reread)
      .finally(() => {
        setIsBusy(false);
      });
  };

  const menu: ActionMenuGroup[] =
    request === null
      ? []
      : [
          {
            items: [
              {
                id: 'edit',
                label: say('common.edit'),
                detail: say('screens.adminArea.titlePage.itsQualityLibraryAndSeasons'),
                icon: <Icon of={PenFilledIcon} size={15} />,
                onChoose: () => {
                  setIsEditing(true);
                },
              },
              {
                id: 'fulfil',
                label: say('screens.adminArea.titlePage.markAsAdded'),
                detail: say('screens.adminArea.titlePage.sayItIsHereAlready'),
                icon: <Icon of={CheckFilledIcon} size={15} />,
                isDisabled: request.approval !== 'approved' || entry.status === 'library',
                onChoose: () => {
                  act(
                    async () => ({ refusal: (await fulfilMediaRequest(request.id)).refusal }),
                    say('screens.adminArea.titlePage.markedTitleAsAdded', { title: entry.title }),
                    failedToSay,
                  );
                },
              },
            ],
          },
          {
            items: [
              {
                id: 'remove',
                label: say('screens.adminArea.titlePage.removeEllipsis'),
                icon: <Icon of={BinFilledIcon} size={15} />,
                isDestructive: true,
                onChoose: () => {
                  setIsRemoving(true);
                },
              },
            ],
          },
        ];

  const searchScope = (scope: SearchScope) => {
    if (request === null) {
      return;
    }

    act(
      async () => ({ refusal: (await retryMediaRequest(request.id, scope)).refusal }),
      say('screens.adminArea.titlePage.searchingForTitle', { title: nameSearchScope(scope) }),
      failedToSay,
    );
  };

  const canSearchByHand = request !== null && (request.isHandedOff !== true || isThroughItsApp);

  const actions =
    request === null ? (
      askOfEntry(entry) === null ? null : (
        <Button
          variant="confirm"
          size="md"
          isLoading={isBusy}
          onClick={() => {
            follow();
          }}
        >
          {say('common.follow')}
        </Button>
      )
    ) : (
      <>
        {request.approval === 'awaiting' ? (
          <>
            <Button
              variant="confirm"
              size="md"
              isLoading={isBusy}
              onClick={() => {
                act(
                  async () => ({ refusal: (await approveMediaRequest(request.id)).refusal }),
                  say('common.approvedTitle', { title: entry.title }),
                  failedToSay,
                );
              }}
            >
              {say('common.approve')}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setIsDeclining(true);
              }}
            >
              {say('screens.adminArea.titlePage.declineEllipsis')}
            </Button>
          </>
        ) : (
          <Button
            variant="confirm"
            size="md"
            isLoading={isBusy}
            onClick={() => {
              act(
                async () => ({ refusal: (await retryMediaRequest(request.id)).refusal }),
                say('screens.adminArea.titlePage.searchingForTitle', { title: entry.title }),
                failedToSay,
              );
            }}
          >
            <Icon of={SearchFilledIcon} size={15} />
            {say('screens.adminArea.titlePage.searchMissing')}
          </Button>
        )}

        {request.isHandedOff === true && !isThroughItsApp ? null : (
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setSearching({ scope: null });
            }}
          >
            <Icon of={SearchListFilledIcon} size={15} />
            {say('screens.adminArea.titlePage.interactiveSearch')}
          </Button>
        )}

        {menu
          .flatMap((group) => group.items)
          .map((item) => (
            <Button
              key={item.id}
              variant={item.isDestructive === true ? 'ghost' : 'secondary'}
              size="md"
              disabled={item.isDisabled === true}
              onClick={item.onChoose}
              className={cn(
                'hidden lg:inline-flex',
                item.isDestructive === true ? 'text-danger' : '',
              )}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}

        <ActionMenu
          label={say('common.actionsForTitle', { title: entry.title })}
          trigger={<Icon of={MoreHorizontalIcon} size={16} />}
          groups={menu}
          className="lg:hidden"
        />
      </>
    );

  const known = facts.data ?? null;
  const tracks = known?.tracks ?? [];
  const heroFacts = [
    ...(known?.genres.slice(0, 2) ?? []),
    ...(kind === 'film' && known?.runtimeMinutes !== null && known?.runtimeMinutes !== undefined
      ? [
          say('screens.adminArea.titlePage.minutesLong', {
            minutes: known.runtimeMinutes.toString(),
          }),
        ]
      : []),
    ...(kind === 'album' && tracks.length > 0
      ? [
          sayCount('common.count.tracks', tracks.length),
          say('screens.adminArea.titlePage.minutesLong', {
            minutes: Math.round(
              tracks.reduce((sum, track) => sum + (track.seconds ?? 0), 0) / SECONDS_PER_MINUTE,
            ).toString(),
          }),
        ]
      : []),
    ...(kind === 'series' && seasons.some((one) => one.season > 0)
      ? [sayCount('common.count.seasons', seasons.filter((one) => one.season > 0).length)]
      : []),
    ...(entry.total > 1
      ? [
          say('screens.adminArea.titlePage.heldOfTotal', {
            held: entry.held.toString(),
            total: entry.total.toString(),
          }),
        ]
      : []),
    ...(entry.subtitle === null ? [] : [entry.subtitle]),
  ];

  const libraryName =
    libraries.data?.find((one) => one.id === (request?.libraryId ?? entry.libraryId))?.name ?? null;
  const details: TitleFact[] = [
    ...(request === null
      ? []
      : [
          {
            label: say('common.quality'),
            value: request.profileName ?? say('common.theLibrarysOwnProfile'),
          },
          {
            label: say('screens.adminArea.titlePage.fetching'),
            value: request.isPickedByHand
              ? say('screens.adminArea.titlePage.onlyWhatYouPick')
              : say('screens.adminArea.titlePage.automatically'),
          },
        ]),
    ...(libraryName === null ? [] : [{ label: say('common.library'), value: libraryName }]),
    ...(files.data?.folder === null || files.data?.folder === undefined
      ? []
      : [
          {
            label: say('screens.observabilityPage.jobHistory.folder'),
            value:
              onOpenFolder === undefined ? (
                files.data.folder
              ) : (
                <FolderLink
                  shown={files.data.folder}
                  folder={files.data.folder}
                  onOpen={onOpenFolder}
                />
              ),
          },
        ]),
    ...(request === null
      ? []
      : [
          {
            label: say('screens.adminArea.mediaRequestsPanel.dateRequested'),
            value: new Date(request.createdAt).toLocaleDateString(undefined, {
              dateStyle: 'medium',
            }),
          },
        ]),
  ];

  const onDisk = files.data?.files ?? [];
  const sizeOnDisk = onDisk.reduce((sum, file) => sum + (file.sizeBytes ?? 0), 0);
  const best = onDisk
    .map((file) => ({
      height: file.height ?? 0,
      step: qualityStepOf({ width: file.width ?? 0, height: file.height ?? 0 }),
    }))
    .toSorted(
      (left, right) =>
        (right.step?.maxHeight ?? 0) - (left.step?.maxHeight ?? 0) || right.height - left.height,
    )[0];
  const tallest = best?.height ?? 0;
  const diskFacts: TitleFact[] = [
    { label: say('common.files'), value: onDisk.length.toString() },
    ...(sizeOnDisk === 0
      ? []
      : [{ label: say('common.size'), value: <FormattedBytes bytes={sizeOnDisk} /> }]),
    ...(tallest === 0
      ? []
      : [
          {
            label: say('screens.adminArea.askForMediaDialog.theBestByItsQuality'),
            value:
              best?.step?.label ??
              say('screens.adminArea.titlePage.heightP', { height: tallest.toString() }),
          },
        ]),
    ...(kind !== 'film' || onDisk[0] === undefined
      ? []
      : [
          {
            label: say('screens.adminArea.addLibraryDialog.path'),
            value:
              onOpenFolder === undefined ? (
                onDisk[0].path
              ) : (
                <FolderLink
                  shown={onDisk[0].path.split('/').at(-1) ?? onDisk[0].path}
                  folder={folderOf(onDisk[0].path)}
                  onOpen={onOpenFolder}
                />
              ),
          },
        ]),
  ];

  const artUrl = catalogueArtUrl(entry) ?? known?.posterUrl ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="self-start">
        <Icon of={ChevronLeftIcon} size={15} />
        {say('common.catalogue')}
      </Button>

      <TitleHero
        title={entry.title}
        year={entry.year}
        artUrl={artUrl}
        art={kind === 'artist' ? 'round' : kind === 'album' ? 'square' : 'poster'}
        backdropUrl={known?.backdropUrl ?? null}
        status={entry.status}
        facts={heroFacts}
        overview={known?.overview ?? null}
        askedBy={request === null ? null : <AskerStrip request={request} />}
        actions={actions}
      />

      {handedTo.data === null || handedTo.data === undefined ? null : (
        <HandedToNote handedTo={handedTo.data} />
      )}

      {request?.profileAsk === null || request?.profileAsk === undefined ? null : (
        <ProfileAskCard
          ask={request.profileAsk}
          currentName={request.profileName ?? null}
          isBusy={isBusy}
          canKeepBoth={request.kind === 'film'}
          onDecide={(choice) => {
            const named =
              choice === 'switch'
                ? (request.profileAsk?.profileName ?? say('common.aHigherProfile'))
                : (request.profileName ?? say('common.itsLibrarysProfile'));

            act(
              async () => ({ refusal: (await decideProfileAsk(request.id, { choice })).refusal }),
              choice === 'both'
                ? say('screens.adminArea.titlePage.gettingBothVersions')
                : choice === 'switch'
                  ? say('screens.adminArea.titlePage.switchedToProfile', { profile: named })
                  : say('screens.adminArea.titlePage.keptProfile', { profile: named }),
              failedToSay,
            );
          }}
        />
      )}

      {request?.isAskingNarration !== true ? null : (
        <NarrationAskCard
          title={request.title}
          narrations={request.narrations ?? []}
          isBusy={isBusy}
          onDecide={(asins) => {
            act(
              async () => ({ refusal: (await decideNarration(request.id, asins)).refusal }),
              say('screens.adminArea.titlePage.narrationAskCard.chose'),
              failedToSay,
            );
          }}
        />
      )}

      {request === null ? null : (
        <TitleProgress request={request} downloads={downloads} onStop={setStopping} />
      )}

      {kind === 'album' && tracks.length > 0 ? (
        <PanelCard title={say('screens.adminArea.titlePage.trackTable.tracks')} isFlush>
          <TrackTable
            tracks={tracks}
            files={files.data?.files ?? []}
            missing={entry.status === 'library' ? 'missing' : entry.status}
            {...(onOpenFolder === undefined ? {} : { onOpenFolder })}
          />
        </PanelCard>
      ) : null}

      {kind === 'series' && seasons.length > 0 ? (
        <SeasonList
          seasons={seasons}
          {...(request === null
            ? {}
            : {
                onSearch: searchScope,
                ...(canSearchByHand
                  ? {
                      onInteractiveSearch: (scope: SearchScope) => {
                        setSearching({ scope });
                      },
                    }
                  : {}),
              })}
          {...(onOpenFolder === undefined ? {} : { onOpenFolder })}
          isFollowing={isBusy}
          onFollow={followSeason}
          followsNew={
            request === null ? null : request.seasons === null || request.followsNewSeasons
          }
          onFollowsNew={(isOn) => {
            if (request !== null) {
              act(
                async () => ({
                  refusal: (await changeMediaRequest(request.id, { followsNewSeasons: isOn }))
                    .refusal,
                }),
                say(
                  isOn
                    ? 'screens.adminArea.titlePage.newSeasonsOfTitleAreFetched'
                    : 'screens.adminArea.titlePage.newSeasonsOfTitleAreNoLonger',
                  { title: request.title },
                ),
                failedToSay,
              );
            }
          }}
        />
      ) : null}

      {kind === 'artist' && request !== null && request.items.length > 0 ? (
        <ItemList
          title={say('common.albums')}
          request={request}
          items={request.items}
          isFollowing={isBusy}
          onFollow={followItem}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <TitleDetails
          title={say('common.details')}
          facts={details}
          {...(request === null
            ? {}
            : {
                action: {
                  label: say('common.edit'),
                  onPress: () => {
                    setIsEditing(true);
                  },
                },
              })}
        />

        {isHeldOnDisk ? (
          <TitleDetails title={say('screens.adminArea.titlePage.onDisk')} facts={diskFacts} />
        ) : null}
      </div>

      {request === null ? null : (
        <>
          <PanelCard title={say('screens.adminArea.adminSections.activity')}>
            <div className="max-h-96 overflow-y-auto">
              <RequestHistoryTab request={request} />
            </div>
          </PanelCard>

          <PanelCard title={say('screens.adminArea.requestDetailDialog.neverAgain')}>
            <RequestBlocklistTab
              request={request}
              onLifted={() => {
                void reread();
              }}
            />
          </PanelCard>
        </>
      )}

      <InteractiveSearchDialog
        request={searching === null ? null : request}
        scope={searching?.scope ?? null}
        onClose={() => {
          setSearching(null);
        }}
        onPicked={() => {
          void reread();
        }}
      />

      <StopDownloadDialog
        download={stopping}
        appName={isThroughItsApp ? (handedTo.data?.appName ?? null) : null}
        isStopping={isBusy}
        onClose={() => {
          setStopping(null);
        }}
        onStop={stop}
      />

      <RemoveTitleDialog
        title={isRemoving ? entry.title : null}
        isRemoving={isBusy}
        onClose={() => {
          setIsRemoving(false);
        }}
        onRemove={remove}
      />

      <RefuseRequestDialog
        request={isDeclining ? request : null}
        onClose={() => {
          setIsDeclining(false);
        }}
        onRefused={() => {
          void reread();
        }}
      />

      <ApproveRequestDialog
        request={isEditing ? request : null}
        isEditing
        onClose={() => {
          setIsEditing(false);
        }}
        onApproved={() => {
          void reread();
        }}
      />
    </div>
  );
};

TitlePage.displayName = 'TitlePage';

export { TitlePage };
