import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check as CheckIcon,
  ChevronRight as ChevronRightIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Plus as PlusIcon,
  X as XIcon,
  RefreshCw as RefreshCwIcon,
  Info as InfoIcon,
} from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  Check as CheckFilledIcon,
  ChevronRight as ChevronRightFilledIcon,
  Clock as ClockFilledIcon,
  HandPointerRight as HandPointerRightFilledIcon,
  RotateCw as RotateCwFilledIcon,
  Search as SearchFilledIcon,
  X as XFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Tabs } from '@ValenceUI/Tabs';
import { TabRow } from '@ValenceUI/TabRow';
import { TabPanel } from '@ValenceUI/TabPanel';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { cn } from '@ValenceUI/cn';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { FilterMenu } from '@ValenceUI/FilterMenu';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import {
  changeMediaRequest,
  decideMediaRequests,
  removeMediaRequest,
  fulfilMediaRequest,
  retryMediaRequest,
  searchMissing,
} from '@ValenceClient/requests/fetchMediaRequests';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { REQUEST_KIND_NAMES } from '@ValenceScreens/requests/REQUEST_KIND_NAMES';
import { AskForMediaDialog } from '@ValenceScreens/components/AdminArea/components/AskForMediaDialog/AskForMediaDialog';
import { ApproveRequestDialog } from '@ValenceScreens/components/AdminArea/components/ApproveRequestDialog/ApproveRequestDialog';
import { RefuseRequestDialog } from '@ValenceScreens/components/AdminArea/components/RefuseRequestDialog/RefuseRequestDialog';
import { RequestDetailDialog } from '@ValenceScreens/components/AdminArea/components/RequestDetailDialog/RequestDetailDialog';
import { describeRequestBadge } from '@ValenceClient/requests/describeRequestBadge';
import { describeRequestFilters } from '@ValenceScreens/requests/describeRequestFilters';
import { filterRequests } from '@ValenceScreens/requests/filterRequests';
import { describeRequestProgress } from '@ValenceClient/requests/describeRequestProgress';
import { describeItemBadge } from '@ValenceClient/requests/describeItemBadge';
import { describeSeasonBadge } from '@ValenceClient/requests/describeSeasonBadge';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { REQUEST_SHELVES, shelfOfRequest } from '@ValenceClient/requests/shelfOfRequest';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { AccountFace } from '@ValenceScreens/components/AdminArea/components/AccountsPanel/components/AccountFace/AccountFace';
import { MediaPoster } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaPoster/MediaPoster';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { RequestDetailTab } from '@ValenceScreens/components/AdminArea/components/RequestDetailDialog/RequestDetailDialog.types';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { MediaRequest, RequestItem } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestShelf } from '@ValenceClient/requests/shelfOfRequest';
import type { StateBadge } from '@ValenceClient/status/StateBadge';
import type { ActionMenuGroup } from '@ValenceUI/ActionMenu.types';
import type { RequestRow } from './RequestRow.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const IN_HAND = new Set<MediaRequest['state']>([
  'searching',
  'chosen',
  'downloading',
  'filing',
  'filed',
]);

const SHELF_NAMES: Record<RequestShelf | 'all', string> = {
  approve: say('screens.adminArea.mediaRequestsPanel.toApprove'),
  progress: say('common.inProgress'),
  coming: say('common.requested'),
  wanted: say('common.wanted'),
  here: say('common.available'),
  refused: say('common.refused'),
  all: say('common.all'),
};

/**
 * The rows beneath a request or a season: a series' seasons where it asks for more than one, each
 * holding its episodes, or the episodes or albums themselves where there is only one season or none.
 *
 * @param row - The row to open.
 * @returns The rows beneath it.
 */
const partsOf = (row: RequestRow): RequestRow[] => {
  const itemRow = (request: MediaRequest, item: RequestItem): RequestRow => ({
    kind: 'item',
    id: `item ${item.id}`,
    request,
    item,
  });

  if (row.kind === 'season') {
    return row.items.map((item) => itemRow(row.request, item));
  }

  if (row.kind === 'item' || (row.request.kind !== 'series' && row.request.kind !== 'artist')) {
    return [];
  }

  const bySeason = new Map<number, RequestItem[]>();

  for (const item of row.request.items) {
    if (item.season !== null) {
      bySeason.set(item.season, [...(bySeason.get(item.season) ?? []), item]);
    }
  }

  if (bySeason.size < 2) {
    return row.request.items.map((item) => itemRow(row.request, item));
  }

  return [...bySeason.entries()]
    .sort(([left], [right]) => left - right)
    .map(([season, items]) => ({
      kind: 'season',
      id: `season ${row.request.id} ${season.toString()}`,
      request: row.request,
      season,
      items,
    }));
};

/**
 * Says where a row has got to: a request as a whole, a season from its episodes, or one episode or
 * album on its own.
 *
 * @param row - The row.
 * @returns Its badge.
 */
const badgeOf = (row: RequestRow): StateBadge =>
  row.kind === 'request'
    ? describeRequestBadge(row.request)
    : row.kind === 'season'
      ? describeSeasonBadge(row.items)
      : describeItemBadge(row.item);

/**
 * Where an episode falls in its programme, as its row is numbered; an album has no number.
 *
 * @param item - The episode or album.
 * @param isInSeason - Whether it sits beneath its season's row, which already says the season.
 * @returns Such as "S1 E2" or "E2", or nothing.
 */
const describeItemNumber = (item: RequestItem, isInSeason: boolean): string =>
  item.season === null
    ? ''
    : `${isInSeason ? '' : `S${item.season.toString()} `}${item.episode === null ? '' : `E${item.episode.toString()}`}`.trim();

/**
 * The Requested page: every film, series, artist and album asked for, where each has got to —
 * waiting on approval, not out yet, wanted, downloading, filed or ready — and what can be done
 * with it: approving or refusing it, seeing every search it made and why, trying again what
 * failed, searching by hand to pick a release, and forgetting it. It is read again every few
 * seconds, so a request can be watched all the way into the library.
 *
 * Everything still wanted is searched for again every few hours by itself, and can be searched for
 * now from here.
 */
const MediaRequestsPanel = () => {
  const cache = useQueryClient();
  const requests = useQuery(requestsQueries.mediaRequests());
  const [isAsking, setIsAsking] = useState(false);
  const [refusing, setRefusing] = useState<MediaRequest | null>(null);
  const [approving, setApproving] = useState<MediaRequest | null>(null);
  const [removing, setRemoving] = useState<MediaRequest | null>(null);
  const [reading, setReading] = useState<{ request: MediaRequest; tab: RequestDetailTab } | null>(
    null,
  );
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [isDeciding, setIsDeciding] = useState(false);
  const [refusingChosen, setRefusingChosen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [said, setSaid] = useState<{ text: string; isProblem: boolean } | null>(null);
  const [isSearchingMissing, setIsSearchingMissing] = useState(false);
  const [filters, setFilters] = useState<ReadonlySet<string>>(new Set());
  const [search, setSearch] = useState('');
  const [chosenShelf, setChosenShelf] = useState<RequestShelf | 'all' | null>(null);
  const libraries = useQuery(libraryQueries.all());
  const accounts = useQuery(adminQueries.accounts());

  const reread = useCallback(
    () => cache.invalidateQueries({ queryKey: requestsQueries.mediaRequests().queryKey }),
    [cache],
  );

  const act = useCallback(
    (request: MediaRequest, doing: () => Promise<{ refusal: Refusal }>, done: string) => {
      setBusyId(request.id);
      setSaid(null);

      void doing()
        .then(({ refusal }) => {
          tellOutcome(done, failureOfRefusal(refusal));

          if (refusal !== null) {
            setSaid({ text: refusal.message, isProblem: true });
          }
        })
        .then(reread)
        .finally(() => {
          setBusyId(null);
        });
    },
    [reread],
  );

  const shown = useMemo(
    () => filterRequests(requests.data ?? [], filters, search),
    [requests.data, filters, search],
  );
  const filterGroups = useMemo(() => describeRequestFilters(requests.data ?? []), [requests.data]);

  const awaiting = useMemo(
    () => shown.filter((request) => request.approval === 'awaiting'),
    [shown],
  );
  const chosenAwaiting = useMemo(
    () => awaiting.filter((request) => chosen.has(request.id)),
    [awaiting, chosen],
  );

  const narrowTo = useCallback((next: ReadonlySet<string>) => {
    setFilters(next);
    setChosen(new Set());
  }, []);

  const searchFor = useCallback((next: string) => {
    setSearch(next);
    setChosen(new Set());
  }, []);

  const choose = useCallback((id: string, isChosen: boolean) => {
    setChosen((held) => {
      const next = new Set(held);

      if (isChosen) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }, []);

  const decide = useCallback(
    (decision: 'approve' | 'refuse', reason = '') => {
      const ids = chosenAwaiting.map((request) => request.id);

      if (ids.length === 0) {
        return;
      }

      setIsDeciding(true);
      setSaid(null);

      void decideMediaRequests(ids, decision, reason)
        .then(({ value, refusal }) => {
          if (value === null) {
            setSaid({
              text:
                refusal?.message ??
                say('screens.adminArea.mediaRequestsPanel.theyCouldNotBeDecided'),
              isProblem: true,
            });

            return;
          }

          setChosen(new Set());
          setSaid({
            text:
              value.refused.length === 0
                ? sayCount(
                    decision === 'approve'
                      ? 'screens.adminArea.mediaRequestsPanel.countApproved'
                      : 'screens.adminArea.mediaRequestsPanel.countRefused',
                    value.decided.length,
                  )
                : say('screens.adminArea.mediaRequestsPanel.lengthDoneLength2CouldNotBe', {
                    length: value.decided.length.toString(),
                    length2: value.refused.length.toString(),
                  }),
            isProblem: value.refused.length > 0,
          });
        })
        .then(reread)
        .finally(() => {
          setIsDeciding(false);
        });
    },
    [chosenAwaiting, reread],
  );

  const menuFor = useCallback(
    (request: MediaRequest): ActionMenuGroup[] => {
      const isApproved = request.approval === 'approved';

      return [
        {
          items: [
            ...(isApproved
              ? []
              : [
                  {
                    id: 'approve',
                    label: say('common.approve'),
                    detail: say('screens.adminArea.mediaRequestsPanel.lookItOverAndChangeIt'),
                    icon: <Icon of={CheckFilledIcon} size={15} />,
                    onChoose: () => {
                      setApproving(request);
                    },
                  },
                ]),
            ...(request.approval === 'refused'
              ? []
              : [
                  {
                    id: 'refuse',
                    label: say('common.refuse'),
                    icon: <Icon of={XFilledIcon} size={15} />,
                    onChoose: () => {
                      setRefusing(request);
                    },
                  },
                ]),
          ],
        },
        {
          items: [
            {
              id: 'open',
              label: say('common.open'),
              detail: say('screens.adminArea.mediaRequestsPanel.howItIsGoingWhatIt'),
              icon: <Icon of={ChevronRightFilledIcon} size={15} />,
              onChoose: () => {
                setReading({ request, tab: 'going' });
              },
            },
            {
              id: 'log',
              label: say('screens.adminArea.mediaRequestsPanel.seeWhatItHasDone'),
              detail: say('screens.adminArea.mediaRequestsPanel.everySearchWhatItFoundAnd'),
              icon: <Icon of={ClockFilledIcon} size={15} />,
              onChoose: () => {
                setReading({ request, tab: 'history' });
              },
            },
            {
              id: 'retry',
              label: say('screens.adminArea.mediaRequestsPanel.searchAgainNow'),
              detail: say('screens.adminArea.mediaRequestsPanel.triesAgainWhateverFailedToo'),
              icon: <Icon of={RotateCwFilledIcon} size={15} />,
              isDisabled: !isApproved || IN_HAND.has(request.state) || request.kind === 'book',
              onChoose: () => {
                act(
                  request,
                  () => retryMediaRequest(request.id),
                  say('screens.adminArea.mediaRequestsPanel.searchingAgainForTitle', {
                    title: request.title,
                  }),
                );
              },
            },
            {
              id: 'fulfil',
              label: say('screens.adminArea.mediaRequestsPanel.markAsAdded'),
              detail: say('screens.adminArea.mediaRequestsPanel.sayItHasBeenMetSuch'),
              icon: <Icon of={CheckFilledIcon} size={15} />,
              isDisabled: !isApproved || request.state === 'available',
              onChoose: () => {
                act(
                  request,
                  () => fulfilMediaRequest(request.id),
                  say('screens.adminArea.mediaRequestsPanel.markedTitleAsAdded', {
                    title: request.title,
                  }),
                );
              },
            },
            {
              id: 'releases',
              label: say('screens.adminArea.mediaRequestsPanel.pickARelease'),
              detail: say('screens.adminArea.mediaRequestsPanel.searchEveryIndexerAndChooseWhat'),
              icon: <Icon of={SearchFilledIcon} size={15} />,
              onChoose: () => {
                setReading({ request, tab: 'releases' });
              },
            },
            {
              id: 'picking',
              label: request.isPickedByHand
                ? say('screens.adminArea.mediaRequestsPanel.fetchTheBestByItself')
                : say('screens.adminArea.mediaRequestsPanel.onlyFetchWhatIPick'),
              detail: request.isPickedByHand
                ? say('screens.adminArea.mediaRequestsPanel.searchesForItAndFetchesThe')
                : say('screens.adminArea.mediaRequestsPanel.stopsSearchingForItByItself'),
              icon: <Icon of={HandPointerRightFilledIcon} size={15} />,
              onChoose: () => {
                act(
                  request,
                  () =>
                    changeMediaRequest(request.id, {
                      isPickedByHand: !request.isPickedByHand,
                    }),
                  request.isPickedByHand
                    ? say('screens.adminArea.mediaRequestsPanel.titleWillBeFetchedAutomatically', {
                        title: request.title,
                      })
                    : say('screens.adminArea.mediaRequestsPanel.titleWillOnlyBeFetchedWhen', {
                        title: request.title,
                      }),
                );
              },
            },
          ],
        },
        {
          items: [
            {
              id: 'remove',
              label: say('common.forget'),
              icon: <Icon of={BinFilledIcon} size={15} />,
              isDestructive: true,
              onChoose: () => {
                setRemoving(request);
              },
            },
          ],
        },
      ];
    },
    [act],
  );

  const approveNow = useCallback(
    (request: MediaRequest) => {
      act(
        request,
        async () => {
          const { value, refusal } = await decideMediaRequests([request.id], 'approve');

          return {
            refusal:
              refusal ??
              (value !== null && value.refused.length > 0
                ? {
                    message: say('screens.adminArea.mediaRequestsPanel.titleCouldNotBeApproved', {
                      title: request.title,
                    }),
                  }
                : null),
          };
        },
        say('common.approvedTitle', { title: request.title }),
      );
    },
    [act],
  );

  const byShelf = useMemo(() => {
    const counted = new Map<RequestShelf, MediaRequest[]>();

    for (const request of shown) {
      const shelf = shelfOfRequest(request);

      counted.set(shelf, [...(counted.get(shelf) ?? []), request]);
    }

    return counted;
  }, [shown]);

  const tabs = [
    'all' as const,
    ...REQUEST_SHELVES.filter(
      (shelf) => (byShelf.get(shelf) ?? []).length > 0 || shelf === chosenShelf,
    ),
  ];
  const shelf = chosenShelf ?? 'all';
  const travel = useTravelDirection(tabs, shelf);
  const accountsById = useMemo(
    () => new Map((accounts.data ?? []).map((account) => [account.id, account])),
    [accounts.data],
  );
  const libraryNames = useMemo(
    () => new Map((libraries.data ?? []).map((library) => [library.id, library.name])),
    [libraries.data],
  );

  const rows = useMemo(
    () =>
      (shelf === 'all' ? shown : (byShelf.get(shelf) ?? [])).map((request): RequestRow => ({
        kind: 'request',
        id: request.id,
        request,
      })),
    [byShelf, shelf, shown],
  );

  const holdsParts = rows.some((row) => partsOf(row).length > 0);

  const columns = useMemo<DataTableColumn<RequestRow>[]>(
    () => [
      ...(shelf === 'approve'
        ? [
            {
              id: 'chosen',
              header: () => (
                <Checkbox
                  label={say(
                    'screens.adminArea.mediaRequestsPanel.chooseAllLengthWaitingOnApproval',
                    { length: awaiting.length.toString() },
                  )}
                  isLabelHidden
                  checked={awaiting.length > 0 && chosenAwaiting.length === awaiting.length}
                  isMixed={chosenAwaiting.length > 0 && chosenAwaiting.length < awaiting.length}
                  onCheckedChange={(isChosen) => {
                    setChosen(
                      isChosen ? new Set(awaiting.map((request) => request.id)) : new Set(),
                    );
                  }}
                />
              ),
              enableSorting: false,
              meta: { shrinks: true },
              cell: ({ row }: { row: { original: RequestRow } }) =>
                row.original.kind === 'request' ? (
                  <Checkbox
                    label={say('screens.adminArea.mediaRequestsPanel.chooseTitle', {
                      title: row.original.request.title,
                    })}
                    isLabelHidden
                    checked={chosen.has(row.original.id)}
                    onCheckedChange={(isChosen) => {
                      choose(row.original.id, isChosen);
                    }}
                  />
                ) : null,
            } satisfies DataTableColumn<RequestRow>,
          ]
        : []),
      {
        id: 'title',
        header: say('common.name'),
        accessorFn: (entry) =>
          entry.kind === 'request'
            ? entry.request.title
            : entry.kind === 'season'
              ? String(entry.season).padStart(4, '0')
              : `${String(entry.item.season ?? 0).padStart(4, '0')}${String(entry.item.episode ?? 0).padStart(4, '0')}`,
        cell: ({ row }) => {
          const entry = row.original;
          const isOpen = row.getIsExpanded();

          if (entry.kind === 'item') {
            return (
              <span
                className={cn(
                  'flex min-w-0 items-center gap-3',
                  row.depth > 1 ? 'pl-[4.5rem]' : 'pl-9',
                )}
              >
                <span className="w-12 shrink-0 text-xs tabular-nums text-text-muted">
                  {describeItemNumber(entry.item, row.depth > 1)}
                </span>
                <span className="truncate text-sm text-text">{entry.item.title}</span>
              </span>
            );
          }

          if (entry.kind === 'season') {
            return (
              <span className="flex min-w-0 items-center gap-3 pl-9">
                <Button
                  variant="subtle"
                  size="none"
                  isIconOnly
                  label={say(
                    isOpen
                      ? 'screens.adminArea.mediaPanel.hideTheEpisodesInName'
                      : 'screens.adminArea.mediaPanel.showTheEpisodesInName',
                    { name: nameSeason(entry.season) },
                  )}
                  aria-expanded={isOpen}
                  onClick={() => {
                    row.toggleExpanded();
                  }}
                  className="size-6 shrink-0"
                >
                  <Icon
                    of={ChevronRightIcon}
                    size={15}
                    className={cn(
                      'transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)]',
                      'motion-reduce:transition-none',
                      isOpen ? 'rotate-90' : '',
                    )}
                  />
                </Button>

                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm text-text">{nameSeason(entry.season)}</span>
                  <span className="truncate text-xs text-text-muted">
                    {sayCount('common.count.episodes', entry.items.length)}
                  </span>
                </span>
              </span>
            );
          }

          const request = entry.request;
          const progress = describeRequestProgress(request);
          const goesTo = [libraryNames.get(request.libraryId) ?? null, request.profileName ?? null]
            .filter((part) => part !== null)
            .join(' · ');

          return (
            <span className="flex min-w-0 items-center gap-3">
              {!holdsParts ? null : row.getCanExpand() ? (
                <Button
                  variant="subtle"
                  size="none"
                  isIconOnly
                  label={say(
                    isOpen
                      ? 'screens.adminArea.mediaRequestsPanel.hideWhatTitleIsMadeOf'
                      : 'screens.adminArea.mediaRequestsPanel.showWhatTitleIsMadeOf',
                    { title: request.title },
                  )}
                  aria-expanded={isOpen}
                  onClick={() => {
                    row.toggleExpanded();
                  }}
                  className="size-6 shrink-0"
                >
                  <Icon
                    of={ChevronRightIcon}
                    size={15}
                    className={cn(
                      'transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)]',
                      'motion-reduce:transition-none',
                      isOpen ? 'rotate-90' : '',
                    )}
                  />
                </Button>
              ) : (
                <span className="size-6 shrink-0" />
              )}

              {isMusicRequest(request.kind) ? (
                <MusicArtwork
                  src={request.posterUrl}
                  label={say('common.theCoverOfTitle', { title: request.title })}
                  shape={request.kind === 'artist' ? 'round' : 'square'}
                  className="w-10"
                />
              ) : (
                <MediaPoster src={request.posterUrl} />
              )}

              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-text">{request.title}</span>

                  {request.year === null ? null : (
                    <span className="text-sm tabular-nums text-text-muted">{request.year}</span>
                  )}

                  <Badge size="sm">{REQUEST_KIND_NAMES[request.kind]}</Badge>
                </span>

                {progress === null ? null : (
                  <span className="truncate text-xs text-text-muted">{progress}</span>
                )}

                {goesTo === '' ? null : (
                  <span className="truncate text-xs text-text-muted">{goesTo}</span>
                )}
              </span>
            </span>
          );
        },
      },
      {
        id: 'requestedBy',
        header: say('screens.adminArea.mediaRequestsPanel.requestedBy'),
        accessorFn: (entry) => (entry.kind === 'request' ? entry.request.requestedBy.name : ''),
        cell: ({ row }) => {
          if (row.original.kind !== 'request') {
            return null;
          }

          const { requestedBy } = row.original.request;
          const account = accountsById.get(requestedBy.id) ?? null;

          return (
            <span className="flex min-w-0 items-center gap-2">
              {account === null ? (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle text-sm font-semibold text-text">
                  {(requestedBy.name.trim()[0] ?? '?').toUpperCase()}
                </span>
              ) : (
                <AccountFace account={account} />
              )}
              <span className="truncate text-sm text-text">{requestedBy.name}</span>
            </span>
          );
        },
      },
      {
        id: 'state',
        header: say('common.status'),
        accessorFn: (entry) => badgeOf(entry).label,
        cell: ({ row }) => {
          const badge = badgeOf(row.original);

          return (
            <span className="flex min-w-0 flex-col items-start gap-1">
              <Badge size="sm" tone={badge.tone}>
                {badge.label}
              </Badge>

              {badge.detail === null ? null : (
                <span className="break-words text-xs text-text-muted">{badge.detail}</span>
              )}

              <HowToFix href={badge.help} />
            </span>
          );
        },
      },
      {
        id: 'asked',
        header: say('screens.adminArea.mediaRequestsPanel.dateRequested'),
        accessorFn: (entry) => (entry.kind === 'request' ? entry.request.createdAt : ''),
        cell: ({ row }) =>
          row.original.kind === 'request' ? (
            <span className="whitespace-nowrap tabular-nums text-text-muted">
              {new Date(row.original.request.createdAt).toLocaleDateString(undefined, {
                dateStyle: 'medium',
              })}
            </span>
          ) : null,
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          if (row.original.kind !== 'request') {
            return null;
          }

          const request = row.original.request;

          return (
            <span className="flex items-center justify-end gap-1">
              {busyId === request.id ? (
                <Spinner label={say('common.workingOnTitle', { title: request.title })} size="sm" />
              ) : (
                <>
                  {request.approval !== 'awaiting' ? null : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        isIconOnly
                        label={say('screens.adminArea.mediaRequestsPanel.approveTitle', {
                          title: request.title,
                        })}
                        onClick={() => {
                          approveNow(request);
                        }}
                      >
                        <Icon of={CheckIcon} size={16} tone="success" />
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        isIconOnly
                        label={say('screens.adminArea.mediaRequestsPanel.refuseTitle', {
                          title: request.title,
                        })}
                        onClick={() => {
                          setRefusing(request);
                        }}
                      >
                        <Icon of={XIcon} size={16} tone="danger" />
                      </Button>
                    </>
                  )}

                  <ActionMenu
                    label={say('common.actionsForTitle', { title: request.title })}
                    trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                    groups={menuFor(request)}
                  />
                </>
              )}
            </span>
          );
        },
      },
    ],
    [
      approveNow,
      awaiting,
      busyId,
      choose,
      chosen,
      chosenAwaiting,
      accountsById,
      holdsParts,
      libraryNames,
      menuFor,
      shelf,
    ],
  );

  return (
    <Tabs
      value={shelf}
      onValueChange={(next) => {
        const found = tabs.find((one) => one === next);

        if (found !== undefined) {
          setChosenShelf(found);
          setChosen(new Set());
        }
      }}
    >
      <PanelCard
        title={say('common.requested')}
        isFlush
        below={
          <TabRow
            label={say('screens.adminArea.mediaRequestsPanel.whichRequests')}
            tone="underlined"
            size="sm"
            value={shelf}
            groups={[
              {
                items: tabs.map((one) => ({
                  id: one,
                  label:
                    one === 'all'
                      ? `${SHELF_NAMES.all} ${shown.length.toString()}`
                      : `${SHELF_NAMES[one]} ${(byShelf.get(one) ?? []).length.toString()}`,
                })),
              },
            ]}
          />
        }
        actions={
          <>
            <FilterMenu
              label={say('common.filterTheRequests')}
              groups={filterGroups}
              selected={filters}
              onChange={narrowTo}
            />

            <TextField
              label={say('common.searchTheRequests')}
              isLabelHidden
              size="sm"
              type="search"
              placeholder={say('common.aTitleOrWhoAsked')}
              value={search}
              onValueChange={searchFor}
              className="w-56 max-w-full"
            />

            <HoverCard
              side="bottom"
              align="end"
              detail={
                <p className="max-w-xs text-xs leading-relaxed">
                  {say('screens.adminArea.mediaRequestsPanel.everyFilmSeriesArtistAndAlbum')}
                </p>
              }
            >
              <Button
                variant="ghost"
                size="xs"
                isIconOnly
                label={say('screens.adminArea.mediaRequestsPanel.aboutThisList')}
                hasTooltip={false}
              >
                <Icon of={InfoIcon} size={16} />
              </Button>
            </HoverCard>

            <PanelCardAction
              icon={RefreshCwIcon}
              isLoading={isSearchingMissing}
              onClick={() => {
                setIsSearchingMissing(true);
                setSaid(null);

                void searchMissing()
                  .then(({ value, refusal }) => {
                    setSaid(
                      value === null
                        ? {
                            text:
                              refusal?.message ??
                              say('screens.adminArea.mediaRequestsPanel.theSearchCouldNotStart'),
                            isProblem: true,
                          }
                        : {
                            text:
                              value.searched === 0
                                ? say('screens.adminArea.mediaRequestsPanel.nothingIsMissing')
                                : sayCount(
                                    'screens.adminArea.mediaRequestsPanel.searchedAgainForCountRequests',
                                    value.searched,
                                  ),
                            isProblem: false,
                          },
                    );
                  })
                  .then(reread)
                  .finally(() => {
                    setIsSearchingMissing(false);
                  });
              }}
            >
              {say('screens.adminArea.mediaRequestsPanel.refetchMedia')}
            </PanelCardAction>

            <PanelCardAction
              icon={PlusIcon}
              onClick={() => {
                setIsAsking(true);
              }}
            >
              {say('common.requestMedia')}
            </PanelCardAction>
          </>
        }
      >
        <AskForMediaDialog
          isOpen={isAsking}
          onClose={() => {
            setIsAsking(false);
          }}
          onAsked={() => {
            void reread();
          }}
        />

        <RefuseRequestDialog
          request={refusing}
          onClose={() => {
            setRefusing(null);
          }}
          onRefused={() => {
            void reread();
          }}
        />

        <ApproveRequestDialog
          request={approving}
          onClose={() => {
            setApproving(null);
          }}
          onApproved={() => {
            void reread();
          }}
        />

        <RequestDetailDialog
          request={reading?.request ?? null}
          openOn={reading?.tab ?? 'going'}
          onClose={() => {
            setReading(null);
          }}
          onChanged={() => {
            void reread();
          }}
        />

        <RefuseRequestDialog
          request={refusingChosen ? (chosenAwaiting[0] ?? null) : null}
          howMany={chosenAwaiting.length}
          onClose={() => {
            setRefusingChosen(false);
          }}
          onRefused={() => {
            void reread();
          }}
          onRefuseMany={(reason) => {
            setRefusingChosen(false);
            decide('refuse', reason);
          }}
        />

        <ConfirmDialog
          title={
            removing === null
              ? say('screens.adminArea.mediaRequestsPanel.forgetThisRequest')
              : say('common.forgetTitle', { title: removing.title })
          }
          detail={say('screens.adminArea.mediaRequestsPanel.nothingMoreIsFetchedForIt')}
          confirmLabel={say('common.forget')}
          isDestructive
          isOpen={removing !== null}
          onClose={() => {
            setRemoving(null);
          }}
          onConfirm={() => {
            const gone = removing;

            setRemoving(null);

            if (gone !== null) {
              act(
                gone,
                async () => ({ refusal: await removeMediaRequest(gone.id) }),
                say('screens.adminArea.mediaRequestsPanel.forgotTitle', { title: gone.title }),
              );
            }
          }}
        />

        {said === null ? null : (
          <p
            role={said.isProblem ? 'alert' : 'status'}
            className={`px-4 pt-3 text-sm ${said.isProblem ? 'text-danger' : 'text-text-muted'}`}
          >
            {said.text}
          </p>
        )}

        {requests.isError ? (
          <CouldNotRead
            said={say('common.theRequestsCouldNotBeRead')}
            isTryingAgain={requests.isFetching}
            onTryAgain={() => {
              void requests.refetch();
            }}
          />
        ) : requests.isPending ? (
          <Spinner isCentered label={say('common.readingTheRequests')} size="sm" />
        ) : (
          tabs.map((one) => (
            <TabPanel key={one} value={one} travel={travel}>
              <DataTable
                label={say('screens.adminArea.mediaRequestsPanel.requestsSHELFNAMES', {
                  SHELF_NAMES: SHELF_NAMES[one],
                })}
                columns={columns}
                rows={one === shelf ? rows : []}
                getRowId={(row) => row.id}
                getSubRows={(row) => {
                  const parts = partsOf(row);

                  return parts.length === 0 ? undefined : parts;
                }}
                height="fills"
                toolbar={
                  one !== 'approve' ? undefined : (
                    <div className="mr-auto flex flex-wrap items-center gap-3">
                      <span className="text-sm text-text-muted">
                        {chosenAwaiting.length === 0
                          ? say('screens.adminArea.mediaRequestsPanel.lengthWaitingOnApproval', {
                              length: awaiting.length.toString(),
                            })
                          : sayCount(
                              'screens.adminArea.mediaRequestsPanel.countChosen',
                              chosenAwaiting.length,
                            )}
                      </span>

                      {chosenAwaiting.length === 0 ? null : (
                        <>
                          <Button
                            variant="secondary"
                            size="xs"
                            isLoading={isDeciding}
                            onClick={() => {
                              decide('approve');
                            }}
                          >
                            {say('screens.adminArea.mediaRequestsPanel.approveThem')}
                          </Button>

                          <Button
                            variant="ghost"
                            size="xs"
                            disabled={isDeciding}
                            onClick={() => {
                              setRefusingChosen(true);
                            }}
                          >
                            {say('screens.adminArea.mediaRequestsPanel.refuseThem')}
                          </Button>
                        </>
                      )}
                    </div>
                  )
                }
                emptyMessage={
                  requests.data.length === 0
                    ? say('screens.adminArea.mediaRequestsPanel.nothingHasBeenRequestedYetRequest')
                    : say('screens.adminArea.mediaRequestsPanel.nothingMatchesClearTheFiltersOr')
                }
              />
            </TabPanel>
          ))
        )}
      </PanelCard>
    </Tabs>
  );
};

MediaRequestsPanel.displayName = 'MediaRequestsPanel';

export { MediaRequestsPanel };
