import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight01Icon,
  Cancel01Icon,
  Clock01Icon,
  Delete02Icon,
  HandPointingRight01Icon,
  MoreHorizontalIcon,
  ReloadIcon,
  Search01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import {
  changeMediaRequest,
  decideMediaRequests,
  removeMediaRequest,
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
import { describeRequestBadge } from './describeRequestBadge';
import { describeRequestProgress } from './describeRequestProgress';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { RequestDetailTab } from '@ValenceScreens/components/AdminArea/components/RequestDetailDialog/RequestDetailDialog.types';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

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

  const reread = useCallback(
    () => cache.invalidateQueries({ queryKey: requestsQueries.mediaRequests().queryKey }),
    [cache],
  );

  const act = useCallback(
    (request: MediaRequest, doing: () => Promise<{ refusal: Refusal }>) => {
      setBusyId(request.id);
      setSaid(null);

      void doing()
        .then(({ refusal }) => {
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
              text: refusal?.message ?? 'They could not be decided.',
              isProblem: true,
            });

            return;
          }

          setChosen(new Set());
          setSaid({
            text:
              value.refused.length === 0
                ? `${value.decided.length.toString()} ${decision === 'approve' ? 'approved' : 'refused'}.`
                : `${value.decided.length.toString()} done, ${value.refused.length.toString()} could not be.`,
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
              label={`Choose ${row.original.title}`}
              checked={chosen.has(row.original.id)}
              onCheckedChange={(isChosen) => {
                choose(row.original.id, isChosen);
              }}
            />
          ) : null,
      },
      {
        id: 'title',
        header: 'Asked for',
        accessorFn: (request) => request.title,
        cell: ({ row }) => {
          const progress = describeRequestProgress(row.original);

          return (
            <span className="flex min-w-0 items-start gap-3">
              {isMusicRequest(row.original.kind) ? (
                <MusicArtwork
                  src={row.original.posterUrl}
                  label={`The cover of ${row.original.title}`}
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
                    {row.original.title}
                    {row.original.year === null ? '' : ` (${row.original.year.toString()})`}
                  </span>
                  <Badge size="sm">{REQUEST_KIND_NAMES[row.original.kind]}</Badge>
                </span>

                {progress === null ? null : (
                  <span className="truncate text-xs text-text-muted">{progress}</span>
                )}

                <span className="truncate text-xs text-text-muted">
                  Asked for by {row.original.requestedBy.name}
                </span>
              </span>
            </span>
          );
        },
      },
      {
        id: 'state',
        header: 'Where it is',
        accessorFn: (request) => describeRequestBadge(request).label,
        cell: ({ row }) => {
          const badge = describeRequestBadge(row.original);

          return (
            <span className="flex min-w-0 flex-col items-start gap-1">
              <Badge size="sm" tone={badge.tone}>
                {badge.label}
              </Badge>

              {badge.detail === null ? null : (
                <span className="break-all text-xs text-text-muted">{badge.detail}</span>
              )}
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
                <Spinner label={`Working on ${request.title}`} size="sm" />
              ) : (
                <ActionMenu
                  label={`Actions for ${request.title}`}
                  trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                  groups={[
                    {
                      items: [
                        ...(isApproved
                          ? []
                          : [
                              {
                                id: 'approve',
                                label: 'Approve',
                                detail: 'Look it over, and change it first if you like.',
                                icon: <Icon of={Tick02Icon} size={15} />,
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
                                label: 'Refuse',
                                icon: <Icon of={Cancel01Icon} size={15} />,
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
                          label: 'Open',
                          detail: 'How it is going, what it found, and what it will not try.',
                          icon: <Icon of={ArrowRight01Icon} size={15} />,
                          onChoose: () => {
                            setReading({ request, tab: 'going' });
                          },
                        },
                        {
                          id: 'log',
                          label: 'See what it has done',
                          detail: 'Every search, what it found, and why.',
                          icon: <Icon of={Clock01Icon} size={15} />,
                          onChoose: () => {
                            setReading({ request, tab: 'history' });
                          },
                        },
                        {
                          id: 'retry',
                          label: 'Search again now',
                          detail: 'Tries again whatever failed, too.',
                          icon: <Icon of={ReloadIcon} size={15} />,
                          isDisabled: !isApproved || IN_HAND.has(request.state),
                          onChoose: () => {
                            act(request, () => retryMediaRequest(request.id));
                          },
                        },
                        {
                          id: 'releases',
                          label: 'Pick a release',
                          detail: 'Search every indexer and choose what to fetch.',
                          icon: <Icon of={Search01Icon} size={15} />,
                          onChoose: () => {
                            setReading({ request, tab: 'releases' });
                          },
                        },
                        {
                          id: 'picking',
                          label: request.isPickedByHand
                            ? 'Fetch the best by itself'
                            : 'Only fetch what I pick',
                          detail: request.isPickedByHand
                            ? 'Searches for it, and fetches the best by its quality.'
                            : 'Stops searching for it by itself.',
                          icon: <Icon of={HandPointingRight01Icon} size={15} />,
                          onChoose: () => {
                            act(request, () =>
                              changeMediaRequest(request.id, {
                                isPickedByHand: !request.isPickedByHand,
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
                          label: 'Forget',
                          icon: <Icon of={Delete02Icon} size={15} />,
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
      title="Requested"
      isFlush
      actions={
        <>
          <Button
            variant="ghost"
            size="xs"
            isLoading={isSearchingMissing}
            onClick={() => {
              setIsSearchingMissing(true);
              setSaid(null);

              void searchMissing()
                .then(({ value, refusal }) => {
                  setSaid(
                    value === null
                      ? { text: refusal?.message ?? 'The search could not start.', isProblem: true }
                      : {
                          text:
                            value.searched === 0
                              ? 'Nothing is missing.'
                              : `Searched again for ${value.searched.toString()} request${value.searched === 1 ? '' : 's'}.`,
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
            Search for what is missing
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setIsAsking(true);
            }}
          >
            Ask for something
          </Button>
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
        title={`Forget ${removing?.title ?? 'this request'}?`}
        detail="Nothing more is fetched for it. Whatever it already brought stays in the library."
        confirmLabel="Forget"
        isDestructive
        isOpen={removing !== null}
        onClose={() => {
          setRemoving(null);
        }}
        onConfirm={() => {
          const gone = removing;

          setRemoving(null);

          if (gone !== null) {
            act(gone, async () => ({ refusal: await removeMediaRequest(gone.id) }));
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
          what="The requests"
          isTryingAgain={requests.isFetching}
          onTryAgain={() => {
            void requests.refetch();
          }}
        />
      ) : requests.isPending ? (
        <div className="p-4">
          <Spinner label="Reading the requests" size="sm" />
        </div>
      ) : (
        <DataTable
          label="Requests"
          columns={columns}
          rows={requests.data}
          getRowId={(request) => request.id}
          toolbar={
            awaiting.length === 0 ? undefined : (
              <div className="mr-auto flex flex-wrap items-center gap-3">
                <Checkbox
                  label={`Choose all ${awaiting.length.toString()} waiting on approval`}
                  checked={chosenAwaiting.length === awaiting.length}
                  onCheckedChange={(isChosen) => {
                    setChosen(isChosen ? new Set(awaiting.map((one) => one.id)) : new Set());
                  }}
                />

                <span className="text-sm text-text-muted">
                  {chosen.size === 0
                    ? `${awaiting.length.toString()} waiting on approval`
                    : `${chosen.size.toString()} chosen`}
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
                      Approve them
                    </Button>

                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={isDeciding}
                      onClick={() => {
                        setRefusingChosen(true);
                      }}
                    >
                      Refuse them
                    </Button>
                  </>
                )}
              </div>
            )
          }
          emptyMessage="Nothing has been asked for yet. Ask for a film, a series, an artist or an album to have it fetched and filed into its library."
        />
      )}
    </PanelCard>
  );
};

MediaRequestsPanel.displayName = 'MediaRequestsPanel';

export { MediaRequestsPanel };
