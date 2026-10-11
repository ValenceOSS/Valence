import { useQuery } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { AccountFace } from '@ValenceScreens/components/AdminArea/components/AccountFace/AccountFace';
import { DeviceLabel } from '@ValenceScreens/components/AdminArea/components/DeviceLabel/DeviceLabel';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { RowFoldButton } from '@ValenceScreens/components/AdminArea/components/RowFoldButton/RowFoldButton';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { RecentViewing } from '@ValenceContracts/schemas/RecentViewing';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { HistoryRow } from './WatchHistoryCard.types';

/**
 * What was watched lately on the server, newest first: who watched it, with their picture, what it
 * was, on what device, when they last had it on, for how long, and whether they got to the end.
 * Watching the same thing again shortly after carries on one row rather than starting another.
 * Everything one viewer watched sits indented beneath a single row for them.
 */
const WatchHistoryCard = () => {
  const asked = useQuery(adminQueries.watchHistory());
  const known = useQuery(adminQueries.accounts());
  const accounts = new Map((known.data ?? []).map((account) => [account.id, account]));
  const byViewer = new Map<string, RecentViewing[]>();

  for (const viewing of asked.data ?? []) {
    byViewer.set(viewing.profileId, [...(byViewer.get(viewing.profileId) ?? []), viewing]);
  }

  const isGrouped = [...byViewer.values()].some((viewings) => viewings.length > 1);
  const rows = [...byViewer.entries()].flatMap(([profileId, viewings]): HistoryRow[] => {
    const parts = viewings.map((viewing): HistoryRow => ({
      id: viewing.id,
      viewing,
      count: 0,
      parts: [],
    }));
    const [first] = viewings;

    return parts.length > 1 && first !== undefined
      ? [{ id: `viewer:${profileId}`, viewing: first, count: parts.length, parts }]
      : parts;
  });
  const nameOf = (viewing: RecentViewing) =>
    viewing.profileName ?? say('screens.admin.nameOfSession.unknownViewer');

  const columns: DataTableColumn<HistoryRow>[] = [
    {
      id: 'viewer',
      header: say('screens.adminArea.sessionTable.viewer'),
      accessorFn: (shown) => shown.viewing.profileName ?? '',
      cell: ({ row }) => {
        if (row.depth > 0) {
          return null;
        }

        const { viewing, count } = row.original;
        const account = accounts.get(viewing.accountId ?? '');
        const name = nameOf(viewing);
        const isOpen = row.getIsExpanded();

        return (
          <span className="flex items-center gap-2.5 whitespace-nowrap">
            {!isGrouped ? null : count === 0 ? (
              <span className="size-6 shrink-0" />
            ) : (
              <RowFoldButton
                label={say(
                  isOpen
                    ? 'screens.adminArea.watchHistoryCard.hideWhatNameWatched'
                    : 'screens.adminArea.watchHistoryCard.showWhatNameWatched',
                  { name },
                )}
                isOpen={isOpen}
                onToggle={() => {
                  row.toggleExpanded();
                }}
              />
            )}
            {account === undefined ? null : <AccountFace account={account} />}
            <span className="flex min-w-0 flex-col">
              <span className="font-medium text-text">{name}</span>
              {count === 0 ? null : (
                <span className="text-xs text-text-muted">
                  {sayCount('common.count.thingsWatched', count)}
                </span>
              )}
            </span>
          </span>
        );
      },
    },
    {
      id: 'watched',
      header: say('common.watched'),
      accessorFn: (shown) => shown.viewing.seriesTitle ?? shown.viewing.title ?? '',
      cell: ({ row }) =>
        row.original.count > 0 ? null : (
          <span className="flex max-w-[20rem] min-w-0 flex-col">
            <span className="truncate text-text">
              {row.original.viewing.seriesTitle ?? row.original.viewing.title ?? '—'}
            </span>
            {row.original.viewing.seriesTitle === null ||
            row.original.viewing.title === null ? null : (
              <span className="truncate text-xs text-text-muted">{row.original.viewing.title}</span>
            )}
          </span>
        ),
    },
    {
      id: 'device',
      header: say('common.device'),
      accessorFn: (shown) => shown.viewing.deviceLabel ?? '',
      cell: ({ row }) =>
        row.original.count > 0 ? null : row.original.viewing.deviceLabel === null ? (
          <span className="text-text-muted">—</span>
        ) : (
          <DeviceLabel deviceLabel={row.original.viewing.deviceLabel} />
        ),
    },
    {
      id: 'when',
      header: say('screens.observabilityPage.jobHistory.when'),
      accessorFn: (shown) => shown.viewing.lastWatchedAt,
      cell: ({ row }) =>
        row.original.count > 0 ? null : (
          <span className="whitespace-nowrap text-text-muted">
            {new Date(row.original.viewing.lastWatchedAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        ),
    },
    {
      id: 'for',
      header: say('common.progress'),
      accessorFn: (shown) => shown.viewing.secondsWatched,
      cell: ({ row }) =>
        row.original.count > 0 ? null : (
          <span className="flex items-center gap-2 whitespace-nowrap tabular-nums text-text-muted">
            {formatDuration(row.original.viewing.secondsWatched)}
            {row.original.viewing.isFinished ? (
              <Badge size="sm">{say('common.finished')}</Badge>
            ) : null}
          </span>
        ),
    },
  ];

  return (
    <PanelCard title={say('common.watchHistory')} isFlush>
      <DataTable
        label={say('common.watchHistory')}
        columns={columns}
        rows={rows}
        getRowId={(shown) => shown.id}
        getSubRows={(shown) => (shown.parts.length === 0 ? undefined : shown.parts)}
        isOpenAtFirst
        pageSize={15}
        emptyMessage={say('screens.adminArea.watchHistoryCard.nothingWatchedYet')}
      />
    </PanelCard>
  );
};

WatchHistoryCard.displayName = 'WatchHistoryCard';

export { WatchHistoryCard };
