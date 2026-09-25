import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  ChevronDown as ChevronDownIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Radio as RadioIcon,
  RefreshCw as RefreshCwIcon,
  Terminal as TerminalIcon,
  X as XIcon,
} from '@keyline-icons/react';
import { Copy as CopyFilledIcon, Download as DownloadFilledIcon } from '@keyline-icons/react/fill';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { AppliedFilters } from '@ValenceUI/AppliedFilters';
import { BarList } from '@ValenceUI/BarList';
import { Button } from '@ValenceUI/Button';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { Well } from '@ValenceUI/Well';
import { FilterMenu } from '@ValenceUI/FilterMenu';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { TextField } from '@ValenceUI/TextField';
import { TimeBars } from '@ValenceUI/TimeBars';
import { notify } from '@ValenceUI/notify';
import { LOG_LEVELS, LOG_SOURCES } from '@ValenceContracts/schemas/Log';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { describeJobKind } from '@ValenceClient/admin/describeJobKind';
import { describeLogDay, describeLogTime } from '@ValenceClient/admin/describeLogTime';
import { describeLogSpan, describeLogTick } from '@ValenceClient/admin/describeLogTick';
import { logLineAsText } from '@ValenceClient/admin/logLineAsText';
import {
  logFacetsQueryFor,
  logHistogramQueryFor,
  logQueryFor,
} from '@ValenceClient/admin/logQueryFor';
import { logsAsText } from '@ValenceClient/admin/logsAsText';
import { logSearchFromView } from '@ValenceClient/admin/logSearchFromView';
import { logViewFromSearch } from '@ValenceClient/admin/logViewFromSearch';
import { logViewFromSelection } from '@ValenceClient/admin/logViewFromSelection';
import { logFilterId, logViewSelection } from '@ValenceClient/admin/logViewSelection';
import { useAnchoredNow } from '@ValenceScreens/admin/useAnchoredNow';
import { downloadText } from '@ValenceScreens/admin/downloadText';
import { applyTypedSearch } from '@ValenceScreens/admin/applyTypedSearch';
import { describeLogLevel } from '@ValenceScreens/admin/describeLogLevel';
import { LogDetailDialog } from '@ValenceScreens/components/ObservabilityPage/components/LogDetailDialog/LogDetailDialog';
import { LogLine } from './components/LogLine/LogLine';
import { TimeRangeMenu } from '@ValenceScreens/components/ObservabilityPage/components/TimeRangeMenu/TimeRangeMenu';
import { LevelToggles } from './components/LevelToggles/LevelToggles';
import type { FilterGroup } from '@ValenceUI/FilterMenu.types';
import type { LogView } from '@ValenceClient/admin/logView.types';
import type { LogLevel, LogRecord, LogSort } from '@ValenceContracts/schemas/Log';
import type { LogExplorerProps } from './LogExplorer.types';

const LIVE_EVERY_MS = 3000;

const TYPING_MS = 350;

const SORTS: readonly { id: LogSort; labelKey: StringKey; detailKey: StringKey }[] = [
  {
    id: 'newest',
    labelKey: 'screens.logExplorer.newestFirst',
    detailKey: 'screens.logExplorer.newestFirstDetail',
  },
  {
    id: 'oldest',
    labelKey: 'screens.logExplorer.oldestFirst',
    detailKey: 'screens.logExplorer.oldestFirstDetail',
  },
  {
    id: 'severest',
    labelKey: 'screens.logExplorer.severestFirst',
    detailKey: 'screens.logExplorer.severestFirstDetail',
  },
  {
    id: 'busiest',
    labelKey: 'screens.logExplorer.busiestFirst',
    detailKey: 'screens.logExplorer.busiestFirstDetail',
  },
];

const writeToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};

/**
 * Reads the server's log the way an operator investigates with it: a graph of what happened when,
 * the sources and jobs that said the most, and the lines themselves beneath — every one of them
 * narrowing the rest when pressed.
 *
 * Filters are the same few words wherever they come from. Choosing from the menu, pressing a bar in
 * the top lists, pressing an identifier in an open line and typing `job:abc123` followed by a space
 * all arrive at the same chip, and the chips are the whole of what the log is narrowed to. Dragging
 * across the graph zooms into a stretch of time, and the graph, the figures and the lines all follow.
 *
 * The figures, the graph and the lines are asked of the server together and describe the same
 * records, so they cannot disagree. Turning live on asks again every few seconds; the graph and the
 * lines are kept on screen while the answer is fetched rather than blinking away.
 *
 * @param definitions - The jobs the server offers, for offering their kinds as filters.
 * @param search - What the address says the log is narrowed to, ordered by and zoomed to.
 * @param onSearchChange - Told each change, to write into the address.
 * @param onTraceJob - Told a job's id, to follow everything that job did.
 * @param copy - How text reaches the clipboard.
 * @param download - How a file is handed over.
 */
const LogExplorer = ({
  definitions,
  search,
  onSearchChange,
  onTraceJob,
  copy = writeToClipboard,
  download = downloadText,
}: LogExplorerProps) => {
  const { q, range, from, until, sort } = search;
  const parsed = useMemo(
    () =>
      logViewFromSearch({
        ...(q === undefined ? {} : { q }),
        ...(range === undefined ? {} : { range }),
        ...(from === undefined ? {} : { from }),
        ...(until === undefined ? {} : { until }),
        ...(sort === undefined ? {} : { sort }),
      }),
    [q, range, from, until, sort],
  );
  const view = parsed.view;
  const [typed, setTyped] = useState(parsed.text);
  const said = useRef(parsed.text);
  const [anchor, setAnchor] = useAnchoredNow(range);
  const [isLive, setIsLive] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);
  const [hasTime, setHasTime] = useState(true);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [reading, setReading] = useState<LogRecord | null>(null);

  useEffect(() => {
    if (parsed.text !== said.current) {
      said.current = parsed.text;
      setTyped(parsed.text);
    }
  }, [parsed.text]);

  useEffect(() => {
    const words = typed.trim();

    if (words === said.current) {
      return;
    }

    const timer = setTimeout(() => {
      said.current = words;
      onSearchChange(logSearchFromView(view, words));
      setAnchor();
    }, TYPING_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [typed, view, onSearchChange, setAnchor]);

  const shown = useMemo<LogView>(() => ({ ...view, search: parsed.text }), [view, parsed.text]);
  const asked = useMemo(
    () => ({
      records: logQueryFor(shown, anchor),
      histogram: logHistogramQueryFor({ ...shown, levels: [...LOG_LEVELS] }, anchor),
      facets: logFacetsQueryFor(shown, anchor),
    }),
    [shown, anchor],
  );

  const watching = isLive ? LIVE_EVERY_MS : false;
  const askedLogs = useInfiniteQuery({
    ...adminQueries.logPages(asked.records),
    placeholderData: keepPreviousData,
    refetchInterval: watching,
  });
  const askedHistogram = useQuery({
    ...adminQueries.logHistogram(asked.histogram),
    placeholderData: keepPreviousData,
    refetchInterval: watching,
  });
  const askedFacets = useQuery({
    ...adminQueries.logFacets(asked.facets),
    placeholderData: keepPreviousData,
    refetchInterval: watching,
  });

  const pages = askedLogs.data?.pages;
  const records = useMemo(() => {
    const seen = new Set<string>();
    const found: LogRecord[] = [];

    for (const record of (pages ?? []).flatMap((page) => page.records)) {
      if (!seen.has(record.id)) {
        seen.add(record.id);
        found.push(record);
      }
    }

    return found;
  }, [pages]);
  const total = pages?.at(-1)?.total ?? 0;
  const histogram = askedHistogram.data;
  const spanMs = histogram === undefined ? 0 : histogram.untilMs - histogram.fromMs;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = askedLogs;
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLLIElement>(null);
  const canWatchTheEnd = typeof IntersectionObserver !== 'undefined';

  useEffect(() => {
    const end = sentinel.current;

    if (!canWatchTheEnd || end === null || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const watcher = new IntersectionObserver(
      (seen) => {
        if (seen.some((one) => one.isIntersecting)) {
          void fetchNextPage();
        }
      },
      { root: scroller.current, rootMargin: '0px 0px 240px 0px' },
    );

    watcher.observe(end);

    return () => {
      watcher.disconnect();
    };
  }, [canWatchTheEnd, hasNextPage, isFetchingNextPage, fetchNextPage, records.length]);

  const change = (next: LogView) => {
    said.current = typed.trim();
    onSearchChange(logSearchFromView(next, typed.trim()));
    setAnchor();
  };

  const narrowTo = (filterId: string) => {
    change(applyTypedSearch(`${filterId} `, view).view);
  };

  const withLevels = (filters: ReadonlySet<string>): LogView =>
    logViewFromSelection(
      view,
      new Set([...filters, ...view.levels.map((level) => logFilterId('level', level))]),
    );

  const toggleLevel = (level: LogLevel) => {
    const isOn = view.levels.includes(level);

    if (isOn && view.levels.length === 1) {
      return;
    }

    change({
      ...view,
      levels: LOG_LEVELS.filter((one) => (one === level ? !isOn : view.levels.includes(one))),
    });
  };

  const kindOptions = useMemo(
    () => [...new Set([...definitions.map((definition) => definition.kind), ...view.jobKinds])],
    [definitions, view.jobKinds],
  );
  const labels = useMemo(
    () => new Map(definitions.map((definition) => [definition.kind, definition.label])),
    [definitions],
  );
  const selection = useMemo(
    () => new Set([...logViewSelection(view)].filter((id) => !id.startsWith('level:'))),
    [view],
  );
  const groups = useMemo<FilterGroup[]>(() => {
    const identifiers = (
      [
        ['job', view.ids.jobId, 'screens.logExplorer.jobField'],
        ['library', view.ids.libraryId, 'screens.logExplorer.libraryField'],
        ['media', view.ids.mediaId, 'screens.logExplorer.mediaField'],
        ['session', view.ids.sessionId, 'screens.logExplorer.sessionField'],
        ['request', view.ids.requestId, 'screens.logExplorer.requestField'],
      ] as const
    ).flatMap(([key, value, name]) =>
      value === undefined
        ? []
        : [
            {
              id: logFilterId(key, value),
              label: say('screens.logExplorer.identifierItem', { field: say(name), value }),
            },
          ],
    );

    return [
      {
        name: say('screens.logExplorer.sourceFilter'),
        options: LOG_SOURCES.map((source) => ({
          id: logFilterId('source', source),
          label: source,
        })),
      },
      {
        name: say('screens.logExplorer.jobFilter'),
        options: kindOptions.map((kind) => ({
          id: logFilterId('kind', kind),
          label: describeJobKind(kind, labels),
        })),
      },
      ...(identifiers.length === 0
        ? []
        : [{ name: say('screens.logExplorer.identifierFilter'), options: identifiers }]),
    ];
  }, [kindOptions, labels, view.ids]);

  const applied = selection;
  const sortLabel = SORTS.find((one) => one.id === view.sort)?.labelKey;

  const copyVisible = () => {
    void copy(logsAsText(records)).then(() => {
      notify.worked(say('screens.logExplorer.copied'));
    });
  };

  const lines = records.flatMap((record, at) => {
    const previous = records[at - 1];
    const isNewDay =
      previous === undefined || describeLogDay(previous.atMs) !== describeLogDay(record.atMs);

    return [
      ...(isNewDay
        ? [
            <li
              key={`day-${record.id}`}
              role="separator"
              className="bg-[var(--surface-hover)] px-3 py-1 text-[0.6875rem] uppercase tracking-[0.14em] text-text-muted"
            >
              {describeLogDay(record.atMs)}
            </li>,
          ]
        : []),
      <LogLine
        key={record.id}
        record={record}
        isExpanded={open.has(record.id)}
        isWrapped={isWrapped}
        hasTime={hasTime}
        onToggle={() => {
          setOpen((was) => {
            const next = new Set(was);

            if (!next.delete(record.id)) {
              next.add(record.id);
            }

            return next;
          });
        }}
        onFilter={narrowTo}
        onOpen={() => {
          setReading(record);
        }}
        onCopy={() => {
          void copy(logLineAsText(record)).then(() => {
            notify.worked(say('screens.logExplorer.copiedLine'));
          });
        }}
        onTrace={onTraceJob}
        describeKind={(kind) => describeJobKind(kind, labels)}
      />,
    ];
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <TextField
          label={say('screens.logExplorer.searchLabel')}
          isLabelHidden
          type="search"
          size="sm"
          placeholder={say('screens.logExplorer.searchPlaceholder')}
          value={typed}
          className="min-w-64 flex-1"
          onValueChange={(next) => {
            const applied = applyTypedSearch(next, view);

            setTyped(applied.typed);

            if (applied.view !== view) {
              said.current = applied.typed.trim();
              onSearchChange(logSearchFromView(applied.view, applied.typed.trim()));
              setAnchor();
            }
          }}
        />

        <TimeRangeMenu search={search} onSearchChange={onSearchChange} />

        <OptionMenu
          label={say('screens.logExplorer.orderLabel')}
          triggerShape="field"
          className="w-auto"
          groups={[
            {
              name: say('screens.logExplorer.orderGroup'),
              selectedId: view.sort,
              onSelect: (id) => {
                const sort = SORTS.find((one) => one.id === id);

                if (sort !== undefined) {
                  change({ ...view, sort: sort.id });
                }
              },
              options: SORTS.map((sort) => ({
                id: sort.id,
                label: say(sort.labelKey),
                detail: say(sort.detailKey),
              })),
            },
          ]}
          trigger={
            <>
              <span className="truncate">{sortLabel === undefined ? null : say(sortLabel)}</span>
              <Icon of={ChevronDownIcon} size={14} className="shrink-0" />
            </>
          }
        />

        <FilterMenu
          label={say('screens.logExplorer.filterLabel')}
          hasLabel
          groups={groups}
          selected={selection}
          onChange={(next) => {
            change(withLevels(next));
          }}
        />

        <Button
          variant="secondary"
          size="sm"
          isActive={isLive}
          aria-pressed={isLive}
          onClick={() => {
            setIsLive((was) => !was);
          }}
        >
          <Icon of={RadioIcon} size={15} />
          {say('screens.logExplorer.live')}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          label={say('screens.logExplorer.refresh')}
          onClick={() => {
            setAnchor();
          }}
        >
          <Icon of={RefreshCwIcon} size={16} />
        </Button>

        <ActionMenu
          label={say('screens.logExplorer.moreLabel')}
          trigger={<Icon of={MoreHorizontalIcon} size={16} />}
          groups={[
            {
              items: [
                {
                  id: 'copy',
                  label: say('screens.logExplorer.copyLines'),
                  icon: <Icon of={CopyFilledIcon} size={15} />,
                  isDisabled: records.length === 0,
                  onChoose: copyVisible,
                },
                {
                  id: 'download',
                  label: say('screens.logExplorer.downloadLines'),
                  icon: <Icon of={DownloadFilledIcon} size={15} />,
                  isDisabled: records.length === 0,
                  onChoose: () => {
                    download(
                      `valence-log-${new Date().toISOString().slice(0, 10)}.txt`,
                      logsAsText(records),
                    );
                  },
                },
              ],
            },
            {
              name: say('screens.logExplorer.viewGroup'),
              items: [
                {
                  id: 'wrap',
                  label: isWrapped
                    ? say('screens.logExplorer.cutLines')
                    : say('screens.logExplorer.wrapLines'),
                  onChoose: () => {
                    setIsWrapped((was) => !was);
                  },
                },
                {
                  id: 'time',
                  label: hasTime
                    ? say('screens.logExplorer.hideTime')
                    : say('screens.logExplorer.showTime'),
                  onChoose: () => {
                    setHasTime((was) => !was);
                  },
                },
              ],
            },
          ]}
        />
      </div>

      {applied.size === 0 && view.zoom === null ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <AppliedFilters
            groups={groups}
            selected={applied}
            onRemove={(id) => {
              const next = new Set(selection);

              next.delete(id);
              change(withLevels(next));
            }}
            onClear={() => {
              change({
                ...view,
                sources: [],
                jobKinds: [],
                ids: {},
              });
            }}
          />

          {view.zoom === null ? null : (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                change({ ...view, zoom: null });
              }}
            >
              {say('screens.logExplorer.zoomedTo', {
                from: describeLogTime(view.zoom.fromMs),
                until: describeLogTime(view.zoom.untilMs),
              })}
              <Icon of={XIcon} size={13} />
            </Button>
          )}
        </div>
      )}

      <Well className="flex flex-col gap-3">
        <LevelToggles
          histogram={histogram}
          levels={view.levels}
          isReading={askedHistogram.isFetching}
          onToggle={toggleLevel}
        />

        {histogram === undefined ? null : (
          <TimeBars
            hasLegend={false}
            bars={histogram.buckets.map((bucket) => ({
              atMs: bucket.atMs,
              values: {
                debug: bucket.debug,
                info: bucket.info,
                warn: bucket.warn,
                error: bucket.error,
              },
            }))}
            series={LOG_LEVELS.filter((level) => view.levels.includes(level)).map((level) => ({
              key: level,
              label: describeLogLevel(level).label,
              colour: describeLogLevel(level).colour,
            }))}
            bucketMs={histogram.bucketMs}
            label={say('screens.logExplorer.barsLabel')}
            formatTick={(atMs) => describeLogTick(atMs, spanMs)}
            formatSpan={describeLogSpan}
            onPickRange={(fromMs, untilMs) => {
              change({ ...view, zoom: { fromMs, untilMs } });
            }}
          />
        )}
      </Well>

      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <HeadedSection
          isInset
          title={say('screens.logExplorer.linesHeading')}
          actions={
            <span aria-live="polite" className="text-xs tabular-nums text-text-muted">
              {say('screens.logExplorer.showing')}
              <AnimatedNumber value={records.length} />
              {say('screens.logExplorer.showingOf')}
              <AnimatedNumber value={total} />
            </span>
          }
        >
          <div className="relative min-h-[26rem] flex-1">
            <div
              ref={scroller}
              className="max-h-[70svh] overflow-y-auto overscroll-contain lg:absolute lg:inset-0 lg:max-h-none"
            >
              {askedLogs.isPending ? (
                <p className="py-6 text-sm text-text-muted">{say('screens.logExplorer.reading')}</p>
              ) : records.length === 0 ? (
                <NothingHere
                  of={TerminalIcon}
                  title={say('screens.logExplorer.emptyTitle')}
                  detail={say('screens.logExplorer.emptyDetail')}
                />
              ) : (
                <ul
                  aria-label={say('screens.logExplorer.linesLabel')}
                  className="flex flex-col divide-y divide-[var(--surface-line)]"
                >
                  {lines}

                  <li ref={sentinel} className="flex justify-center py-3 text-xs text-text-muted">
                    {isFetchingNextPage ? (
                      say('screens.logExplorer.loadingMore')
                    ) : hasNextPage ? (
                      canWatchTheEnd ? null : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            void fetchNextPage();
                          }}
                        >
                          {say('screens.logExplorer.showMore')}
                        </Button>
                      )
                    ) : records.length < total ? (
                      say('screens.logExplorer.asFarAsItReads')
                    ) : (
                      say('screens.logExplorer.everything')
                    )}
                  </li>
                </ul>
              )}
            </div>
          </div>
        </HeadedSection>

        <div className="flex flex-col gap-6">
          <HeadedSection isInset title={say('screens.logExplorer.topSources')}>
            <BarList
              label={say('screens.logExplorer.topSourcesLabel')}
              heading={say('screens.logExplorer.sourceHeading')}
              valueHeading={say('screens.logExplorer.eventsHeading')}
              emptyMessage={say('screens.logExplorer.topSourcesEmpty')}
              items={(askedFacets.data?.sources ?? []).map((facet) => ({
                id: logFilterId('source', facet.value),
                label: facet.value,
                value: facet.events,
              }))}
              chosen={selection}
              onChoose={narrowTo}
            />
          </HeadedSection>

          <HeadedSection isInset title={say('screens.logExplorer.topJobs')}>
            <BarList
              label={say('screens.logExplorer.topJobsLabel')}
              heading={say('screens.logExplorer.jobHeading')}
              valueHeading={say('screens.logExplorer.eventsHeading')}
              emptyMessage={say('screens.logExplorer.topJobsEmpty')}
              items={(askedFacets.data?.jobKinds ?? []).map((facet) => ({
                id: logFilterId('kind', facet.value),
                label: describeJobKind(facet.value, labels),
                value: facet.events,
              }))}
              chosen={selection}
              onChoose={narrowTo}
            />
          </HeadedSection>
        </div>
      </div>

      <LogDetailDialog
        record={reading}
        isOpen={reading !== null}
        onClose={() => {
          setReading(null);
        }}
        onOpenJob={(jobId) => {
          setReading(null);
          onTraceJob(jobId);
        }}
      />
    </div>
  );
};

LogExplorer.displayName = 'LogExplorer';

export { LogExplorer };
