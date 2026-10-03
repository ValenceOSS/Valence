import type { LoadReading } from './LoadChart.types';

/**
 * Thins a long run of readings to about as many as a chart can draw, by averaging each stretch of
 * neighbours into one, so a week of readings draws as the shape of the week rather than as every
 * passing spike stacked side by side. Each stretch keeps when it began and the memory it ended on.
 *
 * @param readings - The readings, oldest first.
 * @param most - How many to keep at most.
 * @returns The readings as they should be drawn, oldest first.
 */
const bucketReadings = (readings: readonly LoadReading[], most: number): LoadReading[] => {
  if (readings.length <= most) {
    return [...readings];
  }

  const size = Math.ceil(readings.length / most);
  const kept: LoadReading[] = [];

  for (let from = 0; from < readings.length; from += size) {
    const stretch = readings.slice(from, from + size);
    const first = stretch[0];
    const last = stretch.at(-1);

    if (first === undefined || last === undefined) {
      continue;
    }

    kept.push({
      atMs: first.atMs,
      systemCpuPercent:
        stretch.reduce((sum, reading) => sum + reading.systemCpuPercent, 0) / stretch.length,
      loadAverage: stretch.reduce((sum, reading) => sum + reading.loadAverage, 0) / stretch.length,
      systemMemoryUsedBytes: last.systemMemoryUsedBytes,
      systemMemoryTotalBytes: last.systemMemoryTotalBytes,
      cpuCount: last.cpuCount,
    });
  }

  return kept;
};

export { bucketReadings };
