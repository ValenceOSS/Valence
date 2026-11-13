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
import { InfoNote } from '@ValenceUI/InfoNote';
import { shareOfPeak } from './shareOfPeak';
import { rateOf } from './rateOf';
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

const INBOUND_COLOUR = 'var(--color-inbound)';

const OUTBOUND_COLOUR = 'var(--color-outbound)';

/**
 * How hard the server has been working over the range chosen: where the processor stands now (or
 * last stood), its average and its peak, the load and the memory beside them, and the processor
 * drawn over time against quarter lines, with every reading under the pointer saying when it was
 * taken and what the machine was doing then. The key to its lines is in that tooltip, each line drawn
 * in its own colour beside its figure, and the load as a share of the cores the line is drawn at; a
 * list of the lines stays for anybody who cannot see the chart. The network has no ceiling to be a
 * share of, so its two lines are drawn against the busiest moment shown, which the tooltip names.
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
  const networkPeak = useMemo(
    () =>
      Math.max(
        0,
        ...onChart.flatMap((reading) =>
          [reading.networkReceivedBytesPerSecond, reading.networkSentBytesPerSecond].flatMap(
            (rate) => (rate === undefined || rate === null ? [] : [rate]),
          ),
        ),
      ),
    [onChart],
  );
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
        {
          values: onChart.map((reading) =>
            shareOfPeak(reading.networkReceivedBytesPerSecond, networkPeak),
          ),
          colour: INBOUND_COLOUR,
        },
        {
          values: onChart.map((reading) =>
            shareOfPeak(reading.networkSentBytesPerSecond, networkPeak),
          ),
          colour: OUTBOUND_COLOUR,
        },
      ],
    }),
    [onChart, networkPeak],
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
              <InfoRow label={say('screens.adminArea.processor')} keyClassName="text-accent">
                {`${Math.round(reading.systemCpuPercent).toString()}%`}
              </InfoRow>
              <InfoRow
                label={say('screens.adminArea.overviewPanel.loadFigures.loadAverage')}
                keyClassName="text-highlight"
              >
                {say('screens.adminArea.overviewPanel.loadOfTheCores', {
                  load: reading.loadAverage.toFixed(2),
                  share: `${Math.round(reading.cpuCount === 0 ? 0 : Math.min(100, (reading.loadAverage / reading.cpuCount) * 100)).toString()}%`,
                })}
              </InfoRow>
              <InfoRow label={say('screens.adminArea.memory')} keyClassName="text-success">
                {say('screens.adminArea.overviewPanel.memoryUsedOfTotal', {
                  used: formatBytes(reading.systemMemoryUsedBytes),
                  total: formatBytes(reading.systemMemoryTotalBytes),
                })}
              </InfoRow>
              {reading.gpuPercent === undefined || reading.gpuPercent === null ? null : (
                <InfoRow label={say('screens.adminArea.graphics')} keyClassName="text-busy">
                  {`${Math.round(reading.gpuPercent).toString()}%`}
                </InfoRow>
              )}
              <InfoRow
                label={say('screens.adminArea.overviewPanel.networkIn')}
                keyClassName="text-inbound"
              >
                {rateOf(reading.networkReceivedBytesPerSecond)}
              </InfoRow>
              <InfoRow
                label={say('screens.adminArea.overviewPanel.networkOut')}
                keyClassName="text-outbound"
              >
                {rateOf(reading.networkSentBytesPerSecond)}
              </InfoRow>
              <InfoRow label={say('screens.adminArea.networkFigure.streamingToViewers')}>
                {rateOf(reading.streamedBytesPerSecond)}
              </InfoRow>
              {networkPeak === 0 ? null : (
                <InfoNote>
                  {say('screens.adminArea.overviewPanel.networkDrawnAgainstItsPeak', {
                    peak: rateOf(networkPeak),
                  })}
                </InfoNote>
              )}
            </>
          );
        }}
      />

      <ul className="sr-only">
        {[
          say('screens.adminArea.processor'),
          say('screens.adminArea.overviewPanel.loadFigures.loadAverage'),
          say('screens.adminArea.memory'),
          say('screens.adminArea.graphics'),
          say('screens.adminArea.overviewPanel.networkIn'),
          say('screens.adminArea.overviewPanel.networkOut'),
        ].map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

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
    </div>
  );
};

LoadChart.displayName = 'LoadChart';

export { LoadChart };
