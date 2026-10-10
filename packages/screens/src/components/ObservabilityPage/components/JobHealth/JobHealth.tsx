import { sayAgain } from '@ValenceI18n/sayAgain';
import { useMemo, useState } from 'react';
import { FilterSplit } from '@ValenceUI/FilterSplit';
import { ScopedField } from '@ValenceUI/ScopedField';
import type { FilterGroup } from '@ValenceUI/FilterMenu.types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { Well } from '@ValenceUI/Well';
import { JobRunMix } from '@ValenceScreens/components/ObservabilityPage/components/JobRunMix/JobRunMix';
import { useAnchoredNow } from '@ValenceScreens/admin/useAnchoredNow';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { defaultLogView } from '@ValenceClient/admin/defaultLogView';
import { logRangeStart } from '@ValenceClient/admin/logRanges';
import { timeRangeChoice } from '@ValenceScreens/components/ObservabilityPage/components/TimeRangeMenu/timeRangeChoice';
import { describeJobKind } from '@ValenceClient/admin/describeJobKind';
import { ElapsedTime } from '@ValenceScreens/components/ElapsedTime/ElapsedTime';
import { describeLogDay, describeLogTime } from '@ValenceClient/admin/describeLogTime';
import { successRate, toneOfSuccessRate } from '@ValenceScreens/admin/successRate';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { JobKindStats } from '@ValenceContracts/schemas/JobRun';
import type { JobHealthProps } from './JobHealth.types';
import { say } from '@ValenceI18n/say';

const DAY_MS = 86_400_000;

const KEPT_MS = 30 * DAY_MS;

const showRate = (rate: number | null) =>
  rate === null ? (
    '—'
  ) : (
    <FormattedNumber
      value={Math.floor(rate * 1000) / 10}
      suffix="%"
      format={{ maximumFractionDigits: 1 }}
    />
  );

const FILTERS: FilterGroup[] = [
  {
    name: say('common.status'),
    isSingle: true,
    options: [
      { id: 'state:failed', label: say('screens.observabilityPage.jobHealth.hasFailed') },
      { id: 'state:clean', label: say('screens.observabilityPage.jobHealth.neverFailed') },
    ],
  },
];

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
  const [typed, setTyped] = useState('');
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const labels = useMemo(
    () => new Map(definitions.map((definition) => [definition.kind, sayAgain(definition.label)])),
    [definitions],
  );

  const shown = useMemo(() => {
    const words = typed.trim().toLowerCase();

    return kinds.filter(
      (kind) =>
        (words === '' || describeJobKind(kind.kind, labels).toLowerCase().includes(words)) &&
        (!chosen.has('state:failed') || kind.failed > 0) &&
        (!chosen.has('state:clean') || kind.failed === 0),
    );
  }, [kinds, typed, chosen, labels]);

  const totals = kinds.reduce(
    (sum, kind) => ({
      runs: sum.runs + kind.runs,
      completed: sum.completed + kind.completed,
      failed: sum.failed + kind.failed,
      slowest: Math.max(sum.slowest, kind.slowestMs ?? 0),
    }),
    { runs: 0, completed: 0, failed: 0, slowest: 0 },
  );

  const columns = useMemo<DataTableColumn<JobKindStats>[]>(
    () => [
      {
        id: 'kind',
        header: say('common.job'),
        accessorFn: (kind) => describeJobKind(kind.kind, labels),
        cell: ({ row }) => (
          <span className="text-text" title={row.original.kind}>
            {describeJobKind(row.original.kind, labels)}
          </span>
        ),
      },
      {
        id: 'rate',
        header: say('screens.observabilityPage.jobHealth.finishedWell'),
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
        header: say('screens.observabilityPage.jobHealth.runs'),
        accessorFn: (kind) => kind.runs,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">
            <FormattedNumber value={row.original.runs} />
            {row.original.running > 0 ? (
              <>
                {' ('}
                <FormattedNumber value={row.original.running} suffix=" running" />
                {')'}
              </>
            ) : null}
          </span>
        ),
      },
      {
        id: 'failed',
        header: say('common.failed'),
        accessorFn: (kind) => kind.failed,
        cell: ({ row }) => (
          <span
            className={
              row.original.failed > 0 ? 'tabular-nums text-danger' : 'tabular-nums text-text-muted'
            }
          >
            <FormattedNumber value={row.original.failed} />
          </span>
        ),
      },
      {
        id: 'median',
        header: say('screens.observabilityPage.jobHealth.typicalRun'),
        accessorFn: (kind) => kind.medianMs ?? -1,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.medianMs === null ? '—' : <ElapsedTime ms={row.original.medianMs} />}
          </span>
        ),
      },
      {
        id: 'slowest',
        header: say('screens.observabilityPage.jobHealth.slowestRun'),
        accessorFn: (kind) => kind.slowestMs ?? -1,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.slowestMs === null ? '—' : <ElapsedTime ms={row.original.slowestMs} />}
          </span>
        ),
      },
      {
        id: 'last',
        header: say('screens.observabilityPage.jobHealth.lastRun'),
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ScopedField
          label={say('screens.observabilityPage.jobHealth.findAKindOfJob')}
          isLabelHidden
          placeholder={say('screens.observabilityPage.jobHealth.searchByJob')}
          value={typed}
          onValueChange={setTyped}
          choices={[timeRangeChoice(search, onSearchChange)]}
          className="min-w-56 flex-1"
        />

        <FilterSplit
          label={say('screens.observabilityPage.jobHealth.filterTheKinds')}
          groups={FILTERS}
          selected={chosen}
          onChange={setChosen}
        />
      </div>

      <Well>
        <JobRunMix
          completed={totals.completed}
          failed={totals.failed}
          stopped={Math.max(0, totals.runs - totals.completed - totals.failed)}
          extra={{
            label: say('screens.observabilityPage.jobHealth.slowestRun'),
            value: totals.slowest === 0 ? '—' : <ElapsedTime ms={totals.slowest} />,
          }}
        />
      </Well>

      <DataTable
        className="m-0"
        label={say('screens.observabilityPage.jobHealth.howEachKindOfJobHas')}
        columns={columns}
        rows={shown}
        getRowId={(kind) => kind.kind}
        page={(search.hpage ?? 1) - 1}
        onPageChange={(next) => {
          onSearchChange({ hpage: next === 0 ? undefined : next + 1 });
        }}
        height="fill"
        pageSize={12}
        emptyMessage={
          asked.isPending
            ? say('screens.observabilityPage.jobHealth.readingHowTheJobsHaveGone')
            : say('screens.observabilityPage.jobHealth.noJobHasRunInThis')
        }
      />
    </div>
  );
};

JobHealth.displayName = 'JobHealth';

export { JobHealth };
