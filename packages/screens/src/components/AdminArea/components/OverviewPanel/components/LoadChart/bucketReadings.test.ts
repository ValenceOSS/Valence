import { describe, expect, it } from 'vitest';
import { bucketReadings } from './bucketReadings';
import type { LoadReading } from './LoadChart.types';

const reading = (at: number, cpu: number, memory = 1): LoadReading => ({
  atMs: at,
  systemCpuPercent: cpu,
  loadAverage: cpu / 10,
  systemMemoryUsedBytes: memory,
  systemMemoryTotalBytes: 10,
  cpuCount: 8,
});

describe('bucketReadings', () => {
  it('keeps every reading where there are few enough to draw', () => {
    const few = [reading(0, 10), reading(1, 20)];

    expect(bucketReadings(few, 120)).toEqual(few);
  });

  it('averages each stretch of neighbours into one, keeping when it began', () => {
    const many = [reading(0, 10), reading(1, 30), reading(2, 50), reading(3, 70)];

    expect(bucketReadings(many, 2)).toEqual([
      { ...reading(0, 20), loadAverage: 2 },
      { ...reading(2, 60), loadAverage: 6 },
    ]);
  });

  it('keeps the memory each stretch ended on, rather than an average of it', () => {
    const many = [reading(0, 10, 1), reading(1, 10, 9), reading(2, 10, 2), reading(3, 10, 4)];

    expect(bucketReadings(many, 2).map((one) => one.systemMemoryUsedBytes)).toEqual([9, 4]);
  });

  it('draws no more than it is asked to', () => {
    const many = Array.from({ length: 1000 }, (_, at) => reading(at, at % 100));

    expect(bucketReadings(many, 120).length).toBeLessThanOrEqual(120);
  });
});
