import { Bookmark as BookmarkFilledIcon } from '@keyline-icons/react/fill';
import { cn } from '@ValenceUI/cn';
import { Icon } from '@ValenceUI/Icon';
import {
  ChevronDown as ChevronDownIcon,
  Info as InfoIcon,
  MoreHorizontal as MoreHorizontalIcon,
} from '@keyline-icons/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { FilterMenu } from '@ValenceUI/FilterMenu';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { StatStrip } from '@ValenceUI/StatStrip';
import { TextField } from '@ValenceUI/TextField';
import { Well } from '@ValenceUI/Well';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { notify } from '@ValenceUI/notify';
import { keepPreviousData, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { RunningWorkDialog } from '@ValenceScreens/components/AdminArea/components/RunningWorkDialog/RunningWorkDialog';
import { describeRunIssues } from './describeRunIssues';
import { describeRunSubject } from './describeRunSubject';
import { pinFirst } from '@ValenceScreens/admin/pinFirst';
import { usePinnedJobRuns } from '@ValenceScreens/admin/usePinnedJobRuns';
import { useAnchoredNow } from '@ValenceScreens/admin/useAnchoredNow';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { watchJobs } from '@ValenceClient/admin/fetchAdmin';
import { describeWords } from '@ValenceClient/admin/describeWords';
import { describeJobKind } from '@ValenceClient/admin/describeJobKind';
import { ElapsedTime } from '@ValenceScreens/components/ElapsedTime/ElapsedTime';
import { describeLogDay, describeLogTime } from '@ValenceClient/admin/describeLogTime';
import { defaultLogView } from '@ValenceClient/admin/defaultLogView';
import { logRangeStart } from '@ValenceClient/admin/logRanges';
import { logSearchFromView } from '@ValenceClient/admin/logSearchFromView';
import { logViewFromSearch } from '@ValenceClient/admin/logViewFromSearch';
import { TimeRangeMenu } from '@ValenceScreens/components/ObservabilityPage/components/TimeRangeMenu/TimeRangeMenu';
import type { FilterGroup } from '@ValenceUI/FilterMenu.types';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type {
  JobRunPage,
  JobRunRecord,
  JobRunSort,
  JobRunStatus,
} from '@ValenceContracts/schemas/JobRun';
import type { JobHistoryProps } from './JobHistory.types';
import { describeJobStatus } from '@ValenceScreens/status/describeJobStatus';

const TYPING_MS = 350;

const ROWS_PER_PAGE = 10;

const REFRESH_THROTTLE_MS = 1_000;

const NOTHING_RUN: JobRunRecord[] = [];

const runId = (record: JobRunRecord): string => record.id;

const STATUSES_COUNTED = [
  'running',
  'completed',
  'failed',
  'stopped',
] as const satisfies readonly JobRunStatus[];

const STATUSES = [
  'queued',
  'running',
  'completed',
  'failed',
  'stopped',
] as const satisfies readonly JobRunStatus[];

const SORTS: readonly { id: JobRunSort; label: string; detail: string }[] = [
  { id: 'newest', label: 'Newest first', detail: 'What just ran' },
  { id: 'oldest', label: 'Oldest first', detail: 'In the order it happened' },
  { id: 'longest', label: 'Longest first', detail: 'What took the most time' },
];

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
 * The persisted record of what pg-boss has actually run: not only what the queue is doing this
 * instant, but what happened, searchable and kept once the job itself is long gone. This is the
 * answer to the Jobs page looking empty while work was genuinely happening — the queue only ever
 * showed the last moment, and this shows the history behind it.
 *
 * @param definitions - The jobs the server offers, for naming a run's kind in words.
 * @param libraries - The libraries a run's subject can name, so it is shown by name.
 * @param working - What the queue is working on, for showing what a running run is made of.
 * @param search - What the address says the runs are narrowed to and ordered by.
 * @param onSearchChange - Told each change, to write into the address.
 * @param onViewLogs - Called with a run's id, to open the log filtered to it.
 */
const JobHistoryPanel = ({
  definitions,
  libraries,
  working,
  search,
  onSearchChange,
  onViewLogs,
  onTrace,
}: JobHistoryProps) => {
  const cache = useQueryClient();
  const [openIssuesFor, setOpenIssuesFor] = useState<string | null>(null);
  const [openWorkFor, setOpenWorkFor] = useState<string | null>(null);

  const labels = useMemo(
    () => new Map(definitions.map((definition) => [definition.kind, definition.label])),
    [definitions],
  );

  const { rq, rstatus, rsort, range, from, until } = search;
  const shared = useMemo(() => logViewFromSearch(search), [search]);
  const rkind = shared.view.jobKinds[0];
  const sort: JobRunSort = rsort ?? 'newest';
  const [typed, setTyped] = useState(rq ?? '');
  const said = useRef(rq ?? '');
  const [anchor, setAnchor] = useAnchoredNow(range);

  const chosen = useMemo<ReadonlySet<string>>(
    () =>
      new Set([
        ...(rstatus === undefined ? [] : [`status:${rstatus}`]),
        ...(rkind === undefined ? [] : [`kind:${rkind}`]),
      ]),
    [rstatus, rkind],
  );

  useEffect(() => {
    if ((rq ?? '') !== said.current) {
      said.current = rq ?? '';
      setTyped(rq ?? '');
    }
  }, [rq]);

  useEffect(() => {
    const words = typed.trim();

    if (words === said.current) {
      return;
    }

    const timer = setTimeout(() => {
      said.current = words;
      onSearchChange({ rq: words === '' ? undefined : words });
      setAnchor();
    }, TYPING_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [typed, onSearchChange, setAnchor]);

  const page = (search.rpage ?? 1) - 1;
  const narrowing = useMemo(
    () => ({
      sort,
      search: rq ?? '',
      sinceMs: from ?? logRangeStart(range ?? defaultLogView().range, anchor),
      untilMs: until ?? null,
      kind: rkind ?? null,
    }),
    [rq, range, from, until, sort, anchor, rkind],
  );
  const isAsOpened =
    rq === undefined &&
    rstatus === undefined &&
    rkind === undefined &&
    rsort === undefined &&
    range === undefined &&
    from === undefined &&
    until === undefined;
  const query = useMemo(
    () => ({
      ...narrowing,
      status: rstatus ?? null,
      limit: ROWS_PER_PAGE,
      offset: page * ROWS_PER_PAGE,
      runningFirst: isAsOpened,
    }),
    [narrowing, rstatus, page, isAsOpened],
  );
  const askedHistory = useQuery({
    ...adminQueries.jobHistory(query),
    placeholderData: keepPreviousData,
  });
  const [askedRunning, askedCompleted, askedFailed, askedStopped] = useQueries({
    queries: STATUSES_COUNTED.map((status) => ({
      ...adminQueries.jobHistory({ ...narrowing, status, limit: 1, offset: 0 }),
      placeholderData: keepPreviousData,
    })),
  });
  const askedIssues = useQuery(adminQueries.jobHistoryIssues(openIssuesFor));

  const { pinned, toggle: togglePin } = usePinnedJobRuns();
  const fetched = askedHistory.data?.records ?? NOTHING_RUN;
  const isUnnarrowed = rq === undefined && rstatus === undefined && rkind === undefined;
  const askedPinned = useQueries({
    queries: [...pinned].map((id) => adminQueries.jobRun(page === 0 && isUnnarrowed ? id : null)),
  });
  const pinnedElsewhere = useMemo(
    () =>
      askedPinned.flatMap((asked) =>
        asked.data === undefined || asked.data === null ? [] : [asked.data],
      ),
    [askedPinned],
  );
  const records = useMemo(
    () =>
      pinFirst(
        [
          ...pinnedElsewhere.filter((run) => !fetched.some((record) => record.id === run.id)),
          ...fetched,
        ],
        pinned,
        (record) => record.id,
      ),
    [fetched, pinned, pinnedElsewhere],
  );
  const issues = askedIssues.data ?? [];
  const openRun = records.find((record) => record.id === openIssuesFor);
  const failure = openRun?.errorMessage ?? null;
  const issuesText = describeRunIssues(failure, issues);
  const openWork = records.find((record) => record.id === openWorkFor);
  const counts = {
    running: askedRunning?.data?.total ?? 0,
    completed: askedCompleted?.data?.total ?? 0,
    failed: askedFailed?.data?.total ?? 0,
    stopped: askedStopped?.data?.total ?? 0,
  };
  const groups = useMemo<FilterGroup[]>(
    () => [
      {
        name: 'Status',
        isSingle: true,
        options: STATUS_FILTER_OPTIONS.map((option) => ({
          id: `status:${option.id}`,
          label: option.label,
        })),
      },
      {
        name: 'Job',
        isSingle: true,
        options: definitions.map((definition) => ({
          id: `kind:${definition.kind}`,
          label: definition.label,
        })),
      },
    ],
    [definitions],
  );
  const filterView = shared.view;
  const filterText = shared.text;
  const changeFilters = useCallback(
    (next: ReadonlySet<string>) => {
      const status = STATUSES.find((one) => next.has(`status:${one}`));
      const kind = definitions.find((one) => next.has(`kind:${one.kind}`))?.kind;

      onSearchChange({
        rstatus: status,
        ...logSearchFromView(
          { ...filterView, jobKinds: kind === undefined ? [] : [kind] },
          filterText,
        ),
      });
    },
    [definitions, filterText, filterView, onSearchChange],
  );
  const sortGroups = useMemo(
    () => [
      {
        name: 'Order',
        selectedId: sort,
        onSelect: (id: string) => {
          const found = SORTS.find((one) => one.id === id);

          if (found !== undefined) {
            onSearchChange({ rsort: found.id === 'newest' ? undefined : found.id });
          }
        },
        options: SORTS.map((one) => ({ id: one.id, label: one.label, detail: one.detail })),
      },
    ],
    [sort, onSearchChange],
  );
  const sortTrigger = useMemo(
    () => (
      <>
        <span className="truncate">{SORTS.find((one) => one.id === sort)?.label}</span>
        <Icon of={ChevronDownIcon} size={14} className="shrink-0" />
      </>
    ),
    [sort],
  );
  const traceRun = useCallback(
    (record: JobRunRecord) => {
      onTrace(record.id);
    },
    [onTrace],
  );

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
                        item: event.item,
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
        enableSorting: false,
        accessorFn: (record) => describeJobKind(record.kind, labels),
        cell: ({ row }) => (
          <span className="flex max-w-[12rem] items-center gap-1.5 text-text-muted">
            {pinned.has(row.original.id) ? (
              <Icon
                of={BookmarkFilledIcon}
                size={14}
                label="Pinned to the top"
                className="shrink-0"
              />
            ) : null}
            <span className="truncate" title={describeJobKind(row.original.kind, labels)}>
              {describeJobKind(row.original.kind, labels)}
            </span>
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        accessorFn: (record) => record.status,
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
                label={`What ${describeJobKind(row.original.kind, labels)} is doing`}
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
        enableSorting: false,
        accessorFn: (record) => describeRunSubject(record.subject, libraries, record.kind).name,
        cell: ({ row }) => {
          const { name, library } = describeRunSubject(
            row.original.subject,
            libraries,
            row.original.kind,
          );

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
                <span
                  className={cn(
                    'truncate text-xs',
                    row.original.status === 'failed' ? 'text-danger' : 'text-text-muted',
                  )}
                  title={row.original.errorMessage}
                >
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

          if (progress === null) {
            return null;
          }

          return (
            <span className="flex w-52 flex-col gap-1.5">
              <span className="flex items-baseline justify-between gap-3 whitespace-nowrap text-xs">
                <span className="truncate text-text-muted">{describeWords(progress.phase)}</span>

                <span className="tabular-nums text-text">
                  <AnimatedNumber value={progress.processed} />
                  <span className="text-text-muted"> of </span>
                  <AnimatedNumber value={progress.total} />
                </span>
              </span>

              <ProgressBar
                isFull
                label={`${describeJobKind(row.original.kind, labels)} progress`}
                value={row.original.status === 'completed' ? progress.total : progress.processed}
                max={Math.max(progress.total, 1)}
              />
            </span>
          );
        },
      },
      {
        id: 'when',
        header: 'When',
        enableSorting: false,
        accessorFn: (record) => record.finishedAtMs ?? record.startedAtMs ?? 0,
        cell: ({ row }) => (
          <span className="flex flex-col whitespace-nowrap tabular-nums text-text-muted">
            <span>{describeWhen(row.original)}</span>
            {row.original.startedAtMs === null || row.original.finishedAtMs === null ? null : (
              <span className="text-xs">
                took <ElapsedTime ms={row.original.finishedAtMs - row.original.startedAtMs} />
              </span>
            )}
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
              label={`Actions for ${describeJobKind(row.original.kind, labels)}`}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'pin',
                      label: pinned.has(row.original.id) ? 'Unpin from the top' : 'Pin to the top',
                      onChoose: () => {
                        togglePin(row.original.id);
                      },
                    },
                    {
                      id: 'trace',
                      label: 'Trace this run',
                      onChoose: () => {
                        onTrace(row.original.id);
                      },
                    },
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
    [labels, libraries, onViewLogs, onTrace, pinned, togglePin],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <TextField
          label="Search job runs"
          isLabelHidden
          type="search"
          size="sm"
          placeholder="Search by job, library, error or run id"
          value={typed}
          className="min-w-56 flex-1"
          onValueChange={setTyped}
        />

        <TimeRangeMenu search={search} onSearchChange={onSearchChange} />

        <OptionMenu
          label="Order"
          triggerShape="field"
          className="w-auto"
          groups={sortGroups}
          trigger={sortTrigger}
        />

        <FilterMenu
          label="Filter job runs"
          hasLabel
          groups={groups}
          selected={chosen}
          onChange={changeFilters}
        />
      </div>

      <Well>
        <StatStrip
          label="How the job runs stand"
          items={[
            {
              id: 'running',
              label: 'Running now',
              value: <AnimatedNumber value={counts.running} />,
            },
            {
              id: 'completed',
              label: 'Completed',
              value: <AnimatedNumber value={counts.completed} />,
            },
            {
              id: 'failed',
              label: 'Failed',
              value: <AnimatedNumber value={counts.failed} />,
              isAlarming: counts.failed > 0,
            },
            {
              id: 'stopped',
              label: 'Stopped',
              value: <AnimatedNumber value={counts.stopped} />,
            },
          ]}
        />
      </Well>

      <Well isFlush className="p-1">
        <DataTable
          label="What pg-boss has run"
          columns={columns}
          rows={records}
          totalRows={askedHistory.data?.total ?? records.length}
          page={page}
          onPageChange={(next) => {
            onSearchChange({ rpage: next === 0 ? undefined : next + 1 });
          }}
          getRowId={runId}
          onChooseRow={traceRun}
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
      </Well>

      <RunningWorkDialog
        title={openWork === undefined ? '' : describeJobKind(openWork.kind, labels)}
        isOpen={openWork !== undefined}
        progress={
          openWork === undefined || openWork.progress === null
            ? []
            : [{ label: describeJobKind(openWork.kind, labels), ...openWork.progress }]
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
