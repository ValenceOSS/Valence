import { BarList } from '@ValenceUI/BarList';
import { StatStrip } from '@ValenceUI/StatStrip';
import { StatTile } from '@ValenceUI/StatTile';
import { TimeBars } from '@ValenceUI/TimeBars';
import { TrendChart } from '@ValenceUI/TrendChart';
import { DataTableDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/DataTableDemo';
import { VirtualGridDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/VirtualGridDemo';
import { VirtualStripDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/VirtualStripDemo';
import type { UiExample } from './UiExample.types';

const HOUR_MS = 3_600_000;

const START_MS = Date.UTC(2026, 8, 30);

const DATA_EXAMPLES: Readonly<Record<string, readonly UiExample[]>> = {
  StatTile: [
    {
      title: 'With a fraction and a trend',
      render: () => (
        <dl className="grid max-w-md gap-3 sm:grid-cols-2">
          <StatTile label="Storage" value="1.2 TB" detail="of 4 TB" fraction={0.3} />
          <StatTile
            label="Plays this week"
            value="148"
            trend={{ direction: 'up', label: '12% up on last week' }}
          />
        </dl>
      ),
    },
  ],
  StatStrip: [
    {
      title: 'A row of numbers',
      render: () => (
        <StatStrip
          label="Jobs"
          items={[
            { id: 'running', label: 'Running', value: '2' },
            { id: 'done', label: 'Completed', value: '1,020' },
            { id: 'failed', label: 'Failed', value: '3', isAlarming: true },
          ]}
        />
      ),
    },
  ],
  BarList: [
    {
      title: 'Ranked values',
      render: () => (
        <BarList
          label="Most watched"
          heading="Title"
          valueHeading="Plays"
          emptyMessage="Nothing watched yet"
          items={[
            { id: 'a', label: 'A Sign of Affection', value: 42 },
            { id: 'b', label: 'Minions & Monsters', value: 28 },
            { id: 'c', label: 'Oppenheimer', value: 11 },
          ]}
        />
      ),
    },
  ],
  TrendChart: [
    {
      title: 'A line over time',
      render: () => (
        <TrendChart
          label="Streams"
          values={[3, 5, 4, 8, 6, 9, 12, 10]}
          ceiling={14}
          caption="Last eight days"
          className="h-32 max-w-md"
        />
      ),
    },
  ],
  TimeBars: [
    {
      title: 'Stacked by hour',
      render: () => (
        <TimeBars
          label="Requests"
          bucketMs={HOUR_MS}
          series={[
            { key: 'ok', label: 'Succeeded', colour: 'var(--color-success)' },
            { key: 'bad', label: 'Failed', colour: 'var(--color-danger)' },
          ]}
          bars={Array.from({ length: 12 }, (_, at) => ({
            atMs: START_MS + at * HOUR_MS,
            values: { ok: 4 + ((at * 7) % 9), bad: at % 4 === 0 ? 2 : 0 },
          }))}
          formatTick={(atMs) => new Date(atMs).getUTCHours().toString()}
          hasLegend
          className="h-40"
        />
      ),
    },
  ],
  DataTable: [
    {
      title: 'Sortable films',
      render: () => <DataTableDemo />,
    },
  ],
  VirtualGrid: [
    {
      title: 'A hundred cards, drawn as scrolled',
      render: () => <VirtualGridDemo />,
    },
  ],
  VirtualStrip: [
    {
      title: 'A thousand lines, drawn as scrolled',
      render: () => <VirtualStripDemo />,
    },
  ],
};

export { DATA_EXAMPLES };
