import { memo } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import type { SpanStripProps } from './SpanStrip.types';

/**
 * Every reading drawn small and filled, behind the window a span picker moves over. Drawn again
 * only when the readings or their scale change, never as the window is dragged across it.
 *
 * @param values - Every reading, oldest first.
 * @param ceiling - The top of the scale they are drawn against.
 */
const drawStrip = ({ values, ceiling }: SpanStripProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={values.map((value, at) => ({ at, value }))}
        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
      >
        <YAxis hide domain={[0, Math.max(ceiling, 1)]} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="none"
          fill="var(--color-text-muted)"
          fillOpacity={0.3}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const SpanStrip = memo(drawStrip);

SpanStrip.displayName = 'SpanStrip';

export { SpanStrip };
