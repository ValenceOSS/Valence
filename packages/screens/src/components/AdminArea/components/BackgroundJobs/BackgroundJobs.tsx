import { memo, useMemo, useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { describeElapsed } from '@ValenceScreens/components/AdminArea/describeElapsed';
import { describeQueueKind } from '@ValenceScreens/components/AdminArea/describeQueueKind';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Job } from '@ValenceClient/admin/fetchAdmin';
import type { BackgroundJobsProps } from './BackgroundJobs.types';
import { describeJobStatus } from '@ValenceScreens/status/describeJobStatus';
import { say } from '@ValenceI18n/say';

/**
 * Sums up what the queue is doing in one line, so the heading says whether anything is happening
 * before anybody reads the table under it.
 *
 * @param jobs - The latest readings, or null before any have arrived.
 * @returns The line to show.
 */
const describeQueue = (jobs: Job[]): string =>
  jobs
    .map(
      (job) =>
        `${job.id}:${job.state}:${String(job.startedAtMs)}:${String(job.finishedAtMs)}:${job.failure?.message ?? ''}`,
    )
    .join('|');

const NOTHING_QUEUED: Job[] = [];

/**
 * What the queue has been doing, as one paged table: what ran, how it ended, how long it took, and
 * what went wrong where something did. This is the record rather than the controls — starting and
 * stopping work lives with the jobs themselves.
 *
 * @param monitor - The latest readings, or null before any have arrived.
 * @param isUnreachable - Whether the service is not answering, which is why the table is empty.
 * @param pageSize - How many rows to show at once.
 * @param growsOnScroll - Whether reaching the bottom loads more rather than turning a page —
 *   fitting for a short preview, not for a table sitting beside another that pages.
 */
const BackgroundJobsTable = ({
  monitor,
  isUnreachable = false,
  pageSize,
  growsOnScroll = true,
}: BackgroundJobsProps) => {
  const arrived = monitor?.queue.jobs ?? NOTHING_QUEUED;
  const saying = describeQueue(arrived);
  const [shown, setShown] = useState({ saying, rows: arrived });
  const [hasRead, setHasRead] = useState(monitor !== null);

  if (shown.saying !== saying) {
    setShown({ saying, rows: arrived });
  }

  if (monitor !== null && !hasRead) {
    setHasRead(true);
  }

  const rows = shown.rows;

  const columns = useMemo<DataTableColumn<Job>[]>(
    () => [
      {
        id: 'state',
        header: say('admin.backgroundJobs.state'),
        accessorFn: (job) => job.state,
        cell: ({ row }) => (
          <Badge size="sm" tone={describeJobStatus(row.original.state).tone}>
            {describeJobStatus(row.original.state).label}
          </Badge>
        ),
      },
      {
        id: 'kind',
        header: say('admin.backgroundJobs.job'),
        accessorFn: (job) => describeQueueKind(job.kind),
        cell: ({ row }) => (
          <span
            className="block max-w-[10rem] truncate text-text-muted"
            title={describeQueueKind(row.original.kind)}
          >
            {describeQueueKind(row.original.kind)}
          </span>
        ),
      },
      {
        id: 'subject',
        header: say('admin.backgroundJobs.subject'),
        accessorFn: (job) => job.subject,
        cell: ({ row }) => (
          <span className="flex max-w-[16rem] min-w-0 flex-col">
            <span className="truncate text-text" title={row.original.subject}>
              {row.original.subject}
            </span>

            {row.original.failure === null ? null : (
              <span className="truncate text-xs text-danger" title={row.original.failure.message}>
                {row.original.failure.message}
              </span>
            )}
          </span>
        ),
      },
      {
        id: 'finished',
        header: say('admin.backgroundJobs.finished'),
        accessorFn: (job) => job.finishedAtMs ?? 0,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.finishedAtMs === null
              ? row.original.startedAtMs === null
                ? say('admin.backgroundJobs.waiting')
                : say('admin.backgroundJobs.running')
              : new Date(row.original.finishedAtMs).toLocaleTimeString()}
          </span>
        ),
      },
      {
        id: 'took',
        header: say('admin.backgroundJobs.took'),
        accessorFn: (job) => (job.finishedAtMs ?? Date.now()) - (job.startedAtMs ?? Date.now()),
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {describeElapsed(row.original, Date.now())}
          </span>
        ),
      },
    ],
    [],
  );

  if (isUnreachable) {
    return <p className="p-6 text-sm text-text-muted">{say('admin.backgroundJobs.unreachable')}</p>;
  }

  return (
    <DataTable
      label={say('admin.backgroundJobs.label')}
      columns={columns}
      rows={rows}
      emptyMessage={
        hasRead ? say('admin.backgroundJobs.nothingQueued') : say('admin.backgroundJobs.reading')
      }
      growsOnScroll={growsOnScroll}
      {...(pageSize === undefined ? {} : { pageSize })}
    />
  );
};

const BackgroundJobs = memo(BackgroundJobsTable);

BackgroundJobs.displayName = 'BackgroundJobs';

export { BackgroundJobs };
