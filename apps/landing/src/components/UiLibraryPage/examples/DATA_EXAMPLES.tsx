import { SelectionBar } from '@ValenceUI/SelectionBar';
import { Button } from '@ValenceUI/Button';
import { BarList } from '@ValenceUI/BarList';
import { DataTable } from '@ValenceUI/DataTable';
import { ShareChart } from '@ValenceUI/ShareChart';
import { SharedTimeline } from '@ValenceUI/SharedTimeline';
import { SpanPicker } from '@ValenceUI/SpanPicker';
import { StatStrip } from '@ValenceUI/StatStrip';
import { StatTile } from '@ValenceUI/StatTile';
import { TimeBars } from '@ValenceUI/TimeBars';
import { TrendChart } from '@ValenceUI/TrendChart';
import { DataTableDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/DataTableDemo';
import { VirtualGridDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/VirtualGridDemo';
import { VirtualStackDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/VirtualStackDemo';
import { VirtualStripDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/VirtualStripDemo';
import type { UiExample } from './UiExample.types';

const HOUR_MS = 3_600_000;

const ENTRIES = Array.from({ length: 30 }, (_, at) => ({
  id: `entry-${(at + 1).toString()}`,
  what: `Signed in from device ${(at + 1).toString()}`,
}));

/**
 * The initial of somebody on a shared timeline, in a small round face.
 *
 * @param initial - Their initial.
 * @returns The face.
 */
const faceOf = (initial: string) => (
  <span className="flex size-6 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[0.6875rem] font-semibold text-text">
    {initial}
  </span>
);

const START_MS = Date.UTC(2026, 8, 30);

const DATA_EXAMPLES: Readonly<Record<string, readonly UiExample[]>> = {
  SpanPicker: [
    {
      title: 'A stretch of a week',
      render: () => (
        <SpanPicker
          label="Server load"
          values={[12, 18, 9, 30, 44, 38, 22, 16, 27, 35, 41, 20]}
          ceiling={50}
          span={{ start: 3, end: 8 }}
          onSpanChange={() => undefined}
        />
      ),
    },
  ],
  StatTile: [
    {
      title: 'With a fraction and a trend',
      render: () => (
        <div className="grid max-w-md gap-3 sm:grid-cols-2">
          <StatTile label="Storage" value="1.2 TB" detail="of 4 TB" fraction={0.3} />
          <StatTile
            label="Plays this week"
            value="148"
            trend={{ direction: 'up', label: '12% up on last week' }}
          />
        </div>
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
    {
      title: 'More to read, and no total yet',
      render: () => (
        <div className="w-full">
          <DataTable
            label="Sign-ins"
            columns={[{ id: 'what', header: 'What happened', accessorFn: (entry) => entry.what }]}
            rows={ENTRIES}
            getRowId={(entry) => entry.id}
            pageSize={10}
            hasMoreRows
          />
        </div>
      ),
    },
  ],
  SelectionBar: [
    {
      title: 'What can be done to the rows ticked',
      render: () => (
        <SelectionBar
          count={3}
          total={1240}
          onSelectAll={() => undefined}
          onClear={() => undefined}
        >
          <Button variant="secondary" size="xs">
            Edit
          </Button>
          <Button variant="secondary" size="xs">
            Refresh
          </Button>
        </SelectionBar>
      ),
    },
  ],
  ShareChart: [
    {
      title: 'How something splits',
      render: () => (
        <ShareChart
          label="How titles were played"
          totalLabel="Plays"
          total="412"
          emptyMessage="Nothing has been played yet."
          slices={[
            { id: 'direct', label: 'Played as-is', value: 280, shown: '280' },
            { id: 'stream', label: 'Remuxed', value: 92, shown: '92' },
            { id: 'transcode', label: 'Transcoded', value: 40, shown: '40' },
          ]}
        />
      ),
    },
  ],
  SharedTimeline: [
    {
      title: 'Three people watching together',
      render: () => (
        <SharedTimeline
          label="Watch party"
          className="w-full max-w-md"
          durationSeconds={6600}
          filledSeconds={4200}
          inSyncSeconds={3000}
          elapsed="50:00"
          total="1:50:00"
          people={[
            { id: 'a', atSeconds: 3000, label: 'Sam', face: faceOf('S') },
            { id: 'b', atSeconds: 2980, label: 'Alex', face: faceOf('A') },
            { id: 'c', atSeconds: 2400, label: 'Jo', face: faceOf('J') },
          ]}
        />
      ),
    },
  ],
  VirtualGrid: [
    {
      title: 'A hundred cards, drawn as scrolled',
      render: () => <VirtualGridDemo />,
    },
  ],
  VirtualStack: [
    {
      title: 'Sixty blocks of differing heights, drawn as scrolled',
      render: () => <VirtualStackDemo />,
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
