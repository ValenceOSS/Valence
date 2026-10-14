import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { TrendChart } from '@ValenceUI/TrendChart';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeReadingTime } from '@ValenceClient/admin/describeReadingTime';
import { LoadFigure } from './components/LoadFigure/LoadFigure';
import { InfoRow } from '@ValenceUI/InfoRow';
import { InfoHeading } from '@ValenceUI/InfoHeading';
import { bucketReadings } from './bucketReadings';
import type { LoadChartProps } from './LoadChart.types';
import { say } from '@ValenceI18n/say';

const GRID_LINES = [0, 25, 50, 75, 100] as const;

const MOST_DRAWN = 120;

const LOAD_COLOUR = 'var(--color-highlight)';

const MEMORY_COLOUR = 'var(--color-success)';

const GRAPHICS_COLOUR = 'var(--color-busy)';

/**
 * How hard the server has been working over the range chosen: where the processor stands now (or
 * last stood), its average and its peak, the load and the memory beside them, and the processor
 * drawn over time against quarter lines, with every reading under the pointer saying when it was
 * taken and what the machine was doing then.
 *
 * @param readings - The readings in the range, oldest first.
 * @param range - The range they cover, which decides how precisely each is timed.
 */
const LoadChart = ({ readings, range }: LoadChartProps) => {
  const values = readings.map((reading) => reading.systemCpuPercent);
  const latest = readings.at(-1) ?? null;
  const peak = Math.max(0, ...values);
  const average =
    values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
  const drawn = bucketReadings(readings, MOST_DRAWN);

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
        values={drawn.map((reading) => reading.systemCpuPercent)}
        lines={[
          {
            values: drawn.map((reading) =>
              reading.cpuCount === 0
                ? 0
                : Math.min(100, (reading.loadAverage / reading.cpuCount) * 100),
            ),
            colour: LOAD_COLOUR,
          },
          {
            values: drawn.map((reading) =>
              reading.systemMemoryTotalBytes === 0
                ? 0
                : (reading.systemMemoryUsedBytes / reading.systemMemoryTotalBytes) * 100,
            ),
            colour: MEMORY_COLOUR,
          },
          {
            values: drawn.map((reading) => reading.gpuPercent ?? null),
            colour: GRAPHICS_COLOUR,
          },
        ]}
        ceiling={100}
        fills
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
          const reading = drawn[index];

          return reading === undefined ? null : (
            <>
              <InfoHeading>{describeReadingTime(reading.atMs, range)}</InfoHeading>
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
