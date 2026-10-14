import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { ShareChartProps } from './ShareChart.types';

const SLICE_COLOURS = [
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-highlight)',
  'var(--color-busy)',
  'var(--color-danger)',
  'var(--color-text-muted)',
] as const;

const SLICE_CLASSES = [
  'text-accent',
  'text-success',
  'text-highlight',
  'text-busy',
  'text-danger',
  'text-text-muted',
] as const;

/**
 * How a whole divides between its parts, as a ring with the whole written in its middle and a key
 * beside it naming each part, what it comes to and its share. Parts with nothing in them are left
 * out of the ring but stay in the key, so nothing seems to have gone missing.
 *
 * @param label - What the ring shows, read out in place of it.
 * @param slices - The parts, largest first.
 * @param total - The whole, as written in the middle.
 * @param totalLabel - What the whole is, beneath it.
 * @param emptyMessage - What to say when every part is empty.
 */
const ShareChart = ({ label, slices, total, totalLabel, emptyMessage }: ShareChartProps) => {
  const sum = slices.reduce((all, slice) => all + slice.value, 0);

  if (sum === 0) {
    return <p className="py-6 text-center font-body text-sm text-text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="img" aria-label={label} className="relative mx-auto aspect-square w-full max-w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices.filter((slice) => slice.value > 0).map((slice) => ({ ...slice }))}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              cornerRadius={3}
              stroke="none"
              isAnimationActive={false}
            >
              {slices
                .filter((slice) => slice.value > 0)
                .map((slice) => (
                  <Cell
                    key={slice.id}
                    fill={
                      SLICE_COLOURS[slices.indexOf(slice) % SLICE_COLOURS.length] ??
                      'var(--color-text-muted)'
                    }
                  />
                ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-sans text-lg font-semibold tabular-nums text-text">{total}</span>
          <span className="font-body text-xs text-text-muted">{totalLabel}</span>
        </span>
      </div>

      <ul className="flex max-h-40 flex-col gap-2 overflow-y-auto pr-1 font-body text-sm">
        {slices.map((slice, at) => (
          <li key={slice.id} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className={`size-2 shrink-0 rounded-full bg-current ${SLICE_CLASSES[at % SLICE_CLASSES.length] ?? ''}`}
            />
            <span className="min-w-0 flex-1 truncate text-text">{slice.label}</span>
            <span className="shrink-0 tabular-nums text-text-muted">{slice.shown}</span>
            <span className="w-10 shrink-0 text-right tabular-nums text-text-muted">
              {Math.round((slice.value / sum) * 100).toString()}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

ShareChart.displayName = 'ShareChart';

export { ShareChart };
