import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronDown as ChevronDownIcon, Clock as ClockIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { StatStrip } from '@ValenceUI/StatStrip';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { describeElapsed } from '@ValenceClient/admin/describeElapsed';
import { describeLogDay, describeLogTime } from '@ValenceClient/admin/describeLogTime';
import { successRate, toneOfSuccessRate } from '@ValenceScreens/admin/successRate';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { JobKindStats } from '@ValenceContracts/schemas/JobRun';
import type { JobHealthProps } from './JobHealth.types';

const DAY_MS = 86_400_000;

const WINDOWS = [
  { id: '1', label: 'Last 24 hours', ms: DAY_MS },
  { id: '7', label: 'Last 7 days', ms: 7 * DAY_MS },
  { id: '30', label: 'Last 30 days', ms: 30 * DAY_MS },
] as const;

const describeRate = (rate: number | null): string =>
  rate === null ? '—' : `${(Math.floor(rate * 1000) / 10).toString()}%`;

/**
 * Says how reliable and how quick each kind of job has been over a stretch of time — the service
 * levels an operator holds them to: how often a run ended well, how long the typical run took, how
 * long the slowest did, and when it last ran.
 *
 * A job that fails one run in ten, or has started taking ten times as long as it used to, is found
 * here before anybody notices what it was meant to have done and did not.
 *
 * @param definitions - The jobs the server offers, for naming each kind in words.
 */
const JobHealth = ({ definitions }: JobHealthProps) => {
  const [period, setPeriod] = useState<(typeof WINDOWS)[number]['id']>('7');
  const [anchor] = useState(() => Date.now());
  const sinceMs = anchor - (WINDOWS.find((one) => one.id === period)?.ms ?? DAY_MS);
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
        header: 'Job',
        accessorFn: (kind) => labels.get(kind.kind) ?? kind.kind,
        cell: ({ row }) => (
          <span className="flex flex-col">
            <span className="text-text">{labels.get(row.original.kind) ?? row.original.kind}</span>
            <span className="text-xs text-text-muted">{row.original.kind}</span>
          </span>
        ),
      },
      {
        id: 'rate',
        header: 'Finished well',
        accessorFn: (kind) => successRate(kind.completed, kind.failed) ?? -1,
        cell: ({ row }) => {
          const rate = successRate(row.original.completed, row.original.failed);

          return (
            <Badge size="sm" tone={toneOfSuccessRate(rate)}>
              {describeRate(rate)}
            </Badge>
          );
        },
      },
      {
        id: 'runs',
        header: 'Runs',
        accessorFn: (kind) => kind.runs,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">
            {row.original.runs.toLocaleString()}
            {row.original.running > 0 ? ` (${row.original.running.toString()} running)` : ''}
          </span>
        ),
      },
      {
        id: 'failed',
        header: 'Failed',
        accessorFn: (kind) => kind.failed,
        cell: ({ row }) => (
          <span
            className={
              row.original.failed > 0 ? 'tabular-nums text-danger' : 'tabular-nums text-text-muted'
            }
          >
            {row.original.failed.toLocaleString()}
          </span>
        ),
      },
      {
        id: 'median',
        header: 'Typical run',
        accessorFn: (kind) => kind.medianMs ?? -1,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.medianMs === null ? '—' : describeElapsed(row.original.medianMs)}
          </span>
        ),
      },
      {
        id: 'slowest',
        header: 'Slowest run',
        accessorFn: (kind) => kind.slowestMs ?? -1,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.slowestMs === null ? '—' : describeElapsed(row.original.slowestMs)}
          </span>
        ),
      },
      {
        id: 'last',
        header: 'Last run',
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
        title="How the jobs are doing"
        actions={
          <OptionMenu
            label="Period"
            triggerShape="field"
            className="w-auto"
            groups={[
              {
                name: 'Period',
                selectedId: period,
                onSelect: (id) => {
                  const found = WINDOWS.find((one) => one.id === id);

                  if (found !== undefined) {
                    setPeriod(found.id);
                  }
                },
                options: WINDOWS.map((one) => ({ id: one.id, label: one.label })),
              },
            ]}
            trigger={
              <>
                <Icon of={ClockIcon} size={15} className="shrink-0" />
                <span className="truncate">{WINDOWS.find((one) => one.id === period)?.label}</span>
                <Icon of={ChevronDownIcon} size={14} className="shrink-0" />
              </>
            }
          />
        }
      >
        <StatStrip
          label="How the jobs are doing overall"
          items={[
            { id: 'runs', label: 'Runs', value: totals.runs.toLocaleString() },
            {
              id: 'rate',
              label: 'Finished well',
              value: describeRate(overall),
              isAlarming: overall !== null && overall < 0.9,
              detail: 'Of the runs that have ended',
            },
            {
              id: 'failed',
              label: 'Failed',
              value: totals.failed.toLocaleString(),
              isAlarming: totals.failed > 0,
            },
            {
              id: 'slowest',
              label: 'Slowest run',
              value: totals.slowest === 0 ? '—' : describeElapsed(totals.slowest),
            },
          ]}
        />
      </HeadedSection>

      <HeadedSection title="By kind of job">
        <DataTable
          label="How each kind of job has gone"
          columns={columns}
          rows={kinds}
          getRowId={(kind) => kind.kind}
          height="fill"
          pageSize={12}
          emptyMessage={
            asked.isPending ? 'Reading how the jobs have gone…' : 'No job has run in this time.'
          }
        />
      </HeadedSection>
    </div>
  );
};

JobHealth.displayName = 'JobHealth';

export { JobHealth };
