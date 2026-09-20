import { Icon } from '@ValenceUI/Icon';
import { Info as InfoIcon, MoreHorizontal as MoreHorizontalIcon } from '@keyline-icons/react';
import { memo, useEffect, useMemo, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { notify } from '@ValenceUI/notify';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RunningWorkDialog } from '@ValenceScreens/components/AdminArea/components/RunningWorkDialog/RunningWorkDialog';
import { describeRunIssues } from './describeRunIssues';
import { describeRunSubject } from './describeRunSubject';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { watchJobs } from '@ValenceClient/admin/fetchAdmin';
import { describeLogDay, describeLogTime } from '@ValenceClient/admin/describeLogTime';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { JobRunPage, JobRunRecord, JobRunStatus } from '@ValenceContracts/schemas/JobRun';
import type { JobHistoryProps } from './JobHistory.types';
import { describeJobStatus } from '@ValenceScreens/status/describeJobStatus';

const PAGE = 200;

const ROWS_PER_PAGE = 10;

const REFRESH_THROTTLE_MS = 1_000;

const NOTHING_RUN: JobRunRecord[] = [];

const STATUSES = [
  'queued',
  'running',
  'completed',
  'failed',
] as const satisfies readonly JobRunStatus[];

const STATUS_FILTER_OPTIONS = STATUSES.map((id) => ({ id, label: describeJobStatus(id).label }));

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
 * @param libraries - The libraries a run's subject can name, so it is shown by name.
 * @param working - What the queue is working on, for showing what a running run is made of.
 * @param onViewLogs - Called with a run's id, to open the log filtered to it.
 */
const JobHistoryPanel = ({ definitions, libraries, working, onViewLogs }: JobHistoryProps) => {
  const cache = useQueryClient();
  const [openIssuesFor, setOpenIssuesFor] = useState<string | null>(null);
  const [openWorkFor, setOpenWorkFor] = useState<string | null>(null);

  const labels = useMemo(
    () => new Map(definitions.map((definition) => [definition.kind, definition.label])),
    [definitions],
  );

  const askedHistory = useQuery(adminQueries.jobHistory({ limit: PAGE }));
  const askedIssues = useQuery(adminQueries.jobHistoryIssues(openIssuesFor));

  const records = askedHistory.data?.records ?? NOTHING_RUN;
  const issues = askedIssues.data ?? [];
  const openRun = records.find((record) => record.id === openIssuesFor);
  const failure = openRun?.errorMessage ?? null;
  const issuesText = describeRunIssues(failure, issues);
  const openWork = records.find((record) => record.id === openWorkFor);

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

  const closeIssues = () => {
    setOpenIssuesFor(null);
  };

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
        filterFn: (row, columnId, filterValue) =>
          filterValue === undefined || row.getValue(columnId) === filterValue,
        meta: { filterOptions: STATUS_FILTER_OPTIONS },
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            <Badge size="sm" tone={describeJobStatus(row.original.status).tone}>
              {describeJobStatus(row.original.status).label}
            </Badge>

            {row.original.status === 'running' ? (
              <Button
                variant="subtle"
                size="none"
                isIconOnly
                label={`What ${describeRunKind(row.original.kind, labels)} is doing`}
                onClick={() => {
                  setOpenWorkFor(row.original.id);
                }}
              >
                <Icon of={InfoIcon} size={15} />
              </Button>
            ) : null}
          </span>
        ),
      },
      {
        id: 'subject',
        header: 'Subject',
        accessorFn: (record) => describeRunSubject(record.subject, libraries).name,
        cell: ({ row }) => {
          const { name, library } = describeRunSubject(row.original.subject, libraries);

          return (
            <span className="flex max-w-[12rem] min-w-0 flex-col">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-text" title={name}>
                  {name}
                </span>

                {row.original.subject === null ? null : (
                  <HoverCard
                    side="top"
                    align="start"
                    detail={
                      <dl className="flex flex-col gap-1.5 text-xs">
                        {library === null ? null : (
                          <>
                            <div className="flex flex-col">
                              <dt className="text-text-muted">Library</dt>
                              <dd className="text-text">{library.name}</dd>
                            </div>

                            <div className="flex flex-col">
                              <dt className="text-text-muted">Kind</dt>
                              <dd className="text-text">{library.kind}</dd>
                            </div>

                            <div className="flex flex-col">
                              <dt className="text-text-muted">Folder</dt>
                              <dd className="break-all text-text">{library.path}</dd>
                            </div>

                            <div className="flex flex-col">
                              <dt className="text-text-muted">Items</dt>
                              <dd className="tabular-nums text-text">
                                {library.itemCount.toString()}
                              </dd>
                            </div>
                          </>
                        )}

                        <div className="flex flex-col">
                          <dt className="text-text-muted">{library === null ? 'Subject' : 'ID'}</dt>
                          <dd className="break-all text-text">{row.original.subject}</dd>
                        </div>

                        <div className="flex flex-col">
                          <dt className="text-text-muted">Run</dt>
                          <dd className="break-all text-text">{row.original.id}</dd>
                        </div>
                      </dl>
                    }
                  >
                    <Icon of={InfoIcon} size={15} tone="muted" className="shrink-0" />
                  </HoverCard>
                )}
              </span>

              {row.original.errorMessage === null ? null : (
                <span className="truncate text-xs text-danger" title={row.original.errorMessage}>
                  {row.original.errorMessage}
                </span>
              )}
            </span>
          );
        },
      },
      {
        id: 'progress',
        header: 'Progress',
        enableSorting: false,
        cell: ({ row }) => {
          const progress = row.original.progress;

          return (
            <span className="whitespace-nowrap tabular-nums text-text-muted">
              {progress === null ? null : (
                <>
                  {progress.phase} <AnimatedNumber value={progress.processed} />/
                  <AnimatedNumber value={progress.total} />
                </>
              )}
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
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
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
    [labels, libraries, onViewLogs],
  );

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        label="What pg-boss has run"
        columns={columns}
        rows={records}
        getRowId={(record) => record.id}
        height="fill"
        pageSize={ROWS_PER_PAGE}
        emptyMessage={
          askedHistory.isError
            ? 'Job history could not be read from the server.'
            : askedHistory.isPending
              ? 'Reading job history…'
              : 'No job runs match this.'
        }
      />

      <RunningWorkDialog
        title={openWork === undefined ? '' : describeRunKind(openWork.kind, labels)}
        isOpen={openWork !== undefined}
        progress={
          openWork === undefined || openWork.progress === null
            ? []
            : [{ label: describeRunKind(openWork.kind, labels), ...openWork.progress }]
        }
        tasks={working.filter((task) => task.correlationId === openWorkFor)}
        onClose={() => {
          setOpenWorkFor(null);
        }}
      />

      <Dialog label="Job run issues" isOpen={openIssuesFor !== null} onClose={closeIssues}>
        {openIssuesFor === null ? null : (
          <>
            <DialogTitle title="Issues from this run" />

            <DialogContent>
              {askedIssues.isPending ? (
                <p className="text-sm text-text-muted">Reading issues…</p>
              ) : issuesText === '' ? (
                <p className="text-sm text-text-muted">No issues were recorded for this run.</p>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-xs text-text">
                  {issuesText}
                </pre>
              )}
            </DialogContent>

            <DialogFooter
              dismiss={{ label: 'Close', onChoose: closeIssues }}
              confirm={{
                label: 'Copy',
                isDisabled: issuesText === '',
                onChoose: () => {
                  void navigator.clipboard.writeText(issuesText).then(() => {
                    notify.worked('Copied to the clipboard.');
                  });
                },
              }}
            />
          </>
        )}
      </Dialog>
    </div>
  );
};

const JobHistory = memo(JobHistoryPanel);

JobHistory.displayName = 'JobHistory';

export { JobHistory };
