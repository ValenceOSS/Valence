import { useMemo } from 'react';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { docsFor } from '@ValenceCore/functions/docsFor';
import { AnimatedBytes } from '@ValenceScreens/components/AnimatedBytes/AnimatedBytes';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import { Sentence } from '@ValenceScreens/components/Sentence/Sentence';
import { describeTimeLeft } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/describeTimeLeft';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { ArrQueueItem } from '@ValenceContracts/schemas/ArrApp';
import type { ArrQueueTableProps } from './ArrQueueTable.types';
import { say } from '@ValenceI18n/say';

/**
 * What each connected Radarr, Sonarr and Lidarr has downloading, read-only beside Valence's own
 * queue: its title and which app and client it is in, how far along it is and how big, how long it
 * has left, and its status in the app's own words — with any app that could not be asked named
 * above the table.
 *
 * @param queue - Each app, and everything in its queue.
 */
const ArrQueueTable = ({ queue }: ArrQueueTableProps) => {
  const apps = useMemo(() => new Map(queue.apps.map((app) => [app.id, app])), [queue.apps]);
  const silent = queue.apps.filter((app) => app.problem !== null);

  const columns = useMemo<DataTableColumn<ArrQueueItem>[]>(
    () => [
      {
        id: 'title',
        header: say('common.title'),
        accessorFn: (item) => item.title,
        cell: ({ row }) => {
          const app = apps.get(row.original.appId);

          return (
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium text-text">{row.original.title}</span>

              <span className="flex flex-wrap items-center gap-2">
                {app === undefined ? null : <Badge size="sm">{app.name}</Badge>}

                {row.original.downloadClient === null ? null : (
                  <span className="text-xs text-text-muted">{row.original.downloadClient}</span>
                )}
              </span>
            </span>
          );
        },
      },
      {
        id: 'progress',
        header: say('common.progress'),
        accessorFn: (item) => item.progress,
        cell: ({ row }) => {
          const { sizeBytes, leftBytes } = row.original;

          return (
            <span className="flex flex-col gap-1">
              <ProgressBar
                label={say('common.howFarTitleHasDownloaded', { title: row.original.title })}
                value={Math.round(row.original.progress * 1000) / 10}
                readout={
                  <AnimatedNumber
                    value={Math.floor(row.original.progress * 100)}
                    suffix="%"
                    className="text-xs text-text"
                  />
                }
              />

              {sizeBytes === null ? null : (
                <span className="text-xs tabular-nums text-text-muted">
                  {leftBytes === null ? (
                    <AnimatedBytes bytes={sizeBytes} />
                  ) : (
                    <Sentence
                      words="screens.downloadsPanel.downloadQueueTable.doneOfSize"
                      fillings={{
                        done: <AnimatedBytes bytes={Math.max(0, sizeBytes - leftBytes)} />,
                        size: <AnimatedBytes bytes={sizeBytes} />,
                      }}
                    />
                  )}
                </span>
              )}
            </span>
          );
        },
      },
      {
        id: 'left',
        header: say('common.timeLeft'),
        accessorFn: (item) => item.secondsLeft ?? Number.MAX_SAFE_INTEGER,
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-text-muted">
            {row.original.secondsLeft === null ? '—' : describeTimeLeft(row.original.secondsLeft)}
          </span>
        ),
      },
      {
        id: 'status',
        header: say('common.state'),
        accessorFn: (item) => item.status,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col items-start gap-1">
            <Badge size="sm" tone={row.original.problem === null ? 'quiet' : 'warning'}>
              {row.original.status}
            </Badge>

            {row.original.problem === null ? null : (
              <span className="text-xs text-text-muted">{sayAgain(row.original.problem)}</span>
            )}
          </span>
        ),
      },
    ],
    [apps],
  );

  return (
    <div className="flex flex-col">
      {silent.map((app) => (
        <p
          key={app.id}
          role="alert"
          className="flex items-center gap-2 px-4 pt-3 text-sm text-danger"
        >
          {say('screens.adminArea.downloadsPanel.nameProblem', {
            name: app.name,
            problem: app.problem === null ? '' : sayAgain(app.problem),
          })}

          <HowToFix href={docsFor(app.problemCode)} />
        </p>
      ))}

      <DataTable
        height="fills"
        label={say('screens.downloadsPanel.arrQueueTable.whatTheConnectedAppsAreDownloading')}
        columns={columns}
        rows={[...queue.items]}
        getRowId={(item) => `${item.appId}:${item.id.toString()}`}
        emptyMessage={
          queue.apps.length === 0
            ? say('screens.downloadsPanel.arrQueueTable.noRadarrSonarrOrLidarrIs')
            : say('screens.downloadsPanel.arrQueueTable.nothingIsDownloadingInTheConnected')
        }
      />
    </div>
  );
};

ArrQueueTable.displayName = 'ArrQueueTable';

export { ArrQueueTable };
