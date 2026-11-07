import { useDeferredValue, useMemo, useState } from 'react';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { TrendChart } from '@ValenceUI/TrendChart';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeReadingTime } from '@ValenceClient/admin/describeReadingTime';
import { sinceMsForRange } from '@ValenceContracts/schemas/ResourceSample';
import { SpanPicker } from '@ValenceUI/SpanPicker';
import type { ChosenSpan } from '@ValenceUI/SpanPicker.types';
import { LoadFigure } from './components/LoadFigure/LoadFigure';
import { InfoRow } from '@ValenceUI/InfoRow';
import { InfoHeading } from '@ValenceUI/InfoHeading';
import { bucketReadings } from './bucketReadings';
import type { LoadChartProps } from './LoadChart.types';
import { say } from '@ValenceI18n/say';

const GRID_LINES = [0, 25, 50, 75, 100] as const;

const MOST_DRAWN = 120;

const MOST_DRAWN_ACROSS_THE_WEEK = 600;

const MOST_ON_THE_CHART = 240;

const LOAD_COLOUR = 'var(--color-highlight)';

const MEMORY_COLOUR = 'var(--color-success)';

const GRAPHICS_COLOUR = 'var(--color-busy)';

/**
 * How hard the server has been working over the range chosen: where the processor stands now (or
 * last stood), its average and its peak, the load and the memory beside them, and the processor
 * drawn over time against quarter lines, with every reading under the pointer saying when it was
 * taken and what the machine was doing then.
 *
 * Past the last minute, the whole week kept is drawn small beneath the chart, with a window over
 * the part shown. Choosing a range moves the window to the end of the week and the lines move with
 * it rather than being drawn again; the window can then be dragged anywhere in the week, or pulled
 * wider or narrower at either end, and the figures above follow whatever it holds.
 *
 * The week is grouped into readings once, not on every move of the window, and the chart draws no
 * more points than it has room to show; the figures are still worked out from every reading the
 * window holds, so a peak is never averaged away. While the window is dragged it moves at once and
 * the chart follows a moment behind, rather than the drag waiting on every redraw.
 *
 * @param readings - The last minute's readings, or the whole week's, oldest first.
 * @param range - The range chosen, which decides where the window starts and how precisely each
 *   reading is timed.
 */
const LoadChart = ({ readings, range }: LoadChartProps) => {
  const isLive = range === 'minute';
  const drawn = useMemo(
    () => bucketReadings(readings, isLive ? MOST_DRAWN : MOST_DRAWN_ACROSS_THE_WEEK),
    [readings, isLive],
  );
  const weekValues = useMemo(() => drawn.map((reading) => reading.systemCpuPercent), [drawn]);
  const [shownRange, setShownRange] = useState(range);
  const [moved, setMoved] = useState<ChosenSpan | null>(null);
  const [isMorphing, setIsMorphing] = useState(false);

  if (range !== shownRange) {
    setShownRange(range);
    setMoved(null);
    setIsMorphing(true);
  }

  const last = Math.max(drawn.length - 1, 0);
  const startsAt = isLive ? 0 : sinceMsForRange(range, drawn.at(-1)?.atMs ?? 0);
  const span: ChosenSpan =
    moved === null
      ? {
          start: Math.max(
            0,
            drawn.findIndex((reading) => reading.atMs >= startsAt),
          ),
          end: last,
        }
      : { start: Math.min(moved.start, last), end: Math.min(moved.end, last) };
  const shownStart = useDeferredValue(span.start);
  const shownEnd = useDeferredValue(span.end);
  const held = useMemo(
    () => (isLive ? drawn : drawn.slice(shownStart, shownEnd + 1)),
    [drawn, isLive, shownStart, shownEnd],
  );
  const values = held.map((reading) => reading.systemCpuPercent);
  const onChart = useMemo(() => bucketReadings(held, MOST_ON_THE_CHART), [held]);
  const chart = useMemo(
    () => ({
      values: onChart.map((reading) => reading.systemCpuPercent),
      lines: [
        {
          values: onChart.map((reading) =>
            reading.cpuCount === 0
              ? 0
              : Math.min(100, (reading.loadAverage / reading.cpuCount) * 100),
          ),
          colour: LOAD_COLOUR,
        },
        {
          values: onChart.map((reading) =>
            reading.systemMemoryTotalBytes === 0
              ? 0
              : (reading.systemMemoryUsedBytes / reading.systemMemoryTotalBytes) * 100,
          ),
          colour: MEMORY_COLOUR,
        },
        {
          values: onChart.map((reading) => reading.gpuPercent ?? null),
          colour: GRAPHICS_COLOUR,
        },
      ],
    }),
    [onChart],
  );
  const latest = held.at(-1) ?? null;
  const peak = Math.max(0, ...values);
  const average =
    values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

  return (
    <div className="flex h-full flex-1 flex-col gap-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
        <LoadFigure
          label={
            range === 'minute'
              ? say('screens.adminArea.overviewPanel.loadFigures.now')
              : say('screens.adminArea.overviewPanel.loadFigures.latest')
          }
        >
          {latest === null ? (
            '—'
          ) : (
            <FormattedNumber value={Math.round(latest.systemCpuPercent)} suffix="%" />
          )}
        </LoadFigure>

        <LoadFigure label={say('screens.adminArea.overviewPanel.loadFigures.average')}>
          {latest === null ? '—' : <FormattedNumber value={Math.round(average)} suffix="%" />}
        </LoadFigure>

        <LoadFigure label={say('common.peak')} align="center">
          {latest === null ? '—' : <FormattedNumber value={Math.round(peak)} suffix="%" />}
        </LoadFigure>

        <LoadFigure
          label={say('screens.adminArea.overviewPanel.loadFigures.loadAverage')}
          align="end"
        >
          {latest === null ? (
            '—'
          ) : (
            <FormattedNumber
              value={latest.loadAverage}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
            />
          )}
        </LoadFigure>

        <LoadFigure label={say('screens.adminArea.memory')} align="end">
          {latest === null ? '—' : formatBytes(latest.systemMemoryUsedBytes)}
        </LoadFigure>
      </dl>

      <TrendChart
        values={chart.values}
        lines={chart.lines}
        ceiling={100}
        fills
        isAnimated={isMorphing}
        gridLines={GRID_LINES}
        tickOf={(value) => `${value.toString()}%`}
        label={
          range === 'minute'
            ? say('screens.adminArea.overviewPanel.processorUseOverTheLastMinute')
            : say('screens.adminArea.overviewPanel.processorUseOverTheLastLoadRange', {
                loadRange: range,
              })
        }
        tipOf={(index) => {
          const reading = onChart[index];

          return reading === undefined ? null : (
            <>
              <InfoHeading>
                {describeReadingTime(reading.atMs, isLive ? 'minute' : '7d')}
              </InfoHeading>
              <InfoRow label={say('screens.adminArea.processor')}>
                {`${Math.round(reading.systemCpuPercent).toString()}%`}
              </InfoRow>
              <InfoRow label={say('screens.adminArea.overviewPanel.loadFigures.loadAverage')}>
                {reading.loadAverage.toFixed(2)}
              </InfoRow>
              <InfoRow label={say('screens.adminArea.memory')}>
                {say('screens.adminArea.overviewPanel.memoryUsedOfTotal', {
                  used: formatBytes(reading.systemMemoryUsedBytes),
                  total: formatBytes(reading.systemMemoryTotalBytes),
                })}
              </InfoRow>
              {reading.gpuPercent === undefined || reading.gpuPercent === null ? null : (
                <InfoRow label={say('screens.adminArea.graphics')}>
                  {`${Math.round(reading.gpuPercent).toString()}%`}
                </InfoRow>
              )}
            </>
          );
        }}
      />

      {isLive || drawn.length < 2 ? null : (
        <SpanPicker
          values={weekValues}
          ceiling={100}
          span={span}
          onSpanChange={(next) => {
            setIsMorphing(false);
            setMoved(next);
          }}
          label={say('screens.adminArea.overviewPanel.whichPartOfTheWeekIsShown')}
          tickOf={(index) => {
            const reading = drawn[index];

            return reading === undefined ? '' : describeReadingTime(reading.atMs, '7d');
          }}
        />
      )}

      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-text-muted">
        {[
          { label: say('screens.adminArea.processor'), colour: 'text-accent', isDotted: true },
          {
            label: say('screens.adminArea.overviewPanel.loadAgainstCores'),
            colour: 'text-highlight',
            isDotted: true,
          },
          { label: say('screens.adminArea.memory'), colour: 'text-success', isDotted: true },
          { label: say('screens.adminArea.graphics'), colour: 'text-busy', isDotted: true },
        ].map((key) => (
          <li key={key.label} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={
                key.isDotted
                  ? `w-3 border-t-2 border-dotted border-current ${key.colour}`
                  : `h-0.5 w-3 rounded-full bg-current ${key.colour}`
              }
            />
            {key.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

LoadChart.displayName = 'LoadChart';

export { LoadChart };
