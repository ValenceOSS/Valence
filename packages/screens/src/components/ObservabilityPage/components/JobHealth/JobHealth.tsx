import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { say } from '@ValenceI18n/say';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { StatStrip } from '@ValenceUI/StatStrip';
import { useAnchoredNow } from '@ValenceScreens/admin/useAnchoredNow';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { defaultLogView } from '@ValenceClient/admin/defaultLogView';
import { logRangeStart } from '@ValenceClient/admin/logRanges';
import { TimeRangeMenu } from '@ValenceScreens/components/ObservabilityPage/components/TimeRangeMenu/TimeRangeMenu';
import { describeJobKind } from '@ValenceClient/admin/describeJobKind';
import { ElapsedTime } from '@ValenceScreens/components/ElapsedTime/ElapsedTime';
import { describeLogDay, describeLogTime } from '@ValenceClient/admin/describeLogTime';
import { successRate, toneOfSuccessRate } from '@ValenceScreens/admin/successRate';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { JobKindStats } from '@ValenceContracts/schemas/JobRun';
import type { JobHealthProps } from './JobHealth.types';

const DAY_MS = 86_400_000;

const KEPT_MS = 30 * DAY_MS;

const showRate = (rate: number | null) =>
  rate === null ? (
    '—'
  ) : (
    <AnimatedNumber
      value={Math.floor(rate * 1000) / 10}
      suffix="%"
      format={{ maximumFractionDigits: 1 }}
    />
  );

/**
 * Says how reliable and how quick each kind of job has been over a stretch of time — the service
 * levels an operator holds them to: how often a run ended well, how long the typical run took, how
 * long the slowest did, and when it last ran.
 *
 * A job that fails one run in ten, or has started taking ten times as long as it used to, is found
 * here before anybody notices what it was meant to have done and did not.
 *
 * @param definitions - The jobs the server offers, for naming each kind in words.
 * @param search - What the address says the health is read over.
 * @param onSearchChange - Told each change, to write into the address.
 */
const JobHealth = ({ definitions, search, onSearchChange }: JobHealthProps) => {
  const [anchor] = useAnchoredNow(search.range);

  const sinceMs =
    search.from ??
    logRangeStart(search.range ?? defaultLogView().range, anchor) ??
    anchor - KEPT_MS;
  const asked = useQuery({ ...adminQueries.jobStats(sinceMs), placeholderData: keepPreviousData });
  const kinds = useMemo(() => asked.data?.kinds ?? [], [asked.data]);
  const labels = useMemo(
    () => new Map(definitions.map((definition) => [definition.kind, definition.label])),
    [definitions],
  );

  const totals = kinds.reduce(
    (sum, kind) => ({
      runs: sum.runs + kind.runs,
      completed: sum.completed + kind.completed,
      failed: sum.failed + kind.failed,
      slowest: Math.max(sum.slowest, kind.slowestMs ?? 0),
    }),
    { runs: 0, completed: 0, failed: 0, slowest: 0 },
  );
  const overall = successRate(totals.completed, totals.failed);

  const columns = useMemo<DataTableColumn<JobKindStats>[]>(
    () => [
      {
        id: 'kind',
        header: say('screens.jobHealth.jobHeader'),
        accessorFn: (kind) => describeJobKind(kind.kind, labels),
        cell: ({ row }) => (
          <span className="text-text" title={row.original.kind}>
            {describeJobKind(row.original.kind, labels)}
          </span>
        ),
      },
      {
        id: 'rate',
        header: say('screens.jobHealth.finishedWellHeader'),
        accessorFn: (kind) => successRate(kind.completed, kind.failed) ?? -1,
        cell: ({ row }) => {
          const rate = successRate(row.original.completed, row.original.failed);

          return (
            <Badge size="sm" tone={toneOfSuccessRate(rate)}>
              {showRate(rate)}
            </Badge>
          );
        },
      },
      {
        id: 'runs',
        header: say('screens.jobHealth.runsHeader'),
        accessorFn: (kind) => kind.runs,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">
            <AnimatedNumber value={row.original.runs} />
            {row.original.running > 0 ? (
              <>
                {' ('}
                <AnimatedNumber
                  value={row.original.running}
                  suffix={say('screens.jobHealth.runningSuffix')}
                />
                {')'}
              </>
            ) : null}
          </span>
        ),
      },
      {
        id: 'failed',
        header: say('screens.jobHealth.failedHeader'),
        accessorFn: (kind) => kind.failed,
        cell: ({ row }) => (
          <span
            className={
              row.original.failed > 0 ? 'tabular-nums text-danger' : 'tabular-nums text-text-muted'
            }
          >
            <AnimatedNumber value={row.original.failed} />
          </span>
        ),
      },
      {
        id: 'median',
        header: say('screens.jobHealth.typicalRunHeader'),
        accessorFn: (kind) => kind.medianMs ?? -1,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.medianMs === null ? '—' : <ElapsedTime ms={row.original.medianMs} />}
          </span>
        ),
      },
      {
        id: 'slowest',
        header: say('screens.jobHealth.slowestRunHeader'),
        accessorFn: (kind) => kind.slowestMs ?? -1,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.slowestMs === null ? '—' : <ElapsedTime ms={row.original.slowestMs} />}
          </span>
        ),
      },
      {
        id: 'last',
        header: say('screens.jobHealth.lastRunHeader'),
        accessorFn: (kind) => kind.lastAtMs ?? 0,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.lastAtMs === null
              ? '—'
              : `${describeLogDay(row.original.lastAtMs)}, ${describeLogTime(row.original.lastAtMs)}`}
          </span>
        ),
      },
    ],
    [labels],
  );

  return (
    <div className="flex flex-col gap-6">
      <HeadedSection
        isInset
        title={say('screens.jobHealth.heading')}
        actions={<TimeRangeMenu search={search} onSearchChange={onSearchChange} />}
      >
        <StatStrip
          label={say('screens.jobHealth.overallLabel')}
          items={[
            {
              id: 'runs',
              label: say('screens.jobHealth.runsStat'),
              value: <AnimatedNumber value={totals.runs} />,
            },
            {
              id: 'rate',
              label: say('screens.jobHealth.finishedWellStat'),
              value: showRate(overall),
              isAlarming: overall !== null && overall < 0.9,
              detail: say('screens.jobHealth.finishedWellDetail'),
            },
            {
              id: 'failed',
              label: say('screens.jobHealth.failedStat'),
              value: <AnimatedNumber value={totals.failed} />,
              isAlarming: totals.failed > 0,
            },
            {
              id: 'slowest',
              label: say('screens.jobHealth.slowestRunStat'),
              value: totals.slowest === 0 ? '—' : <ElapsedTime ms={totals.slowest} />,
            },
          ]}
        />
      </HeadedSection>

      <HeadedSection isInset title={say('screens.jobHealth.byKindHeading')}>
        <DataTable
          label={say('screens.jobHealth.byKindLabel')}
          columns={columns}
          rows={kinds}
          getRowId={(kind) => kind.kind}
          page={(search.hpage ?? 1) - 1}
          onPageChange={(next) => {
            onSearchChange({ hpage: next === 0 ? undefined : next + 1 });
          }}
          height="fill"
          pageSize={12}
          emptyMessage={
            asked.isPending ? say('screens.jobHealth.reading') : say('screens.jobHealth.empty')
          }
        />
      </HeadedSection>
    </div>
  );
};

JobHealth.displayName = 'JobHealth';

export { JobHealth };
