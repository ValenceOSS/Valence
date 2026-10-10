import { useQuery } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { AccountFace } from '@ValenceScreens/components/AdminArea/components/AccountFace/AccountFace';
import { DeviceLabel } from '@ValenceScreens/components/AdminArea/components/DeviceLabel/DeviceLabel';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { say } from '@ValenceI18n/say';
import type { RecentViewing } from '@ValenceContracts/schemas/RecentViewing';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';

/**
 * What was watched lately on the server, newest first: who watched it, with their picture, what it
 * was, on what device, when they last had it on, for how long, and whether they got to the end.
 * Watching the same thing again shortly after carries on one row rather than starting another.
 */
const WatchHistoryCard = () => {
  const asked = useQuery(adminQueries.watchHistory());
  const known = useQuery(adminQueries.accounts());
  const accounts = new Map((known.data ?? []).map((account) => [account.id, account]));

  const columns: DataTableColumn<RecentViewing>[] = [
    {
      id: 'viewer',
      header: say('screens.adminArea.sessionTable.viewer'),
      accessorFn: (viewing) => viewing.profileName ?? '',
      cell: ({ row }) => {
        const account = accounts.get(row.original.accountId ?? '');

        return (
          <span className="flex items-center gap-2.5 whitespace-nowrap font-medium text-text">
            {account === undefined ? null : <AccountFace account={account} />}
            {row.original.profileName ?? say('screens.admin.nameOfSession.unknownViewer')}
          </span>
        );
      },
    },
    {
      id: 'watched',
      header: say('common.watched'),
      accessorFn: (viewing) => viewing.seriesTitle ?? viewing.title ?? '',
      cell: ({ row }) => (
        <span className="flex max-w-[20rem] min-w-0 flex-col">
          <span className="truncate text-text">
            {row.original.seriesTitle ?? row.original.title ?? '—'}
          </span>
          {row.original.seriesTitle === null || row.original.title === null ? null : (
            <span className="truncate text-xs text-text-muted">{row.original.title}</span>
          )}
        </span>
      ),
    },
    {
      id: 'device',
      header: say('common.device'),
      accessorFn: (viewing) => viewing.deviceLabel ?? '',
      cell: ({ row }) =>
        row.original.deviceLabel === null ? (
          <span className="text-text-muted">—</span>
        ) : (
          <DeviceLabel deviceLabel={row.original.deviceLabel} />
        ),
    },
    {
      id: 'when',
      header: say('screens.observabilityPage.jobHistory.when'),
      accessorFn: (viewing) => viewing.lastWatchedAt,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-muted">
          {new Date(row.original.lastWatchedAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
      ),
    },
    {
      id: 'for',
      header: say('common.progress'),
      accessorFn: (viewing) => viewing.secondsWatched,
      cell: ({ row }) => (
        <span className="flex items-center gap-2 whitespace-nowrap tabular-nums text-text-muted">
          {formatDuration(row.original.secondsWatched)}
          {row.original.isFinished ? <Badge size="sm">{say('common.finished')}</Badge> : null}
        </span>
      ),
    },
  ];

  return (
    <PanelCard title={say('common.watchHistory')} isFlush>
      <DataTable
        label={say('common.watchHistory')}
        columns={columns}
        rows={asked.data ?? []}
        getRowId={(viewing) => viewing.id}
        pageSize={15}
        emptyMessage={say('screens.adminArea.watchHistoryCard.nothingWatchedYet')}
      />
    </PanelCard>
  );
};

WatchHistoryCard.displayName = 'WatchHistoryCard';

export { WatchHistoryCard };
