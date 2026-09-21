import { LogLevelSchema } from '@ValenceContracts/schemas/Log';
import type { LogHistogramBucket } from '@ValenceContracts/schemas/Log';

/**
 * Lays counted rows out as a run of bars, one for every stretch of time between the first and the
 * end, including the stretches in which nothing happened, so that a quiet spell shows as a gap
 * rather than being squeezed out of the graph.
 *
 * @param rows - How many events there were at each level in each bar, keyed by the bar's index.
 * @param window - Where the graph starts, where it ends and how wide a bar is.
 * @returns The bars, earliest first.
 */
const binHistogram = (
  rows: readonly { bucket: number; level: string; events: number }[],
  window: { fromMs: number; untilMs: number; bucketMs: number },
): LogHistogramBucket[] => {
  const length = Math.max(1, Math.ceil((window.untilMs - window.fromMs) / window.bucketMs));
  const first = Math.floor(window.fromMs / window.bucketMs);
  const bars: LogHistogramBucket[] = Array.from({ length }, (_, at) => ({
    atMs: window.fromMs + at * window.bucketMs,
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
  }));

  for (const row of rows) {
    const bar = bars[row.bucket - first];
    const level = LogLevelSchema.safeParse(row.level);

    if (bar !== undefined && level.success) {
      bar[level.data] += row.events;
    }
  }

  return bars;
};

export { binHistogram };
