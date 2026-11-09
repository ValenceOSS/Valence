import { sayAgain } from '@ValenceI18n/sayAgain';
import { JobRunMix } from '@ValenceScreens/components/ObservabilityPage/components/JobRunMix/JobRunMix';
import { cn } from '@ValenceUI/cn';
import { Icon } from '@ValenceUI/Icon';
import { Info as InfoIcon, Pin as PinFilledIcon } from '@keyline-icons/react/fill';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { JobRunStatusSchema } from '@ValenceContracts/schemas/JobRun';
import { FilterSplit } from '@ValenceUI/FilterSplit';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { ScopedField } from '@ValenceUI/ScopedField';
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
import { cancelJob, pauseJob, resumeJob, watchJobs } from '@ValenceClient/admin/fetchAdmin';
import { describeWords } from '@ValenceClient/admin/describeWords';
import { describeJobKind } from '@ValenceClient/admin/describeJobKind';
import { describeLogDay, describeLogTime } from '@ValenceClient/admin/describeLogTime';
import { defaultLogView } from '@ValenceClient/admin/defaultLogView';
import { logRangeStart } from '@ValenceClient/admin/logRanges';
import { logSearchFromView } from '@ValenceClient/admin/logSearchFromView';
import { logViewFromSearch } from '@ValenceClient/admin/logViewFromSearch';
import { timeRangeChoice } from '@ValenceScreens/components/ObservabilityPage/components/TimeRangeMenu/timeRangeChoice';
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
import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import { say } from '@ValenceI18n/say';
import { Sentence } from '@ValenceScreens/components/Sentence/Sentence';
import { usePageIsShown } from '@ValenceScreens/visibility/usePageIsShown';

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
  {
    id: 'newest',
    label: say('common.newestFirst'),
    detail: say('screens.observabilityPage.jobHistory.whatJustRan'),
  },
  {
    id: 'oldest',
    label: say('common.oldestFirst'),
    detail: say('screens.observabilityPage.jobHistory.inTheOrderItHappened'),
  },
  {
    id: 'longest',
    label: say('screens.observabilityPage.jobHistory.longestFirst'),
    detail: say('screens.observabilityPage.jobHistory.whatTookTheMostTime'),
  },
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

const describeAgo = (atMs: number): string => {
  const minutes = Math.round((Date.now() - atMs) / 60_000);

  if (minutes < 1) {
    return say('client.history.describeWhen.justNow');
  }

  if (minutes < 60) {
    return say('client.history.describeWhen.minutesMinAgo', { minutes: minutes.toString() });
  }

  if (minutes < 24 * 60) {
    return say('screens.observabilityPage.jobHistory.hoursAgo', {
      hours: Math.round(minutes / 60).toString(),
    });
  }

  return describeMoment(atMs);
};

const describeTook = (ms: number): string =>
  ms < 1000
    ? ''
    : ms < 60_000
      ? say('screens.observabilityPage.jobHistory.seconds', {
          seconds: Math.round(ms / 1000).toString(),
        })
      : say('screens.observabilityPage.jobHistory.minutesAndSeconds', {
          minutes: Math.floor(ms / 60_000).toString(),
          seconds: Math.round((ms % 60_000) / 1000).toString(),
        });

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

  return record.startedAtMs === null
    ? say('common.queued')
    : say('screens.observabilityPage.jobHistory.running');
};

/**
 * The persisted record of what the job queue has actually run: not only what the queue is doing this
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
    () => new Map(definitions.map((definition) => [definition.kind, sayAgain(definition.label)])),
    [definitions],
  );

  const { rq, rstatus, rsubject, rsort, range, from, until } = search;
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
  const [showsRoutine, setShowsRoutine] = useState(false);
  const narrowing = useMemo(
    () => ({
      sort,
      search: rq ?? '',
      sinceMs: from ?? logRangeStart(range ?? defaultLogView().range, anchor),
      untilMs: until ?? null,
      kind: rkind ?? null,
      subject: rsubject ?? null,
      hidesRoutine: !showsRoutine,
    }),
    [rq, range, from, until, sort, anchor, rkind, rsubject, showsRoutine],
  );
  const isAsOpened =
    rq === undefined &&
    rstatus === undefined &&
    rsubject === undefined &&
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
  const refreshHistory = useCallback(() => {
    void cache.invalidateQueries({ queryKey: adminQueries.jobHistory(query).queryKey.slice(0, 2) });
  }, [cache, query]);
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
  const issuesText = describeRunIssues(failure === null ? null : sayAgain(failure), issues);
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
        name: say('common.status'),
        isSingle: true,
        options: STATUS_FILTER_OPTIONS.map((option) => ({
          id: `status:${option.id}`,
          label: option.label,
        })),
      },
      {
        name: say('common.job'),
        isSingle: true,
        options: definitions.map((definition) => ({
          id: `kind:${definition.kind}`,
          label: sayAgain(definition.label),
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
  const isShown = usePageIsShown();
  const traceRun = useCallback(
    (record: JobRunRecord) => {
      onTrace(record.id);
    },
    [onTrace],
  );

  useEffect(() => {
    if (!isShown) {
      return;
    }

    let pending: ReturnType<typeof setTimeout> | null = null;

    void cache.invalidateQueries({ queryKey: [...adminQueries.key, 'jobHistory'] });

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
  }, [cache, isShown]);

  const closeIssues = () => {
    setOpenIssuesFor(null);
  };

  const shownRecords = records;

  const columns = useMemo<DataTableColumn<JobRunRecord>[]>(
    () => [
      {
        id: 'kind',
        header: say('common.job'),
        enableSorting: false,
        accessorFn: (record) => describeJobKind(record.kind, labels),
        cell: ({ row }) => (
          <span className="flex min-w-48 max-w-[30rem] flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-1.5 text-text">
              {pinned.has(row.original.id) ? (
                <Icon
                  of={PinFilledIcon}
                  size={14}
                  label={say('screens.observabilityPage.jobHistory.pinnedToTheTop')}
                  className="shrink-0"
                />
              ) : null}
              <span className="truncate" title={describeJobKind(row.original.kind, labels)}>
                {describeJobKind(row.original.kind, labels)}
              </span>
            </span>
            <span className="truncate text-xs text-text-muted xl:hidden">
              {describeRunSubject(row.original.subject, libraries, row.original.kind).name}
            </span>
            {row.original.progress === null || row.original.status === 'completed' ? null : (
              <span className="mt-1 flex w-56 max-w-full flex-col gap-1 xl:hidden">
                <span className="flex items-baseline justify-between gap-3 whitespace-nowrap text-xs text-text-muted">
                  <span className="truncate">
                    {describeWords(sayAgain(row.original.progress.phase))}
                  </span>
                  <span className="tabular-nums">
                    {say('common.doneOfTotal', {
                      done: row.original.progress.processed.toLocaleString(),
                      total: row.original.progress.total.toLocaleString(),
                    })}
                  </span>
                </span>
                <ProgressBar
                  isFull
                  label={say('screens.observabilityPage.jobHistory.kindProgress', {
                    kind: describeJobKind(row.original.kind, labels),
                  })}
                  value={row.original.progress.processed}
                  max={Math.max(row.original.progress.total, 1)}
                />
              </span>
            )}
            {row.original.errorMessage === null ? null : (
              <span
                className={cn(
                  'line-clamp-2 whitespace-normal text-xs leading-snug',
                  row.original.status === 'failed' ? 'text-danger' : 'text-text-muted',
                )}
                title={sayAgain(row.original.errorMessage)}
              >
                {sayAgain(row.original.errorMessage)}
              </span>
            )}
          </span>
        ),
      },
      {
        id: 'status',
        header: say('common.status'),
        enableSorting: false,
        accessorFn: (record) => record.status,
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            {row.original.isPaused === true ? (
              <Badge size="sm" tone="waiting">
                {say('common.paused')}
              </Badge>
            ) : (
              <Badge size="sm" tone={describeJobStatus(row.original.status).tone}>
                {describeJobStatus(row.original.status).label}
              </Badge>
            )}

            {row.original.status === 'running' ? (
              <Button
                variant="subtle"
                size="none"
                isIconOnly
                label={say('screens.observabilityPage.jobHistory.whatKindIsDoing', {
                  kind: describeJobKind(row.original.kind, labels),
                })}
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
        header: say('common.subject'),
        enableSorting: false,
        meta: { showsOnlyWhenWide: true },
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
                <span className="truncate text-text-muted" title={name}>
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
                              <dt className="text-text-muted">{say('common.library')}</dt>
                              <dd className="text-text">{library.name}</dd>
                            </div>

                            <div className="flex flex-col">
                              <dt className="text-text-muted">{say('common.kind')}</dt>
                              <dd className="text-text">
                                {LIBRARY_KIND_NAMES[library.kind].label}
                              </dd>
                            </div>

                            <div className="flex flex-col">
                              <dt className="text-text-muted">
                                {say('screens.observabilityPage.jobHistory.folder')}
                              </dt>
                              <dd className="break-all text-text">{library.path}</dd>
                            </div>

                            <div className="flex flex-col">
                              <dt className="text-text-muted">{say('common.items')}</dt>
                              <dd className="tabular-nums text-text">
                                {library.itemCount.toString()}
                              </dd>
                            </div>
                          </>
                        )}

                        <div className="flex flex-col">
                          <dt className="text-text-muted">
                            {library === null ? say('common.subject') : 'ID'}
                          </dt>
                          <dd className="break-all text-text">{row.original.subject}</dd>
                        </div>

                        <div className="flex flex-col">
                          <dt className="text-text-muted">{say('common.run')}</dt>
                          <dd className="break-all text-text">{row.original.id}</dd>
                        </div>
                      </dl>
                    }
                  >
                    <Icon of={InfoIcon} size={15} tone="muted" className="shrink-0" />
                  </HoverCard>
                )}
              </span>
            </span>
          );
        },
      },
      {
        id: 'progress',
        header: say('common.progress'),
        enableSorting: false,
        meta: { showsOnlyWhenWide: true },
        cell: ({ row }) => {
          const progress = row.original.progress;

          if (progress === null || row.original.status === 'completed') {
            return null;
          }

          return (
            <span className="flex w-48 flex-col gap-1.5">
              <span className="flex items-baseline justify-between gap-3 whitespace-nowrap text-xs">
                <span className="truncate text-text-muted">
                  {describeWords(sayAgain(progress.phase))}
                </span>

                <span className="tabular-nums text-text-muted">
                  <Sentence
                    words="common.doneOfTotal"
                    fillings={{
                      done: (
                        <span className="text-text">
                          <FormattedNumber value={progress.processed} />
                        </span>
                      ),
                      total: (
                        <span className="text-text">
                          <FormattedNumber value={progress.total} />
                        </span>
                      ),
                    }}
                  />
                </span>
              </span>

              <ProgressBar
                isFull
                label={say('screens.observabilityPage.jobHistory.kindProgress', {
                  kind: describeJobKind(row.original.kind, labels),
                })}
                value={progress.processed}
                max={Math.max(progress.total, 1)}
              />
            </span>
          );
        },
      },
      {
        id: 'when',
        header: say('screens.observabilityPage.jobHistory.when'),
        accessorFn: (record) => record.finishedAtMs ?? record.startedAtMs ?? 0,
        cell: ({ row }) => (
          <span
            className="whitespace-nowrap tabular-nums text-text-muted"
            title={describeMoment(row.original.finishedAtMs)}
          >
            {row.original.finishedAtMs === null
              ? describeWhen(row.original)
              : describeAgo(row.original.finishedAtMs)}
          </span>
        ),
      },
      {
        id: 'took',
        header: say('common.took'),
        enableSorting: false,
        meta: { shrinks: true },
        cell: ({ row }) =>
          row.original.startedAtMs === null || row.original.finishedAtMs === null ? null : (
            <span className="block whitespace-nowrap text-right tabular-nums text-text-muted">
              {describeTook(row.original.finishedAtMs - row.original.startedAtMs)}
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
              label={say('screens.observabilityPage.jobHistory.actionsForKind', {
                kind: describeJobKind(row.original.kind, labels),
              })}
              groups={[
                {
                  items: [
                    {
                      id: 'pin',
                      label: pinned.has(row.original.id)
                        ? say('screens.observabilityPage.jobHistory.unpinFromTheTop')
                        : say('screens.observabilityPage.jobHistory.pinToTheTop'),
                      onChoose: () => {
                        togglePin(row.original.id);
                      },
                    },
                    {
                      id: 'trace',
                      label: say('screens.observabilityPage.jobHistory.traceThisRun'),
                      onChoose: () => {
                        onTrace(row.original.id);
                      },
                    },
                    {
                      id: 'logs',
                      label: say('common.readTheLogs'),
                      onChoose: () => {
                        onViewLogs(row.original.id);
                      },
                    },
                    {
                      id: 'issues',
                      label: say('screens.observabilityPage.jobHistory.viewIssues'),
                      onChoose: () => {
                        setOpenIssuesFor(row.original.id);
                      },
                    },
                  ],
                },
                ...(row.original.status === 'running'
                  ? [
                      {
                        items: [
                          {
                            id: 'pause',
                            label:
                              row.original.isPaused === true
                                ? say('common.resume')
                                : say('common.pause'),
                            onChoose: () => {
                              void (
                                row.original.isPaused === true
                                  ? resumeJob(row.original.id)
                                  : pauseJob(row.original.id)
                              ).then(refreshHistory);
                            },
                          },
                          {
                            id: 'cancel',
                            label: say('common.cancel'),
                            isDestructive: true,
                            onChoose: () => {
                              void cancelJob(row.original.id).then(refreshHistory);
                            },
                          },
                        ],
                      },
                    ]
                  : []),
              ]}
            />
          </span>
        ),
      },
    ],
    [labels, libraries, onViewLogs, onTrace, pinned, togglePin, refreshHistory],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ScopedField
          label={say('screens.observabilityPage.jobHistory.searchJobRuns')}
          isLabelHidden
          placeholder={say('screens.observabilityPage.jobHistory.searchByJobLibraryErrorOr')}
          value={typed}
          onValueChange={setTyped}
          choices={[
            timeRangeChoice(search, onSearchChange),
            {
              label: say('common.order'),
              options: SORTS.map((one) => ({ id: one.id, label: one.label, detail: one.detail })),
              value: sort,
              onChange: (id) => {
                const found = SORTS.find((one) => one.id === id);

                if (found !== undefined) {
                  onSearchChange({ rsort: found.id === 'newest' ? undefined : found.id });
                }
              },
            },
          ]}
          className="min-w-[24rem] flex-1"
        />

        <FilterSplit
          label={say('screens.observabilityPage.jobHistory.filterJobRuns')}
          groups={groups}
          selected={chosen}
          onChange={changeFilters}
        />

        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            setShowsRoutine(!showsRoutine);
          }}
        >
          {showsRoutine
            ? say('screens.observabilityPage.jobHistory.hideRoutineChecks')
            : say('screens.observabilityPage.jobHistory.showRoutineChecks')}
        </Button>
      </div>

      <Well>
        <JobRunMix
          running={counts.running}
          completed={counts.completed}
          failed={counts.failed}
          stopped={counts.stopped}
        />
      </Well>

      <DataTable
        className="m-0 in-[.valence-card-face]:-mx-4 in-[.valence-card-face]:-mb-4"
        label={say('screens.observabilityPage.jobHistory.whatTheJobQueueHasRun')}
        columns={columns.filter(
          (column) =>
            (column.id !== 'progress' ||
              shownRecords.some(
                (record) => record.progress !== null && record.status !== 'completed',
              )) &&
            (column.id !== 'took' ||
              shownRecords.some(
                (record) =>
                  record.startedAtMs !== null &&
                  record.finishedAtMs !== null &&
                  record.finishedAtMs - record.startedAtMs >= 1000,
              )),
        )}
        rows={shownRecords}
        totalRows={askedHistory.data?.total ?? records.length}
        page={page}
        onPageChange={(next) => {
          onSearchChange({ rpage: next === 0 ? undefined : next + 1 });
        }}
        getRowId={runId}
        onChooseRow={traceRun}
        sorting={sort === 'longest' ? null : { id: 'when', isDescending: sort === 'newest' }}
        onSortingChange={(next) => {
          onSearchChange({
            rsort: next === null || next.isDescending ? undefined : 'oldest',
            rpage: undefined,
          });
        }}
        filters={{
          ...(rstatus === undefined ? {} : { status: rstatus }),
          ...(rsubject === undefined ? {} : { subject: rsubject }),
        }}
        onFiltersChange={(id, value) => {
          if (id === 'status') {
            const status = JobRunStatusSchema.safeParse(value);

            onSearchChange({ rstatus: status.success ? status.data : undefined, rpage: undefined });
          }

          if (id === 'subject') {
            onSearchChange({ rsubject: value, rpage: undefined });
          }
        }}
        height="fill"
        pageSize={ROWS_PER_PAGE}
        emptyMessage={
          askedHistory.isError
            ? say('screens.observabilityPage.jobHistory.jobHistoryCouldNotBeRead')
            : askedHistory.isPending
              ? say('screens.observabilityPage.jobHistory.readingJobHistory')
              : say('screens.observabilityPage.jobHistory.noJobRunsMatchThis')
        }
      />

      <RunningWorkDialog
        title={openWork === undefined ? '' : describeJobKind(openWork.kind, labels)}
        isOpen={openWork !== undefined}
        progress={
          openWork === undefined || openWork.progress === null
            ? []
            : [
                {
                  label: describeJobKind(openWork.kind, labels),
                  ...openWork.progress,
                  phase: sayAgain(openWork.progress.phase),
                },
              ]
        }
        tasks={working.filter((task) => task.correlationId === openWorkFor)}
        onClose={() => {
          setOpenWorkFor(null);
        }}
      />

      <Dialog
        label={say('screens.observabilityPage.jobHistory.jobRunIssues')}
        isOpen={openIssuesFor !== null}
        onClose={closeIssues}
      >
        {openIssuesFor === null ? null : (
          <>
            <DialogTitle title={say('screens.observabilityPage.jobHistory.issuesFromThisRun')} />

            <DialogContent>
              {askedIssues.isPending ? (
                <p className="text-sm text-text-muted">
                  {say('screens.observabilityPage.jobHistory.readingIssues')}
                </p>
              ) : issuesText === '' ? (
                <p className="text-sm text-text-muted">
                  {say('screens.observabilityPage.jobHistory.noIssuesWereRecordedForThis')}
                </p>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-xs text-text">
                  {issuesText}
                </pre>
              )}
            </DialogContent>

            <DialogFooter
              dismiss={{ label: say('common.close'), onChoose: closeIssues }}
              confirm={{
                label: say('common.copy'),
                isDisabled: issuesText === '',
                onChoose: () => {
                  void navigator.clipboard.writeText(issuesText).then(() => {
                    notify.worked(say('common.copiedToTheClipboard'));
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
