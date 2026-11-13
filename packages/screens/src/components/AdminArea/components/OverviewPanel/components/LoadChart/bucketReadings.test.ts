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
    const unknown = {
      gpuPercent: null,
      networkReceivedBytesPerSecond: null,
      networkSentBytesPerSecond: null,
      streamedBytesPerSecond: null,
    };

    expect(bucketReadings(many, 2)).toEqual([
      { ...reading(0, 20), loadAverage: 2, ...unknown },
      { ...reading(2, 60), loadAverage: 6, ...unknown },
    ]);
  });

  it('averages the network a stretch moved, leaving out readings that could not say', () => {
    const many = [
      { ...reading(0, 10), networkReceivedBytesPerSecond: 100, networkSentBytesPerSecond: 1_000 },
      { ...reading(1, 10), networkReceivedBytesPerSecond: null, networkSentBytesPerSecond: null },
      { ...reading(2, 10), networkReceivedBytesPerSecond: 300, networkSentBytesPerSecond: 3_000 },
      { ...reading(3, 10), networkReceivedBytesPerSecond: 500, networkSentBytesPerSecond: 5_000 },
    ];
    const drawn = bucketReadings(many, 2);

    expect(drawn.map((one) => one.networkReceivedBytesPerSecond)).toEqual([100, 400]);
    expect(drawn.map((one) => one.networkSentBytesPerSecond)).toEqual([1_000, 4_000]);
    expect(drawn.map((one) => one.streamedBytesPerSecond)).toEqual([null, null]);
  });

  it('averages the graphics figures a stretch has, leaving out readings without one', () => {
    const many = [
      { ...reading(0, 10), gpuPercent: 20 },
      { ...reading(1, 10), gpuPercent: null },
      { ...reading(2, 10), gpuPercent: 40 },
      { ...reading(3, 10), gpuPercent: 60 },
    ];

    expect(bucketReadings(many, 2).map((one) => one.gpuPercent)).toEqual([20, 50]);
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
