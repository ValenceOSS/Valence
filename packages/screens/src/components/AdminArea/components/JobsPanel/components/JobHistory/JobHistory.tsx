import { Icon } from '@ValenceUI/Icon';
import { MoreHorizontalIcon, RefreshIcon, Alert02Icon } from '@hugeicons/core-free-icons';
import { memo, useEffect, useMemo, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { TextField } from '@ValenceUI/TextField';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { watchJobs } from '@ValenceClient/admin/fetchAdmin';
import { describeLogDay, describeLogTime } from '@ValenceClient/admin/describeLogTime';
import { JobRunStatusSchema } from '@ValenceContracts/schemas/JobRun';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { SegmentedItem } from '@ValenceUI/SegmentedRow.types';
import type { JobRunPage, JobRunRecord, JobRunStatus } from '@ValenceContracts/schemas/JobRun';
import type { JobHistoryProps } from './JobHistory.types';

const PAGE = 200;

const ROWS_PER_PAGE = 10;

const REFRESH_THROTTLE_MS = 1_000;

const NOTHING_RUN: JobRunRecord[] = [];

type StatusFilter = JobRunStatus | 'all';

const STATUS_ITEMS: SegmentedItem[] = [
  { id: 'all', label: 'All' },
  { id: 'queued', label: 'Queued' },
  { id: 'running', label: 'Running' },
  { id: 'completed', label: 'Done' },
  { id: 'failed', label: 'Failed' },
];

const STATUS_TONES: Readonly<Record<JobRunStatus, BadgeTone>> = {
  queued: 'warning',
  running: 'accent',
  completed: 'success',
  failed: 'danger',
};

/**
 * Says when something happened, or that it has not, without the caller working out which.
 *
 * @param atMs - When it happened, or null where it has not.
 * @returns The moment, in words, or a dash.
 */
const describeMoment = (atMs: number | null): string =>
  atMs === null ? '—' : `${describeLogDay(atMs)}, ${describeLogTime(atMs)}`;

/**
 * Says where a run stands in one line, rather than in two columns that mostly repeat each other —
 * a run that finished only ever needs the one moment, and a run still going needs neither.
 *
 * @param record - The run.
 * @returns What to say it is doing, or when it did it.
 */
const describeWhen = (record: JobRunRecord): string => {
  if (record.finishedAtMs !== null) {
    return describeMoment(record.finishedAtMs);
  }

  return record.startedAtMs === null ? 'Queued' : 'Running…';
};

/**
 * Names a job run's kind in words, from what the server offers to run it by hand, falling back to
 * the identifier itself for a kind that runs only on a schedule or that this page does not know.
 *
 * @param kind - The job run's kind, as the server reports it.
 * @param labels - What each kind is called, keyed by kind.
 * @returns What to call it.
 */
const describeRunKind = (kind: string, labels: ReadonlyMap<string, string>): string =>
  labels.get(kind) ?? kind;

/**
 * The persisted record of what pg-boss has actually run: not only what the queue is doing this
 * instant, but what happened, searchable and kept once the job itself is long gone. This is the
 * answer to the Jobs page looking empty while work was genuinely happening — the queue only ever
 * showed the last moment, and this shows the history behind it.
 *
 * @param definitions - The jobs the server offers, for naming a run's kind in words.
 * @param onViewLogs - Called with a run's id, to open the log filtered to it.
 */
const JobHistoryPanel = ({ definitions, onViewLogs }: JobHistoryProps) => {
  const cache = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [openIssuesFor, setOpenIssuesFor] = useState<string | null>(null);

  const labels = useMemo(
    () => new Map(definitions.map((definition) => [definition.kind, definition.label])),
    [definitions],
  );

  const query = useMemo(
    () => ({ status: status === 'all' ? null : status, search, limit: PAGE }),
    [status, search],
  );

  const askedHistory = useQuery(adminQueries.jobHistory(query));
  const askedIssues = useQuery(adminQueries.jobHistoryIssues(openIssuesFor));

  const records = askedHistory.data?.records ?? NOTHING_RUN;
  const issues = askedIssues.data ?? [];

  useEffect(() => {
    let pending: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (pending !== null) {
        return;
      }

      pending = setTimeout(() => {
        pending = null;
        void cache.invalidateQueries({ queryKey: [...adminQueries.key, 'jobHistory'] });
      }, REFRESH_THROTTLE_MS);
    };

    const unwatch = watchJobs((event) => {
      if (event.event !== 'progress') {
        scheduleRefresh();

        return;
      }

      cache.setQueriesData<JobRunPage>({ queryKey: [...adminQueries.key, 'jobHistory'] }, (page) =>
        page === undefined
          ? page
          : {
              ...page,
              records: page.records.map((record) =>
                record.id === event.jobId
                  ? {
                      ...record,
                      progress: {
                        phase: event.phase,
                        processed: event.processed,
                        total: event.total,
                      },
                    }
                  : record,
              ),
            },
      );
    });

    return () => {
      if (pending !== null) {
        clearTimeout(pending);
      }

      unwatch();
    };
  }, [cache]);

  const columns = useMemo<DataTableColumn<JobRunRecord>[]>(
    () => [
      {
        id: 'kind',
        header: 'Job',
        accessorFn: (record) => describeRunKind(record.kind, labels),
        cell: ({ row }) => (
          <span
            className="block max-w-[10rem] truncate text-text-muted"
            title={describeRunKind(row.original.kind, labels)}
          >
            {describeRunKind(row.original.kind, labels)}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (record) => record.status,
        cell: ({ row }) => (
          <Badge size="sm" tone={STATUS_TONES[row.original.status]}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'subject',
        header: 'Subject',
        accessorFn: (record) => record.subject ?? '',
        cell: ({ row }) => (
          <span className="flex max-w-[12rem] min-w-0 flex-col">
            <span className="truncate text-text" title={row.original.subject ?? undefined}>
              {row.original.subject ?? '—'}
            </span>

            {row.original.errorMessage === null ? null : (
              <span className="truncate text-xs text-danger" title={row.original.errorMessage}>
                {row.original.errorMessage}
              </span>
            )}
          </span>
        ),
      },
      {
        id: 'progress',
        header: 'Progress',
        enableSorting: false,
        cell: ({ row }) => {
          const progress = row.original.progress;

          return (
            <span className="whitespace-nowrap tabular-nums text-text-muted">
              {progress === null
                ? ''
                : `${progress.phase} ${progress.processed.toString()}/${progress.total.toString()}`}
            </span>
          );
        },
      },
      {
        id: 'when',
        header: 'When',
        accessorFn: (record) => record.finishedAtMs ?? record.startedAtMs ?? 0,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {describeWhen(row.original)}
          </span>
        ),
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end">
            <ActionMenu
              label={`Actions for ${describeRunKind(row.original.kind, labels)}`}
              trigger={<Icon of={MoreHorizontalIcon} size={14} />}
              size="sm"
              groups={[
                {
                  items: [
                    {
                      id: 'logs',
                      label: 'View logs',
                      onChoose: () => {
                        onViewLogs(row.original.id);
                      },
                    },
                    {
                      id: 'issues',
                      label: 'View issues',
                      onChoose: () => {
                        setOpenIssuesFor(row.original.id);
                      },
                    },
                  ],
                },
              ]}
            />
          </span>
        ),
      },
    ],
    [labels, onViewLogs],
  );

  return (
    <PanelCard
      title="Job history"
      isFlush
      actions={
        <>
          <TextField
            label="Search job history"
            isLabelHidden
            size="sm"
            type="search"
            placeholder="Search"
            value={search}
            onValueChange={setSearch}
            className="w-32 max-w-full"
          />

          <SegmentedRow
            label="Filter job history by status"
            size="xs"
            tone="accent"
            items={STATUS_ITEMS}
            value={status}
            onSelect={(id) => {
              if (id === 'all') {
                setStatus('all');

                return;
              }

              const parsed = JobRunStatusSchema.safeParse(id);

              if (parsed.success) {
                setStatus(parsed.data);
              }
            }}
          />

          <Button
            isIconOnly
            variant="ghost"
            size="xs"
            label="Read the history again"
            hasTooltip
            isLoading={askedHistory.isFetching}
            onClick={() => {
              void askedHistory.refetch();
            }}
          >
            <Icon of={RefreshIcon} size={15} />
          </Button>
        </>
      }
    >
      <DataTable
        label="What pg-boss has run"
        columns={columns}
        rows={records}
        getRowId={(record) => record.id}
        pageSize={ROWS_PER_PAGE}
        emptyMessage={
          askedHistory.isError
            ? 'Job history could not be read from the server.'
            : askedHistory.isPending
              ? 'Reading job history…'
              : 'No job runs match this.'
        }
      />

      <Dialog
        label="Job run issues"
        isOpen={openIssuesFor !== null}
        onClose={() => {
          setOpenIssuesFor(null);
        }}
      >
        {openIssuesFor === null ? null : (
          <>
            <DialogTitle title="Issues from this run" />

            <DialogContent>
              {askedIssues.isPending ? (
                <p className="text-sm text-text-muted">Reading issues…</p>
              ) : issues.length === 0 ? (
                <p className="text-sm text-text-muted">No issues were recorded for this run.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
                  {issues.map((issue) => (
                    <li key={issue.id} className="flex items-start gap-3 py-3 first:pt-0">
                      <Icon of={Alert02Icon} size={16} className="mt-0.5 shrink-0 text-danger" />

                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-sm text-text" title={issue.path}>
                          {issue.path}
                        </span>
                        <span className="text-xs text-text-muted">{issue.reason}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </PanelCard>
  );
};

const JobHistory = memo(JobHistoryPanel);

JobHistory.displayName = 'JobHistory';

export { JobHistory };
