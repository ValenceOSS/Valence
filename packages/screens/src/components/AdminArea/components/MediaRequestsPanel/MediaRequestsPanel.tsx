import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MoreHorizontal as MoreHorizontalIcon,
  Plus as PlusIcon,
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
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { RequestDetailTab } from '@ValenceScreens/components/AdminArea/components/RequestDetailDialog/RequestDetailDialog.types';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const IN_HAND = new Set<MediaRequest['state']>([
  'searching',
  'chosen',
  'downloading',
  'filing',
  'filed',
]);

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

  const awaiting = (requests.data ?? []).filter((request) => request.approval === 'awaiting');
  const chosenAwaiting = awaiting.filter((request) => chosen.has(request.id));

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
      const ids = [...chosen];

      if (ids.length === 0) {
        return;
      }

      setIsDeciding(true);
      setSaid(null);

      void decideMediaRequests(ids, decision, reason)
        .then(({ value, refusal }) => {
          if (value === null) {
            setSaid({
              text: refusal?.message ?? say('admin.mediaRequestsPanel.couldNotDecide'),
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
                      ? 'admin.mediaRequestsPanel.approvedCount'
                      : 'admin.mediaRequestsPanel.refusedCount',
                    value.decided.length,
                  )
                : say('admin.mediaRequestsPanel.someDecided', {
                    done: value.decided.length,
                    failed: value.refused.length,
                  }),
            isProblem: value.refused.length > 0,
          });
        })
        .then(reread)
        .finally(() => {
          setIsDeciding(false);
        });
    },
    [chosen, reread],
  );

  const columns = useMemo<DataTableColumn<MediaRequest>[]>(
    () => [
      {
        id: 'chosen',
        header: '',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.approval === 'awaiting' ? (
            <Checkbox
              label={say('admin.mediaRequestsPanel.choose', { title: row.original.title })}
              checked={chosen.has(row.original.id)}
              onCheckedChange={(isChosen) => {
                choose(row.original.id, isChosen);
              }}
            />
          ) : null,
      },
      {
        id: 'title',
        header: say('admin.mediaRequestsPanel.askedForHeader'),
        accessorFn: (request) => request.title,
        cell: ({ row }) => {
          const progress = describeRequestProgress(row.original);

          return (
            <span className="flex min-w-0 items-start gap-3">
              {isMusicRequest(row.original.kind) ? (
                <MusicArtwork
                  src={row.original.posterUrl}
                  label={say('admin.mediaRequestsPanel.coverOf', { title: row.original.title })}
                  shape={row.original.kind === 'artist' ? 'round' : 'square'}
                  className="w-9"
                />
              ) : (
                <span className="aspect-[2/3] w-9 shrink-0 overflow-hidden rounded-md bg-surface-raised">
                  {row.original.posterUrl === null ? null : (
                    <img
                      src={row.original.posterUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>
              )}

              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-text">
                    {row.original.year === null
                      ? row.original.title
                      : say('admin.mediaRequestsPanel.titleAndYear', {
                          title: row.original.title,
                          year: row.original.year,
                        })}
                  </span>
                  <Badge size="sm">{REQUEST_KIND_NAMES[row.original.kind]}</Badge>
                </span>

                {progress === null ? null : (
                  <span className="truncate text-xs text-text-muted">{progress}</span>
                )}

                <span className="truncate text-xs text-text-muted">
                  {say('admin.mediaRequestsPanel.askedForBy', {
                    name: row.original.requestedBy.name,
                  })}
                </span>
              </span>
            </span>
          );
        },
      },
      {
        id: 'state',
        header: say('admin.mediaRequestsPanel.whereItIsHeader'),
        accessorFn: (request) => describeRequestBadge(request).label,
        cell: ({ row }) => {
          const badge = describeRequestBadge(row.original);

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
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const request = row.original;
          const isApproved = request.approval === 'approved';

          return (
            <span className="flex justify-end">
              {busyId === request.id ? (
                <Spinner
                  label={say('admin.mediaRequestsPanel.workingOn', { title: request.title })}
                  size="sm"
                />
              ) : (
                <ActionMenu
                  label={say('admin.mediaRequestsPanel.actionsFor', { title: request.title })}
                  trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                  groups={[
                    {
                      items: [
                        ...(isApproved
                          ? []
                          : [
                              {
                                id: 'approve',
                                label: say('admin.mediaRequestsPanel.approve'),
                                detail: say('admin.mediaRequestsPanel.approveDetail'),
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
                                label: say('admin.mediaRequestsPanel.refuse'),
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
                          label: say('admin.mediaRequestsPanel.open'),
                          detail: say('admin.mediaRequestsPanel.openDetail'),
                          icon: <Icon of={ChevronRightFilledIcon} size={15} />,
                          onChoose: () => {
                            setReading({ request, tab: 'going' });
                          },
                        },
                        {
                          id: 'log',
                          label: say('admin.mediaRequestsPanel.log'),
                          detail: say('admin.mediaRequestsPanel.logDetail'),
                          icon: <Icon of={ClockFilledIcon} size={15} />,
                          onChoose: () => {
                            setReading({ request, tab: 'history' });
                          },
                        },
                        {
                          id: 'retry',
                          label: say('admin.mediaRequestsPanel.retry'),
                          detail: say('admin.mediaRequestsPanel.retryDetail'),
                          icon: <Icon of={RotateCwFilledIcon} size={15} />,
                          isDisabled:
                            !isApproved || IN_HAND.has(request.state) || request.kind === 'book',
                          onChoose: () => {
                            act(
                              request,
                              () => retryMediaRequest(request.id),
                              say('admin.mediaRequestsPanel.retrying', { title: request.title }),
                            );
                          },
                        },
                        {
                          id: 'fulfil',
                          label: say('admin.mediaRequestsPanel.fulfil'),
                          detail: say('admin.mediaRequestsPanel.fulfilDetail'),
                          icon: <Icon of={CheckFilledIcon} size={15} />,
                          isDisabled: !isApproved || request.state === 'available',
                          onChoose: () => {
                            act(
                              request,
                              () => fulfilMediaRequest(request.id),
                              say('admin.mediaRequestsPanel.fulfilled', { title: request.title }),
                            );
                          },
                        },
                        {
                          id: 'releases',
                          label: say('admin.mediaRequestsPanel.pick'),
                          detail: say('admin.mediaRequestsPanel.pickDetail'),
                          icon: <Icon of={SearchFilledIcon} size={15} />,
                          onChoose: () => {
                            setReading({ request, tab: 'releases' });
                          },
                        },
                        {
                          id: 'picking',
                          label: request.isPickedByHand
                            ? say('admin.mediaRequestsPanel.fetchBest')
                            : say('admin.mediaRequestsPanel.onlyPicked'),
                          detail: request.isPickedByHand
                            ? say('admin.mediaRequestsPanel.fetchBestDetail')
                            : say('admin.mediaRequestsPanel.onlyPickedDetail'),
                          icon: <Icon of={HandPointerRightFilledIcon} size={15} />,
                          onChoose: () => {
                            act(
                              request,
                              () =>
                                changeMediaRequest(request.id, {
                                  isPickedByHand: !request.isPickedByHand,
                                }),
                              request.isPickedByHand
                                ? say('admin.mediaRequestsPanel.willFetchBest', {
                                    title: request.title,
                                  })
                                : say('admin.mediaRequestsPanel.willOnlyFetchPicked', {
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
                          label: say('admin.mediaRequestsPanel.forget'),
                          icon: <Icon of={BinFilledIcon} size={15} />,
                          isDestructive: true,
                          onChoose: () => {
                            setRemoving(request);
                          },
                        },
                      ],
                    },
                  ]}
                />
              )}
            </span>
          );
        },
      },
    ],
    [act, busyId, chosen, choose],
  );

  return (
    <PanelCard
      title={say('admin.mediaRequestsPanel.heading')}
      isFlush
      actions={
        <>
          <FilterMenu
            label={say('admin.mediaRequestsPanel.filterLabel')}
            groups={filterGroups}
            selected={filters}
            onChange={setFilters}
          />

          <TextField
            label={say('admin.mediaRequestsPanel.searchLabel')}
            isLabelHidden
            size="sm"
            type="search"
            placeholder={say('admin.mediaRequestsPanel.searchPlaceholder')}
            value={search}
            onValueChange={setSearch}
            className="w-56 max-w-full"
          />

          <HoverCard
            side="bottom"
            align="end"
            detail={
              <p className="max-w-xs text-xs leading-relaxed">
                {say('admin.mediaRequestsPanel.about')}
              </p>
            }
          >
            <Button
              variant="ghost"
              size="xs"
              isIconOnly
              label={say('admin.mediaRequestsPanel.aboutLabel')}
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
                          text: refusal?.message ?? say('admin.mediaRequestsPanel.couldNotStart'),
                          isProblem: true,
                        }
                      : {
                          text:
                            value.searched === 0
                              ? say('admin.mediaRequestsPanel.nothingMissing')
                              : sayCount('admin.mediaRequestsPanel.searchedAgain', value.searched),
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
            {say('admin.mediaRequestsPanel.refetch')}
          </PanelCardAction>

          <PanelCardAction
            icon={PlusIcon}
            onClick={() => {
              setIsAsking(true);
            }}
          >
            {say('admin.mediaRequestsPanel.requestMedia')}
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
        howMany={chosen.size}
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
            ? say('admin.mediaRequestsPanel.forgetThis')
            : say('admin.mediaRequestsPanel.forgetTitle', { title: removing.title })
        }
        detail={say('admin.mediaRequestsPanel.forgetDetail')}
        confirmLabel={say('admin.mediaRequestsPanel.forget')}
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
              say('admin.mediaRequestsPanel.forgot', { title: gone.title }),
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
          what={say('admin.mediaRequestsPanel.what')}
          isTryingAgain={requests.isFetching}
          onTryAgain={() => {
            void requests.refetch();
          }}
        />
      ) : requests.isPending ? (
        <Spinner isCentered label={say('admin.mediaRequestsPanel.reading')} size="sm" />
      ) : (
        <DataTable
          label={say('admin.mediaRequestsPanel.tableLabel')}
          columns={columns}
          rows={shown}
          getRowId={(request) => request.id}
          toolbar={
            awaiting.length === 0 ? undefined : (
              <div className="mr-auto flex flex-wrap items-center gap-3">
                <Checkbox
                  label={sayCount('admin.mediaRequestsPanel.chooseAll', awaiting.length)}
                  checked={chosenAwaiting.length === awaiting.length}
                  onCheckedChange={(isChosen) => {
                    setChosen(isChosen ? new Set(awaiting.map((one) => one.id)) : new Set());
                  }}
                />

                <span className="text-sm text-text-muted">
                  {chosen.size === 0
                    ? sayCount('admin.mediaRequestsPanel.waiting', awaiting.length)
                    : sayCount('admin.mediaRequestsPanel.chosenCount', chosen.size)}
                </span>

                {chosen.size === 0 ? null : (
                  <>
                    <Button
                      variant="secondary"
                      size="xs"
                      isLoading={isDeciding}
                      onClick={() => {
                        decide('approve');
                      }}
                    >
                      {say('admin.mediaRequestsPanel.approveThem')}
                    </Button>

                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={isDeciding}
                      onClick={() => {
                        setRefusingChosen(true);
                      }}
                    >
                      {say('admin.mediaRequestsPanel.refuseThem')}
                    </Button>
                  </>
                )}
              </div>
            )
          }
          emptyMessage={
            requests.data.length === 0
              ? say('admin.mediaRequestsPanel.emptyTitle')
              : say('admin.mediaRequestsPanel.noMatch')
          }
        />
      )}
    </PanelCard>
  );
};

MediaRequestsPanel.displayName = 'MediaRequestsPanel';

export { MediaRequestsPanel };
