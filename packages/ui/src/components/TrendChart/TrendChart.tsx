import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { cn } from '@ValenceUI/cn';
import type { TrendChartProps } from './TrendChart.types';
import { say } from '@ValenceI18n/say';

/**
 * Turns a list of readings into the row-per-reading shape the charting library expects, since it
 * takes objects rather than numbers.
 *
 * @param values - The readings, oldest first.
 * @returns One row per reading.
 */
const toRows = (values: number[]): { at: number; value: number }[] =>
  values.map((value, at) => ({ at, value }));

/**
 * Draws one reading over time as a filled line, for figures that only mean something in motion —
 * throughput, sessions, cache size. The ceiling is given rather than taken from the data, so a
 * chart does not rescale itself every time a reading arrives and make a flat line look dramatic.
 *
 * @param values - The readings, oldest first.
 * @param ceiling - The top of the scale.
 * @param label - What is being measured, read out to anybody who cannot see the chart.
 * @param caption - A line beneath it, such as the period covered.
 * @param tipOf - What to say about the reading under the pointer, by its place in the list. Without
 *   it the tip says only the reading itself.
 * @param gridLines - Readings to draw a faint line across the chart at, such as each quarter of a
 *   percentage, so a height can be read against something.
 * @param tickOf - How to write a grid line's reading at the chart's edge.
 * @param isTall - Whether to draw it tall, for a chart that is the point of its card.
 * @param className - Extra classes for the caller's own layout.
 */
const TrendChart = ({
  values,
  ceiling,
  label,
  caption,
  tipOf,
  gridLines,
  tickOf,
  isTall = false,
  className,
}: TrendChartProps) => {
  const fillId = useId();

  if (values.length === 0) {
    return (
      <div className={cn('flex h-20 items-center', className)}>
        <p className="font-body text-xs text-text-muted">
          {say('ui.trendChart.nothingMeasuredYet')}
        </p>
      </div>
    );
  }

  return (
    <figure className={cn('flex flex-col gap-1.5', className)}>
      <div role="img" aria-label={label} className={cn('w-full', isTall ? 'h-44' : 'h-24')}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={toRows(values)} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>

            {gridLines === undefined ? null : (
              <CartesianGrid
                horizontal
                vertical={false}
                horizontalValues={[...gridLines]}
                stroke="var(--surface-line)"
                strokeDasharray="3 4"
              />
            )}

            <YAxis
              hide={gridLines === undefined}
              orientation="right"
              domain={[0, Math.max(ceiling, 1)]}
              {...(gridLines === undefined ? {} : { ticks: [...gridLines] })}
              {...(tickOf === undefined ? {} : { tickFormatter: tickOf })}
              axisLine={false}
              tickLine={false}
              width={36}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            />

            <Tooltip
              cursor={{ stroke: 'var(--surface-divider)', strokeWidth: 1 }}
              {...(tipOf === undefined
                ? {}
                : {
                    content: ({ active, activeIndex }) =>
                      active === true &&
                      activeIndex !== undefined &&
                      activeIndex !== null &&
                      Number.isFinite(Number(activeIndex)) ? (
                        <div className="valence-menu flex min-w-48 flex-col rounded-lg p-1 text-[0.8125rem] font-medium text-text">
                          {tipOf(Number(activeIndex))}
                        </div>
                      ) : null,
                  })}
              contentStyle={{
                background: 'var(--color-text)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-surface)',
                fontSize: '0.75rem',
                fontWeight: 500,
                padding: '0.25rem 0.5rem',
              }}
              itemStyle={{ color: 'var(--color-surface)' }}
              labelFormatter={() => ''}
              formatter={(value) => [typeof value === 'number' ? Math.round(value) : '', '']}
              separator=""
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent)"
              strokeWidth={2}
              fill={`url(#${fillId})`}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: 'var(--color-accent)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {caption === undefined ? null : (
        <figcaption className="font-body text-xs text-text-muted">{caption}</figcaption>
      )}
    </figure>
  );
};

TrendChart.displayName = 'TrendChart';

export { TrendChart };
